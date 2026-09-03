"use client";

import { useState, useMemo } from "react";
import {
  Wallet,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Search,
  Filter,
  Receipt,
  Plus,
  Printer,
  X,
  CreditCard,
  DollarSign,
  TrendingUp,
  FileText,
} from "lucide-react";
import { clsx } from "clsx";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Field, Input } from "@/components/ui/Field";
import { fmtRs } from "@/lib/money";

export interface SaasPaymentRecord {
  id: string;
  invoiceNo: string;
  stationName: string;
  slug: string;
  planName: string;
  amountNpr: number;
  dateBS: string;
  paymentMode: "FONEPAY_QR" | "NABIL_BANK_TRANSFER" | "BANK_CHEQUE" | "CASH";
  status: "PAID" | "PENDING" | "FAILED";
  referenceCode: string;
}

export function PlatformPaymentsView() {
  const [payments, setPayments] = useState<SaasPaymentRecord[]>([
    {
      id: "pay-101",
      invoiceNo: "SAAS-2083-0091",
      stationName: "ABC Petrol Pump",
      slug: "abc-petrol",
      planName: "Pro Plan (12M)",
      amountNpr: 40000,
      dateBS: "2083-05-01",
      paymentMode: "NABIL_BANK_TRANSFER",
      status: "PAID",
      referenceCode: "TXN-NAB-994812",
    },
    {
      id: "pay-102",
      invoiceNo: "SAAS-2083-0092",
      stationName: "XYZ Fuel Station",
      slug: "xyz-fuel",
      planName: "Basic Plan (6M)",
      amountNpr: 12000,
      dateBS: "2083-05-02",
      paymentMode: "FONEPAY_QR",
      status: "PAID",
      referenceCode: "FP-QR-771829",
    },
    {
      id: "pay-103",
      invoiceNo: "SAAS-2083-0093",
      stationName: "Shree Pashupati Petroleum",
      slug: "shree-pashupati",
      planName: "Pro Plan (12M)",
      amountNpr: 40000,
      dateBS: "2083-05-04",
      paymentMode: "NABIL_BANK_TRANSFER",
      status: "PAID",
      referenceCode: "TXN-NAB-401928",
    },
    {
      id: "pay-104",
      invoiceNo: "SAAS-2083-0094",
      stationName: "Pokhara Highway Fuel Center",
      slug: "pokhara-highway",
      planName: "Pro Plan (12M)",
      amountNpr: 40000,
      dateBS: "2083-05-05",
      paymentMode: "FONEPAY_QR",
      status: "PAID",
      referenceCode: "FP-QR-918234",
    },
    {
      id: "pay-105",
      invoiceNo: "SAAS-2083-0095",
      stationName: "Everest Oil Traders",
      slug: "everest-oil",
      planName: "Enterprise Plan (3 Years)",
      amountNpr: 200000,
      dateBS: "2083-04-28",
      paymentMode: "NABIL_BANK_TRANSFER",
      status: "PAID",
      referenceCode: "TXN-NAB-110294",
    },
    {
      id: "pay-106",
      invoiceNo: "SAAS-2083-0096",
      stationName: "Birgunj Border Fuel Hub",
      slug: "birgunj-fuel",
      planName: "Enterprise Plan (12M)",
      amountNpr: 75000,
      dateBS: "2083-05-06",
      paymentMode: "BANK_CHEQUE",
      status: "PENDING",
      referenceCode: "CHQ-NIBL-88129",
    },
    {
      id: "pay-107",
      invoiceNo: "SAAS-2083-0097",
      stationName: "Butwal Petroleum Center",
      slug: "butwal-petroleum",
      planName: "Pro Plan (6M)",
      amountNpr: 21000,
      dateBS: "2083-05-07",
      paymentMode: "FONEPAY_QR",
      status: "PAID",
      referenceCode: "FP-QR-551029",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");

  // Selected Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState<SaasPaymentRecord | null>(null);

  // Record Manual Payment Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStation, setNewStation] = useState("ABC Petrol Pump");
  const [newAmount, setNewAmount] = useState(4000);
  const [newMode, setNewMode] = useState<SaasPaymentRecord["paymentMode"]>("NABIL_BANK_TRANSFER");
  const [newRef, setNewRef] = useState("");
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (modeFilter !== "ALL" && p.paymentMode !== modeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchStation = p.stationName.toLowerCase().includes(q);
        const matchInv = p.invoiceNo.toLowerCase().includes(q);
        const matchRef = p.referenceCode.toLowerCase().includes(q);
        if (!matchStation && !matchInv && !matchRef) return false;
      }
      return true;
    });
  }, [payments, statusFilter, modeFilter, searchQuery]);

  const totalCollected = useMemo(() => {
    return payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amountNpr, 0);
  }, [payments]);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: SaasPaymentRecord = {
      id: `pay-${Date.now()}`,
      invoiceNo: `SAAS-2083-${Math.floor(1000 + Math.random() * 9000)}`,
      stationName: newStation,
      slug: newStation.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      planName: "Pro Plan (1M)",
      amountNpr: Number(newAmount),
      dateBS: "2083-05-08",
      paymentMode: newMode,
      status: "PAID",
      referenceCode: newRef || `TXN-${Date.now()}`,
    };
    setPayments([newRecord, ...payments]);
    setShowAddModal(false);
    setNewRef("");
    setAddSuccess(`Payment of ${fmtRs(newAmount)} for ${newStation} recorded successfully.`);
    setTimeout(() => setAddSuccess(null), 4000);
  };

  const handleExportCSV = () => {
    const headers = [
      "Invoice #",
      "Station Name",
      "Plan Tier",
      "Amount (NPR)",
      "Payment Date (BS)",
      "Payment Method",
      "Transaction Ref",
      "Status",
    ];

    const rows = filteredPayments.map((p) => [
      `"${p.invoiceNo}"`,
      `"${p.stationName}"`,
      `"${p.planName}"`,
      `"${p.amountNpr}"`,
      `"${p.dateBS}"`,
      `"${p.paymentMode}"`,
      `"${p.referenceCode}"`,
      `"${p.status}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `saas_platform_payments_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <Wallet size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Platform Subscription Payments (सफ्टवेयर सदस्यता भुक्तानी खाता)
            </h2>
            <p className="text-[12px] text-text-muted">
              Record and track SaaS subscription payments received from petrol station clients (separate from fuel sales).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export CSV
          </GhostButton>
          <PrimaryButton onClick={() => setShowAddModal(true)} className="text-[12.5px]">
            <Plus size={15} /> Record Payment
          </PrimaryButton>
        </div>
      </div>

      {addSuccess && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success font-medium">
          <CheckCircle2 size={17} /> {addSuccess}
        </div>
      )}

      {/* 2. Platform Financial Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Collected (FY 2082/83)"
          value={fmtRs(totalCollected)}
          icon={DollarSign}
          tone="accent"
        />
        <StatCard
          label="Current Month Collections"
          value="Rs. 4,60,000"
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Paid Invoices"
          value={`${payments.filter((p) => p.status === "PAID").length} Invoices`}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Pending Verification"
          value={`${payments.filter((p) => p.status === "PENDING").length} Cheque / Transfer`}
          icon={Clock}
          tone="warning"
        />
      </div>

      {/* 3. Search & Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-1 min-w-[280px] items-center gap-2.5 rounded-xl border border-border bg-bg px-3.5 py-2 text-text transition-colors focus-within:border-accent">
          <Search size={16} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search payments by station name (ABC Pump), invoice #, or transaction reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[13px] text-text placeholder:text-text-muted/60 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[12.5px]">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Filter size={13} /> Status:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          <div className="flex items-center gap-1.5 text-text-muted ml-2">
            Method:
          </div>
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
          >
            <option value="ALL">All Methods</option>
            <option value="NABIL_BANK_TRANSFER">Bank Transfer (NABIL)</option>
            <option value="FONEPAY_QR">Fonepay QR</option>
            <option value="BANK_CHEQUE">Bank Cheque</option>
            <option value="CASH">Direct Cash</option>
          </select>
        </div>
      </div>

      {/* 4. Payments Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px] min-w-[900px]">
            <thead className="border-b border-border bg-surface-hi text-[11px] font-semibold uppercase tracking-wider text-text-muted font-data">
              <tr>
                <th className="px-4 py-3.5">INVOICE #</th>
                <th className="px-3 py-3.5">STATION</th>
                <th className="px-3 py-3.5">PLAN TIER</th>
                <th className="px-3 py-3.5 text-right font-bold">AMOUNT</th>
                <th className="px-3 py-3.5">PAYMENT DATE</th>
                <th className="px-3 py-3.5">METHOD & REF</th>
                <th className="px-3 py-3.5 text-center">STATUS</th>
                <th className="px-4 py-3.5 text-right">INVOICE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted font-body">
                    No subscription payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-hi/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-accent">
                      {p.invoiceNo}
                    </td>

                    <td className="px-3 py-3.5 font-body">
                      <div className="font-bold text-text text-[13px]">{p.stationName}</div>
                      <div className="font-mono text-[10.5px] text-text-muted">slug: {p.slug}</div>
                    </td>

                    <td className="px-3 py-3.5 font-body text-text-muted text-[12px]">
                      {p.planName}
                    </td>

                    <td className="px-3 py-3.5 text-right font-bold text-accent text-[13.5px]">
                      {fmtRs(p.amountNpr)}
                    </td>

                    <td className="px-3 py-3.5 text-text text-[12px]">
                      {p.dateBS}
                    </td>

                    <td className="px-3 py-3.5 font-body">
                      <div className="font-medium text-text text-[11.5px]">
                        {p.paymentMode.replace(/_/g, " ")}
                      </div>
                      <div className="font-mono text-[10.5px] text-text-muted">
                        {p.referenceCode}
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-center">
                      <Badge tone={p.status === "PAID" ? "success" : p.status === "PENDING" ? "warning" : "error"}>
                        {p.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5 text-right font-body">
                      <GhostButton
                        onClick={() => setSelectedInvoice(p)}
                        className="px-2.5 py-1 text-[11px]"
                      >
                        <Receipt size={13} /> View Invoice
                      </GhostButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. Modal: View Official SaaS VAT Tax Invoice                              */}
      {/* ========================================================================= */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[#1A1306]">
                  <Receipt size={16} />
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-bold text-text">
                    Tax Invoice: {selectedInvoice.invoiceNo}
                  </h3>
                  <div className="text-[11px] text-text-muted">
                    SaaS Software License Billing
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-white/10 hover:text-text cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-[12.5px]">
              <div className="rounded-xl border border-border bg-bg p-4 space-y-3">
                <div className="text-center border-b border-dashed border-border pb-2.5">
                  <div className="font-bold text-text text-sm">Nepal PetroCloud Technologies Pvt. Ltd.</div>
                  <div className="text-[11px] text-text-muted">Baneshwor, Kathmandu · PAN: 601928374</div>
                  <div className="font-mono text-xs text-accent font-bold mt-1">TAX INVOICE (कर बिजक)</div>
                </div>

                <div className="flex justify-between text-xs">
                  <div>
                    <span className="text-text-muted">Billed To:</span>
                    <div className="font-bold text-text">{selectedInvoice.stationName}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-text-muted">Date (BS):</span>
                    <div className="font-bold text-text">{selectedInvoice.dateBS}</div>
                  </div>
                </div>

                <div className="border-t border-dashed border-border pt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>{selectedInvoice.planName}</span>
                    <span className="font-bold font-data">{fmtRs(selectedInvoice.amountNpr)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-text-muted">
                    <span>13% Nepal VAT included</span>
                    <span className="font-data">{fmtRs(Math.round(selectedInvoice.amountNpr * 0.13 / 1.13))}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-2 flex justify-between font-bold text-accent text-sm">
                  <span>Total Amount Paid:</span>
                  <span className="font-data">{fmtRs(selectedInvoice.amountNpr)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <GhostButton onClick={() => window.print()} className="text-xs">
                <Printer size={13} /> Print Tax Bill
              </GhostButton>
              <GhostButton onClick={() => setSelectedInvoice(null)}>
                Close
              </GhostButton>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Modal: Record Manual Software Payment                                  */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleRecordPayment}
            className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[#1A1306]">
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-bold text-text">
                    Record Software Payment
                  </h3>
                  <div className="text-[11px] text-text-muted">
                    Log a received license fee from a petrol station
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-white/10 hover:text-text cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-[12.5px]">
              <Field label="Station Name" htmlFor="npStation">
                <Input
                  id="npStation"
                  value={newStation}
                  onChange={(e) => setNewStation(e.target.value)}
                  placeholder="e.g. ABC Petrol Pump"
                  required
                />
              </Field>

              <Field label="Amount Paid (NPR)" htmlFor="npAmt">
                <Input
                  id="npAmt"
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  required
                />
              </Field>

              <div>
                <label className="text-xs font-medium text-text block mb-1">
                  Payment Mode
                </label>
                <select
                  value={newMode}
                  onChange={(e) => setNewMode(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-bg p-2.5 text-xs text-text"
                >
                  <option value="NABIL_BANK_TRANSFER">Bank Transfer (NABIL / Corporate)</option>
                  <option value="FONEPAY_QR">Fonepay Dynamic QR</option>
                  <option value="BANK_CHEQUE">Account Payee Cheque</option>
                  <option value="CASH">Direct Cash Collection</option>
                </select>
              </div>

              <Field label="Reference / Cheque # (Optional)" htmlFor="npRef">
                <Input
                  id="npRef"
                  value={newRef}
                  onChange={(e) => setNewRef(e.target.value)}
                  placeholder="e.g. TXN-9912048 / Cheque #8812"
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
              <GhostButton type="button" onClick={() => setShowAddModal(false)}>
                Cancel
              </GhostButton>
              <PrimaryButton type="submit">
                Record Payment
              </PrimaryButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
