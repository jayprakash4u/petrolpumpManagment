"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Contact,
  Truck,
  Package,
  Undo2,
  Wallet,
  Warehouse,
  FileBarChart2,
} from "lucide-react";
import { clsx } from "clsx";

const PURCHASE_TABS = [
  { href: "/purchases", label: "Overview", icon: LayoutGrid },
  { href: "/purchases/suppliers", label: "Suppliers", icon: Contact },
  { href: "/purchases/fuel", label: "Purchase Bill Entry", icon: Truck },
  { href: "/purchases/items", label: "Other Items", icon: Package },
  { href: "/purchases/returns", label: "Returns", icon: Undo2 },
  { href: "/purchases/expenses", label: "Expenses", icon: Wallet },
  { href: "/purchases/assets", label: "Fixed Assets", icon: Warehouse },
  { href: "/purchases/report", label: "Report", icon: FileBarChart2 },
];

export function PurchaseSubnav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface p-1.5">
      {PURCHASE_TABS.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={clsx(
              "font-display inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors",
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
