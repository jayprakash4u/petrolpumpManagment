"use client";

import { useSyncExternalStore } from "react";
import { Clock, Menu, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { logoutAction } from "@/lib/actions/auth";
import type { Role } from "@/lib/permissions";
import { ROLE_LABEL } from "@/lib/permissions";

import { NetworkStatusIndicator } from "./NetworkStatusIndicator";

function nowTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function subscribeToClock(onChange: () => void) {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}

export function TopBar({
  title,
  userRole,
  onMenu,
}: {
  title: string;
  userRole: Role | string;
  onMenu: () => void;
}) {
  const time = useSyncExternalStore(subscribeToClock, nowTime, () => null);

  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <button className="cursor-pointer text-text md:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <h1 className="font-display text-2xl font-bold tracking-tight text-text">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <NetworkStatusIndicator />

        <div className="font-data hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-[7px] text-[12.5px] text-text-muted sm:flex">
          <Clock size={13} />
          {time ?? "--:--"}
          <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-success" />
          LIVE
        </div>

        <div className="hidden sm:block">
          <div className="font-data text-[10px] tracking-wider text-accent uppercase font-bold">
            {ROLE_LABEL[userRole]}
          </div>
        </div>

        <ThemeToggle />

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-text-muted transition-colors hover:border-error/40 hover:text-error"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
