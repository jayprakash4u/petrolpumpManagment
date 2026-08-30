"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ScrollText,
  HandCoins,
  Truck,
  MailCheck,
  AlertTriangle,
  Percent,
  Boxes,
  ClipboardCheck,
} from "lucide-react";
import { clsx } from "clsx";

export const AUDITOR_TABS = [
  { href: "/reports/auditor", label: "Audit Overview", icon: ScrollText },
  { href: "/reports/auditor/debtors", label: "Debtor Ageing", icon: HandCoins },
  { href: "/reports/auditor/creditors", label: "Creditor Ageing", icon: Truck },
  { href: "/reports/auditor/confirmations", label: "Confirmations", icon: MailCheck },
  { href: "/reports/auditor/large-transactions", label: "Large Txns (>1L)", icon: AlertTriangle },
  { href: "/reports/auditor/vat-split", label: "Taxable vs Exempt", icon: Percent },
  { href: "/reports/auditor/fiscal-stock", label: "Fiscal Stock", icon: Boxes },
  { href: "/reports/auditor/reconciliation", label: "Bank Reconciliation", icon: ClipboardCheck },
];

export function AuditorSubnav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface p-1.5">
      {AUDITOR_TABS.map((tab) => {
        const isActive =
          tab.href === "/reports/auditor"
            ? pathname === "/reports/auditor"
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
