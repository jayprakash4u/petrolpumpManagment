import { requireUser } from "@/lib/dal";
import { DashboardShell } from "@/components/shell/DashboardShell";

export default async function SalesLayout({ children }: LayoutProps<"/sales">) {
  const user = await requireUser();

  return (
    <DashboardShell
      title="Sales"
      userName={user.name}
      userRole={user.role}
      stationName={user.station.name}
      logoUrl={user.station.logoUrl}
    >
      {children}
    </DashboardShell>
  );
}
