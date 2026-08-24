"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookText,
  Undo2,
  FileSpreadsheet,
  FileCheck2,
  BarChart3,
  Boxes,
} from "lucide-react";
import { clsx } from "clsx";

const IRD_TABS = [
  { href: "/reports/ird/sales", label: "Sales Register (अनुसूची ५)", icon: BookText },
  { href: "/reports/ird/sales-returns", label: "Sales Returns", icon: Undo2 },
  { href: "/reports/ird/purchase", label: "Purchase Register (अनुसूची ४)", icon: FileSpreadsheet },
  { href: "/reports/ird/purchase-returns", label: "Purchase Returns", icon: Undo2 },
  { href: "/reports/ird/vat-return", label: "VAT Return (अनुसूची १०)", icon: FileCheck2 },
  { href: "/reports/ird/monthly", label: "Monthly Summary", icon: BarChart3 },
  { href: "/reports/ird/stock", label: "Quantitative Stock (मात्रात्मक)", icon: Boxes },
];

export function IrdSubnav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface p-1.5">
      {IRD_TABS.map((tab) => {
        const isActive =
          pathname === tab.href ||
          (pathname === "/reports/ird" && tab.href === "/reports/ird/sales");
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
