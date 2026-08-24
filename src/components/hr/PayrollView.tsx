"use client";

import { useState } from "react";
import {
  Wallet,
  CheckCircle2,
  TrendingUp,
  Banknote,
  Clock,
  ArrowRight,
  Sliders,
  CreditCard,
  Building2,
  QrCode,
  DollarSign,
} from "lucide-react";
import type { Role } from "@prisma/client";
import {
  type MonthlyPayrollItem,
  type SalaryStructure,
  type PaymentMode,
} from "@/lib/hr";
import {
  getMonthlyPayroll,
  getSalaryStructures,
  disburseSalary,
  updateSalaryStructure,
} from "@/lib/mock/hr";
import { fmtRs } from "@/lib/money";
import { ROLE_LABEL } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { StatCard } from "@/components/dashboard/StatCard";

export function PayrollView({
  currentUser,
}: {
  currentUser: { id: string; name: string; role: Role; username: string };
}) {
  const [payroll, setPayroll] = useState<MonthlyPayrollItem[]>(() => getMonthlyPayroll());
  const [structures, setStructures] = useState<SalaryStructure[]>(() => getSalaryStructures());
  const [activeTab, setActiveTab] = useState<"RUN" | "STRUCTURE">("RUN");
  const [notification, setNotification] = useState<string | null>(null);

  // Disburse Modal State
  const [disbursingItem, setDisbursingItem] = useState<MonthlyPayrollItem | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("BANK_TRANSFER");
  const [txRef, setTxRef] = useState("");

  // Edit Structure Modal State
  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null);
  const [editBaseSalary, setEditBaseSalary] = useState("");
  const [editAllowance, setEditAllowance] = useState("");
  const [editOvertimeRate, setEditOvertimeRate] = useState("");
  const [editPfPct, setEditPfPct] = useState("");

  const canManage = currentUser.role === "OWNER" || currentUser.role === "MANAGER";

  const refreshData = () => {
    setPayroll(getMonthlyPayroll());
    setStructures(getSalaryStructures());
  };

  const totalWageBill = payroll.reduce((sum, p) => sum + p.netPayableNpr, 0);
  const totalPaid = payroll.filter((p) => p.status === "PAID").reduce((sum, p) => sum + p.netPayableNpr, 0);
  const totalPending = payroll.filter((p) => p.status === "PENDING").reduce((sum, p) => sum + p.netPayableNpr, 0);

  const handleDisburseConfirm = () => {
    if (!disbursingItem) return;
    const res = disburseSalary(disbursingItem.id, paymentMode, txRef);
    if (res.success) {
      setNotification(res.message);
      setDisbursingItem(null);
      setTxRef("");
      refreshData();
    }
  };

  const handleOpenEditStructure = (st: SalaryStructure) => {
    setEditingStructure(st);
    setEditBaseSalary(String(st.baseSalaryNpr));
    setEditAllowance(String(st.dailyAllowanceNpr));
    setEditOvertimeRate(String(st.overtimeRatePerHourNpr));
    setEditPfPct(String(st.pfDeductionPct));
  };

  const handleSaveStructure = () => {
    if (!editingStructure) return;
    const res = updateSalaryStructure(editingStructure.id, {
      baseSalaryNpr: parseFloat(editBaseSalary) || 0,
      dailyAllowanceNpr: parseFloat(editAllowance) || 0,
      overtimeRatePerHourNpr: parseFloat(editOvertimeRate) || 0,
      pfDeductionPct: parseFloat(editPfPct) || 0,
    });
    if (res.success) {
      setNotification(res.message);
      setEditingStructure(null);
      refreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div
          role="status"
          className="animate-fade-in flex items-center justify-between rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="cursor-pointer text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Monthly Wage Bill (BS 2083)" value={fmtRs(totalWageBill)} icon={Wallet} tone="accent" small />
        <StatCard label="Salaries Disbursed" value={fmtRs(totalPaid)} icon={Banknote} tone="success" small />
        <StatCard label="Pending Disbursements" value={fmtRs(totalPending)} icon={Clock} tone={totalPending > 0 ? "accent" : "text"} small />
        <StatCard label="Employees in Payroll" value={String(payroll.length)} icon={TrendingUp} tone="text" />
      </div>

      {/* View Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("RUN")}
            className={`font-display cursor-pointer rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
              activeTab === "RUN"
                ? "bg-accent/15 font-semibold text-accent"
                : "text-text-muted hover:text-text"
            }`}
          >
            Monthly Payroll Run (Bhadra 2083)
          </button>
          <button
            onClick={() => setActiveTab("STRUCTURE")}
            className={`font-display cursor-pointer rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
              activeTab === "STRUCTURE"
                ? "bg-accent/15 font-semibold text-accent"
                : "text-text-muted hover:text-text"
            }`}
          >
            Salary Structure Configuration
          </button>
        </div>

        <span className="font-data text-[12px] text-text-muted">
          Fiscal Period: 2083/083 (Nepal BS Calendar)
        </span>
      </div>

      {/* View 1: Monthly Payroll Run Table */}
      {activeTab === "RUN" && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead className="border-b border-border bg-surface-hi font-medium text-text-muted">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Base Pay</th>
                  <th className="p-3">Overtime</th>
                  <th className="p-3">Allowances</th>
                  <th className="p-3">Gross Pay</th>
                  <th className="p-3">Deductions (PF/Adv)</th>
                  <th className="p-3">Net Payable</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payroll.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-hi/40 transition-colors">
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-semibold text-text">{item.employeeName}</div>
                      <div className="font-data text-[11px] text-text-muted">
                        {ROLE_LABEL[item.role]} · {item.daysPresent} Days
                      </div>
                    </td>

                    <td className="p-3 font-data whitespace-nowrap">{fmtRs(item.basePayNpr)}</td>

                    <td className="p-3 font-data whitespace-nowrap">
                      {item.overtimePayNpr > 0 ? (
                        <div>
                          <span className="text-text font-medium">{fmtRs(item.overtimePayNpr)}</span>
                          <div className="text-[10.5px] text-text-muted">({item.overtimeHours} hrs)</div>
                        </div>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>

                    <td className="p-3 font-data whitespace-nowrap text-text">{fmtRs(item.allowancesNpr)}</td>

                    <td className="p-3 font-data whitespace-nowrap font-semibold text-text">
                      {fmtRs(item.grossPayNpr)}
                    </td>

                    <td className="p-3 font-data whitespace-nowrap text-error">
                      -{fmtRs(item.totalDeductionsNpr)}
                      <div className="text-[10.5px] text-text-muted">
                        PF: {fmtRs(item.pfDeductionNpr)} | Adv: {fmtRs(item.advanceDeductionNpr)}
                      </div>
                    </td>

                    <td className="p-3 font-data whitespace-nowrap font-bold text-accent text-[14px]">
                      {fmtRs(item.netPayableNpr)}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <Badge tone={item.status === "PAID" ? "success" : "accent"}>
                        {item.status === "PAID" ? "PAID" : "PENDING"}
                      </Badge>
                      {item.paidDateBS && (
                        <div className="font-data text-[10.5px] text-text-muted mt-0.5">
                          {item.paymentMode?.replace(/_/g, " ")}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-right whitespace-nowrap">
                      {item.status === "PENDING" && canManage ? (
                        <PrimaryButton
                          onClick={() => {
                            setDisbursingItem(item);
                            setPaymentMode("BANK_TRANSFER");
                            setTxRef("");
                          }}
                          className="py-1 px-3 text-[11.5px]"
                        >
                          Disburse
                        </PrimaryButton>
                      ) : (
                        <span className="font-data text-[11.5px] text-success font-medium">Disbursed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* View 2: Salary Structure Grid */}
      {activeTab === "STRUCTURE" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {structures.map((st) => (
            <Card key={st.id} className="p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-display font-semibold text-text text-[15px]">{st.employeeName}</h4>
                    <span className="font-data text-[11px] text-text-muted">{ROLE_LABEL[st.role]}</span>
                  </div>
                  <Badge tone="accent">{fmtRs(st.baseSalaryNpr)} / mo</Badge>
                </div>

                <div className="rounded-xl border border-border bg-bg p-3 text-[12px] space-y-1.5 font-data">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Daily Allowance:</span>
                    <span className="font-semibold text-text">{fmtRs(st.dailyAllowanceNpr)} / day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Overtime Rate:</span>
                    <span className="font-semibold text-text">{fmtRs(st.overtimeRatePerHourNpr)} / hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">PF / CIT Deduction:</span>
                    <span className="font-semibold text-text">{st.pfDeductionPct}% of Base</span>
                  </div>
                  <div className="border-t border-border/80 pt-1.5 flex justify-between">
                    <span className="text-text-muted">Bank Details:</span>
                    <span className="font-medium text-text">{st.bankName}</span>
                  </div>
                  <div className="text-[11px] text-text-muted">A/C: {st.bankAccountNo}</div>
                </div>
              </div>

              {canManage && (
                <div className="border-t border-border pt-2 flex justify-end">
                  <GhostButton onClick={() => handleOpenEditStructure(st)} className="py-1 text-[11.5px]">
                    <Sliders size={13} /> Edit Structure
                  </GhostButton>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Disburse Modal Dialog */}
      {disbursingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-accent">
                <Banknote size={20} />
                <h3 className="font-display text-[16px] font-bold text-text">Disburse Staff Salary</h3>
              </div>
              <button onClick={() => setDisbursingItem(null)} className="cursor-pointer text-text-muted hover:text-text">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-[13px]">
              <div className="rounded-xl border border-border bg-bg p-3 space-y-1">
                <div className="font-semibold text-text text-[14px]">{disbursingItem.employeeName}</div>
                <div className="text-[12px] text-text-muted">Role: {ROLE_LABEL[disbursingItem.role]} · {disbursingItem.payrollMonthBS}</div>
                <div className="font-data text-[16px] font-bold text-accent pt-1">
                  Net Amount: {fmtRs(disbursingItem.netPayableNpr)}
                </div>
              </div>

              <Field label="Payment Mode *" htmlFor="payMode">
                <Select
                  id="payMode"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                >
                  <option value="BANK_TRANSFER">Bank Direct Account Transfer</option>
                  <option value="FONEPAY_QR">Fonepay / Mobile Banking QR</option>
                  <option value="CASH">Cash Counter Payment</option>
                  <option value="CHEQUE">Account Payee Cheque</option>
                </Select>
              </Field>

              <Field label="Bank / Transaction Reference Number" htmlFor="txRef">
                <Input
                  id="txRef"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  placeholder="e.g. NABIL-TX-880191 or Chq #00192"
                />
              </Field>

              <div className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
                <GhostButton onClick={() => setDisbursingItem(null)}>Cancel</GhostButton>
                <PrimaryButton onClick={handleDisburseConfirm} className="py-2 text-[13px]">
                  Confirm & Disburse
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Salary Structure Modal */}
      {editingStructure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-accent">
                <Sliders size={18} />
                <h3 className="font-display text-[16px] font-bold text-text">Edit Salary Structure</h3>
              </div>
              <button onClick={() => setEditingStructure(null)} className="cursor-pointer text-text-muted hover:text-text">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-[13px]">
              <div className="text-text font-semibold">{editingStructure.employeeName} ({ROLE_LABEL[editingStructure.role]})</div>

              <Field label="Monthly Base Salary (NPR) *" htmlFor="baseSal">
                <Input
                  id="baseSal"
                  type="number"
                  value={editBaseSalary}
                  onChange={(e) => setEditBaseSalary(e.target.value)}
                  required
                />
              </Field>

              <Field label="Daily Allowance (NPR)" htmlFor="dailyAllow">
                <Input
                  id="dailyAllow"
                  type="number"
                  value={editAllowance}
                  onChange={(e) => setEditAllowance(e.target.value)}
                />
              </Field>

              <Field label="Overtime Rate per Hour (NPR)" htmlFor="otRate">
                <Input
                  id="otRate"
                  type="number"
                  value={editOvertimeRate}
                  onChange={(e) => setEditOvertimeRate(e.target.value)}
                />
              </Field>

              <Field label="Provident Fund / CIT Deduction (%)" htmlFor="pfPct">
                <Input
                  id="pfPct"
                  type="number"
                  value={editPfPct}
                  onChange={(e) => setEditPfPct(e.target.value)}
                />
              </Field>

              <div className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
                <GhostButton onClick={() => setEditingStructure(null)}>Cancel</GhostButton>
                <PrimaryButton onClick={handleSaveStructure} className="py-2 text-[13px]">
                  Save Changes
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
