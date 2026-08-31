import "server-only";
import { Prisma } from "@prisma/client";
import { requireTenantDb } from "@/lib/tenant-db";
import { creditHeadroom } from "@/lib/sale-math";

const D = Prisma.Decimal;

export interface SerializedSale {
  id: string;
  receiptNo: number;
  billNumber: string;
  vehicleNo: string | null;
  fuel: string;
  liters: number;
  ratePerL: number;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  formattedTime: string;
  formattedDateBS: string;
  customerName: string | null;
  customerId: string | null;
  soldByName: string;
  tankId: string;
  voided: boolean;
  voidReason: string | null;
  voidedAt: string | null;
}

const mapSale = (s: any): SerializedSale => {
  const d = new Date(s.createdAt);
  return {
    id: s.id,
    receiptNo: s.receiptNo,
    billNumber: `SL-${s.receiptNo}`,
    vehicleNo: s.vehicleNo ?? null,
    fuel: s.fuel,
    liters: Number(s.liters),
    ratePerL: Number(s.ratePerL),
    totalAmount: Number(s.totalAmount),
    paymentMethod: s.paymentMethod,
    createdAt: s.createdAt.toISOString ? s.createdAt.toISOString() : new Date(s.createdAt).toISOString(),
    formattedTime: d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    formattedDateBS: d.toISOString().slice(0, 10),
    customerName: s.customer?.name ?? s.buyerName ?? null,
    customerId: s.customerId ?? null,
    soldByName: s.soldBy?.name ?? "Attendant",
    tankId: s.tankId,
    voided: s.voided,
    voidReason: s.voidReason ?? null,
    voidedAt: s.voidedAt ? (s.voidedAt.toISOString ? s.voidedAt.toISOString() : new Date(s.voidedAt).toISOString()) : null,
  };
};

/**
 * Everything the Sales Entry page renders from the station's dedicated database.
 */
export async function getSalesPageData(_stationId?: string) {
  const { prisma: tenantDb, stationId } = await requireTenantDb();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [station, tanks, customers, recentSalesRaw, todayAgg] = await Promise.all([
    tenantDb.station.findFirst({ where: { id: stationId }, select: { name: true } }),
    tenantDb.tank.findMany({ where: { stationId }, orderBy: { fuel: "asc" } }),
    tenantDb.customer.findMany({
      where: { stationId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, creditLimit: true, dueAmount: true },
    }),
    tenantDb.sale.findMany({
      where: { stationId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        customer: { select: { name: true } },
        soldBy: { select: { name: true } },
      },
    }),
    tenantDb.sale.aggregate({
      where: { stationId, createdAt: { gte: startOfToday }, voided: false },
      _sum: { totalAmount: true, liters: true },
      _count: true,
    }),
  ]);

  const sales = recentSalesRaw.map(mapSale);

  return {
    stationName: station?.name ?? "Station",
    tanks: tanks.map((t) => ({
      id: t.id,
      fuel: t.fuel,
      ratePerL: t.ratePerL.toString(),
      levelL: t.levelL.toString(),
    })),
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      headroom: creditHeadroom(c.creditLimit, c.dueAmount).toString(),
      dueAmount: c.dueAmount.toString(),
    })),
    sales,
    recentSales: sales,
    todayTotal: todayAgg._sum.totalAmount ?? new D(0),
    todayLiters: todayAgg._sum.liters ?? new D(0),
    todayCount: todayAgg._count,
  };
}

/**
 * Dedicated data query for the Sales Returns / Credit Notes register.
 */
export async function getSalesReturnsPageData(_stationId?: string) {
  const { prisma: tenantDb, stationId } = await requireTenantDb();
  const [voidedRaw, activeRaw] = await Promise.all([
    tenantDb.sale.findMany({
      where: { stationId, voided: true },
      orderBy: { voidedAt: "desc" },
      take: 100,
      include: {
        customer: { select: { id: true, name: true } },
        soldBy: { select: { name: true } },
      },
    }),
    tenantDb.sale.findMany({
      where: { stationId, voided: false },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        customer: { select: { id: true, name: true } },
        soldBy: { select: { name: true } },
      },
    }),
  ]);

  const returns = voidedRaw.map(mapSale);
  const activeSales = activeRaw.map(mapSale);

  const totalReversedAmount = returns.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalRestockedLiters = returns.reduce((sum, r) => sum + r.liters, 0);

  return {
    returns,
    activeSales,
    totalCount: returns.length,
    totalReversedAmount,
    totalRestockedLiters,
  };
}

export type SalesPageData = Awaited<ReturnType<typeof getSalesPageData>>;
export type SalesReturnsPageData = Awaited<ReturnType<typeof getSalesReturnsPageData>>;
export type TankOption = SalesPageData["tanks"][number];
export type CustomerOption = SalesPageData["customers"][number];
