import type { Role } from "@prisma/client";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "ON_LEAVE" | "HALF_DAY";
export type ShiftType = "MORNING" | "DAY" | "NIGHT" | "FULL_DAY";
export type LeaveType = "CASUAL" | "SICK" | "FESTIVAL" | "UNPAID";
export type LeaveStatus = "APPROVED" | "PENDING" | "REJECTED";
export type PayrollStatus = "PAID" | "PENDING";
export type PaymentMode = "BANK_TRANSFER" | "CASH" | "FONEPAY_QR" | "CHEQUE";

export interface AttendanceRecord {
  id: string;
  dateBS: string; // e.g. "2083-05-08"
  employeeId: string;
  employeeName: string;
  role: Role;
  shiftType: ShiftType;
  checkIn: string; // e.g. "06:00 AM"
  checkOut: string; // e.g. "02:00 PM"
  hoursWorked: number;
  overtimeHours: number;
  status: AttendanceStatus;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  role: Role;
  leaveType: LeaveType;
  startDateBS: string;
  endDateBS: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  appliedDateBS: string;
  approvedBy?: string;
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  employeeName: string;
  role: Role;
  baseSalaryNpr: number;
  dailyAllowanceNpr: number;
  overtimeRatePerHourNpr: number;
  pfDeductionPct: number; // e.g. 10%
  bankName: string;
  bankAccountNo: string;
  effectiveFromBS: string;
}

export interface MonthlyPayrollItem {
  id: string;
  payrollMonthBS: string; // e.g. "Bhadra 2083"
  employeeId: string;
  employeeName: string;
  role: Role;
  
  // Earnings
  basePayNpr: number;
  daysPresent: number;
  overtimeHours: number;
  overtimePayNpr: number;
  allowancesNpr: number; // Food / Night shift / Dearness allowance
  grossPayNpr: number;

  // Deductions
  advanceDeductionNpr: number;
  pfDeductionNpr: number; // Provident Fund / CIT
  taxDeductionNpr: number;
  totalDeductionsNpr: number;

  // Net
  netPayableNpr: number;
  status: PayrollStatus;
  paidDateBS?: string;
  paymentMode?: PaymentMode;
  transactionRef?: string;
}

export interface HrSummaryTotals {
  totalStaffCount: number;
  presentTodayCount: number;
  onLeaveTodayCount: number;
  monthlyWageBillNpr: number;
  totalPaidThisMonthNpr: number;
  totalPendingThisMonthNpr: number;
}

/**
 * Calculates earnings, deductions, and net payable salary for an employee.
 */
export function calculateNetSalary({
  basePay,
  overtimeHours,
  overtimeRate,
  allowances = 0,
  advanceDeduction = 0,
  pfPct = 0,
  taxDeduction = 0,
}: {
  basePay: number;
  overtimeHours: number;
  overtimeRate: number;
  allowances?: number;
  advanceDeduction?: number;
  pfPct?: number;
  taxDeduction?: number;
}): {
  overtimePay: number;
  grossPay: number;
  pfDeduction: number;
  totalDeductions: number;
  netPayable: number;
} {
  const overtimePay = Math.max(0, overtimeHours * overtimeRate);
  const grossPay = Math.max(0, basePay + overtimePay + allowances);
  const pfDeduction = Math.round((basePay * Math.max(0, pfPct)) / 100);
  const totalDeductions = Math.max(0, advanceDeduction + pfDeduction + taxDeduction);
  const netPayable = Math.max(0, grossPay - totalDeductions);

  return {
    overtimePay,
    grossPay,
    pfDeduction,
    totalDeductions,
    netPayable,
  };
}

/**
 * Calculates high-level summary KPI totals for HR and Payroll.
 */
export function calculateHrSummary(
  attendance: AttendanceRecord[],
  payroll: MonthlyPayrollItem[],
  totalStaff: number
): HrSummaryTotals {
  const presentTodayCount = attendance.filter((a) => a.status === "PRESENT" || a.status === "HALF_DAY").length;
  const onLeaveTodayCount = attendance.filter((a) => a.status === "ON_LEAVE").length;

  let monthlyWageBillNpr = 0;
  let totalPaidThisMonthNpr = 0;
  let totalPendingThisMonthNpr = 0;

  for (const item of payroll) {
    monthlyWageBillNpr += item.netPayableNpr;
    if (item.status === "PAID") {
      totalPaidThisMonthNpr += item.netPayableNpr;
    } else {
      totalPendingThisMonthNpr += item.netPayableNpr;
    }
  }

  return {
    totalStaffCount: totalStaff,
    presentTodayCount,
    onLeaveTodayCount,
    monthlyWageBillNpr,
    totalPaidThisMonthNpr,
    totalPendingThisMonthNpr,
  };
}
