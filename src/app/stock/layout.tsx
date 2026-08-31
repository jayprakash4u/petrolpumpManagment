import { requireUser } from "@/lib/dal";
import { DashboardShell } from "@/components/shell/DashboardShell";

export default async function StockLayout({ children }: LayoutProps<"/stock">) {
  const user = await requireUser();

  return (
    <DashboardShell title="Tank & Stock" userName={user.name} userRole={user.role} stationName={user.station.name}>
      {children}
    </DashboardShell>
  );
}
