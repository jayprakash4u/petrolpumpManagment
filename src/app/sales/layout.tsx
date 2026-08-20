import { requireUser } from "@/lib/dal";
import { DashboardShell } from "@/components/shell/DashboardShell";

export default async function SalesLayout({ children }: LayoutProps<"/sales">) {
  const user = await requireUser();

  return (
    <DashboardShell activeHref="/sales" title="Sales Entry" userName={user.name} userRole={user.role}>
      {children}
    </DashboardShell>
  );
}
