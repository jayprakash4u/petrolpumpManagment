import { requirePlatformAdmin } from "@/lib/platform-dal";
import { NewStationWizardView } from "@/components/admin/NewStationWizardView";

export default async function OnboardStationPage() {
  await requirePlatformAdmin();
  return <NewStationWizardView />;
}
