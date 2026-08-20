import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { rangeStart, shiftMinutes, averageSale, revenueSharePct, type RangeKey } from "@/lib/staff";

const D = Prisma.Decimal;

/**
 * Staff roster plus per-head sales performance for a reporting window.
 *
 * The per-staff totals come from `groupBy` rather than pulling every Sale
 * into JS — the same discipline as the Dashboard, so this page doesn't slow
 * down as the sales table grows.
 */
export async function getEmployeesPageData(stationId: string, range: RangeKey) {
  const since = rangeStart(range);
  const now = new Date();

  const [users, salesByStaff, cashByStaff, openShifts, recentShifts] = await Promise.all([
    prisma.user.findMany({
      where: { stationId },
      orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        active: true,
        onShift: true,
        shiftStartedAt: true,
        createdAt: true,
      },
    }),
    prisma.sale.groupBy({
      by: ["soldById"],
      where: { stationId, voided: false, createdAt: { gte: since } },
      _sum: { totalAmount: true, liters: true },
      _count: true,
    }),
    prisma.sale.groupBy({
      by: ["soldById"],
      where: { stationId, voided: false, createdAt: { gte: since }, paymentMethod: "CASH" },
      _sum: { totalAmount: true },
    }),
    prisma.shift.findMany({
      where: { user: { stationId }, endedAt: null },
      select: { id: true, userId: true, startedAt: true },
    }),
    prisma.shift.findMany({
      where: { user: { stationId }, startedAt: { gte: since } },
      orderBy: { startedAt: "desc" },
      take: 12,
      select: {
        id: true,
        startedAt: true,
        endedAt: true,
        user: { select: { name: true, role: true } },
        endedBy: { select: { name: true } },
      },
    }),
  ]);

  const stationRevenue = salesByStaff.reduce((sum, s) => sum.add(s._sum.totalAmount ?? 0), new D(0));

  const staff = users.map((u) => {
    const sales = salesByStaff.find((s) => s.soldById === u.id);
    const cash = cashByStaff.find((s) => s.soldById === u.id)?._sum.totalAmount ?? new D(0);
    const revenue = sales?._sum.totalAmount ?? new D(0);
    const open = openShifts.find((s) => s.userId === u.id);

    return {
      ...u,
      saleCount: sales?._count ?? 0,
      revenue,
      liters: sales?._sum.liters ?? new D(0),
      cash,
      credit: revenue.sub(cash),
      averageSale: averageSale(revenue, sales?._count ?? 0),
      sharePct: revenueSharePct(revenue, stationRevenue),
      /**
       * Minutes on the current shift. Read from the Shift row rather than
       * User.shiftStartedAt so the figure survives the two falling out of
       * step — the row is the record, the flag is the index.
       */
      onShiftMinutes: open ? shiftMinutes(open.startedAt, null, now) : 0,
    };
  });

  return {
    staff,
    recentShifts: recentShifts.map((s) => ({
      ...s,
      minutes: shiftMinutes(s.startedAt, s.endedAt, now),
    })),
    stationRevenue,
    activeCount: users.filter((u) => u.active).length,
    onShiftCount: users.filter((u) => u.onShift).length,
    totalSales: salesByStaff.reduce((n, s) => n + s._count, 0),
  };
}

export type EmployeesPageData = Awaited<ReturnType<typeof getEmployeesPageData>>;
export type StaffRow = EmployeesPageData["staff"][number];
