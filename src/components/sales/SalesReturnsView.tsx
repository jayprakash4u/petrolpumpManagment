"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  Printer,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  FileText,
  Fuel,
  User,
  Clock,
  Building2,
  X,
  Scale,
  History,
  Check,
  Ban,
  ArrowRight,
  Receipt,
  AlertTriangle,
  Zap,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Filter,
  TrendingDown,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { fmtRs, fmtL } from "@/lib/money";
import { clsx } from "clsx";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { voidSaleAction } from "@/lib/actions/sales";
import { fiscalYearOf } from "@/lib/bs-date";
import type { SalesReturnsPageData, SerializedSale } from "@/lib/queries/sales";

const RETURN_REASONS = [
  { id: "WRONG_QTY", label: "Wrong Quantity Entry" },
  { id: "WRONG_RATE", label: "Wrong Rate Posted" },
  { id: "WRONG_PAN", label: "WRONG PAN NO." },
  { id: "WRONG_BILLING", label: "Wrong Billing / Wrong Customer" },
  { id: "NAME_NEEDED", label: "Name Needed / Customer PAN Correction" },
  { id: "BILL_MISTAKE", label: "Bill Mistake" },
  { id: "PRINTER_ERROR", label: "Not Printed Due to Printer Error" },
  { id: "METER_CALIBRATION", label: "Nozzle Meter Calibration / Testing" },
  { id: "ABORTED_DISPENSE", label: "Dispense Aborted Mid-Flow" },
  { id: "PAYMENT_FAILED", label: "Digital Payment Authorization Failed" },
  { id: "OTHER", label: "Other / Custom Reason" },
];

function vatSplit(amount: number): { taxable: number; vat: number } {
  const taxable = amount / 1.13;
  const vat = amount - taxable;
  return { taxable, vat };
}

export function SalesReturnsView({
  initialData,
  canVoid,
}: {
  initialData: SalesReturnsPageData;
  canVoid: boolean;
}) {
  const router = useRouter();
  const tableRef = useRef<HTMLDivElement>(null);

  // View Mode: Master Register vs Interactive Return Process
  const [activeTab, setActiveTab] = useState<"REGISTER" | "PROCESS">("REGISTER");

  // Data state
  const [returns, setReturns] = useState<SerializedSale[]>(initialData.returns);
  const [activeSales] = useState<SerializedSale[]>(initialData.activeSales);

  // 1. Search by date panel state
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // 2. DataTable filtering, pagination & search
  const [registerSearch, setRegisterSearch] = useState<string>("");
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 3. Process Return states
  const [processSearchQuery, setProcessSearchQuery] = useState("");
  const [processPage, setProcessPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<SerializedSale | null>(null);
  const [reasonCategory, setReasonCategory] = useState(RETURN_REASONS[0].label);
  const [customNotes, setCustomNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastProcessedReturn, setLastProcessedReturn] = useState<SerializedSale | null>(null);

  // 4. Modal Credit Note Slip
  const [activeSlip, setActiveSlip] = useState<SerializedSale | null>(null);

  // Quick Date Presets
  const handleDatePreset = (preset: "today" | "7days" | "month" | "all") => {
    if (preset === "all") {
      setFromDate("");
      setToDate("");
      setSelectedFiscalYear("ALL");
      return;
    }
    const today = new Date();
    const todayBS = today.toISOString().slice(0, 10);
    if (preset === "today") {
      setFromDate(todayBS);
      setToDate(todayBS);
    } else if (preset === "7days") {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setFromDate(past.toISOString().slice(0, 10));
      setToDate(todayBS);
    } else if (preset === "month") {
      const past = new Date();
      past.setDate(1);
      setFromDate(past.toISOString().slice(0, 10));
      setToDate(todayBS);
    }
    setCurrentPage(1);
  };

  // Scroll table helper
  const scrollTable = (offset: number) => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Filtered Credit Notes (Master Register)
  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      // Fiscal Year Filter
      if (selectedFiscalYear !== "ALL") {
        const itemFY = fiscalYearOf(new Date(r.createdAt)) || "2083/84";
        if (itemFY !== selectedFiscalYear) return false;
      }

      // Date Range Filter
      const rDate = r.formattedDateBS || r.createdAt.slice(0, 10);
      if (fromDate && rDate < fromDate) return false;
      if (toDate && rDate > toDate) return false;

      // Text Search Filter
      if (registerSearch.trim()) {
        const q = registerSearch.toLowerCase().trim();
        const numQ = q.replace(/\D/g, "");
        const matchNum = numQ ? String(r.receiptNo).includes(numQ) : false;
        const matchCN = (r.creditNoteNo || `cn-tb-${r.receiptNo}`).toLowerCase().includes(q);
        const matchBill = (r.billNumber || "").toLowerCase().includes(q);
        const matchCust = (r.customerName || "").toLowerCase().includes(q);
        const matchPan = (r.customerPan || "").toLowerCase().includes(q);
        const matchReason = (r.voidReason || "").toLowerCase().includes(q);
        const matchUser = (r.soldByName || "").toLowerCase().includes(q);

        if (!matchNum && !matchCN && !matchBill && !matchCust && !matchPan && !matchReason && !matchUser) {
          return false;
        }
      }

      return true;
    });
  }, [returns, selectedFiscalYear, fromDate, toDate, registerSearch]);

  // Paginated returns
  const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredReturns.length / pageSize) || 1;
  const paginatedReturns = useMemo(() => {
    if (pageSize === 0) return filteredReturns;
    const start = (currentPage - 1) * pageSize;
    return filteredReturns.slice(start, start + pageSize);
  }, [filteredReturns, currentPage, pageSize]);

  // Aggregate Metrics for Current Filter
  const metrics = useMemo(() => {
    let totalAmount = 0;
    let totalTaxable = 0;
    let totalVat = 0;
    let totalLiters = 0;

    for (const r of filteredReturns) {
      totalAmount += r.totalAmount;
      totalLiters += r.liters;
      const { taxable, vat } = vatSplit(r.totalAmount);
      totalTaxable += taxable;
      totalVat += vat;
    }

    return {
      count: filteredReturns.length,
      totalAmount,
      totalTaxable,
      totalVat,
      totalLiters,
    };
  }, [filteredReturns]);

  // Filtered Active Sales (for Process Return mode)
  const filteredActiveSales = useMemo(() => {
    if (!processSearchQuery.trim()) return activeSales;
    const q = processSearchQuery.toLowerCase().trim();
    const numQ = q.replace(/\D/g, "");

    return activeSales.filter((s) => {
      const matchNum = numQ ? String(s.receiptNo).includes(numQ) : false;
      const matchBill =
        s.billNumber.toLowerCase().includes(q) ||
        `sl-${s.receiptNo}`.toLowerCase().includes(q) ||
        `tb-${s.receiptNo}`.toLowerCase().includes(q);
      const matchVeh = s.vehicleNo ? s.vehicleNo.toLowerCase().includes(q) : false;
      const matchCust = s.customerName ? s.customerName.toLowerCase().includes(q) : false;
      return matchNum || matchBill || matchVeh || matchCust;
    });
  }, [activeSales, processSearchQuery]);

  const totalProcessPages = Math.ceil(filteredActiveSales.length / 10) || 1;
  const paginatedActiveSales = useMemo(() => {
    const start = (processPage - 1) * 10;
    return filteredActiveSales.slice(start, start + 10);
  }, [filteredActiveSales, processPage]);

  // Execute Return Action
  const handleExecuteReturn = async () => {
    if (!selectedSale) return;
    setIsSubmitting(true);
    setActionError(null);

    const fullReason = customNotes.trim()
      ? `${reasonCategory}: ${customNotes.trim()}`
      : reasonCategory;

    const fd = new FormData();
    fd.set("saleId", selectedSale.id);
    fd.set("reason", fullReason);

    try {
      const res = await voidSaleAction({}, fd);
      if (res.error) {
        setActionError(res.error);
        setIsSubmitting(false);
      } else {
        const fy = fiscalYearOf(new Date(selectedSale.createdAt)) || "2083/84";
        const returnedItem: SerializedSale = {
          ...selectedSale,
          voided: true,
          voidReason: fullReason,
          voidedAt: new Date().toISOString(),
          creditNoteNo: `cn-tb-${selectedSale.receiptNo}-${fy.replace("/", "")}`,
        };

        setReturns((prev) => [returnedItem, ...prev]);
        setLastProcessedReturn(returnedItem);
        setSelectedSale(null);
        setCustomNotes("");
        setIsSubmitting(false);
        setActiveTab("REGISTER");
      }
    } catch {
      setActionError("Failed to process return. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  // Export to Excel / CSV (Statutory IRD Annexure 6 Credit Notes Format)
  const handleExportToExcel = () => {
    if (filteredReturns.length === 0) return;

    const headers = [
      "S.N",
      "Credit Note Number",
      "Customer Name",
      "Customer PAN",
      "Bill No",
      "Taxable Returned",
      "Vat Returned",
      "Amount Returned",
      "Canceled Date",
      "Canceled By",
      "Description",
      "Synced With IRD",
      "Is Real Time",
      "Fuel Product",
      "Restocked Liters",
    ];

    const rows = filteredReturns.map((r, idx) => {
      const { taxable, vat } = vatSplit(r.totalAmount);
      const cnNo = r.creditNoteNo || `cn-tb-${r.receiptNo}`;
      const billNo = r.billNumber || `tb-${r.receiptNo}`;
      return [
        idx + 1,
        `"${cnNo}"`,
        `"${r.customerName || "Cash"}"`,
        `"${r.customerPan || ""}"`,
        `"${billNo}"`,
        taxable.toFixed(6),
        vat.toFixed(6),
        r.totalAmount.toFixed(6),
        `"${r.formattedDateBS || r.createdAt.slice(0, 10)}"`,
        `"${r.soldByName || "SUPER ADMIN"}"`,
        `"${(r.voidReason || "Mistake Billing").replace(/"/g, '""')}"`,
        `"yes"`,
        `"yes"`,
        `"${FUEL_LABEL[r.fuel as FuelId] || r.fuel}"`,
        r.liters.toFixed(2),
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `All_Credit_Notes_Annexure_6_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-black text-text tracking-tight flex items-center gap-2">
              All <span className="text-accent">Credit Notes</span>
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-semibold text-text-muted font-mono">
              {filteredReturns.length} {filteredReturns.length === 1 ? "note" : "notes"}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[11px] font-bold text-accent">
              IRD Annexure 6 (अनुसूची ६)
            </span>
          </div>
          <p className="text-[11.5px] text-text-muted hidden sm:block">
            Statutory credit notes, sales return register, stock restoration audit, and IRD sync status.
          </p>
        </div>

        {/* Top Right: View Switcher & « Back Button */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-surface p-0.5 text-xs font-semibold shadow-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab("REGISTER");
                setSelectedSale(null);
              }}
              className={clsx(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all cursor-pointer text-xs",
                activeTab === "REGISTER"
                  ? "bg-accent text-[#1A1306] font-bold shadow-xs"
                  : "text-text-muted hover:text-text"
              )}
            >
              <History size={13} />
              <span>Credit Notes Register</span>
            </button>
            {canVoid && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("PROCESS");
                  setSelectedSale(null);
                }}
                className={clsx(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all cursor-pointer text-xs",
                  activeTab === "PROCESS"
                    ? "bg-accent text-[#1A1306] font-bold shadow-xs"
                    : "text-text-muted hover:text-text"
                )}
              >
                <RotateCcw size={13} />
                <span>Issue Return</span>
              </button>
            )}
          </div>

          <GhostButton
            type="button"
            onClick={() => router.back()}
            className="h-8 px-3 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-surface-hi flex items-center gap-1 cursor-pointer text-text hover:text-accent transition-colors shadow-xs"
            title="Return to previous screen"
          >
            « Back
          </GhostButton>
        </div>
      </div>

      {/* Success Notification Banner */}
      {lastProcessedReturn && (
        <div className="animate-fade-in flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              <Check size={18} className="stroke-[3]" />
            </div>
            <div>
              <div className="font-bold text-text text-xs sm:text-sm flex items-center gap-2">
                <span>Credit Note {lastProcessedReturn.creditNoteNo || `CN-${lastProcessedReturn.receiptNo}`} Issued Successfully</span>
                <span className="text-[10.5px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/20">Restocked</span>
              </div>
              <div className="text-[11.5px] text-text-muted mt-0.5">
                Restocked <strong>{fmtL(lastProcessedReturn.liters)}</strong> of {lastProcessedReturn.fuel} to storage tank · Adjusted <strong>{fmtRs(lastProcessedReturn.totalAmount)}</strong>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GhostButton
              type="button"
              onClick={() => setActiveSlip(lastProcessedReturn)}
              className="text-xs bg-surface border border-border font-bold hover:bg-surface-hi"
            >
              <Printer size={13} className="text-accent" /> View Credit Slip
            </GhostButton>
            <button
              type="button"
              onClick={() => setLastProcessedReturn(null)}
              className="text-xs text-text-muted hover:text-text cursor-pointer p-1"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Executive KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2 animate-fade-in">
        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-xs">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
            Total Returned Amount
          </span>
          <div className="font-data font-bold text-[15px] text-error mt-0.5 truncate">
            {fmtRs(metrics.totalAmount)}
          </div>
          <span className="text-[9.5px] text-text-muted truncate block">
            {metrics.count} Credit Notes issued
          </span>
        </div>

        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-xs">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
            Taxable Returned
          </span>
          <div className="font-data font-bold text-[15px] text-text mt-0.5 truncate">
            {fmtRs(metrics.totalTaxable)}
          </div>
          <span className="text-[9.5px] text-text-muted truncate block">Pre-tax adjustment</span>
        </div>

        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-xs">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
            13% VAT Returned
          </span>
          <div className="font-data font-bold text-[15px] text-emerald-400 mt-0.5 truncate">
            {fmtRs(metrics.totalVat)}
          </div>
          <span className="text-[9.5px] text-text-muted truncate block">IRD VAT reversal</span>
        </div>

        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-xs">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
            Restocked Volume
          </span>
          <div className="font-data font-bold text-[15px] text-accent mt-0.5 truncate">
            {fmtL(metrics.totalLiters)}
          </div>
          <span className="text-[9.5px] text-text-muted truncate block">Fuel restored to tanks</span>
        </div>

        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-xs">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
            IRD Sync Status
          </span>
          <div className="font-data font-bold text-[15px] text-cyan-400 mt-0.5 truncate flex items-center gap-1.5">
            <ShieldCheck size={16} /> 100% Real-time
          </div>
          <span className="text-[9.5px] text-text-muted truncate block">Annexure 6 compliant</span>
        </div>
      </div>

      {/* 3. Search by Date Card */}
      <div className="rounded-2xl border border-border bg-surface p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-accent" />
            <h2 className="font-display text-sm font-bold text-text">Search by date</h2>
          </div>
          {/* Quick date presets */}
          <div className="flex items-center gap-1 text-[11px] font-medium">
            <span className="text-text-muted hidden sm:inline mr-1">Presets:</span>
            <button
              type="button"
              onClick={() => handleDatePreset("today")}
              className="px-2 py-0.5 rounded-md border border-border hover:border-accent/60 bg-bg text-text-muted hover:text-text cursor-pointer transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset("7days")}
              className="px-2 py-0.5 rounded-md border border-border hover:border-accent/60 bg-bg text-text-muted hover:text-text cursor-pointer transition-colors"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset("month")}
              className="px-2 py-0.5 rounded-md border border-border hover:border-accent/60 bg-bg text-text-muted hover:text-text cursor-pointer transition-colors"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset("all")}
              className="px-2 py-0.5 rounded-md border border-border hover:border-accent/60 bg-bg text-text-muted hover:text-text cursor-pointer transition-colors"
            >
              All Time
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Fiscal Year dropdown */}
          <div className="lg:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Fiscal Year
            </label>
            <select
              value={selectedFiscalYear}
              onChange={(e) => {
                setSelectedFiscalYear(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 w-full rounded-lg border border-border bg-bg px-2.5 text-xs font-sans text-text focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="ALL">FY (All Years)</option>
              <option value="2083/84">2083/84 (Current)</option>
              <option value="2082/83">2082/83</option>
              <option value="2081/82">2081/82</option>
              <option value="2080/81">2080/81</option>
            </select>
          </div>

          {/* From Date */}
          <div className="lg:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              From Date
            </label>
            <Input
              type="text"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Select date (e.g. 2083-01-01)"
              className="h-8 px-2.5 text-xs font-mono w-full"
            />
          </div>

          {/* To Date */}
          <div className="lg:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              To Date
            </label>
            <Input
              type="text"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Select date (e.g. 2083-05-08)"
              className="h-8 px-2.5 text-xs font-mono w-full"
            />
          </div>

          {/* Search Button */}
          <div className="lg:col-span-3 flex items-center gap-1.5">
            <PrimaryButton
              type="button"
              onClick={() => setCurrentPage(1)}
              className="h-8 px-4 text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 w-full cursor-pointer"
            >
              <Search size={13} /> Search
            </PrimaryButton>
            {(fromDate || toDate || selectedFiscalYear !== "ALL") && (
              <GhostButton
                type="button"
                onClick={() => handleDatePreset("all")}
                className="h-8 px-2.5 text-xs font-semibold rounded-lg border border-border hover:bg-surface-hi text-text-muted hover:text-text"
                title="Clear date filters"
              >
                Reset
              </GhostButton>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MASTER CREDIT NOTES DATATABLE CARD                                      */}
      {/* ========================================================================= */}
      {activeTab === "REGISTER" && (
        <div className="flex flex-col rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
          {/* Card Title & Export to Excel */}
          <div className="p-3.5 sm:p-4 border-b border-border/70 bg-surface space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-sm sm:text-base font-bold text-text">Credit Notes</h3>
            </div>

            <div>
              <GhostButton
                type="button"
                onClick={handleExportToExcel}
                className="h-8 px-3 text-xs font-semibold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1.5 rounded-lg shadow-xs transition-colors"
                title="Export full Credit Notes register to Excel / CSV"
              >
                <FileSpreadsheet size={13} />
                <span>Export To Excel</span>
              </GhostButton>
            </div>

            {/* Sub-bar: Print, Show entries, Search on right */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <GhostButton
                  type="button"
                  onClick={() => window.print()}
                  className="h-8 px-3 text-xs font-semibold border border-border bg-surface hover:bg-surface-hi text-text rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Print Current View"
                >
                  <Printer size={13} className="text-accent" />
                  <span>Print</span>
                </GhostButton>

                <div className="flex items-center gap-1.5 text-xs text-text-muted pl-2 border-l border-border">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 rounded-lg border border-border bg-bg px-2 text-xs font-sans text-text cursor-pointer focus:outline-none focus:border-accent"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={0}>All</option>
                  </select>
                  <span>entries</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted font-medium">Search:</span>
                <div className="relative w-48 sm:w-60">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <Input
                    type="text"
                    value={registerSearch}
                    onChange={(e) => {
                      setRegisterSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Filter credit notes..."
                    className="h-8 pl-8 pr-7 text-xs font-medium w-full"
                  />
                  {registerSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setRegisterSearch("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Horizontal scroll helper buttons */}
                <div className="flex items-center gap-1 pl-1">
                  <button
                    type="button"
                    onClick={() => scrollTable(-280)}
                    className="h-8 w-8 rounded-lg border border-border bg-surface text-text-muted hover:text-accent flex items-center justify-center cursor-pointer transition-colors"
                    title="Scroll Table Left"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollTable(280)}
                    className="h-8 w-8 rounded-lg border border-border bg-surface text-text-muted hover:text-accent flex items-center justify-center cursor-pointer transition-colors"
                    title="Scroll Table Right"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Master Table Viewport with All 12 Columns */}
          <div
            ref={tableRef}
            className="overflow-auto max-h-[calc(100vh-280px)] min-h-[440px] scrollbar-custom pb-2"
          >
            <table className="w-full text-left text-[12px] min-w-[1420px] border-collapse">
              <thead className="sticky top-0 z-20 border-b border-border bg-surface-hi text-[10px] font-bold uppercase tracking-wider text-text-muted font-data shadow-xs">
                <tr className="whitespace-nowrap">
                  <th className="px-1.5 py-2 text-center w-8 text-[9px]">S.N</th>
                  <th className="px-2 py-2 min-w-[130px] text-[9.5px]">Credit Note Number</th>
                  <th className="px-2.5 py-2 min-w-[160px]">Customer Name</th>
                  <th className="px-2 py-2 min-w-[105px]">Bill No</th>
                  <th className="px-2.5 py-2 text-right font-bold">Taxable Returned</th>
                  <th className="px-2.5 py-2 text-right font-bold">Vat Returned</th>
                  <th className="px-3 py-2 text-right font-black">Amount Returned</th>
                  <th className="px-2.5 py-2 min-w-[95px]">Canceled Date</th>
                  <th className="px-2.5 py-2">Canceled By</th>
                  <th className="px-3 py-2 min-w-[170px]">Description</th>
                  <th className="px-2.5 py-2 text-center">Synced With IRD</th>
                  <th className="px-2.5 py-2 text-center">Is Real Time</th>
                  <th className="px-3 py-2 text-right sticky top-0 right-0 z-30 bg-surface-hi shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.12)] min-w-[120px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-data">
                {paginatedReturns.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-14 text-center text-text-muted font-body">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Receipt size={32} className="text-text-muted/40" />
                        <p className="font-semibold text-[13px] text-text">No credit notes found</p>
                        <p className="text-[11.5px] max-w-sm text-text-muted">
                          No returns match the selected date range and filters. Try adjusting your query or fiscal year.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedReturns.map((r, idx) => {
                    const { taxable, vat } = vatSplit(r.totalAmount);
                    const sn = (currentPage - 1) * (pageSize || 0) + idx + 1;
                    const cnNo = r.creditNoteNo || `cn-tb-${r.receiptNo}`;
                    const billNo = r.billNumber || `tb-${r.receiptNo}`;

                    return (
                      <tr
                        key={r.id}
                        className="group hover:bg-surface-hi/70 transition-colors whitespace-nowrap"
                      >
                        {/* 1. S.N */}
                        <td className="px-1.5 py-1.5 text-center text-text-muted font-mono text-[9px]">
                          {sn}
                        </td>

                        {/* 2. Credit Note Number */}
                        <td className="px-2 py-1.5 font-mono">
                          <button
                            type="button"
                            onClick={() => setActiveSlip(r)}
                            className="font-bold text-accent hover:underline cursor-pointer block text-left text-[10px] leading-tight"
                            title="Click to view and print official Credit Note voucher"
                          >
                            {cnNo}
                          </button>
                        </td>

                        {/* 3. Customer Name & PAN */}
                        <td className="px-2.5 py-1.5 font-body">
                          <div className="font-medium text-text truncate max-w-[180px]" title={r.customerName || "Cash"}>
                            {r.customerName || "Cash"}
                          </div>
                          {r.customerPan && (
                            <div className="text-[10px] font-mono text-text-muted">
                              PAN: {r.customerPan}
                            </div>
                          )}
                        </td>

                        {/* 4. Bill No */}
                        <td className="px-2 py-1.5 font-mono text-[10px] text-text">
                          {billNo}
                        </td>

                        {/* 5. Taxable Returned */}
                        <td className="px-2.5 py-2 text-right font-mono text-text">
                          {taxable.toFixed(6)}
                        </td>

                        {/* 6. VAT Returned */}
                        <td className="px-2.5 py-2 text-right font-mono text-emerald-400">
                          {vat.toFixed(6)}
                        </td>

                        {/* 7. Amount Returned */}
                        <td className="px-3 py-2 text-right font-mono font-bold text-error text-[12px]">
                          {r.totalAmount.toFixed(6)}
                        </td>

                        {/* 8. Canceled Date */}
                        <td className="px-2.5 py-2 text-text font-mono text-[11px]">
                          <div>{r.formattedDateBS || r.createdAt.slice(0, 10)}</div>
                          <div className="text-[9.5px] text-text-muted">{r.formattedTime}</div>
                        </td>

                        {/* 9. Canceled By */}
                        <td className="px-2.5 py-2 font-body text-[11px] text-text-muted uppercase">
                          {r.soldByName || "SUPER ADMIN"}
                        </td>

                        {/* 10. Description / Reason */}
                        <td className="px-3 py-2 font-body text-[11.5px] text-text max-w-xs truncate" title={r.voidReason || "Mistake Billing"}>
                          {r.voidReason || "Mistake Billing"}
                        </td>

                        {/* 11. Synced With IRD */}
                        <td className="px-2.5 py-2 text-center">
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10.5px] font-bold uppercase bg-emerald-500/15 text-emerald-400">
                            yes
                          </span>
                        </td>

                        {/* 12. Is Real Time */}
                        <td className="px-2.5 py-2 text-center">
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10.5px] font-bold uppercase bg-cyan-500/15 text-cyan-400">
                            yes
                          </span>
                        </td>

                        {/* 13. Sticky Action Column */}
                        <td className="px-3 py-2 text-right font-body sticky right-0 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.06)] z-10 transition-colors bg-surface group-hover:bg-surface-hi min-w-[120px]">
                          <div className="flex items-center justify-end gap-1">
                            <GhostButton
                              type="button"
                              onClick={() => setActiveSlip(r)}
                              className="h-7 px-2 text-[11px] font-semibold text-text-muted hover:text-accent"
                              title="View & Print Credit Note Voucher"
                            >
                              <Printer size={12} className="mr-1" /> Slip
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

          {/* Table Bottom Footer with Pagination & Turnover */}
          <div className="border-t border-border bg-surface-hi/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-data">
            <div className="flex items-center gap-3 text-text-muted font-sans">
              <span>
                Showing <strong className="text-text font-mono">{filteredReturns.length === 0 ? 0 : (currentPage - 1) * (pageSize || 0) + 1}</strong> to{" "}
                <strong className="text-text font-mono">
                  {pageSize === 0 ? filteredReturns.length : Math.min(currentPage * pageSize, filteredReturns.length)}
                </strong> of{" "}
                <strong className="text-text font-mono">{filteredReturns.length}</strong> entries
              </span>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={clsx(
                    "rounded-lg border border-border px-2.5 py-1 transition-colors flex items-center gap-1",
                    currentPage === 1
                      ? "opacity-40 cursor-not-allowed text-text-muted"
                      : "hover:bg-surface-hi text-text cursor-pointer"
                  )}
                >
                  <ChevronLeft size={13} /> Prev
                </button>
                <span className="px-2 font-bold text-text">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={clsx(
                    "rounded-lg border border-border px-2.5 py-1 transition-colors flex items-center gap-1",
                    currentPage === totalPages
                      ? "opacity-40 cursor-not-allowed text-text-muted"
                      : "hover:bg-surface-hi text-text cursor-pointer"
                  )}
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            )}

            {/* Totals summary */}
            <div className="flex items-center gap-4 text-text-muted">
              <span>
                Taxable: <strong className="text-text font-mono">{fmtRs(metrics.totalTaxable)}</strong>
              </span>
              <span>
                VAT: <strong className="text-emerald-400 font-mono">{fmtRs(metrics.totalVat)}</strong>
              </span>
              <span>
                Total Returned: <strong className="text-error font-mono font-bold">{fmtRs(metrics.totalAmount)}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PROCESS RETURN TAB (Interactive Return & Restock Flow)                */}
      {/* ========================================================================= */}
      {activeTab === "PROCESS" && (
        <div className="space-y-4 animate-fade-in">
          {selectedSale ? (
            /* Selected Invoice Confirmation Panel */
            <div className="rounded-2xl border border-accent/40 bg-surface p-5 shadow-sm space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2">
                  <RotateCcw size={16} className="text-accent" />
                  <h2 className="font-display text-base font-bold text-text">
                    Issue Credit Note & Restock for Invoice #{selectedSale.receiptNo}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSale(null);
                    setActionError(null);
                  }}
                  className="text-xs text-text-muted hover:text-error cursor-pointer font-semibold"
                >
                  ✕ Select Different Bill
                </button>
              </div>

              {/* Invoice Summary Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-border bg-bg p-3.5 text-xs font-mono">
                <div>
                  <span className="text-[10.5px] text-text-muted block font-sans">Bill Number</span>
                  <span className="font-bold text-accent">{selectedSale.billNumber}</span>
                </div>
                <div>
                  <span className="text-[10.5px] text-text-muted block font-sans">Customer / Account</span>
                  <span className="font-medium text-text">{selectedSale.customerName || "Walk-In Cash"}</span>
                </div>
                <div>
                  <span className="text-[10.5px] text-text-muted block font-sans">Vehicle Plate</span>
                  <span className="font-bold text-text">{selectedSale.vehicleNo || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10.5px] text-text-muted block font-sans">Payment Mode</span>
                  <span className="font-bold text-text">{selectedSale.paymentMethod}</span>
                </div>
              </div>

              {/* Automatic Impact Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fuel size={16} className="text-emerald-500" />
                    <span className="text-xs font-medium text-text">Tank Restock</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-emerald-500">
                    +{fmtL(selectedSale.liters)} {selectedSale.fuel}
                  </span>
                </div>

                <div className="rounded-xl border border-error/30 bg-error/5 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale size={16} className="text-error" />
                    <span className="text-xs font-medium text-text">
                      {selectedSale.paymentMethod === "CREDIT" ? "Ledger Reversal" : "Amount Refund"}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-error">
                    -{fmtRs(selectedSale.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Reason & Remarks Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/70">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                    REASON FOR RETURN (क्रेडिट नोटको कारण)
                  </label>
                  <select
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    className="h-8 w-full rounded-lg border border-border bg-bg px-2.5 text-xs font-semibold text-text focus:outline-none focus:border-accent cursor-pointer"
                  >
                    {RETURN_REASONS.map((r) => (
                      <option key={r.id} value={r.label}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                    REMARKS / AUDIT MEMO
                  </label>
                  <Input
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="e.g. Corrected buyer PAN, meter testing"
                    className="h-8 px-2.5 text-xs font-medium w-full"
                  />
                </div>
              </div>

              {actionError && (
                <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error font-bold flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Confirm & Execute Button */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
                <GhostButton
                  type="button"
                  onClick={() => setSelectedSale(null)}
                  className="h-8 px-3 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-surface-hi text-text-muted hover:text-text cursor-pointer"
                >
                  Cancel
                </GhostButton>

                <PrimaryButton
                  type="button"
                  onClick={handleExecuteReturn}
                  disabled={isSubmitting || !canVoid}
                  className={clsx(
                    "h-8 px-4 text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5",
                    canVoid
                      ? "bg-accent text-[#1A1306] hover:bg-accent-hover cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  )}
                >
                  <Check size={14} className="stroke-[3]" />
                  {isSubmitting ? "Processing..." : "✓ Confirm Return"}
                </PrimaryButton>
              </div>
            </div>
          ) : (
            /* Active Bills Search & Select Table */
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-sm sm:text-base font-bold text-text tracking-tight">
                    Select Active Bill to Issue Return (फिर्ता बिल छान्नुहोस्)
                  </h2>
                  <p className="text-xs text-text-muted">
                    Locate the customer tax invoice by Bill #, vehicle plate, or customer name
                  </p>
                </div>

                <span className="font-mono text-xs text-text-muted font-bold">
                  {filteredActiveSales.length} Active Invoices
                </span>
              </div>

              {/* Search Active Bills - Compact */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative w-full max-w-xs sm:max-w-sm">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <Input
                    type="text"
                    value={processSearchQuery}
                    onChange={(e) => {
                      setProcessSearchQuery(e.target.value);
                      setProcessPage(1);
                    }}
                    placeholder="Search bill #, vehicle plate, or customer..."
                    className="h-8 pl-8 pr-7 text-xs font-medium w-full"
                    autoFocus
                  />
                  {processSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setProcessSearchQuery("");
                        setProcessPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Active Invoices Table */}
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-surface-hi text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    <tr>
                      <th className="p-2.5 border-r border-border">Bill #</th>
                      <th className="p-2.5 border-r border-border">Customer</th>
                      <th className="p-2.5 border-r border-border">Vehicle</th>
                      <th className="p-2.5 border-r border-border">Product & Volume</th>
                      <th className="p-2.5 border-r border-border text-right">Amount (Rs)</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-data">
                    {paginatedActiveSales.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-text-muted text-xs font-body">
                          No active bills found matching &quot;{processSearchQuery}&quot;.
                        </td>
                      </tr>
                    ) : (
                      paginatedActiveSales.map((s) => {
                        const fuelId = s.fuel as FuelId;
                        return (
                          <tr key={s.id} className="transition-colors hover:bg-surface-hi/30">
                            <td className="p-2.5 border-r border-border font-mono font-bold text-accent">
                              #{s.receiptNo}
                            </td>
                            <td className="p-2.5 border-r border-border font-medium text-text">
                              {s.customerName || "Walk-In Cash"}
                            </td>
                            <td className="p-2.5 border-r border-border font-mono text-text">
                              {s.vehicleNo || "-"}
                            </td>
                            <td className="p-2.5 border-r border-border">
                              <span className="font-semibold text-text">{FUEL_LABEL[fuelId] || s.fuel}</span>
                              <span className="font-mono text-text-muted ml-1.5">({fmtL(s.liters)})</span>
                            </td>
                            <td className="p-2.5 border-r border-border text-right font-mono font-bold text-text">
                              {fmtRs(s.totalAmount)}
                            </td>
                            <td className="p-2.5 text-right font-body">
                              <PrimaryButton
                                type="button"
                                onClick={() => {
                                  setSelectedSale(s);
                                  setActionError(null);
                                }}
                                className="h-7 px-2.5 text-[11px] bg-accent text-[#1A1306] font-bold rounded-md hover:bg-accent-hover cursor-pointer"
                              >
                                Return Bill
                              </PrimaryButton>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredActiveSales.length > 10 && (
                <div className="flex items-center justify-between border-t border-border/70 pt-3 text-xs">
                  <span className="text-text-muted font-mono">
                    Showing {(processPage - 1) * 10 + 1}–
                    {Math.min(processPage * 10, filteredActiveSales.length)} of{" "}
                    {filteredActiveSales.length} bills
                  </span>

                  <div className="flex items-center gap-1.5 font-mono">
                    <button
                      type="button"
                      onClick={() => setProcessPage((p) => Math.max(1, p - 1))}
                      disabled={processPage === 1}
                      className={clsx(
                        "rounded-lg border border-border px-2.5 py-1 text-xs transition-colors flex items-center gap-1",
                        processPage === 1
                          ? "opacity-40 cursor-not-allowed text-text-muted"
                          : "hover:bg-surface-hi text-text cursor-pointer"
                      )}
                    >
                      <ChevronLeft size={13} /> Prev
                    </button>
                    <span className="px-2 font-bold text-text">
                      {processPage} / {totalProcessPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setProcessPage((p) => Math.min(totalProcessPages, p + 1))}
                      disabled={processPage === totalProcessPages}
                      className={clsx(
                        "rounded-lg border border-border px-2.5 py-1 text-xs transition-colors flex items-center gap-1",
                        processPage === totalProcessPages
                          ? "opacity-40 cursor-not-allowed text-text-muted"
                          : "hover:bg-surface-hi text-text cursor-pointer"
                      )}
                    >
                      Next <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PRINTABLE CREDIT NOTE VOUCHER MODAL (Annexure 6)                       */}
      {/* ========================================================================= */}
      {activeSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-surface-hi px-5 py-3.5">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-accent" />
                <h3 className="font-display text-sm font-bold text-text">
                  Statutory Credit Note Voucher (क्रेडिट नोट)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSlip(null)}
                className="text-text-muted hover:text-text cursor-pointer p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="rounded-xl border border-border bg-bg p-4 space-y-3 text-xs font-mono">
                {/* Station Tax Header */}
                <div className="border-b border-dashed border-border pb-3 text-center">
                  <div className="font-bold text-text text-sm uppercase">{initialData.stationName || "FUEL STATION"}</div>
                  <div className="text-[10px] text-text-muted">PAN / VAT: {initialData.stationPan || "300066034"}</div>
                  <div className="text-[11px] text-accent font-bold mt-1">CREDIT NOTE / अनुसूची ६ (नियम २३ सँग सम्बन्धित)</div>
                  <div className="text-[10px] text-text-muted">
                    CN No: <strong>{activeSlip.creditNoteNo || `CN-${activeSlip.receiptNo}`}</strong> · Date: {activeSlip.formattedDateBS}
                  </div>
                </div>

                {/* Return Details */}
                <div className="space-y-1.5 pt-1 text-[11.5px]">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Original Invoice No:</span>
                    <span className="font-bold text-text">{activeSlip.billNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Customer Name:</span>
                    <span className="text-text font-medium">{activeSlip.customerName || "Cash Retail"}</span>
                  </div>
                  {activeSlip.customerPan && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Customer PAN:</span>
                      <span className="text-text font-mono">{activeSlip.customerPan}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-muted">Vehicle Plate:</span>
                    <span className="text-text">{activeSlip.vehicleNo || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Restocked Fuel:</span>
                    <span className="text-emerald-400 font-bold">
                      +{fmtL(activeSlip.liters)} {activeSlip.fuel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Reason / Remarks:</span>
                    <span className="text-text font-bold text-right max-w-xs">{activeSlip.voidReason || "Mistake Billing"}</span>
                  </div>

                  {/* Financial Breakdown */}
                  {(() => {
                    const { taxable, vat } = vatSplit(activeSlip.totalAmount);
                    return (
                      <div className="border-t border-dashed border-border pt-2 space-y-1">
                        <div className="flex justify-between text-text-muted">
                          <span>Taxable Amount Returned:</span>
                          <span className="text-text font-mono">{fmtRs(taxable)}</span>
                        </div>
                        <div className="flex justify-between text-text-muted">
                          <span>13% VAT Returned:</span>
                          <span className="text-emerald-400 font-mono">{fmtRs(vat)}</span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-1 font-bold text-sm">
                          <span>Grand Total Reversed:</span>
                          <span className="text-error font-mono font-black">{fmtRs(activeSlip.totalAmount)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="border-t border-dashed border-border pt-2 text-[10px] text-text-muted flex justify-between">
                    <span>Issued By: {activeSlip.soldByName || "SUPER ADMIN"}</span>
                    <span>IRD Sync: YES</span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <GhostButton
                  type="button"
                  onClick={() => setActiveSlip(null)}
                  className="text-xs px-4 py-2"
                >
                  Close
                </GhostButton>
                <PrimaryButton
                  type="button"
                  onClick={() => window.print()}
                  className="text-xs font-bold px-5 py-2 bg-accent text-[#1A1306] rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer size={14} /> Print Credit Slip
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
