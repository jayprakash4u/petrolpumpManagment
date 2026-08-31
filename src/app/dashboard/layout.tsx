import { requireUser } from "@/lib/dal";
import { DashboardShell } from "@/components/shell/DashboardShell";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser();

  return (
    <DashboardShell title="Dashboard" userName={user.name} userRole={user.role} stationName={user.station.name}>
      {children}
    </DashboardShell>
  );
}
