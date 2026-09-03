import { requirePlatformAdmin } from "@/lib/platform-dal";
import { getStationsDirectoryQuery } from "@/lib/queries/platform";
import { StationsDirectoryView } from "@/components/admin/StationsDirectoryView";

export default async function AdminStationsDirectoryPage() {
  await requirePlatformAdmin();
  const stations = await getStationsDirectoryQuery();
  return <StationsDirectoryView initialStations={stations} />;
}
