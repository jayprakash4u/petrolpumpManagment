"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  FolderTree,
  Layers,
  CreditCard,
  Wallet,
  Users,
  ShieldAlert,
  Radio,
  Bell,
  Settings,
  Database,
  History,
  Sliders,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { clsx } from "clsx";
import { adminLogoutAction } from "@/lib/actions/platform";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: any;
  children?: {
    href: string;
    label: string;
  }[];
}

export interface AdminNavSection {
  group: string;
  items: AdminNavItem[];
}

export const PUMP_SAAS_ADMIN_NAV: AdminNavSection[] = [
  {
    group: "CORE MANAGEMENT",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      {
        href: "/admin/stations",
        label: "Stations / Tenants",
        icon: Building2,
        children: [
          { href: "/admin/stations", label: "All Fuel Stations" },
          { href: "/admin/onboard", label: "Onboard New Station" },
          { href: "/admin/stations/groups", label: "Station Categories / Groups" },
        ],
      },
      {
        href: "/admin/subscriptions",
        label: "Subscriptions & Plans",
        icon: CreditCard,
        children: [
          { href: "/admin/subscriptions", label: "Pricing Plans" },
          { href: "/admin/billing", label: "Invoices & Billing" },
          { href: "/admin/gateways", label: "Payment Gateways" },
        ],
      },
    ],
  },
  {
    group: "TECHNICAL & SYSTEM",
    items: [
      {
        href: "/admin/users",
        label: "User & Role Access",
        icon: Users,
        children: [
          { href: "/admin/users", label: "Super Admin Staff" },
          { href: "/admin/users/roles", label: "Global Permission Roles" },
        ],
      },
      {
        href: "/admin/broadcasts",
        label: "Broadcast & Alerts",
        icon: Radio,
        children: [
          { href: "/admin/broadcasts", label: "Regional Price Updates" },
          { href: "/admin/broadcasts/notifications", label: "System Notifications" },
        ],
      },
      {
        href: "/admin/settings",
        label: "System Settings",
        icon: Settings,
        children: [
          { href: "/admin/settings", label: "Database & Backups" },
          { href: "/admin/audit", label: "Audit Logs" },
          { href: "/admin/settings/preferences", label: "Platform Preferences" },
        ],
      },
    ],
  },
];

export function AdminSidebar({
  adminName = "Platform Operator",
  adminUsername = "operator",
}: {
  adminName?: string;
  adminUsername?: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border/70 bg-[#0C0A09] text-text select-none">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 px-5 bg-[#120F0D]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-[#1A1306] shadow-sm">
            <ShieldCheck size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-[15px] font-extrabold tracking-tight text-text">
                PUMP<span className="text-accent">-SAAS</span>
              </span>
              <span className="rounded bg-accent/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-accent uppercase">
                ADMIN
              </span>
            </div>
            <div className="text-[11px] text-text-muted">
              Multi-Station SaaS Platform
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {PUMP_SAAS_ADMIN_NAV.map((section) => (
          <div key={section.group} className="space-y-1">
            <div className="px-3 text-[10px] font-bold tracking-wider text-text-muted/60 uppercase font-data">
              {section.group}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isExact = pathname === item.href;
                const isChildActive = item.children?.some(
                  (c) => pathname === c.href || (c.href !== "/admin" && pathname.startsWith(c.href))
                );
                const isActive = isExact || isChildActive;
                const Icon = item.icon;

                if (!item.children) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors",
                        isExact
                          ? "bg-accent/15 text-accent font-semibold shadow-2xs"
                          : "text-text-muted hover:bg-surface-hi hover:text-text"
                      )}
                    >
                      <Icon
                        size={16}
                        className={clsx(
                          "shrink-0 transition-colors",
                          isExact ? "text-accent" : "text-text-muted"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                }

                return (
                  <details
                    key={item.href}
                    open={isActive}
                    className="group space-y-0.5"
                  >
                    <summary
                      className={clsx(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-[13px] font-medium transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden",
                        isActive
                          ? "font-semibold text-text"
                          : "text-text-muted hover:bg-surface-hi hover:text-text"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={16}
                          className={clsx(
                            "shrink-0 transition-colors",
                            isActive ? "text-accent" : "text-text-muted"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-text-muted shrink-0 transition-transform duration-150 group-open:rotate-90"
                      />
                    </summary>

                    {/* Submenu Children */}
                    <div className="ml-4 pl-2.5 border-l border-border/60 flex flex-col gap-0.5 py-1">
                      {item.children.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={clsx(
                              "rounded-lg px-2.5 py-1.5 text-[12px] transition-colors truncate",
                              childActive
                                ? "bg-accent/15 text-accent font-semibold"
                                : "text-text-muted hover:bg-surface-hi hover:text-text"
                            )}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Operator User Footer & Sign Out */}
      <div className="border-t border-border/50 bg-[#120F0D] p-3">
        <div className="flex items-center justify-between rounded-xl border border-border/40 bg-[#171310] p-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 font-bold text-accent text-[12px]">
              SA
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-bold text-text">
                {adminName}
              </div>
              <div className="font-mono text-[10px] text-text-muted truncate">
                @{adminUsername} · SUPER ADMIN
              </div>
            </div>
          </div>

          <form action={adminLogoutAction}>
            <button
              type="submit"
              title="Sign Out Platform Admin"
              className="rounded-lg p-1.5 text-text-muted hover:bg-error/20 hover:text-error transition-colors cursor-pointer"
            >
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
