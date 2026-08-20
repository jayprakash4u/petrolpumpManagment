import { Building2, ShieldCheck, PauseCircle, Moon, History, Plus } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/platform-dal";
import { getPlatformOverview, getPlatformAuditLog } from "@/lib/queries/platform";
import { adminLogoutAction } from "@/lib/actions/platform";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";
import { OnboardStationForm, SuspendControl, AdminSignOutButton } from "@/components/admin/AdminForms";
import { fmtBSLong, fmtBSDateTime } from "@/lib/bs-date";

const when = (d: Date) => fmtBSLong(d);
const whenExact = (d: Date) => fmtBSDateTime(d);

export default async function AdminPage() {
  const admin = await requirePlatformAdmin();
  const [overview, auditLog] = await Promise.all([getPlatformOverview(), getPlatformAuditLog()]);

  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 pt-[22px] pb-[60px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-border bg-surface-hi">
            <ShieldCheck size={19} className="text-accent" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-text">Platform Console</h1>
            <p className="font-data text-[11px] tracking-wide text-text-muted">
              {admin.name.toUpperCase()} · OPERATOR
            </p>
          </div>
        </div>
        <AdminSignOutButton action={adminLogoutAction} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Stations" value={String(overview.total)} icon={Building2} tone="accent" />
        <StatCard label="Active" value={String(overview.activeCount)} icon={ShieldCheck} tone="success" />
        <StatCard label="Suspended" value={String(overview.suspendedCount)} icon={PauseCircle} tone="text" />
        <StatCard label="No Sales Yet" value={String(overview.dormantCount)} icon={Moon} tone="text" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <Card>
            <SectionTitle icon={Building2} title="Stations" subtitle="Every petrol pump on the platform" />

            {overview.stations.length === 0 ? (
              <p className="py-8 text-center text-[13.5px] text-text-muted">
                No stations yet. Create the first one to get started.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {overview.stations.map((s) => (
                  <div
                    key={s.id}
                    className={
                      "rounded-xl border bg-bg p-3.5 " +
                      (s.suspendedAt ? "border-error/30 opacity-70" : "border-border")
                    }
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="min-w-[160px] flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-[14.5px] font-semibold text-text">{s.name}</span>
                          <Badge tone="accent">{s.slug}</Badge>
                          {s.suspendedAt && <Badge tone="error">SUSPENDED</Badge>}
                          {!s.suspendedAt && s.saleCount === 0 && <Badge tone="muted">NO SALES</Badge>}
                        </div>
                        <div className="mt-0.5 text-[11.5px] text-text-muted">{s.address}</div>
                        {s.suspendedAt && s.suspendedReason && (
                          <div className="mt-1 text-[11.5px] text-error">
                            {s.suspendedReason} · {whenExact(s.suspendedAt)}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="font-data text-[12.5px] text-text">
                          {s.staffCount} staff · {s.saleCount.toLocaleString("en-IN")} sales
                        </div>
                        <div className="text-[11px] text-text-muted">
                          joined {when(s.createdAt)}
                          {s.lastSaleAt ? ` · last sale ${when(s.lastSaleAt)}` : " · never traded"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 flex justify-end">
                      <SuspendControl stationId={s.id} name={s.name} suspended={s.suspendedAt !== null} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle icon={History} title="Operator Activity" subtitle="Every platform action, newest first" />
            {auditLog.length === 0 ? (
              <p className="py-8 text-center text-[13.5px] text-text-muted">Nothing recorded yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {auditLog.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 rounded-lg border border-border bg-bg px-3 py-2.5">
                    <Badge tone={e.action.includes("SUSPENDED") ? "error" : "muted"}>{e.action.replace(/_/g, " ")}</Badge>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-text-muted">
                      {e.metadata && typeof e.metadata === "object" && "name" in e.metadata
                        ? String((e.metadata as Record<string, unknown>).name)
                        : e.entityType}
                    </span>
                    <span className="text-right text-[11px] text-text-muted">
                      {e.actor?.name ?? "—"}
                      <span className="font-data ml-2 opacity-70">{whenExact(e.createdAt)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="h-fit">
          <SectionTitle icon={Plus} title="Onboard a Station" subtitle="Creates the tenant and its first owner" />
          <OnboardStationForm />
        </Card>
      </div>
    </main>
  );
}
