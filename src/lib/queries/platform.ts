import "server-only";
import { prisma } from "@/lib/db";

/**
 * Tenant metadata for the operator console.
 *
 * Note what is absent: revenue, stock levels, customer balances — any of a
 * pump's actual business data. This console exists to run the platform, not
 * to read tenants' books. Counts and dates are enough to bill, support and
 * spot an inactive account, and keeping it to that means an operator
 * compromise leaks far less.
 */
export async function getPlatformOverview() {
  const [stations, userCounts, saleCounts, lastSales] = await Promise.all([
    prisma.station.findMany({ orderBy: [{ suspendedAt: "asc" }, { createdAt: "desc" }] }),
    prisma.user.groupBy({ by: ["stationId"], where: { active: true }, _count: true }),
    prisma.sale.groupBy({ by: ["stationId"], where: { voided: false }, _count: true }),
    prisma.sale.groupBy({ by: ["stationId"], _max: { createdAt: true } }),
  ]);

  const rows = stations.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    address: s.address,
    createdAt: s.createdAt,
    suspendedAt: s.suspendedAt,
    suspendedReason: s.suspendedReason,
    staffCount: userCounts.find((u) => u.stationId === s.id)?._count ?? 0,
    saleCount: saleCounts.find((c) => c.stationId === s.id)?._count ?? 0,
    lastSaleAt: lastSales.find((l) => l.stationId === s.id)?._max.createdAt ?? null,
  }));

  return {
    stations: rows,
    total: rows.length,
    activeCount: rows.filter((r) => r.suspendedAt === null).length,
    suspendedCount: rows.filter((r) => r.suspendedAt !== null).length,
    /** Tenants that have never recorded a sale — the ones onboarding didn't land for. */
    dormantCount: rows.filter((r) => r.saleCount === 0).length,
  };
}

/** Recent operator activity, newest first. */
export async function getPlatformAuditLog(take = 15) {
  return prisma.platformAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      actor: { select: { name: true, email: true } },
    },
  });
}

export type PlatformOverview = Awaited<ReturnType<typeof getPlatformOverview>>;
export type PlatformAuditEntry = Awaited<ReturnType<typeof getPlatformAuditLog>>[number];
