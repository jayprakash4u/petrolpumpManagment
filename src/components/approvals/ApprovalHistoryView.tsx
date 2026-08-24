"use client";

import { useState, useMemo } from "react";
import {
  History,
  Search,
  Download,
  Printer,
  CheckCircle2,
  XCircle,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
import {
  type ApprovalRequest,
  type ApprovalWorkflowType,
  WORKFLOW_CONFIG,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  filterApprovalRequests,
} from "@/lib/approvals";
import { getApprovalRequests } from "@/lib/mock/approvals";
import { fmtRs, fmtL } from "@/lib/money";
import { ROLE_LABEL } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { GhostButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";

export function ApprovalHistoryView() {
  const [requests] = useState<ApprovalRequest[]>(() => getApprovalRequests());
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectingRequest, setInspectingRequest] = useState<ApprovalRequest | null>(null);

  const filteredHistory = useMemo(() => {
    return filterApprovalRequests(requests, {
      status: selectedStatus as any,
      workflowType: selectedWorkflow as any,
      search: searchQuery,
    });
  }, [requests, selectedStatus, selectedWorkflow, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Request Code",
      "Type",
      "Title",
      "Presenter",
      "Presenter Role",
      "Date (BS)",
      "Status",
      "Amount (NPR)",
      "Volume (L)",
      "Reviewer",
      "Reviewer Role",
      "Review Date (BS)",
      "Approver Note / Rejection Reason",
    ];

    const rows = filteredHistory.map((r) => [
      `"${r.requestCode}"`,
      `"${WORKFLOW_CONFIG[r.workflowType].label}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.requestedBy.name}"`,
      `"${ROLE_LABEL[r.requestedBy.role]}"`,
      `"${r.requestedAtBS}"`,
      `"${STATUS_CONFIG[r.status].label}"`,
      `"${r.amountNpr || ""}"`,
      `"${r.volumeL || ""}"`,
      `"${r.reviewedBy?.name || ""}"`,
      `"${r.reviewedBy ? ROLE_LABEL[r.reviewedBy.role] : ""}"`,
      `"${r.reviewedAtBS || ""}"`,
      `"${(r.approverNotes || r.rejectionReason || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `approval_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <History size={20} />
          </div>
          <div>
            <h3 className="font-display text-[17px] font-bold text-text">Maker-Checker Audit Register</h3>
            <p className="text-[12.5px] text-text-muted">
              Complete append-only governance trail of all prepared and reviewed transactions.
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
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-3">
        <div className="relative">
          <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, title, presenter, reviewer..."
            className="pl-8 text-[12.5px]"
          />
        </div>

        <Select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="text-[12.5px]"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending Review</option>
          <option value="APPROVED">Approved & Released</option>
          <option value="REJECTED">Rejected</option>
        </Select>

        <Select
          value={selectedWorkflow}
          onChange={(e) => setSelectedWorkflow(e.target.value)}
          className="text-[12.5px]"
        >
          <option value="ALL">All Categories</option>
          {(Object.keys(WORKFLOW_CONFIG) as ApprovalWorkflowType[]).map((wf) => (
            <option key={wf} value={wf}>
              {WORKFLOW_CONFIG[wf].label}
            </option>
          ))}
        </Select>
      </div>

      {/* Historical Register Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-hi font-medium text-text-muted">
              <tr>
                <th className="p-3 font-semibold">Request Code</th>
                <th className="p-3 font-semibold">Workflow / Title</th>
                <th className="p-3 font-semibold">Presenter (Maker)</th>
                <th className="p-3 font-semibold">Amount / Litres</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Reviewer (Checker)</th>
                <th className="p-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-text-muted">
                    <FileSpreadsheet size={32} className="mx-auto text-text-muted/50 mb-2" />
                    No audit records match your filters.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((req) => {
                  const statusConf = STATUS_CONFIG[req.status];
                  const priorityConf = PRIORITY_CONFIG[req.priority];

                  return (
                    <tr key={req.id} className="hover:bg-surface-hi/40 transition-colors">
                      <td className="p-3 font-data font-bold text-accent whitespace-nowrap">
                        {req.requestCode}
                        <div className="text-[10.5px] font-normal text-text-muted">{req.requestedAtBS}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-medium text-text">{req.title}</div>
                        <div className="font-data text-[11px] text-text-muted">
                          {WORKFLOW_CONFIG[req.workflowType].label} · {req.supportingDocNo || "No doc ref"}
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <div className="font-semibold text-text">{req.requestedBy.name}</div>
                        <div className="font-data text-[11px] text-text-muted">
                          {ROLE_LABEL[req.requestedBy.role]}
                        </div>
                      </td>

                      <td className="p-3 font-data whitespace-nowrap">
                        {req.amountNpr !== undefined && (
                          <div className="font-bold text-text">{fmtRs(req.amountNpr)}</div>
                        )}
                        {req.volumeL !== undefined && (
                          <div className="text-[11.5px] text-text-muted">{fmtL(req.volumeL)}</div>
                        )}
                        {req.amountNpr === undefined && req.volumeL === undefined && (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <Badge tone={statusConf.tone as Tone}>{statusConf.label.toUpperCase()}</Badge>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {req.reviewedBy ? (
                          <>
                            <div className="font-semibold text-text">{req.reviewedBy.name}</div>
                            <div className="font-data text-[10.5px] text-text-muted">
                              {ROLE_LABEL[req.reviewedBy.role]} · {req.reviewedAtBS}
                            </div>
                          </>
                        ) : (
                          <span className="font-data text-accent text-[11.5px]">Pending Review</span>
                        )}
                      </td>

                      <td className="p-3 text-right whitespace-nowrap">
                        <GhostButton
                          onClick={() => setInspectingRequest(req)}
                          className="py-1 px-2 text-[11.5px]"
                        >
                          <Eye size={13} /> View Audit
                        </GhostButton>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Audit Inspector Modal */}
      {inspectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-fade-in w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-data text-[14px] font-bold text-accent">{inspectingRequest.requestCode}</span>
                  <Badge tone={STATUS_CONFIG[inspectingRequest.status].tone as Tone}>
                    {STATUS_CONFIG[inspectingRequest.status].label.toUpperCase()}
                  </Badge>
                </div>
                <h3 className="font-display mt-1.5 text-[18px] font-bold text-text">{inspectingRequest.title}</h3>
              </div>
              <button
                onClick={() => setInspectingRequest(null)}
                className="cursor-pointer text-text-muted hover:text-text"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-[13px]">
              <div>
                <span className="text-[11px] text-text-muted">Operational Description:</span>
                <p className="mt-0.5 text-text">{inspectingRequest.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-bg p-3.5">
                <div>
                  <span className="text-[11px] text-text-muted">Maker (Presenter)</span>
                  <div className="font-semibold text-text">{inspectingRequest.requestedBy.name}</div>
                  <div className="font-data text-[11px] text-text-muted">
                    {ROLE_LABEL[inspectingRequest.requestedBy.role]} · @{inspectingRequest.requestedBy.username}
                  </div>
                  <div className="font-data mt-1 text-[11px] text-text-muted">BS: {inspectingRequest.requestedAtBS}</div>
                </div>

                <div>
                  <span className="text-[11px] text-text-muted">Checker (Approver)</span>
                  {inspectingRequest.reviewedBy ? (
                    <>
                      <div className="font-semibold text-text">{inspectingRequest.reviewedBy.name}</div>
                      <div className="font-data text-[11px] text-text-muted">
                        {ROLE_LABEL[inspectingRequest.reviewedBy.role]} · @{inspectingRequest.reviewedBy.username}
                      </div>
                      <div className="font-data mt-1 text-[11px] text-text-muted">BS: {inspectingRequest.reviewedAtBS}</div>
                    </>
                  ) : (
                    <div className="font-data text-[12px] text-accent">Pending Review</div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-bg p-3.5">
                <span className="text-[11px] text-text-muted">Maker Justification</span>
                <p className="mt-0.5 text-text italic">"{inspectingRequest.justification}"</p>
              </div>

              {inspectingRequest.approverNotes && (
                <div className="rounded-xl border border-success/30 bg-success/10 p-3.5 text-success">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 size={15} /> Checker Approval Sign-off:
                  </div>
                  <p className="mt-1 text-[12.5px]">{inspectingRequest.approverNotes}</p>
                </div>
              )}

              {inspectingRequest.rejectionReason && (
                <div className="rounded-xl border border-error/30 bg-error/10 p-3.5 text-error">
                  <div className="flex items-center gap-1.5 font-bold">
                    <XCircle size={15} /> Rejection Reason:
                  </div>
                  <p className="mt-1 text-[12.5px]">{inspectingRequest.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-border pt-4">
              <GhostButton onClick={() => setInspectingRequest(null)}>Close</GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
