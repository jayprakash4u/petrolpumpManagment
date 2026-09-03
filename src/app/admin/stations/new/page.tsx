import { requirePlatformAdmin } from "@/lib/platform-dal";
import { NewStationWizardView } from "@/components/admin/NewStationWizardView";

export default async function AdminNewStationPage() {
  await requirePlatformAdmin();
  return <NewStationWizardView />;
}
