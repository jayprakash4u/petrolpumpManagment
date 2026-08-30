"use client";

import { useState } from "react";
import {
  RefreshCw,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Zap,
  RotateCw,
  Search,
  Globe,
  Radio,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { fmtRs } from "@/lib/money";
import { MOCK_IRD_SYNC_ENTRIES, MOCK_IRD_CONFIG } from "@/lib/mock/compliance";
import { calculateIrdSyncStats, type IrdCbmsEntry, type IrdSyncStatus } from "@/lib/compliance";

export function IrdSyncView() {
  const [entries, setEntries] = useState<IrdCbmsEntry[]>(MOCK_IRD_SYNC_ENTRIES);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const stats = calculateIrdSyncStats(entries);

  const filtered = entries.filter((e) => {
    if (statusFilter !== "ALL" && e.syncStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchInv = e.invoiceNo.toLowerCase().includes(q);
      const matchName = e.customerName.toLowerCase().includes(q);
      const matchPan = e.customerPan.toLowerCase().includes(q);
      if (!matchInv && !matchName && !matchPan) return false;
    }
    return true;
  });

  const handleForceSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setEntries(
        entries.map((e) => ({
          ...e,
          syncStatus: "SYNCED",
          syncedAtBS: e.syncedAtBS || "2083-05-08 10:52:00",
          cbmsAckCode: e.cbmsAckCode || `CBMS-2083-${Math.floor(10000000 + Math.random() * 90000000)}`,
        }))
      );
      setIsSyncing(false);
      setSyncNotice("Successfully synchronized all pending and failed bills to IRD CBMS Gateway!");
      setTimeout(() => setSyncNotice(null), 5000);
    }, 1200);
  };

  const handleRetrySingle = (id: string) => {
    setEntries(
      entries.map((e) =>
        e.id === id
          ? {
              ...e,
              syncStatus: "SYNCED",
              syncedAtBS: "2083-05-08 10:52:00",
              cbmsAckCode: `CBMS-2083-${Math.floor(10000000 + Math.random() * 90000000)}`,
              errorMessage: undefined,
            }
          : e
      )
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Invoice No",
      "Date (BS)",
      "Customer Name",
      "Customer PAN",
      "Taxable Base (NPR)",
      "VAT 13% (NPR)",
      "Total Amount (NPR)",
      "Sync Status",
      "CBMS Acknowledgment Code",
      "Synced At (BS)",
    ];

    const rows = filtered.map((e) => [
      `"${e.invoiceNo}"`,
      `"${e.dateBS}"`,
      `"${e.customerName}"`,
      `"${e.customerPan}"`,
      `"${e.taxableAmountNpr}"`,
      `"${e.vatAmountNpr}"`,
      `"${e.totalAmountNpr}"`,
      `"${e.syncStatus}"`,
      `"${e.cbmsAckCode || ""}"`,
      `"${e.syncedAtBS || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `ird_cbms_sync_log_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: IrdSyncStatus) => {
    switch (status) {
      case "SYNCED":
        return <Badge tone="success">CBMS Synced</Badge>;
      case "PENDING":
        return <Badge tone="accent">Queued (Pending)</Badge>;
      case "FAILED":
        return <Badge tone="error">Sync Failed</Badge>;
      case "OFFLINE_QUEUED":
        return <Badge tone="muted">Offline Buffer</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <RefreshCw size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              IRD Real-time Billing Sync (केन्द्रीय बिलिङ्ग प्रणाली — CBMS)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Live automated transmission of electronic tax invoices to the Inland Revenue Department (IRD) CBMS server under Rule 23(1).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Audit Log
          </GhostButton>
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export CSV
          </GhostButton>
          <PrimaryButton onClick={handleForceSync} disabled={isSyncing} className="text-[12.5px]">
            <RotateCw size={14} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Syncing..." : "Force Sync Queue"}
          </PrimaryButton>
        </div>
      </div>

      {/* Sync Notice Alert */}
      {syncNotice && (
        <div className="rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] font-medium text-success flex items-center gap-2">
          <CheckCircle2 size={16} /> {syncNotice}
        </div>
      )}

      {/* Live CBMS Gateway Status Strip */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] uppercase font-semibold tracking-wider text-text-muted flex items-center gap-1.5">
              <Globe size={14} className="text-accent" /> CBMS Server Gateway
            </span>
            <Badge tone="success">API Online</Badge>
          </div>
          <div className="space-y-1 text-[12px] text-text-muted">
            <div className="font-mono text-text truncate">{MOCK_IRD_CONFIG.apiUrl}</div>
            <div>
              Environment: <strong className="text-text">Production Mode (GoN)</strong>
            </div>
            <div>
              Seller Station PAN: <strong className="text-text font-data">{MOCK_IRD_CONFIG.sellerPan}</strong>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] uppercase font-semibold tracking-wider text-text-muted flex items-center gap-1.5">
              <Radio size={14} className="text-success" /> Auto-Sync Dispatcher
            </span>
            <Badge tone="accent">Enabled</Badge>
          </div>
          <div className="space-y-1 text-[12px] text-text-muted">
            <div>
              Dispatch Protocol: <strong className="text-text">Synchronous on Bill Mint</strong>
            </div>
            <div>
              Offline Retry Buffer: <strong className="text-text">SQLite Local FIFO Queue</strong>
            </div>
            <div>
              Heartbeat: <span className="text-success font-medium">0 ms Latency (Active)</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] uppercase font-semibold tracking-wider text-text-muted flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-accent" /> Statutory Compliance
            </span>
            <Badge tone="success">100% Valid</Badge>
          </div>
          <div className="space-y-1 text-[12px] text-text-muted">
            <div>
              Certification: <strong className="text-text">IRD Approved Software Vendor</strong>
            </div>
            <div>
              Fiscal Device Serial: <strong className="text-mono text-text">FPS-KTM-2083-019</strong>
            </div>
            <div>
              Digital Signature: <span className="text-success font-semibold">Active & Valid</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Invoices Tracked"
          value={`${stats.total} Bills`}
          icon={RefreshCw}
          tone="accent"
          small
        />
        <StatCard
          label="Successfully Synced to IRD"
          value={`${stats.synced} Bills`}
          icon={CheckCircle2}
          tone="success"
          small
        />
        <StatCard
          label="Pending Queue Buffer"
          value={`${stats.pending} Bills`}
          icon={Clock}
          tone="accent"
          small
        />
        <StatCard
          label="Failed / Requires Retry"
          value={`${stats.failed} Bills`}
          icon={AlertCircle}
          tone={stats.failed > 0 ? "error" : "success"}
          small
        />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-3">
        <div className="flex flex-1 min-w-[240px] items-center gap-2 rounded-lg border border-border bg-bg px-3 py-1.5 text-text">
          <Search size={15} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search invoice no, customer name, PAN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[13px] text-text placeholder:text-text-muted/60 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-[12.5px] text-text-muted">Sync Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-[12.5px] text-text"
          >
            <option value="ALL">All Invoices</option>
            <option value="SYNCED">Synced (Acknowledged)</option>
            <option value="PENDING">Pending In-Queue</option>
            <option value="FAILED">Failed / Timeout</option>
          </select>
        </div>
      </div>

      {/* Main Sync Queue Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-hi text-[11.5px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">Invoice No</th>
                <th className="px-3 py-3">Date (BS)</th>
                <th className="px-4 py-3">Customer / Buyer</th>
                <th className="px-3 py-3">Buyer PAN</th>
                <th className="px-3 py-3 text-right">Taxable (13%)</th>
                <th className="px-3 py-3 text-right">VAT (NPR)</th>
                <th className="px-3 py-3 text-right font-bold">Total Bill</th>
                <th className="px-3 py-3 text-center">Sync Status</th>
                <th className="px-4 py-3">CBMS Acknowledgment Code</th>
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-surface-hi/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-accent">
                    {e.invoiceNo}
                  </td>
                  <td className="px-3 py-3 text-text-muted">{e.dateBS}</td>
                  <td className="px-4 py-3 font-body font-semibold text-text">
                    {e.customerName}
                  </td>
                  <td className="px-3 py-3 text-text-muted">{e.customerPan}</td>
                  <td className="px-3 py-3 text-right text-text">
                    {fmtRs(e.taxableAmountNpr)}
                  </td>
                  <td className="px-3 py-3 text-right text-success font-medium">
                    {fmtRs(e.vatAmountNpr)}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-text">
                    {fmtRs(e.totalAmountNpr)}
                  </td>
                  <td className="px-3 py-3 text-center font-body">
                    {getStatusBadge(e.syncStatus)}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-text-muted">
                    {e.cbmsAckCode ? (
                      <span className="text-text font-semibold">{e.cbmsAckCode}</span>
                    ) : e.errorMessage ? (
                      <span className="text-error font-body text-[11px] truncate max-w-xs block">
                        {e.errorMessage}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-body">
                    {e.syncStatus !== "SYNCED" ? (
                      <GhostButton
                        onClick={() => handleRetrySingle(e.id)}
                        className="text-[11px] px-2 py-0.5 text-accent"
                      >
                        Retry Push
                      </GhostButton>
                    ) : (
                      <span className="text-[11px] text-success font-medium">Verified</span>
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
