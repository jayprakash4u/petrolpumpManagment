import "server-only";
import { PrismaClient } from "@prisma/client";
import { requireSession, requireUser } from "@/lib/dal";
import { applyMigrations } from "@/lib/migrations/apply";

const SQL_SERVER_HOST = process.env.SQL_SERVER_HOST || "localhost:1435";
const SQL_SERVER_USER = process.env.SQL_SERVER_USER || "fsm_dev";
const SQL_SERVER_PASS = process.env.SQL_SERVER_PASS || "FuelStation2026Password!";
const MASTER_DB_NAME = process.env.MASTER_DB_NAME || "FuelStationMasterDB";

/**
 * Construct SQL Server connection URL for a specific database.
 */
export function buildDatabaseUrl(dbName: string, host = SQL_SERVER_HOST): string {
  return `sqlserver://${host};database=${dbName};user=${SQL_SERVER_USER};password=${SQL_SERVER_PASS};trustServerCertificate=true;connectionTimeout=15000;connectTimeout=15000;`;
}

declare global {
  // eslint-disable-next-line no-var
  var __masterPrismaClient: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __tenantPrismaClients: Record<string, PrismaClient> | undefined;
}

/**
 * Get singleton PrismaClient connected to the Master Database (FuelStationMasterDB).
 */
export function getMasterDb(): PrismaClient {
  if (!globalThis.__masterPrismaClient) {
    globalThis.__masterPrismaClient = new PrismaClient({
      datasources: { db: { url: buildDatabaseUrl(MASTER_DB_NAME) } },
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }
  return globalThis.__masterPrismaClient;
}

interface TenantRegistryCacheEntry {
  databaseName: string;
  databaseServer: string;
  status: string;
  cachedAt: number;
}

const tenantCache = new Map<string, TenantRegistryCacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

/**
 * Dynamically resolves and caches the dedicated PrismaClient for a specific station slug.
 */
export async function getTenantDb(stationSlug: string): Promise<PrismaClient> {
  const normalized = stationSlug.toLowerCase().trim();

  let entry = tenantCache.get(normalized);
  const now = Date.now();

  if (!entry || now - entry.cachedAt > CACHE_TTL_MS) {
    const master = getMasterDb();
    const tenant = await master.tenant.findUnique({
      where: { slug: normalized },
      select: { databaseName: true, databaseServer: true, status: true },
    });

    if (!tenant) {
      throw new Error(`Station database routing not found for station code: "${stationSlug}"`);
    }

    if (tenant.status !== "ACTIVE") {
      throw new Error(`Station "${stationSlug}" is currently ${tenant.status}. Access denied.`);
    }

    entry = {
      databaseName: tenant.databaseName,
      databaseServer: tenant.databaseServer || SQL_SERVER_HOST,
      status: tenant.status,
      cachedAt: now,
    };
    tenantCache.set(normalized, entry);
  }

  if (!globalThis.__tenantPrismaClients) {
    globalThis.__tenantPrismaClients = {};
  }

  const poolKey = entry.databaseName;
  if (!globalThis.__tenantPrismaClients[poolKey]) {
    const tenantUrl = buildDatabaseUrl(entry.databaseName, entry.databaseServer);
    globalThis.__tenantPrismaClients[poolKey] = new PrismaClient({
      datasources: { db: { url: tenantUrl } },
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  return globalThis.__tenantPrismaClients[poolKey];
}

export function invalidateTenantCache(slug?: string) {
  if (slug) {
    tenantCache.delete(slug.toLowerCase().trim());
  } else {
    tenantCache.clear();
  }
}

/**
 * Scoped helper that automatically retrieves the authenticated user's dedicated station DB.
 */
export async function requireTenantDb(): Promise<{ prisma: PrismaClient; stationId: string; user: Awaited<ReturnType<typeof requireUser>>; slug: string }> {
  const session = await requireSession();
  const client = await getTenantDb(session.tenantSlug);
  return { prisma: client, stationId: session.user.stationId, user: session.user, slug: session.tenantSlug };
}

/**
 * Compatibility helper for existing code calling getScopedDb.
 */
export async function getScopedDb() {
  const { prisma: tenantPrisma, stationId, user } = await requireTenantDb();
  return {
    stationId,
    user,
    tanks: {
      findMany: (args?: any) => tenantPrisma.tank.findMany({ ...args }),
      findFirst: (args?: any) => tenantPrisma.tank.findFirst({ ...args }),
      findUnique: (args: any) => tenantPrisma.tank.findFirst({ ...args }),
    },
    customers: {
      findMany: (args?: any) => tenantPrisma.customer.findMany({ ...args }),
      findFirst: (args?: any) => tenantPrisma.customer.findFirst({ ...args }),
    },
    sales: {
      findMany: (args?: any) => tenantPrisma.sale.findMany({ ...args }),
      findFirst: (args?: any) => tenantPrisma.sale.findFirst({ ...args }),
      count: (args?: any) => tenantPrisma.sale.count({ ...args }),
    },
    purchases: {
      findMany: (args?: any) => tenantPrisma.purchase.findMany({ ...args }),
      findFirst: (args?: any) => tenantPrisma.purchase.findFirst({ ...args }),
    },
    auditLogs: {
      findMany: (args?: any) => tenantPrisma.auditLog.findMany({ ...args }),
    },
    raw: tenantPrisma,
  };
}

export interface ProvisionStationInput {
  slug: string;
  name: string;
  companyName?: string;
  databaseName?: string;
  address: string;
  phone?: string;
  email?: string;
  adminName: string;
  adminUsername: string;
  adminPasswordHash: string;
}

/**
 * Automated Enterprise Database-Per-Tenant Provisioner.
 * 1. Creates dedicated SQL Server database [FuelStation_<slug>] or custom database name
 * 2. Applies station DDL tables
 * 3. Registers tenant in FuelStationMasterDB
 * 4. Seeds Station Admin and default tanks in the new database
 */
export async function provisionTenantDatabase(input: ProvisionStationInput) {
  const master = getMasterDb();
  const cleanSlug = input.slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
  let dbName = input.databaseName?.trim().replace(/[^a-zA-Z0-9_]/g, "_");
  if (!dbName || dbName.length === 0) {
    dbName = `FuelStation_${cleanSlug.replace(/-/g, "_")}`;
  }

  // 1. Create SQL Server Database using master connection
  const createDbSql = `
    IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${dbName}')
    BEGIN
      CREATE DATABASE [${dbName}];
    END;
  `;
  await master.$executeRawUnsafe(createDbSql);

  // 2. Connect to the newly created tenant DB and execute DDL
  const tenantUrl = buildDatabaseUrl(dbName);
  const tempTenantClient = new PrismaClient({ datasources: { db: { url: tenantUrl } } });
  
  try {
    // Build the new database through the same migration path an existing
    // tenant upgrades through, rather than a separately hand-maintained DDL
    // snapshot — the two can no longer drift apart, which is exactly what
    // let a new station go live missing a column an existing one already had.
    const migrationResult = await applyMigrations(tempTenantClient);
    if (migrationResult.status === "failed") {
      throw new Error(`Tenant schema migration failed: ${migrationResult.error ?? "unknown error"}`);
    }

    // 3. Register in Master DB Tenant registry
    const tenant = await master.tenant.upsert({
      where: { slug: cleanSlug },
      create: {
        slug: cleanSlug,
        name: input.name,
        companyName: input.companyName,
        databaseName: dbName,
        databaseServer: SQL_SERVER_HOST,
        status: "ACTIVE",
        address: input.address,
        phone: input.phone,
        email: input.email,
      },
      update: {
        name: input.name,
        companyName: input.companyName,
        databaseName: dbName,
        address: input.address,
        phone: input.phone,
        email: input.email,
        status: "ACTIVE",
      },
    });

    // 4. Create Station and Station Admin in the dedicated database
    const station = await tempTenantClient.station.upsert({
      where: { slug: cleanSlug },
      create: {
        slug: cleanSlug,
        name: input.name,
        companyName: input.companyName,
        address: input.address,
        phone: input.phone,
        email: input.email,
      },
      update: {
        name: input.name,
        companyName: input.companyName,
        address: input.address,
        phone: input.phone,
        email: input.email,
      },
    });

    const adminUser = await tempTenantClient.user.upsert({
      where: {
        stationId_username: {
          stationId: station.id,
          username: input.adminUsername.toLowerCase().trim(),
        },
      },
      create: {
        stationId: station.id,
        name: input.adminName,
        username: input.adminUsername.toLowerCase().trim(),
        passwordHash: input.adminPasswordHash,
        role: "OWNER",
        phone: input.phone,
        employeeId: "EMP-001",
        active: true,
      },
      update: {
        name: input.adminName,
        passwordHash: input.adminPasswordHash,
        active: true,
      },
    });

    // 5. Seed default 3 storage tanks
    const defaultTanks = [
      { fuel: "PETROL", capacityL: 20000, levelL: 14500, openingL: 14500, ratePerL: 172.5 },
      { fuel: "DIESEL", capacityL: 25000, levelL: 18200, openingL: 18200, ratePerL: 155.0 },
      { fuel: "CNG", capacityL: 10000, levelL: 6800, openingL: 6800, ratePerL: 110.0 },
    ];

    for (const t of defaultTanks) {
      await tempTenantClient.tank.upsert({
        where: {
          stationId_fuel: {
            stationId: station.id,
            fuel: t.fuel,
          },
        },
        create: {
          stationId: station.id,
          fuel: t.fuel,
          capacityL: t.capacityL,
          levelL: t.levelL,
          openingL: t.openingL,
          ratePerL: t.ratePerL,
          lowStockPct: 20.0,
        },
        update: {},
      });
    }

    // Invalidate tenant cache
    invalidateTenantCache(cleanSlug);

    return {
      tenant,
      station,
      adminUser,
      databaseName: dbName,
    };
  } finally {
    await tempTenantClient.$disconnect();
  }
}
