import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";

const D = Prisma.Decimal;

/**
 * Everything the Dashboard needs, gathered with a handful of targeted
 * queries rather than pulling every Sale row into JS and reducing there —
 * fine at today's volume, but it means the page doesn't get slower as the
 * sales table grows into the millions.
 */
export async function getDashboardData(stationId: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [tanks, todaysSales, onShiftCount, staffCount, revenueByFuelRaw] = await Promise.all([
    prisma.tank.findMany({ where: { stationId }, orderBy: { fuel: "asc" } }),
    prisma.sale.findMany({
      where: { stationId, createdAt: { gte: startOfToday }, voided: false },
      select: { fuel: true, liters: true, totalAmount: true, paymentMethod: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.count({ where: { stationId, onShift: true } }),
    prisma.user.count({ where: { stationId, active: true } }),
    prisma.sale.groupBy({
      by: ["fuel"],
      where: { stationId, createdAt: { gte: startOfToday }, voided: false },
      _sum: { totalAmount: true },
    }),
  ]);

  const totalRevenue = todaysSales.reduce((sum, s) => sum.add(s.totalAmount), new D(0));
  const totalLiters = todaysSales.reduce((sum, s) => sum.add(s.liters), new D(0));
  const cashTotal = todaysSales
    .filter((s) => s.paymentMethod === "CASH")
    .reduce((sum, s) => sum.add(s.totalAmount), new D(0));
  const creditTotal = totalRevenue.sub(cashTotal);

  const lowStockTanks = tanks.filter((t) => t.levelL.div(t.capacityL).mul(100).lt(t.lowStockPct));

  // Bucket today's sales into 2-hour windows for the trend chart.
  const bucketMs = 2 * 60 * 60 * 1000;
  const buckets = new Map<number, Prisma.Decimal>();
  for (const sale of todaysSales) {
    const bucketStart = Math.floor(sale.createdAt.getTime() / bucketMs) * bucketMs;
    buckets.set(bucketStart, (buckets.get(bucketStart) ?? new D(0)).add(sale.totalAmount));
  }
  const revenueTrend = [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([ts, revenue]) => ({
      hour: new Date(ts).toLocaleTimeString("en-IN", { hour: "numeric", hour12: true }).replace(" ", "").toLowerCase(),
      revenue: revenue.toNumber(),
    }));

  const revenueByFuel = (["PETROL", "DIESEL", "CNG"] as FuelId[]).map((fuel) => ({
    fuel,
    label: FUEL_LABEL[fuel],
    revenue: revenueByFuelRaw.find((r) => r.fuel === fuel)?._sum.totalAmount?.toNumber() ?? 0,
  }));

  return {
    tanks,
    lowStockTanks,
    totalRevenue,
    totalLiters,
    cashTotal,
    creditTotal,
    onShiftCount,
    staffCount,
    revenueTrend,
    revenueByFuel,
    saleCount: todaysSales.length,
  };
}
