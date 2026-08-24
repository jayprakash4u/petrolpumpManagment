"use client";

import { useState } from "react";
import {
  FileBarChart2,
  Printer,
  Download,
  Search,
  Eye,
  FileText,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { type MonthlyPayrollItem } from "@/lib/hr";
import { getMonthlyPayroll } from "@/lib/mock/hr";
import { fmtRs } from "@/lib/money";
import { ROLE_LABEL } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GhostButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";

export function SalaryReportView() {
  const [payroll] = useState<MonthlyPayrollItem[]>(() => getMonthlyPayroll());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [selectedPayslip, setSelectedPayslip] = useState<MonthlyPayrollItem | null>(null);

  const filtered = payroll.filter((item) => {
    if (selectedMonth !== "ALL" && item.payrollMonthBS !== selectedMonth) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.employeeName.toLowerCase().includes(q);
      const matchRole = ROLE_LABEL[item.role].toLowerCase().includes(q);
      if (!matchName && !matchRole) return false;
    }
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Employee Name",
      "Role",
      "Month (BS)",
      "Days Present",
      "Base Pay (NPR)",
      "Overtime Pay (NPR)",
      "Allowances (NPR)",
      "Gross Pay (NPR)",
      "PF Deduction (NPR)",
      "Advance Deduction (NPR)",
      "Total Deductions (NPR)",
      "Net Payable (NPR)",
      "Status",
      "Disbursement Date (BS)",
      "Payment Mode",
      "Reference",
    ];

    const rows = filtered.map((p) => [
      `"${p.employeeName}"`,
      `"${ROLE_LABEL[p.role]}"`,
      `"${p.payrollMonthBS}"`,
      `"${p.daysPresent}"`,
      `"${p.basePayNpr}"`,
      `"${p.overtimePayNpr}"`,
      `"${p.allowancesNpr}"`,
      `"${p.grossPayNpr}"`,
      `"${p.pfDeductionNpr}"`,
      `"${p.advanceDeductionNpr}"`,
      `"${p.totalDeductionsNpr}"`,
      `"${p.netPayableNpr}"`,
      `"${p.status}"`,
      `"${p.paidDateBS || ""}"`,
      `"${p.paymentMode || ""}"`,
      `"${p.transactionRef || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `salary_payroll_report_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <FileBarChart2 size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">Salary & Wages Audit Register</h3>
            <p className="text-[12.5px] text-text-muted">
              Official station salary disbursements, wage expense breakdown, and payslip generator.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Summary
          </GhostButton>
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export CSV
          </GhostButton>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2">
        <div className="relative">
          <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee name or role..."
            className="pl-8 text-[12.5px]"
          />
        </div>

        <Select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="text-[12.5px]"
        >
          <option value="ALL">All Recorded Months</option>
          <option value="Bhadra 2083">Bhadra 2083 BS</option>
          <option value="Shrawan 2083">Shrawan 2083 BS</option>
        </Select>
      </div>

      {/* Salary Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-hi font-medium text-text-muted">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Period</th>
                <th className="p-3">Gross Salary</th>
                <th className="p-3">Deductions</th>
                <th className="p-3">Net Disbursed</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-surface-hi/40 transition-colors">
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-semibold text-text">{item.employeeName}</div>
                    <div className="font-data text-[11px] text-text-muted">{ROLE_LABEL[item.role]}</div>
                  </td>

                  <td className="p-3 font-data whitespace-nowrap text-text-muted">{item.payrollMonthBS}</td>

                  <td className="p-3 font-data whitespace-nowrap font-medium text-text">
                    {fmtRs(item.grossPayNpr)}
                  </td>

                  <td className="p-3 font-data whitespace-nowrap text-error">
                    -{fmtRs(item.totalDeductionsNpr)}
                  </td>

                  <td className="p-3 font-data whitespace-nowrap font-bold text-accent text-[14px]">
                    {fmtRs(item.netPayableNpr)}
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    <Badge tone={item.status === "PAID" ? "success" : "accent"}>{item.status}</Badge>
                  </td>

                  <td className="p-3 text-right whitespace-nowrap">
                    <GhostButton
                      onClick={() => setSelectedPayslip(item)}
                      className="py-1 px-2.5 text-[11.5px]"
                    >
                      <Eye size={13} /> View Slip
                    </GhostButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Official Printable Payslip Modal Dialog */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-fade-in w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            {/* Payslip Header */}
            <div className="border-b border-border pb-4 text-center">
              <h3 className="font-display text-[18px] font-bold text-text">Shree Petroleum</h3>
              <div className="text-[11.5px] text-text-muted">Kathmandu, Nepal · PAN/VAT: 601928374</div>
              <div className="mt-2 font-display text-[13.5px] font-semibold text-accent uppercase tracking-wider">
                Salary Slip — {selectedPayslip.payrollMonthBS}
              </div>
            </div>

            {/* Employee Metadata */}
            <div className="grid grid-cols-2 gap-3 border-b border-border py-3 text-[12px]">
              <div>
                <span className="text-text-muted">Employee Name:</span>
                <div className="font-bold text-text">{selectedPayslip.employeeName}</div>
              </div>
              <div>
                <span className="text-text-muted">Designation / Role:</span>
                <div className="font-bold text-text">{ROLE_LABEL[selectedPayslip.role]}</div>
              </div>
              <div>
                <span className="text-text-muted">Days Present:</span>
                <div className="font-data font-semibold text-text">{selectedPayslip.daysPresent} Days</div>
              </div>
              <div>
                <span className="text-text-muted">Payment Status:</span>
                <div className="font-data font-semibold text-success">{selectedPayslip.status}</div>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown */}
            <div className="grid grid-cols-2 gap-4 py-3 text-[12px]">
              {/* Earnings Column */}
              <div className="space-y-1.5 rounded-xl bg-bg p-3">
                <span className="font-semibold text-text uppercase text-[11px] block border-b border-border/80 pb-1">
                  Earnings
                </span>
                <div className="flex justify-between">
                  <span className="text-text-muted">Basic Pay:</span>
                  <span className="font-data text-text">{fmtRs(selectedPayslip.basePayNpr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Overtime ({selectedPayslip.overtimeHours}h):</span>
                  <span className="font-data text-text">{fmtRs(selectedPayslip.overtimePayNpr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Allowances:</span>
                  <span className="font-data text-text">{fmtRs(selectedPayslip.allowancesNpr)}</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-1 font-bold">
                  <span>Gross Pay:</span>
                  <span className="font-data text-text">{fmtRs(selectedPayslip.grossPayNpr)}</span>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="space-y-1.5 rounded-xl bg-bg p-3">
                <span className="font-semibold text-text uppercase text-[11px] block border-b border-border/80 pb-1">
                  Deductions
                </span>
                <div className="flex justify-between">
                  <span className="text-text-muted">Provident Fund:</span>
                  <span className="font-data text-error">-{fmtRs(selectedPayslip.pfDeductionNpr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Advance Deducted:</span>
                  <span className="font-data text-error">-{fmtRs(selectedPayslip.advanceDeductionNpr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">TDS / Tax:</span>
                  <span className="font-data text-error">-{fmtRs(selectedPayslip.taxDeductionNpr)}</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-1 font-bold">
                  <span>Total Deductions:</span>
                  <span className="font-data text-error">-{fmtRs(selectedPayslip.totalDeductionsNpr)}</span>
                </div>
              </div>
            </div>

            {/* Net Amount Box */}
            <div className="rounded-xl border border-accent/30 bg-accent/10 p-3.5 text-center">
              <span className="text-[11.5px] text-text-muted uppercase tracking-wider block">Net Take-Home Pay</span>
              <div className="font-data text-[22px] font-bold text-accent mt-0.5">
                {fmtRs(selectedPayslip.netPayableNpr)}
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[11px] text-text-muted border-t border-border mt-4">
              <div className="border-t border-dashed border-border pt-1">Authorized Station Signatory</div>
              <div className="border-t border-dashed border-border pt-1">Employee Signature</div>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
              <GhostButton onClick={() => setSelectedPayslip(null)}>Close</GhostButton>
              <GhostButton onClick={handlePrint} className="text-[12.5px]">
                <Printer size={14} /> Print Payslip
              </GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
