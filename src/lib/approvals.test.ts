import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateApprovalSummary,
  filterApprovalRequests,
  canUserApprove,
  type ApprovalRequest,
  type ApprovalRule,
} from "./approvals";
import {
  getApprovalRequests,
  getApprovalRules,
  approveRequest,
  rejectRequest,
  batchApproveRequests,
  createApprovalRequest,
  updateApprovalRule,
  resetMockApprovals,
} from "./mock/approvals";

describe("Approvals Module Unit Tests", () => {
  beforeEach(() => {
    resetMockApprovals();
  });

  const mockUserPresenter = {
    id: "usr-mgr-anita",
    name: "Anita Shrestha",
    role: "MANAGER" as const,
    username: "anita",
  };

  const mockUserOwner = {
    id: "usr-owner-prakash",
    name: "Prakash Yadav",
    role: "OWNER" as const,
    username: "prakash",
  };

  const mockUserAttendant = {
    id: "usr-att-ramesh",
    name: "Ramesh Thapa",
    role: "ATTENDANT" as const,
    username: "ramesh",
  };

  describe("calculateApprovalSummary", () => {
    it("aggregates pending, high priority, approved and rejected counts", () => {
      const requests = getApprovalRequests();
      const summary = calculateApprovalSummary(requests);

      expect(summary.pendingCount).toBeGreaterThan(0);
      expect(summary.totalPendingAmountNpr).toBeGreaterThan(0);
      expect(summary.highPriorityCount).toBeGreaterThan(0);
      expect(summary.approvedTodayCount).toBeGreaterThan(0);
      expect(summary.rejectedCount).toBeGreaterThan(0);
    });

    it("returns zero metrics for empty request list", () => {
      const summary = calculateApprovalSummary([]);
      expect(summary.pendingCount).toBe(0);
      expect(summary.totalPendingAmountNpr).toBe(0);
      expect(summary.highPriorityCount).toBe(0);
      expect(summary.approvedTodayCount).toBe(0);
      expect(summary.rejectedCount).toBe(0);
    });
  });

  describe("filterApprovalRequests", () => {
    it("filters by status", () => {
      const requests = getApprovalRequests();
      const pendingOnly = filterApprovalRequests(requests, { status: "PENDING" });
      expect(pendingOnly.every((r) => r.status === "PENDING")).toBe(true);

      const approvedOnly = filterApprovalRequests(requests, { status: "APPROVED" });
      expect(approvedOnly.every((r) => r.status === "APPROVED")).toBe(true);
    });

    it("filters by workflow type and category", () => {
      const requests = getApprovalRequests();
      const expenseRequests = filterApprovalRequests(requests, { workflowType: "EXPENSE_VOUCHER" });
      expect(expenseRequests.every((r) => r.workflowType === "EXPENSE_VOUCHER")).toBe(true);

      const stockRequests = filterApprovalRequests(requests, { category: "STOCK" });
      expect(stockRequests.every((r) => r.category === "STOCK")).toBe(true);
    });

    it("searches by code, title, or requester name", () => {
      const requests = getApprovalRequests();
      const searchResult = filterApprovalRequests(requests, { search: "generator" });
      expect(searchResult.length).toBeGreaterThan(0);
      expect(searchResult.some((r) => r.title.toLowerCase().includes("generator"))).toBe(true);
    });
  });

  describe("canUserApprove (Maker-Checker Governance)", () => {
    it("prevents maker from approving their own request (Separation of Duties)", () => {
      const request: ApprovalRequest = {
        id: "req-test-1",
        requestCode: "REQ-TEST-1",
        workflowType: "EXPENSE_VOUCHER",
        title: "Test Voucher",
        description: "Test",
        category: "FINANCIAL",
        priority: "MEDIUM",
        status: "PENDING",
        requestedBy: mockUserPresenter,
        requestedAtBS: "2083-05-08",
        requestedAtAD: "2026-08-24",
        justification: "Test",
      };

      const result = canUserApprove("MANAGER", mockUserPresenter.id, request);
      expect(result.canApprove).toBe(false);
      expect(result.reason).toContain("Separation of Duties");
    });

    it("allows Owner to approve any pending request made by another user", () => {
      const request: ApprovalRequest = {
        id: "req-test-2",
        requestCode: "REQ-TEST-2",
        workflowType: "EXPENSE_VOUCHER",
        title: "Test Voucher",
        description: "Test",
        category: "FINANCIAL",
        priority: "MEDIUM",
        status: "PENDING",
        requestedBy: mockUserPresenter,
        requestedAtBS: "2083-05-08",
        requestedAtAD: "2026-08-24",
        justification: "Test",
      };

      const result = canUserApprove("OWNER", mockUserOwner.id, request);
      expect(result.canApprove).toBe(true);
    });

    it("allows any role to approve a pending request that isn't their own — no role-based restriction", () => {
      const request: ApprovalRequest = {
        id: "req-test-3",
        requestCode: "REQ-TEST-3",
        workflowType: "EXPENSE_VOUCHER",
        title: "Test Voucher",
        description: "Test",
        category: "FINANCIAL",
        priority: "MEDIUM",
        status: "PENDING",
        requestedBy: mockUserPresenter,
        requestedAtBS: "2083-05-08",
        requestedAtAD: "2026-08-24",
        justification: "Test",
      };

      const result = canUserApprove("ATTENDANT", mockUserAttendant.id, request);
      expect(result.canApprove).toBe(true);
    });

    it("blocks approval if request is already approved or rejected", () => {
      const request: ApprovalRequest = {
        id: "req-test-4",
        requestCode: "REQ-TEST-4",
        workflowType: "EXPENSE_VOUCHER",
        title: "Test Voucher",
        description: "Test",
        category: "FINANCIAL",
        priority: "MEDIUM",
        status: "APPROVED",
        requestedBy: mockUserPresenter,
        requestedAtBS: "2083-05-08",
        requestedAtAD: "2026-08-24",
        justification: "Test",
      };

      const result = canUserApprove("OWNER", mockUserOwner.id, request);
      expect(result.canApprove).toBe(false);
      expect(result.reason).toContain("already approved");
    });
  });

  describe("Mock Store Mutations", () => {
    it("approves a pending request and updates reviewedBy and timestamp", () => {
      const res = approveRequest("req-8802", mockUserOwner, "Verified and signed.");
      expect(res.success).toBe(true);
      expect(res.request?.status).toBe("APPROVED");
      expect(res.request?.reviewedBy?.id).toBe(mockUserOwner.id);
    });

    it("rejects a pending request with mandatory reason", () => {
      const res = rejectRequest("req-8804", mockUserOwner, "Mismatch on physical nozzle totalizer.");
      expect(res.success).toBe(true);
      expect(res.request?.status).toBe("REJECTED");
      expect(res.request?.rejectionReason).toBe("Mismatch on physical nozzle totalizer.");
    });

    it("fails rejection without a reason", () => {
      const res = rejectRequest("req-8804", mockUserOwner, "   ");
      expect(res.success).toBe(false);
      expect(res.message).toContain("provide a reason");
    });

    it("creates a new pending approval request", () => {
      const created = createApprovalRequest({
        workflowType: "EXPENSE_VOUCHER",
        title: "Station Office Tea & Supplies",
        description: "Monthly staff canteen tea, sugar, milk expense",
        category: "FINANCIAL",
        priority: "LOW",
        requestedBy: mockUserPresenter,
        justification: "Monthly staff refreshments",
        amountNpr: 3500,
      });

      expect(created.id).toBeDefined();
      expect(created.requestCode).toContain("REQ-2083-05-");
      expect(created.status).toBe("PENDING");

      const all = getApprovalRequests();
      expect(all.some((r) => r.id === created.id)).toBe(true);
    });

    it("updates maker-checker authority rules", () => {
      const res = updateApprovalRule("rule-exp-01", {
        minAmountForApprovalNpr: 8000,
        dualApprovalThresholdNpr: 75000,
      });

      expect(res.success).toBe(true);
      expect(res.rule?.minAmountForApprovalNpr).toBe(8000);
      expect(res.rule?.dualApprovalThresholdNpr).toBe(75000);
    });

    it("batch approves multiple valid requests", () => {
      const res = batchApproveRequests(["req-8802", "req-8803"], mockUserOwner, "Batch morning sign-off");
      expect(res.successCount).toBe(2);
      expect(res.failedCount).toBe(0);
    });
  });
});
