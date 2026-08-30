"use client";

import { useState, useMemo } from "react";
import {
  MailCheck,
  Printer,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Building2,
  FileSignature,
  Eye,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { fmtRs } from "@/lib/money";
import { MOCK_CONFIRMATIONS } from "@/lib/mock/auditor";
import type { BalanceConfirmationLetter, PartyType, ConfirmationStatus } from "@/lib/auditor";

export function BalanceConfirmationView() {
  const [confirmations] = useState<BalanceConfirmationLetter[]>(MOCK_CONFIRMATIONS);
  const [partyFilter, setPartyFilter] = useState<"ALL" | PartyType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ConfirmationStatus>("ALL");
  const [selectedLetter, setSelectedLetter] = useState<BalanceConfirmationLetter | null>(
    MOCK_CONFIRMATIONS[0]
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return confirmations.filter((c) => {
      if (partyFilter !== "ALL" && c.partyType !== partyFilter) return false;
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.partyName.toLowerCase().includes(q);
        const matchPan = c.panNumber.toLowerCase().includes(q);
        const matchContact = c.contactPerson.toLowerCase().includes(q);
        if (!matchName && !matchPan && !matchContact) return false;
      }
      return true;
    });
  }, [confirmations, partyFilter, statusFilter, searchQuery]);

  const agreedCount = confirmations.filter((c) => c.status === "AGREED").length;
  const diffCount = confirmations.filter((c) => c.status === "CONFIRMED_WITH_DIFF").length;
  const disputedCount = confirmations.filter((c) => c.status === "DISPUTED").length;
  const pendingCount = confirmations.filter((c) => c.status === "PENDING_RESPONSE").length;

  const handlePrintLetter = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Party Type",
      "Party Name",
      "PAN Number",
      "Address",
      "Contact Person",
      "As of Date (BS)",
      "Book Balance (NPR)",
      "Balance Type",
      "Confirmed Balance (NPR)",
      "Difference (NPR)",
      "Status",
      "Dispute / Variance Reason",
      "Sent Date (BS)",
      "Response Date (BS)",
      "Auditor Firm",
    ];

    const rows = filtered.map((c) => [
      `"${c.partyType}"`,
      `"${c.partyName}"`,
      `"${c.panNumber}"`,
      `"${c.address}"`,
      `"${c.contactPerson}"`,
      `"${c.asOfDateBS}"`,
      `"${c.bookBalanceNpr}"`,
      `"${c.balanceType}"`,
      `"${c.confirmedBalanceNpr || ""}"`,
      `"${c.differenceNpr || 0}"`,
      `"${c.status}"`,
      `"${c.disputeReason || ""}"`,
      `"${c.sentDateBS}"`,
      `"${c.responseDateBS || ""}"`,
      `"${c.auditorFirm}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `balance_confirmations_tracker_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: ConfirmationStatus) => {
    switch (status) {
      case "AGREED":
        return <Badge tone="success">Balance Agreed</Badge>;
      case "CONFIRMED_WITH_DIFF":
        return <Badge tone="accent">Diff Reconciled</Badge>;
      case "DISPUTED":
        return <Badge tone="error">Disputed</Badge>;
      case "PENDING_RESPONSE":
        return <Badge tone="muted">Pending Response</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <MailCheck size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              Year-End Balance Confirmations (मौज्दात प्रमाणीकरण पत्र)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Statutory audit circular letters to debtors & creditors in accordance with NSA 505 (External Confirmations).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrintLetter} className="text-[12.5px]">
            <Printer size={14} /> Print Letter
          </GhostButton>
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export Register
          </GhostButton>
        </div>
      </div>

      {/* KPI Status Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Confirmed & Agreed"
          value={`${agreedCount} Parties`}
          icon={CheckCircle2}
          tone="success"
          small
        />
        <StatCard
          label="Confirmed with Diff"
          value={`${diffCount} Parties`}
          icon={AlertCircle}
          tone="accent"
          small
        />
        <StatCard
          label="Disputed Balance"
          value={`${disputedCount} Parties`}
          icon={AlertCircle}
          tone="error"
          small
        />
        <StatCard
          label="Awaiting Response"
          value={`${pendingCount} Parties`}
          icon={Clock}
          tone="text"
          small
        />
      </div>

      {/* Main Container: Split View (Registry Table + Letter Preview) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Register (7 cols) */}
        <div className="space-y-3 lg:col-span-6 xl:col-span-7">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPartyFilter("ALL")}
                className={`rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  partyFilter === "ALL"
                    ? "bg-accent/15 font-semibold text-accent"
                    : "text-text-muted hover:text-text"
                }`}
              >
                All Parties
              </button>
              <button
                type="button"
                onClick={() => setPartyFilter("DEBTOR")}
                className={`rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  partyFilter === "DEBTOR"
                    ? "bg-accent/15 font-semibold text-accent"
                    : "text-text-muted hover:text-text"
                }`}
              >
                Debtors (Customers)
              </button>
              <button
                type="button"
                onClick={() => setPartyFilter("CREDITOR")}
                className={`rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  partyFilter === "CREDITOR"
                    ? "bg-accent/15 font-semibold text-accent"
                    : "text-text-muted hover:text-text"
                }`}
              >
                Creditors (Suppliers)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search party name or PAN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 rounded-lg border border-border bg-bg px-2.5 py-1 text-[12px] text-text placeholder:text-text-muted/60 focus:outline-none"
              />
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-2.5">
            {filtered.map((c) => {
              const isSelected = selectedLetter?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedLetter(c)}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                    isSelected
                      ? "border-accent bg-accent/5 shadow-sm"
                      : "border-border bg-surface hover:border-accent/30 hover:bg-surface-hi"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text text-[13px]">{c.partyName}</span>
                        <span className="rounded bg-surface-hi px-1.5 py-0.5 text-[10.5px] font-medium text-text-muted">
                          {c.partyType}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11.5px] text-text-muted">
                        PAN: {c.panNumber} · Attn: {c.contactPerson}
                      </div>
                    </div>
                    <div>{getStatusBadge(c.status)}</div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2 text-[12px]">
                    <div className="text-text-muted">
                      Book Balance:{" "}
                      <span className="font-data font-semibold text-text">
                        {fmtRs(c.bookBalanceNpr)} ({c.balanceType})
                      </span>
                    </div>

                    {c.differenceNpr !== undefined && c.differenceNpr !== 0 ? (
                      <div className="font-data text-[11.5px] text-accent">
                        Diff: {fmtRs(Math.abs(c.differenceNpr))}
                      </div>
                    ) : (
                      <div className="text-[11.5px] text-success">Balanced</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Formal Letter Preview (5 cols) */}
        <div className="lg:col-span-6 xl:col-span-5">
          {selectedLetter ? (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="border-b border-border pb-4 text-center">
                <div className="font-display text-[15px] font-bold text-text">
                  SHARMA & ASSOCIATES
                </div>
                <div className="text-[11px] font-medium text-text-muted">
                  Chartered Accountants · ICAN Firm Reg. FCA-1928
                </div>
                <div className="text-[10.5px] text-text-muted">
                  Putalisadak Commercial Complex, Kathmandu, Nepal
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-[11.5px] text-text-muted">
                <div>Ref: CONF/FY83/{selectedLetter.id.toUpperCase()}</div>
                <div>Date: {selectedLetter.sentDateBS} BS</div>
              </div>

              <div className="mt-4 text-[12px] space-y-0.5 text-text">
                <div className="font-semibold text-text">To,</div>
                <div className="font-semibold text-text">{selectedLetter.partyName}</div>
                <div className="text-text-muted">{selectedLetter.address}</div>
                <div className="text-text-muted">PAN: {selectedLetter.panNumber}</div>
                <div className="text-text-muted">Attn: {selectedLetter.contactPerson}</div>
              </div>

              <div className="mt-4 font-semibold text-[12.5px] text-text underline">
                Subject: Request for Year-End Balance Confirmation as at {selectedLetter.asOfDateBS} BS
              </div>

              <p className="mt-3 text-[12px] text-text-muted leading-relaxed">
                Dear Sir/Madam,
                <br />
                In connection with the statutory audit of the financial statements of{" "}
                <strong className="text-text">Shree Pashupati Petroleum Center</strong> for the fiscal year ended 2083/84, please confirm directly to our audit firm the balance outstanding on your account.
              </p>

              <div className="my-4 rounded-lg border border-accent/20 bg-accent/5 p-3 text-center">
                <div className="text-[11px] uppercase tracking-wider text-text-muted">
                  Balance per Station Books as of {selectedLetter.asOfDateBS}
                </div>
                <div className="font-data text-[18px] font-bold text-text">
                  {fmtRs(selectedLetter.bookBalanceNpr)}{" "}
                  <span className="text-[13px] font-normal text-text-muted">
                    ({selectedLetter.balanceType === "DR" ? "Debit / Receivable" : "Credit / Payable"})
                  </span>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-border bg-bg p-3 text-[11.5px]">
                <div className="font-semibold text-text">Party Confirmation Reply Section:</div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Audit Verification Status:</span>
                  <span>{getStatusBadge(selectedLetter.status)}</span>
                </div>
                {selectedLetter.confirmedBalanceNpr !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Confirmed by Party:</span>
                    <span className="font-data font-semibold text-text">
                      {fmtRs(selectedLetter.confirmedBalanceNpr)}
                    </span>
                  </div>
                )}
                {selectedLetter.disputeReason && (
                  <div className="mt-2 text-[11px] text-text-muted border-t border-border pt-1.5">
                    <strong className="text-text">Notes / Discrepancy Reason:</strong> {selectedLetter.disputeReason}
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-end justify-between border-t border-border pt-4 text-[11px] text-text-muted">
                <div>
                  <div className="h-8"></div>
                  <div className="font-semibold text-text">For: {selectedLetter.partyName}</div>
                  <div>(Authorized Signatory & Seal)</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-text">{selectedLetter.auditorName}</div>
                  <div>{selectedLetter.auditorFirm}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-text-muted">
              Select a party from the registry to view confirmation circular letter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
