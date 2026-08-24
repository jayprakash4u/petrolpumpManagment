"use client";

import { useState, useMemo } from "react";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Layers,
  CreditCard,
  Wallet,
  FileX,
  Users,
  Truck,
  FileCheck2,
  Eye,
  ShieldCheck,
  CheckSquare,
  Square,
  Info,
} from "lucide-react";
import type { Role } from "@prisma/client";
import {
  type ApprovalRequest,
  type ApprovalStatus,
  type ApprovalWorkflowType,
  WORKFLOW_CONFIG,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  calculateApprovalSummary,
  filterApprovalRequests,
  canUserApprove,
} from "@/lib/approvals";
import {
  getApprovalRequests,
  getApprovalRules,
  approveRequest,
  rejectRequest,
  batchApproveRequests,
} from "@/lib/mock/approvals";
import { fmtRs, fmtL } from "@/lib/money";
import { ROLE_LABEL } from "@/lib/permissions";
import { initials } from "@/lib/staff";
import { Card } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { StatCard } from "@/components/dashboard/StatCard";

const WORKFLOW_ICONS: Record<ApprovalWorkflowType, React.ComponentType<{ size?: number; className?: string }>> = {
  EXPENSE_VOUCHER: Wallet,
  CREDIT_LIMIT_OVERRIDE: CreditCard,
  SALE_VOID_REVERSAL: FileX,
  FUEL_RATE_REVISION: TrendingUp,
  TANK_DIP_VARIANCE_ADJUSTMENT: Layers,
  SHIFT_CASH_DISCREPANCY: Users,
  PURCHASE_INVOICE_RELEASE: Truck,
};

export function ApprovalQueueView({
  currentUser,
}: {
  currentUser: { id: string; name: string; role: Role; username: string };
}) {
  const [requests, setRequests] = useState<ApprovalRequest[]>(() => getApprovalRequests());
  const [rules] = useState(() => getApprovalRules());
  const [selectedStatus, setSelectedStatus] = useState<ApprovalStatus | "ALL">("PENDING");
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflowType | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Inspector modal state
  const [inspectingRequest, setInspectingRequest] = useState<ApprovalRequest | null>(null);

  // Rejection dialog state
  const [rejectingRequest, setRejectingRequest] = useState<ApprovalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Approval remark dialog state
  const [approvingRequest, setApprovingRequest] = useState<ApprovalRequest | null>(null);
  const [approvalNote, setApprovalNote] = useState("");

  const refreshData = () => {
    setRequests(getApprovalRequests());
  };

  const summary = useMemo(() => calculateApprovalSummary(requests), [requests]);

  const filteredRequests = useMemo(() => {
    return filterApprovalRequests(requests, {
      status: selectedStatus,
      workflowType: selectedWorkflow,
      search: searchQuery,
    });
  }, [requests, selectedStatus, selectedWorkflow, searchQuery]);

  const handleApprove = (req: ApprovalRequest, notes?: string) => {
    const actor = {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      username: currentUser.username,
    };
    const res = approveRequest(req.id, actor, notes);
    if (res.success) {
      setNotification({ type: "success", message: res.message });
      refreshData();
      setSelectedIds((prev) => prev.filter((id) => id !== req.id));
      setApprovingRequest(null);
      setApprovalNote("");
      if (inspectingRequest?.id === req.id && res.request) {
        setInspectingRequest(res.request);
      }
    } else {
      setNotification({ type: "error", message: res.message });
    }
  };

  const handleReject = () => {
    if (!rejectingRequest) return;
    if (!rejectionReason.trim()) {
      setNotification({ type: "error", message: "Please provide a reason for rejecting this request." });
      return;
    }

    const actor = {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      username: currentUser.username,
    };
    const res = rejectRequest(rejectingRequest.id, actor, rejectionReason);
    if (res.success) {
      setNotification({ type: "info", message: res.message });
      refreshData();
      setSelectedIds((prev) => prev.filter((id) => id !== rejectingRequest.id));
      setRejectingRequest(null);
      setRejectionReason("");
      if (inspectingRequest?.id === rejectingRequest.id && res.request) {
        setInspectingRequest(res.request);
      }
    } else {
      setNotification({ type: "error", message: res.message });
    }
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    const actor = {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      username: currentUser.username,
    };
    const res = batchApproveRequests(selectedIds, actor, "Batch verified and approved by station authority.");
    if (res.successCount > 0) {
      setNotification({
        type: "success",
        message: `Successfully approved ${res.successCount} request(s).${
          res.failedCount > 0 ? ` (${res.failedCount} skipped due to maker-checker policy)` : ""
        }`,
      });
      refreshData();
      setSelectedIds([]);
    } else {
      setNotification({
        type: "error",
        message: `Could not batch approve items: ${res.messages.join(", ")}`,
      });
    }
  };

  const toggleSelectAll = () => {
    const pendingInView = filteredRequests.filter((r) => r.status === "PENDING").map((r) => r.id);
    if (selectedIds.length === pendingInView.length && pendingInView.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingInView);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          className={`animate-fade-in flex items-center justify-between rounded-xl border p-3.5 text-[13px] ${
            notification.type === "success"
              ? "border-success/30 bg-success/10 text-success"
              : notification.type === "error"
              ? "border-error/30 bg-error/10 text-error"
              : "border-accent/30 bg-accent/10 text-accent"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 size={16} className="shrink-0" />
            ) : notification.type === "error" ? (
              <XCircle size={16} className="shrink-0" />
            ) : (
              <Info size={16} className="shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="cursor-pointer text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Pending Approvals"
          value={String(summary.pendingCount)}
          icon={Inbox}
          tone="accent"
        />
        <StatCard
          label="Pending Value (NPR)"
          value={fmtRs(summary.totalPendingAmountNpr)}
          icon={TrendingUp}
          tone="accent"
          small
        />
        <StatCard
          label="High Priority / Critical"
          value={String(summary.highPriorityCount)}
          icon={AlertTriangle}
          tone={summary.highPriorityCount > 0 ? "accent" : "text"}
        />
        <StatCard
          label="Approved / Released Today"
          value={String(summary.approvedTodayCount)}
          icon={ShieldCheck}
          tone="success"
        />
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[12px] font-medium text-text-muted">Status:</span>
            {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setSelectedStatus(st);
                  setSelectedIds([]);
                }}
                className={`font-display cursor-pointer rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                  selectedStatus === st
                    ? "border border-accent/40 bg-accent/15 font-semibold text-accent shadow-xs"
                    : "border border-border bg-bg text-text-muted hover:text-text"
                }`}
              >
                {st === "ALL" ? "All Requests" : STATUS_CONFIG[st].label}
                {st === "PENDING" && summary.pendingCount > 0 && (
                  <span className="font-data ml-1.5 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent">
                    {summary.pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, title, presenter, doc..."
              className="pl-8 text-[12.5px]"
            />
          </div>
        </div>

        {/* Workflow Type Pills */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/80 pt-3">
          <span className="mr-1 flex items-center gap-1 text-[12px] font-medium text-text-muted">
            <Filter size={12} /> Category:
          </span>
          <button
            onClick={() => setSelectedWorkflow("ALL")}
            className={`font-display cursor-pointer rounded-md px-2.5 py-1 text-[12px] transition-colors ${
              selectedWorkflow === "ALL"
                ? "bg-surface-hi font-semibold text-text"
                : "text-text-muted hover:text-text"
            }`}
          >
            All Workflows
          </button>
          {(Object.keys(WORKFLOW_CONFIG) as ApprovalWorkflowType[]).map((wf) => {
            const Icon = WORKFLOW_ICONS[wf];
            const isSel = selectedWorkflow === wf;
            return (
              <button
                key={wf}
                onClick={() => setSelectedWorkflow(wf)}
                className={`font-display flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition-colors ${
                  isSel ? "bg-accent/15 font-semibold text-accent" : "text-text-muted hover:bg-white/5 hover:text-text"
                }`}
              >
                <Icon size={12} />
                <span>{WORKFLOW_CONFIG[wf].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Batch Actions Toolbar */}
      {selectedStatus === "PENDING" && filteredRequests.some((r) => r.status === "PENDING") && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-2.5 text-[12.5px]">
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleSelectAll}
              className="flex cursor-pointer items-center gap-1.5 font-medium text-text hover:text-accent"
            >
              {selectedIds.length > 0 &&
              selectedIds.length === filteredRequests.filter((r) => r.status === "PENDING").length ? (
                <CheckSquare size={16} className="text-accent" />
              ) : (
                <Square size={16} className="text-text-muted" />
              )}
              <span>Select All Pending ({filteredRequests.filter((r) => r.status === "PENDING").length})</span>
            </button>
            {selectedIds.length > 0 && (
              <span className="font-data text-text-muted">· {selectedIds.length} selected</span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <PrimaryButton onClick={handleBatchApprove} className="py-1.5 text-[12.5px]">
                <CheckCircle2 size={14} />
                Batch Approve ({selectedIds.length})
              </PrimaryButton>
              <GhostButton onClick={() => setSelectedIds([])} className="py-1.5 text-[12.5px]">
                Cancel
              </GhostButton>
            </div>
          )}
        </div>
      )}

      {/* Request Queue Listing */}
      {filteredRequests.length === 0 ? (
        <Card className="py-12 text-center">
          <FileCheck2 size={36} className="mx-auto text-text-muted/60" />
          <h3 className="font-display mt-3 text-[16px] font-semibold text-text">No approval requests found</h3>
          <p className="mt-1 text-[13px] text-text-muted">
            {selectedStatus === "PENDING"
              ? "All caught up! There are no pending requests awaiting verification."
              : "No items match your selected filters and search query."}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3.5">
          {filteredRequests.map((req) => {
            const Icon = WORKFLOW_ICONS[req.workflowType];
            const priorityConf = PRIORITY_CONFIG[req.priority];
            const statusConf = STATUS_CONFIG[req.status];
            const rule = rules.find((r) => r.id === req.approvalRuleId || r.workflowType === req.workflowType);
            const approvalCheck = canUserApprove(currentUser.role, currentUser.id, req, rule);
            const isSelected = selectedIds.includes(req.id);
            const isSelf = req.requestedBy.id === currentUser.id;

            return (
              <div
                key={req.id}
                className={`group relative rounded-2xl border bg-surface p-4 transition-all duration-150 ${
                  req.status === "PENDING"
                    ? req.priority === "CRITICAL"
                      ? "border-error/40 hover:border-error/60"
                      : "border-border hover:border-accent/40"
                    : "border-border/60 opacity-90"
                } ${isSelected ? "ring-2 ring-accent/50" : ""}`}
              >
                <div className="flex flex-col gap-3">
                  {/* Top Bar: Code, Category, Priority, Status, Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {req.status === "PENDING" && (
                        <button
                          onClick={() => toggleSelectOne(req.id)}
                          className="cursor-pointer text-text-muted hover:text-accent"
                          aria-label="Select request"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-accent" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      )}
                      <span className="font-data text-[13px] font-bold text-accent">{req.requestCode}</span>
                      <span className="text-text-muted/40">·</span>
                      <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-text-muted">
                        <Icon size={14} className="text-accent" />
                        <span>{WORKFLOW_CONFIG[req.workflowType].label}</span>
                      </div>
                      {req.supportingDocNo && (
                        <span className="font-data rounded bg-surface-hi px-2 py-0.5 text-[11px] text-text-muted">
                          Doc: {req.supportingDocNo}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge tone={priorityConf.tone as Tone}>{priorityConf.label.toUpperCase()}</Badge>
                      <Badge tone={statusConf.tone as Tone}>{statusConf.label.toUpperCase()}</Badge>
                      <span className="font-data text-[11.5px] text-text-muted">{req.requestedAtBS}</span>
                    </div>
                  </div>

                  {/* Main Request Information */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
                    <div className="space-y-2">
                      <h4 className="font-display text-[16px] font-semibold text-text">{req.title}</h4>
                      <p className="text-[13px] text-text-muted">{req.description}</p>

                      {/* Presenter Note / Justification Box */}
                      <div className="rounded-xl border border-border/80 bg-bg p-3 text-[12.5px]">
                        <div className="flex items-center gap-2">
                          <div className="font-data flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10.5px] font-bold text-accent">
                            {initials(req.requestedBy.name)}
                          </div>
                          <span className="font-semibold text-text">{req.requestedBy.name}</span>
                          <span className="font-data text-[11px] text-text-muted">
                            ({ROLE_LABEL[req.requestedBy.role]})
                          </span>
                          <span className="ml-auto text-[11px] text-text-muted">Presenter Remarks:</span>
                        </div>
                        <p className="mt-1.5 text-text-muted/90 italic">"{req.justification}"</p>
                      </div>

                      {/* Quantitative Diff Breakdown */}
                      {req.diffs && req.diffs.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {req.diffs.map((diff, i) => (
                            <div
                              key={i}
                              className="font-data flex items-center gap-2 rounded-lg border border-border bg-bg/60 px-2.5 py-1.5 text-[12px]"
                            >
                              <span className="text-text-muted">{diff.label}:</span>
                              <span className="line-through text-text-muted">{String(diff.currentValue)}</span>
                              <span className="text-accent font-bold">→ {String(diff.proposedValue)} {diff.unit || ""}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right column: Quantitative Stats & Affected Entity */}
                    <div className="flex min-w-[200px] flex-col justify-between gap-3 rounded-xl border border-border/60 bg-bg/40 p-3.5">
                      <div className="space-y-2">
                        {req.amountNpr !== undefined && (
                          <div>
                            <span className="text-[11px] text-text-muted">Voucher / Request Amount</span>
                            <div className="font-data text-[17px] font-bold text-accent">{fmtRs(req.amountNpr)}</div>
                          </div>
                        )}
                        {req.volumeL !== undefined && (
                          <div>
                            <span className="text-[11px] text-text-muted">Volume Impact</span>
                            <div className="font-data text-[15px] font-semibold text-text">{fmtL(req.volumeL)}</div>
                          </div>
                        )}
                        {req.affectedEntityName && (
                          <div>
                            <span className="text-[11px] text-text-muted">Affected Entity</span>
                            <div className="font-display text-[12.5px] font-medium text-text">
                              {req.affectedEntityName}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Reviewer / Approver stamp if processed */}
                      {req.status !== "PENDING" && req.reviewedBy && (
                        <div className="border-t border-border/80 pt-2 text-[11.5px]">
                          <div className="text-text-muted">Reviewed by:</div>
                          <div className="font-semibold text-text">{req.reviewedBy.name} ({ROLE_LABEL[req.reviewedBy.role]})</div>
                          <div className="font-data text-text-muted text-[10.5px]">{req.reviewedAtBS}</div>
                          {req.approverNotes && (
                            <p className="mt-1 text-[11.5px] text-success italic">Note: {req.approverNotes}</p>
                          )}
                          {req.rejectionReason && (
                            <p className="mt-1 text-[11.5px] text-error italic">Reason: {req.rejectionReason}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
                    <div className="flex items-center gap-2 text-[12px] text-text-muted">
                      {isSelf && req.status === "PENDING" && (
                        <span className="flex items-center gap-1 font-medium text-accent">
                          <Info size={13} /> You created this request. Another authorized checker must release it.
                        </span>
                      )}
                      {!isSelf && !approvalCheck.canApprove && req.status === "PENDING" && (
                        <span className="text-error text-[11.5px]">{approvalCheck.reason}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <GhostButton
                        onClick={() => setInspectingRequest(req)}
                        className="px-3 py-1.5 text-[12px]"
                      >
                        <Eye size={14} /> Full Audit View
                      </GhostButton>

                      {req.status === "PENDING" && (
                        <>
                          <GhostButton
                            tone="error"
                            disabled={!approvalCheck.canApprove}
                            onClick={() => {
                              setRejectingRequest(req);
                              setRejectionReason("");
                            }}
                            className="px-3 py-1.5 text-[12px]"
                          >
                            <XCircle size={14} /> Reject
                          </GhostButton>

                          <PrimaryButton
                            disabled={!approvalCheck.canApprove}
                            onClick={() => {
                              setApprovingRequest(req);
                              setApprovalNote("");
                            }}
                            className="px-3.5 py-1.5 text-[12px]"
                          >
                            <CheckCircle2 size={14} /> Approve & Release
                          </PrimaryButton>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approval Confirmation Dialog */}
      {approvingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl">
            <div className="flex items-center gap-2.5 text-success">
              <CheckCircle2 size={20} />
              <h3 className="font-display text-[17px] font-bold text-text">Confirm Approval & Release</h3>
            </div>
            <p className="mt-2 text-[13px] text-text-muted">
              You are authorizing <strong className="text-text">{approvingRequest.requestCode}</strong>:{" "}
              {approvingRequest.title}. This will immediately commit the changes to station accounting and stock.
            </p>

            <div className="mt-4">
              <label htmlFor="approvalNotes" className="mb-1.5 block text-[12.5px] font-medium text-text-muted">
                Approver Verification Remarks (Optional):
              </label>
              <textarea
                id="approvalNotes"
                rows={3}
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="e.g. Verified nozzle reading and meter slip. Released for accounting."
                className="w-full rounded-lg border border-border bg-bg p-2.5 font-data text-[13px] text-text"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <GhostButton onClick={() => setApprovingRequest(null)} className="py-2 text-[13px]">
                Cancel
              </GhostButton>
              <PrimaryButton
                onClick={() => handleApprove(approvingRequest, approvalNote)}
                className="py-2 text-[13px]"
              >
                <ShieldCheck size={15} /> Confirm & Sign Off
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal Dialog */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-error/30 bg-surface p-5 shadow-2xl">
            <div className="flex items-center gap-2.5 text-error">
              <XCircle size={20} />
              <h3 className="font-display text-[17px] font-bold text-text">Reject Request</h3>
            </div>
            <p className="mt-2 text-[13px] text-text-muted">
              Rejecting <strong className="text-text">{rejectingRequest.requestCode}</strong>:{" "}
              {rejectingRequest.title}. Please provide a mandatory reason for the presenter.
            </p>

            <div className="mt-4">
              <label htmlFor="rejectionReason" className="mb-1.5 block text-[12.5px] font-medium text-text-muted">
                Reason for Rejection <span className="text-error">*</span>
              </label>
              <textarea
                id="rejectionReason"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Invoice discrepancy or missing meter reading verification."
                className="w-full rounded-lg border border-border bg-bg p-2.5 font-data text-[13px] text-text"
                required
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <GhostButton onClick={() => setRejectingRequest(null)} className="py-2 text-[13px]">
                Cancel
              </GhostButton>
              <PrimaryButton
                onClick={handleReject}
                className="bg-error text-white hover:bg-error/90 py-2 text-[13px]"
              >
                <XCircle size={15} /> Confirm Rejection
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Full Audit Inspector Dialog */}
      {inspectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-fade-in w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-data text-[14px] font-bold text-accent">{inspectingRequest.requestCode}</span>
                  <Badge tone={PRIORITY_CONFIG[inspectingRequest.priority].tone as Tone}>
                    {PRIORITY_CONFIG[inspectingRequest.priority].label.toUpperCase()}
                  </Badge>
                  <Badge tone={STATUS_CONFIG[inspectingRequest.status].tone as Tone}>
                    {STATUS_CONFIG[inspectingRequest.status].label.toUpperCase()}
                  </Badge>
                </div>
                <h3 className="font-display mt-1.5 text-[18px] font-bold text-text">{inspectingRequest.title}</h3>
              </div>
              <button
                onClick={() => setInspectingRequest(null)}
                className="cursor-pointer rounded-lg p-1.5 text-text-muted hover:bg-surface-hi hover:text-text"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-[13px]">
              <div>
                <h5 className="font-display font-semibold text-text">Workflow Overview</h5>
                <p className="mt-1 text-text-muted">{inspectingRequest.description}</p>
              </div>

              {/* Maker & Timeline Info */}
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-bg p-3.5">
                <div>
                  <span className="text-[11px] text-text-muted">Presenter (Maker)</span>
                  <div className="font-semibold text-text">{inspectingRequest.requestedBy.name}</div>
                  <div className="font-data text-[11px] text-text-muted">
                    {ROLE_LABEL[inspectingRequest.requestedBy.role]} · @{inspectingRequest.requestedBy.username}
                  </div>
                  <div className="font-data mt-1 text-[11px] text-text-muted">BS: {inspectingRequest.requestedAtBS}</div>
                </div>

                <div>
                  <span className="text-[11px] text-text-muted">Checker (Reviewer)</span>
                  {inspectingRequest.reviewedBy ? (
                    <>
                      <div className="font-semibold text-text">{inspectingRequest.reviewedBy.name}</div>
                      <div className="font-data text-[11px] text-text-muted">
                        {ROLE_LABEL[inspectingRequest.reviewedBy.role]} · @{inspectingRequest.reviewedBy.username}
                      </div>
                      <div className="font-data mt-1 text-[11px] text-text-muted">BS: {inspectingRequest.reviewedAtBS}</div>
                    </>
                  ) : (
                    <div className="font-data text-[12px] text-accent">Pending Checker Review</div>
                  )}
                </div>
              </div>

              {/* Justification */}
              <div className="rounded-xl border border-border bg-bg p-3.5">
                <span className="text-[11px] text-text-muted">Maker Justification</span>
                <p className="mt-1 text-text">{inspectingRequest.justification}</p>
              </div>

              {/* Field Diffs */}
              {inspectingRequest.diffs && inspectingRequest.diffs.length > 0 && (
                <div>
                  <h5 className="font-display font-semibold text-text mb-2">Detailed State Impact & Diff</h5>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-left text-[12.5px]">
                      <thead className="border-b border-border bg-surface-hi font-medium text-text-muted">
                        <tr>
                          <th className="p-2.5">Field / Metric</th>
                          <th className="p-2.5">Current Value</th>
                          <th className="p-2.5">Proposed Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {inspectingRequest.diffs.map((d, i) => (
                          <tr key={i}>
                            <td className="p-2.5 font-medium text-text">{d.label}</td>
                            <td className="p-2.5 font-data text-text-muted">{String(d.currentValue)}</td>
                            <td className="p-2.5 font-data font-bold text-accent">
                              {String(d.proposedValue)} {d.unit || ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Status Outcome */}
              {inspectingRequest.approverNotes && (
                <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-success">
                  <strong>Approver Sign-off Note:</strong> {inspectingRequest.approverNotes}
                </div>
              )}
              {inspectingRequest.rejectionReason && (
                <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-error">
                  <strong>Rejection Reason:</strong> {inspectingRequest.rejectionReason}
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
