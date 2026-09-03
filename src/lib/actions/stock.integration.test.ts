/**
 * Integration tests for the stock transactions — the real Server Actions,
 * the real Prisma client, a real (throwaway) SQLite database. Same approach
 * as sales.integration.test.ts: only `requireUser()` and `revalidatePath()`
 * are stubbed, because both are request-scoped Next.js concerns.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { User } from "@prisma/client";

/**
 * There's one real `Role` value now ("OWNER" — every login has full
 * access, see @/lib/permissions). These labels aren't roles in that
 * sense; they're just names for four distinct test actors. Every one of
 * them is created with the real `role: "OWNER"`.
 */
type ActorLabel = "OWNER" | "MANAGER" | "CASHIER" | "ATTENDANT";

const testDir = mkdtempSync(path.join(tmpdir(), "fsm-stock-"));
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
const { updateFuelRateAction, recordDeliveryAction } = await import("@/lib/actions/stock");
const { Prisma } = await import("@prisma/client");
const D = (v: string | number) => new Prisma.Decimal(v);

let stationId: string;
let tankId: string;
const users: Record<ActorLabel, User> = {} as Record<ActorLabel, User>;

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

  for (const label of ["OWNER", "MANAGER", "CASHIER", "ATTENDANT"] as ActorLabel[]) {
    users[label] = await prisma.user.create({
      data: { stationId, name: label, username: label.toLowerCase() + ".user", passwordHash: "x", role: "OWNER" },
    });
  }
  currentUser = users.MANAGER;

  // 10 000 L capacity holding 6 000 L -> 4 000 L of room.
  const tank = await prisma.tank.create({
    data: { stationId, fuel: "PETROL", capacityL: D(10000), levelL: D(6000), openingL: D(6000), ratePerL: D("100.00") },
  });
  tankId = tank.id;
});

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const delivery = (over: Record<string, string> = {}) =>
  form({
    tankId,
    liters: "1000",
    totalCost: "95000",
    supplier: "Nepal Oil Corp.",
    ...over,
  });

const reprice = (over: Record<string, string> = {}) =>
  form({ tankId, newRate: "105.00", expectedRate: "100.00", ...over });

/* ------------------------------------------------------------------ */

describe("recordDeliveryAction — the happy path", () => {
  it("adds the fuel to the tank and records the purchase", async () => {
    const result = await recordDeliveryAction({}, delivery());

    expect(result.error).toBeUndefined();
    expect(result.message).toMatch(/1,000 L of Petrol received for Rs 95,000/);

    const tank = await prisma.tank.findUniqueOrThrow({ where: { id: tankId } });
    expect(tank.levelL.toString()).toBe("7000");

    const purchase = await prisma.purchase.findFirstOrThrow();
    expect(purchase.liters.toString()).toBe("1000");
    expect(purchase.totalCost.toString()).toBe("95000");
    expect(purchase.supplier).toBe("Nepal Oil Corp.");
    expect(purchase.recordedById).toBe(users.MANAGER.id);
  });

  it("stores the optional invoice number, and null when it's blank", async () => {
    await recordDeliveryAction({}, delivery({ invoiceNo: "NOC-4821" }));
    expect((await prisma.purchase.findFirstOrThrow()).invoiceNo).toBe("NOC-4821");

    await prisma.purchase.deleteMany();
    await recordDeliveryAction({}, delivery({ invoiceNo: "" }));
    expect((await prisma.purchase.findFirstOrThrow()).invoiceNo).toBeNull();
  });

  it("fills a tank to exactly capacity", async () => {
    const result = await recordDeliveryAction({}, delivery({ liters: "4000" }));
    expect(result.error).toBeUndefined();

    const tank = await prisma.tank.findUniqueOrThrow({ where: { id: tankId } });
    expect(tank.levelL.toString()).toBe("10000");
  });

  it("writes the derived cost per litre into the audit trail", async () => {
    await recordDeliveryAction({}, delivery({ liters: "1000", totalCost: "95000" }));
    const log = await prisma.auditLog.findFirstOrThrow({ where: { action: "DELIVERY_RECORDED" } });
    expect(log.metadata).toMatchObject({ costPerLiter: "95", tankLevelAfter: "7000" });
  });

  it("accumulates across several deliveries without drift", async () => {
    await recordDeliveryAction({}, delivery({ liters: "1000.5", totalCost: "95047.5" }));
    await recordDeliveryAction({}, delivery({ liters: "999.25", totalCost: "94928.75" }));

    const tank = await prisma.tank.findUniqueOrThrow({ where: { id: tankId } });
    expect(tank.levelL.toString()).toBe("7999.75");
  });
});

describe("recordDeliveryAction — capacity protection", () => {
  it("refuses a delivery that would overfill the tank, and stores nothing", async () => {
    const result = await recordDeliveryAction({}, delivery({ liters: "4001" }));

    expect(result.error).toMatch(/won't fit/);
    expect(result.error).toMatch(/4,000 L of room/);
    expect(await prisma.purchase.count()).toBe(0);

    const tank = await prisma.tank.findUniqueOrThrow({ where: { id: tankId } });
    expect(tank.levelL.toString()).toBe("6000");
  });

  it("refuses any delivery into an already-full tank", async () => {
    await prisma.tank.update({ where: { id: tankId }, data: { levelL: D(10000) } });
    const result = await recordDeliveryAction({}, delivery({ liters: "1" }));

    expect(result.error).toMatch(/won't fit/);
    expect(await prisma.purchase.count()).toBe(0);
  });

  it("rejects a negative volume rather than draining the tank", async () => {
    const result = await recordDeliveryAction({}, delivery({ liters: "-1000" }));

    expect(result.error).toMatch(/greater than zero/);
    expect(await prisma.purchase.count()).toBe(0);
    expect((await prisma.tank.findUniqueOrThrow({ where: { id: tankId } })).levelL.toString()).toBe("6000");
  });

  it("rejects a negative invoice total", async () => {
    const result = await recordDeliveryAction({}, delivery({ totalCost: "-95000" }));
    expect(result.error).toMatch(/valid invoice total/);
    expect(await prisma.purchase.count()).toBe(0);
  });

  it("requires a supplier name", async () => {
    const result = await recordDeliveryAction({}, delivery({ supplier: "" }));
    expect(result.error).toMatch(/supplier/i);
    expect(await prisma.purchase.count()).toBe(0);
  });

  it("will not deliver into a tank at another station", async () => {
    const other = await prisma.station.create({ data: { slug: "other-station", name: "Other", address: "Elsewhere" } });
    const foreign = await prisma.tank.create({
      data: { stationId: other.id, fuel: "DIESEL", capacityL: D(9000), levelL: D(0), openingL: D(0), ratePerL: D("90") },
    });

    const result = await recordDeliveryAction({}, delivery({ tankId: foreign.id }));
    expect(result.error).toMatch(/isn't available at this station/);
    expect((await prisma.tank.findUniqueOrThrow({ where: { id: foreign.id } })).levelL.toString()).toBe("0");
  });

  it("isn't restricted to an owner or manager — any login can record a delivery", async () => {
    for (const label of ["CASHIER", "ATTENDANT"] as const) {
      currentUser = users[label];
      const result = await recordDeliveryAction({}, delivery());
      expect(result.error, label).toBeUndefined();
    }
    expect(await prisma.purchase.count()).toBe(2);
  });
});

describe("updateFuelRateAction", () => {
  it("changes the rate and records who did it", async () => {
    const result = await updateFuelRateAction({}, reprice());

    expect(result.error).toBeUndefined();
    expect(result.message).toMatch(/Petrol repriced from Rs 100\.00 to Rs 105\.00/);

    const tank = await prisma.tank.findUniqueOrThrow({ where: { id: tankId } });
    expect(tank.ratePerL.toString()).toBe("105");

    const history = await prisma.fuelRateHistory.findFirstOrThrow();
    expect(history.oldRate.toString()).toBe("100");
    expect(history.newRate.toString()).toBe("105");
    expect(history.changedById).toBe(users.MANAGER.id);
  });

  it("records the change in the audit trail with its percentage", async () => {
    await updateFuelRateAction({}, reprice({ newRate: "110.00" }));
    const log = await prisma.auditLog.findFirstOrThrow({ where: { action: "FUEL_RATE_CHANGED" } });
    expect(log.metadata).toMatchObject({ oldRate: "100", newRate: "110", changePct: "10" });
  });

  it("refuses if someone else repriced the fuel in the meantime", async () => {
    await prisma.tank.update({ where: { id: tankId }, data: { ratePerL: D("102.00") } });

    const result = await updateFuelRateAction({}, reprice());
    expect(result.error).toMatch(/Someone else changed the Petrol rate to Rs 102\.00/);

    const tank = await prisma.tank.findUniqueOrThrow({ where: { id: tankId } });
    expect(tank.ratePerL.toString()).toBe("102");
    expect(await prisma.fuelRateHistory.count()).toBe(0);
  });

  it("rejects a no-op change rather than writing an empty history row", async () => {
    const result = await updateFuelRateAction({}, reprice({ newRate: "100.00" }));
    expect(result.error).toMatch(/already the current rate/);
    expect(await prisma.fuelRateHistory.count()).toBe(0);
  });

  it("rejects a zero or negative rate", async () => {
    for (const bad of ["0", "-10"]) {
      const result = await updateFuelRateAction({}, reprice({ newRate: bad }));
      expect(result.error, bad).toMatch(/greater than zero/);
    }
    expect((await prisma.tank.findUniqueOrThrow({ where: { id: tankId } })).ratePerL.toString()).toBe("100");
  });

  it("rejects a slipped decimal point", async () => {
    const result = await updateFuelRateAction({}, reprice({ newRate: "100000" }));
    expect(result.error).toMatch(/misplaced decimal/);
    expect((await prisma.tank.findUniqueOrThrow({ where: { id: tankId } })).ratePerL.toString()).toBe("100");
  });

  it("blocks a large change until it is explicitly confirmed", async () => {
    // +25% — beyond the 20% threshold.
    const blocked = await updateFuelRateAction({}, reprice({ newRate: "125.00" }));
    expect(blocked.error).toMatch(/25% change/);
    expect((await prisma.tank.findUniqueOrThrow({ where: { id: tankId } })).ratePerL.toString()).toBe("100");

    const confirmed = await updateFuelRateAction({}, reprice({ newRate: "125.00", confirmedLarge: "yes" }));
    expect(confirmed.error).toBeUndefined();
    expect((await prisma.tank.findUniqueOrThrow({ where: { id: tankId } })).ratePerL.toString()).toBe("125");
  });

  it("enforces the confirmation server-side even if the client omits it", async () => {
    // A forged request that simply leaves the checkbox field out entirely.
    const forged = form({ tankId, newRate: "50.00", expectedRate: "100.00" });
    const result = await updateFuelRateAction({}, forged);
    expect(result.error).toMatch(/-50% change/);
    expect((await prisma.tank.findUniqueOrThrow({ where: { id: tankId } })).ratePerL.toString()).toBe("100");
  });

  it("allows a change just under the confirmation threshold without a prompt", async () => {
    const result = await updateFuelRateAction({}, reprice({ newRate: "119.00" }));
    expect(result.error).toBeUndefined();
    expect((await prisma.tank.findUniqueOrThrow({ where: { id: tankId } })).ratePerL.toString()).toBe("119");
  });

  it("isn't restricted to an owner or manager — any login can reprice", async () => {
    currentUser = users.CASHIER;
    const first = await updateFuelRateAction({}, reprice({ newRate: "105.00", expectedRate: "100.00" }));
    expect(first.error).toBeUndefined();

    currentUser = users.ATTENDANT;
    const second = await updateFuelRateAction({}, reprice({ newRate: "110.00", expectedRate: "105.00" }));
    expect(second.error).toBeUndefined();

    expect((await prisma.tank.findUniqueOrThrow({ where: { id: tankId } })).ratePerL.toString()).toBe("110");
  });

  it("will not reprice a tank at another station", async () => {
    const other = await prisma.station.create({ data: { slug: "other-station", name: "Other", address: "Elsewhere" } });
    const foreign = await prisma.tank.create({
      data: { stationId: other.id, fuel: "DIESEL", capacityL: D(9000), levelL: D(0), openingL: D(0), ratePerL: D("90") },
    });

    currentUser = users.OWNER;
    const result = await updateFuelRateAction({}, form({ tankId: foreign.id, newRate: "95", expectedRate: "90" }));
    expect(result.error).toMatch(/isn't available at this station/);
    expect((await prisma.tank.findUniqueOrThrow({ where: { id: foreign.id } })).ratePerL.toString()).toBe("90");
  });
});

describe("rate changes and past sales", () => {
  it("never retroactively reprices a sale that already happened", async () => {
    const sale = await prisma.sale.create({
      data: {
        receiptNo: 1,
        stationId,
        tankId,
        fuel: "PETROL",
        liters: D(40),
        ratePerL: D("100.00"),
        totalAmount: D(4000),
        paymentMethod: "CASH",
        soldById: users.CASHIER.id,
      },
    });

    currentUser = users.MANAGER;
    await updateFuelRateAction({}, reprice({ newRate: "110.00" }));

    const after = await prisma.sale.findUniqueOrThrow({ where: { id: sale.id } });
    expect(after.ratePerL.toString()).toBe("100");
    expect(after.totalAmount.toString()).toBe("4000");
  });
});
