import { requireUser } from "@/lib/dal";
import { DashboardShell } from "@/components/shell/DashboardShell";

export default async function ReportsLayout({ children }: LayoutProps<"/reports">) {
  const user = await requireUser();

  return (
    <DashboardShell activeHref="/reports" title="Reports" userName={user.name} userRole={user.role}>
      {children}
    </DashboardShell>
  );
}
