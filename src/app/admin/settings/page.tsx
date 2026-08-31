import { requirePlatformAdmin } from "@/lib/platform-dal";
import { getStatusForAllTenants, SCHEMA_TARGET, TENANT_MIGRATIONS } from "@/lib/migrations/runner";
import { TenantMigrationsView } from "@/components/admin/TenantMigrationsView";
import { DatabaseBackupsView } from "@/components/admin/DatabaseBackupsView";
import packageJson from "../../../../package.json";

export default async function DatabaseSettingsPage() {
  await requirePlatformAdmin();
  const statuses = await getStatusForAllTenants();

  return (
    <div className="space-y-8">
      <TenantMigrationsView
        statuses={statuses}
        schemaTarget={SCHEMA_TARGET}
        totalMigrations={TENANT_MIGRATIONS.length}
        appVersion={packageJson.version}
      />
      <DatabaseBackupsView />
    </div>
  );
}
