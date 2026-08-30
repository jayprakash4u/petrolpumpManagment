import { requirePlatformAdmin } from "@/lib/platform-dal";
import { PlatformPreferencesView } from "@/components/admin/PlatformPreferencesView";

export default async function PlatformPreferencesPage() {
  await requirePlatformAdmin();
  return <PlatformPreferencesView />;
}
