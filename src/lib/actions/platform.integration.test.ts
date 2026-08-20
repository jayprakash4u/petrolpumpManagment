/**
 * Integration tests for the platform (operator) plane.
 *
 * The thing under test is a *boundary*: platform accounts sit above every
 * tenant, so the questions that matter are "can a tenant reach this?" and
 * "does suspending actually cut a tenant off?" — not just "does the form
 * work". The separation is structural (a different table, a different session
 * table, a different cookie), and these tests pin that it stays structural.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { PlatformAdmin } from "@prisma/client";

const testDir = mkdtempSync(path.join(tmpdir(), "fsm-platform-"));
const testDbPath = path.join(testDir, "test.db");
process.env.DATABASE_URL = "file:" + testDbPath;
process.env.SESSION_SECRET = "test-secret-value-that-is-long-enough-for-hs256";

let currentAdmin: PlatformAdmin | null = null;

vi.mock("@/lib/platform-dal", () => ({
  getCurrentAdmin: async () => currentAdmin,
  requirePlatformAdmin: async () => {
    if (!currentAdmin) throw new Error("NOT_AUTHENTICATED");
    return currentAdmin;
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error("REDIRECT:" + to);
  },
}));

const { prisma } = await import("@/lib/db");
const { onboardStationAction, setStationSuspendedAction } = await import("@/lib/actions/platform");
const { getPlatformOverview } = await import("@/lib/queries/platform");
const bcrypt = (await import("bcryptjs")).default;

beforeAll(() => {
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
  await prisma.platformAuditLog.deleteMany();
  await prisma.platformSession.deleteMany();
  await prisma.platformAdmin.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.customerPayment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.fuelRateHistory.deleteMany();
  await prisma.tank.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.station.deleteMany();

  currentAdmin = await prisma.platformAdmin.create({
    data: { username: "ops", name: "Ops", passwordHash: "x" },
  });
});

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const onboard = (over: Record<string, string> = {}) =>
  form({
    name: "Everest Fuels",
    slug: "everest-fuels",
    address: "Ring Road",
    ownerName: "Prakash",
    ownerUsername: "prakash",
    ownerPassword: "supersecret",
    ...over,
  });

/* ------------------------------------------------------------------ */

describe("the platform plane is separate from the tenant plane", () => {
  it("keeps operators out of the User table entirely", async () => {
    expect(await prisma.user.count({ where: { username: "ops" } })).toBe(0);
    expect(await prisma.platformAdmin.count()).toBe(1);
  });

  it("has no Role that could grant platform access", async () => {
    // If "platform admin" were a Role, a station owner could hand it out with
    // the ordinary role-change form. There must be no such value.
    const { Role } = await import("@prisma/client");
    expect(Object.keys(Role).sort()).toEqual(["ATTENDANT", "CASHIER", "MANAGER", "OWNER"]);
  });

  it("refuses every platform action when no operator is signed in", async () => {
    currentAdmin = null;

    await expect(onboardStationAction({}, onboard())).rejects.toThrow("NOT_AUTHENTICATED");
    expect(await prisma.station.count()).toBe(0);
  });

  it("uses a different session table from tenant sessions", async () => {
    const station = await prisma.station.create({ data: { slug: "s", name: "S", address: "A" } });
    const user = await prisma.user.create({
      data: { stationId: station.id, name: "U", username: "u.ser", passwordHash: "x", role: "OWNER" },
    });
    await prisma.session.create({ data: { userId: user.id, expiresAt: new Date(Date.now() + 3600e3) } });

    // A tenant session exists, but the platform session table is untouched.
    expect(await prisma.session.count()).toBe(1);
    expect(await prisma.platformSession.count()).toBe(0);
  });
});

describe("onboarding a station", () => {
  it("creates the tenant and its first owner together", async () => {
    const result = await onboardStationAction({}, onboard());

    expect(result.error).toBeUndefined();
    expect(result.message).toMatch(/station code "everest-fuels"/);

    const station = await prisma.station.findUniqueOrThrow({ where: { slug: "everest-fuels" } });
    expect(station.name).toBe("Everest Fuels");
    expect(station.suspendedAt).toBeNull();

    const owner = await prisma.user.findUniqueOrThrow({
      where: { stationId_username: { stationId: station.id, username: "prakash" } },
    });
    expect(owner.role).toBe("OWNER");
    expect(owner.active).toBe(true);
    expect(await bcrypt.compare("supersecret", owner.passwordHash)).toBe(true);
  });

  it("normalises the station code", async () => {
    await onboardStationAction({}, onboard({ slug: "  Everest_Fuels  " }));
    expect(await prisma.station.findUnique({ where: { slug: "everest-fuels" } })).not.toBeNull();
  });

  it("normalises the owner username so tenant login can find it", async () => {
    await onboardStationAction({}, onboard({ ownerUsername: "PRAKASH" }));
    const station = await prisma.station.findUniqueOrThrow({ where: { slug: "everest-fuels" } });
    expect(
      await prisma.user.findUnique({
        where: { stationId_username: { stationId: station.id, username: "prakash" } },
      })
    ).not.toBeNull();
  });

  it("refuses a station code that is already taken", async () => {
    await onboardStationAction({}, onboard());
    const dupe = await onboardStationAction({}, onboard({ ownerUsername: "other.owner" }));

    expect(dupe.error).toMatch(/already taken/);
    expect(await prisma.station.count()).toBe(1);
  });

  it("refuses a reserved station code", async () => {
    const result = await onboardStationAction({}, onboard({ slug: "admin" }));
    expect(result.error).toMatch(/reserved/);
    expect(await prisma.station.count()).toBe(0);
  });

  it("refuses an over-short station code", async () => {
    const result = await onboardStationAction({}, onboard({ slug: "ab" }));
    expect(result.error).toMatch(/at least 3 characters/);
    expect(await prisma.station.count()).toBe(0);
  });

  it("enforces a minimum owner password", async () => {
    const result = await onboardStationAction({}, onboard({ ownerPassword: "short" }));
    expect(result.error).toMatch(/at least 8 characters/);
    expect(await prisma.station.count()).toBe(0);
  });

  it("never leaves a station without an owner", async () => {
    // A bad owner username must roll the station back too — a tenant nobody can
    // sign in to is unusable and can only be repaired by hand.
    const result = await onboardStationAction({}, onboard({ ownerUsername: "admin" }));
    expect(result.error).toBeTruthy();
    expect(await prisma.station.count()).toBe(0);
    expect(await prisma.user.count()).toBe(0);
  });

  it("lets two stations reuse the same owner username", async () => {
    await onboardStationAction({}, onboard());
    const second = await onboardStationAction({}, onboard({ slug: "annapurna-fuels", name: "Annapurna" }));

    expect(second.error).toBeUndefined();
    expect(await prisma.user.count({ where: { username: "prakash" } })).toBe(2);
  });

  it("records the onboarding without the owner's password", async () => {
    await onboardStationAction({}, onboard());
    const log = await prisma.platformAuditLog.findFirstOrThrow({ where: { action: "STATION_CREATED" } });

    expect(log.actorId).toBe(currentAdmin!.id);
    expect(log.metadata).toMatchObject({ slug: "everest-fuels", ownerUsername: "prakash" });
    expect(JSON.stringify(log.metadata)).not.toMatch(/supersecret/);
    expect(JSON.stringify(log.metadata)).not.toMatch(/\$2[aby]\$/);
  });
});

describe("suspending a tenant", () => {
  async function seedTenantWithSessions() {
    await onboardStationAction({}, onboard());
    const station = await prisma.station.findUniqueOrThrow({ where: { slug: "everest-fuels" } });
    const owner = await prisma.user.findFirstOrThrow({ where: { stationId: station.id } });

    const live = await prisma.session.create({
      data: { userId: owner.id, expiresAt: new Date(Date.now() + 3600e3) },
    });
    await prisma.user.update({
      where: { id: owner.id },
      data: { onShift: true, shiftStartedAt: new Date() },
    });
    await prisma.shift.create({ data: { userId: owner.id } });

    return { station, owner, live };
  }

  it("signs everyone out immediately", async () => {
    const { station, live } = await seedTenantWithSessions();

    const result = await setStationSuspendedAction({}, form({ stationId: station.id, suspend: "true", reason: "Non-payment" }));

    expect(result.error).toBeUndefined();
    expect(result.message).toMatch(/1 active session\(s\) signed out/);
    expect((await prisma.session.findUniqueOrThrow({ where: { id: live.id } })).revokedAt).not.toBeNull();
  });

  it("marks the station suspended with a reason and a timestamp", async () => {
    const { station } = await seedTenantWithSessions();
    await setStationSuspendedAction({}, form({ stationId: station.id, suspend: "true", reason: "Non-payment" }));

    const after = await prisma.station.findUniqueOrThrow({ where: { id: station.id } });
    expect(after.suspendedAt).not.toBeNull();
    expect(after.suspendedReason).toBe("Non-payment");
  });

  it("closes open shifts rather than leaving staff on duty forever", async () => {
    const { station, owner } = await seedTenantWithSessions();
    await setStationSuspendedAction({}, form({ stationId: station.id, suspend: "true", reason: "Non-payment" }));

    expect((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).onShift).toBe(false);
    expect(await prisma.shift.count({ where: { userId: owner.id, endedAt: null } })).toBe(0);
  });

  it("insists on a reason", async () => {
    const { station } = await seedTenantWithSessions();
    const result = await setStationSuspendedAction({}, form({ stationId: station.id, suspend: "true", reason: " " }));

    expect(result.error).toMatch(/reason/i);
    expect((await prisma.station.findUniqueOrThrow({ where: { id: station.id } })).suspendedAt).toBeNull();
  });

  it("cannot be applied twice", async () => {
    const { station } = await seedTenantWithSessions();
    await setStationSuspendedAction({}, form({ stationId: station.id, suspend: "true", reason: "Non-payment" }));
    const again = await setStationSuspendedAction({}, form({ stationId: station.id, suspend: "true", reason: "Again" }));

    expect(again.error).toMatch(/already suspended/);
  });

  it("restores a tenant", async () => {
    const { station } = await seedTenantWithSessions();
    await setStationSuspendedAction({}, form({ stationId: station.id, suspend: "true", reason: "Non-payment" }));

    const restored = await setStationSuspendedAction({}, form({ stationId: station.id, suspend: "false" }));
    expect(restored.error).toBeUndefined();

    const after = await prisma.station.findUniqueOrThrow({ where: { id: station.id } });
    expect(after.suspendedAt).toBeNull();
    expect(after.suspendedReason).toBeNull();
  });

  it("leaves a suspended tenant's business data untouched", async () => {
    const { station } = await seedTenantWithSessions();
    const before = await prisma.user.count({ where: { stationId: station.id } });

    await setStationSuspendedAction({}, form({ stationId: station.id, suspend: "true", reason: "Non-payment" }));

    // Suspension withdraws access; it must never destroy the tenant's records.
    expect(await prisma.user.count({ where: { stationId: station.id } })).toBe(before);
    expect(await prisma.station.count({ where: { id: station.id } })).toBe(1);
  });

  it("does not touch any other tenant", async () => {
    const { station } = await seedTenantWithSessions();
    await onboardStationAction({}, onboard({ slug: "annapurna-fuels", name: "Annapurna", ownerUsername: "second.owner" }));
    const other = await prisma.station.findUniqueOrThrow({ where: { slug: "annapurna-fuels" } });
    const otherOwner = await prisma.user.findFirstOrThrow({ where: { stationId: other.id } });
    const otherSession = await prisma.session.create({
      data: { userId: otherOwner.id, expiresAt: new Date(Date.now() + 3600e3) },
    });

    await setStationSuspendedAction({}, form({ stationId: station.id, suspend: "true", reason: "Non-payment" }));

    expect((await prisma.station.findUniqueOrThrow({ where: { id: other.id } })).suspendedAt).toBeNull();
    expect((await prisma.session.findUniqueOrThrow({ where: { id: otherSession.id } })).revokedAt).toBeNull();
  });

  it("requires an operator", async () => {
    const { station } = await seedTenantWithSessions();
    currentAdmin = null;
    await expect(
      setStationSuspendedAction({}, form({ stationId: station.id, suspend: "true", reason: "x" }))
    ).rejects.toThrow("NOT_AUTHENTICATED");
  });
});

describe("platform overview", () => {
  it("reports tenant metadata but no tenant business data", async () => {
    await onboardStationAction({}, onboard());
    const overview = await getPlatformOverview();

    expect(overview.total).toBe(1);
    expect(overview.activeCount).toBe(1);
    expect(overview.dormantCount).toBe(1);

    const row = overview.stations[0];
    expect(row.staffCount).toBe(1);
    expect(row.saleCount).toBe(0);
    expect(row.lastSaleAt).toBeNull();

    // The console must not surface a tenant's money.
    expect(Object.keys(row)).not.toContain("revenue");
    expect(Object.keys(row)).not.toContain("dueAmount");
  });

  it("counts suspended tenants separately", async () => {
    await onboardStationAction({}, onboard());
    const station = await prisma.station.findUniqueOrThrow({ where: { slug: "everest-fuels" } });
    await setStationSuspendedAction({}, form({ stationId: station.id, suspend: "true", reason: "Non-payment" }));

    const overview = await getPlatformOverview();
    expect(overview.activeCount).toBe(0);
    expect(overview.suspendedCount).toBe(1);
  });
});
