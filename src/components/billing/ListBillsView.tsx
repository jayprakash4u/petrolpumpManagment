"use client";

import { useState, useMemo, useTransition, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
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
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Eye,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { clsx } from "clsx";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
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

/** 13% is Nepal's standard VAT rate — matching IRD compliance specifications */
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
  const tableRef = useRef<HTMLDivElement>(null);

  const [bills, setBills] = useState<SerializedBillItem[]>(initialData.bills);
  const [billQuery, setBillQuery] = useState(filters.search || "");
  const [nameQuery, setNameQuery] = useState("");
  const [fuelFilter, setFuelFilter] = useState<string>(filters.fuel || "ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>(filters.payment || "ALL");
  const [statusFilter, setStatusFilter] = useState<string>(filters.status || "all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showStats, setShowStats] = useState(true);

  // Server-side date range states
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

  const handleDatePreset = (daysAgo: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysAgo);
    setFromDate(toDateInput(start));
    setToDate(toDateInput(end));
    const qs = billQueryString(filters, {
      preset: "custom",
      from: toDateInput(start),
      to: toDateInput(end),
    });
    startNav(() => router.push(`${pathname}${qs}`));
  };

  const scrollTable = (offset: number) => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Modal States
  const [viewingBill, setViewingBill] = useState<any | null>(null);
  const [printingBill, setPrintingBill] = useState<any | null>(null);
  const [editingBill, setEditingBill] = useState<any | null>(null);
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);

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
        const custPan = b.customerId ? customerPanById.get(b.customerId) : null;
        const matchPan = custPan ? custPan.includes(q) : false;
        if (!matchCust && !matchPan) return false;
      }

      return true;
    });
  }, [bills, statusFilter, fuelFilter, paymentFilter, billQuery, nameQuery, customerPanById]);

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

  // Recalculated live metrics for current filter view
  const currentMetrics = useMemo(() => {
    let count = 0;
    let netAmount = 0;
    let netLiters = 0;
    let taxableAmount = 0;
    let vatAmount = 0;
    let voidedCount = 0;
    let voidedAmount = 0;
    let cash = 0;
    let online = 0;
    let credit = 0;
    let card = 0;

    for (const b of filteredBills) {
      if (b.voided) {
        voidedCount++;
        voidedAmount += b.amount;
      } else {
        count++;
        netAmount += b.amount;
        netLiters += b.liters;
        const { taxable, vat } = vatSplit(b.amount);
        taxableAmount += taxable;
        vatAmount += vat;

        if (b.payment === "CASH") cash += b.amount;
        else if (b.payment === "ONLINE") online += b.amount;
        else if (b.payment === "CARD") card += b.amount;
        else if (b.payment === "CREDIT") credit += b.amount;
      }
    }

    return {
      count,
      netAmount,
      netLiters,
      taxableAmount,
      vatAmount,
      voidedCount,
      voidedAmount,
      cash,
      online,
      credit,
      card,
    };
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

  const handleExportCSV = () => {
    const exportRows = filteredBills;

    const headers = [
      "S.No",
      "Bill Number",
      "Bill Date BS",
      "Time",
      "Fiscal Year",
      "Station PAN",
      "Customer Name",
      "Customer PAN",
      "Fuel Product",
      "Quantity (Liters)",
      "Rate (NPR/L)",
      "Subtotal (NPR)",
      "Discount",
      "Taxable Amount",
      "VAT (13%)",
      "Grand Total (NPR)",
      "Payment Mode",
      "IRD Sync",
      "Added By",
      "Status",
      "Vehicle Plate",
    ];

    const rows = exportRows.map((b, idx) => {
      const { taxable, vat } = vatSplit(b.amount);
      const custPan = b.customerId ? customerPanById.get(b.customerId) : "";
      const fiscalYear = fiscalYearOf(new Date(b.createdAt)) || "2083/84";
      return [
        idx + 1,
        `"${b.billNumber}"`,
        `"${b.dateBS}"`,
        `"${b.time}"`,
        `"${fiscalYear}"`,
        `"${initialData.invoiceConfig?.panNo || "300066034"}"`,
        `"${b.customerName || "CASH"}"`,
        `"${custPan || ""}"`,
        `"${FUEL_LABEL[b.fuel as FuelId] || b.fuel}"`,
        b.liters.toFixed(2),
        b.rate.toFixed(2),
        taxable.toFixed(2),
        "0.00",
        taxable.toFixed(2),
        vat.toFixed(2),
        b.amount.toFixed(2),
        `"${b.payment}"`,
        `"${b.voided ? "RETURNED" : "YES"}"`,
        `"${b.soldBy}"`,
        `"${b.voided ? "VOIDED" : "ACTIVE"}"`,
        `"${b.vehicleNo || ""}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `bills_register_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportIRDAnnexure5 = () => {
    const exportRows = filteredBills;

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
      const { taxable, vat } = vatSplit(b.amount);
      const custPan = b.customerId ? customerPanById.get(b.customerId) : "N/A";
      return [
        `"${b.dateBS}"`,
        `"${b.billNumber}"`,
        `"${b.customerName || "Retail Walk-In"}"`,
        `"${custPan || "N/A"}"`,
        `"${FUEL_LABEL[b.fuel as FuelId] || b.fuel}"`,
        `"${b.liters.toFixed(2)}"`,
        `"${b.rate.toFixed(2)}"`,
        `"${b.amount.toFixed(2)}"`,
        `"${taxable.toFixed(2)}"`,
        `"${vat.toFixed(2)}"`,
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
  };

  const handleBatchPrint = () => {
    window.print();
  };

  const getPaymentBadge = (method: string) => {
    switch (method) {
      case "CASH":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Banknote size={11} /> Cash
          </span>
        );
      case "ONLINE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <QrCode size={11} /> Fonepay
          </span>
        );
      case "CARD":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <CreditCard size={11} /> POS Card
          </span>
        );
      case "CREDIT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Building2 size={11} /> Credit
          </span>
        );
      default:
        return <Badge tone="muted">{method}</Badge>;
    }
  };

  const stationPan =
    initialData.invoiceConfig?.panNo ||
    initialData.invoiceConfig?.vatNo ||
    "300066034";

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <GhostButton
            type="button"
            onClick={() => router.back()}
            className="h-8 px-3 text-xs font-semibold border border-border bg-surface hover:bg-surface-hi flex items-center gap-1.5 cursor-pointer rounded-lg text-text hover:text-accent transition-colors shadow-xs"
            title="Return to Sales Operations"
          >
            <ArrowLeft size={13} /> Back
          </GhostButton>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl font-black text-text tracking-tight flex items-center gap-2">
                Bills <span className="text-accent">Register</span>
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-semibold text-text-muted font-mono">
                {filteredBills.length} {filteredBills.length === 1 ? "bill" : "bills"}
              </span>
            </div>
            <p className="text-[11.5px] text-text-muted hidden sm:block">
              Comprehensive tax invoices, IRD Annexure-5 sales book, audit logs, and reprint center.
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <GhostButton
            type="button"
            onClick={() => setShowStats((prev) => !prev)}
            className="h-8 px-3 text-xs font-semibold border border-border bg-surface flex items-center gap-1.5 hover:bg-surface-hi rounded-lg"
            title="Toggle summary KPI stats"
          >
            <TrendingUp size={13} className="text-accent" />
            <span className="hidden md:inline">{showStats ? "Hide Summary" : "Show Summary"}</span>
          </GhostButton>

          <GhostButton
            type="button"
            onClick={handleBatchPrint}
            className="h-8 px-3 text-xs font-semibold border border-border bg-surface flex items-center gap-1.5 hover:bg-surface-hi rounded-lg"
            title="Batch Print Current Register"
          >
            <Printer size={13} className="text-accent" />
            <span>Print Register</span>
          </GhostButton>

          <GhostButton
            type="button"
            onClick={handleExportCSV}
            className="h-8 px-3 text-xs font-semibold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1.5 rounded-lg"
            title="Export full tabular register to CSV"
          >
            <FileSpreadsheet size={13} />
            <span>Export CSV</span>
          </GhostButton>

          <GhostButton
            type="button"
            onClick={handleExportIRDAnnexure5}
            className="h-8 px-3 text-xs font-semibold border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5 rounded-lg"
            title="Export official IRD Annexure 5 formatted sales book"
          >
            <FileText size={13} />
            <span>IRD Sales Book</span>
          </GhostButton>

          {canSell && (
            <PrimaryButton
              type="button"
              onClick={() => setIsNewSaleOpen(true)}
              className="h-8 px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-xs rounded-lg"
            >
              <Plus size={13} />
              <span>Create Bill</span>
            </PrimaryButton>
          )}
        </div>
      </div>

      {/* 2. Enterprise KPI Metrics Strip (Compact & Responsive) */}
      {showStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 animate-fade-in">
          <div className="rounded-xl border border-border bg-surface px-2.5 py-2 shadow-xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
              Total Invoiced
            </span>
            <div className="font-data font-bold text-[14px] text-text mt-0.5 truncate">
              {fmtRs(currentMetrics.netAmount)}
            </div>
            <span className="text-[9.5px] text-text-muted truncate block">
              {currentMetrics.count} active sales
            </span>
          </div>

          <div className="rounded-xl border border-border bg-surface px-2.5 py-2 shadow-xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
              Taxable Amount
            </span>
            <div className="font-data font-bold text-[14px] text-accent mt-0.5 truncate">
              {fmtRs(currentMetrics.taxableAmount)}
            </div>
            <span className="text-[9.5px] text-text-muted truncate block">Pre-tax turnover</span>
          </div>

          <div className="rounded-xl border border-border bg-surface px-2.5 py-2 shadow-xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
              13% VAT Collected
            </span>
            <div className="font-data font-bold text-[14px] text-emerald-400 mt-0.5 truncate">
              {fmtRs(currentMetrics.vatAmount)}
            </div>
            <span className="text-[9.5px] text-text-muted truncate block">IRD tax</span>
          </div>

          <div className="rounded-xl border border-border bg-surface px-2.5 py-2 shadow-xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
              Volume Dispensed
            </span>
            <div className="font-data font-bold text-[14px] text-text mt-0.5 truncate">
              {fmtL(currentMetrics.netLiters)}
            </div>
            <span className="text-[9.5px] text-text-muted truncate block">Total fuel</span>
          </div>

          <div className="rounded-xl border border-border bg-surface px-2.5 py-2 shadow-xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
              Cash vs Digital
            </span>
            <div className="font-data font-semibold text-[11px] text-text mt-0.5 space-y-0.5">
              <div className="flex justify-between items-center gap-1">
                <span className="text-text-muted text-[10px]">Cash:</span>
                <span className="truncate">{fmtRs(currentMetrics.cash)}</span>
              </div>
              <div className="flex justify-between items-center gap-1">
                <span className="text-text-muted text-[10px]">Digital:</span>
                <span className="truncate">{fmtRs(currentMetrics.online + currentMetrics.card)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface px-2.5 py-2 shadow-xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
              Credit & Returns
            </span>
            <div className="font-data font-semibold text-[11px] text-text mt-0.5 space-y-0.5">
              <div className="flex justify-between items-center gap-1">
                <span className="text-text-muted text-[10px]">Credit:</span>
                <span className="text-purple-400 truncate">{fmtRs(currentMetrics.credit)}</span>
              </div>
              <div className="flex justify-between items-center gap-1">
                <span className="text-text-muted text-[10px]">Void:</span>
                <span className="text-error truncate">
                  {currentMetrics.voidedCount} ({fmtRs(currentMetrics.voidedAmount)})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Dual Search Panels: "Search by Entity" & "Search by Period" */}
      <div className="rounded-2xl border border-border bg-surface p-3.5 sm:p-4 space-y-3 shadow-xs w-full max-w-full min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full min-w-0">
          {/* Left Column: Search by (Bill Number & Customer / PAN) */}
          <div className="lg:col-span-6 space-y-2 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5 truncate">
                <Search size={13} className="text-accent shrink-0" /> Search by Entity
              </h3>
              {(billQuery || nameQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setBillQuery("");
                    setNameQuery("");
                  }}
                  className="text-[11px] text-accent hover:underline cursor-pointer shrink-0"
                >
                  Clear search
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0">
              <div className="min-w-0">
                <label className="text-[11px] font-semibold text-text-muted block mb-1 truncate">
                  Bill / Receipt / Plate
                </label>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Input
                    value={billQuery}
                    onChange={(e) => setBillQuery(e.target.value)}
                    placeholder="e.g. 104, BA-2-PA"
                    className="h-8 px-2.5 text-xs font-mono min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => {}}
                    className="h-8 w-8 shrink-0 rounded-lg bg-accent text-[#1A1306] flex items-center justify-center hover:bg-accent-hover cursor-pointer shadow-xs"
                    title="Search Bill Number"
                  >
                    <Search size={13} />
                  </button>
                </div>
              </div>

              <div className="min-w-0">
                <label className="text-[11px] font-semibold text-text-muted block mb-1 truncate">
                  Customer / PAN / Company
                </label>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Input
                    value={nameQuery}
                    onChange={(e) => setNameQuery(e.target.value)}
                    placeholder="e.g. Acme, 300066034"
                    className="h-8 px-2.5 text-xs font-medium min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => {}}
                    className="h-8 w-8 shrink-0 rounded-lg bg-accent text-[#1A1306] flex items-center justify-center hover:bg-accent-hover cursor-pointer shadow-xs"
                    title="Search Customer"
                  >
                    <Search size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Search by date (From Date, To Date, Search Button) */}
          <div className="lg:col-span-6 space-y-2 border-t lg:border-t-0 lg:border-l border-border/80 pt-3 lg:pt-0 lg:pl-4 min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5 truncate">
                <CalendarRange size={13} className="text-accent shrink-0" /> Search by date
              </h3>

              {/* Quick Preset Badges */}
              <div className="flex items-center gap-1 text-[10.5px] shrink-0">
                <button
                  type="button"
                  onClick={() => handleDatePreset(0)}
                  className="px-1.5 py-0.5 rounded bg-surface-hi hover:bg-border text-text-muted hover:text-text cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset(7)}
                  className="px-1.5 py-0.5 rounded bg-surface-hi hover:bg-border text-text-muted hover:text-text cursor-pointer"
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset(30)}
                  className="px-1.5 py-0.5 rounded bg-surface-hi hover:bg-border text-text-muted hover:text-text cursor-pointer"
                >
                  30 Days
                </button>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-end gap-2 min-w-0">
              <div className="flex-1 min-w-[100px]">
                <label className="text-[11px] font-semibold text-text-muted block mb-1 truncate">
                  From Date
                </label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 px-2.5 text-xs font-mono"
                />
              </div>

              <div className="flex-1 min-w-[100px]">
                <label className="text-[11px] font-semibold text-text-muted block mb-1 truncate">
                  To Date
                </label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 px-2.5 text-xs font-mono"
                />
              </div>

              <PrimaryButton
                type="button"
                onClick={handleDateSearch}
                disabled={isNavPending}
                className="h-8 px-4 text-xs font-bold rounded-lg shadow-xs bg-accent text-[#1A1306] hover:bg-accent-hover cursor-pointer shrink-0"
              >
                {isNavPending ? "…" : "Search"}
              </PrimaryButton>
            </div>
          </div>
        </div>

        {/* Quick Filters Row: Fuel, Payment, Sort By & Status */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-border/80 pt-2.5 text-xs w-full min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-1 text-text-muted">
              <Filter size={13} className="text-accent shrink-0" /> <span>Fuel:</span>
              <select
                value={fuelFilter}
                onChange={(e) => setFuelFilter(e.target.value)}
                className="h-8 rounded-lg border border-border bg-bg px-2 text-xs font-medium font-sans text-text focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="ALL">All Fuel Types</option>
                <option value="PETROL">Petrol (MS)</option>
                <option value="DIESEL">Diesel (HSD)</option>
                <option value="CNG">CNG / AutoGas</option>
              </select>
            </div>

            <div className="flex items-center gap-1 text-text-muted">
              <span>Payment:</span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="h-8 rounded-lg border border-border bg-bg px-2 text-xs font-medium font-sans text-text focus:outline-none focus:border-accent/80 cursor-pointer"
              >
                <option value="ALL">All Modes</option>
                <option value="CASH">Cash</option>
                <option value="ONLINE">QR / Fonepay</option>
                <option value="CARD">POS / Card</option>
                <option value="CREDIT">Credit Ledger</option>
              </select>
            </div>

            <div className="flex items-center gap-1 text-text-muted border-l border-border/80 pl-2">
              <ArrowUpDown size={12} className="shrink-0" /> <span>Sort:</span>
              <div className="flex items-center gap-1">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="h-8 rounded-lg border border-border bg-bg px-1.5 text-xs font-medium font-sans text-text focus:outline-none focus:border-accent/80 cursor-pointer"
                >
                  <option value="date">Date</option>
                  <option value="receipt">Bill No</option>
                  <option value="amount">Amount</option>
                </select>
                <select
                  value={sortDir}
                  onChange={(e) => setSortDir(e.target.value as SortDir)}
                  className="h-8 rounded-lg border border-border bg-bg px-1.5 text-xs font-medium font-sans text-text focus:outline-none focus:border-accent/80 cursor-pointer"
                >
                  <option value="desc">DESC</option>
                  <option value="asc">ASC</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Status Pills */}
            <div className="flex items-center gap-0.5 rounded-xl border border-border bg-bg p-0.5 text-xs">
              {(
                [
                  { id: "all", label: "All Bills" },
                  { id: "active", label: "Active Only" },
                  { id: "voided", label: "Voided" },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={clsx(
                    "rounded-lg px-2 py-1 font-semibold transition-colors cursor-pointer text-[11.5px]",
                    statusFilter === st.id
                      ? "bg-accent/15 text-accent"
                      : "text-text-muted hover:text-text"
                  )}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Quick Horizontal Scroll Controls */}
            <div className="flex items-center gap-1 pl-1">
              <button
                type="button"
                onClick={() => scrollTable(-280)}
                className="h-7.5 w-7.5 rounded-lg border border-border bg-bg text-text-muted hover:text-accent hover:border-accent/60 flex items-center justify-center cursor-pointer transition-colors"
                title="Scroll Table Left"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => scrollTable(280)}
                className="h-7.5 w-7.5 rounded-lg border border-border bg-bg text-text-muted hover:text-accent hover:border-accent/60 flex items-center justify-center cursor-pointer transition-colors"
                title="Scroll Table Right"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Vehicle Intelligence Summary Card (if searched by plate) */}
      {vehicleStats && (
        <div className="animate-fade-in flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
              <Car size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-text text-[15px]">
                  Vehicle Fleet Record:
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

      {/* 5. Master Ledger Register Table */}
      <div className="flex flex-col rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        {/* Table Viewport with Always-Visible Horizontal & Vertical Scrollbars */}
        <div
          ref={tableRef}
          className="overflow-auto max-h-[calc(100vh-280px)] min-h-[440px] scrollbar-custom pb-2"
        >
          <table className="w-full text-left text-[12px] min-w-[1460px] border-collapse">
            <thead className="sticky top-0 z-20 border-b border-border bg-surface-hi text-[10.5px] font-bold uppercase tracking-wider text-text-muted font-data shadow-xs">
              <tr className="whitespace-nowrap">
                <th className="px-1.5 py-2 text-center w-8 text-[9px]">#</th>
                <th className="px-2 py-2 min-w-[105px] text-[9px]">Bill No.</th>
                <th className="px-2.5 py-2.5 min-w-[95px]">Bill Date</th>
                <th className="px-2.5 py-2.5">Fiscal Year</th>
                <th className="px-2.5 py-2.5">Station PAN</th>
                <th className="px-2.5 py-2.5 min-w-[150px]">Customer Name</th>
                <th className="px-2.5 py-2.5">Customer PAN</th>
                <th className="px-2.5 py-2.5 text-right">Subtotal</th>
                <th className="px-2 py-2.5 text-right">Discount</th>
                <th className="px-2.5 py-2.5 text-right">Taxable</th>
                <th className="px-2.5 py-2.5 text-right">VAT (13%)</th>
                <th className="px-3 py-2.5 text-right font-bold">Grand Total</th>
                <th className="px-2.5 py-2.5 text-center">IRD Sync</th>
                <th className="px-2.5 py-2.5">Added By</th>
                <th className="px-2 py-2.5 text-center">Status</th>
                <th className="px-2 py-2.5 text-center">Print Audit</th>
                <th className="px-2.5 py-2.5">Payment</th>
                <th className="px-3 py-2.5 text-right sticky top-0 right-0 z-30 bg-surface-hi shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.12)] min-w-[150px]">
                  Print / Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {sortedBills.length === 0 ? (
                <tr>
                  <td colSpan={18} className="py-14 text-center text-text-muted font-body">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt size={32} className="text-text-muted/40" />
                      <p className="font-semibold text-[13px] text-text">No bills found</p>
                      <p className="text-[11.5px] max-w-sm text-text-muted">
                        No transactions match the selected date range and filters. Try adjusting your query or date window.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedBills.map((b, idx) => {
                  const fuelId = b.fuel as FuelId;
                  const { taxable, vat } = vatSplit(b.amount);
                  const fiscalYear = fiscalYearOf(new Date(b.createdAt));
                  const customerPan = b.customerId ? customerPanById.get(b.customerId) : undefined;

                  return (
                    <tr
                      key={b.id}
                      className={clsx(
                        "group hover:bg-surface-hi/70 transition-colors whitespace-nowrap",
                        b.voided && "opacity-60 bg-error/5"
                      )}
                    >
                      {/* S. No. */}
                      <td className="px-1.5 py-1.5 text-center text-text-muted font-mono text-[9px]">{idx + 1}</td>

                      {/* Bill No. + Cancel Button */}
                      <td className="px-2 py-1.5 font-mono">
                        <button
                          type="button"
                          onClick={() => setViewingBill(b)}
                          className="font-bold text-accent hover:underline cursor-pointer block text-left text-[10px] leading-tight"
                          title="Click to view full invoice audit details"
                        >
                          {b.billNumber || `#${b.receiptNo}`}
                        </button>
                        {b.voided ? (
                          <span className="inline-block mt-0.5 text-[8px] font-bold text-error uppercase leading-none">
                            Voided Return
                          </span>
                        ) : canVoid ? (
                          <VoidSaleButton
                            saleId={b.id}
                            receiptNo={b.receiptNo}
                            label="Cancel this bill"
                          />
                        ) : null}
                      </td>

                      {/* Bill Date */}
                      <td className="px-2.5 py-2 font-medium text-text">
                        <div>{b.dateBS}</div>
                        <div className="text-[10.5px] text-text-muted">{b.time}</div>
                      </td>

                      {/* Fiscal Year */}
                      <td className="px-2.5 py-2 font-body text-text-muted">
                        {fiscalYear ?? "2083/84"}
                      </td>

                      {/* Station PAN */}
                      <td className="px-2.5 py-2 font-mono text-[11.5px] text-text-muted">
                        {stationPan}
                      </td>

                      {/* Customer Name */}
                      <td className="px-2.5 py-2 font-body font-medium text-text">
                        <div className="truncate max-w-[170px]" title={b.customerName || "CASH"}>
                          {b.customerName || "CASH"}
                        </div>
                        {b.vehicleNo && (
                          <div className="text-[10.5px] font-mono text-text-muted">
                            {b.vehicleNo}
                          </div>
                        )}
                      </td>

                      {/* Customer PAN */}
                      <td className="px-2.5 py-2 font-mono text-[11.5px] text-text-muted">
                        {customerPan || "—"}
                      </td>

                      {/* Subtotal */}
                      <td className="px-2.5 py-2 text-right text-text-muted">
                        {taxable.toFixed(2)}
                      </td>

                      {/* Discount */}
                      <td className="px-2 py-2 text-right text-text-muted">0.00</td>

                      {/* Taxable Amount */}
                      <td className="px-2.5 py-2 text-right text-text-muted font-medium">
                        {taxable.toFixed(2)}
                      </td>

                      {/* VAT */}
                      <td className="px-2.5 py-2 text-right text-text-muted font-medium">
                        {vat.toFixed(2)}
                      </td>

                      {/* Grand Total */}
                      <td
                        className={clsx(
                          "px-3 py-2 text-right font-bold text-[13px]",
                          b.voided ? "line-through text-text-muted" : "text-text font-black"
                        )}
                      >
                        {b.amount.toFixed(2)}
                      </td>

                      {/* IRD Sync */}
                      <td className="px-2.5 py-2 text-center">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase",
                            b.voided
                              ? "bg-error/10 text-error"
                              : "bg-emerald-500/10 text-emerald-400"
                          )}
                        >
                          {b.voided ? "RETURNED" : "YES"}
                        </span>
                      </td>

                      {/* Added By */}
                      <td className="px-2.5 py-2 font-body text-[11.5px] text-text-muted uppercase">
                        {b.soldBy || "SUPER ADMIN"}
                      </td>

                      {/* Status */}
                      <td className="px-2 py-2 text-center font-body">
                        <span
                          className={clsx(
                            "text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                            b.voided
                              ? "bg-error/15 text-error"
                              : "bg-emerald-500/15 text-emerald-400"
                          )}
                        >
                          {b.voided ? "voided" : "active"}
                        </span>
                      </td>

                      {/* Print Audit */}
                      <td className="px-2 py-2 text-center font-body text-[11px] text-text-muted">
                        <div className="font-mono font-bold text-text">1x</div>
                        <div className="text-[10px] truncate max-w-[85px]" title={b.createdAt}>
                          {b.dateBS}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="px-2.5 py-2 font-body">
                        {getPaymentBadge(b.payment)}
                      </td>

                      {/* Print / Actions */}
                      <td
                        className={clsx(
                          "px-3 py-2 text-right font-body sticky right-0 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.06)] z-10 transition-colors min-w-[150px]",
                          b.voided
                            ? "bg-surface"
                            : "bg-surface group-hover:bg-surface-hi"
                        )}
                      >
                        <div className="flex items-center justify-end gap-1.5">
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
                            className="p-1 text-text-muted hover:text-accent rounded-lg"
                            title="Print Duplicate Receipt Slip"
                          >
                            <Printer size={14} />
                          </GhostButton>

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
                              className="p-1 text-text-muted hover:text-text rounded-lg"
                              title="Edit Bill"
                            >
                              <Edit size={14} />
                            </GhostButton>
                          )}

                          <GhostButton
                            type="button"
                            onClick={() => setViewingBill(b)}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg border border-border hover:border-accent/60"
                            title="View Full Bill Details & Tax Invoice"
                          >
                            View
                          </GhostButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Master Ledger Bottom Footer with Record Counter and Totals */}
        <div className="border-t border-border bg-surface-hi/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-data">
          <div className="flex items-center gap-3 text-text-muted">
            <span>
              Showing <strong className="text-text font-mono">{sortedBills.length}</strong> of{" "}
              <strong className="text-text font-mono">{bills.length}</strong> bills
            </span>
          </div>

          <div className="flex items-center gap-2 text-text-muted text-[11px] font-sans">
            <span className="hidden md:inline">← Drag horizontal slider or use [ <ChevronLeft size={10} className="inline" /> / <ChevronRight size={10} className="inline" /> ] to navigate all 19 columns →</span>
          </div>

          <div className="flex items-center gap-4 text-text-muted">
            <span>
              Taxable: <strong className="text-text font-mono">{fmtRs(currentMetrics.taxableAmount)}</strong>
            </span>
            <span>
              VAT 13%: <strong className="text-emerald-400 font-mono">{fmtRs(currentMetrics.vatAmount)}</strong>
            </span>
            <span>
              Turnover: <strong className="text-accent font-mono font-black">{fmtRs(currentMetrics.netAmount)}</strong>
            </span>
          </div>
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
            // Live saved in DB via server action
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
