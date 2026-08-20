/**
 * Integration tests for the report aggregation, against a real (throwaway)
 * SQLite database seeded with a dataset whose totals are known by hand.
 *
 * A report is only worth having if its numbers are right, and the failure
 * mode is silent — a wrong total looks exactly like a right one. So these
 * assert exact figures rather than shapes, and pay particular attention to
 * the range boundaries and the exclusion of voided sales.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const testDir = mkdtempSync(path.join(tmpdir(), "fsm-reports-"));
const testDbPath = path.join(testDir, "test.db");
process.env.DATABASE_URL = "file:" + testDbPath;

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

const { prisma } = await import("@/lib/db");
const { getReportData } = await import("@/lib/queries/reports");
const { resolveRange, presetRange, startOfDay, endOfDay } = await import("@/lib/reports");
const { Prisma } = await import("@prisma/client");
const D = (v: string | number) => new Prisma.Decimal(v);

let stationId: string;
let petrolTankId: string;
let dieselTankId: string;
let rameshId: string;
let sitaId: string;

/** Local midnight `n` days before today — the same basis the range logic uses. */
function daysAgo(n: number, hour = 12): Date {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

beforeAll(async () => {
  execFileSync("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"], {
    env: { ...process.env, DATABASE_URL: "file:" + testDbPath },
    stdio: "pipe",
    shell: process.platform === "win32",
  });

  const station = await prisma.station.create({ data: { slug: "report-station", name: "Report Station", address: "Test Rd" } });
  stationId = station.id;

  const ramesh = await prisma.user.create({
    data: { stationId, name: "Ramesh", username: "ramesh", passwordHash: "x", role: "ATTENDANT" },
  });
  const sita = await prisma.user.create({
    data: { stationId, name: "Sita", username: "sita", passwordHash: "x", role: "CASHIER" },
  });
  rameshId = ramesh.id;
  sitaId = sita.id;

  const petrol = await prisma.tank.create({
    data: { stationId, fuel: "PETROL", capacityL: D(20000), levelL: D(10000), openingL: D(10000), ratePerL: D(100) },
  });
  const diesel = await prisma.tank.create({
    data: { stationId, fuel: "DIESEL", capacityL: D(20000), levelL: D(10000), openingL: D(10000), ratePerL: D(90) },
  });
  petrolTankId = petrol.id;
  dieselTankId = diesel.id;

  const customer = await prisma.customer.create({
    data: { stationId, name: "Acme", creditLimit: D(100000), dueAmount: D(0) },
  });

  let receiptNo = 1;
  const sale = async (opts: {
    tankId: string;
    fuel: "PETROL" | "DIESEL";
    liters: number;
    rate: number;
    soldById: string;
    at: Date;
    payment?: "CASH" | "CREDIT";
    voided?: boolean;
  }) => {
    const total = D(opts.liters).mul(opts.rate);
    return prisma.sale.create({
      data: {
        receiptNo: receiptNo++,
        stationId,
        tankId: opts.tankId,
        fuel: opts.fuel,
        liters: D(opts.liters),
        ratePerL: D(opts.rate),
        totalAmount: total,
        paymentMethod: opts.payment ?? "CASH",
        customerId: opts.payment === "CREDIT" ? customer.id : null,
        soldById: opts.soldById,
        createdAt: opts.at,
        voided: opts.voided ?? false,
        voidedAt: opts.voided ? opts.at : null,
        voidReason: opts.voided ? "test void" : null,
      },
    });
  };

  // ---- TODAY: petrol 100 L @100 = 10 000 cash (Ramesh)
  //             diesel  50 L @ 90 =  4 500 credit (Sita)
  //             petrol  20 L @100 =  2 000 VOIDED (Ramesh)
  await sale({ tankId: petrolTankId, fuel: "PETROL", liters: 100, rate: 100, soldById: rameshId, at: daysAgo(0, 9) });
  await sale({ tankId: dieselTankId, fuel: "DIESEL", liters: 50, rate: 90, soldById: sitaId, at: daysAgo(0, 14), payment: "CREDIT" });
  await sale({ tankId: petrolTankId, fuel: "PETROL", liters: 20, rate: 100, soldById: rameshId, at: daysAgo(0, 16), voided: true });

  // ---- 2 DAYS AGO: petrol 30 L @100 = 3 000 cash (Sita)
  await sale({ tankId: petrolTankId, fuel: "PETROL", liters: 30, rate: 100, soldById: sitaId, at: daysAgo(2, 11) });

  // ---- 10 DAYS AGO (outside a 7-day window): diesel 200 L @90 = 18 000 cash (Ramesh)
  await sale({ tankId: dieselTankId, fuel: "DIESEL", liters: 200, rate: 90, soldById: rameshId, at: daysAgo(10, 10) });

  // Boundary probes: the very first and last instants of today.
  await sale({ tankId: petrolTankId, fuel: "PETROL", liters: 1, rate: 100, soldById: rameshId, at: startOfDay(new Date()) });
  await sale({ tankId: petrolTankId, fuel: "PETROL", liters: 2, rate: 100, soldById: rameshId, at: endOfDay(new Date()) });

  await prisma.purchase.create({
    data: {
      stationId,
      tankId: petrolTankId,
      fuel: "PETROL",
      liters: D(5000),
      totalCost: D(475000),
      supplier: "NOC",
      recordedById: sita.id,
      createdAt: daysAgo(0, 8),
    },
  });

  await prisma.customerPayment.create({
    data: { customerId: customer.id, amount: D(2500), recordedById: sita.id, createdAt: daysAgo(0, 15) },
  });
}, 180_000);

afterAll(async () => {
  await prisma.$disconnect();
  rmSync(testDir, { recursive: true, force: true });
});

/* ------------------------------------------------------------------ */

describe("today's report", () => {
  it("totals only today's non-voided sales", async () => {
    const data = await getReportData(stationId, presetRange("today"));

    // 10 000 + 4 500 + 100 (first instant) + 200 (last instant) = 14 800
    expect(data.revenue.toString()).toBe("14800");
    // 100 + 50 + 1 + 2 = 153 L
    expect(data.liters.toString()).toBe("153");
    expect(data.saleCount).toBe(4);
  });

  it("includes sales at the very first and very last instant of the day", async () => {
    const data = await getReportData(stationId, presetRange("today"));
    // Both boundary sales are counted above; if either boundary were exclusive
    // the revenue would be 14 700 or 14 600 instead.
    expect(data.revenue.toString()).toBe("14800");
  });

  it("excludes voided sales from revenue but reports them separately", async () => {
    const data = await getReportData(stationId, presetRange("today"));
    expect(data.voidedCount).toBe(1);
    expect(data.voidedValue.toString()).toBe("2000");
    // The voided 2 000 must not appear in revenue.
    expect(data.revenue.toString()).toBe("14800");
  });

  it("splits cash and credit, and they sum to revenue", async () => {
    const data = await getReportData(stationId, presetRange("today"));
    expect(data.credit.toString()).toBe("4500");
    expect(data.cash.toString()).toBe("10300"); // 10 000 + 100 + 200
    expect(data.cash.add(data.credit).equals(data.revenue)).toBe(true);
  });

  it("derives the average sale from the same totals", async () => {
    const data = await getReportData(stationId, presetRange("today"));
    expect(data.averageSale?.toString()).toBe("3700"); // 14 800 / 4
  });

  it("reports revenue per day for a one-day window as the day's revenue", async () => {
    const data = await getReportData(stationId, presetRange("today"));
    expect(data.totalDays).toBe(1);
    expect(data.dailyAverage.toString()).toBe("14800");
  });
});

describe("fuel-wise breakdown", () => {
  it("splits revenue and volume by fuel", async () => {
    const data = await getReportData(stationId, presetRange("today"));
    const petrol = data.fuelRows.find((f) => f.fuel === "PETROL")!;
    const diesel = data.fuelRows.find((f) => f.fuel === "DIESEL")!;

    expect(petrol.revenue.toString()).toBe("10300");
    expect(petrol.liters.toString()).toBe("103");
    expect(diesel.revenue.toString()).toBe("4500");
    expect(diesel.liters.toString()).toBe("50");
  });

  it("lists every fuel, including one with no sales", async () => {
    const data = await getReportData(stationId, presetRange("today"));
    const cng = data.fuelRows.find((f) => f.fuel === "CNG")!;
    expect(cng).toBeDefined();
    expect(cng.revenue.toString()).toBe("0");
    expect(cng.saleCount).toBe(0);
    expect(cng.avgRate).toBeNull();
  });

  it("derives the realised rate per litre from revenue / volume", async () => {
    const data = await getReportData(stationId, presetRange("today"));
    expect(data.fuelRows.find((f) => f.fuel === "PETROL")!.avgRate?.toString()).toBe("100");
    expect(data.fuelRows.find((f) => f.fuel === "DIESEL")!.avgRate?.toString()).toBe("90");
  });

  it("fuel revenues sum to total revenue", async () => {
    const data = await getReportData(stationId, presetRange("today"));
    const sum = data.fuelRows.reduce((acc, f) => acc.add(f.revenue), D(0));
    expect(sum.equals(data.revenue)).toBe(true);
  });

  it("shares sum to 100% when there is revenue", async () => {
    const data = await getReportData(stationId, presetRange("today"));
    const shareSum = data.fuelRows.reduce((acc, f) => acc.add(f.sharePct), D(0));
    expect(Math.round(shareSum.toNumber())).toBe(100);
  });

  it("attaches purchases to the matching fuel", async () => {
    const data = await getReportData(stationId, presetRange("today"));
    const petrol = data.fuelRows.find((f) => f.fuel === "PETROL")!;
    expect(petrol.purchasedL.toString()).toBe("5000");
    expect(petrol.avgCost?.toString()).toBe("95");
    expect(data.fuelRows.find((f) => f.fuel === "DIESEL")!.purchasedL.toString()).toBe("0");
  });
});

describe("staff-wise breakdown", () => {
  it("attributes revenue to the person who sold it", async () => {
    const data = await getReportData(stationId, presetRange("today"));
    const ramesh = data.staffRows.find((s) => s.id === rameshId)!;
    const sita = data.staffRows.find((s) => s.id === sitaId)!;

    expect(ramesh.revenue.toString()).toBe("10300"); // 10 000 + 100 + 200, void excluded
    expect(ramesh.saleCount).toBe(3);
    expect(sita.revenue.toString()).toBe("4500");
    expect(sita.saleCount).toBe(1);
  });

  it("ranks by revenue, highest first", async () => {
    const data = await getReportData(stationId, presetRange("today"));
    expect(data.staffRows[0].id).toBe(rameshId);
  });

  it("resolves names and roles", async () => {
    const data = await getReportData(stationId, presetRange("today"));
    expect(data.staffRows.find((s) => s.id === sitaId)!.name).toBe("Sita");
    expect(data.staffRows.find((s) => s.id === sitaId)!.role).toBe("CASHIER");
  });

  it("staff revenues sum to total revenue", async () => {
    const data = await getReportData(stationId, presetRange("today"));
    const sum = data.staffRows.reduce((acc, s) => acc.add(s.revenue), D(0));
    expect(sum.equals(data.revenue)).toBe(true);
  });

  it("omits staff who sold nothing in the window", async () => {
    const data = await getReportData(stationId, presetRange("yesterday"));
    expect(data.staffRows).toHaveLength(0);
  });
});

describe("date ranges", () => {
  it("yesterday is genuinely empty in this dataset", async () => {
    const data = await getReportData(stationId, presetRange("yesterday"));
    expect(data.saleCount).toBe(0);
    expect(data.revenue.toString()).toBe("0");
    expect(data.averageSale).toBeNull();
  });

  it("a 7-day window picks up the sale from 2 days ago but not the one from 10", async () => {
    const data = await getReportData(stationId, presetRange("7d"));
    // today 14 800 + 3 000 from 2 days ago
    expect(data.revenue.toString()).toBe("17800");
    expect(data.saleCount).toBe(5);
  });

  it("a 30-day window includes the 10-day-old sale", async () => {
    const data = await getReportData(stationId, presetRange("30d"));
    // 17 800 + 18 000
    expect(data.revenue.toString()).toBe("35800");
    expect(data.saleCount).toBe(6);
  });

  it("averages revenue across the whole window, including quiet days", async () => {
    const data = await getReportData(stationId, presetRange("7d"));
    expect(data.totalDays).toBe(7);
    // 17 800 / 7 = 2542.857... -> 2542.86
    expect(data.dailyAverage.toString()).toBe("2542.86");
  });

  it("a custom range that ends before the data returns nothing", async () => {
    const range = resolveRange(undefined, "2000-01-01", "2000-01-31");
    const data = await getReportData(stationId, range);
    expect(data.saleCount).toBe(0);
    expect(data.revenue.toString()).toBe("0");
  });
});

describe("daily trend", () => {
  it("emits one point per day in the range, including quiet days as zero", async () => {
    const data = await getReportData(stationId, presetRange("7d"));
    expect(data.trend).toHaveLength(7);
    expect(data.trend.filter((t) => t.revenue === 0).length).toBe(5);
  });

  it("puts each day's revenue in its own bucket", async () => {
    const data = await getReportData(stationId, presetRange("7d"));
    expect(data.trend[data.trend.length - 1].revenue).toBe(14800); // today, last bucket
    expect(data.trend[data.trend.length - 3].revenue).toBe(3000); // two days ago
  });

  it("trend total reconciles with the reported revenue", async () => {
    const data = await getReportData(stationId, presetRange("30d"));
    const sum = data.trend.reduce((acc, t) => acc + t.revenue, 0);
    expect(sum).toBe(data.revenue.toNumber());
  });
});

describe("cash movement", () => {
  it("counts purchases and credit collections inside the window", async () => {
    const data = await getReportData(stationId, presetRange("today"));
    expect(data.purchaseTotal.toString()).toBe("475000");
    expect(data.purchaseCount).toBe(1);
    expect(data.paymentsCollected.toString()).toBe("2500");
    expect(data.paymentsCount).toBe(1);
  });

  it("nets cash in against purchases, and can go negative", async () => {
    const data = await getReportData(stationId, presetRange("today"));
    // 10 300 cash + 2 500 collected − 475 000 purchases
    expect(data.netCashMovement.toString()).toBe("-462200");
    expect(data.netCashMovement.isNegative()).toBe(true);
  });
});

describe("station isolation", () => {
  it("never counts another station's sales", async () => {
    const other = await prisma.station.create({ data: { slug: "other-station", name: "Other", address: "Elsewhere" } });
    const otherUser = await prisma.user.create({
      data: { stationId: other.id, name: "Outsider", username: "outsider", passwordHash: "x", role: "CASHIER" },
    });
    const otherTank = await prisma.tank.create({
      data: { stationId: other.id, fuel: "PETROL", capacityL: D(9000), levelL: D(9000), openingL: D(9000), ratePerL: D(100) },
    });
    await prisma.sale.create({
      data: {
        receiptNo: 1,
        stationId: other.id,
        tankId: otherTank.id,
        fuel: "PETROL",
        liters: D(999),
        ratePerL: D(100),
        totalAmount: D(99900),
        paymentMethod: "CASH",
        soldById: otherUser.id,
        createdAt: new Date(),
      },
    });

    const data = await getReportData(stationId, presetRange("today"));
    expect(data.revenue.toString()).toBe("14800");
    expect(data.staffRows.some((s) => s.name === "Outsider")).toBe(false);
  });
});
