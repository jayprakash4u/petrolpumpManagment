import Link from "next/link";
import {
  PlusCircle,
  Gauge,
  Truck,
  Droplets,
  HandCoins,
  RotateCcw,
  BarChart3,
  ArrowRight,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";

export function QuickActions() {
  const actions = [
    {
      id: "quick-sale",
      title: "Quick Sale",
      nepaliTitle: "द्रुत बिक्री",
      subtitle: "Fast single-column entry, no lookup",
      href: "/sales/quick",
      icon: Zap,
      borderHover: "hover:border-cyan-500/50 hover:bg-cyan-500/5",
      iconTone: "text-cyan-400 bg-cyan-500/15",
    },
    {
      id: "new-sale",
      title: "New Fuel Sale",
      nepaliTitle: "नयाँ इन्धन बिक्री",
      subtitle: "Record counter dispense & print slip",
      href: "/sales",
      icon: PlusCircle,
      badge: "High Priority",
      isPrimary: true,
      colorClass: "bg-accent text-[#1A1306]",
      borderHover: "hover:border-accent hover:bg-accent/10",
      iconTone: "text-accent",
    },
    {
      id: "meter-close",
      title: "Meter Shift Close",
      nepaliTitle: "पम्प मिटर रिडिङ",
      subtitle: "Nozzle totalisers & cash handover",
      href: "/meter",
      icon: Gauge,
      borderHover: "hover:border-indigo-500/50 hover:bg-indigo-500/5",
      iconTone: "text-indigo-400 bg-indigo-500/15",
    },
    {
      id: "tanker-purchase",
      title: "Tanker Decanting",
      nepaliTitle: "ट्याङ्कर खरिद दाखिला",
      subtitle: "NOC invoice & chamber offload",
      href: "/purchases/fuel",
      icon: Truck,
      borderHover: "hover:border-blue-500/50 hover:bg-blue-500/5",
      iconTone: "text-blue-400 bg-blue-500/15",
    },
    {
      id: "tank-dip",
      title: "Daily Tank Dip",
      nepaliTitle: "दैनिक ट्याङ्की नाप",
      subtitle: "Physical millimeter dip & water check",
      href: "/stock",
      icon: Droplets,
      borderHover: "hover:border-emerald-500/50 hover:bg-emerald-500/5",
      iconTone: "text-emerald-400 bg-emerald-500/15",
    },
    {
      id: "credit-settle",
      title: "Credit Payment",
      nepaliTitle: "खाता भुक्तानी रसिद",
      subtitle: "Settle corporate fleet ledger & cheques",
      href: "/corporate",
      icon: HandCoins,
      borderHover: "hover:border-teal-500/50 hover:bg-teal-500/5",
      iconTone: "text-teal-400 bg-teal-500/15",
    },
    {
      id: "sales-return",
      title: "Sales Return",
      nepaliTitle: "बिक्री फिर्ता / रद्द",
      subtitle: "Issue credit note & restock tank",
      href: "/sales/returns",
      icon: RotateCcw,
      borderHover: "hover:border-rose-500/50 hover:bg-rose-500/5",
      iconTone: "text-rose-400 bg-rose-500/15",
    },
    {
      id: "day-end-audit",
      title: "Day-End Summary",
      nepaliTitle: "दैनिक अडिट र IRD",
      subtitle: "Shift sales audit & IRD CBMS sync",
      href: "/reports/daily",
      icon: BarChart3,
      borderHover: "hover:border-purple-500/50 hover:bg-purple-500/5",
      iconTone: "text-purple-400 bg-purple-500/15",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-accent" />
          <h3 className="font-display text-[13.5px] font-bold uppercase tracking-wider text-text">
            Quick Actions (द्रुत कार्यहरू)
          </h3>
        </div>
        <span className="text-[11.5px] text-text-muted">
          8 Essential Daily Operations
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.id}
              href={act.href}
              className={clsx(
                "group relative flex flex-col justify-between rounded-2xl border p-3.5 transition-all duration-200 shadow-2xs hover:shadow-md",
                act.isPrimary
                  ? "border-accent/40 bg-accent/10 hover:border-accent hover:bg-accent/15"
                  : "border-border bg-surface hover:bg-surface-hi",
                act.borderHover
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={clsx(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                    act.isPrimary ? act.colorClass : act.iconTone
                  )}
                >
                  <Icon size={20} className={act.isPrimary ? "stroke-[2.5]" : ""} />
                </div>

                <ArrowRight
                  size={15}
                  className="text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent shrink-0 mt-1"
                />
              </div>

              <div className="mt-3 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-[13.5px] font-bold text-text group-hover:text-accent transition-colors">
                    {act.title}
                  </span>
                </div>
                <div className="text-[11px] text-accent/80 font-medium">
                  {act.nepaliTitle}
                </div>
                <div className="text-[11px] text-text-muted line-clamp-1">
                  {act.subtitle}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
