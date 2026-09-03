"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Wallet,
  Users,
  LifeBuoy,
  Bell,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Plus,
  List,
  BarChart3,
  Activity,
} from "lucide-react";
import { clsx } from "clsx";
import { adminLogoutAction } from "@/lib/actions/platform";

export interface NavSection {
  title: string;
  items: Array<{
    href: string;
    label: string;
    icon: any;
    subItems?: Array<{
      href: string;
      label: string;
      icon: any;
    }>;
  }>;
}

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      {
        href: "/admin/analytics",
        label: "Platform Analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "TENANTS & STATIONS",
    items: [
      {
        href: "/admin/stations",
        label: "Stations / Tenants",
        icon: Building2,
        subItems: [
          {
            href: "/admin/stations",
            label: "All Stations",
            icon: List,
          },
          {
            href: "/admin/stations/new",
            label: "Add New Station",
            icon: Plus,
          },
        ],
      },
      {
        href: "/admin/subscriptions",
        label: "Plans & Subscriptions",
        icon: CreditCard,
      },
      {
        href: "/admin/payments",
        label: "Billing & Invoices",
        icon: Wallet,
      },
    ],
  },
  {
    title: "OPERATIONS & SUPPORT",
    items: [
      {
        href: "/admin/users",
        label: "Platform Users",
        icon: Users,
      },
      {
        href: "/admin/support",
        label: "Support Desk",
        icon: LifeBuoy,
      },
      {
        href: "/admin/notifications",
        label: "System Notifications",
        icon: Bell,
      },
    ],
  },
  {
    title: "SYSTEM & SECURITY",
    items: [
      {
        href: "/admin/settings",
        label: "Platform Settings",
        icon: Settings,
      },
      {
        href: "/admin/audit",
        label: "Audit Logs",
        icon: Activity,
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
  const [stationsOpen, setStationsOpen] = useState(true);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col border-r border-zinc-800/80 bg-[#0C0A09] text-zinc-100 select-none shadow-2xl">
      {/* 1. Brand & Platform Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800/80 px-5 bg-gradient-to-b from-[#181412] to-[#0E0C0A]">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 shadow-md shadow-amber-500/10 group-hover:scale-105 transition-transform">
            <ShieldCheck size={22} className="stroke-[2.5]" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0C0A09] bg-emerald-500" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-[15px] font-extrabold tracking-tight text-white">
                PUMP<span className="text-amber-400">SAAS</span>
              </span>
              <span className="rounded-[5px] bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                HQ
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 truncate">
              Company Admin Console
            </div>
          </div>
        </Link>
      </div>

      {/* 2. Quick Action CTA */}
      <div className="px-3.5 pt-4 pb-1">
        <Link
          href="/admin/stations/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 p-2.5 text-[12.5px] font-bold hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] transition-all shadow-md shadow-amber-500/20"
        >
          <Plus size={15} className="stroke-[3]" />
          <span>Add New Station</span>
        </Link>
      </div>

      {/* 3. Categorized Navigation Menu with Crystal-Clear Contrast */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-5">
        {ADMIN_NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 pb-1 text-[9.5px] font-bold tracking-[0.14em] text-zinc-500 uppercase font-mono">
              {section.title}
            </div>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isExact = pathname === item.href;
                const isNestedActive =
                  item.href !== "/admin" && pathname.startsWith(item.href);
                const isActive = isExact || isNestedActive;
                const Icon = item.icon;
                const hasSubItems = !!item.subItems?.length;

                if (hasSubItems) {
                  return (
                    <div key={item.href} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setStationsOpen(!stationsOpen)}
                        className={clsx(
                          "group relative flex w-full items-center justify-between rounded-xl px-3 py-2 text-[13px] font-medium transition-colors cursor-pointer",
                          isActive
                            ? "bg-amber-400/15 text-amber-300 font-semibold border border-amber-400/30"
                            : "text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            size={16}
                            className={clsx(
                              "shrink-0 transition-colors",
                              isActive
                                ? "text-amber-400"
                                : "text-zinc-400 group-hover:text-amber-400"
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        <ChevronRight
                          size={13}
                          className={clsx(
                            "transition-transform",
                            isActive ? "text-amber-400" : "text-zinc-400 group-hover:text-white",
                            stationsOpen ? "rotate-90" : "rotate-0"
                          )}
                        />
                      </button>

                      {stationsOpen && (
                        <div className="pl-4 pr-1 space-y-0.5 border-l border-zinc-800 ml-4 py-1 animate-fade-in">
                          {item.subItems!.map((sub) => {
                            const isSubActive = pathname === sub.href;
                            const SubIcon = sub.icon;
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                className={clsx(
                                  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                                  isSubActive
                                    ? "bg-amber-400/20 text-amber-300 font-bold"
                                    : "text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                                )}
                              >
                                <SubIcon
                                  size={13}
                                  className={
                                    isSubActive
                                      ? "text-amber-400"
                                      : "text-zinc-400"
                                  }
                                />
                                <span>{sub.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "group relative flex items-center justify-between rounded-xl px-3 py-2 text-[13px] font-medium transition-colors",
                      isActive
                        ? "bg-amber-400/15 text-amber-300 font-semibold border border-amber-400/30"
                        : "text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        size={16}
                        className={clsx(
                          "shrink-0 transition-colors",
                          isActive
                            ? "text-amber-400"
                            : "text-zinc-400 group-hover:text-amber-400"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 4. Super Admin Profile & Sign Out Footer */}
      <div className="border-t border-zinc-800/80 bg-[#14100E] p-3">
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#1A1513] p-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/25 to-amber-500/10 border border-amber-400/30 font-bold text-amber-400 text-[11.5px] font-mono">
              SA
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-bold text-white leading-tight">
                {adminName}
              </div>
              <div className="font-mono text-[10px] text-zinc-400 truncate">
                @{adminUsername} · <span className="text-amber-400 font-semibold">SUPER ADMIN</span>
              </div>
            </div>
          </div>

          <form action={adminLogoutAction}>
            <button
              type="submit"
              title="Sign Out Company Admin"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
