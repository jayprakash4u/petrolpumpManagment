"use client";

import { useState } from "react";
import { Plus, X, Building2, ShieldCheck, CheckCircle2, AlertTriangle, Phone, Mail, Check } from "lucide-react";
import type { CorporateAccount } from "@/lib/corporate";
import { fmtRs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

export function CorporateAccountsTable({ accounts }: { accounts: CorporateAccount[] }) {
  const [list, setList] = useState<CorporateAccount[]>(accounts);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [panVatNo, setPanVatNo] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [creditLimit, setCreditLimit] = useState("1000000");
  const [deposit, setDeposit] = useState("300000");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newAccount: CorporateAccount = {
      id: `corp-${Date.now()}`,
      accountCode: `CORP-${companyName.substring(0, 3).toUpperCase()}-${String(list.length + 1).padStart(2, "0")}`,
      companyName,
      panVatNo,
      billingContactPerson: contactPerson,
      phone,
      email,
      officeAddress,
      monthlyCreditLimitNpr: parseFloat(creditLimit) || 0,
      currentDueBalanceNpr: 0,
      securityDepositNpr: parseFloat(deposit) || 0,
      billingCycleDay: 30,
      totalRegisteredVehicles: 0,
      active: true,
      status: "ACTIVE",
    };

    setList([newAccount, ...list]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
      setCompanyName("");
      setPanVatNo("");
      setContactPerson("");
    }, 1000);
  };

  const totalReceivables = list.reduce((sum, a) => sum + a.currentDueBalanceNpr, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold text-text">Corporate Accounts Directory</h3>
          <p className="text-xs text-text-muted">
            Institutional fleet clients with approved credit lines, vehicle quotas, and monthly billing terms
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">
            Total Receivables: <strong className="font-data text-accent">{fmtRs(totalReceivables)}</strong>
          </span>
          <PrimaryButton onClick={() => setModalOpen(true)} className="gap-1.5 text-xs">
            <Plus size={15} />
            Add Corporate Client
          </PrimaryButton>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
              <th className="px-3 py-2.5 font-medium">COMPANY & CODE</th>
              <th className="px-3 py-2.5 font-medium">PAN / VAT</th>
              <th className="px-3 py-2.5 font-medium">BILLING CONTACT</th>
              <th className="px-3 py-2.5 text-center font-medium">VEHICLES</th>
              <th className="px-3 py-2.5 text-right font-medium">CREDIT LIMIT</th>
              <th className="px-3 py-2.5 text-right font-medium">CURRENT DUE</th>
              <th className="px-3 py-2.5 text-right font-medium">SECURITY DEPOSIT</th>
              <th className="px-3 py-2.5 text-center font-medium">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-hi text-accent">
                      <Building2 size={15} />
                    </div>
                    <div>
                      <div className="font-display text-[13.5px] font-semibold text-text">{a.companyName}</div>
                      <div className="font-data text-[11px] text-text-muted">{a.accountCode} · {a.officeAddress}</div>
                    </div>
                  </div>
                </td>

                <td className="px-3 py-3 font-data text-[12px] text-text-muted">{a.panVatNo}</td>

                <td className="px-3 py-3 text-xs">
                  <div className="font-medium text-text">{a.billingContactPerson}</div>
                  <div className="text-[11px] text-text-muted">{a.phone}</div>
                </td>

                <td className="px-3 py-3 text-center font-data text-[13px] font-bold text-accent">
                  {a.totalRegisteredVehicles}
                </td>

                <td className="px-3 py-3 text-right font-data text-[12.5px] text-text-muted">
                  {fmtRs(a.monthlyCreditLimitNpr)}
                </td>

                <td className="px-3 py-3 text-right font-data text-[13px] font-bold">
                  {a.currentDueBalanceNpr > 0 ? (
                    <span className="text-error">{fmtRs(a.currentDueBalanceNpr)}</span>
                  ) : (
                    <span className="text-success">NPR 0</span>
                  )}
                </td>

                <td className="px-3 py-3 text-right font-data text-[12.5px] text-text font-semibold">
                  {fmtRs(a.securityDepositNpr)}
                </td>

                <td className="px-3 py-3 text-center">
                  <Badge tone={a.status === "ACTIVE" ? "success" : "error"}>
                    <ShieldCheck size={10} />
                    {a.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Corporate Client Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-fade-in">
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-text">Register Corporate Fleet Client</h3>
                  <p className="text-xs text-text-muted">Setup company credit lines, billing cycle, and fleet terms</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-text-muted hover:bg-surface-hi hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            {submitted ? (
              <div className="py-8 text-center animate-fade-in">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
                  <Check size={24} />
                </div>
                <h4 className="font-display text-base font-semibold text-text">Corporate Account Created</h4>
                <p className="mt-1 text-xs text-text-muted">{companyName} credit profile is now active.</p>
              </div>
            ) : (
              <form onSubmit={handleAdd} className="flex flex-col gap-4">
                <Field label="Company / Institution Name">
                  <Input
                    placeholder="e.g. Kantipur Media Group Fleet"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="PAN / VAT Number">
                    <Input
                      placeholder="e.g. 300994182"
                      value={panVatNo}
                      onChange={(e) => setPanVatNo(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Billing Contact Person">
                    <Input
                      placeholder="e.g. Sujan Shrestha (Ops)"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Contact Phone">
                    <Input
                      placeholder="e.g. +977 9841000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Official Email">
                    <Input
                      type="email"
                      placeholder="e.g. fleet@kantipur.com.np"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Office / Depot Address">
                  <Input
                    placeholder="e.g. Tinkune, Subidhanagar, Kathmandu"
                    value={officeAddress}
                    onChange={(e) => setOfficeAddress(e.target.value)}
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Approved Monthly Credit Limit (NPR)">
                    <Input
                      type="number"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Security Deposit Held (NPR)">
                    <Input
                      type="number"
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="mt-2 flex items-center justify-end gap-2.5">
                  <GhostButton type="button" onClick={() => setModalOpen(false)}>
                    Cancel
                  </GhostButton>
                  <PrimaryButton type="submit">Save Corporate Client</PrimaryButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
