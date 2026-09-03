/**
 * Integration tests for the sale transaction — the real Server Action, the
 * real Prisma client, a real (throwaway) SQLite database.
 *
 * Only two things are stubbed, and both are request-scoped Next.js concerns
 * that can't exist outside a server render: `requireUser()` (which reads a
 * cookie) and `revalidatePath()`. Everything the money and stock depend on —
 * validation, the permission check, the guarded stock deduction, the credit
 * gate, receipt numbering, the audit trail — runs exactly as it does in
 * production.
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
 * sense; they're just names for four distinct test actors so tests can
 * attribute a sale/void to "whoever was logged in" without all sharing
 * one user row. Every one of them is created with the real `role: "OWNER"`.
 */
type ActorLabel = "OWNER" | "MANAGER" | "CASHIER" | "ATTENDANT";

// Point the Prisma singleton at a scratch database *before* src/lib/db.ts is
// imported anywhere — it reads DATABASE_URL at module load.
const testDir = mkdtempSync(path.join(tmpdir(), "fsm-sales-"));
const testDbPath = path.join(testDir, "test.db");
process.env.DATABASE_URL = "file:" + testDbPath;

// Whoever the current test says is logged in.
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
const { recordSaleAction, voidSaleAction } = await import("@/lib/actions/sales");
const { Prisma } = await import("@prisma/client");
const D = (v: string | number) => new Prisma.Decimal(v);

let stationId: string;
let petrolTankId: string;
let customerId: string;
const users: Record<ActorLabel, User> = {} as Record<ActorLabel, User>;

/** Builds the FormData the browser would post, so the action's parsing is exercised too. */
function saleForm(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

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
  // Order matters: children before parents.
  await prisma.auditLog.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.customerPayment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.fuelRateHistory.deleteMany();
  await prisma.tank.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.station.deleteMany();

  const station = await prisma.station.create({
    data: { slug: "test-station", name: "Test Station", address: "Test Rd", nextReceiptNo: 1 },
  });
  stationId = station.id;

  const actorLabels: ActorLabel[] = ["OWNER", "MANAGER", "CASHIER", "ATTENDANT"];
  for (const label of actorLabels) {
    users[label] = await prisma.user.create({
      data: {
        stationId,
        name: label + " User",
        username: label.toLowerCase() + ".user",
        passwordHash: "x",
        role: "OWNER",
      },
    });
  }
  currentUser = users.CASHIER;

  const tank = await prisma.tank.create({
    data: { stationId, fuel: "PETROL", capacityL: D(12000), levelL: D(1000), openingL: D(1000), ratePerL: D("100.00") },
  });
  petrolTankId = tank.id;

  const customer = await prisma.customer.create({
    data: { stationId, name: "Acme Transport", creditLimit: D(5000), dueAmount: D(1000) },
  });
  customerId = customer.id;
});

const cashSale = (over: Record<string, string> = {}) =>
  saleForm({
    tankId: petrolTankId,
    mode: "LITERS",
    quantity: "40",
    paymentMethod: "CASH",
    expectedRate: "100.00",
    ...over,
  });

describe("recordSaleAction — the happy path", () => {
  it("records the sale, bills volume x rate, and deducts the tank", async () => {
    const result = await recordSaleAction({}, cashSale());

    expect(result.error).toBeUndefined();
    expect(result.receipt?.total).toBe("Rs 4,000");
    expect(result.receipt?.receiptNo).toBe(1);

    const sale = await prisma.sale.findFirstOrThrow();
    expect(sale.liters.toString()).toBe("40");
    expect(sale.totalAmount.toString()).toBe("4000");
    expect(sale.soldById).toBe(users.CASHIER.id);

    const tank = await prisma.tank.findUniqueOrThrow({ where: { id: petrolTankId } });
    expect(tank.levelL.toString()).toBe("960");
  });

  it("writes an audit log entry for every sale", async () => {
    await recordSaleAction({}, cashSale());
    const log = await prisma.auditLog.findFirstOrThrow();
    expect(log.action).toBe("SALE_RECORDED");
    expect(log.actorId).toBe(users.CASHIER.id);
    expect(log.metadata).toMatchObject({ totalAmount: "4000", tankLevelAfter: "960" });
  });

  it("issues sequential, gap-free receipt numbers", async () => {
    const a = await recordSaleAction({}, cashSale({ quantity: "10" }));
    const b = await recordSaleAction({}, cashSale({ quantity: "10" }));
    const c = await recordSaleAction({}, cashSale({ quantity: "10" }));
    expect([a.receipt?.receiptNo, b.receipt?.receiptNo, c.receipt?.receiptNo]).toEqual([1, 2, 3]);
  });

  it("bills by rupee amount, rounding litres down so the customer is never short-changed", async () => {
    const result = await recordSaleAction({}, cashSale({ mode: "AMOUNT", quantity: "555" }));
    const sale = await prisma.sale.findFirstOrThrow();
    // 555 / 100 = 5.55 L exactly -> Rs 555
    expect(sale.liters.toString()).toBe("5.55");
    expect(sale.totalAmount.toString()).toBe("555");
    expect(result.receipt?.changeDue).toBeNull();
  });

  it("reports change due when cash tendered exceeds the bill", async () => {
    const result = await recordSaleAction({}, cashSale({ quantity: "10", cashTendered: "1500" }));
    expect(result.receipt?.total).toBe("Rs 1,000");
    expect(result.receipt?.changeDue).toBe("Rs 500");
  });
});

describe("recordSaleAction — stock protection", () => {
  it("refuses a sale larger than the tank holds and charges nothing", async () => {
    const result = await recordSaleAction({}, cashSale({ quantity: "1001" }));

    expect(result.error).toMatch(/Not enough Petrol/);
    expect(result.receipt).toBeUndefined();
    expect(await prisma.sale.count()).toBe(0);

    const tank = await prisma.tank.findUniqueOrThrow({ where: { id: petrolTankId } });
    expect(tank.levelL.toString()).toBe("1000");
  });

  it("lets a sale drain the tank to exactly zero, but not past it", async () => {
    const drain = await recordSaleAction({}, cashSale({ quantity: "1000" }));
    expect(drain.error).toBeUndefined();

    const empty = await prisma.tank.findUniqueOrThrow({ where: { id: petrolTankId } });
    expect(empty.levelL.toString()).toBe("0");

    const next = await recordSaleAction({}, cashSale({ quantity: "0.01" }));
    expect(next.error).toMatch(/Not enough Petrol/);
  });

  it("rolls the whole transaction back — no receipt number is burned on a failed sale", async () => {
    await recordSaleAction({}, cashSale({ quantity: "5000" }));
    const station = await prisma.station.findUniqueOrThrow({ where: { id: stationId } });
    expect(station.nextReceiptNo).toBe(1);
  });
});

describe("recordSaleAction — credit control", () => {
  const creditSale = (over: Record<string, string> = {}) =>
    cashSale({ paymentMethod: "CREDIT", customerId, ...over });

  it("charges the customer and raises their outstanding due", async () => {
    currentUser = users.MANAGER;
    const result = await recordSaleAction({}, creditSale({ quantity: "10" }));

    expect(result.error).toBeUndefined();
    const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    expect(customer.dueAmount.toString()).toBe("2000"); // 1000 existing + 1000 sale
  });

  it("refuses to push a customer past their credit limit, and returns the fuel", async () => {
    // Limit 5000, already owes 1000 -> 4000 of headroom. This is 4100.
    const result = await recordSaleAction({}, creditSale({ quantity: "41" }));

    expect(result.error).toMatch(/only Rs 4,000 of credit left/);
    expect(await prisma.sale.count()).toBe(0);

    const tank = await prisma.tank.findUniqueOrThrow({ where: { id: petrolTankId } });
    expect(tank.levelL.toString()).toBe("1000");

    const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    expect(customer.dueAmount.toString()).toBe("1000");
  });

  it("allows a sale for exactly the remaining headroom", async () => {
    const result = await recordSaleAction({}, creditSale({ quantity: "40" }));
    expect(result.error).toBeUndefined();
    const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    expect(customer.dueAmount.toString()).toBe("5000");
  });

  it("requires a customer to be named on a credit sale", async () => {
    const fd = cashSale({ paymentMethod: "CREDIT" });
    const result = await recordSaleAction({}, fd);
    expect(result.error).toMatch(/Choose the credit customer/);
    expect(await prisma.sale.count()).toBe(0);
  });

  it("will not bill a credit customer belonging to another station", async () => {
    const other = await prisma.station.create({ data: { slug: "other-station", name: "Other", address: "Elsewhere" } });
    const foreign = await prisma.customer.create({
      data: { stationId: other.id, name: "Foreign Co", creditLimit: D(99999), dueAmount: D(0) },
    });

    const result = await recordSaleAction({}, creditSale({ customerId: foreign.id }));
    expect(result.error).toMatch(/no longer exists/);
    expect(await prisma.sale.count()).toBe(0);
  });
});

describe("recordSaleAction — input and authorization", () => {
  it("refuses the sale if the pump rate moved while it was being keyed in", async () => {
    await prisma.tank.update({ where: { id: petrolTankId }, data: { ratePerL: D("110.00") } });

    const result = await recordSaleAction({}, cashSale());
    expect(result.error).toMatch(/rate changed to Rs 110\.00/);
    expect(await prisma.sale.count()).toBe(0);
  });

  it("rejects a negative quantity rather than adding stock and money", async () => {
    const result = await recordSaleAction({}, cashSale({ quantity: "-40" }));
    expect(result.error).toMatch(/greater than zero/);
    expect(await prisma.sale.count()).toBe(0);

    const tank = await prisma.tank.findUniqueOrThrow({ where: { id: petrolTankId } });
    expect(tank.levelL.toString()).toBe("1000");
  });

  it("rejects a non-numeric quantity", async () => {
    const result = await recordSaleAction({}, cashSale({ quantity: "forty" }));
    expect(result.error).toBeTruthy();
    expect(await prisma.sale.count()).toBe(0);
  });

  it("will not sell from a tank at another station", async () => {
    const other = await prisma.station.create({ data: { slug: "other-station", name: "Other", address: "Elsewhere" } });
    const foreignTank = await prisma.tank.create({
      data: { stationId: other.id, fuel: "DIESEL", capacityL: D(9000), levelL: D(9000), openingL: D(9000), ratePerL: D("100.00") },
    });

    const result = await recordSaleAction({}, cashSale({ tankId: foreignTank.id }));
    expect(result.error).toMatch(/isn't available at this station/);
    expect(await prisma.sale.count()).toBe(0);
  });

  it("lets any logged-in station account record a sale — access isn't role-gated", async () => {
    for (const label of ["OWNER", "MANAGER", "CASHIER", "ATTENDANT"] as const) {
      currentUser = users[label];
      const result = await recordSaleAction({}, cashSale({ quantity: "1" }));
      expect(result.error, label).toBeUndefined();
    }
  });
});

describe("voidSaleAction", () => {
  async function recordThenVoid(reason = "Wrong pump selected") {
    currentUser = users.CASHIER;
    const sale = await recordSaleAction({}, cashSale({ quantity: "40" }));
    const row = await prisma.sale.findFirstOrThrow();
    currentUser = users.MANAGER;
    const fd = new FormData();
    fd.set("saleId", row.id);
    fd.set("reason", reason);
    return { sale, rowId: row.id, result: await voidSaleAction({}, fd) };
  }

  it("returns the fuel to the tank and marks the sale voided", async () => {
    const { rowId, result } = await recordThenVoid();
    expect(result.error).toBeUndefined();

    const tank = await prisma.tank.findUniqueOrThrow({ where: { id: petrolTankId } });
    expect(tank.levelL.toString()).toBe("1000");

    const row = await prisma.sale.findUniqueOrThrow({ where: { id: rowId } });
    expect(row.voided).toBe(true);
    expect(row.voidReason).toBe("Wrong pump selected");
    expect(row.voidedAt).not.toBeNull();
  });

  it("reverses the customer's outstanding due on a credit sale", async () => {
    currentUser = users.CASHIER;
    await recordSaleAction({}, cashSale({ quantity: "10", paymentMethod: "CREDIT", customerId }));
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })).dueAmount.toString()).toBe("2000");

    const row = await prisma.sale.findFirstOrThrow();
    currentUser = users.OWNER;
    const fd = new FormData();
    fd.set("saleId", row.id);
    fd.set("reason", "Billed to the wrong account");
    await voidSaleAction({}, fd);

    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })).dueAmount.toString()).toBe("1000");
  });

  it("cannot be applied twice — a double-click will not refund the fuel again", async () => {
    const { rowId } = await recordThenVoid();
    const fd = new FormData();
    fd.set("saleId", rowId);
    fd.set("reason", "Double click");
    const second = await voidSaleAction({}, fd);

    expect(second.error).toMatch(/already voided/);
    const tank = await prisma.tank.findUniqueOrThrow({ where: { id: petrolTankId } });
    expect(tank.levelL.toString()).toBe("1000");
  });

  it("isn't restricted to an owner or manager — any login can void", async () => {
    currentUser = users.CASHIER;
    await recordSaleAction({}, cashSale({ quantity: "40" }));
    const row = await prisma.sale.findFirstOrThrow();

    currentUser = users.ATTENDANT;
    const fd = new FormData();
    fd.set("saleId", row.id);
    fd.set("reason", "Trying it on");
    const result = await voidSaleAction({}, fd);
    expect(result.error).toBeUndefined();

    expect((await prisma.sale.findUniqueOrThrow({ where: { id: row.id } })).voided).toBe(true);
  });

  it("insists on a reason, so the audit trail is never blank", async () => {
    currentUser = users.CASHIER;
    await recordSaleAction({}, cashSale({ quantity: "40" }));
    const row = await prisma.sale.findFirstOrThrow();

    currentUser = users.MANAGER;
    const fd = new FormData();
    fd.set("saleId", row.id);
    fd.set("reason", "  ");
    const result = await voidSaleAction({}, fd);
    expect(result.error).toMatch(/reason/i);
  });

  it("records the void in the audit trail", async () => {
    await recordThenVoid("Customer drove off");
    const log = await prisma.auditLog.findFirstOrThrow({ where: { action: "SALE_VOIDED" } });
    expect(log.metadata).toMatchObject({ reason: "Customer drove off", litersReturned: "40" });
  });

  it("will not void a sale belonging to another station", async () => {
    currentUser = users.CASHIER;
    await recordSaleAction({}, cashSale({ quantity: "40" }));
    const row = await prisma.sale.findFirstOrThrow();

    const other = await prisma.station.create({ data: { slug: "other-station", name: "Other", address: "Elsewhere" } });
    const intruder = await prisma.user.create({
      data: { stationId: other.id, name: "Intruder", username: "intruder", passwordHash: "x", role: "OWNER" },
    });
    currentUser = intruder;

    const fd = new FormData();
    fd.set("saleId", row.id);
    fd.set("reason", "Not mine to void");
    const result = await voidSaleAction({}, fd);

    expect(result.error).toMatch(/doesn't exist/);
    expect((await prisma.sale.findUniqueOrThrow({ where: { id: row.id } })).voided).toBe(false);
  });
});
