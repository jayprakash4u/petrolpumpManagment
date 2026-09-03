import type {
  ApprovalRequest,
  ApprovalRule,
  ApprovalStatus,
  ApprovalWorkflowType,
  UserSummary,
} from "@/lib/approvals";

export const MOCK_APPROVAL_RULES: ApprovalRule[] = [
  {
    id: "rule-exp-01",
    workflowType: "EXPENSE_VOUCHER",
    name: "Petty Cash & Operational Expenses",
    description: "Vouchers under NPR 5,000 auto-approved; NPR 5,000-50,000 requires Manager; > NPR 50,000 requires Owner dual approval.",
    presenterRoles: ["OWNER"],
    approverRoles: ["OWNER"],
    minAmountForApprovalNpr: 5000,
    requireDualApproval: true,
    dualApprovalThresholdNpr: 50000,
    autoApproveUnderThreshold: true,
    active: true,
  },
  {
    id: "rule-crd-02",
    workflowType: "CREDIT_LIMIT_OVERRIDE",
    name: "Corporate Credit Limit Extension",
    description: "Temporary credit ceiling overrides require Manager sign-off; permanent extensions > NPR 100,000 require Owner.",
    presenterRoles: ["OWNER"],
    approverRoles: ["OWNER"],
    minAmountForApprovalNpr: 0,
    requireDualApproval: false,
    dualApprovalThresholdNpr: 100000,
    autoApproveUnderThreshold: false,
    active: true,
  },
  {
    id: "rule-void-03",
    workflowType: "SALE_VOID_REVERSAL",
    name: "Sale Cancellation & Bill Voiding",
    description: "All dispenser sale bill void requests submitted by attendants must be validated against physical nozzle meter readings.",
    presenterRoles: ["OWNER"],
    approverRoles: ["OWNER"],
    minAmountForApprovalNpr: 0,
    requireDualApproval: false,
    dualApprovalThresholdNpr: 20000,
    autoApproveUnderThreshold: false,
    active: true,
  },
  {
    id: "rule-rate-04",
    workflowType: "FUEL_RATE_REVISION",
    name: "NOC Fuel Price Revision Sign-Off",
    description: "Strictly Owner authorization required before updating tank rate records and synchronizing dispenser bay rates.",
    presenterRoles: ["OWNER"],
    approverRoles: ["OWNER"],
    minAmountForApprovalNpr: 0,
    requireDualApproval: false,
    dualApprovalThresholdNpr: 0,
    autoApproveUnderThreshold: false,
    active: true,
  },
  {
    id: "rule-dip-05",
    workflowType: "TANK_DIP_VARIANCE_ADJUSTMENT",
    name: "Underground Tank Dip Shortage Settlement",
    description: "Variance exceeding 0.5% of tank volume (> 100 Litres) requires managerial audit and owner write-off.",
    presenterRoles: ["OWNER"],
    approverRoles: ["OWNER"],
    minAmountForApprovalNpr: 15000,
    requireDualApproval: true,
    dualApprovalThresholdNpr: 50000,
    autoApproveUnderThreshold: false,
    active: true,
  },
  {
    id: "rule-shift-06",
    workflowType: "SHIFT_CASH_DISCREPANCY",
    name: "Shift Handover Cash Discrepancy",
    description: "Cash drawer shortage / excess over NPR 1,000 must be justified and authorized before closing shift.",
    presenterRoles: ["OWNER"],
    approverRoles: ["OWNER"],
    minAmountForApprovalNpr: 1000,
    requireDualApproval: false,
    dualApprovalThresholdNpr: 10000,
    autoApproveUnderThreshold: false,
    active: true,
  },
  {
    id: "rule-proc-07",
    workflowType: "PURCHASE_INVOICE_RELEASE",
    name: "NOC Tanker Purchase Release",
    description: "Bulk tanker deliveries from Nepal Oil Corporation (Amlekhgunj / Thankot depot) release for financial ledger posting.",
    presenterRoles: ["OWNER"],
    approverRoles: ["OWNER"],
    minAmountForApprovalNpr: 100000,
    requireDualApproval: true,
    dualApprovalThresholdNpr: 1000000,
    autoApproveUnderThreshold: false,
    active: true,
  },
];

export const MOCK_APPROVAL_REQUESTS: ApprovalRequest[] = [
  {
    id: "req-8801",
    requestCode: "REQ-2083-05-01",
    workflowType: "FUEL_RATE_REVISION",
    title: "NOC Midnight Fuel Price Revision (Bhadra 2083)",
    description: "Nepal Oil Corporation circular #NOC/MKT/83-09: Petrol decreased by Rs 2.00/L; Diesel increased by Rs 1.50/L.",
    category: "FINANCIAL",
    priority: "CRITICAL",
    status: "PENDING",
    requestedBy: {
      id: "usr-mgr-anita",
      name: "Anita Shrestha",
      role: "OWNER",
      username: "anita",
    },
    requestedAtBS: "2083-05-08 07:15 AM",
    requestedAtAD: "2026-08-24 07:15",
    justification: "Official NOC circular issued at 6:00 PM yesterday. Rates must be verified and pushed to Tank & Dispenser records.",
    supportingDocNo: "NOC-CIR-83/09-RETAIL",
    diffs: [
      { field: "petrolRate", label: "Petrol (MS) Rate", currentValue: 172.5, proposedValue: 170.5, unit: "Rs / L" },
      { field: "dieselRate", label: "Diesel (HSD) Rate", currentValue: 160.0, proposedValue: 161.5, unit: "Rs / L" },
    ],
    requiresDualApproval: false,
    approvalRuleId: "rule-rate-04",
  },
  {
    id: "req-8802",
    requestCode: "REQ-2083-05-02",
    workflowType: "EXPENSE_VOUCHER",
    title: "Station 30kVA Generator Overhaul & Filter Replacement",
    description: "Emergency servicing for Kirloskar 30kVA backup diesel generator due to low oil pressure alarm during load shedding.",
    category: "FINANCIAL",
    priority: "HIGH",
    status: "PENDING",
    requestedBy: {
      id: "usr-cashier-binod",
      name: "Binod Tamang",
      role: "OWNER",
      username: "binod",
    },
    requestedAtBS: "2083-05-08 09:30 AM",
    requestedAtAD: "2026-08-24 09:30",
    justification: "Technician from Nepal Power Equipments replaced mobile filter, fuel filter, and 15L lube oil. Bill attached.",
    amountNpr: 18500,
    supportingDocNo: "NPE-INV-4412",
    affectedEntityName: "Generator Set #1 (Station Main)",
    diffs: [
      { field: "expenseCategory", label: "Expense Head", currentValue: "Unallocated", proposedValue: "Equipment Repairs" },
      { field: "voucherAmount", label: "Voucher Claim", currentValue: 0, proposedValue: 18500, unit: "NPR" },
    ],
    requiresDualApproval: false,
    approvalRuleId: "rule-exp-01",
  },
  {
    id: "req-8803",
    requestCode: "REQ-2083-05-03",
    workflowType: "CREDIT_LIMIT_OVERRIDE",
    title: "Credit Limit Bump for Kathmandu Metropolitan City Fleet",
    description: "KMC Dept. of Environment waste compaction trucks require temporary credit extension during festival cleanup drive.",
    category: "CREDIT",
    priority: "HIGH",
    status: "PENDING",
    requestedBy: {
      id: "usr-mgr-anita",
      name: "Anita Shrestha",
      role: "OWNER",
      username: "anita",
    },
    requestedAtBS: "2083-05-08 08:45 AM",
    requestedAtAD: "2026-08-24 08:45",
    justification: "Current credit ceiling of Rs 500,000 is 94% utilized. KMC procurement section sent commitment letter for settlement on 15th.",
    amountNpr: 200000,
    affectedEntityId: "cust-ktm-muni",
    affectedEntityName: "Kathmandu Metropolitan City (Dept. of Environment)",
    supportingDocNo: "KMC-LTR-2083/5-91",
    diffs: [
      { field: "creditLimit", label: "Monthly Credit Limit", currentValue: 500000, proposedValue: 700000, unit: "NPR" },
      { field: "utilizationRate", label: "Current Balance Due", currentValue: 472000, proposedValue: 472000, unit: "NPR" },
    ],
    requiresDualApproval: false,
    approvalRuleId: "rule-crd-02",
  },
  {
    id: "req-8804",
    requestCode: "REQ-2083-05-04",
    workflowType: "SALE_VOID_REVERSAL",
    title: "Void Receipt #01049 (Duplicate Entry by Attendant)",
    description: "Attendant entered cash sale bill #01049 twice during morning rush queue on Dispenser Bay 2.",
    category: "SALES",
    priority: "MEDIUM",
    status: "PENDING",
    requestedBy: {
      id: "usr-att-ramesh",
      name: "Ramesh Thapa",
      role: "OWNER",
      username: "ramesh",
    },
    requestedAtBS: "2083-05-08 09:10 AM",
    requestedAtAD: "2026-08-24 09:10",
    justification: "Customer paid Rs 2,500 once for 15.48L Petrol. First receipt #01048 given to customer; duplicate #01049 printed by mistake.",
    amountNpr: 2500,
    volumeL: 15.48,
    supportingDocNo: "RCPT-01049",
    affectedEntityName: "Dispenser Bay 2 (Petrol MS-1)",
    diffs: [
      { field: "receiptStatus", label: "Bill Status", currentValue: "Active", proposedValue: "Voided" },
      { field: "drawerImpact", label: "Cash Drawer Adjustment", currentValue: 0, proposedValue: -2500, unit: "NPR" },
    ],
    requiresDualApproval: false,
    approvalRuleId: "rule-void-03",
  },
  {
    id: "req-8805",
    requestCode: "REQ-2083-05-05",
    workflowType: "TANK_DIP_VARIANCE_ADJUSTMENT",
    title: "Diesel Tank #1 Dip Discrepancy (Decanting Loss)",
    description: "Shortage of 118 Litres observed on Diesel Tank #1 morning dip reading following 12kL tanker delivery.",
    category: "STOCK",
    priority: "HIGH",
    status: "PENDING",
    requestedBy: {
      id: "usr-mgr-anita",
      name: "Anita Shrestha",
      role: "OWNER",
      username: "anita",
    },
    requestedAtBS: "2083-05-08 07:40 AM",
    requestedAtAD: "2026-08-24 07:40",
    justification: "Tanker driver reported 0.98% temperature volume contraction during mountain transit from Amlekhgunj depot. Within acceptable NOC allowance.",
    amountNpr: 18880,
    volumeL: 118,
    affectedEntityName: "Underground Tank #1 (Diesel HSD - 20,000L)",
    supportingDocNo: "DIP-LOG-2083-05-08-AM",
    diffs: [
      { field: "bookStock", label: "Calculated Ledger Stock", currentValue: 16420, proposedValue: 16302, unit: "Litres" },
      { field: "dipStock", label: "Physical Gauge Dip Stock", currentValue: 16302, proposedValue: 16302, unit: "Litres" },
      { field: "lossVariance", label: "Write-off Variance", currentValue: 0, proposedValue: -118, unit: "Litres" },
    ],
    requiresDualApproval: true,
    approvalRuleId: "rule-dip-05",
  },
  {
    id: "req-8806",
    requestCode: "REQ-2083-05-06",
    workflowType: "SHIFT_CASH_DISCREPANCY",
    title: "Night Shift Cash Shortage Clearance (Attendant Sita)",
    description: "Cash drawer shortfall of Rs 1,200 during 10:00 PM - 06:00 AM shift reconciliation.",
    category: "SHIFT_OPS",
    priority: "MEDIUM",
    status: "PENDING",
    requestedBy: {
      id: "usr-att-sita",
      name: "Sita Gurung",
      role: "OWNER",
      username: "sita",
    },
    requestedAtBS: "2083-05-08 06:15 AM",
    requestedAtAD: "2026-08-24 06:15",
    justification: "Customer drove away during QR payment gateway timeout. Follow-up phone call confirmed they will transfer via Fonepay by noon.",
    amountNpr: 1200,
    affectedEntityName: "Night Shift #188 (Bay 1 & Bay 2)",
    supportingDocNo: "SHIFT-CLOSURE-188",
    diffs: [
      { field: "meterExpectedCash", label: "Total Shift Revenue", currentValue: 84200, proposedValue: 84200, unit: "NPR" },
      { field: "cashCollected", label: "Physical Drawer Cash", currentValue: 83000, proposedValue: 83000, unit: "NPR" },
      { field: "discrepancy", label: "Shortage Outstanding", currentValue: 0, proposedValue: -1200, unit: "NPR" },
    ],
    requiresDualApproval: false,
    approvalRuleId: "rule-shift-06",
  },
  // Historical Approved & Rejected records
  {
    id: "req-8798",
    requestCode: "REQ-2083-05-00A",
    workflowType: "PURCHASE_INVOICE_RELEASE",
    title: "Release NOC 20,000L Bulk Tanker Invoice #NOC-AK-98112",
    description: "Procurement of 12,000L Diesel and 8,000L Petrol from Nepal Oil Corporation Amlekhgunj Depot.",
    category: "PROCUREMENT",
    priority: "CRITICAL",
    status: "APPROVED",
    requestedBy: {
      id: "usr-mgr-anita",
      name: "Anita Shrestha",
      role: "OWNER",
      username: "anita",
    },
    requestedAtBS: "2083-05-07 02:00 PM",
    requestedAtAD: "2026-08-23 14:00",
    justification: "Decanting completed without discrepancy. Quality density test and hydrometer check within NOC standard.",
    amountNpr: 3300000,
    volumeL: 20000,
    supportingDocNo: "NOC-AK-98112",
    affectedEntityName: "NOC Bowser Na 7 Kha 4109",
    reviewedBy: {
      id: "usr-owner-prakash",
      name: "Prakash Yadav",
      role: "OWNER",
      username: "prakash",
    },
    reviewedAtBS: "2083-05-07 04:30 PM",
    reviewedAtAD: "2026-08-23 16:30",
    approverNotes: "Verified depot chamber seal and hydrometer test slip. Approved for bank RTGS clearance.",
    requiresDualApproval: true,
    approvalRuleId: "rule-proc-07",
  },
  {
    id: "req-8795",
    requestCode: "REQ-2083-04-28B",
    workflowType: "EXPENSE_VOUCHER",
    title: "Station Office High-Speed Internet & CCTV Subscription",
    description: "Annual WorldLink 300Mbps fiber internet renewal with static IP for remote CCTV pump monitoring.",
    category: "FINANCIAL",
    priority: "MEDIUM",
    status: "APPROVED",
    requestedBy: {
      id: "usr-cashier-binod",
      name: "Binod Tamang",
      role: "OWNER",
      username: "binod",
    },
    requestedAtBS: "2083-04-28 11:15 AM",
    requestedAtAD: "2026-08-14 11:15",
    justification: "Annual renewal invoice from WorldLink Communications with VAT bill.",
    amountNpr: 21500,
    supportingDocNo: "WL-VAT-90214",
    reviewedBy: {
      id: "usr-mgr-anita",
      name: "Anita Shrestha",
      role: "OWNER",
      username: "anita",
    },
    reviewedAtBS: "2083-04-28 01:20 PM",
    reviewedAtAD: "2026-08-14 13:20",
    approverNotes: "Essential station utility for online billing & real-time surveillance.",
    requiresDualApproval: false,
    approvalRuleId: "rule-exp-01",
  },
  {
    id: "req-8790",
    requestCode: "REQ-2083-04-20C",
    workflowType: "CREDIT_LIMIT_OVERRIDE",
    title: "Unregistered Private Vehicle Ba 2 Ja 9988 Credit Request",
    description: "Attendant requested to extend Rs 15,000 credit to local taxi driver without credit agreement.",
    category: "CREDIT",
    priority: "LOW",
    status: "REJECTED",
    requestedBy: {
      id: "usr-att-ramesh",
      name: "Ramesh Thapa",
      role: "OWNER",
      username: "ramesh",
    },
    requestedAtBS: "2083-04-20 03:45 PM",
    requestedAtAD: "2026-08-06 13:45",
    justification: "Known regular customer requesting 5 days credit for taxi maintenance.",
    amountNpr: 15000,
    affectedEntityName: "Vehicle Ba 2 Ja 9988",
    reviewedBy: {
      id: "usr-owner-prakash",
      name: "Prakash Yadav",
      role: "OWNER",
      username: "prakash",
    },
    reviewedAtBS: "2083-04-20 04:10 PM",
    reviewedAtAD: "2026-08-06 14:10",
    rejectionReason: "Policy violation: Credit is strictly restricted to approved corporate accounts with security deposits.",
    requiresDualApproval: false,
    approvalRuleId: "rule-crd-02",
  },
];

// In-Memory mutable store for interactive browser sessions
let requestsStore: ApprovalRequest[] = [...MOCK_APPROVAL_REQUESTS];
let rulesStore: ApprovalRule[] = [...MOCK_APPROVAL_RULES];

export function getApprovalRequests(): ApprovalRequest[] {
  return [...requestsStore];
}

export function getApprovalRules(): ApprovalRule[] {
  return [...rulesStore];
}

export function approveRequest(
  requestId: string,
  actor: UserSummary,
  notes?: string
): { success: boolean; message: string; request?: ApprovalRequest } {
  const index = requestsStore.findIndex((r) => r.id === requestId);
  if (index === -1) {
    return { success: false, message: "Approval request not found." };
  }

  const req = requestsStore[index];
  if (req.status !== "PENDING") {
    return { success: false, message: `Request is already ${req.status.toLowerCase()}.` };
  }

  if (req.requestedBy.id === actor.id) {
    return {
      success: false,
      message: "Maker-Checker violation: You cannot approve your own submission.",
    };
  }

  const updated: ApprovalRequest = {
    ...req,
    status: "APPROVED",
    reviewedBy: actor,
    reviewedAtBS: "2083-05-08 02:45 PM",
    reviewedAtAD: new Date().toISOString().replace("T", " ").slice(0, 16),
    approverNotes: notes || "Approved & released into station operations.",
  };

  requestsStore[index] = updated;
  return {
    success: true,
    message: `${req.requestCode} (${req.title}) approved and released.`,
    request: updated,
  };
}

export function rejectRequest(
  requestId: string,
  actor: UserSummary,
  reason: string
): { success: boolean; message: string; request?: ApprovalRequest } {
  if (!reason.trim()) {
    return { success: false, message: "Please provide a reason for rejecting this request." };
  }

  const index = requestsStore.findIndex((r) => r.id === requestId);
  if (index === -1) {
    return { success: false, message: "Approval request not found." };
  }

  const req = requestsStore[index];
  if (req.status !== "PENDING") {
    return { success: false, message: `Request is already ${req.status.toLowerCase()}.` };
  }

  const updated: ApprovalRequest = {
    ...req,
    status: "REJECTED",
    reviewedBy: actor,
    reviewedAtBS: "2083-05-08 02:45 PM",
    reviewedAtAD: new Date().toISOString().replace("T", " ").slice(0, 16),
    rejectionReason: reason.trim(),
  };

  requestsStore[index] = updated;
  return {
    success: true,
    message: `${req.requestCode} has been rejected.`,
    request: updated,
  };
}

export function batchApproveRequests(
  requestIds: string[],
  actor: UserSummary,
  notes?: string
): { successCount: number; failedCount: number; messages: string[] } {
  let successCount = 0;
  let failedCount = 0;
  const messages: string[] = [];

  for (const id of requestIds) {
    const res = approveRequest(id, actor, notes);
    if (res.success) {
      successCount++;
    } else {
      failedCount++;
      messages.push(`${id}: ${res.message}`);
    }
  }

  return { successCount, failedCount, messages };
}

export function createApprovalRequest(
  data: Omit<ApprovalRequest, "id" | "requestCode" | "status" | "requestedAtBS" | "requestedAtAD">
): ApprovalRequest {
  const newId = `req-${Date.now()}`;
  const codeNum = requestsStore.length + 1;
  const requestCode = `REQ-2083-05-${codeNum < 10 ? "0" + codeNum : codeNum}`;

  const newRequest: ApprovalRequest = {
    ...data,
    id: newId,
    requestCode,
    status: "PENDING",
    requestedAtBS: "2083-05-08 03:00 PM",
    requestedAtAD: new Date().toISOString().replace("T", " ").slice(0, 16),
  };

  requestsStore.unshift(newRequest);
  return newRequest;
}

export function updateApprovalRule(
  ruleId: string,
  updates: Partial<ApprovalRule>
): { success: boolean; message: string; rule?: ApprovalRule } {
  const index = rulesStore.findIndex((r) => r.id === ruleId);
  if (index === -1) {
    return { success: false, message: "Rule not found." };
  }

  const updated: ApprovalRule = {
    ...rulesStore[index],
    ...updates,
  };

  rulesStore[index] = updated;
  return { success: true, message: `Rule "${updated.name}" updated successfully.`, rule: updated };
}

export function resetMockApprovals(): void {
  requestsStore = [...MOCK_APPROVAL_REQUESTS];
  rulesStore = [...MOCK_APPROVAL_RULES];
}
