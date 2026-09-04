"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  PlusCircle,
  Users,
  Banknote,
  Coins,
  CreditCard,
  ListOrdered,
  FileBarChart2,
  Fuel,
  Clock,
} from "lucide-react";

export const CUSTOMER_TABS = [
  { href: "/customers/new", label: "Add new customer", icon: PlusCircle },
  { href: "/customers/non-credit", label: "Non Credit Customers", icon: Users },
  { href: "/customers/parties-above-1", label: "Parties above 1", icon: Banknote },
  { href: "/customers/parties-above-5", label: "Parties above 5", icon: Coins },
  { href: "/customers/credit", label: "Credit Customers", icon: CreditCard },
  { href: "/customers/billed-list", label: "Billed list", icon: ListOrdered },
  { href: "/customers/usage-report", label: "Customers Usage Report", icon: FileBarChart2 },
  { href: "/customers/petrol-prices", label: "Petrol Prices", icon: Fuel },
  { href: "/customers/diesel-prices", label: "Diesel Prices", icon: Fuel },
  { href: "/customers/ageing-report", label: "Ageing Report", icon: Clock },
];

export function CustomersSubnav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Customers Navigation" className="mb-4 flex flex-wrap gap-1.5 border-b border-border/80 pb-2">
      {CUSTOMER_TABS.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
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
            <Icon size={13} className="shrink-0" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
