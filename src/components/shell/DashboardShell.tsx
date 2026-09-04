"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarContent } from "./Sidebar";
import { TopBar } from "./TopBar";
import { titleForPath } from "@/lib/page-titles";
import type { Role } from "@/lib/permissions";

export function DashboardShell({
  userRole,
  stationName,
  logoUrl,
  children,
}: {
  userRole: Role | string;
  stationName: string;
  logoUrl?: string | null;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Derived here, once, in the one shared shell — a sub-page like
  // /sales/bills must highlight its own sidebar row and show its own
  // section's title, and only the shell (mounted for every section) knows
  // which page is currently active.
  const activeHref = usePathname();
  const title = titleForPath(activeHref);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar activeHref={activeHref} role={userRole} stationName={stationName} logoUrl={logoUrl} />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)}>
          {/* h-screen + the nav's own overflow-y-auto, so the full menu is
              reachable on a phone instead of running off the bottom. */}
          <aside
            className="flex h-screen w-[268px] flex-col overflow-hidden border-r border-border bg-surface p-[22px_14px]"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent activeHref={activeHref} role={userRole} stationName={stationName} logoUrl={logoUrl} />
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 md:px-6 pt-[22px] pb-[60px] max-w-full">
        <TopBar title={title} userRole={userRole} onMenu={() => setMobileOpen(true)} />
        {children}
      </main>
    </div>
  );
}
