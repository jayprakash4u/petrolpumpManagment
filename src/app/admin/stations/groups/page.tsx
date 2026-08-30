import { requirePlatformAdmin } from "@/lib/platform-dal";
import { StationGroupsView } from "@/components/admin/StationGroupsView";

export default async function StationGroupsPage() {
  await requirePlatformAdmin();
  return <StationGroupsView />;
}
