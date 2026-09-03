import { requirePlatformAdmin } from "@/lib/platform-dal";
import { PlatformSettingsView } from "@/components/admin/PlatformSettingsView";

export default async function AdminSettingsPage() {
  await requirePlatformAdmin();
  return <PlatformSettingsView />;
}
