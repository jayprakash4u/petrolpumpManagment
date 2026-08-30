"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Wallet,
  CreditCard,
  FileX,
  TrendingUp,
  Layers,
  Users,
  Truck,
  ArrowRight,
} from "lucide-react";
import type { Role } from "@/lib/permissions";
import {
  type ApprovalWorkflowType,
  type ApprovalPriority,
  WORKFLOW_CONFIG,
} from "@/lib/approvals";
import { createApprovalRequest, getApprovalRules } from "@/lib/mock/approvals";
import { ROLE_LABEL } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

const WORKFLOW_OPTIONS: { type: ApprovalWorkflowType; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { type: "EXPENSE_VOUCHER", label: "Petty Cash & Expense Voucher", icon: Wallet },
  { type: "CREDIT_LIMIT_OVERRIDE", label: "Credit Limit Override", icon: CreditCard },
  { type: "SALE_VOID_REVERSAL", label: "Sale Void / Bill Reversal", icon: FileX },
  { type: "FUEL_RATE_REVISION", label: "Fuel Rate Revision Sign-off", icon: TrendingUp },
  { type: "TANK_DIP_VARIANCE_ADJUSTMENT", label: "Tank Dip Variance Adjustment", icon: Layers },
  { type: "SHIFT_CASH_DISCREPANCY", label: "Shift Handover Cash Settlement", icon: Users },
  { type: "PURCHASE_INVOICE_RELEASE", label: "Supplier Bulk Invoice Release", icon: Truck },
];

export function ApprovalSubmitForm({
  currentUser,
}: {
  currentUser: { id: string; name: string; role: Role | string; username: string };
}) {
  const router = useRouter();
  const [rules] = useState(() => getApprovalRules());

  const [workflowType, setWorkflowType] = useState<ApprovalWorkflowType>("EXPENSE_VOUCHER");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [justification, setJustification] = useState("");
  const [priority, setPriority] = useState<ApprovalPriority>("MEDIUM");
  const [amountNpr, setAmountNpr] = useState("");
  const [volumeL, setVolumeL] = useState("");
  const [affectedEntityName, setAffectedEntityName] = useState("");
  const [supportingDocNo, setSupportingDocNo] = useState("");

  // Specific diff fields
  const [currentVal, setCurrentVal] = useState("");
  const [proposedVal, setProposedVal] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find matching policy rule
  const matchedRule = rules.find((r) => r.workflowType === workflowType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setError("Please provide a request title.");
      return;
    }
    if (!description.trim()) {
      setError("Please provide a brief operational description.");
      return;
    }
    if (!justification.trim()) {
      setError("Please explain the reason/justification for this request.");
      return;
    }

    setIsSubmitting(true);

    try {
      const parsedAmount = amountNpr ? parseFloat(amountNpr) : undefined;
      const parsedVolume = volumeL ? parseFloat(volumeL) : undefined;

      const diffs =
        currentVal || proposedVal
          ? [
              {
                field: "primaryField",
                label: "Target Field",
                currentValue: currentVal || "N/A",
                proposedValue: proposedVal || "N/A",
              },
            ]
          : undefined;

      const newReq = createApprovalRequest({
        workflowType,
        title: title.trim(),
        description: description.trim(),
        category: WORKFLOW_CONFIG[workflowType].category,
        priority,
        requestedBy: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          username: currentUser.username,
        },
        justification: justification.trim(),
        amountNpr: parsedAmount,
        volumeL: parsedVolume,
        affectedEntityName: affectedEntityName.trim() || undefined,
        supportingDocNo: supportingDocNo.trim() || undefined,
        diffs,
        requiresDualApproval: matchedRule?.requireDualApproval || false,
        approvalRuleId: matchedRule?.id,
      });

      setSuccessMessage(`Request ${newReq.requestCode} submitted successfully and added to the Pending Queue!`);
      // Clear inputs
      setTitle("");
      setDescription("");
      setJustification("");
      setAmountNpr("");
      setVolumeL("");
      setAffectedEntityName("");
      setSupportingDocNo("");
      setCurrentVal("");
      setProposedVal("");
    } catch {
      setError("Failed to create approval request. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      {/* Form Section */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {successMessage && (
            <div className="animate-fade-in flex items-center justify-between rounded-xl border border-success/30 bg-success/10 p-4 text-[13px] text-success">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{successMessage}</span>
              </div>
              <PrimaryButton
                type="button"
                onClick={() => router.push("/approvals")}
                className="py-1 px-3 text-[12px]"
              >
                View Queue <ArrowRight size={13} />
              </PrimaryButton>
            </div>
          )}

          {error && (
            <div role="alert" className="animate-fade-in flex items-center gap-2.5 rounded-xl border border-error/30 bg-error/10 p-3.5 text-[13px] text-error">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Workflow Type Picker */}
          <div>
            <label className="mb-2 block text-[12.5px] font-medium text-text-muted">
              Select Workflow / Request Type <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {WORKFLOW_OPTIONS.map((opt) => {
                const isSelected = workflowType === opt.type;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      setWorkflowType(opt.type);
                      setPriority(WORKFLOW_CONFIG[opt.type].defaultPriority);
                    }}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-accent/60 bg-accent/10 text-accent font-semibold shadow-xs"
                        : "border-border bg-bg text-text-muted hover:border-border/80 hover:text-text"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-[12.5px]">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Request Title *" htmlFor="reqTitle">
              <Input
                id="reqTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Generator Emergency Repair Payout"
                required
              />
            </Field>

            <Field label="Priority Level" htmlFor="reqPriority">
              <Select
                id="reqPriority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ApprovalPriority)}
              >
                <option value="CRITICAL">Critical (Immediate NOC / Emergency)</option>
                <option value="HIGH">High (Daily Operation / Fleet)</option>
                <option value="MEDIUM">Normal (Routine Payout / Shift Handover)</option>
                <option value="LOW">Low (Administrative / Post-facto)</option>
              </Select>
            </Field>
          </div>

          <Field label="Operational Description *" htmlFor="reqDesc">
            <Input
              id="reqDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details of what transaction or event occurred..."
              required
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Amount (NPR)" htmlFor="reqAmount">
              <Input
                id="reqAmount"
                type="number"
                step="any"
                value={amountNpr}
                onChange={(e) => setAmountNpr(e.target.value)}
                placeholder="e.g. 18500"
              />
            </Field>

            <Field label="Volume (Litres)" htmlFor="reqVolume">
              <Input
                id="reqVolume"
                type="number"
                step="any"
                value={volumeL}
                onChange={(e) => setVolumeL(e.target.value)}
                placeholder="e.g. 118"
              />
            </Field>

            <Field label="Supporting Doc / Invoice No." htmlFor="reqDoc">
              <Input
                id="reqDoc"
                value={supportingDocNo}
                onChange={(e) => setSupportingDocNo(e.target.value)}
                placeholder="e.g. NPE-INV-4412"
              />
            </Field>
          </div>

          <Field label="Affected Entity / Asset / Dispenser" htmlFor="reqEntity">
            <Input
              id="reqEntity"
              value={affectedEntityName}
              onChange={(e) => setAffectedEntityName(e.target.value)}
              placeholder="e.g. Diesel Tank #1, Vehicle Ba 1 Gha 2891, Dispenser Bay 2"
            />
          </Field>

          {/* Diff Impact comparison */}
          <div className="rounded-xl border border-border/80 bg-bg p-3.5 space-y-3">
            <span className="text-[12px] font-semibold text-text">Optional State Change / Diff</span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11.5px] text-text-muted block mb-1">Current State / Value:</label>
                <Input
                  value={currentVal}
                  onChange={(e) => setCurrentVal(e.target.value)}
                  placeholder="e.g. Rs 172.50 or Active"
                  className="text-[12.5px]"
                />
              </div>
              <div>
                <label className="text-[11.5px] text-text-muted block mb-1">Proposed State / Value:</label>
                <Input
                  value={proposedVal}
                  onChange={(e) => setProposedVal(e.target.value)}
                  placeholder="e.g. Rs 170.50 or Voided"
                  className="text-[12.5px]"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="reqJustification" className="mb-1.5 block text-[12.5px] font-medium text-text-muted">
              Justification & Audit Explanation <span className="text-error">*</span>
            </label>
            <textarea
              id="reqJustification"
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain why this request is required, who authorized work on ground, and how it was verified..."
              className="w-full rounded-lg border border-border bg-bg p-3 font-data text-[13px] text-text"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <GhostButton
              type="button"
              onClick={() => {
                setTitle("");
                setDescription("");
                setJustification("");
                setAmountNpr("");
                setVolumeL("");
              }}
            >
              Reset Form
            </GhostButton>
            <PrimaryButton type="submit" disabled={isSubmitting} className="py-2.5 px-5">
              <PlusCircle size={16} />
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </PrimaryButton>
          </div>
        </form>
      </Card>

      {/* Maker-Checker Policy Preview Card */}
      <div className="space-y-4">
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-accent">
            <ShieldCheck size={18} />
            <h4 className="font-display text-[15px] font-bold text-text">Maker-Checker Policy Preview</h4>
          </div>
          <p className="text-[12.5px] text-text-muted">
            Separation of duties governance for petrol station operations:
          </p>

          <div className="space-y-2.5 rounded-xl border border-border bg-bg p-3 text-[12.5px]">
            <div>
              <span className="text-[11px] text-text-muted">Initiating Presenter (You):</span>
              <div className="font-semibold text-text">{currentUser.name} ({ROLE_LABEL[currentUser.role]})</div>
            </div>

            <div className="border-t border-border/60 pt-2">
              <span className="text-[11px] text-text-muted">Authorizing Approver Tier:</span>
              <div className="font-semibold text-accent">
                {matchedRule ? matchedRule.approverRoles.map((r) => ROLE_LABEL[r]).join(" or ") : "Owner"}
              </div>
            </div>

            <div className="border-t border-border/60 pt-2">
              <span className="text-[11px] text-text-muted">Dual Sign-Off Requirement:</span>
              <div className="font-medium text-text">
                {matchedRule?.requireDualApproval
                  ? "Required for high-value transactions (> NPR 50,000)"
                  : "Single authorized checker sign-off"}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-surface-hi p-3 text-[12px] text-text-muted space-y-1">
            <strong className="text-text block">Rule Description:</strong>
            <span>{matchedRule?.description || WORKFLOW_CONFIG[workflowType].description}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
