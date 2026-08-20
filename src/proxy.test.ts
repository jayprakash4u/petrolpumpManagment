/**
 * Proxy (formerly Middleware) redirect rules.
 *
 * The rule that matters here is a *negative* one: the proxy must never
 * redirect away from /login on the strength of its optimistic, signature-only
 * cookie check. It once did, and the result was an infinite redirect loop for
 * anyone holding a cookie whose signature still verified but whose Session
 * row was gone — a logout on another device, an expiry sweep, a deactivated
 * user, a reseeded database. The proxy sent them /login -> /dashboard while
 * requireUser() sent them /dashboard -> /login, forever.
 *
 * Authoritative "you are signed in, go to the dashboard" belongs to
 * src/app/login/page.tsx, which checks the database.
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import { SignJWT } from "jose";

const SECRET = "test-secret-value-that-is-long-enough-for-hs256";
process.env.SESSION_SECRET = SECRET;
process.env.DATABASE_URL = "file:./proxy-test-unused.db";

/** The cookie the current request is carrying, swapped per test. */
let cookieValue: string | undefined;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "fsm_session" && cookieValue ? { value: cookieValue } : undefined),
  }),
}));

const { NextRequest } = await import("next/server");
const proxy = (await import("@/proxy")).default;

let validSignature: string;

beforeAll(async () => {
  // Signature verifies, but names a Session row that does not exist. This is
  // exactly the state a browser is left in after its session is revoked.
  validSignature = await new SignJWT({ sid: "session-that-no-longer-exists" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + 3600_000) / 1000))
    .sign(new TextEncoder().encode(SECRET));
});

async function visit(pathname: string, cookie?: string) {
  cookieValue = cookie;
  const res = await proxy(new NextRequest(new URL(pathname, "http://localhost:3000")));
  return {
    status: res.status,
    location: res.headers.get("location"),
    redirected: res.headers.has("location"),
  };
}

/* ------------------------------------------------------------------ */

describe("no cookie", () => {
  it("sends a protected route to the login page", async () => {
    const res = await visit("/dashboard");
    expect(res.redirected).toBe(true);
    expect(res.location).toContain("/login");
  });

  it("remembers where the visitor was heading", async () => {
    const res = await visit("/sales");
    expect(res.location).toContain("next=%2Fsales");
  });

  it("lets the login page through", async () => {
    expect((await visit("/login")).redirected).toBe(false);
  });
});

describe("cookie present but not trustworthy", () => {
  it("sends a garbage cookie to the login page", async () => {
    const res = await visit("/dashboard", "not-a-jwt");
    expect(res.redirected).toBe(true);
    expect(res.location).toContain("/login");
  });

  it("sends a cookie signed with the wrong secret to the login page", async () => {
    const forged = await new SignJWT({ sid: "x" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(Math.floor((Date.now() + 3600_000) / 1000))
      .sign(new TextEncoder().encode("a-completely-different-secret-value-x"));

    const res = await visit("/dashboard", forged);
    expect(res.redirected).toBe(true);
    expect(res.location).toContain("/login");
  });
});

describe("signature-valid cookie whose session is gone", () => {
  it("REACHES the login page instead of being bounced (no redirect loop)", async () => {
    const res = await visit("/login", validSignature);
    expect(res.redirected).toBe(false);
    expect(res.location).toBeNull();
  });

  it("is let through to a protected route, where the DAL makes the real call", async () => {
    // The proxy is optimistic on purpose — it does no database work. It
    // passes the request on, and requireUser() rejects it against the DB.
    const res = await visit("/dashboard", validSignature);
    expect(res.redirected).toBe(false);
  });

  it("cannot ping-pong: /login and /dashboard are never both redirects", async () => {
    const login = await visit("/login", validSignature);
    const dashboard = await visit("/dashboard", validSignature);

    // If both redirected, the browser would bounce between them forever.
    expect(login.redirected && dashboard.redirected).toBe(false);
  });
});

describe("the login page is always reachable", () => {
  it("renders for every cookie state, so a signed-out user can always get back in", async () => {
    for (const cookie of [undefined, "not-a-jwt", validSignature]) {
      const res = await visit("/login", cookie);
      expect(res.redirected, String(cookie).slice(0, 24)).toBe(false);
    }
  });
});

describe("the platform plane is gated separately", () => {
  it("sends an anonymous visitor from /admin to the operator login", async () => {
    const res = await visit("/admin");
    expect(res.redirected).toBe(true);
    expect(res.location).toContain("/admin/login");
  });

  it("does NOT accept a tenant cookie as operator access", async () => {
    // The tenant cookie is a different cookie name entirely, so it isn't even
    // read here — but assert the outcome, since that's what protects tenants.
    const res = await visit("/admin", validSignature);
    expect(res.redirected).toBe(true);
    expect(res.location).toContain("/admin/login");
  });

  it("never sends an operator to the tenant login", async () => {
    const res = await visit("/admin");
    // Compare the pathname, not a suffix: "/admin/login" also ends in "/login".
    expect(new URL(res.location!).pathname).toBe("/admin/login");
  });

  it("always lets the operator login page render", async () => {
    for (const cookie of [undefined, "not-a-jwt", validSignature]) {
      const res = await visit("/admin/login", cookie);
      expect(res.redirected, String(cookie).slice(0, 24)).toBe(false);
    }
  });

  it("gates every admin sub-path, not just the root", async () => {
    for (const p of ["/admin", "/admin/stations", "/admin/anything/deep"]) {
      const res = await visit(p);
      expect(res.redirected, p).toBe(true);
      expect(res.location, p).toContain("/admin/login");
    }
  });
});
