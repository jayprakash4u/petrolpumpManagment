/**
 * Multi-tenant isolation tests.
 *
 * One petrol pump is one tenant. These seed **two complete stations** with
 * deliberately overlapping data — the same staff username, the same customer
 * name, the same fuels, the same receipt numbers — and assert that nothing
 * from one is ever visible or mutable from the other.
 *
 * This is the suite that matters most in a SaaS: every other guarantee in
 * the app is worthless if Pump A can see Pump B's takings. Query scoping is
 * currently a discipline (every `where` remembers `stationId`), so it needs
 * a test that fails loudly the moment someone forgets.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { User } from "@prisma/client";

const testDir = mkdtempSync(path.join(tmpdir(), "fsm-tenancy-"));
const testDbPath = path.join(testDir, "test.db");
process.env.DATABASE_URL = "file:" + testDbPath;

let currentUser: User;

vi.mock("@/lib/dal", () => ({
  requireUser: async () => currentUser,
  getCurrentUser: async () => currentUser,
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

const { prisma } = await import("@/lib/db");
const { recordSaleAction } = await import("@/lib/actions/sales");
const { recordDeliveryAction, updateFuelRateAction } = await import("@/lib/actions/stock");
const { createUserAction } = await import("@/lib/actions/users");
const { recordPaymentAction } = await import("@/lib/actions/customers");
const { startShiftAction } = await import("@/lib/actions/shifts");
const { getDashboardData } = await import("@/lib/queries/dashboard");
const { getSalesPageData } = await import("@/lib/queries/sales");
const { getStockPageData } = await import("@/lib/queries/stock");
const { getEmployeesPageData } = await import("@/lib/queries/employees");
const { getCreditPageData } = await import("@/lib/queries/customers");
const { getReportData } = await import("@/lib/queries/reports");
const { presetRange } = await import("@/lib/reports");
const { Prisma } = await import("@prisma/client");
const D = (v: string | number) => new Prisma.Decimal(v);

/** The username deliberately shared by an owner at BOTH pumps. */
const SHARED_USERNAME = "shared.owner";

interface Tenant {
  stationId: string;
  owner: User;
  tankId: string;
  customerId: string;
}
let alpha: Tenant;
let beta: Tenant;

async function buildTenant(slug: string, name: string, rate: string, saleLiters: number): Promise<Tenant> {
  // nextReceiptNo starts at 2 because this fixture writes receipt #1 by hand
  // below; leaving it at 1 would make the next real sale collide with it on
  // @@unique([stationId, receiptNo]).
  const station = await prisma.station.create({
    data: { slug, name, address: name + " Rd", nextReceiptNo: 2 },
  });

  const owner = await prisma.user.create({
    data: { stationId: station.id, name: name + " Owner", username: SHARED_USERNAME, passwordHash: "x", role: "OWNER" },
  });

  const tank = await prisma.tank.create({
    data: {
      stationId: station.id,
      fuel: "PETROL",
      capacityL: D(20000),
      levelL: D(10000),
      openingL: D(10000),
      ratePerL: D(rate),
    },
  });

  // Same customer name at both pumps — a real possibility for a national firm.
  const customer = await prisma.customer.create({
    data: { stationId: station.id, name: "Acme Transport", creditLimit: D(50000), dueAmount: D(5000) },
  });

  // Both stations start their receipt numbering at 1, on purpose.
  await prisma.sale.create({
    data: {
      receiptNo: 1,
      stationId: station.id,
      tankId: tank.id,
      fuel: "PETROL",
      liters: D(saleLiters),
      ratePerL: D(rate),
      totalAmount: D(saleLiters).mul(D(rate)),
      paymentMethod: "CASH",
      soldById: owner.id,
      createdAt: new Date(),
    },
  });

  return { stationId: station.id, owner, tankId: tank.id, customerId: customer.id };
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

  // Alpha: 100 L @ 100 = 10 000.  Beta: 50 L @ 200 = 10 000 too, so a leak
  // can't hide behind a coincidentally equal total in one direction only.
  alpha = await buildTenant("alpha-pump", "Alpha", "100", 100);
  beta = await buildTenant("beta-pump", "Beta", "200", 50);
  currentUser = alpha.owner;
});

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

/* ------------------------------------------------------------------ */

describe("identity is per tenant", () => {
  it("lets the same username own an account at two different pumps", async () => {
    const both = await prisma.user.findMany({ where: { username: SHARED_USERNAME } });
    expect(both).toHaveLength(2);
    expect(new Set(both.map((u) => u.stationId)).size).toBe(2);
  });

  it("resolves a login identity by (station, username), not username alone", async () => {
    const atAlpha = await prisma.user.findUnique({
      where: { stationId_username: { stationId: alpha.stationId, username: SHARED_USERNAME } },
    });
    const atBeta = await prisma.user.findUnique({
      where: { stationId_username: { stationId: beta.stationId, username: SHARED_USERNAME } },
    });

    expect(atAlpha!.id).not.toBe(atBeta!.id);
    expect(atAlpha!.name).toBe("Alpha Owner");
    expect(atBeta!.name).toBe("Beta Owner");
  });

  it("still refuses a duplicate username within the same station", async () => {
    currentUser = alpha.owner;
    const dupe = await createUserAction(
      {},
      form({ name: "Impostor", username: SHARED_USERNAME, password: "supersecret", role: "OWNER" })
    );

    expect(dupe.error).toMatch(/already uses that username/);
    expect(await prisma.user.count({ where: { stationId: alpha.stationId, username: SHARED_USERNAME } })).toBe(1);
  });

  it("does not leak that a username exists at another pump", async () => {
    // Beta's owner adds a member of staff using a username already in use at
    // Alpha. It must succeed — and therefore reveal nothing about Alpha.
    currentUser = beta.owner;
    const result = await createUserAction(
      {},
      form({ name: "Beta Cashier", username: "shared.staff", password: "supersecret", role: "OWNER" })
    );
    expect(result.error).toBeUndefined();

    currentUser = alpha.owner;
    const sameAtAlpha = await createUserAction(
      {},
      form({ name: "Alpha Cashier", username: "shared.staff", password: "supersecret", role: "OWNER" })
    );
    expect(sameAtAlpha.error).toBeUndefined();

    expect(await prisma.user.count({ where: { username: "shared.staff" } })).toBe(2);
  });

  it("keeps station codes globally unique, since they are the tenant handle", async () => {
    await expect(
      prisma.station.create({ data: { slug: "alpha-pump", name: "Copycat", address: "X" } })
    ).rejects.toThrow();
  });
});

/* ------------------------------------------------------------------ */

describe("read paths never cross tenants", () => {
  it("dashboard shows only the caller's station", async () => {
    const a = await getDashboardData(alpha.stationId);
    const b = await getDashboardData(beta.stationId);

    expect(a.totalRevenue.toString()).toBe("10000");
    expect(b.totalRevenue.toString()).toBe("10000");
    expect(a.totalLiters.toString()).toBe("100");
    expect(b.totalLiters.toString()).toBe("50"); // would be 150 if tanks leaked
    expect(a.tanks).toHaveLength(1);
    expect(a.staffCount).toBe(1);
  });

  it("sales page lists only its own customers, tanks and receipts", async () => {
    const a = await getSalesPageData(alpha.stationId);
    expect(a.tanks).toHaveLength(1);
    expect(a.customers).toHaveLength(1);
    expect(a.recentSales).toHaveLength(1);
    expect(a.tanks[0].ratePerL).toBe("100"); // Beta's is 200
  });

  it("stock page shows only its own tanks", async () => {
    const b = await getStockPageData(beta.stationId);
    expect(b.tanks).toHaveLength(1);
    expect(b.tanks[0].ratePerL.toString()).toBe("200");
    expect(b.totalStockL.toString()).toBe("10000"); // not 20 000
  });

  it("employees page shows only its own staff", async () => {
    const a = await getEmployeesPageData(alpha.stationId, "today");
    expect(a.staff).toHaveLength(1);
    expect(a.staff[0].name).toBe("Alpha Owner");
    expect(a.stationRevenue.toString()).toBe("10000");
  });

  it("credit page shows only its own accounts, despite identical customer names", async () => {
    const a = await getCreditPageData(alpha.stationId);
    const b = await getCreditPageData(beta.stationId);

    expect(a.customers).toHaveLength(1);
    expect(b.customers).toHaveLength(1);
    expect(a.customers[0].id).not.toBe(b.customers[0].id);
    expect(a.totalOutstanding.toString()).toBe("5000"); // not 10 000
  });

  it("reports aggregate only the caller's station", async () => {
    const a = await getReportData(alpha.stationId, presetRange("today"));
    const b = await getReportData(beta.stationId, presetRange("today"));

    expect(a.revenue.toString()).toBe("10000");
    expect(b.revenue.toString()).toBe("10000");
    expect(a.liters.toString()).toBe("100");
    expect(b.liters.toString()).toBe("50");
    expect(a.saleCount).toBe(1);
    expect(a.staffRows).toHaveLength(1);
    expect(a.staffRows[0].name).toBe("Alpha Owner");
  });

  it("a customer ledger never shows another pump's sales", async () => {
    const a = await getCreditPageData(alpha.stationId, alpha.customerId);
    expect(a.selected!.id).toBe(alpha.customerId);
    // Passing Beta's id must not select it; it falls back to Alpha's own.
    const spoofed = await getCreditPageData(alpha.stationId, beta.customerId);
    expect(spoofed.selected!.id).toBe(alpha.customerId);
    expect(spoofed.customers.every((c) => c.id !== beta.customerId)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */

describe("write paths never cross tenants", () => {
  it("cannot sell from another pump's tank", async () => {
    currentUser = alpha.owner;
    const result = await recordSaleAction(
      {},
      form({ tankId: beta.tankId, mode: "LITERS", quantity: "10", paymentMethod: "CASH", expectedRate: "200" })
    );

    expect(result.error).toMatch(/isn't available at this station/);
    expect((await prisma.tank.findUniqueOrThrow({ where: { id: beta.tankId } })).levelL.toString()).toBe("10000");
  });

  it("cannot bill another pump's credit customer", async () => {
    currentUser = alpha.owner;
    const result = await recordSaleAction(
      {},
      form({
        tankId: alpha.tankId,
        mode: "LITERS",
        quantity: "10",
        paymentMethod: "CREDIT",
        customerId: beta.customerId,
        expectedRate: "100",
      })
    );

    expect(result.error).toMatch(/no longer exists/);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: beta.customerId } })).dueAmount.toString()).toBe("5000");
  });

  it("cannot take payment against another pump's account", async () => {
    currentUser = alpha.owner;
    const result = await recordPaymentAction({}, form({ customerId: beta.customerId, amount: "1000", expectedDue: "5000" }));

    expect(result.error).toMatch(/isn't at this station/);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: beta.customerId } })).dueAmount.toString()).toBe("5000");
    expect(await prisma.customerPayment.count()).toBe(0);
  });

  it("cannot deliver into another pump's tank", async () => {
    currentUser = alpha.owner;
    const result = await recordDeliveryAction(
      {},
      form({ tankId: beta.tankId, liters: "1000", totalCost: "95000", supplier: "NOC" })
    );

    expect(result.error).toMatch(/isn't available at this station/);
    expect((await prisma.tank.findUniqueOrThrow({ where: { id: beta.tankId } })).levelL.toString()).toBe("10000");
    expect(await prisma.purchase.count()).toBe(0);
  });

  it("cannot reprice another pump's fuel", async () => {
    currentUser = alpha.owner;
    const result = await updateFuelRateAction({}, form({ tankId: beta.tankId, newRate: "1", expectedRate: "200" }));

    expect(result.error).toMatch(/isn't available at this station/);
    expect((await prisma.tank.findUniqueOrThrow({ where: { id: beta.tankId } })).ratePerL.toString()).toBe("200");
  });

  it("cannot start a shift for another pump's staff", async () => {
    currentUser = alpha.owner;
    const result = await startShiftAction({}, form({ userId: beta.owner.id }));

    expect(result.error).toMatch(/isn't at this station/);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: beta.owner.id } })).onShift).toBe(false);
  });

  it("a new employee always lands at the creator's station, whatever the form says", async () => {
    currentUser = alpha.owner;
    // stationId is never read from the form — this extra field must be ignored.
    await createUserAction(
      {},
      form({
        name: "Planted",
        username: "planted",
        password: "supersecret",
        role: "OWNER",
        stationId: beta.stationId,
      })
    );

    const planted = await prisma.user.findFirstOrThrow({ where: { username: "planted" } });
    expect(planted.stationId).toBe(alpha.stationId);
  });
});

/* ------------------------------------------------------------------ */

describe("per-tenant sequences", () => {
  it("gives each pump its own receipt numbering", async () => {
    currentUser = alpha.owner;
    await recordSaleAction(
      {},
      form({ tankId: alpha.tankId, mode: "LITERS", quantity: "5", paymentMethod: "CASH", expectedRate: "100" })
    );

    currentUser = beta.owner;
    await recordSaleAction(
      {},
      form({ tankId: beta.tankId, mode: "LITERS", quantity: "5", paymentMethod: "CASH", expectedRate: "200" })
    );

    const aReceipts = (await prisma.sale.findMany({ where: { stationId: alpha.stationId } })).map((s) => s.receiptNo);
    const bReceipts = (await prisma.sale.findMany({ where: { stationId: beta.stationId } })).map((s) => s.receiptNo);

    // Both pumps legitimately hold receipts #1 and #2 — uniqueness is per station.
    expect(aReceipts.sort()).toEqual([1, 2]);
    expect(bReceipts.sort()).toEqual([1, 2]);
  });

  it("keeps audit trails separate", async () => {
    currentUser = alpha.owner;
    await recordSaleAction(
      {},
      form({ tankId: alpha.tankId, mode: "LITERS", quantity: "5", paymentMethod: "CASH", expectedRate: "100" })
    );

    const aLogs = await prisma.auditLog.findMany({ where: { stationId: alpha.stationId } });
    const bLogs = await prisma.auditLog.findMany({ where: { stationId: beta.stationId } });

    expect(aLogs).toHaveLength(1);
    expect(bLogs).toHaveLength(0);
    expect(aLogs[0].actorId).toBe(alpha.owner.id);
  });
});
