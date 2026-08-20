import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { creditHeadroom } from "@/lib/sale-math";

const D = Prisma.Decimal;

/**
 * Everything the Sales Entry page renders. The form needs live rates and
 * levels (a stale rate would bill the wrong price), so this is read on every
 * request rather than cached.
 */
export async function getSalesPageData(stationId: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [tanks, customers, recentSales, todayAgg] = await Promise.all([
    prisma.tank.findMany({ where: { stationId }, orderBy: { fuel: "asc" } }),
    prisma.customer.findMany({
      where: { stationId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, creditLimit: true, dueAmount: true },
    }),
    prisma.sale.findMany({
      where: { stationId },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        receiptNo: true,
        fuel: true,
        liters: true,
        ratePerL: true,
        totalAmount: true,
        paymentMethod: true,
        createdAt: true,
        voided: true,
        voidReason: true,
        customer: { select: { name: true } },
        soldBy: { select: { name: true } },
      },
    }),
    prisma.sale.aggregate({
      where: { stationId, createdAt: { gte: startOfToday }, voided: false },
      _sum: { totalAmount: true, liters: true },
      _count: true,
    }),
  ]);

  return {
    tanks: tanks.map((t) => ({
      id: t.id,
      fuel: t.fuel,
      // Serialized to strings at the query boundary: these feed a Client
      // Component, and Prisma.Decimal doesn't survive that crossing.
      ratePerL: t.ratePerL.toString(),
      levelL: t.levelL.toString(),
    })),
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      headroom: creditHeadroom(c.creditLimit, c.dueAmount).toString(),
      dueAmount: c.dueAmount.toString(),
    })),
    recentSales,
    todayTotal: todayAgg._sum.totalAmount ?? new D(0),
    todayLiters: todayAgg._sum.liters ?? new D(0),
    todayCount: todayAgg._count,
  };
}

export type SalesPageData = Awaited<ReturnType<typeof getSalesPageData>>;
export type TankOption = SalesPageData["tanks"][number];
export type CustomerOption = SalesPageData["customers"][number];
