"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Ruler, ArrowRightLeft, LayoutGrid } from "lucide-react";
import { clsx } from "clsx";

const SUB_TABS = [
  { href: "/meter", label: "Overview", icon: LayoutGrid },
  { href: "/meter/nozzle", label: "Nozzle Readings", icon: Gauge },
  { href: "/meter/dip", label: "Tank Dip Readings", icon: Ruler },
  { href: "/meter/reconciliation", label: "Shift Reconciliation", icon: ArrowRightLeft },
];

export function MeterSubnav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface p-1.5">
      {SUB_TABS.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={clsx(
              "font-display inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors",
              isActive
                ? "bg-accent/15 font-semibold text-accent shadow-xs"
                : "text-text-muted hover:bg-surface-hi hover:text-text"
            )}
          >
            <Icon size={15} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
