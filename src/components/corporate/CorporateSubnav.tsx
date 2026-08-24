"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Building2,
  Car,
  Fuel,
  FileBarChart2,
} from "lucide-react";
import { clsx } from "clsx";

const CORP_TABS = [
  { href: "/corporate", label: "Overview", icon: LayoutGrid },
  { href: "/corporate/accounts", label: "Corporate Accounts", icon: Building2 },
  { href: "/corporate/vehicles", label: "Fleet Vehicles & Quotas", icon: Car },
  { href: "/corporate/authorize", label: "Authorize Dispense", icon: Fuel },
  { href: "/corporate/statements", label: "Billing Statements", icon: FileBarChart2 },
];

export function CorporateSubnav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface p-1.5">
      {CORP_TABS.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={clsx(
              "font-display inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
              isActive
                ? "bg-accent/15 font-semibold text-accent shadow-xs"
                : "text-text-muted hover:bg-surface-hi hover:text-text"
            )}
          >
            <Icon size={14} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
