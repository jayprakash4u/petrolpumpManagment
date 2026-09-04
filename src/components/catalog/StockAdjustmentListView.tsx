"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  Copy,
  Download,
  FileSpreadsheet,
  Printer,
  FileText,
  CheckCircle2,
  Package,
  Plus,
  ArrowLeft,
  Edit2,
  Save,
  ArrowRightLeft,
} from "lucide-react";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

export interface StockAdjustmentRow {
  id: string;
  sn: number;
  dateBS: string;
  product: string;
  quantity: number;
  tank1: number;
  tank2: number;
  addedBy: string;
  remarksVol: string;
}

const STORAGE_KEY = "fsm_stock_adjustment_ledger_list";

const PRODUCTS_LIST = [
  "MS - PETROL",
  "HSD - Diesel",
  "Transportation",
  "Gulf Pride 4T Plus 20W-40 (1L)",
  "Castrol GTX Diesel 15W-40 (5L)",
  "Radiator Coolant Concentrate (1L)",
];

const INITIAL_ADJUSTMENT_ROWS: StockAdjustmentRow[] = [
  {
    id: "adj-r-6",
    sn: 6,
    dateBS: "2082-04-02",
    product: "HSD - Diesel",
    quantity: 18.15,
    tank1: 0,
    tank2: 0,
    addedBy: "SUPER ADMIN",
    remarksVol: "3000.000",
  },
  {
    id: "adj-r-7",
    sn: 7,
    dateBS: "2082-04-07",
    product: "HSD - Diesel",
    quantity: 24.2,
    tank1: 0,
    tank2: 0,
    addedBy: "SUPER ADMIN",
    remarksVol: "4000.000",
  },
  {
    id: "adj-r-8",
    sn: 8,
    dateBS: "2082-04-07",
    product: "MS - PETROL",
    quantity: 52.8,
    tank1: 0,
    tank2: 0,
    addedBy: "SUPER ADMIN",
    remarksVol: "6000.000",
  },
  {
    id: "adj-r-9",
    sn: 9,
    dateBS: "2082-04-09",
    product: "MS - PETROL",
    quantity: 52.8,
    tank1: 0,
    tank2: 0,
    addedBy: "SUPER ADMIN",
    remarksVol: "6000.000",
  },
  {
    id: "adj-r-10",
    sn: 10,
    dateBS: "2082-04-09",
    product: "HSD - Diesel",
    quantity: 18.15,
    tank1: 0,
    tank2: 0,
    addedBy: "SUPER ADMIN",
    remarksVol: "3000.000",
  },
  {
    id: "adj-r-11",
    sn: 11,
    dateBS: "2082-04-09",
    product: "MS - PETROL",
    quantity: 105.6,
    tank1: 0,
    tank2: 0,
    addedBy: "SUPER ADMIN",
    remarksVol: "12000.000",
  },
  {
    id: "adj-r-12",
    sn: 12,
    dateBS: "2082-04-11",
    product: "MS - PETROL",
    quantity: 26.4,
    tank1: 0,
    tank2: 0,
    addedBy: "SUPER ADMIN",
    remarksVol: "3000.000",
  },
  {
    id: "adj-r-13",
    sn: 13,
    dateBS: "2082-04-11",
    product: "MS - PETROL",
    quantity: 105.6,
    tank1: 0,
    tank2: 0,
    addedBy: "SUPER ADMIN",
    remarksVol: "12000.000",
  },
  {
    id: "adj-r-14",
    sn: 14,
    dateBS: "2082-04-12",
    product: "HSD - Diesel",
    quantity: 18.15,
    tank1: 0,
    tank2: 0,
    addedBy: "SUPER ADMIN",
    remarksVol: "3000.000",
  },
  {
    id: "adj-r-15",
    sn: 15,
    dateBS: "2082-04-12",
    product: "MS - PETROL",
    quantity: 52.8,
    tank1: 0,
    tank2: 0,
    addedBy: "SUPER ADMIN",
    remarksVol: "6000.000",
  },
];

type SortKey = "sn" | "dateBS" | "product" | "quantity" | "tank1" | "tank2" | "addedBy" | "remarksVol";

export function StockAdjustmentListView() {
  const [rows, setRows] = useState<StockAdjustmentRow[]>(() => {
    if (typeof window === "undefined") return INITIAL_ADJUSTMENT_ROWS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ADJUSTMENT_ROWS;
  });

  // Filter inputs
  const [productFilter, setProductFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ product: "", from: "", to: "" });

  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sorting state
  const [sortKey, setSortKey] = useState<SortKey>("sn");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Selected row for Purchase Details Modal
  const [selectedRow, setSelectedRow] = useState<StockAdjustmentRow | null>(null);

  // Inline editing state
  const [editingRow, setEditingRow] = useState<StockAdjustmentRow | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({
      product: productFilter,
      from: fromDate,
      to: toDate,
    });
    setCurrentPage(1);
  };

  // Filter & Search pipeline
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (appliedFilters.product && r.product !== appliedFilters.product) return false;
      if (appliedFilters.from && r.dateBS < appliedFilters.from) return false;
      if (appliedFilters.to && r.dateBS > appliedFilters.to) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchProd = r.product.toLowerCase().includes(q);
        const matchDate = r.dateBS.includes(q);
        const matchUser = r.addedBy.toLowerCase().includes(q);
        const matchQty = String(r.quantity).includes(q);
        const matchRem = r.remarksVol.toLowerCase().includes(q);
        const matchSn = String(r.sn).includes(q);
        if (!matchProd && !matchDate && !matchUser && !matchQty && !matchRem && !matchSn) return false;
      }
      return true;
    });
  }, [rows, appliedFilters, searchQuery]);

  // Sorted list
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA: any = a[sortKey];
      let valB: any = b[sortKey];

      if (typeof valA === "string") {
        const cmp = valA.localeCompare(valB);
        return sortOrder === "asc" ? cmp : -cmp;
      }
      if (typeof valA === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [filtered, sortKey, sortOrder]);

  // Paginated rows
  const totalEntriesCount = 415;
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const displayed = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  // Totals calculations
  const totalQuantity = useMemo(() => {
    return filtered.reduce((sum, r) => sum + r.quantity, 0);
  }, [filtered]);

  const totalTank1 = useMemo(() => {
    return filtered.reduce((sum, r) => sum + r.tank1, 0);
  }, [filtered]);

  const totalTank2 = useMemo(() => {
    return filtered.reduce((sum, r) => sum + r.tank2, 0);
  }, [filtered]);

  const totalRemarksVol = useMemo(() => {
    return filtered.reduce((sum, r) => sum + (parseFloat(r.remarksVol) || 0), 0);
  }, [filtered]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this stock adjustment record?")) {
      const updated = rows.filter((r) => r.id !== id);
      setRows(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      setSuccessMessage("Adjustment record deleted successfully.");
      setTimeout(() => setSuccessMessage(null), 2500);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;

    const updated = rows.map((r) => (r.id === editingRow.id ? editingRow : r));
    setRows(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    setEditingRow(null);
    setSuccessMessage("Adjustment record updated successfully.");
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  // Copy to clipboard
  const handleCopy = () => {
    const headers = ["S.N.", "Date", "Product", "Quantity", "Tank 1", "Tank 2", "Added By", "Remarks"];
    const textRows = filtered.map((r) => [
      r.sn,
      r.dateBS,
      r.product,
      r.quantity.toFixed(3),
      r.tank1 > 0 ? r.tank1.toFixed(3) : "",
      r.tank2 > 0 ? r.tank2.toFixed(3) : "",
      r.addedBy,
      r.remarksVol,
    ]);
    const text = [headers.join("\t"), ...textRows.map((row) => row.join("\t"))].join("\n");
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["S.N.", "Date", "Product", "Quantity", "Tank 1", "Tank 2", "Added By", "Remarks"];
    const textRows = filtered.map((r) => [
      r.sn,
      r.dateBS,
      `"${r.product.replace(/"/g, '""')}"`,
      r.quantity.toFixed(3),
      r.tank1 > 0 ? r.tank1.toFixed(3) : "",
      r.tank2 > 0 ? r.tank2.toFixed(3) : "",
      `"${r.addedBy}"`,
      `"${r.remarksVol}"`,
    ]);
    const csv = [headers.join(","), ...textRows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock_adjustment_list_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown size={11} className="text-text-muted/40 ml-1 inline shrink-0" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp size={11} className="text-accent font-bold ml-1 inline shrink-0" />
    ) : (
      <ArrowDown size={11} className="text-accent font-bold ml-1 inline shrink-0" />
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. Page Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3 print:hidden">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl flex items-center gap-2">
            <ArrowRightLeft size={20} className="text-accent" />
            <span>Stock Adjustment List</span>
          </h1>
          <p className="text-[12px] text-text-muted mt-0.5">
            Audit logs of tank evaporations, calibration volume variances, and dip test reconciliations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/catalog/adjustment">
            <PrimaryButton type="button" className="h-8 gap-1.5 px-3 text-xs font-semibold shadow-xs">
              <Plus size={14} />
              <span>Add Stock</span>
            </PrimaryButton>
          </Link>
          <Link href="/catalog">
            <GhostButton
              type="button"
              className="h-8 px-3 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-surface-hi flex items-center gap-1.5 cursor-pointer text-text hover:text-accent transition-colors shadow-xs"
            >
              <ArrowLeft size={13} />
              <span>« Back</span>
            </GhostButton>
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="animate-fade-in flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs font-semibold text-success shadow-xs">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. Main Box / Card */}
      <div className="rounded-xl border border-border bg-surface shadow-xs print:border-none print:shadow-none p-4 sm:p-5 space-y-4">
        {/* Card Header Title */}
        <div className="font-display text-xs font-bold text-text uppercase tracking-wider border-b border-border/80 pb-3">
          Stock Adjustment Filter
        </div>

        {/* Top Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end print:hidden">
          {/* --Select Product-- */}
          <div className="sm:col-span-4 space-y-1">
            <label className="text-xs font-medium text-text-muted">Select Product:</label>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="h-8.5 w-full rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-text focus:border-accent focus:outline-hidden cursor-pointer"
            >
              <option value="">--Select Product--</option>
              {PRODUCTS_LIST.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Select Date (From Date) */}
          <div className="sm:col-span-3 space-y-1">
            <label className="text-xs font-medium text-text-muted">From Date (BS):</label>
            <input
              type="text"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8.5 w-full rounded-lg border border-border bg-surface px-2.5 text-xs font-mono text-text focus:border-accent focus:outline-hidden"
            />
          </div>

          {/* To Date */}
          <div className="sm:col-span-3 space-y-1">
            <label className="text-xs font-medium text-text-muted">To Date (BS):</label>
            <input
              type="text"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8.5 w-full rounded-lg border border-border bg-surface px-2.5 text-xs font-mono text-text focus:border-accent focus:outline-hidden"
            />
          </div>

          {/* Filter Action Button */}
          <div className="sm:col-span-2">
            <PrimaryButton
              type="button"
              onClick={handleApplyFilter}
              className="h-8.5 w-full text-xs font-semibold shadow-xs"
            >
              Filter
            </PrimaryButton>
          </div>
        </div>

        {/* Export Toolbar & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60 print:hidden">
          {/* Left export buttons & show entries */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1">
              <GhostButton
                type="button"
                onClick={handleCopy}
                className="h-8 px-2.5 text-xs font-semibold gap-1.5"
              >
                <Copy size={13} />
                <span>{copyFeedback ? "Copied" : "Copy"}</span>
              </GhostButton>

              <GhostButton
                type="button"
                onClick={handleExportCSV}
                className="h-8 px-2.5 text-xs font-semibold gap-1.5"
              >
                <Download size={13} />
                <span>CSV</span>
              </GhostButton>

              <GhostButton
                type="button"
                onClick={handleExportCSV}
                className="h-8 px-2.5 text-xs font-semibold gap-1.5"
              >
                <FileSpreadsheet size={13} />
                <span>Excel</span>
              </GhostButton>

              <GhostButton
                type="button"
                onClick={handlePrint}
                className="h-8 px-2.5 text-xs font-semibold gap-1.5"
              >
                <Printer size={13} />
                <span>Print</span>
              </GhostButton>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-text-muted ml-2">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-border bg-surface px-2 text-xs font-semibold text-text focus:border-accent focus:outline-hidden cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          {/* Right Search Input */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-text-muted">Search:</label>
            <div className="relative w-48 sm:w-56">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 pl-7.5 pr-6 text-xs w-full rounded-lg border border-border bg-surface text-text focus:border-accent focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. 9-Column Data Ledger Table */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[900px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-hi/80 font-data text-[11px] tracking-wide text-text-muted select-none">
                <th
                  onClick={() => handleSort("sn")}
                  className="border-r border-border/60 px-3 py-2.5 text-center w-14 cursor-pointer hover:bg-surface-hi font-medium"
                >
                  <span>S.N.</span>
                  {renderSortIcon("sn")}
                </th>
                <th
                  onClick={() => handleSort("dateBS")}
                  className="border-r border-border/60 px-3 py-2.5 cursor-pointer hover:bg-surface-hi font-medium"
                >
                  <span>Date</span>
                  {renderSortIcon("dateBS")}
                </th>
                <th
                  onClick={() => handleSort("product")}
                  className="border-r border-border/60 px-3 py-2.5 cursor-pointer hover:bg-surface-hi font-medium"
                >
                  <span>Product</span>
                  {renderSortIcon("product")}
                </th>
                <th
                  onClick={() => handleSort("quantity")}
                  className="border-r border-border/60 px-3 py-2.5 text-right cursor-pointer hover:bg-surface-hi font-medium"
                >
                  <span>Quantity</span>
                  {renderSortIcon("quantity")}
                </th>
                <th
                  onClick={() => handleSort("tank1")}
                  className="border-r border-border/60 px-3 py-2.5 text-right cursor-pointer hover:bg-surface-hi font-medium"
                >
                  <span>Tank 1</span>
                  {renderSortIcon("tank1")}
                </th>
                <th
                  onClick={() => handleSort("tank2")}
                  className="border-r border-border/60 px-3 py-2.5 text-right cursor-pointer hover:bg-surface-hi font-medium"
                >
                  <span>Tank 2</span>
                  {renderSortIcon("tank2")}
                </th>
                <th
                  onClick={() => handleSort("addedBy")}
                  className="border-r border-border/60 px-3 py-2.5 text-center cursor-pointer hover:bg-surface-hi font-medium"
                >
                  <span>Added By</span>
                  {renderSortIcon("addedBy")}
                </th>
                <th
                  onClick={() => handleSort("remarksVol")}
                  className="border-r border-border/60 px-3 py-2.5 text-right cursor-pointer hover:bg-surface-hi font-medium"
                >
                  <span>Remarks</span>
                  {renderSortIcon("remarksVol")}
                </th>
                <th className="px-3 py-2.5 text-center w-28 print:hidden font-medium">
                  <span>Action</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 text-[11.5px]">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package size={22} className="text-text-muted/40" />
                      <span>No records found in stock adjustment list.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                displayed.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-surface-hi/40 transition-colors whitespace-nowrap font-normal"
                  >
                    {/* S.N. */}
                    <td className="border-r border-border/60 px-3 py-3 text-center font-data text-text-muted">
                      {r.sn}
                    </td>

                    {/* Date */}
                    <td className="border-r border-border/60 px-3 py-3 font-mono text-text">
                      {r.dateBS}
                    </td>

                    {/* Product */}
                    <td className="border-r border-border/60 px-3 py-3 font-semibold text-text">
                      {r.product}
                    </td>

                    {/* Quantity */}
                    <td className="border-r border-border/60 px-3 py-3 text-right font-data font-bold text-accent">
                      {r.quantity.toFixed(3)}
                    </td>

                    {/* Tank 1 */}
                    <td className="border-r border-border/60 px-3 py-3 text-right font-data text-text-muted">
                      {r.tank1 > 0 ? r.tank1.toFixed(3) : ""}
                    </td>

                    {/* Tank 2 */}
                    <td className="border-r border-border/60 px-3 py-3 text-right font-data text-text-muted">
                      {r.tank2 > 0 ? r.tank2.toFixed(3) : ""}
                    </td>

                    {/* Added By */}
                    <td className="border-r border-border/60 px-3 py-3 text-center text-text-muted font-medium">
                      {r.addedBy}
                    </td>

                    {/* Remarks */}
                    <td className="border-r border-border/60 px-3 py-3 text-right font-data text-text-muted">
                      {r.remarksVol}
                    </td>

                    {/* Action Links */}
                    <td className="px-3 py-3 text-center print:hidden">
                      <div className="flex flex-col items-center gap-0.5 text-[11px] leading-tight">
                        <button
                          type="button"
                          onClick={() => setEditingRow(r)}
                          className="text-text hover:text-accent font-semibold hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRow(r)}
                          className="text-text-muted hover:text-text font-semibold hover:underline cursor-pointer"
                        >
                          Purchase Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          className="text-error hover:underline font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* 4. Total / Summary Row */}
            {displayed.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-surface-hi/80 font-data text-xs font-bold text-text whitespace-nowrap">
                  <td className="border-r border-border/60 px-3 py-2.5 text-center font-data">10/30</td>
                  <td className="border-r border-border/60 px-3 py-2.5"></td>
                  <td className="border-r border-border/60 px-3 py-2.5 font-sans font-bold">TOTAL</td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-bold text-accent">
                    {totalQuantity.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                  </td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-medium text-text">
                    {totalTank1}
                  </td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-medium text-text">
                    {totalTank2}
                  </td>
                  <td className="border-r border-border/60 px-3 py-2.5"></td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-bold text-text">
                    {totalRemarksVol.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                  </td>
                  <td className="px-3 py-2.5 print:hidden"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* 5. Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-text-muted pt-1 print:hidden">
          <div>
            Showing {displayed.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, sorted.length)} of {totalEntriesCount} entries
          </div>

          <div className="flex items-center gap-1">
            <GhostButton
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7.5 px-2.5 text-xs font-semibold disabled:opacity-40"
            >
              Previous
            </GhostButton>
            {[1, 2, 3, 4].map((pageNum) => {
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-7.5 w-7.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs ${
                    isActive
                      ? "bg-accent text-[#1A1306] font-bold"
                      : "border border-border bg-surface text-text hover:bg-surface-hi"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <span className="h-7.5 px-2 flex items-center justify-center text-xs text-text-muted">
              …
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(42)}
              className={`h-7.5 px-2.5 rounded-lg border border-border text-xs font-semibold cursor-pointer ${
                currentPage === 42 ? "bg-accent text-[#1A1306] font-bold" : "bg-surface text-text hover:bg-surface-hi"
              }`}
            >
              42
            </button>
            <GhostButton
              type="button"
              disabled={currentPage >= 42}
              onClick={() => setCurrentPage((p) => Math.min(42, p + 1))}
              className="h-7.5 px-2.5 text-xs font-semibold disabled:opacity-40"
            >
              Next
            </GhostButton>
          </div>
        </div>
      </div>

      {/* 6. Purchase Details Modal */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="font-display text-sm font-bold text-text flex items-center gap-2">
                <FileText size={16} className="text-accent" />
                <span>Adjustment Purchase Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="rounded-lg p-1 text-text-muted hover:bg-surface-hi hover:text-text cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-text-muted">
              <div className="flex justify-between py-1 border-b border-border/60">
                <span>S.N.:</span>
                <strong className="text-text font-mono">#{selectedRow.sn}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span>Date:</span>
                <strong className="text-text font-mono">{selectedRow.dateBS}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span>Product:</span>
                <strong className="text-text font-display">{selectedRow.product}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span>Quantity:</span>
                <strong className="text-accent font-data">{selectedRow.quantity.toFixed(3)} L</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span>Tank Allocations:</span>
                <span className="text-text">Tank 1: {selectedRow.tank1} | Tank 2: {selectedRow.tank2}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span>Added By:</span>
                <strong className="text-text">{selectedRow.addedBy}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Remarks / Vol:</span>
                <strong className="text-text font-mono">{selectedRow.remarksVol}</strong>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <GhostButton
                type="button"
                onClick={() => setSelectedRow(null)}
                className="h-8 px-4 text-xs font-semibold"
              >
                Close
              </GhostButton>
            </div>
          </div>
        </div>
      )}

      {/* 7. Edit Record Modal */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="font-display text-sm font-bold text-text flex items-center gap-2">
                <Edit2 size={16} className="text-accent" />
                <span>Edit Stock Adjustment Record (#{editingRow.sn})</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="rounded-lg p-1 text-text-muted hover:bg-surface-hi hover:text-text cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted">Date (BS)</label>
                  <input
                    type="text"
                    value={editingRow.dateBS}
                    onChange={(e) => setEditingRow({ ...editingRow, dateBS: e.target.value })}
                    className="h-8.5 w-full rounded-lg border border-border bg-surface px-2.5 font-mono text-text focus:border-accent focus:outline-hidden"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted">Product</label>
                  <select
                    value={editingRow.product}
                    onChange={(e) => setEditingRow({ ...editingRow, product: e.target.value })}
                    className="h-8.5 w-full rounded-lg border border-border bg-surface px-2.5 text-text focus:border-accent focus:outline-hidden cursor-pointer"
                    required
                  >
                    {PRODUCTS_LIST.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted">Quantity</label>
                  <input
                    type="number"
                    step="0.001"
                    value={editingRow.quantity}
                    onChange={(e) => setEditingRow({ ...editingRow, quantity: parseFloat(e.target.value) || 0 })}
                    className="h-8.5 w-full rounded-lg border border-border bg-surface px-2.5 font-data text-text focus:border-accent focus:outline-hidden"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted">Tank 1</label>
                  <input
                    type="number"
                    step="0.001"
                    value={editingRow.tank1}
                    onChange={(e) => setEditingRow({ ...editingRow, tank1: parseFloat(e.target.value) || 0 })}
                    className="h-8.5 w-full rounded-lg border border-border bg-surface px-2.5 font-data text-text focus:border-accent focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted">Tank 2</label>
                  <input
                    type="number"
                    step="0.001"
                    value={editingRow.tank2}
                    onChange={(e) => setEditingRow({ ...editingRow, tank2: parseFloat(e.target.value) || 0 })}
                    className="h-8.5 w-full rounded-lg border border-border bg-surface px-2.5 font-data text-text focus:border-accent focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-muted">Remarks</label>
                <input
                  type="text"
                  value={editingRow.remarksVol}
                  onChange={(e) => setEditingRow({ ...editingRow, remarksVol: e.target.value })}
                  className="h-8.5 w-full rounded-lg border border-border bg-surface px-2.5 text-text focus:border-accent focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <GhostButton
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="h-8 px-3 text-xs font-semibold"
                >
                  Cancel
                </GhostButton>
                <PrimaryButton
                  type="submit"
                  className="h-8 gap-1.5 px-4 text-xs font-semibold shadow-xs"
                >
                  <Save size={13} />
                  <span>Save Changes</span>
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
