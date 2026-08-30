import { History, Shield, User, Clock, CheckCircle2, Lock, Filter } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/platform-dal";
import { getPlatformAuditLog } from "@/lib/queries/platform";
import { Badge } from "@/components/ui/Badge";
import { fmtBSDateTime } from "@/lib/bs-date";

const whenExact = (d: Date) => fmtBSDateTime(d);

export default async function PlatformAuditPage() {
  await requirePlatformAdmin();
  const auditLog = await getPlatformAuditLog();

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <History size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Platform Security & Operator Audit Trail (सुरक्षा अडिट लग)
            </h2>
            <p className="text-[12px] text-text-muted">
              Immutable log of all super-admin actions, station provisioning, suspensions, and tenant overrides.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-display text-[15px] font-bold text-text">
            Recorded Operator Actions
          </h3>
          <span className="text-[12px] text-text-muted font-data">
            {auditLog.length} Recorded Events
          </span>
        </div>

        {auditLog.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-[13px]">
            No operator audit entries recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {auditLog.map((e) => {
              const isSuspension = e.action.includes("SUSPENDED");
              return (
                <div
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5 hover:bg-surface-hi/40 transition-colors px-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge tone={isSuspension ? "error" : "accent"}>
                      {e.action.replace(/_/g, " ")}
                    </Badge>
                    <div>
                      <div className="font-bold text-[13.5px] text-text font-body">
                        {e.metadata && typeof e.metadata === "object" && "name" in e.metadata
                          ? String((e.metadata as Record<string, unknown>).name)
                          : e.entityType}
                      </div>
                      <div className="text-[11.5px] text-text-muted">
                        Entity ID: <span className="font-mono">{e.entityId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[12px] text-text-muted">
                    <div className="font-medium text-text">
                      By: {e.actor?.name ?? "System Daemon"}
                    </div>
                    <div className="font-data text-accent font-semibold text-[11px]">
                      {whenExact(e.createdAt)}
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
