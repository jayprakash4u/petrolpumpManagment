"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Banknote,
  FileText,
  NotebookPen,
  ArrowLeftRight,
  PiggyBank,
  Coins,
  CalendarDays,
  Scale,
  Calculator,
  ScrollText,
} from "lucide-react";
import { clsx } from "clsx";

const ACCOUNT_TABS = [
  { href: "/accounts/ledgers", label: "Chart of Accounts", icon: BookOpen },
  { href: "/accounts/receipts", label: "Receipts", icon: Banknote },
  { href: "/accounts/payments", label: "Payments", icon: FileText },
  { href: "/accounts/journal", label: "Journals", icon: NotebookPen },
  { href: "/accounts/contra", label: "Contra", icon: ArrowLeftRight },
  { href: "/accounts/day-book", label: "Day Book", icon: CalendarDays },
  { href: "/accounts/cash-confirmation", label: "Cash Confirmation", icon: Coins },
  { href: "/accounts/trial-balance", label: "Trial Balance", icon: Scale },
  { href: "/accounts/profit-loss", label: "Profit & Loss", icon: Calculator },
  { href: "/accounts/notes", label: "Credit/Debit Notes", icon: ScrollText },
  { href: "/accounts/opening", label: "Opening Balances", icon: PiggyBank },
];

export function AccountSubnav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface p-1.5">
      {ACCOUNT_TABS.map((tab) => {
        const isActive = pathname === tab.href || (pathname === "/accounts" && tab.href === "/accounts/ledgers");
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
