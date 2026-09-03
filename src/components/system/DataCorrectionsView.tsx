"use client";

import { useState, useMemo } from "react";
import {
  FilePenLine,
  Search,
  Download,
  ShieldCheck,
  Clock,
  User,
  ArrowRight,
  Filter,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { ROLE_LABEL } from "@/lib/permissions";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";

interface CorrectionEntry {
  id: string;
  action: "SALE_EDITED" | "SALE_VOIDED" | "DIP_CORRECTION" | "CREDIT_ADJUSTMENT";
  entity: string;
  actorName: string;
  actorRole: string;
  dateBS: string;
  time: string;
  reason: string;
  previousValue: string;
  updatedValue: string;
}

export function DataCorrectionsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const [corrections] = useState<CorrectionEntry[]>([
    {
      id: "cor-1",
      action: "SALE_EDITED",
      entity: "Bill #1025",
      actorName: "Jay Prakash Yadav",
      actorRole: "OWNER",
      dateBS: "2083-05-08",
      time: "11:05 AM",
      reason: "Corrected customer vehicle license plate typo",
      previousValue: "Plate: Unrecorded · Payment: Cash",
      updatedValue: "Plate: BA 2 PA 1234 · Payment: Cash",
    },
    {
      id: "cor-2",
      action: "SALE_VOIDED",
      entity: "Bill #1021",
      actorName: "Sita Gurung",
      actorRole: "OWNER",
      dateBS: "2083-05-08",
      time: "09:15 AM",
      reason: "Calibration meter check refund — 20.0 L restocked to tank",
      previousValue: "Active Invoice (Rs 3,400)",
      updatedValue: "Voided / Returned (Restocked 20.0 L)",
    },
    {
      id: "cor-3",
      action: "CREDIT_ADJUSTMENT",
      entity: "Customer: Sajha Yatayat",
      actorName: "Jay Prakash Yadav",
      actorRole: "OWNER",
      dateBS: "2083-05-07",
      time: "03:40 PM",
      reason: "Approved fleet credit limit increase per board resolution",
      previousValue: "Credit Limit: Rs 5,00,000",
      updatedValue: "Credit Limit: Rs 8,00,000",
    },
    {
      id: "cor-4",
      action: "DIP_CORRECTION",
      entity: "Tank 02 (Diesel HSD)",
      actorName: "Ram Shrestha",
      actorRole: "OWNER",
      dateBS: "2083-05-06",
      time: "06:30 PM",
      reason: "Physical dip tape recalibration variance adjustment",
      previousValue: "Dip: 1,410 mm (14,200 L)",
      updatedValue: "Dip: 1,412 mm (14,225 L)",
    },
  ]);

  const filteredCorrections = useMemo(() => {
    return corrections.filter((c) => {
      if (actionFilter !== "ALL" && c.action !== actionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchEntity = c.entity.toLowerCase().includes(q);
        const matchActor = c.actorName.toLowerCase().includes(q);
        const matchReason = c.reason.toLowerCase().includes(q);
        if (!matchEntity && !matchActor && !matchReason) return false;
      }
      return true;
    });
  }, [corrections, actionFilter, searchQuery]);

  const handleExportCSV = () => {
    const headers = [
      "Correction ID",
      "Action Type",
      "Entity Modified",
      "Actor Name",
      "Actor Role",
      "Date (BS)",
      "Time",
      "Reason for Correction",
      "Previous State",
      "Updated State",
    ];

    const rows = filteredCorrections.map((c) => [
      `"${c.id}"`,
      `"${c.action}"`,
      `"${c.entity}"`,
      `"${c.actorName}"`,
      `"${ROLE_LABEL[c.actorRole]}"`,
      `"${c.dateBS}"`,
      `"${c.time}"`,
      `"${c.reason}"`,
      `"${c.previousValue}"`,
      `"${c.updatedValue}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `data_corrections_audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "SALE_EDITED":
        return <Badge tone="accent">BILL EDITED</Badge>;
      case "SALE_VOIDED":
        return <Badge tone="error">BILL VOIDED</Badge>;
      case "CREDIT_ADJUSTMENT":
        return <Badge tone="success">CREDIT ADJUSTED</Badge>;
      case "DIP_CORRECTION":
        return <Badge tone="muted">TANK DIP ADJUSTED</Badge>;
      default:
        return <Badge tone="muted">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <FilePenLine size={22} />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Data Corrections & Audit Log (डाटा संशोधन तथा अडिट लग)
            </h2>
            <p className="text-[12px] text-text-muted">
              Immutable audit trail of all modified bills, credit revisions, tank dip calibrations, and manager sign-offs.
            </p>
          </div>
        </div>

        <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
          <Download size={14} /> Export Audit Log CSV
        </GhostButton>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Corrections Logged"
          value={`${corrections.length} Entries`}
          icon={FilePenLine}
          tone="text"
        />
        <StatCard
          label="Bill Modifications"
          value={`${corrections.filter((c) => c.action === "SALE_EDITED").length} Edits`}
          icon={FileText}
          tone="accent"
        />
        <StatCard
          label="Voided Credit Notes"
          value={`${corrections.filter((c) => c.action === "SALE_VOIDED").length} Returns`}
          icon={AlertTriangle}
          tone="error"
        />
        <StatCard
          label="Audit Trail Integrity"
          value="100% Immutable"
          icon={ShieldCheck}
          tone="success"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-1 min-w-[280px] items-center gap-2.5 rounded-xl border border-border bg-bg px-3.5 py-2 text-text transition-colors focus-within:border-accent">
          <Search size={16} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search by Bill #, customer name, actor, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[13px] text-text placeholder:text-text-muted/60 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-[12.5px]">
          <span className="text-text-muted">Filter:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-[12px] text-text"
          >
            <option value="ALL">All Action Types</option>
            <option value="SALE_EDITED">Bill Edited</option>
            <option value="SALE_VOIDED">Bill Voided</option>
            <option value="CREDIT_ADJUSTMENT">Credit Adjusted</option>
            <option value="DIP_CORRECTION">Tank Dip Adjusted</option>
          </select>
        </div>
      </div>

      {/* Corrections Audit Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px] min-w-[860px]">
            <thead className="border-b border-border bg-surface-hi text-[11px] font-semibold uppercase tracking-wider text-text-muted font-data">
              <tr>
                <th className="px-4 py-3.5">TIMESTAMP (BS)</th>
                <th className="px-3 py-3.5">ACTION</th>
                <th className="px-4 py-3.5">ENTITY MODIFIED</th>
                <th className="px-4 py-3.5">PERFORMED BY</th>
                <th className="px-4 py-3.5">REASON FOR MODIFICATION</th>
                <th className="px-4 py-3.5">CHANGES (BEFORE → AFTER)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {filteredCorrections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted font-body">
                    No correction entries match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredCorrections.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-hi/40 transition-colors">
                    <td className="px-4 py-3 text-text-muted text-[12px]">
                      <div className="font-semibold text-accent">{entry.dateBS}</div>
                      <div className="text-[10.5px]">{entry.time}</div>
                    </td>

                    <td className="px-3 py-3 font-body">
                      {getActionBadge(entry.action)}
                    </td>

                    <td className="px-4 py-3 font-bold text-text font-body">
                      {entry.entity}
                    </td>

                    <td className="px-4 py-3 font-body text-text">
                      <div>{entry.actorName}</div>
                      <span className="font-mono text-[10.5px] text-text-muted">
                        [{ROLE_LABEL[entry.actorRole]}]
                      </span>
                    </td>

                    <td className="px-4 py-3 font-body text-text-muted text-[12px]">
                      {entry.reason}
                    </td>

                    <td className="px-4 py-3 font-body text-[11.5px]">
                      <div className="line-through text-error/80">{entry.previousValue}</div>
                      <div className="text-success font-medium flex items-center gap-1">
                        <ArrowRight size={11} /> {entry.updatedValue}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
