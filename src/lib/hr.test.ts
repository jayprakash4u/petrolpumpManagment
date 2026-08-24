import { describe, it, expect, beforeEach } from "vitest";
import { calculateNetSalary, calculateHrSummary } from "./hr";
import {
  getAttendanceRecords,
  getLeaveRequests,
  getSalaryStructures,
  getMonthlyPayroll,
  markAttendance,
  submitLeaveRequest,
  updateLeaveStatus,
  disburseSalary,
  updateSalaryStructure,
  resetMockHr,
} from "./mock/hr";

describe("HR & Payroll Unit Tests", () => {
  beforeEach(() => {
    resetMockHr();
  });

  describe("calculateNetSalary", () => {
    it("computes net salary correctly with overtime, allowances, advance and PF deductions", () => {
      const res = calculateNetSalary({
        basePay: 30000,
        overtimeHours: 10,
        overtimeRate: 200,
        allowances: 2500,
        advanceDeduction: 1500,
        pfPct: 10,
        taxDeduction: 0,
      });

      expect(res.overtimePay).toBe(2000);
      expect(res.grossPay).toBe(34500); // 30000 + 2000 + 2500
      expect(res.pfDeduction).toBe(3000); // 10% of 30000
      expect(res.totalDeductions).toBe(4500); // 1500 + 3000
      expect(res.netPayable).toBe(30000); // 34500 - 4500
    });

    it("handles zero overtime and deductions gracefully", () => {
      const res = calculateNetSalary({
        basePay: 22000,
        overtimeHours: 0,
        overtimeRate: 150,
      });

      expect(res.overtimePay).toBe(0);
      expect(res.grossPay).toBe(22000);
      expect(res.pfDeduction).toBe(0);
      expect(res.netPayable).toBe(22000);
    });
  });

  describe("calculateHrSummary", () => {
    it("summarizes attendance and payroll metrics across the station", () => {
      const attendance = getAttendanceRecords();
      const payroll = getMonthlyPayroll();
      const summary = calculateHrSummary(attendance, payroll, 6);

      expect(summary.totalStaffCount).toBe(6);
      expect(summary.presentTodayCount).toBeGreaterThan(0);
      expect(summary.monthlyWageBillNpr).toBeGreaterThan(0);
      expect(summary.totalPaidThisMonthNpr).toBeGreaterThan(0);
      expect(summary.totalPendingThisMonthNpr).toBeGreaterThan(0);
    });
  });

  describe("Mock HR State Mutations", () => {
    it("marks employee attendance for today", () => {
      const record = markAttendance({
        dateBS: "2083-05-08",
        employeeId: "usr-att-kiran",
        employeeName: "Kiran Adhikari",
        role: "ATTENDANT",
        shiftType: "DAY",
        checkIn: "08:00 AM",
        checkOut: "04:00 PM",
        hoursWorked: 8,
        overtimeHours: 0,
        status: "PRESENT",
      });

      expect(record.id).toBeDefined();
      expect(record.status).toBe("PRESENT");

      const all = getAttendanceRecords();
      const kiran = all.find((a) => a.employeeId === "usr-att-kiran");
      expect(kiran?.status).toBe("PRESENT");
    });

    it("submits a leave request and approves it", () => {
      const leave = submitLeaveRequest({
        employeeId: "usr-att-sita",
        employeeName: "Sita Gurung",
        role: "ATTENDANT",
        leaveType: "CASUAL",
        startDateBS: "2083-05-15",
        endDateBS: "2083-05-16",
        totalDays: 2,
        reason: "Personal family work",
      });

      expect(leave.status).toBe("PENDING");

      const approveRes = updateLeaveStatus(leave.id, "APPROVED", "Anita Shrestha (Manager)");
      expect(approveRes.success).toBe(true);
      expect(approveRes.leave?.status).toBe("APPROVED");
      expect(approveRes.leave?.approvedBy).toContain("Anita Shrestha");
    });

    it("disburses a pending salary", () => {
      const res = disburseSalary("pay-8305-01", "BANK_TRANSFER", "NABIL-TX-99011");
      expect(res.success).toBe(true);
      expect(res.item?.status).toBe("PAID");
      expect(res.item?.paymentMode).toBe("BANK_TRANSFER");
      expect(res.item?.transactionRef).toBe("NABIL-TX-99011");
    });

    it("updates an employee's salary structure", () => {
      const res = updateSalaryStructure("sal-04", {
        baseSalaryNpr: 24000,
        dailyAllowanceNpr: 250,
      });

      expect(res.success).toBe(true);
      expect(res.structure?.baseSalaryNpr).toBe(24000);
      expect(res.structure?.dailyAllowanceNpr).toBe(250);
    });
  });
});
