import "server-only";
import { getMasterDb, getTenantDb } from "@/lib/tenant-db";
import { applyMigrations, getAppliedIds, SCHEMA_TARGET } from "./apply";
import { TENANT_MIGRATIONS } from "./tenant-migrations";
import type { ApplyMigrationsResult } from "./apply";

export { SCHEMA_TARGET, TENANT_MIGRATIONS };

export interface TenantMigrationResult extends ApplyMigrationsResult {
  slug: string;
}

/** Resolves the tenant by slug via the master registry, then applies its pending migrations. */
export async function runMigrationsForTenant(slug: string): Promise<TenantMigrationResult> {
  const tenantDb = await getTenantDb(slug);
  const result = await applyMigrations(tenantDb);
  return { slug, ...result };
}

export interface TenantMigrationStatus {
  slug: string;
  name: string;
  appliedCount: number;
  latestId: string | null;
  upToDate: boolean;
  reachable: boolean;
  error?: string;
}

/**
 * Read-only: where every tenant actually stands vs. SCHEMA_TARGET, without
 * changing anything. This is what "Check Migration Status" calls, and what
 * the admin dashboard renders — the primary path is *visibility*, not a
 * button that applies changes.
 */
export async function getStatusForAllTenants(): Promise<TenantMigrationStatus[]> {
  const master = getMasterDb();
  const tenants = await master.tenant.findMany({
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });

  return Promise.all(
    tenants.map(async ({ slug, name }): Promise<TenantMigrationStatus> => {
      try {
        const tenantDb = await getTenantDb(slug);
        const applied = await getAppliedIds(tenantDb);
        const appliedOrdered = TENANT_MIGRATIONS.filter((m) => applied.has(m.id));
        const latest = appliedOrdered[appliedOrdered.length - 1];
        return {
          slug,
          name,
          appliedCount: appliedOrdered.length,
          latestId: latest?.id ?? null,
          upToDate: applied.size >= TENANT_MIGRATIONS.length && latest?.id === SCHEMA_TARGET,
          reachable: true,
        };
      } catch (err) {
        console.error(`getStatusForAllTenants: ${slug} unreachable`, err);
        return {
          slug,
          name,
          appliedCount: 0,
          latestId: null,
          upToDate: false,
          reachable: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    })
  );
}

/**
 * Applies pending migrations across every tenant. Each tenant is
 * independent — one connection timeout or one bad statement never stops the
 * rest of the batch from being attempted. This is the emergency / explicit
 * "Migrate Now" path; a real deploy should call `runMigrationsForTenant`
 * per tenant from its own pipeline step instead of relying on someone
 * clicking this.
 */
export async function runPendingForAllTenants(): Promise<TenantMigrationResult[]> {
  const master = getMasterDb();
  const tenants = await master.tenant.findMany({ select: { slug: true } });

  const results: TenantMigrationResult[] = [];
  for (const { slug } of tenants) {
    try {
      results.push(await runMigrationsForTenant(slug));
    } catch (err) {
      console.error(`runPendingForAllTenants: ${slug} threw outside runMigrationsForTenant`, err);
      results.push({
        slug,
        appliedIds: [],
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}
