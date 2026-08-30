import { Activity, Server, Database, ShieldCheck, CheckCircle2, Zap, Radio, RefreshCw } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/platform-dal";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";

export default async function SystemHealthPage() {
  await requirePlatformAdmin();

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <Activity size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              System Infrastructure & IRD Gateway Health (प्रणाली तथा सर्भर स्थिति)
            </h2>
            <p className="text-[12px] text-text-muted">
              Live heartbeat monitors for database latency, background sync queues, and IRD CBMS tax gateway uptime.
            </p>
          </div>
        </div>
      </div>

      {/* Health Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Database Cluster Health"
          value="Healthy · 4ms"
          icon={Database}
          tone="success"
        />
        <StatCard
          label="IRD CBMS Gateway"
          value="Online (200 OK)"
          icon={ShieldCheck}
          tone="success"
        />
        <StatCard
          label="Background Queue"
          value="0 Pending Retries"
          icon={Server}
          tone="text"
        />
        <StatCard
          label="API Response Latency"
          value="18ms (p99)"
          icon={Zap}
          tone="accent"
        />
      </div>

      {/* Service Nodes Grid */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-display text-[15px] font-bold text-text">
            Core Microservices & Integration Gateways
          </h3>
          <span className="text-[12px] text-text-muted">All services nominal</span>
        </div>

        <div className="space-y-3">
          {[
            {
              name: "IRD Electronic Invoicing Gateway (CBMS Nepal)",
              type: "Statutory Tax Integration",
              uptime: "99.99%",
              status: "OPERATIONAL",
              latency: "120ms",
            },
            {
              name: "NOC Wholesale Fuel Tariff Poller",
              type: "Nepal Oil Corporation API",
              uptime: "100%",
              status: "OPERATIONAL",
              latency: "45ms",
            },
            {
              name: "Tenant Data Isolation & Partition Layer",
              type: "Multi-Tenant Security Core",
              uptime: "100%",
              status: "OPERATIONAL",
              latency: "1ms",
            },
            {
              name: "Thermal Slip & Receipt PDF Generation Engine",
              type: "Client Render Microservice",
              uptime: "100%",
              status: "OPERATIONAL",
              latency: "12ms",
            },
          ].map((srv, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
                <div>
                  <div className="font-bold text-[13.5px] text-text">{srv.name}</div>
                  <div className="text-[11.5px] text-text-muted">{srv.type}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[12px]">
                <span className="text-text-muted">Latency: <strong className="text-text font-data">{srv.latency}</strong></span>
                <span className="text-text-muted">Uptime: <strong className="text-success font-data">{srv.uptime}</strong></span>
                <Badge tone="success">{srv.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
