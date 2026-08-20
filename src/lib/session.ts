import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "fsm_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours — one shift
const encodedSecret = new TextEncoder().encode(env.SESSION_SECRET);

interface SessionJWTPayload {
  sid: string; // Session.id (database row) — the JWT itself carries no authority, only names the row
}

async function signSessionToken(sid: string): Promise<string> {
  return new SignJWT({ sid } satisfies SessionJWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + SESSION_TTL_MS) / 1000))
    .sign(encodedSecret);
}

async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret, { algorithms: ["HS256"] });
    const sid = (payload as Partial<SessionJWTPayload>).sid;
    return typeof sid === "string" ? sid : null;
  } catch {
    return null;
  }
}

/** Creates a DB-backed session row and sets the signed httpOnly cookie. Call after verifying credentials. */
export async function createSession(userId: string, meta: { userAgent?: string; ipAddress?: string }) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const session = await prisma.session.create({
    data: { userId, expiresAt, userAgent: meta.userAgent, ipAddress: meta.ipAddress },
  });
  const token = await signSessionToken(session.id);
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
 * Reads the cookie, verifies the JWT signature, then checks the *database*
 * row — not just the token — so revoking a session (logout, deactivating a
 * user) takes effect on the next request instead of waiting for the JWT to
 * expire. Returns the authenticated user, or null.
 */
export async function readSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const sid = await verifySessionToken(token);
  if (!sid) return null;

  const session = await prisma.session.findUnique({
    where: { id: sid },
    include: { user: { include: { station: { select: { suspendedAt: true } } } } },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (!session.user.active) return null;
  // Belt and braces: suspending a tenant already revokes every session, but
  // checking here means a session created by any other path still can't
  // trade on a suspended station.
  if (session.user.station.suspendedAt !== null) return null;

  return { sessionId: session.id, user: session.user };
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  store.delete(SESSION_COOKIE);
  if (!token) return;
  const sid = await verifySessionToken(token);
  if (!sid) return;
  await prisma.session.updateMany({
    where: { id: sid, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Optimistic, cookie-only check for use in proxy.ts — no DB round trip, must not be trusted for authorization. */
export async function hasSessionCookieOptimistic(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return (await verifySessionToken(token)) !== null;
}

export { SESSION_COOKIE };
