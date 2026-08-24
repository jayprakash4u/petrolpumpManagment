import type { Role } from "@prisma/client";

export type ApprovalWorkflowType =
  | "EXPENSE_VOUCHER"
  | "CREDIT_LIMIT_OVERRIDE"
  | "SALE_VOID_REVERSAL"
  | "FUEL_RATE_REVISION"
  | "TANK_DIP_VARIANCE_ADJUSTMENT"
  | "SHIFT_CASH_DISCREPANCY"
  | "PURCHASE_INVOICE_RELEASE";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type ApprovalPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface UserSummary {
  id: string;
  name: string;
  role: Role;
  username: string;
}

export interface ApprovalDiffItem {
  field: string;
  label: string;
  currentValue: string | number;
  proposedValue: string | number;
  unit?: string;
}

export interface ApprovalRequest {
  id: string;
  requestCode: string; // e.g. "REQ-2083-05-01"
  workflowType: ApprovalWorkflowType;
  title: string;
  description: string;
  category: "FINANCIAL" | "CREDIT" | "SALES" | "STOCK" | "SHIFT_OPS" | "PROCUREMENT";
  priority: ApprovalPriority;
  status: ApprovalStatus;
  
  // Presenter / Maker
  requestedBy: UserSummary;
  requestedAtBS: string; // e.g. "2083-05-08 10:30 AM"
  requestedAtAD: string; // e.g. "2026-08-24 10:30"
  justification: string;
  
  // Quantitative details
  amountNpr?: number;
  volumeL?: number;
  affectedEntityId?: string;
  affectedEntityName?: string; // e.g. "Diesel Tank #1", "Vehicle Ba 1 Gha 2891", "Attendant Shift #42"
  supportingDocNo?: string; // Invoice number, receipt number, voucher slip
  
  // Diff breakdown for transparency
  diffs?: ApprovalDiffItem[];
  
  // Checker / Approver
  reviewedBy?: UserSummary;
  reviewedAtBS?: string;
  reviewedAtAD?: string;
  approverNotes?: string;
  rejectionReason?: string;
  
  // Governance details
  requiresDualApproval?: boolean;
  secondReviewedBy?: UserSummary;
  secondReviewedAtBS?: string;
  approvalRuleId?: string;
}

export interface ApprovalRule {
  id: string;
  workflowType: ApprovalWorkflowType;
  name: string;
  description: string;
  presenterRoles: Role[];
  approverRoles: Role[];
  minAmountForApprovalNpr: number; // e.g., expenses above this amount require checker approval
  requireDualApproval: boolean; // Needs 2 owners or manager + owner for high-value
  dualApprovalThresholdNpr: number;
  autoApproveUnderThreshold: boolean;
  active: boolean;
}

export interface ApprovalSummaryTotals {
  pendingCount: number;
  totalPendingAmountNpr: number;
  highPriorityCount: number;
  approvedTodayCount: number;
  rejectedCount: number;
}

export const WORKFLOW_CONFIG: Record<
  ApprovalWorkflowType,
  {
    label: string;
    category: ApprovalRequest["category"];
    defaultPriority: ApprovalPriority;
    iconName: string;
    description: string;
  }
> = {
  EXPENSE_VOUCHER: {
    label: "Petty Cash & Expense Voucher",
    category: "FINANCIAL",
    defaultPriority: "MEDIUM",
    iconName: "Wallet",
    description: "Station maintenance, generator diesel, supplies, utility bills & emergency cash payouts.",
  },
  CREDIT_LIMIT_OVERRIDE: {
    label: "Credit Limit Override",
    category: "CREDIT",
    defaultPriority: "HIGH",
    iconName: "CreditCard",
    description: "Temporary or permanent credit limit extension for corporate fleets & registered credit customers.",
  },
  SALE_VOID_REVERSAL: {
    label: "Sale Void / Bill Reversal",
    category: "SALES",
    defaultPriority: "HIGH",
    iconName: "FileX",
    description: "Attendant request to void a mistakenly entered receipt or erroneous meter transaction.",
  },
  FUEL_RATE_REVISION: {
    label: "Fuel Rate Revision Sign-off",
    category: "FINANCIAL",
    defaultPriority: "CRITICAL",
    iconName: "TrendingUp",
    description: "Official NOC/Govt retail price changes across Petrol, Diesel, or CNG tanks before dispenser sync.",
  },
  TANK_DIP_VARIANCE_ADJUSTMENT: {
    label: "Tank Dip Variance Adjustment",
    category: "STOCK",
    defaultPriority: "HIGH",
    iconName: "Layers",
    description: "Reconciling physical dip measurements vs meter ledger book (evaporation / decanting loss write-off).",
  },
  SHIFT_CASH_DISCREPANCY: {
    label: "Shift Handover Cash Settlement",
    category: "SHIFT_OPS",
    defaultPriority: "MEDIUM",
    iconName: "Users",
    description: "Resolving cash drawer shortage or excess variance during attendant/cashier shift close.",
  },
  PURCHASE_INVOICE_RELEASE: {
    label: "Supplier Bulk Invoice Release",
    category: "PROCUREMENT",
    defaultPriority: "HIGH",
    iconName: "Truck",
    description: "Releasing NOC tanker delivery invoice for financial ledger posting and payment clearance.",
  },
};

export const PRIORITY_CONFIG: Record<
  ApprovalPriority,
  { label: string; tone: "error" | "warning" | "accent" | "muted" }
> = {
  CRITICAL: { label: "Critical", tone: "error" },
  HIGH: { label: "High", tone: "warning" },
  MEDIUM: { label: "Normal", tone: "accent" },
  LOW: { label: "Low", tone: "muted" },
};

export const STATUS_CONFIG: Record<
  ApprovalStatus,
  { label: string; tone: "warning" | "success" | "error" | "muted" }
> = {
  PENDING: { label: "Pending Review", tone: "warning" },
  APPROVED: { label: "Approved & Released", tone: "success" },
  REJECTED: { label: "Rejected", tone: "error" },
  CANCELLED: { label: "Withdrawn", tone: "muted" },
};

/**
 * Calculates summary metrics across approval requests.
 */
export function calculateApprovalSummary(requests: ApprovalRequest[]): ApprovalSummaryTotals {
  let pendingCount = 0;
  let totalPendingAmountNpr = 0;
  let highPriorityCount = 0;
  let approvedTodayCount = 0;
  let rejectedCount = 0;

  for (const req of requests) {
    if (req.status === "PENDING") {
      pendingCount++;
      totalPendingAmountNpr += req.amountNpr || 0;
      if (req.priority === "CRITICAL" || req.priority === "HIGH") {
        highPriorityCount++;
      }
    } else if (req.status === "APPROVED") {
      approvedTodayCount++;
    } else if (req.status === "REJECTED") {
      rejectedCount++;
    }
  }

  return {
    pendingCount,
    totalPendingAmountNpr,
    highPriorityCount,
    approvedTodayCount,
    rejectedCount,
  };
}

/**
 * Filters approval requests by category, status, workflow type, and search keyword.
 */
export function filterApprovalRequests(
  requests: ApprovalRequest[],
  filters: {
    status?: ApprovalStatus | "ALL";
    workflowType?: ApprovalWorkflowType | "ALL";
    category?: ApprovalRequest["category"] | "ALL";
    search?: string;
  }
): ApprovalRequest[] {
  return requests.filter((req) => {
    if (filters.status && filters.status !== "ALL" && req.status !== filters.status) {
      return false;
    }
    if (filters.workflowType && filters.workflowType !== "ALL" && req.workflowType !== filters.workflowType) {
      return false;
    }
    if (filters.category && filters.category !== "ALL" && req.category !== filters.category) {
      return false;
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const matchCode = req.requestCode.toLowerCase().includes(q);
      const matchTitle = req.title.toLowerCase().includes(q);
      const matchDescription = req.description.toLowerCase().includes(q);
      const matchPresenter = req.requestedBy.name.toLowerCase().includes(q) || req.requestedBy.username.toLowerCase().includes(q);
      const matchEntity = req.affectedEntityName ? req.affectedEntityName.toLowerCase().includes(q) : false;
      const matchDoc = req.supportingDocNo ? req.supportingDocNo.toLowerCase().includes(q) : false;
      if (!matchCode && !matchTitle && !matchDescription && !matchPresenter && !matchEntity && !matchDoc) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Validates whether a user with a given role can approve a specific request based on rules.
 */
export function canUserApprove(
  userRole: Role,
  userId: string,
  request: ApprovalRequest,
  rule?: ApprovalRule
): { canApprove: boolean; reason?: string } {
  // Maker-Checker Separation of Duties: A user cannot approve their own submission!
  if (request.requestedBy.id === userId) {
    return {
      canApprove: false,
      reason: "Separation of Duties (Maker-Checker violation): You cannot approve your own submission.",
    };
  }

  if (request.status !== "PENDING") {
    return {
      canApprove: false,
      reason: `This request is already ${request.status.toLowerCase()}.`,
    };
  }

  // Owners can approve any pending request
  if (userRole === "OWNER") {
    return { canApprove: true };
  }

  // Managers can approve if permitted by the rule
  if (userRole === "MANAGER") {
    if (!rule) {
      // Default: Managers cannot approve price revisions or critical stock adjustments
      if (request.workflowType === "FUEL_RATE_REVISION") {
        return {
          canApprove: false,
          reason: "Fuel Rate Revisions strictly require Owner approval.",
        };
      }
      return { canApprove: true };
    }

    if (!rule.approverRoles.includes(userRole)) {
      return {
        canApprove: false,
        reason: `Policy requires an ${rule.approverRoles.join(" or ")} to release this item.`,
      };
    }

    if (rule.requireDualApproval && (request.amountNpr || 0) >= rule.dualApprovalThresholdNpr) {
      // High value dual approval requires Owner as final signer
      if (request.reviewedBy && request.reviewedBy.role === "MANAGER") {
        return {
          canApprove: false,
          reason: "First review completed by Manager. Second reviewer must be an Owner.",
        };
      }
    }

    return { canApprove: true };
  }

  return {
    canApprove: false,
    reason: "Your role (Cashier/Attendant) does not have authorization to release approval requests.",
  };
}
