"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarContent } from "./Sidebar";
import { TopBar } from "./TopBar";
import type { Role } from "@/lib/permissions";

export function DashboardShell({
  title,
  userName,
  userRole,
  stationName,
  children,
}: {
  title: string;
  userName: string;
  userRole: Role | string;
  stationName: string;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Derived here rather than passed in by every layout: a sub-page like
  // /sales/bills must highlight its own row, and a layout one level up cannot
  // know which child is being viewed.
  const activeHref = usePathname();

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar activeHref={activeHref} role={userRole} stationName={stationName} />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)}>
          {/* h-screen + the nav's own overflow-y-auto, so the full menu is
              reachable on a phone instead of running off the bottom. */}
          <aside
            className="flex h-screen w-[268px] flex-col overflow-hidden border-r border-border bg-surface p-[22px_14px]"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent activeHref={activeHref} role={userRole} stationName={stationName} />
          </aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-5 pt-[22px] pb-[60px]">
        <TopBar title={title} userName={userName} userRole={userRole} onMenu={() => setMobileOpen(true)} />
        {children}
      </main>
    </div>
  );
}
