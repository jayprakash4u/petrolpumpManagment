"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ListOrdered,
  Plus,
  Search,
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  CheckCircle2,
  TrendingUp,
  Fuel,
  Ban,
  Car,
  User,
  Clock,
  Edit,
  RotateCcw,
  CheckSquare,
  Square,
  SlidersHorizontal,
  CreditCard,
  Banknote,
  QrCode,
  Hash,
  CalendarRange,
  ArrowUpDown,
} from "lucide-react";
import { clsx } from "clsx";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { fmtRs, fmtL } from "@/lib/money";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { PrintReceiptModal } from "@/components/sales/PrintReceiptModal";
import { EditBillModal } from "@/components/sales/EditBillModal";
import { BillDetailsModal } from "@/components/sales/BillDetailsModal";
import { NewSaleModal } from "@/components/sales/NewSaleModal";
import { VoidSaleButton } from "@/components/sales/VoidSaleButton";
import type { BillsPageData, SerializedBillItem } from "@/lib/queries/bills";
import { billQueryString, type BillFilters } from "@/lib/bill-filters";
import { toDateInput, parseDateInput } from "@/lib/reports";
import { fiscalYearOf } from "@/lib/bs-date";

/** 13% is Nepal's standard VAT rate — the same split used in the IRD CSV export below. */
function vatSplit(amount: number): { taxable: number; vat: number } {
  const taxable = Math.round((amount / 1.13) * 100) / 100;
  return { taxable, vat: Math.round((amount - taxable) * 100) / 100 };
}

type SortField = "date" | "receipt" | "amount";
type SortDir = "asc" | "desc";

export function ListBillsView({
  initialData,
  filters,
  canVoid,
  canSell = false,
}: {
  initialData: BillsPageData;
  filters: BillFilters;
  canVoid: boolean;
  canSell?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavPending, startNav] = useTransition();

  const [bills, setBills] = useState<SerializedBillItem[]>(initialData.bills);
  const [billQuery, setBillQuery] = useState(filters.search || "");
  const [nameQuery, setNameQuery] = useState("");
  const [fuelFilter, setFuelFilter] = useState<string>(filters.fuel || "ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>(filters.payment || "ALL");
  const [statusFilter, setStatusFilter] = useState<string>(filters.status || "all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // The register is fetched per date window server-side (see getBillsPageData);
  // these two only take effect once "Search" below re-requests the page with
  // a new range — everything else on this screen filters instantly client-side.
  const [fromDate, setFromDate] = useState(toDateInput(filters.range.from));
  const [toDate, setToDate] = useState(toDateInput(filters.range.to));

  const customerPanById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of initialData.customers) {
      if (c.panNo) map.set(c.id, c.panNo);
    }
    return map;
  }, [initialData.customers]);

  const handleDateSearch = () => {
    const from = parseDateInput(fromDate);
    const to = parseDateInput(toDate);
    if (!from || !to) return;
    const qs = billQueryString(filters, {
      preset: "custom",
      from: toDateInput(from),
      to: toDateInput(to),
    });
    startNav(() => router.push(`${pathname}${qs}`));
  };

  // Selection & Modal States
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set());
  const [viewingBill, setViewingBill] = useState<any | null>(null);
  const [printingBill, setPrintingBill] = useState<any | null>(null);
  const [editingBill, setEditingBill] = useState<any | null>(null);
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Client-side instant filter on current dataset
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (statusFilter === "active" && b.voided) return false;
      if (statusFilter === "voided" && !b.voided) return false;

      if (fuelFilter !== "ALL" && b.fuel !== fuelFilter) return false;

      if (paymentFilter !== "ALL") {
        if (paymentFilter === "ONLINE" && b.payment !== "ONLINE") return false;
        if (paymentFilter === "CASH" && b.payment !== "CASH") return false;
        if (paymentFilter === "CARD" && b.payment !== "CARD") return false;
        if (paymentFilter === "CREDIT" && b.payment !== "CREDIT") return false;
      }

      if (billQuery.trim()) {
        const q = billQuery.toLowerCase().trim();
        const matchNo = String(b.receiptNo).includes(q) || b.billNumber.toLowerCase().includes(q);
        const matchVeh = b.vehicleNo ? b.vehicleNo.toLowerCase().includes(q) : false;
        const matchBy = b.soldBy.toLowerCase().includes(q);
        if (!matchNo && !matchVeh && !matchBy) return false;
      }

      if (nameQuery.trim()) {
        const q = nameQuery.toLowerCase().trim();
        const matchCust = b.customerName ? b.customerName.toLowerCase().includes(q) : false;
        if (!matchCust) return false;
      }

      return true;
    });
  }, [bills, statusFilter, fuelFilter, paymentFilter, billQuery, nameQuery]);

  const sortedBills = useMemo(() => {
    const sorted = [...filteredBills];
    const dir = sortDir === "asc" ? 1 : -1;
    sorted.sort((a, b) => {
      if (sortField === "receipt") return (a.receiptNo - b.receiptNo) * dir;
      if (sortField === "amount") return (a.amount - b.amount) * dir;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    });
    return sorted;
  }, [filteredBills, sortField, sortDir]);

  // Recalculated metrics for current filter
  const currentMetrics = useMemo(() => {
    let count = 0;
    let netAmount = 0;
    let netLiters = 0;
    let voidedCount = 0;
    let voidedAmount = 0;
    let cash = 0;
    let online = 0;
    let credit = 0;

    for (const b of filteredBills) {
      if (b.voided) {
        voidedCount++;
        voidedAmount += b.amount;
      } else {
        count++;
        netAmount += b.amount;
        netLiters += b.liters;
        if (b.payment === "CASH") cash += b.amount;
        else if (b.payment === "ONLINE") online += b.amount;
        else if (b.payment === "CREDIT") credit += b.amount;
      }
    }

    return { count, netAmount, netLiters, voidedCount, voidedAmount, cash, online, credit };
  }, [filteredBills]);

  // Vehicle History Intelligence
  const vehicleStats = useMemo(() => {
    const q = billQuery.trim().toUpperCase();
    if (q.length >= 4) {
      const match = bills.filter((b) => b.vehicleNo && b.vehicleNo.toUpperCase().includes(q));
      if (match.length > 0) {
        return {
          plate: match[0].vehicleNo || q,
          visits: match.length,
          liters: match.reduce((sum, b) => sum + b.liters, 0),
          spend: match.reduce((sum, b) => sum + b.amount, 0),
        };
      }
    }
    return null;
  }, [billQuery, bills]);

  const handleSelectAll = () => {
    if (selectedBillIds.size === filteredBills.length) {
      setSelectedBillIds(new Set());
    } else {
      setSelectedBillIds(new Set(filteredBills.map((b) => b.id)));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedBillIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportCSV = () => {
    const exportRows = selectedBillIds.size > 0
      ? filteredBills.filter((b) => selectedBillIds.has(b.id))
      : filteredBills;

    const headers = [
      "Receipt No",
      "Bill Number",
      "Date BS",
      "Time",
      "Fuel Product",
      "Volume (Liters)",
      "Rate (NPR/L)",
      "Total Amount (NPR)",
      "Payment Mode",
      "Vehicle Plate",
      "Customer",
      "Attendant",
      "Status",
    ];

    const rows = exportRows.map((b) => [
      `"${b.receiptNo}"`,
      `"${b.billNumber}"`,
      `"${b.dateBS}"`,
      `"${b.time}"`,
      `"${b.fuel}"`,
      `"${b.liters}"`,
      `"${b.rate}"`,
      `"${b.amount}"`,
      `"${b.payment}"`,
      `"${b.vehicleNo || ""}"`,
      `"${b.customerName || "Walk-In"}"`,
      `"${b.soldBy}"`,
      `"${b.voided ? "VOIDED RETURN" : "PAID"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `bill_register_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);
  };

  const handleExportIRDAnnexure5 = () => {
    const exportRows = selectedBillIds.size > 0
      ? filteredBills.filter((b) => selectedBillIds.has(b.id))
      : filteredBills;

    const headers = [
      "मिति (BS Date)",
      "बीजक नं (Invoice #)",
      "खरिदकर्ताको नाम (Buyer Name)",
      "खरिदकर्ताको प्यान (Buyer PAN)",
      "वस्तु/सेवाको नाम (Product)",
      "परिमाण (Qty L)",
      "दर (Rate)",
      "जम्मा रकम (Total NPR)",
      "करयोग्य रकम (Taxable Amount)",
      "१३% भ्याट (13% VAT)",
    ];

    const rows = exportRows.map((b) => {
      const taxable = (b.amount / 1.13).toFixed(2);
      const vat = (b.amount - Number(taxable)).toFixed(2);
      return [
        `"${b.dateBS}"`,
        `"${b.billNumber}"`,
        `"${b.customerName || "Retail Walk-In"}"`,
        `"N/A"`,
        `"${FUEL_LABEL[b.fuel as FuelId]}"`,
        `"${b.liters}"`,
        `"${b.rate}"`,
        `"${b.amount}"`,
        `"${taxable}"`,
        `"${vat}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `ird_annexure_5_sales_book_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);
  };

  const handleBatchPrint = () => {
    window.print();
  };

  const getPaymentBadge = (method: string, custName?: string | null) => {
    switch (method) {
      case "CASH":
        return <Badge tone="success">CASH</Badge>;
      case "ONLINE":
        return <Badge tone="accent">QR / FONEPAY</Badge>;
      case "CARD":
        return <Badge tone="accent">POS CARD</Badge>;
      case "CREDIT":
        return <Badge tone="muted">{custName || "CREDIT"}</Badge>;
      default:
        return <Badge tone="muted">{method}</Badge>;
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. Executive Title & Export Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <ListOrdered size={22} />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Bill Register & Sales Ledger (बिक्री बिल दर्ता खाता)
            </h2>
            <p className="text-[12px] text-text-muted">
              Live fuel invoice ledger, thermal duplicate slips, vehicle fleet audit, and IRD statutory reporting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedBillIds.size > 0 && (
            <PrimaryButton
              type="button"
              onClick={handleBatchPrint}
              className="text-[12.5px] px-3 py-1.5"
            >
              <Printer size={14} /> Batch Print ({selectedBillIds.size})
            </PrimaryButton>
          )}

          {/* Export Dropdown */}
          <div className="relative">
            <GhostButton
              type="button"
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="text-[12.5px]"
            >
              <Download size={14} /> Export Register <span className="text-[10px]">▼</span>
            </GhostButton>

            {isExportOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-40 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-2xl animate-fade-in">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] text-text hover:bg-surface-hi transition-colors"
                >
                  <FileSpreadsheet size={14} className="text-success" /> Standard CSV (.csv)
                </button>
                <button
                  type="button"
                  onClick={handleExportIRDAnnexure5}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] text-text hover:bg-surface-hi transition-colors"
                >
                  <FileText size={14} className="text-accent" /> IRD Sales Book (अनुसूची ५)
                </button>
                <button
                  type="button"
                  onClick={handleBatchPrint}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] text-text hover:bg-surface-hi transition-colors"
                >
                  <Printer size={14} className="text-text-muted" /> Print Statement (PDF)
                </button>
              </div>
            )}
          </div>

          {canSell && (
            <PrimaryButton
              type="button"
              onClick={() => setIsNewSaleOpen(true)}
              className="text-[12.5px] px-3.5 py-2"
            >
              <Plus size={15} /> Create Bill (नयाँ बिल)
            </PrimaryButton>
          )}
        </div>
      </div>

      {/* 2. Search, Filter & Slicing Command Strip */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-3.5 shadow-xs">
        {/* Search By: two distinct fields, plus the status slicer */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-50 flex-1">
            <label className="mb-1 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-text-muted">
              <Hash size={12} /> Bill Number / Vehicle
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2 transition-colors focus-within:border-accent">
              <Search size={14} className="text-text-muted shrink-0" />
              <input
                type="text"
                value={billQuery}
                onChange={(e) => setBillQuery(e.target.value)}
                placeholder="e.g. 1025 or BA 2 PA 1234"
                className="w-full bg-transparent text-[13px] text-text focus:outline-none"
              />
              {billQuery && (
                <button type="button" onClick={() => setBillQuery("")} className="shrink-0 text-[11px] text-text-muted hover:text-text">
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="min-w-50 flex-1">
            <label className="mb-1 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-text-muted">
              <User size={12} /> Customer Name
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2 transition-colors focus-within:border-accent">
              <Search size={14} className="text-text-muted shrink-0" />
              <input
                type="text"
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder="e.g. Ram Shah"
                className="w-full bg-transparent text-[13px] text-text focus:outline-none"
              />
              {nameQuery && (
                <button type="button" onClick={() => setNameQuery("")} className="shrink-0 text-[11px] text-text-muted hover:text-text">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Status Slicer */}
          <div className="flex gap-1 rounded-xl border border-border bg-bg p-1 text-[12px]">
            {(
              [
                { id: "all", label: "All Bills" },
                { id: "active", label: "Active Only" },
                { id: "voided", label: "Voided Returns" },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={clsx(
                  "rounded-lg px-3 py-1.5 font-semibold transition-colors",
                  statusFilter === st.id
                    ? "bg-accent/15 text-accent"
                    : "text-text-muted hover:text-text"
                )}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search by Date + Sort */}
        <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3.5">
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-text-muted">
              <CalendarRange size={12} /> From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-text-muted">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
            />
          </div>
          <PrimaryButton
            type="button"
            onClick={handleDateSearch}
            disabled={isNavPending}
            className="px-4 py-1.75 text-[12px]"
          >
            {isNavPending ? "Loading…" : "Search"}
          </PrimaryButton>

          <div className="ml-1">
            <label className="mb-1 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-text-muted">
              <ArrowUpDown size={12} /> Sort By
            </label>
            <div className="flex gap-1.5">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
              >
                <option value="date">Date</option>
                <option value="receipt">Bill No</option>
                <option value="amount">Amount</option>
              </select>
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as SortDir)}
                className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
          </div>

          <span className="ml-auto pb-1.5 text-[12px] text-text-muted font-data">
            Register window: <strong className="text-text">{toDateInput(filters.range.from)}</strong> to{" "}
            <strong className="text-text">{toDateInput(filters.range.to)}</strong>
          </span>
        </div>

        {/* Dropdown Filters Strip */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-[12.5px]">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Filter size={13} /> Fuel:
          </div>
          <select
            value={fuelFilter}
            onChange={(e) => setFuelFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
          >
            <option value="ALL">All Fuel Types</option>
            <option value="PETROL">Petrol (MS 91)</option>
            <option value="DIESEL">Diesel (HSD)</option>
            <option value="CNG">CNG</option>
          </select>

          <div className="flex items-center gap-1.5 text-text-muted ml-2">
            Payment Mode:
          </div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="CASH">Cash (नगद)</option>
            <option value="ONLINE">QR / Wallet (Fonepay/eSewa)</option>
            <option value="CARD">Card / POS</option>
            <option value="CREDIT">Credit (खाता)</option>
          </select>

          <span className="text-[12px] text-text-muted ml-auto font-data">
            Showing <strong>{filteredBills.length}</strong> of {bills.length} invoices
          </span>
        </div>
      </div>

      {/* 4. Vehicle History Intelligence Card */}
      {vehicleStats && (
        <div className="animate-fade-in flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
              <Car size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-text text-[15px]">
                  Vehicle Fleet Consumption:
                </span>
                <span className="font-mono bg-bg px-2.5 py-0.5 rounded text-[13px] font-bold text-accent">
                  {vehicleStats.plate}
                </span>
              </div>
              <div className="text-[12px] text-text-muted mt-0.5">
                Matched <strong>{vehicleStats.visits}</strong> dispenses · Total Volume:{" "}
                <strong>{fmtL(vehicleStats.liters)}</strong> · Total Value:{" "}
                <strong>{fmtRs(vehicleStats.spend)}</strong>
              </div>
            </div>
          </div>
          <span className="text-[11.5px] text-accent font-semibold">
            Filtered below in register ↓
          </span>
        </div>
      )}

      {/* 5. The Master Bill Register Data Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px] min-w-295">
            <thead className="border-b border-border bg-surface-hi text-[11px] font-semibold uppercase tracking-wider text-text-muted font-data">
              <tr>
                <th className="px-3 py-3 text-center w-10">
                  <button type="button" onClick={handleSelectAll} className="cursor-pointer">
                    {selectedBillIds.size === filteredBills.length && filteredBills.length > 0 ? (
                      <CheckSquare size={15} className="text-accent" />
                    ) : (
                      <Square size={15} className="text-text-muted" />
                    )}
                  </button>
                </th>
                <th className="px-2 py-3 text-center">S.NO</th>
                <th className="px-3 py-3">RECEIPT</th>
                <th className="px-3 py-3">DATE (BS) & TIME</th>
                <th className="px-3 py-3">FISCAL YR</th>
                <th className="px-3 py-3">VEHICLE</th>
                <th className="px-3 py-3">CUSTOMER</th>
                <th className="px-3 py-3">CUSTOMER PAN</th>
                <th className="px-3 py-3">FUEL</th>
                <th className="px-3 py-3 text-right">VOLUME</th>
                <th className="px-3 py-3 text-right">RATE</th>
                <th className="px-3 py-3 text-right">TAXABLE</th>
                <th className="px-3 py-3 text-right">VAT</th>
                <th className="px-4 py-3 text-right font-bold">GRAND TOTAL</th>
                <th className="px-3 py-3 text-center">PAYMENT</th>
                <th className="px-3 py-3">ADDED BY</th>
                <th className="px-3 py-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {sortedBills.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-text-muted font-body">
                    No bills found matching the selected filters.
                  </td>
                </tr>
              ) : (
                sortedBills.map((b, idx) => {
                  const isChecked = selectedBillIds.has(b.id);
                  const fuelId = b.fuel as FuelId;
                  const { taxable, vat } = vatSplit(b.amount);
                  const fiscalYear = fiscalYearOf(new Date(b.createdAt));
                  const customerPan = b.customerId ? customerPanById.get(b.customerId) : undefined;

                  return (
                    <tr
                      key={b.id}
                      className={clsx(
                        "hover:bg-surface-hi/70 transition-colors",
                        isChecked && "bg-accent/5",
                        b.voided && "opacity-60 bg-error/5"
                      )}
                    >
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleRow(b.id)}
                          className="cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare size={15} className="text-accent" />
                          ) : (
                            <Square size={15} className="text-text-muted" />
                          )}
                        </button>
                      </td>

                      <td className="px-2 py-3 text-center text-text-muted">{idx + 1}</td>

                      <td className="px-3 py-3 font-mono font-bold text-accent">
                        <button
                          type="button"
                          onClick={() => setViewingBill(b)}
                          className="hover:underline cursor-pointer"
                          title="Click to view full bill details"
                        >
                          #{b.receiptNo}
                        </button>
                      </td>

                      <td className="px-3 py-3">
                        <div className="font-semibold text-text">{b.dateBS}</div>
                        <div className="text-[11px] text-text-muted">{b.time}</div>
                      </td>

                      <td className="px-3 py-3 font-body text-text-muted">
                        {fiscalYear ?? "—"}
                      </td>

                      <td className="px-3 py-3 font-body">
                        {b.vehicleNo ? (
                          <span className="font-mono bg-bg border border-border px-2 py-0.5 rounded text-[11.5px] font-bold text-text">
                            {b.vehicleNo}
                          </span>
                        ) : (
                          <span className="text-[11.5px] text-text-muted">—</span>
                        )}
                      </td>

                      <td className="px-3 py-3 font-body font-medium text-text">
                        {b.customerName || (
                          <span className="text-text-muted text-[11.5px]">Walk-In Cash</span>
                        )}
                      </td>

                      <td className="px-3 py-3 font-mono text-[11.5px] text-text-muted">
                        {customerPan || "—"}
                      </td>

                      <td className="px-3 py-3 font-body">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={clsx(
                              "h-2 w-2 rounded-full",
                              fuelId === "PETROL"
                                ? "bg-amber-500"
                                : fuelId === "DIESEL"
                                ? "bg-blue-500"
                                : "bg-emerald-500"
                            )}
                          />
                          <span className="font-medium text-text">{FUEL_LABEL[fuelId]}</span>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-right font-medium text-text">
                        {fmtL(b.liters)}
                      </td>

                      <td className="px-3 py-3 text-right text-text-muted">
                        Rs {b.rate.toFixed(2)}
                      </td>

                      <td className="px-3 py-3 text-right text-text-muted">
                        {fmtRs(taxable)}
                      </td>

                      <td className="px-3 py-3 text-right text-text-muted">
                        {fmtRs(vat)}
                      </td>

                      <td
                        className={clsx(
                          "px-4 py-3 text-right font-bold text-[13.5px]",
                          b.voided ? "line-through text-text-muted" : "text-text"
                        )}
                      >
                        {fmtRs(b.amount)}
                      </td>

                      <td className="px-3 py-3 text-center font-body">
                        {b.voided ? (
                          <Badge tone="error">VOIDED</Badge>
                        ) : (
                          getPaymentBadge(b.payment, b.customerName)
                        )}
                      </td>

                      <td className="px-3 py-3 font-body text-[12px] text-text-muted">
                        {b.soldBy}
                      </td>

                      <td className="px-3 py-3 text-right font-body">
                        <div className="flex items-center justify-end gap-1">
                          {/* Print Duplicate Button */}
                          <GhostButton
                            type="button"
                            onClick={() =>
                              setPrintingBill({
                                id: b.id,
                                receiptNo: b.receiptNo,
                                billNumber: b.billNumber,
                                fuel: b.fuel,
                                liters: b.liters,
                                ratePerL: b.rate,
                                totalAmount: b.amount,
                                paymentMethod: b.payment,
                                customerName: b.customerName,
                                vehicleNo: b.vehicleNo,
                                soldByName: b.soldBy,
                                createdAt: b.createdAt,
                              })
                            }
                            className="px-2 py-1 text-[11.5px]"
                            title="Print Duplicate Receipt"
                          >
                            <Printer size={13} />
                          </GhostButton>

                          {/* Edit Bill Button */}
                          {canVoid && !b.voided && (
                            <GhostButton
                              type="button"
                              onClick={() =>
                                setEditingBill({
                                  id: b.id,
                                  receiptNo: b.receiptNo,
                                  fuel: b.fuel,
                                  liters: b.liters,
                                  ratePerL: b.rate,
                                  totalAmount: b.amount,
                                  paymentMethod: b.payment,
                                  vehicleNo: b.vehicleNo,
                                  customerId: b.customerId,
                                  customerName: b.customerName,
                                  soldByName: b.soldBy,
                                  createdAt: b.createdAt,
                                })
                              }
                              className="px-2 py-1 text-[11.5px]"
                              title="Edit Bill Information"
                            >
                              <Edit size={13} />
                            </GhostButton>
                          )}

                          {/* View Details Drawer */}
                          <GhostButton
                            type="button"
                            onClick={() => setViewingBill(b)}
                            className="px-2 py-1 text-[11.5px]"
                            title="View Full Bill Details"
                          >
                            View
                          </GhostButton>

                          {/* Void Action */}
                          {canVoid && !b.voided && (
                            <VoidSaleButton saleId={b.id} receiptNo={b.receiptNo} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Print Thermal Slip Modal */}
      {printingBill && (
        <PrintReceiptModal
          sale={printingBill}
          stationName={initialData.stationName}
          business={initialData.invoiceConfig}
          settings={initialData.invoiceConfig}
          onClose={() => setPrintingBill(null)}
        />
      )}

      {/* 6.5 New Sale / Bill Creation Modal */}
      {isNewSaleOpen && (
        <NewSaleModal
          onClose={() => setIsNewSaleOpen(false)}
          tanks={(initialData.tanks || []).map((t) => ({
            id: t.id,
            fuel: t.fuel as any,
            ratePerL: String(t.ratePerL),
            levelL: String(t.levelL),
          }))}
          customers={initialData.customers}
          canSell={canSell}
          invoiceConfig={initialData.invoiceConfig}
        />
      )}

      {/* 7. Edit Bill Modal */}
      {editingBill && (
        <EditBillModal
          sale={editingBill}
          customers={initialData.customers}
          onClose={() => setEditingBill(null)}
          onSaved={() => {
            // Updated in DB via server action
          }}
        />
      )}

      {/* 8. Full Bill Details Slide-Over Modal */}
      {viewingBill && (
        <BillDetailsModal
          sale={{
            id: viewingBill.id,
            receiptNo: viewingBill.receiptNo,
            billNumber: viewingBill.billNumber,
            vehicleNo: viewingBill.vehicleNo,
            fuel: viewingBill.fuel,
            liters: viewingBill.liters,
            ratePerL: viewingBill.rate,
            totalAmount: viewingBill.amount,
            paymentMethod: viewingBill.payment,
            createdAt: viewingBill.createdAt,
            formattedTime: viewingBill.time,
            formattedDateBS: viewingBill.dateBS,
            customerName: viewingBill.customerName,
            customerId: viewingBill.customerId,
            soldByName: viewingBill.soldBy,
            tankId: "",
            voided: viewingBill.voided,
            voidReason: viewingBill.voidReason,
            voidedAt: viewingBill.voidedAt,
          }}
          canVoid={canVoid}
          customers={initialData.customers}
          stationName={initialData.stationName}
          business={initialData.invoiceConfig}
          settings={initialData.invoiceConfig}
          onClose={() => setViewingBill(null)}
          onSaleVoided={(voidedId) => {
            setBills((prev) =>
              prev.map((b) =>
                b.id === voidedId
                  ? { ...b, voided: true, voidReason: "Reversed / Voided" }
                  : b
              )
            );
          }}
          onSaleEdited={(updated) => {
            setBills((prev) =>
              prev.map((b) =>
                b.id === updated.id
                  ? {
                      ...b,
                      vehicleNo: updated.vehicleNo,
                      payment: updated.paymentMethod,
                      customerId: updated.customerId,
                      customerName: updated.customerName,
                    }
                  : b
              )
            );
          }}
        />
      )}
    </div>
  );
}
