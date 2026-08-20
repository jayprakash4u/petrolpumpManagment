import { requireUser } from "@/lib/dal";
import { DashboardShell } from "@/components/shell/DashboardShell";

export default async function EmployeesLayout({ children }: LayoutProps<"/employees">) {
  const user = await requireUser();

  return (
    <DashboardShell activeHref="/employees" title="Employees" userName={user.name} userRole={user.role}>
      {children}
    </DashboardShell>
  );
}
