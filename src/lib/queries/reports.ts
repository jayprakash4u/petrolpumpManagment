import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { FUEL_LABEL, FUEL_ORDER, type FuelId } from "@/lib/fuel";
import { averageSale, revenueSharePct } from "@/lib/staff";
import { costPerLiter } from "@/lib/stock-math";
import { dayBuckets, bucketLabel, rangeDays, type DateRange } from "@/lib/reports";

const D = Prisma.Decimal;

/**
 * Every figure on the Reports page, for one date range.
 *
 * All of it is aggregated by the database (`groupBy` / `aggregate`) rather
 * than by pulling sales into JS — a year-long report on a busy station is
 * hundreds of thousands of rows, and the page has to stay usable at that
 * size. The one exception is the daily trend, which needs a bounded number
 * of rows (two columns, capped at 366 days of sales) to bucket by local
 * calendar day; grouping by day in SQL would need raw provider-specific date
 * functions and would break the SQLite/Postgres portability the schema
 * deliberately keeps.
 */
export async function getReportData(stationId: string, range: DateRange) {
  const where = { stationId, voided: false, createdAt: { gte: range.from, lte: range.to } };

  const [totals, byFuel, byStaff, byPayment, voided, purchases, payments, trendRows, staffNames] = await Promise.all([
    prisma.sale.aggregate({ where, _sum: { totalAmount: true, liters: true }, _count: true }),
    prisma.sale.groupBy({ by: ["fuel"], where, _sum: { totalAmount: true, liters: true }, _count: true }),
    prisma.sale.groupBy({ by: ["soldById"], where, _sum: { totalAmount: true, liters: true }, _count: true }),
    prisma.sale.groupBy({ by: ["paymentMethod"], where, _sum: { totalAmount: true }, _count: true }),
    prisma.sale.aggregate({
      where: { stationId, voided: true, createdAt: { gte: range.from, lte: range.to } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.purchase.groupBy({
      by: ["fuel"],
      where: { stationId, createdAt: { gte: range.from, lte: range.to } },
      _sum: { totalCost: true, liters: true },
      _count: true,
    }),
    prisma.customerPayment.aggregate({
      where: { customer: { stationId }, createdAt: { gte: range.from, lte: range.to } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.sale.findMany({ where, select: { createdAt: true, totalAmount: true }, orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({ where: { stationId }, select: { id: true, name: true, role: true } }),
  ]);

  const revenue = totals._sum.totalAmount ?? new D(0);
  const liters = totals._sum.liters ?? new D(0);

  const cash = byPayment.find((p) => p.paymentMethod === "CASH")?._sum.totalAmount ?? new D(0);
  const credit = byPayment.find((p) => p.paymentMethod === "CREDIT")?._sum.totalAmount ?? new D(0);

  const fuelRows = FUEL_ORDER.map((fuel: FuelId) => {
    const row = byFuel.find((f) => f.fuel === fuel);
    const rev = row?._sum.totalAmount ?? new D(0);
    const vol = row?._sum.liters ?? new D(0);
    const bought = purchases.find((p) => p.fuel === fuel);
    return {
      fuel,
      label: FUEL_LABEL[fuel],
      revenue: rev,
      liters: vol,
      saleCount: row?._count ?? 0,
      sharePct: revenueSharePct(rev, revenue),
      /** Average realised price per litre — re-derived from the totals, so it can't disagree with them. */
      avgRate: vol.gt(0) ? rev.div(vol).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP) : null,
      purchasedL: bought?._sum.liters ?? new D(0),
      purchaseCost: bought?._sum.totalCost ?? new D(0),
      avgCost: bought ? costPerLiter(bought._sum.totalCost ?? new D(0), bought._sum.liters ?? new D(0)) : null,
    };
  });

  const staffRows = byStaff
    .map((s) => {
      const person = staffNames.find((u) => u.id === s.soldById);
      const rev = s._sum.totalAmount ?? new D(0);
      return {
        id: s.soldById,
        name: person?.name ?? "Unknown",
        role: person?.role ?? null,
        revenue: rev,
        liters: s._sum.liters ?? new D(0),
        saleCount: s._count,
        averageSale: averageSale(rev, s._count),
        sharePct: revenueSharePct(rev, revenue),
      };
    })
    .sort((a, b) => b.revenue.comparedTo(a.revenue));

  // Bucket into local calendar days, seeding every day in the range so quiet
  // days show as zero rather than vanishing from the chart.
  const days = dayBuckets(range);
  const totalDays = rangeDays(range);
  const buckets = new Map<string, Prisma.Decimal>();
  for (const d of days) buckets.set(d.toDateString(), new D(0));
  for (const row of trendRows) {
    const key = new Date(row.createdAt).toDateString();
    const current = buckets.get(key);
    if (current) buckets.set(key, current.add(row.totalAmount));
    else buckets.set(key, row.totalAmount);
  }
  const trend = days.map((d) => ({
    label: bucketLabel(d, totalDays),
    revenue: (buckets.get(d.toDateString()) ?? new D(0)).toNumber(),
  }));

  const purchaseTotal = purchases.reduce((sum, p) => sum.add(p._sum.totalCost ?? 0), new D(0));

  return {
    range,
    totalDays,
    revenue,
    liters,
    saleCount: totals._count,
    cash,
    credit,
    averageSale: averageSale(revenue, totals._count),
    /** Revenue per day across the window — the figure that makes two ranges of different lengths comparable. */
    dailyAverage: totalDays > 0 ? revenue.div(totalDays).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP) : new D(0),
    fuelRows,
    staffRows,
    trend,
    voidedCount: voided._count,
    voidedValue: voided._sum.totalAmount ?? new D(0),
    purchaseTotal,
    purchaseCount: purchases.reduce((n, p) => n + p._count, 0),
    paymentsCollected: payments._sum.amount ?? new D(0),
    paymentsCount: payments._count,
    /**
     * Cash *movement* over the window, not profit. Fuel bought in a period
     * isn't the fuel sold in it, so this deliberately isn't called margin —
     * calling it that would invite a manager to read a big delivery as a loss.
     */
    netCashMovement: cash.add(payments._sum.amount ?? new D(0)).sub(purchaseTotal),
  };
}

export type ReportData = Awaited<ReturnType<typeof getReportData>>;
