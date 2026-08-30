import { requirePlatformAdmin } from "@/lib/platform-dal";
import { DatabaseBackupsView } from "@/components/admin/DatabaseBackupsView";

export default async function DatabaseSettingsPage() {
  await requirePlatformAdmin();
  return <DatabaseBackupsView />;
}
