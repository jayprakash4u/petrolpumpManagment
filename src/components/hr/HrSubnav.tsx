"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Wallet, FileBarChart2 } from "lucide-react";
import { clsx } from "clsx";

const HR_TABS = [
  { href: "/hr/attendance", label: "Attendance & Leave", icon: CalendarCheck },
  { href: "/hr/payroll", label: "Payroll & Salary Run", icon: Wallet },
  { href: "/hr/salary-report", label: "Salary Report & Payslips", icon: FileBarChart2 },
];

export function HrSubnav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface p-1.5">
      {HR_TABS.map((tab) => {
        const isActive = pathname === tab.href || (pathname === "/hr" && tab.href === "/hr/attendance");
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
