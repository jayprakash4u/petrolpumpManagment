"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Radio, Sliders, Activity } from "lucide-react";
import { clsx } from "clsx";

export const PUMPS_TABS = [
  { href: "/pumps", label: "Forecourt Overview", icon: Activity },
  { href: "/pumps/status", label: "Pump Status", icon: Gauge },
  { href: "/pumps/nozzles", label: "Nozzle Telemetry", icon: Radio },
  { href: "/pumps/control", label: "Pump Control & E-Stop", icon: Sliders },
];

export function PumpsSubnav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface p-1.5">
      {PUMPS_TABS.map((tab) => {
        const isActive =
          tab.href === "/pumps"
            ? pathname === "/pumps"
            : pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={clsx(
              "font-display inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors whitespace-nowrap",
              isActive
                ? "bg-accent/15 font-semibold text-accent shadow-xs"
                : "text-text-muted hover:bg-surface-hi hover:text-text"
            )}
          >
            <Icon size={13} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
