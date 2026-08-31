import type { ReactNode } from "react";
import { requireUser } from "@/lib/dal";
import { DashboardShell } from "@/components/shell/DashboardShell";

export default async function CouponsLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <DashboardShell title="Coupon Management" userName={user.name} userRole={user.role} stationName={user.station.name}>
      {children}
    </DashboardShell>
  );
}
