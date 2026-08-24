import Link from "next/link";
import {
  Building2,
  Car,
  Fuel,
  FileBarChart2,
  TrendingUp,
  IndianRupee,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { CorporateSubnav } from "@/components/corporate/CorporateSubnav";
import {
  MOCK_CORPORATE_TOTALS,
  MOCK_CORPORATE_ACCOUNTS,
  MOCK_FLEET_DISPENSE_LOGS,
} from "@/lib/mock/corporate";
import { fmtRs, fmtL } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";

export default async function CorporateOverviewPage() {
  await requireUser();

  return (
    <div>
      <CorporateSubnav />

      {/* Summary KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Corporate Receivables"
          value={fmtRs(MOCK_CORPORATE_TOTALS.totalCorporateReceivablesNpr)}
          icon={IndianRupee}
          tone="accent"
        />
        <StatCard
          label="Fleet Volume (Month)"
          value={fmtL(MOCK_CORPORATE_TOTALS.monthlyFleetVolumeL)}
          icon={Fuel}
          tone="text"
        />
        <StatCard
          label="Whitelisted Vehicles"
          value={`${MOCK_CORPORATE_TOTALS.totalRegisteredVehiclesCount} Fleet Units`}
          icon={Car}
          tone="text"
        />
        <StatCard
          label="Corporate Accounts"
          value={`${MOCK_CORPORATE_TOTALS.activeCorporateAccountsCount} Clients`}
          icon={Building2}
          tone="success"
        />
      </div>

      {/* Fast Action Cards Grid */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/corporate/accounts"
          className="group rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-accent/60 hover:bg-surface-hi"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-black">
              <Building2 size={18} />
            </div>
            <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-text group-hover:text-accent">Corporate Accounts</h3>
          <p className="mt-1 text-xs text-text-muted">
            Institutional client directory with approved credit lines, PAN/VAT profiles, and security deposits.
          </p>
          <div className="mt-3 font-data text-[11px] font-semibold text-accent">
            {MOCK_CORPORATE_ACCOUNTS.length} Active Enterprise Accounts
          </div>
        </Link>

        <Link
          href="/corporate/vehicles"
          className="group rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-accent/60 hover:bg-surface-hi"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-black">
              <Car size={18} />
            </div>
            <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-text group-hover:text-accent">Fleet Vehicles & Quotas</h3>
          <p className="mt-1 text-xs text-text-muted">
            Whitelisted vehicle plates, assigned driver contacts, fuel restrictions, and daily volume limits.
          </p>
          <div className="mt-3 font-data text-[11px] font-semibold text-success">
            Automated Quota Enforcement
          </div>
        </Link>

        <Link
          href="/corporate/authorize"
          className="group rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-accent/60 hover:bg-surface-hi"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-black">
              <Fuel size={18} />
            </div>
            <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-text group-hover:text-accent">Authorize Dispense</h3>
          <p className="mt-1 text-xs text-text-muted">
            Pump attendant terminal to lookup vehicle plates, verify remaining quota, and log odometer readings.
          </p>
          <div className="mt-3 font-data text-[11px] font-semibold text-text">
            Odometer & Receipt Minting
          </div>
        </Link>

        <Link
          href="/corporate/statements"
          className="group rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-accent/60 hover:bg-surface-hi"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-black">
              <FileBarChart2 size={18} />
            </div>
            <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-text group-hover:text-accent">Billing Statements</h3>
          <p className="mt-1 text-xs text-text-muted">
            Monthly consolidated tax statements with vehicle-by-vehicle consumption audits and CSV exports.
          </p>
          <div className="mt-3 font-data text-[11px] font-semibold text-accent">
            Bikram Sambat Tax Reports
          </div>
        </Link>
      </div>

      {/* Two columns: Recent Fleet Dispenses & Corporate Receivables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle
              icon={Fuel}
              title="Recent Fleet Fuel Dispenses"
              subtitle="Latest corporate vehicle fills at dispenser"
            />
            <Link href="/corporate/authorize" className="text-xs font-semibold text-accent hover:underline">
              Terminal →
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {MOCK_FLEET_DISPENSE_LOGS.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-lg border border-border bg-bg p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-data text-[13px] font-bold text-accent">{log.vehiclePlateNo}</span>
                    <span className="font-display text-[13px] font-semibold text-text truncate max-w-[200px]">
                      {log.companyName.split("(")[0]}
                    </span>
                  </div>
                  <div className="font-data text-[11px] text-text-muted">
                    {log.driverName} · {log.odometerKm.toLocaleString()} km · {log.dateBS} {log.time}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-data text-[13px] font-bold text-text">{fmtL(log.litresDispensed)}</div>
                  <div className="font-data text-[11px] text-accent font-semibold">{fmtRs(log.totalAmountNpr)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle
              icon={Building2}
              title="Corporate Receivables & Limits"
              subtitle="Current client balance standing"
            />
            <Link href="/corporate/accounts" className="text-xs font-semibold text-accent hover:underline">
              All Clients →
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {MOCK_CORPORATE_ACCOUNTS.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-bg p-3">
                <div>
                  <div className="font-display text-[13.5px] font-semibold text-text">{a.companyName}</div>
                  <div className="font-data text-[11px] text-text-muted">
                    Limit: {fmtRs(a.monthlyCreditLimitNpr)} · {a.totalRegisteredVehicles} vehicles
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-data text-[13px] font-bold text-error">
                    {fmtRs(a.currentDueBalanceNpr)}
                  </div>
                  <Badge tone={a.status === "ACTIVE" ? "success" : "error"}>{a.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
