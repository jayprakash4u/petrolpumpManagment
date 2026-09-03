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
 *
 * `connectionLimit` is deliberately small: this is a database-per-tenant
 * setup, so every station a request touches gets its own PrismaClient with
 * its own pool — left at Prisma's default (num CPUs * 2 + 1, i.e. 9 on a
 * typical dev machine), a handful of tenant clients can add up to more
 * connections than a small dev SQL Server instance can actually hold in
 * memory, and new queries start timing out waiting for a pool slot
 * ("Timed out fetching a new connection from the connection pool") even
 * though no single client is anywhere near saturated. A lower per-client
 * ceiling keeps total connections bounded as tenants are added.
 */
export function buildDatabaseUrl(dbName: string, host = SQL_SERVER_HOST): string {
  return `sqlserver://${host};database=${dbName};user=${SQL_SERVER_USER};password=${SQL_SERVER_PASS};trustServerCertificate=true;connectionTimeout=30000;connectTimeout=30000;connectionLimit=25;poolTimeout=60;`;
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
 * Dynamically resolves the PrismaClient for a specific station slug.
 * In this multi-tenant architecture, all station data is isolated by stationId/tenant_id
 * within the database, sharing migrations and connections efficiently.
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
      // Fallback: Check if Station exists directly
      const st = await master.station.findUnique({
        where: { slug: normalized },
        select: { id: true, suspendedAt: true },
      });
      if (!st) {
        throw new Error(`Station routing not found for station code: "${stationSlug}"`);
      }
      if (st.suspendedAt) {
        throw new Error(`Station "${stationSlug}" is currently SUSPENDED. Access denied.`);
      }

      entry = {
        databaseName: MASTER_DB_NAME,
        databaseServer: SQL_SERVER_HOST,
        status: "ACTIVE",
        cachedAt: now,
      };
    } else {
      if (tenant.status !== "ACTIVE") {
        throw new Error(`Station "${stationSlug}" is currently ${tenant.status}. Access denied.`);
      }

      entry = {
        databaseName: tenant.databaseName || MASTER_DB_NAME,
        databaseServer: tenant.databaseServer || SQL_SERVER_HOST,
        status: tenant.status,
        cachedAt: now,
      };
    }

    tenantCache.set(normalized, entry);
  }

  // If using shared multi-tenant database, return the singleton master client directly
  if (entry.databaseName === MASTER_DB_NAME || !entry.databaseName.startsWith("FuelStation_isolated_")) {
    return getMasterDb();
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
      findMany: (args?: any) => tenantPrisma.tank.findMany({ ...args, where: { ...args?.where, stationId } }),
      findFirst: (args?: any) => tenantPrisma.tank.findFirst({ ...args, where: { ...args?.where, stationId } }),
      findUnique: (args: any) => tenantPrisma.tank.findFirst({ ...args, where: { ...args?.where, stationId } }),
    },
    customers: {
      findMany: (args?: any) => tenantPrisma.customer.findMany({ ...args, where: { ...args?.where, stationId } }),
      findFirst: (args?: any) => tenantPrisma.customer.findFirst({ ...args, where: { ...args?.where, stationId } }),
    },
    sales: {
      findMany: (args?: any) => tenantPrisma.sale.findMany({ ...args, where: { ...args?.where, stationId } }),
      findFirst: (args?: any) => tenantPrisma.sale.findFirst({ ...args, where: { ...args?.where, stationId } }),
      count: (args?: any) => tenantPrisma.sale.count({ ...args, where: { ...args?.where, stationId } }),
    },
    purchases: {
      findMany: (args?: any) => tenantPrisma.purchase.findMany({ ...args, where: { ...args?.where, stationId } }),
      findFirst: (args?: any) => tenantPrisma.purchase.findFirst({ ...args, where: { ...args?.where, stationId } }),
    },
    auditLogs: {
      findMany: (args?: any) => tenantPrisma.auditLog.findMany({ ...args, where: { ...args?.where, stationId } }),
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

const CORE_DDL_BATCHES = [
  `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tenant')
  BEGIN
      CREATE TABLE [dbo].[Tenant] (
          [id] NVARCHAR(1000) NOT NULL PRIMARY KEY DEFAULT LOWER(NEWID()),
          [slug] NVARCHAR(1000) NOT NULL UNIQUE,
          [name] NVARCHAR(1000) NOT NULL,
          [companyName] NVARCHAR(1000) NULL,
          [databaseName] NVARCHAR(1000) NOT NULL UNIQUE,
          [databaseServer] NVARCHAR(1000) NOT NULL DEFAULT 'localhost:1435',
          [status] NVARCHAR(1000) NOT NULL DEFAULT 'ACTIVE',
          [phone] NVARCHAR(1000) NULL,
          [email] NVARCHAR(1000) NULL,
          [address] NVARCHAR(1000) NOT NULL,
          [suspendedAt] DATETIME2 NULL,
          [suspendedReason] NVARCHAR(1000) NULL,
          [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
          [updatedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
  END`,

  `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tenant_status' AND object_id = OBJECT_ID('dbo.Tenant'))
  BEGIN
      CREATE INDEX [IX_Tenant_status] ON [dbo].[Tenant]([status]);
  END`,

  `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Station')
  BEGIN
      CREATE TABLE [dbo].[Station] (
          [id] NVARCHAR(1000) NOT NULL PRIMARY KEY DEFAULT LOWER(NEWID()),
          [slug] NVARCHAR(1000) NOT NULL UNIQUE,
          [name] NVARCHAR(1000) NOT NULL,
          [companyName] NVARCHAR(1000) NULL,
          [phone] NVARCHAR(1000) NULL,
          [email] NVARCHAR(1000) NULL,
          [address] NVARCHAR(1000) NOT NULL,
          [panNo] NVARCHAR(1000) NULL,
          [vatNo] NVARCHAR(1000) NULL,
          [dealerCode] NVARCHAR(1000) NULL,
          [logoUrl] NVARCHAR(MAX) NULL,
          [suspendedAt] DATETIME2 NULL,
          [suspendedReason] NVARCHAR(1000) NULL,
          [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
          [nextReceiptNo] INT NOT NULL DEFAULT 1
      );
  END`,

  `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'User')
  BEGIN
      CREATE TABLE [dbo].[User] (
          [id] NVARCHAR(1000) NOT NULL PRIMARY KEY DEFAULT LOWER(NEWID()),
          [stationId] NVARCHAR(1000) NOT NULL,
          [name] NVARCHAR(1000) NOT NULL,
          [username] NVARCHAR(1000) NOT NULL,
          [email] NVARCHAR(1000) NULL,
          [phone] NVARCHAR(1000) NULL,
          [employeeId] NVARCHAR(1000) NULL,
          [passwordHash] NVARCHAR(1000) NOT NULL,
          [role] NVARCHAR(1000) NOT NULL,
          [permissions] NVARCHAR(MAX) NULL,
          [active] BIT NOT NULL DEFAULT 1,
          [onShift] BIT NOT NULL DEFAULT 0,
          [shiftStartedAt] DATETIME2 NULL,
          [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
          [updatedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT [FK_User_Station] FOREIGN KEY ([stationId]) REFERENCES [dbo].[Station]([id]) ON DELETE CASCADE ON UPDATE NO ACTION,
          CONSTRAINT [UQ_User_station_username] UNIQUE ([stationId], [username])
      );
  END`,

  `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tank')
  BEGIN
      CREATE TABLE [dbo].[Tank] (
          [id] NVARCHAR(1000) NOT NULL PRIMARY KEY DEFAULT LOWER(NEWID()),
          [stationId] NVARCHAR(1000) NOT NULL,
          [fuel] NVARCHAR(1000) NOT NULL,
          [capacityL] DECIMAL(12, 3) NOT NULL,
          [levelL] DECIMAL(12, 3) NOT NULL,
          [openingL] DECIMAL(12, 3) NOT NULL,
          [ratePerL] DECIMAL(10, 2) NOT NULL,
          [lowStockPct] DECIMAL(5, 2) NOT NULL DEFAULT 20.0,
          [updatedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT [FK_Tank_Station] FOREIGN KEY ([stationId]) REFERENCES [dbo].[Station]([id]) ON DELETE CASCADE ON UPDATE NO ACTION,
          CONSTRAINT [UQ_Tank_station_fuel] UNIQUE ([stationId], [fuel])
      );
  END`,

  `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StationInvoiceSettings')
  BEGIN
      CREATE TABLE [dbo].[StationInvoiceSettings] (
          [id] NVARCHAR(1000) NOT NULL PRIMARY KEY DEFAULT LOWER(NEWID()),
          [stationId] NVARCHAR(1000) NOT NULL UNIQUE,
          [panNo] NVARCHAR(1000) NULL,
          [vatNo] NVARCHAR(1000) NULL,
          [showPan] BIT NOT NULL DEFAULT 1,
          [showVat] BIT NOT NULL DEFAULT 1,
          [showLogo] BIT NOT NULL DEFAULT 1,
          [paperSize] NVARCHAR(1000) NOT NULL DEFAULT 'A4',
          [templateId] NVARCHAR(1000) NOT NULL DEFAULT 'STANDARD',
          [updatedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT [FK_StationInvoiceSettings_Station] FOREIGN KEY ([stationId]) REFERENCES [dbo].[Station]([id]) ON DELETE CASCADE ON UPDATE NO ACTION
      );
  END`,

  `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PlatformAdmin')
  BEGIN
      CREATE TABLE [dbo].[PlatformAdmin] (
          [id] NVARCHAR(1000) NOT NULL PRIMARY KEY DEFAULT LOWER(NEWID()),
          [username] NVARCHAR(1000) NOT NULL UNIQUE,
          [email] NVARCHAR(1000) NULL,
          [name] NVARCHAR(1000) NOT NULL,
          [passwordHash] NVARCHAR(1000) NOT NULL,
          [active] BIT NOT NULL DEFAULT 1,
          [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
          [updatedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
  END`
];

let hasEnsuredTables = false;

async function ensureCoreTables(master: PrismaClient) {
  if (hasEnsuredTables) return;
  for (const ddl of CORE_DDL_BATCHES) {
    try {
      await master.$executeRawUnsafe(ddl);
    } catch (err) {
      console.warn("ensureCoreTables DDL note:", err);
    }
  }
  hasEnsuredTables = true;
}

/**
 * Standard Multi-Tenant Station Provisioner.
 * 1. Creates Station record in the multi-tenant database (tables migrated once)
 * 2. Creates Station Admin Owner account linked via stationId
 * 3. Registers Tenant with its Tenant Key / Database Name
 * 4. Seeds default storage tanks linked via stationId
 */
export async function provisionTenantDatabase(input: ProvisionStationInput) {
  const master = getMasterDb();
  await ensureCoreTables(master);

  const cleanSlug = input.slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const tenantKey = input.databaseName?.trim() || cleanSlug.replace(/-/g, "_");

  // 1. Create Station record in the shared multi-tenant database
  const station = await master.station.upsert({
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

  // 2. Create Station Admin Owner user linked with station.id (tenant_id)
  const adminUser = await master.user.upsert({
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

  // 3. Register in Tenant registry
  const tenant = await master.tenant.upsert({
    where: { slug: cleanSlug },
    create: {
      slug: cleanSlug,
      name: input.name,
      companyName: input.companyName,
      databaseName: tenantKey,
      databaseServer: SQL_SERVER_HOST,
      status: "ACTIVE",
      address: input.address,
      phone: input.phone,
      email: input.email,
    },
    update: {
      name: input.name,
      companyName: input.companyName,
      databaseName: tenantKey,
      address: input.address,
      phone: input.phone,
      email: input.email,
      status: "ACTIVE",
    },
  });

  // 4. Seed default storage tanks linked with station.id
  const defaultTanks = [
    { fuel: "PETROL", capacityL: 20000, levelL: 14500, openingL: 14500, ratePerL: 172.5 },
    { fuel: "DIESEL", capacityL: 25000, levelL: 18200, openingL: 18200, ratePerL: 155.0 },
    { fuel: "CNG", capacityL: 10000, levelL: 6800, openingL: 6800, ratePerL: 110.0 },
  ];

  for (const t of defaultTanks) {
    await master.tank.upsert({
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

  // 5. Invalidate tenant cache
  invalidateTenantCache(cleanSlug);

  return {
    tenant,
    station,
    adminUser,
    databaseName: tenantKey,
  };
}
