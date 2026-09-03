import { requirePlatformAdmin } from "@/lib/platform-dal";
import { getStationsDirectoryQuery, getPlatformOverview } from "@/lib/queries/platform";
import { CompanyAdminDashboardView } from "@/components/admin/CompanyAdminDashboardView";

export default async function AdminDashboardPage() {
  await requirePlatformAdmin();
  const [stations, overview] = await Promise.all([
    getStationsDirectoryQuery(),
    getPlatformOverview(),
  ]);

  return <CompanyAdminDashboardView initialStations={stations} overview={overview} />;
}
