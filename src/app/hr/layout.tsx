import type { ReactNode } from "react";
import { requireUser } from "@/lib/dal";
import { DashboardShell } from "@/components/shell/DashboardShell";

export default async function HrLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <DashboardShell title="HR & Payroll" userName={user.name} userRole={user.role}>
      {children}
    </DashboardShell>
  );
}
