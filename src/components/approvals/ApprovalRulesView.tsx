"use client";

import { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Edit2,
  CheckCircle2,
  Lock,
  Layers,
  CreditCard,
  Wallet,
  FileX,
  TrendingUp,
  Users,
  Truck,
  RotateCcw,
} from "lucide-react";
import type { Role } from "@/lib/permissions";
import { type ApprovalRule, type ApprovalWorkflowType, WORKFLOW_CONFIG } from "@/lib/approvals";
import { getApprovalRules, updateApprovalRule, resetMockApprovals } from "@/lib/mock/approvals";
import { fmtRs } from "@/lib/money";
import { ROLE_LABEL } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

const WORKFLOW_ICONS: Record<ApprovalWorkflowType, React.ComponentType<{ size?: number; className?: string }>> = {
  EXPENSE_VOUCHER: Wallet,
  CREDIT_LIMIT_OVERRIDE: CreditCard,
  SALE_VOID_REVERSAL: FileX,
  FUEL_RATE_REVISION: TrendingUp,
  TANK_DIP_VARIANCE_ADJUSTMENT: Layers,
  SHIFT_CASH_DISCREPANCY: Users,
  PURCHASE_INVOICE_RELEASE: Truck,
};

// There is one role — see @/lib/permissions — so this policy's
// "approverRoles" no longer distinguishes anything; canUserApprove()
// grants approval authority to any login except the request's own maker.
const ALL_ROLES: Role[] = ["OWNER"];

export function ApprovalRulesView({
  currentUser,
}: {
  currentUser: { id: string; name: string; role: Role | string; username: string };
}) {
  const [rules, setRules] = useState<ApprovalRule[]>(() => getApprovalRules());
  const [editingRule, setEditingRule] = useState<ApprovalRule | null>(null);
  const [minThreshold, setMinThreshold] = useState("");
  const [dualThreshold, setDualThreshold] = useState("");
  const [requireDual, setRequireDual] = useState(false);
  const [approverRoles, setApproverRoles] = useState<(Role | string)[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Every station login has full access — see @/lib/permissions.
  const canEdit = true;

  const handleOpenEdit = (rule: ApprovalRule) => {
    setEditingRule(rule);
    setMinThreshold(String(rule.minAmountForApprovalNpr));
    setDualThreshold(String(rule.dualApprovalThresholdNpr));
    setRequireDual(rule.requireDualApproval);
    setApproverRoles([...rule.approverRoles]);
  };

  const handleSaveRule = () => {
    if (!editingRule) return;

    const res = updateApprovalRule(editingRule.id, {
      minAmountForApprovalNpr: parseFloat(minThreshold) || 0,
      dualApprovalThresholdNpr: parseFloat(dualThreshold) || 0,
      requireDualApproval: requireDual,
      approverRoles,
    });

    if (res.success) {
      setNotification(res.message);
      setRules(getApprovalRules());
      setEditingRule(null);
    }
  };

  const handleResetDefaults = () => {
    resetMockApprovals();
    setRules(getApprovalRules());
    setNotification("Reset all maker-checker policy rules to station default configuration.");
  };

  const toggleApproverRole = (r: Role) => {
    setApproverRoles((prev) => (prev.includes(r) ? prev.filter((role) => role !== r) : [...prev, r]));
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className="animate-fade-in flex items-center justify-between rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="cursor-pointer text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="font-display text-[17px] font-bold text-text">Maker-Checker Authority Matrix</h3>
            <p className="mt-0.5 text-[13px] text-text-muted">
              Define operational governance: who can initiate (Maker) and who must authorize (Checker) station transactions.
            </p>
          </div>
        </div>

        {canEdit ? (
          <GhostButton onClick={handleResetDefaults} className="text-[12.5px]">
            <RotateCcw size={14} /> Reset Standard Defaults
          </GhostButton>
        ) : (
          <Badge tone="muted" className="py-1">
            <Lock size={12} className="mr-1 inline" /> Read-Only (Owner Controlled)
          </Badge>
        )}
      </div>

      {/* Rule Cards Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rules.map((rule) => {
          const Icon = WORKFLOW_ICONS[rule.workflowType];
          const workflowConf = WORKFLOW_CONFIG[rule.workflowType];

          return (
            <Card key={rule.id} className="flex flex-col justify-between p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className="font-display text-[15px] font-semibold text-text">{rule.name}</h4>
                      <span className="font-data text-[11px] text-text-muted">{workflowConf.category} GOVERNANCE</span>
                    </div>
                  </div>

                  <Badge tone={rule.active ? "success" : "muted"}>{rule.active ? "ACTIVE" : "DISABLED"}</Badge>
                </div>

                <p className="text-[12.5px] text-text-muted">{rule.description}</p>

                {/* Role Matrix Box */}
                <div className="rounded-xl border border-border bg-bg p-3 space-y-2 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Initiating Presenters (Makers):</span>
                    <div className="flex flex-wrap gap-1">
                      {rule.presenterRoles.map((r) => (
                        <span key={r} className="rounded bg-surface-hi px-1.5 py-0.5 font-data text-[10.5px] text-text">
                          {ROLE_LABEL[r]}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-2">
                    <span className="text-text-muted">Authorizing Checkers (Approvers):</span>
                    <div className="flex flex-wrap gap-1">
                      {rule.approverRoles.map((r) => (
                        <span
                          key={r}
                          className="rounded bg-accent/15 px-1.5 py-0.5 font-data text-[10.5px] font-semibold text-accent"
                        >
                          {ROLE_LABEL[r]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Thresholds and Dual Approval info */}
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div className="rounded-lg border border-border/60 bg-surface-hi/50 p-2.5">
                    <span className="text-text-muted block text-[11px]">Approval Floor</span>
                    <span className="font-data font-bold text-text">
                      {rule.minAmountForApprovalNpr > 0 ? fmtRs(rule.minAmountForApprovalNpr) : "All Amounts"}
                    </span>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-surface-hi/50 p-2.5">
                    <span className="text-text-muted block text-[11px]">Dual Sign-off Threshold</span>
                    <span className="font-data font-bold text-accent">
                      {rule.requireDualApproval ? fmtRs(rule.dualApprovalThresholdNpr) : "Single Sign-off"}
                    </span>
                  </div>
                </div>
              </div>

              {canEdit && (
                <div className="border-t border-border pt-3 flex justify-end">
                  <GhostButton onClick={() => handleOpenEdit(rule)} className="py-1.5 px-3 text-[12px]">
                    <Edit2 size={13} /> Edit Thresholds & Roles
                  </GhostButton>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Edit Rule Modal Dialog */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-fade-in w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-accent">
                <ShieldCheck size={18} />
                <h3 className="font-display text-[16px] font-bold text-text">Configure {editingRule.name}</h3>
              </div>
              <button
                onClick={() => setEditingRule(null)}
                className="cursor-pointer text-text-muted hover:text-text"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-[13px]">
              <div>
                <label className="text-[12.5px] font-medium text-text-muted block mb-1">
                  Minimum Amount for Maker-Checker Approval (NPR):
                </label>
                <Input
                  type="number"
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(e.target.value)}
                  placeholder="0 (Applies to all amounts)"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-bg p-3">
                <div>
                  <div className="font-semibold text-text">Require Dual Sign-Off (Two Checkers)</div>
                  <div className="text-[11.5px] text-text-muted">
                    High value items require first review by Manager and second by Owner
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={requireDual}
                  onChange={(e) => setRequireDual(e.target.checked)}
                  className="h-4 w-4 rounded accent-accent cursor-pointer"
                />
              </div>

              {requireDual && (
                <div>
                  <label className="text-[12.5px] font-medium text-text-muted block mb-1">
                    Dual Approval Trigger Threshold (NPR):
                  </label>
                  <Input
                    type="number"
                    value={dualThreshold}
                    onChange={(e) => setDualThreshold(e.target.value)}
                    placeholder="e.g. 50000"
                  />
                </div>
              )}

              <div>
                <label className="text-[12.5px] font-medium text-text-muted block mb-2">
                  Authorized Checker Roles:
                </label>
                <p className="mb-2 text-[11.5px] text-text-muted">
                  There's one role, so this doesn't restrict who can approve — any login can, except the person who
                  made the request.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((r) => {
                    const isChecked = approverRoles.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleApproverRole(r)}
                        className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                          isChecked
                            ? "border-accent/50 bg-accent/15 text-accent font-semibold"
                            : "border-border bg-bg text-text-muted"
                        }`}
                      >
                        {ROLE_LABEL[r]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
              <GhostButton onClick={() => setEditingRule(null)}>Cancel</GhostButton>
              <PrimaryButton onClick={handleSaveRule} className="py-2 text-[13px]">
                Save Policy Rule
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
