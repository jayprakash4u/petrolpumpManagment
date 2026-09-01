import type { ReactNode } from "react";
import { requireUser } from "@/lib/dal";
import { DashboardShell } from "@/components/shell/DashboardShell";

export default async function ApprovalsLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <DashboardShell
      title="User Management Approvals"
      userName={user.name}
      userRole={user.role}
      stationName={user.station.name}
      logoUrl={user.station.logoUrl}
    >
      {children}
    </DashboardShell>
  );
}
