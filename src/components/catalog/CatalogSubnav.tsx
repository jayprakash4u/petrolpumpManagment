"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  Package,
  PlusCircle,
  BarChart3,
  CalendarDays,
  ArrowRightLeft,
  Fuel,
  BookOpen,
  Warehouse,
  Boxes,
} from "lucide-react";

const CATALOG_TABS = [
  { href: "/catalog/products", label: "Products", icon: Package },
  { href: "/catalog/products/new", label: "Add Product", icon: PlusCircle },
  { href: "/catalog/stock-report", label: "Stock Report", icon: BarChart3 },
  { href: "/catalog/interval-stock", label: "Interval Report", icon: CalendarDays },
  { href: "/catalog/adjustment", label: "Stock Adjustment", icon: ArrowRightLeft },
  { href: "/catalog/adjustments", label: "Adjustment List", icon: ArrowRightLeft },
  { href: "/catalog/opening-stock", label: "Opening Stock", icon: BookOpen },
  { href: "/catalog/fiscal-opening-stock", label: "Fiscal Opening Stock", icon: BookOpen },
  { href: "/catalog/additional-opening-stock", label: "Additional Stock", icon: PlusCircle },
  { href: "/purchases/assets", label: "Fixed Assets", icon: Warehouse },
  { href: "/catalog/fixed-assets/categories", label: "Asset Category", icon: Boxes },
  { href: "/catalog/transfer", label: "Stock Transfer", icon: ArrowRightLeft },
  { href: "/catalog/ledgers/diesel", label: "Diesel Ledger", icon: Fuel },
  { href: "/catalog/ledgers/petrol", label: "Petrol Ledger", icon: Fuel },
  { href: "/catalog/ledgers/diesel-meter", label: "Diesel Meter", icon: Fuel },
  { href: "/catalog/ledgers/petrol-meter", label: "Petrol Meter", icon: Fuel },
];

export function CatalogSubnav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Catalog Navigation" className="mb-4 flex flex-wrap gap-1.5 border-b border-border/80 pb-2">
      {CATALOG_TABS.map((tab) => {
        const isActive = pathname === tab.href || (pathname.startsWith(tab.href + "/") && tab.href !== "/catalog/products");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "font-display flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              isActive
                ? "bg-accent text-[#1A1306] shadow-xs"
                : "border border-border/60 bg-surface text-text-muted hover:border-border hover:bg-surface-hi hover:text-text"
            )}
          >
            <tab.icon size={13} className="shrink-0" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
