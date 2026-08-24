import type { ReactNode } from "react";
import { requireUser } from "@/lib/dal";
import { DashboardShell } from "@/components/shell/DashboardShell";

export default async function CorporateLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <DashboardShell title="Corporate Pay & Fleet Management" userName={user.name} userRole={user.role}>
      {children}
    </DashboardShell>
  );
}
