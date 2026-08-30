"use client";

import { useState } from "react";
import { Database, Download, RefreshCw, HardDrive, ShieldCheck, CheckCircle2, Server, Clock, AlertCircle } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";

export interface BackupSnapshot {
  id: string;
  filename: string;
  sizeMb: number;
  type: "DAILY_AUTOMATED" | "MANUAL_SNAPSHOT" | "PRE_DEPLOY_CHECKPOINT";
  createdAtBS: string;
  tenantCount: number;
  status: "VERIFIED" | "REPLICATED";
}

export function DatabaseBackupsView() {
  const [backups, setBackups] = useState<BackupSnapshot[]>([
    {
      id: "bk-1",
      filename: "pump_saas_cluster_daily_2083_05_08.sql.gz",
      sizeMb: 42.6,
      type: "DAILY_AUTOMATED",
      createdAtBS: "2083-05-08 04:00",
      tenantCount: 20,
      status: "REPLICATED",
    },
    {
      id: "bk-2",
      filename: "pump_saas_cluster_daily_2083_05_07.sql.gz",
      sizeMb: 41.8,
      type: "DAILY_AUTOMATED",
      createdAtBS: "2083-05-07 04:00",
      tenantCount: 20,
      status: "REPLICATED",
    },
    {
      id: "bk-3",
      filename: "pump_saas_cluster_daily_2083_05_06.sql.gz",
      sizeMb: 41.1,
      type: "DAILY_AUTOMATED",
      createdAtBS: "2083-05-06 04:00",
      tenantCount: 20,
      status: "REPLICATED",
    },
    {
      id: "bk-4",
      filename: "pump_saas_manual_pre_migration_2083_05_01.sql.gz",
      sizeMb: 39.5,
      type: "MANUAL_SNAPSHOT",
      createdAtBS: "2083-05-01 18:20",
      tenantCount: 18,
      status: "VERIFIED",
    },
  ]);

  const [creatingBackup, setCreatingBackup] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreateSnapshot = () => {
    setCreatingBackup(true);
    setTimeout(() => {
      const newSnapshot: BackupSnapshot = {
        id: `bk-${Date.now()}`,
        filename: `pump_saas_manual_snapshot_${new Date().toISOString().slice(0, 10)}.sql.gz`,
        sizeMb: 43.1,
        type: "MANUAL_SNAPSHOT",
        createdAtBS: "2083-05-08 12:55",
        tenantCount: 20,
        status: "VERIFIED",
      };
      setBackups([newSnapshot, ...backups]);
      setCreatingBackup(false);
      setSuccessMsg("Instant database cluster snapshot created and verified (SHA-256 Checksum OK).");
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <Database size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Database Cluster & Multi-Tenant Backups (डाटाबेस ब्याकअप तथा सुरक्षा)
            </h2>
            <p className="text-[12px] text-text-muted">
              Automated off-site database replication, point-in-time recovery checkpoints, and instant encrypted snapshot downloads.
            </p>
          </div>
        </div>

        <PrimaryButton
          onClick={handleCreateSnapshot}
          disabled={creatingBackup}
          className="text-[13px] px-4 py-2.5"
        >
          <HardDrive size={15} /> {creatingBackup ? "Creating Snapshot..." : "Create Live Backup"}
        </PrimaryButton>
      </div>

      {successMsg && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success font-medium">
          <CheckCircle2 size={17} /> {successMsg}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Database Cluster Health"
          value="Healthy · 4ms Latency"
          icon={Database}
          tone="success"
        />
        <StatCard
          label="Replication Cadence"
          value="Daily @ 04:00 AM"
          icon={Clock}
          tone="accent"
        />
        <StatCard
          label="Off-site Retention"
          value="90 Days Archived"
          icon={Server}
          tone="text"
        />
        <StatCard
          label="Data Integrity SLA"
          value="99.999% Durability"
          icon={ShieldCheck}
          tone="success"
        />
      </div>

      {/* Snapshots Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px] min-w-[760px]">
            <thead className="border-b border-border bg-surface-hi text-[11px] font-semibold uppercase tracking-wider text-text-muted font-data">
              <tr>
                <th className="px-4 py-3.5">SNAPSHOT FILENAME</th>
                <th className="px-3 py-3.5">TYPE</th>
                <th className="px-3 py-3.5">SIZE (MB)</th>
                <th className="px-3 py-3.5">TENANTS</th>
                <th className="px-3 py-3.5">CREATED (BS)</th>
                <th className="px-4 py-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-surface-hi/40 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-accent font-semibold">
                    {b.filename}
                  </td>
                  <td className="px-3 py-3.5 font-body">
                    <Badge tone={b.type === "DAILY_AUTOMATED" ? "success" : "accent"}>
                      {b.type.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-3 py-3.5 font-data text-text font-bold">
                    {b.sizeMb} MB
                  </td>
                  <td className="px-3 py-3.5 text-text-muted">
                    {b.tenantCount} Stations
                  </td>
                  <td className="px-3 py-3.5 text-text-muted text-[11.5px]">
                    {b.createdAtBS}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <GhostButton className="px-2.5 py-1 text-[11.5px]">
                      <Download size={13} /> Download
                    </GhostButton>
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
