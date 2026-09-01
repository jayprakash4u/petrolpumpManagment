import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { getTenantDb } from "@/lib/tenant-db";

const SESSION_COOKIE = "fsm_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours — one shift
const encodedSecret = new TextEncoder().encode(env.SESSION_SECRET);

interface SessionJWTPayload {
  sid: string; // Session.id in tenant database
  slug: string; // Station slug identifying the dedicated tenant database
}

async function signSessionToken(sid: string, slug: string): Promise<string> {
  return new SignJWT({ sid, slug } satisfies SessionJWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + SESSION_TTL_MS) / 1000))
    .sign(encodedSecret);
}

async function verifySessionToken(token: string): Promise<{ sid: string; slug: string } | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret, { algorithms: ["HS256"] });
    const p = payload as Partial<SessionJWTPayload>;
    if (typeof p.sid === "string" && typeof p.slug === "string") {
      return { sid: p.sid, slug: p.slug };
    }
    // Backward compatibility for tokens without slug (defaults to shree-petroleum)
    if (typeof p.sid === "string") {
      return { sid: p.sid, slug: "shree-petroleum" };
    }
    return null;
  } catch {
    return null;
  }
}

/** Creates a DB-backed session row in the station's dedicated database and sets the signed httpOnly cookie. */
export async function createSession(userId: string, slug: string, meta: { userAgent?: string; ipAddress?: string }) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const tenantDb = await getTenantDb(slug);

  const session = await tenantDb.session.create({
    data: { userId, expiresAt, userAgent: meta.userAgent, ipAddress: meta.ipAddress },
  });

  const token = await signSessionToken(session.id, slug);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

/**
 * Reads the cookie, verifies the JWT signature, and checks the tenant database row.
 * Returns the authenticated user and tenantSlug, or null.
 */
export async function readSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const verified = await verifySessionToken(token);
  if (!verified) return null;

  try {
    const tenantDb = await getTenantDb(verified.slug);
    const session = await tenantDb.session.findUnique({
      where: { id: verified.sid },
      include: { user: { include: { station: { select: { name: true, address: true, suspendedAt: true } } } } },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
    if (!session.user.active) return null;
    if (session.user.station.suspendedAt !== null) return null;

    // Attach logoUrl safely from database if available
    let logoUrl: string | null = null;
    try {
      const rows: any[] = await tenantDb.$queryRawUnsafe(
        `SELECT TOP 1 [logoUrl] FROM [dbo].[Station] WHERE [slug] = '${verified.slug.replace(/'/g, "''")}'`
      );
      if (rows && rows.length > 0) {
        const row = rows[0];
        logoUrl = row.logoUrl ?? row.LOGOURL ?? row.logourl ?? Object.values(row)[0] ?? null;
      }
    } catch {}
    (session.user.station as any).logoUrl = logoUrl;

    return {
      sessionId: session.id,
      sessionCreatedAt: session.createdAt,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      user: session.user as typeof session.user & { station: { name: string; address: string; suspendedAt: Date | null; logoUrl: string | null } },
      tenantSlug: verified.slug,
    };
  } catch (err) {
    console.error("readSession error:", err);
    return null;
  }
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  store.delete(SESSION_COOKIE);
  if (!token) return;

  const verified = await verifySessionToken(token);
  if (!verified) return;

  try {
    const tenantDb = await getTenantDb(verified.slug);
    await tenantDb.session.updateMany({
      where: { id: verified.sid, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch (err) {
    console.error("destroySession error:", err);
  }
}

/** Optimistic, cookie-only check for use in proxy.ts — no DB round trip, must not be trusted for authorization. */
export async function hasSessionCookieOptimistic(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return (await verifySessionToken(token)) !== null;
}

export { SESSION_COOKIE };
