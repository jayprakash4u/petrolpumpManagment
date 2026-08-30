import { requireUser } from "@/lib/dal";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { SystemSubnav } from "@/components/system/SystemSubnav";

export default async function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <DashboardShell title="Help & Support" userName={user.name} userRole={user.role}>
      <SystemSubnav />
      {children}
    </DashboardShell>
  );
}
