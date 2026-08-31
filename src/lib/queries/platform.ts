import "server-only";
import { getMasterDb } from "@/lib/tenant-db";

/**
 * Tenant metadata for the operator console.
 *
 * Reads from Master DB (FuelStationMasterDB) Tenant registry.
 * This console exists to run the platform, not to read tenants' private books.
 */
export async function getPlatformOverview() {
  const master = getMasterDb();
  const tenants = await master.tenant.findMany({
    orderBy: [{ suspendedAt: "asc" }, { createdAt: "desc" }],
  });

  const rows = tenants.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    address: t.address,
    createdAt: t.createdAt,
    suspendedAt: t.suspendedAt,
    suspendedReason: t.suspendedReason,
    databaseName: t.databaseName,
    status: t.status,
    staffCount: 1, // baseline Station Admin
    saleCount: 0,
    lastSaleAt: null,
  }));

  return {
    stations: rows,
    total: rows.length,
    activeCount: rows.filter((r) => r.status === "ACTIVE").length,
    suspendedCount: rows.filter((r) => r.status === "SUSPENDED").length,
    dormantCount: 0,
  };
}

/** Recent operator activity, newest first from FuelStationMasterDB. */
export async function getPlatformAuditLog(take = 15) {
  const master = getMasterDb();
  return master.platformAuditLog.findMany({
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

/**
 * Detailed Station Inspection & Staff Account Query for Super Admin Console.
 */
export async function getStationAdminDetails(slug: string) {
  const master = getMasterDb();
  const tenant = await master.tenant.findUnique({
    where: { slug },
  });
  if (!tenant) return null;

  try {
    const { getTenantDb } = await import("@/lib/tenant-db");
    const tenantDb = await getTenantDb(slug);
    const station = await tenantDb.station.findUnique({
      where: { slug },
      include: {
        tanks: {
          orderBy: { fuel: "asc" },
        },
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            employeeId: true,
            active: true,
            createdAt: true,
            onShift: true,
            phone: true,
            email: true,
          },
          orderBy: { role: "asc" },
        },
      },
    });

    const salesCount = await tenantDb.sale.count();
    const customersCount = await tenantDb.customer.count();

    // Prisma.Decimal instances can't cross the Server -> Client Component
    // boundary (React can't serialize them) — flatten to plain numbers here,
    // where the Decimal still exists, rather than passing them through.
    const serializedStation = station && {
      ...station,
      tanks: station.tanks.map((t) => ({
        ...t,
        capacityL: Number(t.capacityL),
        levelL: Number(t.levelL),
        openingL: Number(t.openingL),
        ratePerL: Number(t.ratePerL),
        lowStockPct: Number(t.lowStockPct),
      })),
    };

    return {
      tenant,
      station: serializedStation,
      stats: {
        tanksCount: station?.tanks.length ?? 0,
        staffCount: station?.users.length ?? 0,
        salesCount,
        customersCount,
      },
    };
  } catch (err) {
    console.error("getStationAdminDetails error:", err);
    return {
      tenant,
      station: null,
      stats: {
        tanksCount: 0,
        staffCount: 0,
        salesCount: 0,
        customersCount: 0,
      },
    };
  }
}

