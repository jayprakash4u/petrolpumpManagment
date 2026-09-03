import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { getMasterDb } from "@/lib/tenant-db";

/**
 * Session handling for the *platform* plane — the operators who run this
 * SaaS, not the staff who run a petrol pump.
 *
 * Mirrors src/lib/session.ts deliberately rather than sharing with it. The
 * two planes use a different cookie name, a different table and a different
 * JWT claim, so no amount of confusion in calling code can let a tenant
 * session be read as an operator session. The duplication is the point.
 */

const ADMIN_COOKIE = "fsm_admin_session";
/** Shorter than a tenant shift: an operator console is used in bursts, and the blast radius is every tenant. */
const ADMIN_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const encodedSecret = new TextEncoder().encode(env.SESSION_SECRET);

interface AdminJWTPayload {
  /** Named differently from the tenant token's `sid` so a swapped cookie fails to parse rather than half-working. */
  psid: string;
}

async function signAdminToken(psid: string): Promise<string> {
  return new SignJWT({ psid } satisfies AdminJWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + ADMIN_TTL_MS) / 1000))
    .sign(encodedSecret);
}

async function verifyAdminToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret, { algorithms: ["HS256"] });
    const psid = (payload as Partial<AdminJWTPayload>).psid;
    return typeof psid === "string" ? psid : null;
  } catch {
    return null;
  }
}

export async function createAdminSession(adminId: string, meta: { userAgent?: string; ipAddress?: string }) {
  const master = getMasterDb();
  const expiresAt = new Date(Date.now() + ADMIN_TTL_MS);
  const session = await master.platformSession.create({
    data: { adminId, expiresAt, userAgent: meta.userAgent, ipAddress: meta.ipAddress },
  });
  const token = await signAdminToken(session.id);
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    /**
     * Scoped to /admin so the operator cookie is never even transmitted on a
     * tenant request. A tenant-side bug cannot leak what the browser doesn't
     * send.
     */
    path: "/admin",
  });
}

/** Reads the cookie, verifies the signature, then confirms the row in the database — the row is the authority. */
export async function readAdminSession() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const psid = await verifyAdminToken(token);
  if (!psid) return null;

  try {
    const master = getMasterDb();
    const session = await master.platformSession.findUnique({
      where: { id: psid },
      include: { admin: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
    if (!session.admin.active) return null;

    return { sessionId: session.id, admin: session.admin };
  } catch (err) {
    console.error("readAdminSession database error:", err);
    return null;
  }
}

export async function destroyAdminSession() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  store.delete(ADMIN_COOKIE);
  if (!token) return;
  const psid = await verifyAdminToken(token);
  if (!psid) return;

  try {
    const master = getMasterDb();
    await master.platformSession.updateMany({
      where: { id: psid, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch (err) {
    console.error("destroyAdminSession database error:", err);
  }
}

/** Optimistic, cookie-only check for the proxy. Never sufficient for authorization. */
export async function hasAdminCookieOptimistic(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return (await verifyAdminToken(token)) !== null;
}

export { ADMIN_COOKIE };
