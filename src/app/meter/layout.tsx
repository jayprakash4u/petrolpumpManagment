import type { ReactNode } from "react";
import { requireUser } from "@/lib/dal";
import { DashboardShell } from "@/components/shell/DashboardShell";

export default async function MeterLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <DashboardShell title="Meter Report" userName={user.name} userRole={user.role}>
      {children}
    </DashboardShell>
  );
}
