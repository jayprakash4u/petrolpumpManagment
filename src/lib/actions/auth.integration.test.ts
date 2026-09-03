/**
 * Integration tests for tenant-aware login.
 *
 * Identity is (station code, username) — never username alone. These run the real
 * `loginAction` against a real database with two pumps that share a staff
 * username, and assert that each code reaches only its own tenant, and that a
 * failure never reveals which part was wrong.
 *
 * `next/headers`, `next/navigation` and the session cookie are stubbed
 * because they only exist inside a request; everything else is real,
 * including bcrypt verification and the rate limiter.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const testDir = mkdtempSync(path.join(tmpdir(), "fsm-auth-"));
const testDbPath = path.join(testDir, "test.db");
process.env.DATABASE_URL = "file:" + testDbPath;
process.env.SESSION_SECRET = "test-secret-value-that-is-long-enough-for-hs256";

/** Captures where the action redirected to, and stops execution like the real one does. */
class RedirectSignal extends Error {
  constructor(public to: string) {
    super("REDIRECT:" + to);
  }
}

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new RedirectSignal(to);
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Map([["user-agent", "vitest"]]) as unknown as Headers,
  cookies: async () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
}));

const { prisma } = await import("@/lib/db");
const { resetAllLoginRateLimits } = await import("@/lib/rate-limit");
const { loginAction } = await import("@/lib/actions/auth");
const bcrypt = (await import("bcryptjs")).default;

const PASSWORD = "password123";
let alphaId: string;
let betaId: string;

/** The username deliberately used by a person at BOTH pumps. */
const SHARED = "manager.shared";

beforeAll(async () => {
  execFileSync("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"], {
    env: { ...process.env, DATABASE_URL: "file:" + testDbPath },
    stdio: "pipe",
    shell: process.platform === "win32",
  });
}, 120_000);

afterAll(async () => {
  await prisma.$disconnect();
  rmSync(testDir, { recursive: true, force: true });
});

beforeEach(async () => {
  resetAllLoginRateLimits();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.station.deleteMany();

  const hash = await bcrypt.hash(PASSWORD, 10);

  const alpha = await prisma.station.create({ data: { slug: "alpha-pump", name: "Alpha", address: "A Rd" } });
  const beta = await prisma.station.create({ data: { slug: "beta-pump", name: "Beta", address: "B Rd" } });
  alphaId = alpha.id;
  betaId = beta.id;

  await prisma.user.create({
    data: { stationId: alpha.id, name: "Alpha Manager", username: SHARED, passwordHash: hash, role: "MANAGER" },
  });
  await prisma.user.create({
    data: { stationId: beta.id, name: "Beta Manager", username: SHARED, passwordHash: hash, role: "OWNER" },
  });
  await prisma.user.create({
    data: { stationId: alpha.id, name: "Gone", username: "gone.person", passwordHash: hash, role: "CASHIER", active: false },
  });
});

function creds(station: string, username: string, password: string) {
  const fd = new FormData();
  fd.set("station", station);
  fd.set("username", username);
  fd.set("password", password);
  return fd;
}

/** Runs the action, turning the redirect-on-success into a plain result. */
async function login(station: string, username: string, password: string) {
  try {
    const state = await loginAction({}, creds(station, username, password));
    return { ok: false as const, error: state.error };
  } catch (err) {
    if (err instanceof RedirectSignal) return { ok: true as const, to: err.to };
    throw err;
  }
}

/* ------------------------------------------------------------------ */

describe("tenant-aware login", () => {
  it("signs in against the right pump", async () => {
    const result = await login("alpha-pump", SHARED, PASSWORD);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.to).toBe("/dashboard");
  });

  it("redirects to a safe internal path after sign-in", async () => {
    const fd = creds("alpha-pump", SHARED, PASSWORD);
    fd.set("next", "/sales");
    try {
      await loginAction({}, fd);
      expect.fail("expected redirect");
    } catch (err) {
      expect(err).toBeInstanceOf(RedirectSignal);
      if (err instanceof RedirectSignal) expect(err.to).toBe("/sales");
    }
  });

  it("ignores unsafe redirect targets", async () => {
    const fd = creds("alpha-pump", SHARED, PASSWORD);
    fd.set("next", "//evil.com");
    try {
      await loginAction({}, fd);
      expect.fail("expected redirect");
    } catch (err) {
      expect(err).toBeInstanceOf(RedirectSignal);
      if (err instanceof RedirectSignal) expect(err.to).toBe("/dashboard");
    }
  });

  it("resolves the same username to a different person at each pump", async () => {
    await login("alpha-pump", SHARED, PASSWORD);
    await login("beta-pump", SHARED, PASSWORD);

    const sessions = await prisma.session.findMany({ include: { user: true } });
    expect(sessions).toHaveLength(2);

    const stations = sessions.map((s) => s.user.stationId).sort();
    expect(stations).toEqual([alphaId, betaId].sort());

    const names = sessions.map((s) => s.user.name).sort();
    expect(names).toEqual(["Alpha Manager", "Beta Manager"]);
  });

  it("gives each identity its own role, even on a shared username", async () => {
    await login("alpha-pump", SHARED, PASSWORD);
    const session = await prisma.session.findFirstOrThrow({ include: { user: true } });
    expect(session.user.role).toBe("MANAGER"); // OWNER at beta-pump
  });

  it("accepts a station code in any casing or separator style", async () => {
    for (const variant of ["ALPHA-PUMP", "  alpha_pump  ", "Alpha Pump"]) {
      await prisma.session.deleteMany();
      const result = await login(variant, SHARED, PASSWORD);
      expect(result.ok, variant).toBe(true);
    }
  });
});

describe("login failures reveal nothing", () => {
  const EXPECTED = "Invalid station code, username, or password.";

  it("rejects an unknown station code", async () => {
    const result = await login("no-such-pump", SHARED, PASSWORD);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(EXPECTED);
  });

  it("rejects a valid username at the wrong pump", async () => {
    // This address exists — but not at a pump the caller named correctly.
    await prisma.user.deleteMany({ where: { stationId: betaId } });
    const result = await login("beta-pump", SHARED, PASSWORD);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(EXPECTED);
  });

  it("rejects a wrong password", async () => {
    const result = await login("alpha-pump", SHARED, "wrong-password");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(EXPECTED);
  });

  it("rejects a deactivated account", async () => {
    const result = await login("alpha-pump", "gone.person", PASSWORD);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(EXPECTED);
  });

  it("uses one identical message for every failure mode", async () => {
    const messages = await Promise.all([
      login("no-such-pump", SHARED, PASSWORD),
      login("alpha-pump", "nobody.here", PASSWORD),
      login("alpha-pump", SHARED, "wrong-password"),
      login("alpha-pump", "gone.person", PASSWORD),
    ]);

    const distinct = new Set(messages.map((m) => (m.ok ? "OK" : m.error)));
    expect(distinct.size).toBe(1);
    expect([...distinct][0]).toBe(EXPECTED);
  });

  it("creates no session on any failure", async () => {
    await login("no-such-pump", SHARED, PASSWORD);
    await login("alpha-pump", SHARED, "wrong-password");
    expect(await prisma.session.count()).toBe(0);
  });

  it("requires a station code at all", async () => {
    const fd = new FormData();
    fd.set("username", SHARED);
    fd.set("password", PASSWORD);
    const state = await loginAction({}, fd);
    expect(state.error).toMatch(/Station code is required/);
    expect(await prisma.session.count()).toBe(0);
  });
});

describe("rate limiting is per tenant", () => {
  it("does not lock out one pump because another was attacked", async () => {
    // Burn through the window for alpha-pump on this address.
    for (let i = 0; i < 10; i++) await login("alpha-pump", SHARED, "wrong-password");

    const alphaBlocked = await login("alpha-pump", SHARED, PASSWORD);
    expect(alphaBlocked.ok).toBe(false);
    if (!alphaBlocked.ok) expect(alphaBlocked.error).toMatch(/Too many attempts/);

    // The same address at a different pump must still be able to sign in.
    const betaFine = await login("beta-pump", SHARED, PASSWORD);
    expect(betaFine.ok).toBe(true);
  });
});

describe("suspended tenants", () => {
  it("cannot sign in, and cannot be told apart from a station that never existed", async () => {
    await prisma.station.update({
      where: { id: alphaId },
      data: { suspendedAt: new Date(), suspendedReason: "Non-payment" },
    });

    const suspended = await login("alpha-pump", SHARED, PASSWORD);
    const nonexistent = await login("no-such-pump", SHARED, PASSWORD);

    expect(suspended.ok).toBe(false);
    // Identical messages: an outsider must not learn that a pump exists but
    // is in arrears, and staff must hear it from their owner, not the login
    // screen.
    if (!suspended.ok && !nonexistent.ok) {
      expect(suspended.error).toBe(nonexistent.error);
    }
    expect(await prisma.session.count()).toBe(0);
  });

  it("lets an unsuspended tenant sign in as normal", async () => {
    await prisma.station.update({ where: { id: alphaId }, data: { suspendedAt: new Date() } });
    expect((await login("alpha-pump", SHARED, PASSWORD)).ok).toBe(false);

    await prisma.station.update({ where: { id: alphaId }, data: { suspendedAt: null } });
    expect((await login("alpha-pump", SHARED, PASSWORD)).ok).toBe(true);
  });

  it("does not affect a different tenant", async () => {
    await prisma.station.update({ where: { id: alphaId }, data: { suspendedAt: new Date() } });
    expect((await login("beta-pump", SHARED, PASSWORD)).ok).toBe(true);
  });
});

describe("format guidance that leaks nothing", () => {
  it("tells a caller who typed an email to use their username instead", async () => {
    // The single most likely real-world failure: a browser autofilling the
    // address that used to be the credential.
    const result = await login("alpha-pump", "manager@shared.test", PASSWORD);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/looks like an email address/i);
  });

  it("gives that guidance even for a station code that does not exist", async () => {
    // Decided before any database lookup, so it cannot reveal whether the
    // station or the account is real.
    const result = await login("no-such-pump", "someone@example.com", "anything");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/looks like an email address/i);
  });

  it("never creates a session from the guidance path", async () => {
    await login("alpha-pump", "manager@shared.test", PASSWORD);
    expect(await prisma.session.count()).toBe(0);
  });

  it("still refuses a plain wrong username with the generic message", async () => {
    const result = await login("alpha-pump", "nobody.here", PASSWORD);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Invalid station code, username, or password.");
  });

  it("signs in fine with @ in the username, as long as it isn't shaped like an email", async () => {
    const hash = await bcrypt.hash(PASSWORD, 10);
    await prisma.user.create({
      data: { stationId: alphaId, name: "At Sign", username: "nepal@01", passwordHash: hash, role: "OWNER" },
    });

    const result = await login("alpha-pump", "nepal@01", PASSWORD);
    expect(result.ok).toBe(true);
  });
});
