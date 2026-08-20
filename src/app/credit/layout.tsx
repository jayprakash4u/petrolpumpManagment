import { requireUser } from "@/lib/dal";
import { DashboardShell } from "@/components/shell/DashboardShell";

export default async function CreditLayout({ children }: LayoutProps<"/credit">) {
  const user = await requireUser();

  return (
    <DashboardShell activeHref="/credit" title="Credit Customers" userName={user.name} userRole={user.role}>
      {children}
    </DashboardShell>
  );
}
