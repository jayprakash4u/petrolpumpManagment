"use client";

import { useSyncExternalStore } from "react";
import { Clock, Menu, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { logoutAction } from "@/lib/actions/auth";
import { ROLE_LABEL } from "@/lib/permissions";
import type { Role } from "@prisma/client";

function nowTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

/**
 * The wall clock is external, mutable state that genuinely differs between
 * server and client, which is exactly what useSyncExternalStore is for:
 * the server snapshot is null (rendering "--:--"), so there's no hydration
 * mismatch, and the client resubscribes on its own cadence. Returning a
 * string from getSnapshot is safe — React compares with Object.is, and two
 * reads inside the same minute are equal.
 */
function subscribeToClock(onChange: () => void) {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}

export function TopBar({
  title,
  userName,
  userRole,
  onMenu,
}: {
  title: string;
  userName: string;
  userRole: Role;
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
        <div className="font-data hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-[7px] text-[12.5px] text-text-muted sm:flex">
          <Clock size={13} />
          {time ?? "--:--"}
          <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-success" />
          LIVE
        </div>

        <div className="hidden text-right sm:block">
          <div className="text-[13px] font-semibold text-text">{userName}</div>
          <div className="font-data text-[10.5px] tracking-wide text-text-muted">{ROLE_LABEL[userRole].toUpperCase()}</div>
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
