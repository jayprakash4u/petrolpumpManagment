"use client";

import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Search,
  Printer,
  FileSpreadsheet,
  Calendar,
  FileText,
  Filter,
  CheckCircle2,
  Table,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Receipt,
  FileDown,
} from "lucide-react";
import { clsx } from "clsx";
import type { SerializedBillItem } from "@/lib/queries/bills";
import type { BillFilters } from "@/lib/bill-filters";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { Input, Select } from "@/components/ui/Field";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { fmtRs, fmtL } from "@/lib/money";
import { fiscalYearOf } from "@/lib/bs-date";

function vatSplit(amount: number): { taxable: number; vat: number } {
  const taxable = amount / 1.13;
  const vat = amount - taxable;
  return { taxable, vat };
}

export function BillExportView({
  initialFilters,
  basePath,
  bills,
  customers = [],
  rangeLabel,
}: {
  initialFilters: BillFilters;
  basePath: string;
  bills: SerializedBillItem[];
  customers?: { id: string; name: string; panNo: string | null }[];
  rangeLabel: string;
}) {
  const router = useRouter();
  const tableRef = useRef<HTMLDivElement>(null);

  // Date filters
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Table controls
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Customer PAN Map
  const customerPanById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of customers) {
      if (c.panNo) map.set(c.id, c.panNo);
    }
    return map;
  }, [customers]);

  // Quick Date Presets
  const handleDatePreset = (preset: "today" | "7days" | "month" | "all") => {
    if (preset === "all") {
      setFromDate("");
      setToDate("");
      setCurrentPage(1);
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

  // Scroll Table
  const scrollTable = (offset: number) => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Filtered Bills
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      // Date filter
      const bDateBS = b.dateBS || b.createdAt.slice(0, 10);
      if (fromDate && bDateBS < fromDate) return false;
      if (toDate && bDateBS > toDate) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const numQ = q.replace(/\D/g, "");
        const matchReceipt = numQ ? String(b.receiptNo).includes(numQ) : false;
        const matchBill = b.billNumber.toLowerCase().includes(q);
        const matchCustomer = b.customerName ? b.customerName.toLowerCase().includes(q) : false;
        const custPan = b.customerId ? customerPanById.get(b.customerId) : null;
        const matchPan = custPan ? custPan.includes(q) : false;
        const matchPlate = b.vehicleNo ? b.vehicleNo.toLowerCase().includes(q) : false;
        if (!matchReceipt && !matchBill && !matchCustomer && !matchPan && !matchPlate) return false;
      }

      return true;
    });
  }, [bills, fromDate, toDate, searchQuery, customerPanById]);

  // Aggregate Totals for the entire filtered set (displayed in totals row & summary cards)
  const totals = useMemo(() => {
    let subTotal = 0;
    let taxable = 0;
    let vat = 0;
    let total = 0;
    let totalLiters = 0;

    for (const b of filteredBills) {
      if (!b.voided) {
        const split = vatSplit(b.amount);
        subTotal += split.taxable;
        taxable += split.taxable;
        vat += split.vat;
        total += b.amount;
        totalLiters += b.liters;
      }
    }

    return {
      count: filteredBills.length,
      subTotal,
      discount: 0,
      taxable,
      nonTaxable: 0,
      vat,
      total,
      totalLiters,
    };
  }, [filteredBills]);

  // Pagination
  const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredBills.length / pageSize) || 1;
  const paginatedBills = useMemo(() => {
    if (pageSize === 0) return filteredBills;
    const start = (currentPage - 1) * pageSize;
    return filteredBills.slice(start, start + pageSize);
  }, [filteredBills, currentPage, pageSize]);

  // Export to Excel / CSV (Full 12 columns matching screenshot format)
  const handleExport = (type: "excel" | "csv") => {
    if (filteredBills.length === 0) return;

    const headers = [
      "S.N.",
      "Bill No.",
      "Full Name",
      "Pan No.",
      "Bill Date",
      "Invoice Date",
      "Sub Total",
      "Discount",
      "Taxable",
      "Non Taxable",
      "Vat",
      "Total",
    ];

    const rows = filteredBills.map((b, idx) => {
      const { taxable, vat } = vatSplit(b.amount);
      const custPan = b.customerId ? customerPanById.get(b.customerId) : "";
      const adDate = b.createdAt ? b.createdAt.slice(0, 10) : "";
      const fy = fiscalYearOf(new Date(b.createdAt)) || "2083/84";
      const billFormatted = b.billNumber ? `tb-${b.receiptNo}-${fy.replace("/", "-")}` : `tb-${b.receiptNo}`;

      return [
        idx + 1,
        `"${billFormatted}"`,
        `"${b.customerName || "CASH"}"`,
        `"${custPan || ""}"`,
        `"${b.dateBS}"`,
        `"${adDate}"`,
        taxable.toFixed(3),
        "0.000",
        taxable.toFixed(3),
        "0.000",
        vat.toFixed(3),
        b.amount.toFixed(3),
      ];
    });

    // Add Totals summary row
    rows.push([
      "",
      "",
      "",
      "",
      "",
      `"Total"`,
      totals.taxable.toFixed(3),
      "0.000",
      totals.taxable.toFixed(3),
      "0.000",
      totals.vat.toFixed(3),
      totals.total.toFixed(3),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `Export_All_Bills_${type === "excel" ? "Excel" : "CSV"}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full animate-fade-in">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-black text-text tracking-tight flex items-center gap-2">
              Export <span className="text-accent">All Bills</span>
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-semibold text-text-muted font-mono">
              {filteredBills.length} {filteredBills.length === 1 ? "bill" : "bills"}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[11px] font-bold text-accent">
              IRD Annexure 5 (अनुसूची ५)
            </span>
          </div>
          <p className="text-[11.5px] text-text-muted hidden sm:block">
            Full comprehensive sales invoice book, statutory audit export, and IRD tax register.
          </p>
        </div>

        {/* Top Right: « Back Button */}
        <div className="flex items-center gap-2">
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

      {/* 2. Top Filter Card: Date from & Date to */}
      <div className="rounded-2xl border border-border bg-surface p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-accent" />
            <h2 className="font-display text-xs sm:text-sm font-bold text-text">Date Filter (मिति अनुसार खोज्नुहोस्)</h2>
          </div>
          {/* Quick presets */}
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

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Date from */}
          <div className="sm:col-span-5 space-y-1">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Date from
            </label>
            <Input
              type="text"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="nepalidate (e.g. 2083-05-01)"
              className="h-8 px-2.5 text-xs font-mono w-full"
            />
          </div>

          {/* Date to */}
          <div className="sm:col-span-5 space-y-1">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Date to
            </label>
            <Input
              type="text"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="nepalidate (e.g. 2083-05-18)"
              className="h-8 px-2.5 text-xs font-mono w-full"
            />
          </div>

          {/* Submit Action Button */}
          <div className="sm:col-span-2 flex items-center gap-1.5">
            <PrimaryButton
              type="button"
              onClick={() => setCurrentPage(1)}
              className="h-8 px-4 text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 w-full cursor-pointer"
            >
              Submit
            </PrimaryButton>
            {(fromDate || toDate) && (
              <GhostButton
                type="button"
                onClick={() => handleDatePreset("all")}
                className="h-8 px-2.5 text-xs font-semibold rounded-lg border border-border hover:bg-surface-hi text-text-muted hover:text-text"
                title="Clear date filter"
              >
                Reset
              </GhostButton>
            )}
          </div>
        </div>
      </div>

      {/* 3. Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-in">
        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-xs">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
            Total Invoiced Turnover
          </span>
          <div className="font-data font-bold text-[15px] text-text mt-0.5 truncate">
            {fmtRs(totals.total)}
          </div>
          <span className="text-[9.5px] text-text-muted truncate block">
            {totals.count} Invoices in period
          </span>
        </div>

        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-xs">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
            Taxable Amount
          </span>
          <div className="font-data font-bold text-[15px] text-accent mt-0.5 truncate">
            {fmtRs(totals.taxable)}
          </div>
          <span className="text-[9.5px] text-text-muted truncate block">Pre-tax sales value</span>
        </div>

        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-xs">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
            13% VAT Collected
          </span>
          <div className="font-data font-bold text-[15px] text-emerald-400 mt-0.5 truncate">
            {fmtRs(totals.vat)}
          </div>
          <span className="text-[9.5px] text-text-muted truncate block">Statutory IRD tax</span>
        </div>

        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-xs">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
            Total Volume Dispensed
          </span>
          <div className="font-data font-bold text-[15px] text-text mt-0.5 truncate">
            {fmtL(totals.totalLiters)}
          </div>
          <span className="text-[9.5px] text-text-muted truncate block">Litres across all grades</span>
        </div>
      </div>

      {/* 4. Main Export Bills Master DataTable Card */}
      <div className="flex flex-col rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        {/* Card Header with Export to Excel Button and Sub-Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-border/70 bg-surface space-y-3">
          <div>
            <GhostButton
              type="button"
              onClick={() => handleExport("excel")}
              className="h-8 px-3 text-xs font-semibold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1.5 rounded-lg shadow-xs transition-colors"
              title="Export all bills to Excel spreadsheet"
            >
              <FileSpreadsheet size={13} />
              <span>Export To Excel</span>
            </GhostButton>
          </div>

          {/* Sub-bar: Print, CSV, Show entries, Search on right */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <GhostButton
                type="button"
                onClick={() => window.print()}
                className="h-8 px-3 text-xs font-semibold border border-border bg-surface hover:bg-surface-hi text-text rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Print Current Register"
              >
                <Printer size={13} className="text-accent" />
                <span>Print</span>
              </GhostButton>

              <GhostButton
                type="button"
                onClick={() => handleExport("csv")}
                className="h-8 px-3 text-xs font-semibold border border-border bg-surface hover:bg-surface-hi text-text rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Export to CSV text file"
              >
                <FileDown size={13} className="text-accent" />
                <span>CSV</span>
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
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter bills..."
                  className="h-8 pl-8 pr-7 text-xs font-medium w-full"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick scroll helpers */}
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
          <table className="w-full text-left text-[12px] min-w-[1360px] border-collapse">
            <thead className="sticky top-0 z-20 border-b border-border bg-surface-hi text-[10px] font-bold uppercase tracking-wider text-text-muted font-data shadow-xs">
              <tr className="whitespace-nowrap">
                <th className="px-1.5 py-2 text-center w-8 text-[9px]">S.N.</th>
                <th className="px-2 py-2 min-w-[120px] text-[9.5px]">Bill No.</th>
                <th className="px-2.5 py-2 min-w-[170px]">Full Name</th>
                <th className="px-2.5 py-2 min-w-[95px]">Pan No.</th>
                <th className="px-2.5 py-2 min-w-[85px]">Bill Date</th>
                <th className="px-2.5 py-2 min-w-[85px]">Invoice Date</th>
                <th className="px-2.5 py-2 text-right font-bold">Sub Total</th>
                <th className="px-2 py-2 text-right">Discount</th>
                <th className="px-2.5 py-2 text-right font-bold">Taxable</th>
                <th className="px-2 py-2 text-right">Non Taxable</th>
                <th className="px-2.5 py-2 text-right font-bold">Vat</th>
                <th className="px-3 py-2 text-right font-black">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {paginatedBills.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-14 text-center text-text-muted font-body">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt size={32} className="text-text-muted/40" />
                      <p className="font-semibold text-[13px] text-text">No bills found</p>
                      <p className="text-[11.5px] max-w-sm text-text-muted">
                        No transactions match the selected date range and filter query.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBills.map((b, idx) => {
                  const { taxable, vat } = vatSplit(b.amount);
                  const sn = (currentPage - 1) * (pageSize || 0) + idx + 1;
                  const custPan = b.customerId ? customerPanById.get(b.customerId) : "";
                  const adDate = b.createdAt ? b.createdAt.slice(0, 10) : "";
                  const fy = fiscalYearOf(new Date(b.createdAt)) || "2083/84";
                  const formattedBillNo = `tb-${b.receiptNo}-${fy.replace("/", "-")}`;

                  return (
                    <tr
                      key={b.id}
                      className={clsx(
                        "group hover:bg-surface-hi/70 transition-colors whitespace-nowrap",
                        b.voided && "opacity-60 bg-error/5"
                      )}
                    >
                      {/* 1. S.N. */}
                      <td className="px-1.5 py-1.5 text-center text-text-muted font-mono text-[9px]">
                        {sn}
                      </td>

                      {/* 2. Bill No. */}
                      <td className="px-2 py-1.5 font-mono">
                        <span className="font-bold text-accent block text-left text-[10px] leading-tight">
                          {formattedBillNo}
                        </span>
                      </td>

                      {/* 3. Full Name */}
                      <td className="px-2.5 py-1.5 font-body">
                        <div className="font-medium text-text truncate max-w-[200px]" title={b.customerName || "CASH"}>
                          {b.customerName || "CASH"}
                        </div>
                        {b.vehicleNo && (
                          <div className="text-[10px] font-mono text-text-muted">
                            {b.vehicleNo}
                          </div>
                        )}
                      </td>

                      {/* 4. Pan No. */}
                      <td className="px-2.5 py-1.5 font-mono text-[10.5px] text-text-muted">
                        {custPan || ""}
                      </td>

                      {/* 5. Bill Date (BS) */}
                      <td className="px-2.5 py-1.5 font-mono text-text-muted text-[11px]">
                        {b.dateBS}
                      </td>

                      {/* 6. Invoice Date (AD) */}
                      <td className="px-2.5 py-1.5 font-mono text-text-muted text-[11px]">
                        {adDate}
                      </td>

                      {/* 7. Sub Total */}
                      <td className="px-2.5 py-1.5 text-right font-mono text-text">
                        {taxable.toFixed(3)}
                      </td>

                      {/* 8. Discount */}
                      <td className="px-2 py-1.5 text-right font-mono text-text-muted">
                        0.000
                      </td>

                      {/* 9. Taxable */}
                      <td className="px-2.5 py-1.5 text-right font-mono text-text font-medium">
                        {taxable.toFixed(3)}
                      </td>

                      {/* 10. Non Taxable */}
                      <td className="px-2 py-1.5 text-right font-mono text-text-muted">
                        0.000
                      </td>

                      {/* 11. Vat */}
                      <td className="px-2.5 py-1.5 text-right font-mono text-emerald-400 font-medium">
                        {vat.toFixed(3)}
                      </td>

                      {/* 12. Total */}
                      <td className="px-3 py-1.5 text-right font-mono font-bold text-text text-[12px]">
                        {b.amount.toFixed(3)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Totals Row (Matching Screenshot Total bar) */}
            {filteredBills.length > 0 && (
              <tfoot className="border-t-2 border-border bg-surface-hi text-[11px] font-mono font-bold">
                <tr className="whitespace-nowrap">
                  <td colSpan={5} className="px-2.5 py-2.5 text-right font-sans font-bold text-text uppercase">
                    Total
                  </td>
                  <td className="px-2.5 py-2.5"></td>
                  <td className="px-2.5 py-2.5 text-right text-text">
                    {totals.taxable.toFixed(3)}
                  </td>
                  <td className="px-2 py-2.5 text-right text-text-muted">
                    0.000
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-accent">
                    {totals.taxable.toFixed(3)}
                  </td>
                  <td className="px-2 py-2.5 text-right text-text-muted">
                    0.000
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-emerald-400">
                    {totals.vat.toFixed(3)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-text font-black text-[12.5px]">
                    {totals.total.toFixed(3)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Table Bottom Footer: Record counter and Pagination */}
        <div className="border-t border-border bg-surface-hi/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-data">
          <div className="flex items-center gap-3 text-text-muted font-sans">
            <span>
              Showing <strong className="text-text font-mono">{filteredBills.length === 0 ? 0 : (currentPage - 1) * (pageSize || 0) + 1}</strong> to{" "}
              <strong className="text-text font-mono">
                {pageSize === 0 ? filteredBills.length : Math.min(currentPage * pageSize, filteredBills.length)}
              </strong> of{" "}
              <strong className="text-text font-mono">{filteredBills.length}</strong> entries
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
                <ChevronLeft size={13} /> Previous
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
        </div>
      </div>
    </div>
  );
}
