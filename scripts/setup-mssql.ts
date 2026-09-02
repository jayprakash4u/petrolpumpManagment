/**
 * Bootstrap MSSQL Express databases for local multi-tenant dev.
 * Reads connection settings from .env (SQL_SERVER_* / MASTER_DB_NAME).
 *
 * Usage: npm run db:setup:mssql
 */
import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyMigrations } from "../src/lib/migrations/apply";

function loadEnvFile() {
  const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile();

const host = process.env.SQL_SERVER_HOST || "localhost:1435";
const user = process.env.SQL_SERVER_USER || "fsm_dev";
const pass = process.env.SQL_SERVER_PASS || "FuelStation2026Password!";
const masterDb = process.env.MASTER_DB_NAME || "FuelStationMasterDB";
const tenantDb = process.env.TENANT_DB_NAME || "FuelStation_shree_petroleum";

function escIdent(value: string): string {
  return value.replace(/\]/g, "]]");
}

function escLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

function buildUrl(dbName: string): string {
  return `sqlserver://${host};database=${dbName};user=${user};password=${pass};trustServerCertificate=true;connectionTimeout=15000;connectTimeout=15000;`;
}

const MASTER_SCHEMA_SQL = `
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tenant')
BEGIN
    CREATE TABLE [dbo].[Tenant] (
        [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
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
    CREATE INDEX [IX_Tenant_status] ON [dbo].[Tenant]([status]);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PlatformAdmin')
BEGIN
    CREATE TABLE [dbo].[PlatformAdmin] (
        [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
        [username] NVARCHAR(1000) NOT NULL UNIQUE,
        [email] NVARCHAR(1000) NULL,
        [name] NVARCHAR(1000) NOT NULL,
        [passwordHash] NVARCHAR(1000) NOT NULL,
        [active] BIT NOT NULL DEFAULT 1,
        [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        [updatedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PlatformSession')
BEGIN
    CREATE TABLE [dbo].[PlatformSession] (
        [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
        [adminId] NVARCHAR(1000) NOT NULL,
        [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        [expiresAt] DATETIME2 NOT NULL,
        [revokedAt] DATETIME2 NULL,
        [userAgent] NVARCHAR(1000) NULL,
        [ipAddress] NVARCHAR(1000) NULL,
        CONSTRAINT [FK_PlatformSession_Admin] FOREIGN KEY ([adminId]) REFERENCES [dbo].[PlatformAdmin]([id]) ON DELETE CASCADE ON UPDATE NO ACTION
    );
    CREATE INDEX [IX_PlatformSession_adminId] ON [dbo].[PlatformSession]([adminId]);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PlatformAuditLog')
BEGIN
    CREATE TABLE [dbo].[PlatformAuditLog] (
        [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
        [actorId] NVARCHAR(1000) NULL,
        [action] NVARCHAR(1000) NOT NULL,
        [entityType] NVARCHAR(1000) NOT NULL,
        [entityId] NVARCHAR(1000) NOT NULL,
        [metadata] NVARCHAR(MAX) NULL,
        [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT [FK_PlatformAuditLog_Admin] FOREIGN KEY ([actorId]) REFERENCES [dbo].[PlatformAdmin]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
    );
    CREATE INDEX [IX_PlatformAuditLog_createdAt] ON [dbo].[PlatformAuditLog]([createdAt]);
    CREATE INDEX [IX_PlatformAuditLog_entity] ON [dbo].[PlatformAuditLog]([entityType], [entityId]);
END;
`;

async function applyMasterSchema() {
  const masterClient = new PrismaClient({ datasources: { db: { url: buildUrl(masterDb) } } });
  try {
    await masterClient.$executeRawUnsafe(MASTER_SCHEMA_SQL);
    console.log("✅ Master database schema applied");
  } finally {
    await masterClient.$disconnect();
  }
}

async function applyTenantSchema() {
  const tenantClient = new PrismaClient({ datasources: { db: { url: buildUrl(tenantDb) } } });
  try {
    const result = await applyMigrations(tenantClient);
    if (result.status === "failed") {
      throw new Error(result.error ?? "Tenant migration failed");
    }
    console.log(`✅ Tenant database schema applied (${result.status})`);
  } finally {
    await tenantClient.$disconnect();
  }
}

async function dropDatabaseIfExists(serverClient: PrismaClient, dbName: string) {
  const db = escIdent(dbName);
  await serverClient.$executeRawUnsafe(`
    IF EXISTS (SELECT * FROM sys.databases WHERE name = N'${escLiteral(dbName)}')
    BEGIN
      ALTER DATABASE [${db}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
      DROP DATABASE [${db}];
    END
  `);
  console.log(`🗑️  Dropped existing database [${dbName}] (if any)`);
}

async function ensureDatabase(serverClient: PrismaClient, dbName: string, login: string, recreate = false) {
  if (recreate) {
    await dropDatabaseIfExists(serverClient, dbName);
  }

  const db = escIdent(dbName);
  const loginId = escIdent(login);

  await serverClient.$executeRawUnsafe(`
    IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'${escLiteral(dbName)}')
      CREATE DATABASE [${db}];
  `);

  // New databases may already map the creating login as dbo — grant only when needed.
  try {
    await serverClient.$executeRawUnsafe(`
      EXEC(N'
        USE [${db}];
        IF NOT EXISTS (
          SELECT 1 FROM sys.database_principals dp
          INNER JOIN sys.server_principals sp ON dp.sid = sp.sid
          WHERE sp.name = N''${escLiteral(login)}''
        )
          CREATE USER [${loginId}] FOR LOGIN [${loginId}];
        IF IS_ROLEMEMBER(N''db_owner'', N''${escLiteral(login)}'') <> 1
          ALTER ROLE db_owner ADD MEMBER [${loginId}];
      ');
    `);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("15063") && !message.includes("already has an account")) {
      throw err;
    }
  }

  console.log(`✅ Database [${dbName}] ready (login: ${login})`);
}

async function verifyConnection(dbName: string) {
  const client = new PrismaClient({ datasources: { db: { url: buildUrl(dbName) } } });
  try {
    await client.$queryRawUnsafe("SELECT 1 AS ok");
    console.log(`✅ Verified connection to [${dbName}]`);
  } finally {
    await client.$disconnect();
  }
}

async function main() {
  console.log("==================================================");
  console.log("Setting up MSSQL database-per-tenant (local dev)");
  console.log(`Server: ${host}`);
  console.log("==================================================");

  const server = new PrismaClient({ datasources: { db: { url: buildUrl("master") } } });

  const recreate = process.argv.includes("--fresh") || !process.argv.includes("--keep");

  try {
    await ensureDatabase(server, masterDb, user, recreate);
    await ensureDatabase(server, tenantDb, user, recreate);
  } finally {
    await server.$disconnect();
  }

  await verifyConnection(masterDb);
  await verifyConnection(tenantDb);

  await applyMasterSchema();
  await applyTenantSchema();

  console.log("Seeding demo data …");
  execFileSync("npm", ["run", "db:seed"], { stdio: "inherit", cwd: path.join(path.dirname(fileURLToPath(import.meta.url)), ".."), shell: true });

  console.log("==================================================");
  console.log("Setup complete.");
  console.log("  Station login: /login  (station: shree-petroleum, user: prakash)");
  console.log("  Platform admin: /admin/login  (user: admin)");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
