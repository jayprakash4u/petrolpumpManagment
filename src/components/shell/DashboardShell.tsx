"use client";

import { useState, type ReactNode } from "react";
import { Sidebar, SidebarContent } from "./Sidebar";
import { TopBar } from "./TopBar";
import type { Role } from "@prisma/client";

export function DashboardShell({
  activeHref,
  title,
  userName,
  userRole,
  children,
}: {
  activeHref: string;
  title: string;
  userName: string;
  userRole: Role;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar activeHref={activeHref} role={userRole} />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)}>
          {/* h-screen + the nav's own overflow-y-auto, so the full menu is
              reachable on a phone instead of running off the bottom. */}
          <aside
            className="flex h-screen w-[232px] flex-col overflow-hidden border-r border-border bg-surface p-[22px_14px]"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent activeHref={activeHref} role={userRole} />
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
