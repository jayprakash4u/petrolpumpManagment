import "server-only";
import { Prisma } from "@prisma/client";
import { requireTenantDb } from "@/lib/tenant-db";
import { ullage, fillPercent, isLowStock, costPerLiter, marginPerLiter } from "@/lib/stock-math";

const D = Prisma.Decimal;

/**
 * Everything the Tank & Stock page renders. Tank rows carry their derived
 * figures (room left, fill %, low-stock flag) computed here in Decimal, so
 * the components stay presentational and the arithmetic stays in one place.
 */
export async function getStockPageData(_stationId?: string) {
  const { prisma: tenantDb, stationId } = await requireTenantDb();
  const [tanks, purchases, rateHistory, soldSinceRefill] = await Promise.all([
    tenantDb.tank.findMany({ where: { stationId }, orderBy: { fuel: "asc" } }),
    tenantDb.purchase.findMany({
      where: { stationId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        fuel: true,
        liters: true,
        totalCost: true,
        supplier: true,
        invoiceNo: true,
        createdAt: true,
        recordedBy: { select: { name: true } },
      },
    }),
    tenantDb.fuelRateHistory.findMany({
      where: { tank: { stationId } },
      orderBy: { changedAt: "desc" },
      take: 10,
      select: {
        id: true,
        oldRate: true,
        newRate: true,
        changedAt: true,
        tank: { select: { fuel: true } },
        changedBy: { select: { name: true } },
      },
    }),
    tenantDb.sale.groupBy({
      by: ["tankId"],
      where: { stationId, voided: false },
      _sum: { liters: true },
    }),
  ]);

  const tankRows = tanks.map((t) => {
    const soldL = soldSinceRefill.find((s) => s.tankId === t.id)?._sum.liters ?? new D(0);
    return {
      id: t.id,
      fuel: t.fuel,
      capacityL: t.capacityL,
      levelL: t.levelL,
      ratePerL: t.ratePerL,
      lowStockPct: t.lowStockPct,
      room: ullage(t.capacityL, t.levelL),
      pct: fillPercent(t.capacityL, t.levelL),
      low: isLowStock(t.capacityL, t.levelL, t.lowStockPct),
      totalSoldL: soldL,
      updatedAt: t.updatedAt,
    };
  });

  return {
    tanks: tankRows,
    /** Strings only — this list feeds the Client Component forms. */
    tankOptions: tankRows.map((t) => ({
      id: t.id,
      fuel: t.fuel,
      ratePerL: t.ratePerL.toString(),
      levelL: t.levelL.toString(),
      capacityL: t.capacityL.toString(),
      room: t.room.toString(),
    })),
    purchases: purchases.map((p) => ({
      ...p,
      costPerL: costPerLiter(p.totalCost, p.liters),
      margin: marginPerLiter(
        tanks.find((t) => t.fuel === p.fuel)?.ratePerL ?? new D(0),
        p.totalCost,
        p.liters
      ),
    })),
    rateHistory,
    totalStockL: tankRows.reduce((sum, t) => sum.add(t.levelL), new D(0)),
    totalCapacityL: tankRows.reduce((sum, t) => sum.add(t.capacityL), new D(0)),
    lowStockCount: tankRows.filter((t) => t.low).length,
    /** Value of fuel currently in the ground at today's pump rates. */
    stockValue: tankRows.reduce((sum, t) => sum.add(t.levelL.mul(t.ratePerL)), new D(0)),
  };
}

export type StockPageData = Awaited<ReturnType<typeof getStockPageData>>;
export type StockTankOption = StockPageData["tankOptions"][number];
