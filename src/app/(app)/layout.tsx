import type { ReactNode } from "react";
import { requireUser } from "@/lib/dal";
import { DashboardShell } from "@/components/shell/DashboardShell";

/**
 * The one shared shell for every authenticated tenant page. This used to be
 * ~20 near-identical layout.tsx files, one per top-level route, each
 * independently calling requireUser() and mounting its own
 * <DashboardShell>. Because each section had its own separate layout
 * instance, React had no shared layout to keep mounted across navigation —
 * clicking from Dashboard to Sales to Credit fully unmounted and remounted
 * the Sidebar/TopBar chrome (and re-ran the session lookup) on every click.
 * A single layout here means the shell mounts once and persists; only the
 * page content underneath swaps.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <DashboardShell
      userName={user.name}
      userRole={user.role}
      stationName={user.station.name}
      logoUrl={user.station.logoUrl}
    >
      {children}
    </DashboardShell>
  );
}
