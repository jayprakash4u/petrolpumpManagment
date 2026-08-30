import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  PauseCircle,
  Moon,
  Plus,
  Search,
  ExternalLink,
  Fuel,
  Users,
  Clock,
  TrendingUp,
  Store,
  Layers,
  Settings,
  KeyRound,
} from "lucide-react";
import { requirePlatformAdmin } from "@/lib/platform-dal";
import { getPlatformOverview } from "@/lib/queries/platform";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";
import { SuspendControl } from "@/components/admin/AdminForms";
import { fmtBSLong, fmtBSDateTime } from "@/lib/bs-date";

const when = (d: Date) => fmtBSLong(d);
const whenExact = (d: Date) => fmtBSDateTime(d);

export default async function AdminStationsPage() {
  await requirePlatformAdmin();
  const overview = await getPlatformOverview();

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with Onboard Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <Building2 size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Petrol Pump Station Directory (पम्प स्टेशन सञ्जाल)
            </h2>
            <p className="text-[12px] text-text-muted">
              Central multi-tenant directory of all onboarded stations, live pump activity, and tenant lifecycle controls.
            </p>
          </div>
        </div>

        <Link
          href="/admin/onboard"
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-bold text-[#1A1306] shadow-xs hover:bg-accent/90 transition-all cursor-pointer"
        >
          <Plus size={16} className="stroke-[2.5]" /> Onboard New Station
        </Link>
      </div>

      {/* 2. Platform KPI Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Onboarded Stations"
          value={`${overview.total} Stations`}
          icon={Building2}
          tone="accent"
        />
        <StatCard
          label="Active & Trading"
          value={`${overview.activeCount} Live`}
          icon={ShieldCheck}
          tone="success"
        />
        <StatCard
          label="Temporarily Suspended"
          value={`${overview.suspendedCount} Stations`}
          icon={PauseCircle}
          tone="text"
        />
        <StatCard
          label="Newly Provisioned"
          value={`${overview.dormantCount} Pending Sales`}
          icon={Moon}
          tone="text"
        />
      </div>

      {/* 3. Stations Directory List */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Store size={18} className="text-accent" />
            <h3 className="font-display text-[15px] font-bold text-text">
              Managed Petrol Pump Tenancies
            </h3>
          </div>
          <span className="text-[12px] text-text-muted font-data">
            {overview.stations.length} Registered Stations
          </span>
        </div>

        {overview.stations.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-[13px]">
            No stations found. Onboard the first station to begin.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {overview.stations.map((s) => {
              const isSuspended = s.suspendedAt !== null;
              return (
                <div
                  key={s.id}
                  className={`rounded-2xl border p-4.5 transition-all ${
                    isSuspended
                      ? "border-error/40 bg-error/5 opacity-80"
                      : "border-border bg-bg hover:border-accent/40"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    {/* Station Meta */}
                    <div className="space-y-1.5 min-w-[260px] flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-display text-[16px] font-bold text-text">
                          {s.name}
                        </span>
                        <span className="font-mono rounded bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">
                          slug: {s.slug}
                        </span>
                        {isSuspended ? (
                          <Badge tone="error">SUSPENDED</Badge>
                        ) : s.saleCount === 0 ? (
                          <Badge tone="muted">PROVISIONED / NO SALES</Badge>
                        ) : (
                          <Badge tone="success">OPERATIONAL</Badge>
                        )}
                      </div>

                      <div className="text-[12.5px] text-text-muted">{s.address}</div>

                      {isSuspended && s.suspendedReason && (
                        <div className="rounded-lg bg-error/10 border border-error/30 px-3 py-1.5 text-[12px] text-error font-medium">
                          <strong>Suspension Reason:</strong> {s.suspendedReason} · {whenExact(s.suspendedAt!)}
                        </div>
                      )}
                    </div>

                    {/* Operational Counts */}
                    <div className="text-right space-y-1">
                      <div className="font-data text-[13.5px] font-bold text-text">
                        {s.staffCount} Staff · {s.saleCount.toLocaleString("en-IN")} Invoices Billed
                      </div>
                      <div className="text-[11.5px] text-text-muted">
                        Onboarded: {when(s.createdAt)}
                        {s.lastSaleAt ? ` · Last Fueling: ${when(s.lastSaleAt)}` : " · No sales recorded"}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Strip */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/80 pt-3">
                    <div className="flex items-center gap-2 text-[11.5px] text-text-muted">
                      <span>Station ID:</span>
                      <span className="font-mono text-[10.5px]">{s.id}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/stations/${s.slug}`}
                        className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-hi px-3 py-1.5 text-[12px] font-bold text-text hover:border-accent/40 hover:text-accent transition-all cursor-pointer"
                      >
                        <KeyRound size={13} className="text-accent" />
                        Manage Station & Passwords
                      </Link>
                      <SuspendControl
                        stationId={s.id}
                        name={s.name}
                        suspended={isSuspended}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
