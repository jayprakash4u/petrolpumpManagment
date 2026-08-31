import { requireUser } from "@/lib/dal";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { SystemSubnav } from "@/components/system/SystemSubnav";

export default async function ArchiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <DashboardShell title="Log Archive" userName={user.name} userRole={user.role} stationName={user.station.name}>
      <SystemSubnav />
      {children}
    </DashboardShell>
  );
}
