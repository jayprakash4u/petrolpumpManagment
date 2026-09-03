import type {
  AttendanceRecord,
  LeaveRequest,
  SalaryStructure,
  MonthlyPayrollItem,
  PaymentMode,
} from "@/lib/hr";
import { calculateNetSalary } from "@/lib/hr";

export const MOCK_SALARY_STRUCTURES: SalaryStructure[] = [
  {
    id: "sal-01",
    employeeId: "usr-owner-prakash",
    employeeName: "Prakash Yadav",
    role: "OWNER",
    baseSalaryNpr: 65000,
    dailyAllowanceNpr: 500,
    overtimeRatePerHourNpr: 0,
    pfDeductionPct: 10,
    bankName: "Nabil Bank Ltd",
    bankAccountNo: "01900175002911",
    effectiveFromBS: "2083-01-01",
  },
  {
    id: "sal-02",
    employeeId: "usr-mgr-anita",
    employeeName: "Anita Shrestha",
    role: "OWNER",
    baseSalaryNpr: 45000,
    dailyAllowanceNpr: 350,
    overtimeRatePerHourNpr: 300,
    pfDeductionPct: 10,
    bankName: "Global IME Bank",
    bankAccountNo: "10200981123401",
    effectiveFromBS: "2083-01-01",
  },
  {
    id: "sal-03",
    employeeId: "usr-cashier-binod",
    employeeName: "Binod Tamang",
    role: "OWNER",
    baseSalaryNpr: 30000,
    dailyAllowanceNpr: 250,
    overtimeRatePerHourNpr: 200,
    pfDeductionPct: 10,
    bankName: "NIC Asia Bank",
    bankAccountNo: "55001290384112",
    effectiveFromBS: "2083-01-01",
  },
  {
    id: "sal-04",
    employeeId: "usr-att-ramesh",
    employeeName: "Ramesh Thapa",
    role: "OWNER",
    baseSalaryNpr: 22000,
    dailyAllowanceNpr: 200,
    overtimeRatePerHourNpr: 150,
    pfDeductionPct: 10,
    bankName: "Siddhartha Bank",
    bankAccountNo: "00188921102933",
    effectiveFromBS: "2083-01-01",
  },
  {
    id: "sal-05",
    employeeId: "usr-att-sita",
    employeeName: "Sita Gurung",
    role: "OWNER",
    baseSalaryNpr: 22000,
    dailyAllowanceNpr: 200,
    overtimeRatePerHourNpr: 150,
    pfDeductionPct: 10,
    bankName: "Sanima Bank",
    bankAccountNo: "09911283004122",
    effectiveFromBS: "2083-01-01",
  },
  {
    id: "sal-06",
    employeeId: "usr-att-kiran",
    employeeName: "Kiran Adhikari",
    role: "OWNER",
    baseSalaryNpr: 22000,
    dailyAllowanceNpr: 200,
    overtimeRatePerHourNpr: 150,
    pfDeductionPct: 10,
    bankName: "Rastriya Banijya Bank",
    bankAccountNo: "11800293847120",
    effectiveFromBS: "2083-01-01",
  },
];

export const MOCK_TODAY_ATTENDANCE: AttendanceRecord[] = [
  {
    id: "att-01",
    dateBS: "2083-05-08",
    employeeId: "usr-mgr-anita",
    employeeName: "Anita Shrestha",
    role: "OWNER",
    shiftType: "DAY",
    checkIn: "07:00 AM",
    checkOut: "04:00 PM",
    hoursWorked: 9,
    overtimeHours: 1,
    status: "PRESENT",
    notes: "Supervised morning tanker decanting and dip calibration.",
  },
  {
    id: "att-02",
    dateBS: "2083-05-08",
    employeeId: "usr-cashier-binod",
    employeeName: "Binod Tamang",
    role: "OWNER",
    shiftType: "MORNING",
    checkIn: "06:00 AM",
    checkOut: "02:00 PM",
    hoursWorked: 8,
    overtimeHours: 0,
    status: "PRESENT",
    notes: "Cash counter reconciled with zero shortage.",
  },
  {
    id: "att-03",
    dateBS: "2083-05-08",
    employeeId: "usr-att-ramesh",
    employeeName: "Ramesh Thapa",
    role: "OWNER",
    shiftType: "MORNING",
    checkIn: "06:00 AM",
    checkOut: "03:30 PM",
    hoursWorked: 9.5,
    overtimeHours: 1.5,
    status: "PRESENT",
    notes: "Extended shift on Bay 1 due to rush queue.",
  },
  {
    id: "att-04",
    dateBS: "2083-05-08",
    employeeId: "usr-att-sita",
    employeeName: "Sita Gurung",
    role: "OWNER",
    shiftType: "DAY",
    checkIn: "02:00 PM",
    checkOut: "10:00 PM",
    hoursWorked: 8,
    overtimeHours: 0,
    status: "PRESENT",
  },
  {
    id: "att-05",
    dateBS: "2083-05-08",
    employeeId: "usr-att-kiran",
    employeeName: "Kiran Adhikari",
    role: "OWNER",
    shiftType: "DAY",
    checkIn: "—",
    checkOut: "—",
    hoursWorked: 0,
    overtimeHours: 0,
    status: "ON_LEAVE",
    notes: "Approved medical leave for dental appointment.",
  },
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "leave-01",
    employeeId: "usr-att-kiran",
    employeeName: "Kiran Adhikari",
    role: "OWNER",
    leaveType: "SICK",
    startDateBS: "2083-05-08",
    endDateBS: "2083-05-09",
    totalDays: 2,
    reason: "Severe toothache and root canal treatment.",
    status: "APPROVED",
    appliedDateBS: "2083-05-07",
    approvedBy: "Anita Shrestha (Manager)",
  },
  {
    id: "leave-02",
    employeeId: "usr-att-ramesh",
    employeeName: "Ramesh Thapa",
    role: "OWNER",
    leaveType: "FESTIVAL",
    startDateBS: "2083-05-18",
    endDateBS: "2083-05-22",
    totalDays: 5,
    reason: "Teej festival home visit to Nuwakot village.",
    status: "PENDING",
    appliedDateBS: "2083-05-06",
  },
  {
    id: "leave-03",
    employeeId: "usr-cashier-binod",
    employeeName: "Binod Tamang",
    role: "OWNER",
    leaveType: "CASUAL",
    startDateBS: "2083-04-20",
    endDateBS: "2083-04-21",
    totalDays: 2,
    reason: "Family wedding ceremony in Hetauda.",
    status: "APPROVED",
    appliedDateBS: "2083-04-18",
    approvedBy: "Prakash Yadav (Owner)",
  },
];

export const MOCK_MONTHLY_PAYROLL: MonthlyPayrollItem[] = [
  {
    id: "pay-8305-01",
    payrollMonthBS: "Bhadra 2083",
    employeeId: "usr-mgr-anita",
    employeeName: "Anita Shrestha",
    role: "OWNER",
    basePayNpr: 45000,
    daysPresent: 26,
    overtimeHours: 12,
    overtimePayNpr: 3600,
    allowancesNpr: 3500, // Food & Communication
    grossPayNpr: 52100,
    advanceDeductionNpr: 5000,
    pfDeductionNpr: 4500,
    taxDeductionNpr: 1000,
    totalDeductionsNpr: 10500,
    netPayableNpr: 41600,
    status: "PENDING",
  },
  {
    id: "pay-8305-02",
    payrollMonthBS: "Bhadra 2083",
    employeeId: "usr-cashier-binod",
    employeeName: "Binod Tamang",
    role: "OWNER",
    basePayNpr: 30000,
    daysPresent: 27,
    overtimeHours: 8,
    overtimePayNpr: 1600,
    allowancesNpr: 2500,
    grossPayNpr: 34100,
    advanceDeductionNpr: 0,
    pfDeductionNpr: 3000,
    taxDeductionNpr: 400,
    totalDeductionsNpr: 3400,
    netPayableNpr: 30700,
    status: "PENDING",
  },
  {
    id: "pay-8305-03",
    payrollMonthBS: "Bhadra 2083",
    employeeId: "usr-att-ramesh",
    employeeName: "Ramesh Thapa",
    role: "OWNER",
    basePayNpr: 22000,
    daysPresent: 28,
    overtimeHours: 18,
    overtimePayNpr: 2700,
    allowancesNpr: 2000,
    grossPayNpr: 26700,
    advanceDeductionNpr: 2000,
    pfDeductionNpr: 2200,
    taxDeductionNpr: 0,
    totalDeductionsNpr: 4200,
    netPayableNpr: 22500,
    status: "PENDING",
  },
  {
    id: "pay-8305-04",
    payrollMonthBS: "Bhadra 2083",
    employeeId: "usr-att-sita",
    employeeName: "Sita Gurung",
    role: "OWNER",
    basePayNpr: 22000,
    daysPresent: 26,
    overtimeHours: 6,
    overtimePayNpr: 900,
    allowancesNpr: 2000,
    grossPayNpr: 24900,
    advanceDeductionNpr: 0,
    pfDeductionNpr: 2200,
    taxDeductionNpr: 0,
    totalDeductionsNpr: 2200,
    netPayableNpr: 22700,
    status: "PAID",
    paidDateBS: "2083-05-05",
    paymentMode: "BANK_TRANSFER",
    transactionRef: "NABIL-TX-880291",
  },
  {
    id: "pay-8305-05",
    payrollMonthBS: "Bhadra 2083",
    employeeId: "usr-att-kiran",
    employeeName: "Kiran Adhikari",
    role: "OWNER",
    basePayNpr: 22000,
    daysPresent: 25,
    overtimeHours: 10,
    overtimePayNpr: 1500,
    allowancesNpr: 2000,
    grossPayNpr: 25500,
    advanceDeductionNpr: 3000,
    pfDeductionNpr: 2200,
    taxDeductionNpr: 0,
    totalDeductionsNpr: 5200,
    netPayableNpr: 20300,
    status: "PAID",
    paidDateBS: "2083-05-05",
    paymentMode: "FONEPAY_QR",
    transactionRef: "FPAY-8911024",
  },
];

// In-Memory stores
let attendanceStore: AttendanceRecord[] = [...MOCK_TODAY_ATTENDANCE];
let leaveStore: LeaveRequest[] = [...MOCK_LEAVE_REQUESTS];
let salaryStructuresStore: SalaryStructure[] = [...MOCK_SALARY_STRUCTURES];
let payrollStore: MonthlyPayrollItem[] = [...MOCK_MONTHLY_PAYROLL];

export function getAttendanceRecords(): AttendanceRecord[] {
  return [...attendanceStore];
}

export function getLeaveRequests(): LeaveRequest[] {
  return [...leaveStore];
}

export function getSalaryStructures(): SalaryStructure[] {
  return [...salaryStructuresStore];
}

export function getMonthlyPayroll(): MonthlyPayrollItem[] {
  return [...payrollStore];
}

export function markAttendance(record: Omit<AttendanceRecord, "id">): AttendanceRecord {
  const newId = `att-${Date.now()}`;
  const newRecord = { ...record, id: newId };
  // If already present for today, replace; else append
  const existingIdx = attendanceStore.findIndex(
    (a) => a.employeeId === record.employeeId && a.dateBS === record.dateBS
  );
  if (existingIdx >= 0) {
    attendanceStore[existingIdx] = newRecord;
  } else {
    attendanceStore.unshift(newRecord);
  }
  return newRecord;
}

export function submitLeaveRequest(
  data: Omit<LeaveRequest, "id" | "status" | "appliedDateBS">
): LeaveRequest {
  const newId = `leave-${Date.now()}`;
  const newLeave: LeaveRequest = {
    ...data,
    id: newId,
    status: "PENDING",
    appliedDateBS: "2083-05-08",
  };
  leaveStore.unshift(newLeave);
  return newLeave;
}

export function updateLeaveStatus(
  leaveId: string,
  status: "APPROVED" | "REJECTED",
  reviewerName: string
): { success: boolean; message: string; leave?: LeaveRequest } {
  const idx = leaveStore.findIndex((l) => l.id === leaveId);
  if (idx === -1) return { success: false, message: "Leave request not found." };

  leaveStore[idx] = {
    ...leaveStore[idx],
    status,
    approvedBy: status === "APPROVED" ? reviewerName : undefined,
  };

  return {
    success: true,
    message: `Leave request for ${leaveStore[idx].employeeName} marked as ${status.toLowerCase()}.`,
    leave: leaveStore[idx],
  };
}

export function disburseSalary(
  payrollId: string,
  paymentMode: PaymentMode,
  refNumber?: string
): { success: boolean; message: string; item?: MonthlyPayrollItem } {
  const idx = payrollStore.findIndex((p) => p.id === payrollId);
  if (idx === -1) return { success: false, message: "Payroll item not found." };

  const current = payrollStore[idx];
  if (current.status === "PAID") {
    return { success: false, message: `Salary for ${current.employeeName} has already been paid.` };
  }

  const updated: MonthlyPayrollItem = {
    ...current,
    status: "PAID",
    paidDateBS: "2083-05-08",
    paymentMode,
    transactionRef: refNumber || `DISB-${Date.now().toString().slice(-6)}`,
  };

  payrollStore[idx] = updated;
  return {
    success: true,
    message: `Salary of Rs. ${updated.netPayableNpr.toLocaleString()} disbursed to ${updated.employeeName} via ${paymentMode.replace(/_/g, " ")}.`,
    item: updated,
  };
}

export function updateSalaryStructure(
  structureId: string,
  updates: Partial<SalaryStructure>
): { success: boolean; message: string; structure?: SalaryStructure } {
  const idx = salaryStructuresStore.findIndex((s) => s.id === structureId);
  if (idx === -1) return { success: false, message: "Salary structure not found." };

  const updated = {
    ...salaryStructuresStore[idx],
    ...updates,
  };

  salaryStructuresStore[idx] = updated;
  return {
    success: true,
    message: `Salary structure for ${updated.employeeName} updated successfully.`,
    structure: updated,
  };
}

export function resetMockHr(): void {
  attendanceStore = [...MOCK_TODAY_ATTENDANCE];
  leaveStore = [...MOCK_LEAVE_REQUESTS];
  salaryStructuresStore = [...MOCK_SALARY_STRUCTURES];
  payrollStore = [...MOCK_MONTHLY_PAYROLL];
}
