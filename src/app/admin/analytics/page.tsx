import { BarChart3, TrendingUp, Fuel, DollarSign, Building2, ShieldCheck, Zap } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/platform-dal";
import { getPlatformOverview } from "@/lib/queries/platform";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";

export default async function PlatformAnalyticsPage() {
  await requirePlatformAdmin();
  const overview = await getPlatformOverview();

  const totalSalesCount = overview.stations.reduce((sum, s) => sum + s.saleCount, 0);
  const totalStaffCount = overview.stations.reduce((sum, s) => sum + s.staffCount, 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <BarChart3 size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Platform & Multi-Station Analytics (समग्र कारोबार तथ्याङ्क)
            </h2>
            <p className="text-[12px] text-text-muted">
              Nationwide fuel volume sales, aggregate multi-station billing, and station utilization metrics.
            </p>
          </div>
        </div>
      </div>

      {/* Global Executive Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Invoices Cleared"
          value={`${totalSalesCount.toLocaleString("en-IN")} Bills`}
          icon={TrendingUp}
          tone="accent"
        />
        <StatCard
          label="Total Staff Employed"
          value={`${totalStaffCount} Operators`}
          icon={ShieldCheck}
          tone="success"
        />
        <StatCard
          label="Network Stations"
          value={`${overview.activeCount} Active`}
          icon={Building2}
          tone="text"
        />
        <StatCard
          label="Platform Uptime"
          value="99.98% SLA"
          icon={Zap}
          tone="success"
        />
      </div>

      {/* Station Volume Benchmark Table */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-display text-[15px] font-bold text-text">
            Station Sales & Throughput Rankings
          </h3>
          <span className="text-[12px] text-text-muted">Ranked by invoice volume</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px] min-w-[700px]">
            <thead className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-text-muted font-data">
              <tr>
                <th className="px-3 py-2.5">STATION NAME</th>
                <th className="px-3 py-2.5">STATION CODE</th>
                <th className="px-3 py-2.5">LOCATION</th>
                <th className="px-3 py-2.5 text-right">STAFF</th>
                <th className="px-3 py-2.5 text-right">TOTAL INVOICES</th>
                <th className="px-3 py-2.5 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {overview.stations.map((s) => (
                <tr key={s.id} className="hover:bg-surface-hi/40 transition-colors">
                  <td className="px-3 py-3 font-bold text-text font-body">{s.name}</td>
                  <td className="px-3 py-3 font-mono text-accent font-semibold">{s.slug}</td>
                  <td className="px-3 py-3 text-text-muted font-body">{s.address}</td>
                  <td className="px-3 py-3 text-right font-medium text-text">{s.staffCount}</td>
                  <td className="px-3 py-3 text-right font-bold text-accent">
                    {s.saleCount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {s.suspendedAt ? (
                      <Badge tone="error">SUSPENDED</Badge>
                    ) : (
                      <Badge tone="success">ACTIVE</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
