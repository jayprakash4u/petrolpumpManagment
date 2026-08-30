import { requireUser } from "@/lib/dal";
import { MaintenanceModeView } from "@/components/system/MaintenanceModeView";

export default async function MaintenancePage() {
  await requireUser();
  return <MaintenanceModeView />;
}
