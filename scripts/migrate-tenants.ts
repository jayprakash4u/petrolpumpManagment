/**
 * The mechanism a real deploy step calls to bring every tenant database up
 * to the schema the current codebase expects — not the admin panel, which
 * is for visibility and controlled recovery (see the "Database Migrations"
 * page under Platform Admin → System Settings).
 *
 *   npm run db:migrate:tenants           — apply pending migrations everywhere
 *   npm run db:migrate:tenants -- --check — status only, applies nothing
 *
 * One tenant failing never stops the others.
 *
 * Runs standalone via `tsx`, outside Next's bundler — `src/lib/tenant-db.ts`
 * carries a `server-only` guard that only behaves as a no-op inside Next's
 * server build, so this script builds its own connections the same way
 * `tenant-db.ts` does rather than importing it directly. The actual
 * migration logic (`applyMigrations`) is still the one shared
 * implementation in `src/lib/migrations/apply.ts` — no duplication there.
 */
import { PrismaClient } from "@prisma/client";
import { applyMigrations, getAppliedIds, SCHEMA_TARGET } from "../src/lib/migrations/apply";
import { TENANT_MIGRATIONS } from "../src/lib/migrations/tenant-migrations";

const SQL_SERVER_HOST = process.env.SQL_SERVER_HOST || "127.0.0.1:1435";
const SQL_SERVER_USER = process.env.SQL_SERVER_USER || "fsm_dev";
const SQL_SERVER_PASS = process.env.SQL_SERVER_PASS || "FuelStation2026Password!";
const MASTER_DB_NAME = process.env.MASTER_DB_NAME || "FuelStationMasterDB";

function buildUrl(dbName: string, host = SQL_SERVER_HOST) {
  return `sqlserver://${host};database=${dbName};user=${SQL_SERVER_USER};password=${SQL_SERVER_PASS};trustServerCertificate=true;connectionTimeout=15000;connectTimeout=15000;`;
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  const master = new PrismaClient({ datasources: { db: { url: buildUrl(MASTER_DB_NAME) } } });

  try {
    const tenants = await master.tenant.findMany({ select: { slug: true, name: true, databaseName: true, databaseServer: true } });
    console.log(`Schema target: ${SCHEMA_TARGET} (${TENANT_MIGRATIONS.length} migrations)\n`);

    let behindOrFailed = 0;

    for (const t of tenants) {
      const tenantDb = new PrismaClient({
        datasources: { db: { url: buildUrl(t.databaseName, t.databaseServer || SQL_SERVER_HOST) } },
      });

      try {
        if (checkOnly) {
          const applied = await getAppliedIds(tenantDb);
          const upToDate = applied.size >= TENANT_MIGRATIONS.length;
          if (!upToDate) behindOrFailed++;
          const latest = TENANT_MIGRATIONS.filter((m) => applied.has(m.id)).at(-1)?.id ?? "none";
          console.log(`${upToDate ? "✓" : "⟳"} ${t.name.padEnd(28)} ${t.slug.padEnd(24)} ${latest}`);
        } else {
          const result = await applyMigrations(tenantDb);
          if (result.status === "failed") behindOrFailed++;
          const icon = result.status === "failed" ? "✗" : "✓";
          const detail = result.appliedIds.length > 0 ? `applied ${result.appliedIds.join(", ")}` : result.status;
          console.log(`${icon} ${t.slug.padEnd(24)} ${detail}${result.error ? `  (${result.error})` : ""}`);
        }
      } catch (err) {
        behindOrFailed++;
        console.log(`✗ ${t.slug.padEnd(24)} unreachable: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        await tenantDb.$disconnect();
      }
    }

    console.log(`\n${tenants.length} tenants, ${tenants.length - behindOrFailed} ${checkOnly ? "up to date" : "succeeded"}, ${behindOrFailed} ${checkOnly ? "behind" : "failed"}.`);
    process.exit(behindOrFailed > 0 ? 1 : 0);
  } finally {
    await master.$disconnect();
  }
}

main().catch((err) => {
  console.error("migrate-tenants failed:", err);
  process.exit(1);
});
