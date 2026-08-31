import type { PrismaClient } from "@prisma/client";
import { TENANT_MIGRATIONS, type TenantMigration } from "./tenant-migrations";

/**
 * The DB-connection-agnostic half of the migration system: given an
 * already-connected tenant `PrismaClient`, figure out what's pending and
 * apply it. Deliberately has no dependency on tenant-db.ts's
 * slug-resolution helpers (`getTenantDb`/`getMasterDb`) — tenant-db.ts
 * itself needs to call `applyMigrations` while provisioning a brand-new
 * database that isn't registered in the master Tenant table yet, so this
 * module can't depend back on tenant-db.ts without a circular import.
 *
 * No `server-only` guard here on purpose: this module also needs to run
 * from `scripts/migrate-tenants.ts` via plain `tsx`, outside Next's
 * bundler (where `server-only` only behaves as a no-op guard — imported
 * directly through Node it throws unconditionally). Every real caller in
 * the app reaches this through tenant-db.ts, which does carry the guard.
 */

/** How many migrations exist right now — the schema every tenant should reach. */
export const SCHEMA_TARGET = TENANT_MIGRATIONS[TENANT_MIGRATIONS.length - 1]?.id ?? "none";

/**
 * Splits a migration's raw SQL into individual batches on the same
 * `";\n\n"` convention `provisionTenantDatabase` already used — required
 * because a T-SQL `IF ... BEGIN ... END` block must be sent as one batch,
 * not split mid-block.
 */
function splitStatements(sql: string): string[] {
  return sql
    .split(";\n\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Creates the ledger table if this tenant has never been touched by the migration system before. */
async function ensureLedgerTable(tenantDb: PrismaClient): Promise<void> {
  await tenantDb.$executeRawUnsafe(`
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '_schema_migrations')
BEGIN
    CREATE TABLE [dbo].[_schema_migrations] (
        [id] NVARCHAR(200) NOT NULL PRIMARY KEY,
        [appliedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
END
  `);
}

export async function getAppliedIds(tenantDb: PrismaClient): Promise<Set<string>> {
  await ensureLedgerTable(tenantDb);
  const rows = await tenantDb.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT [id] FROM [dbo].[_schema_migrations]`
  );
  return new Set(rows.map((r) => r.id));
}

export function getPendingMigrations(applied: Set<string>): TenantMigration[] {
  return TENANT_MIGRATIONS.filter((m) => !applied.has(m.id));
}

export interface ApplyMigrationsResult {
  /** Migrations this call actually applied — empty when already up to date or nothing succeeded. */
  appliedIds: string[];
  status: "up-to-date" | "migrated" | "failed";
  error?: string;
}

/**
 * Applies every migration not yet recorded, in order, recording each one as
 * it succeeds so a failure partway through leaves accurate partial
 * progress — a retry only re-attempts what's still pending, it doesn't redo
 * what already landed.
 */
export async function applyMigrations(tenantDb: PrismaClient): Promise<ApplyMigrationsResult> {
  const applied = await getAppliedIds(tenantDb);
  const pending = getPendingMigrations(applied);

  if (pending.length === 0) {
    return { appliedIds: [], status: "up-to-date" };
  }

  const appliedNow: string[] = [];
  try {
    for (const migration of pending) {
      for (const statement of splitStatements(migration.sql)) {
        await tenantDb.$executeRawUnsafe(statement);
      }
      await tenantDb.$executeRawUnsafe(
        `INSERT INTO [dbo].[_schema_migrations] ([id]) VALUES ('${migration.id.replace(/'/g, "''")}')`
      );
      appliedNow.push(migration.id);
    }
    return { appliedIds: appliedNow, status: "migrated" };
  } catch (err) {
    console.error("applyMigrations failed", err);
    return {
      appliedIds: appliedNow,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
