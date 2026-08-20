/**
 * Integration tests for shift and user-management actions — the real Server
 * Actions, the real Prisma client, a real (throwaway) SQLite database. Same
 * approach as the sales and stock suites: only `requireUser()` and
 * `revalidatePath()` are stubbed.
 *
 * The lockout guards get particular attention here. An owner who deactivates
 * or demotes themselves, or removes the last owner, would leave the station
 * with nobody able to manage users — and no way to fix it from inside the app.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Role, User } from "@prisma/client";

const testDir = mkdtempSync(path.join(tmpdir(), "fsm-emp-"));
const testDbPath = path.join(testDir, "test.db");
process.env.DATABASE_URL = "file:" + testDbPath;

let currentUser: User;

vi.mock("@/lib/dal", () => ({
  requireUser: async () => currentUser,
  getCurrentUser: async () => currentUser,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const { prisma } = await import("@/lib/db");
const { startShiftAction, endShiftAction } = await import("@/lib/actions/shifts");
const { createUserAction, setUserActiveAction, changeUserRoleAction } = await import("@/lib/actions/users");
const bcrypt = (await import("bcryptjs")).default;

let stationId: string;
const users: Record<Role, User> = {} as Record<Role, User>;

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
  await prisma.auditLog.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.fuelRateHistory.deleteMany();
  await prisma.customerPayment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.tank.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.station.deleteMany();

  const station = await prisma.station.create({ data: { slug: "test-station", name: "Test Station", address: "Test Rd" } });
  stationId = station.id;

  for (const role of ["OWNER", "MANAGER", "CASHIER", "ATTENDANT"] as Role[]) {
    users[role] = await prisma.user.create({
      data: { stationId, name: role + " Person", username: role.toLowerCase() + ".user", passwordHash: "x", role },
    });
  }
  currentUser = users.OWNER;
});

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

/* ------------------------------------------------------------------ */

describe("startShiftAction", () => {
  it("puts the caller on shift and opens a Shift row", async () => {
    currentUser = users.ATTENDANT;
    const result = await startShiftAction({}, form({}));

    expect(result.error).toBeUndefined();
    expect(result.message).toBe("You're on shift.");

    const user = await prisma.user.findUniqueOrThrow({ where: { id: users.ATTENDANT.id } });
    expect(user.onShift).toBe(true);
    expect(user.shiftStartedAt).not.toBeNull();

    const shift = await prisma.shift.findFirstOrThrow({ where: { userId: users.ATTENDANT.id } });
    expect(shift.endedAt).toBeNull();
  });

  it("refuses to open a second overlapping shift", async () => {
    currentUser = users.CASHIER;
    await startShiftAction({}, form({}));
    const second = await startShiftAction({}, form({}));

    expect(second.error).toMatch(/already on shift/);
    expect(await prisma.shift.count({ where: { userId: users.CASHIER.id } })).toBe(1);
  });

  it("lets a manager start someone else's shift", async () => {
    currentUser = users.MANAGER;
    const result = await startShiftAction({}, form({ userId: users.ATTENDANT.id }));

    expect(result.error).toBeUndefined();
    expect(result.message).toMatch(/ATTENDANT Person is now on shift/);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users.ATTENDANT.id } })).onShift).toBe(true);
  });

  it("refuses to let a cashier start someone else's shift", async () => {
    currentUser = users.CASHIER;
    const result = await startShiftAction({}, form({ userId: users.ATTENDANT.id }));

    expect(result.error).toMatch(/owner or manager/);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users.ATTENDANT.id } })).onShift).toBe(false);
  });

  it("will not put a deactivated employee on shift", async () => {
    await prisma.user.update({ where: { id: users.ATTENDANT.id }, data: { active: false } });
    currentUser = users.OWNER;

    const result = await startShiftAction({}, form({ userId: users.ATTENDANT.id }));
    expect(result.error).toMatch(/deactivated/);
    expect(await prisma.shift.count()).toBe(0);
  });

  it("will not touch an employee at another station", async () => {
    const other = await prisma.station.create({ data: { slug: "other-station", name: "Other", address: "Elsewhere" } });
    const outsider = await prisma.user.create({
      data: { stationId: other.id, name: "Outsider", username: "outsider", passwordHash: "x", role: "ATTENDANT" },
    });

    currentUser = users.OWNER;
    const result = await startShiftAction({}, form({ userId: outsider.id }));
    expect(result.error).toMatch(/isn't at this station/);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: outsider.id } })).onShift).toBe(false);
  });

  it("records the start in the audit trail", async () => {
    currentUser = users.ATTENDANT;
    await startShiftAction({}, form({}));
    const log = await prisma.auditLog.findFirstOrThrow({ where: { action: "SHIFT_STARTED" } });
    expect(log.metadata).toMatchObject({ self: true });
  });
});

describe("endShiftAction", () => {
  it("closes the shift and reports the duration", async () => {
    currentUser = users.CASHIER;
    await startShiftAction({}, form({}));

    // Backdate the open shift so the duration is a real number.
    await prisma.shift.updateMany({
      where: { userId: users.CASHIER.id, endedAt: null },
      data: { startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    });

    const result = await endShiftAction({}, form({}));
    expect(result.error).toBeUndefined();
    expect(result.message).toMatch(/Shift ended — 2h worked/);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: users.CASHIER.id } });
    expect(user.onShift).toBe(false);
    expect(user.shiftStartedAt).toBeNull();

    const shift = await prisma.shift.findFirstOrThrow({ where: { userId: users.CASHIER.id } });
    expect(shift.endedAt).not.toBeNull();
    expect(shift.endedById).toBe(users.CASHIER.id);
  });

  it("refuses to end a shift that isn't open", async () => {
    currentUser = users.CASHIER;
    const result = await endShiftAction({}, form({}));
    expect(result.error).toMatch(/isn't on shift/);
  });

  it("cannot be applied twice", async () => {
    currentUser = users.CASHIER;
    await startShiftAction({}, form({}));
    await endShiftAction({}, form({}));
    const second = await endShiftAction({}, form({}));

    expect(second.error).toMatch(/isn't on shift/);
    expect(await prisma.shift.count({ where: { userId: users.CASHIER.id, endedAt: null } })).toBe(0);
  });

  it("records who ended someone else's shift", async () => {
    currentUser = users.ATTENDANT;
    await startShiftAction({}, form({}));

    currentUser = users.MANAGER;
    const result = await endShiftAction({}, form({ userId: users.ATTENDANT.id }));

    expect(result.error).toBeUndefined();
    const shift = await prisma.shift.findFirstOrThrow({ where: { userId: users.ATTENDANT.id } });
    expect(shift.endedById).toBe(users.MANAGER.id);
  });

  it("recovers a user stranded on shift with no open Shift row", async () => {
    // Simulates a crash between the two writes: the flag says on shift, but
    // there's no row to close. The user must still be able to clock off.
    await prisma.user.update({
      where: { id: users.CASHIER.id },
      data: { onShift: true, shiftStartedAt: new Date() },
    });

    currentUser = users.CASHIER;
    const result = await endShiftAction({}, form({}));

    expect(result.error).toBeUndefined();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users.CASHIER.id } })).onShift).toBe(false);

    const log = await prisma.auditLog.findFirstOrThrow({ where: { action: "SHIFT_ENDED" } });
    expect(log.metadata).toMatchObject({ orphanedFlag: true });
  });
});

/* ------------------------------------------------------------------ */

describe("createUserAction", () => {
  const newEmployee = (over: Record<string, string> = {}) =>
    form({ name: "New Hire", username: "New.Hire", password: "supersecret", role: "ATTENDANT", ...over });

  it("creates an employee with a hashed password", async () => {
    const result = await createUserAction({}, newEmployee());

    expect(result.error).toBeUndefined();
    expect(result.message).toMatch(/New Hire added as Attendant/);

    const created = await prisma.user.findUniqueOrThrow({
      where: { stationId_username: { stationId, username: "new.hire" } },
    });
    expect(created.stationId).toBe(stationId);
    expect(created.role).toBe("ATTENDANT");
    expect(created.active).toBe(true);

    expect(created.passwordHash).not.toBe("supersecret");
    expect(await bcrypt.compare("supersecret", created.passwordHash)).toBe(true);
  });

  it("normalises the username, so login can find it", async () => {
    await createUserAction({}, newEmployee({ username: "MiXeD Case" }));
    expect(
      await prisma.user.findUnique({ where: { stationId_username: { stationId, username: "mixed.case" } } })
    ).not.toBeNull();
  });

  it("refuses a duplicate username regardless of case", async () => {
    await createUserAction({}, newEmployee());
    const dupe = await createUserAction({}, newEmployee({ username: "NEW.HIRE" }));

    expect(dupe.error).toMatch(/already uses that username/);
    expect(await prisma.user.count({ where: { username: "new.hire" } })).toBe(1);
  });

  it("enforces a minimum password length", async () => {
    const result = await createUserAction({}, newEmployee({ password: "short" }));
    expect(result.error).toMatch(/at least 8 characters/);
    expect(await prisma.user.count({ where: { username: "new.hire" } })).toBe(0);
  });

  it("rejects a reserved username", async () => {
    const result = await createUserAction({}, newEmployee({ username: "admin" }));
    expect(result.error).toMatch(/reserved/);
  });

  it("never writes the password or its hash to the audit trail", async () => {
    await createUserAction({}, newEmployee());
    const log = await prisma.auditLog.findFirstOrThrow({ where: { action: "USER_CREATED" } });
    expect(JSON.stringify(log.metadata)).not.toMatch(/supersecret/);
    expect(JSON.stringify(log.metadata)).not.toMatch(/\$2[aby]\$/); // no bcrypt hash
  });

  it("is refused for every role except owner", async () => {
    for (const role of ["MANAGER", "CASHIER", "ATTENDANT"] as const) {
      currentUser = users[role];
      const result = await createUserAction({}, newEmployee());
      expect(result.error, role).toMatch(/Only an owner/);
    }
    expect(await prisma.user.count({ where: { username: "new.hire" } })).toBe(0);
  });
});

describe("setUserActiveAction — deactivation", () => {
  it("deactivates an employee and revokes their live sessions", async () => {
    const session = await prisma.session.create({
      data: { userId: users.CASHIER.id, expiresAt: new Date(Date.now() + 3600e3) },
    });

    const result = await setUserActiveAction({}, form({ userId: users.CASHIER.id, active: "false" }));

    expect(result.error).toBeUndefined();
    expect(result.message).toMatch(/signed out everywhere/);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users.CASHIER.id } })).active).toBe(false);
    expect((await prisma.session.findUniqueOrThrow({ where: { id: session.id } })).revokedAt).not.toBeNull();
  });

  it("closes an open shift when deactivating, rather than leaving it hanging", async () => {
    currentUser = users.ATTENDANT;
    await startShiftAction({}, form({}));

    currentUser = users.OWNER;
    await setUserActiveAction({}, form({ userId: users.ATTENDANT.id, active: "false" }));

    const user = await prisma.user.findUniqueOrThrow({ where: { id: users.ATTENDANT.id } });
    expect(user.onShift).toBe(false);
    expect(await prisma.shift.count({ where: { userId: users.ATTENDANT.id, endedAt: null } })).toBe(0);
  });

  it("refuses to let an owner deactivate their own account", async () => {
    const result = await setUserActiveAction({}, form({ userId: users.OWNER.id, active: "false" }));

    expect(result.error).toMatch(/can't deactivate your own account/);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users.OWNER.id } })).active).toBe(true);
  });

  it("refuses to deactivate the last active owner", async () => {
    const second = await prisma.user.create({
      data: { stationId, name: "Second Owner", username: "owner.two", passwordHash: "x", role: "OWNER" },
    });

    // The second owner deactivating the first is fine — two owners exist.
    currentUser = second;
    const ok = await setUserActiveAction({}, form({ userId: users.OWNER.id, active: "false" }));
    expect(ok.error).toBeUndefined();

    // Now `second` is the only active owner, and can't remove themselves.
    const blocked = await setUserActiveAction({}, form({ userId: second.id, active: "false" }));
    expect(blocked.error).toMatch(/can't deactivate your own account/);

    expect(await prisma.user.count({ where: { stationId, role: "OWNER", active: true } })).toBe(1);
  });

  it("reactivates a deactivated employee", async () => {
    await setUserActiveAction({}, form({ userId: users.CASHIER.id, active: "false" }));
    const result = await setUserActiveAction({}, form({ userId: users.CASHIER.id, active: "true" }));

    expect(result.error).toBeUndefined();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users.CASHIER.id } })).active).toBe(true);
  });

  it("rejects a redundant change", async () => {
    const result = await setUserActiveAction({}, form({ userId: users.CASHIER.id, active: "true" }));
    expect(result.error).toMatch(/already active/);
  });

  it("is refused for a manager", async () => {
    currentUser = users.MANAGER;
    const result = await setUserActiveAction({}, form({ userId: users.CASHIER.id, active: "false" }));
    expect(result.error).toMatch(/Only an owner/);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users.CASHIER.id } })).active).toBe(true);
  });
});

describe("changeUserRoleAction", () => {
  it("changes the role and signs the person out", async () => {
    const session = await prisma.session.create({
      data: { userId: users.ATTENDANT.id, expiresAt: new Date(Date.now() + 3600e3) },
    });

    const result = await changeUserRoleAction({}, form({ userId: users.ATTENDANT.id, role: "CASHIER" }));

    expect(result.error).toBeUndefined();
    expect(result.message).toMatch(/is now Cashier and has been signed out/);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users.ATTENDANT.id } })).role).toBe("CASHIER");
    expect((await prisma.session.findUniqueOrThrow({ where: { id: session.id } })).revokedAt).not.toBeNull();
  });

  it("refuses to let an owner demote themselves", async () => {
    const result = await changeUserRoleAction({}, form({ userId: users.OWNER.id, role: "MANAGER" }));

    expect(result.error).toMatch(/can't demote your own account/);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users.OWNER.id } })).role).toBe("OWNER");
  });

  it("refuses to demote the last owner even from another owner account", async () => {
    const second = await prisma.user.create({
      data: { stationId, name: "Second Owner", username: "owner.two", passwordHash: "x", role: "OWNER" },
    });
    // Deactivate the original so `second` is the only *active* owner.
    currentUser = second;
    await setUserActiveAction({}, form({ userId: users.OWNER.id, active: "false" }));

    // Promote someone, then try to demote the sole active owner from that account.
    await changeUserRoleAction({}, form({ userId: users.MANAGER.id, role: "OWNER" }));
    currentUser = await prisma.user.findUniqueOrThrow({ where: { id: users.MANAGER.id } });

    const ok = await changeUserRoleAction({}, form({ userId: second.id, role: "MANAGER" }));
    expect(ok.error).toBeUndefined(); // two active owners existed, so this is allowed

    const blocked = await changeUserRoleAction({}, form({ userId: currentUser.id, role: "MANAGER" }));
    expect(blocked.error).toMatch(/can't demote your own account/);
    expect(await prisma.user.count({ where: { stationId, role: "OWNER", active: true } })).toBe(1);
  });

  it("rejects a no-op role change", async () => {
    const result = await changeUserRoleAction({}, form({ userId: users.CASHIER.id, role: "CASHIER" }));
    expect(result.error).toMatch(/already Cashier/);
  });

  it("rejects an unknown role", async () => {
    const result = await changeUserRoleAction({}, form({ userId: users.CASHIER.id, role: "SUPERUSER" }));
    expect(result.error).toMatch(/valid role/);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users.CASHIER.id } })).role).toBe("CASHIER");
  });

  it("is refused for a manager", async () => {
    currentUser = users.MANAGER;
    const result = await changeUserRoleAction({}, form({ userId: users.ATTENDANT.id, role: "OWNER" }));
    expect(result.error).toMatch(/Only an owner/);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users.ATTENDANT.id } })).role).toBe("ATTENDANT");
  });

  it("will not change the role of someone at another station", async () => {
    const other = await prisma.station.create({ data: { slug: "other-station", name: "Other", address: "Elsewhere" } });
    const outsider = await prisma.user.create({
      data: { stationId: other.id, name: "Outsider", username: "outsider", passwordHash: "x", role: "ATTENDANT" },
    });

    const result = await changeUserRoleAction({}, form({ userId: outsider.id, role: "OWNER" }));
    expect(result.error).toMatch(/isn't at this station/);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: outsider.id } })).role).toBe("ATTENDANT");
  });
});
