"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw, Fuel, Ship } from "lucide-react";
import { clsx } from "clsx";

export const COMPLIANCE_TABS = [
  { href: "/ird", label: "IRD Realtime Sync (CBMS)", icon: RefreshCw },
  { href: "/noc", label: "NOC Indents & Pricing (नेपाल आयल निगम)", icon: Fuel },
  { href: "/vcts", label: "VCTS Consignments (राजस्व अनुसन्धान)", icon: Ship },
];

export function ComplianceSubnav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface p-1.5">
      {COMPLIANCE_TABS.map((tab) => {
        const isActive =
          pathname === tab.href || pathname.startsWith(tab.href + "/");
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
