import "server-only";
import { Prisma } from "@prisma/client";
import { requireTenantDb } from "@/lib/tenant-db";
import { costPerLiter, marginPerLiter } from "@/lib/stock-math";

const D = Prisma.Decimal;

/**
 * The full fuel-purchase (tanker delivery) history plus the tank list a
 * delivery can be recorded against — everything the Purchases -> Fuel
 * Purchases page needs. This is the one real home for recording and
 * reviewing deliveries; Stock & Tanks links here rather than duplicating
 * the form.
 */
export async function getFuelPurchasesPageData() {
  const { prisma: tenantDb, stationId } = await requireTenantDb();

  const [tanks, purchases] = await Promise.all([
    tenantDb.tank.findMany({ where: { stationId }, orderBy: { fuel: "asc" } }),
    tenantDb.purchase.findMany({
      where: { stationId },
      orderBy: { createdAt: "desc" },
      take: 500,
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
  ]);

  // Prisma's Decimal is a class instance, not a plain object — it can't
  // cross the Server -> Client Component boundary, so every Decimal field
  // handed to <FuelPurchasesTable> (a client component) is stringified here.
  const deliveries = purchases.map((p) => {
    const costPerL = costPerLiter(p.totalCost, p.liters);
    const margin = marginPerLiter(tanks.find((t) => t.fuel === p.fuel)?.ratePerL ?? new D(0), p.totalCost, p.liters);
    return {
      ...p,
      liters: p.liters.toString(),
      totalCost: p.totalCost.toString(),
      costPerL: costPerL ? costPerL.toString() : null,
      margin: margin ? margin.toString() : null,
    };
  });

  return {
    tankOptions: tanks.map((t) => ({
      id: t.id,
      fuel: t.fuel,
      ratePerL: t.ratePerL.toString(),
      levelL: t.levelL.toString(),
      capacityL: t.capacityL.toString(),
      room: t.levelL ? t.capacityL.sub(t.levelL).toString() : t.capacityL.toString(),
    })),
    deliveries,
    totalLitersL: purchases.reduce((sum, p) => sum.add(p.liters), new D(0)),
    totalCost: purchases.reduce((sum, p) => sum.add(p.totalCost), new D(0)),
    deliveryCount: purchases.length,
  };
}

export type FuelPurchasesPageData = Awaited<ReturnType<typeof getFuelPurchasesPageData>>;
export type FuelPurchaseRow = FuelPurchasesPageData["deliveries"][number];
