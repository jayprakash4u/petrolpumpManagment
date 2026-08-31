"use client";

import { Fragment, useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Database, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Loader2, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import {
  retryTenantMigrationAction,
  runPendingMigrationsAction,
  type MigrationRunState,
} from "@/lib/actions/platform";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import type { TenantMigrationStatus } from "@/lib/migrations/runner";

const emptyState: MigrationRunState = {};

/**
 * Visibility and controlled recovery for tenant schema state — not the
 * normal migration mechanism. A real deploy runs
 * `npm run db:migrate:tenants` as its own pipeline step; this page exists
 * so a platform admin can see where every tenant stands and, if one
 * genuinely failed, retry just that one without a "MIGRATE ALL DATABASES"
 * button being the default move.
 */
export function TenantMigrationsView({
  statuses,
  schemaTarget,
  totalMigrations,
  appVersion,
}: {
  statuses: TenantMigrationStatus[];
  schemaTarget: string;
  totalMigrations: number;
  appVersion: string;
}) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [retryState, retryAction, retryPending] = useActionState(retryTenantMigrationAction, emptyState);
  const [runAllState, runAllAction, runAllPending] = useActionState(runPendingMigrationsAction, emptyState);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [retryingSlug, setRetryingSlug] = useState<string | null>(null);

  const upToDate = statuses.filter((s) => s.reachable && s.upToDate).length;
  const behind = statuses.filter((s) => s.reachable && !s.upToDate).length;
  const unreachable = statuses.filter((s) => !s.reachable).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <Database size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">Database Migrations</h2>
            <p className="text-[12px] text-text-muted">
              Application <span className="font-data font-semibold text-text">v{appVersion}</span> · Schema target{" "}
              <span className="font-data font-semibold text-accent">{schemaTarget}</span> ({totalMigrations} migrations)
            </p>
          </div>
        </div>

        <GhostButton
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          className="text-[12.5px]"
        >
          {isRefreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Check Migration Status
        </GhostButton>
      </div>

      {(retryState.message || runAllState.message) && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-[13px] text-success font-medium">
          <CheckCircle2 size={16} /> {retryState.message || runAllState.message}
        </div>
      )}
      {(retryState.error || runAllState.error) && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 p-3 text-[13px] text-error font-medium">
          <AlertTriangle size={16} /> {retryState.error || runAllState.error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Tenants" value={`${statuses.length}`} icon={Database} tone="text" />
        <StatCard label="Up to Date" value={`${upToDate}`} icon={CheckCircle2} tone="success" />
        <StatCard label="Behind" value={`${behind}`} icon={RefreshCw} tone="accent" />
        <StatCard label="Unreachable" value={`${unreachable}`} icon={XCircle} tone="error" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px] min-w-140">
            <thead className="border-b border-border bg-surface-hi text-[11px] font-semibold uppercase tracking-wider text-text-muted font-data">
              <tr>
                <th className="px-4 py-3">Station</th>
                <th className="px-3 py-3">Schema</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {statuses.map((s) => {
                const isExpanded = expandedSlug === s.slug;
                const isThisRetrying = retryPending && retryingSlug === s.slug;
                return (
                  <Fragment key={s.slug}>
                    <tr className="hover:bg-surface-hi/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text">{s.name}</div>
                        <div className="font-mono text-[11px] text-text-muted">{s.slug}</div>
                      </td>
                      <td className="px-3 py-3 font-mono text-text-muted">{s.latestId ?? "none"}</td>
                      <td className="px-3 py-3">
                        {!s.reachable ? (
                          <Badge tone="error">✗ UNREACHABLE</Badge>
                        ) : s.upToDate ? (
                          <Badge tone="success">✓ UP TO DATE</Badge>
                        ) : (
                          <Badge tone="accent">⟳ BEHIND</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {s.error && (
                            <button
                              type="button"
                              onClick={() => setExpandedSlug(isExpanded ? null : s.slug)}
                              className="flex items-center gap-1 text-[11.5px] text-text-muted hover:text-text cursor-pointer"
                            >
                              Details
                              <ChevronDown size={12} className={clsx("transition-transform", isExpanded && "rotate-180")} />
                            </button>
                          )}
                          {(!s.reachable || !s.upToDate) && (
                            <form
                              action={retryAction}
                              onSubmit={() => setRetryingSlug(s.slug)}
                            >
                              <input type="hidden" name="slug" value={s.slug} />
                              <GhostButton
                                type="submit"
                                disabled={retryPending}
                                className="px-2.5 py-1 text-[11.5px]"
                              >
                                {isThisRetrying ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                Retry
                              </GhostButton>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && s.error && (
                      <tr>
                        <td colSpan={4} className="bg-error/5 px-4 py-2.5 font-mono text-[11.5px] text-error">
                          {s.error}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency / manual section — de-emphasized on purpose */}
      <details className="rounded-2xl border border-border/70 bg-surface p-4">
        <summary className="cursor-pointer text-[12.5px] font-semibold text-text-muted">
          Manual / Emergency
        </summary>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3.5">
          <p className="text-[11.5px] text-text-muted max-w-md">
            Applies every pending migration across every tenant at once. Prefer the deploy pipeline
            (<code className="font-mono text-text">npm run db:migrate:tenants</code>) or retrying one failed tenant above —
            this is for the case both aren&apos;t available.
          </p>
          <form action={runAllAction}>
            <PrimaryButton type="submit" disabled={runAllPending} className="text-[12px] px-3 py-2 shrink-0">
              {runAllPending ? "Running…" : "Run Pending Migrations"}
            </PrimaryButton>
          </form>
        </div>
      </details>
    </div>
  );
}
