"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Copy,
  Download,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  Package,
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  Calendar,
  X,
  Coins,
  Check,
  Building2,
  FileText,
} from "lucide-react";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

export interface FiscalOpeningStockRow {
  id: string;
  sn: number;
  fiscalYear: string;
  product: string;
  stock: number;
  amount: number;
  total: number;
}

const STORAGE_KEY = "fsm_fiscal_opening_stock_records";

const FISCAL_YEAR_OPTIONS = [
  "2083/2084",
  "2082/2083",
  "2081/2082",
  "2080/2081",
  "2079/2080",
];

const COMMON_PRODUCTS = [
  "MS - PETROL",
  "HSD - Diesel",
  "Servo Pride 20W40 (5L)",
  "Mak 4T Plus 10W30 (1L)",
  "Mobil Delvac 15W40 (20L)",
  "Castrol GTX Diesel 15W-40 (5L)",
  "Gulf Pride 4T Plus 20W-40 (1L)",
  "Radiator Coolant Concentrate (1L)",
  "Transportation",
];

const INITIAL_FISCAL_OPENING_RECORDS: FiscalOpeningStockRow[] = [
  {
    id: "fos-1",
    sn: 1,
    fiscalYear: "2083/2084",
    product: "MS - PETROL",
    stock: 30084.0,
    amount: 160.0,
    total: 4813440.0,
  },
  {
    id: "fos-2",
    sn: 2,
    fiscalYear: "2083/2084",
    product: "HSD - Diesel",
    stock: 14805.46,
    amount: 128.67,
    total: 1905018.54,
  },
  {
    id: "fos-3",
    sn: 3,
    fiscalYear: "2083/2084",
    product: "Servo Pride 20W40 (5L)",
    stock: 120.0,
    amount: 450.0,
    total: 54000.0,
  },
  {
    id: "fos-4",
    sn: 4,
    fiscalYear: "2083/2084",
    product: "Mak 4T Plus 10W30 (1L)",
    stock: 85.0,
    amount: 480.0,
    total: 40800.0,
  },
  {
    id: "fos-5",
    sn: 5,
    fiscalYear: "2083/2084",
    product: "Transportation",
    stock: 0.0,
    amount: 0.0,
    total: 0.0,
  },
  {
    id: "fos-6",
    sn: 6,
    fiscalYear: "2082/2083",
    product: "MS - PETROL",
    stock: 24500.0,
    amount: 155.0,
    total: 3797500.0,
  },
  {
    id: "fos-7",
    sn: 7,
    fiscalYear: "2082/2083",
    product: "HSD - Diesel",
    stock: 18200.0,
    amount: 122.5,
    total: 2229500.0,
  },
  {
    id: "fos-8",
    sn: 8,
    fiscalYear: "2082/2083",
    product: "Mobil Delvac 15W40 (20L)",
    stock: 60.0,
    amount: 420.0,
    total: 25200.0,
  },
];

type SortField = "sn" | "fiscalYear" | "product" | "stock" | "amount" | "total";
type SortOrder = "asc" | "desc";

interface FiscalOpeningStockViewProps {
  stationName?: string;
  stationAddress?: string;
}

export function FiscalOpeningStockView({
  stationName = "Nepal Petroleum",
  stationAddress = "New Baneshwor-31, Kathmandu",
}: FiscalOpeningStockViewProps) {
  // Local storage persistence
  const [records, setRecords] = useState<FiscalOpeningStockRow[]>(() => {
    if (typeof window === "undefined") return INITIAL_FISCAL_OPENING_RECORDS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_FISCAL_OPENING_RECORDS;
  });

  const saveRecords = (newRecords: FiscalOpeningStockRow[]) => {
    setRecords(newRecords);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
    } catch {}
  };

  // Top Filter state
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");
  const [appliedFiscalYear, setAppliedFiscalYear] = useState<string>("");

  // Search & Pagination & Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<SortField>("sn");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<FiscalOpeningStockRow | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Add / Edit Form State
  const [formFiscalYear, setFormFiscalYear] = useState("2083/2084");
  const [formProduct, setFormProduct] = useState("MS - PETROL");
  const [formCustomProduct, setFormCustomProduct] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formAmount, setFormAmount] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle filter submit
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFiscalYear(selectedFiscalYear);
    setCurrentPage(1);
    if (selectedFiscalYear) {
      showToast(`Showing opening stock for Fiscal Year ${selectedFiscalYear}`);
    } else {
      showToast("Showing opening stock for All Fiscal Years");
    }
  };

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Filtered & Sorted dataset
  const filteredAndSorted = useMemo(() => {
    let result = records.filter((r) => {
      if (appliedFiscalYear && r.fiscalYear !== appliedFiscalYear) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesProduct = r.product.toLowerCase().includes(q);
        const matchesFy = r.fiscalYear.toLowerCase().includes(q);
        const matchesStock = String(r.stock).includes(q);
        const matchesAmount = String(r.amount).includes(q);
        const matchesTotal = String(r.total).includes(q);
        const matchesSn = String(r.sn).includes(q);
        return (
          matchesProduct ||
          matchesFy ||
          matchesStock ||
          matchesAmount ||
          matchesTotal ||
          matchesSn
        );
      }
      return true;
    });

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [records, appliedFiscalYear, searchQuery, sortField, sortOrder]);

  // Pagination calculation
  const totalEntries = filteredAndSorted.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, currentPage, pageSize]);

  // Overall Totals for Table Footer
  const totalStockSum = useMemo(() => {
    return filteredAndSorted.reduce((sum, r) => sum + r.stock, 0);
  }, [filteredAndSorted]);

  const totalAmountSum = useMemo(() => {
    return filteredAndSorted.reduce((sum, r) => sum + r.amount, 0);
  }, [filteredAndSorted]);

  const totalValuationSum = useMemo(() => {
    return filteredAndSorted.reduce((sum, r) => sum + r.total, 0);
  }, [filteredAndSorted]);

  // Export handlers
  const handleCopy = () => {
    const headers = ["SN", "Fiscal Year", "Product", "Stock", "Amount", "Total"];
    const rows = filteredAndSorted.map((r) => [
      r.sn,
      r.fiscalYear,
      r.product,
      r.stock.toFixed(2),
      r.amount.toFixed(2),
      r.total.toFixed(2),
    ]);
    const summary = [
      "",
      "",
      "Total",
      totalStockSum.toFixed(2),
      totalAmountSum.toFixed(2),
      totalValuationSum.toFixed(2),
    ];
    const textToCopy = [
      `${stationName} - Fiscal Year Opening Stock (${appliedFiscalYear || "All"})`,
      headers.join("\t"),
      ...rows.map((r) => r.join("\t")),
      summary.join("\t"),
    ].join("\n");

    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast("Table data copied to clipboard!");
    });
  };

  const handleDownloadCSV = () => {
    const headers = ["SN", "Fiscal Year", "Product", "Stock", "Amount", "Total"];
    const rows = filteredAndSorted.map((r) => [
      r.sn,
      `"${r.fiscalYear}"`,
      `"${r.product.replace(/"/g, '""')}"`,
      r.stock.toFixed(2),
      r.amount.toFixed(2),
      r.total.toFixed(2),
    ]);
    const summary = [
      "",
      "",
      "Total",
      totalStockSum.toFixed(2),
      totalAmountSum.toFixed(2),
      totalValuationSum.toFixed(2),
    ];
    const csvContent = [
      `"${stationName}"`,
      `"${stationAddress}"`,
      `"Fiscal Year Opening Stock (${appliedFiscalYear || "All"})"`,
      "",
      headers.join(","),
      ...rows.map((r) => r.join(",")),
      summary.join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fiscal_opening_stock_${(appliedFiscalYear || "all").replace("/", "-")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("CSV file exported successfully!");
  };

  const handlePrint = () => {
    window.print();
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormFiscalYear(appliedFiscalYear || "2083/2084");
    setFormProduct("MS - PETROL");
    setFormCustomProduct("");
    setFormStock("");
    setFormAmount("");
    setEditingRow(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (row: FiscalOpeningStockRow) => {
    setEditingRow(row);
    setFormFiscalYear(row.fiscalYear);
    if (COMMON_PRODUCTS.includes(row.product)) {
      setFormProduct(row.product);
      setFormCustomProduct("");
    } else {
      setFormProduct("Custom");
      setFormCustomProduct(row.product);
    }
    setFormStock(String(row.stock));
    setFormAmount(String(row.amount));
    setIsAddModalOpen(true);
  };

  // Handle Add/Edit Save
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProduct = formProduct === "Custom" ? formCustomProduct.trim() : formProduct;
    const stockNum = parseFloat(formStock) || 0;
    const amountNum = parseFloat(formAmount) || 0;
    const totalVal = stockNum * amountNum;

    if (!finalProduct) {
      alert("Please specify a product name.");
      return;
    }

    if (editingRow) {
      const updated = records.map((r) =>
        r.id === editingRow.id
          ? {
              ...r,
              fiscalYear: formFiscalYear,
              product: finalProduct,
              stock: stockNum,
              amount: amountNum,
              total: totalVal,
            }
          : r
      );
      saveRecords(updated);
      showToast(`Opening stock for "${finalProduct}" updated successfully!`);
    } else {
      const newRow: FiscalOpeningStockRow = {
        id: `fos-${Date.now()}`,
        sn: records.length + 1,
        fiscalYear: formFiscalYear,
        product: finalProduct,
        stock: stockNum,
        amount: amountNum,
        total: totalVal,
      };
      saveRecords([...records, newRow]);
      showToast(`Additional opening stock added for "${finalProduct}"!`);
    }

    setIsAddModalOpen(false);
  };

  // Handle Delete
  const handleDelete = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    // re-index SN
    const reIndexed = updated.map((r, i) => ({ ...r, sn: i + 1 }));
    saveRecords(reIndexed);
    setDeleteConfirmId(null);
    showToast("Opening stock record deleted.");
  };

  // Reset to initial records
  const handleResetSample = () => {
    if (confirm("Reset opening stock records to default dataset?")) {
      saveRecords(INITIAL_FISCAL_OPENING_RECORDS);
      showToast("Reset to default fiscal opening stocks.");
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. Page Header with Title & Add Link */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3 print:hidden">
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl">
              Fiscal Year Opening Stock
            </h1>
            <Link
              href="/catalog/additional-opening-stock"
              className="text-xs font-semibold text-accent hover:underline hover:text-accent-hover transition-colors cursor-pointer"
            >
              (Add Additional Opening Stock)
            </Link>
          </div>
          <p className="text-[12px] text-text-muted mt-0.5">
            Initial product inventories, unit valuations, and total asset capitalizations per fiscal year.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PrimaryButton
            type="button"
            onClick={openAddModal}
            className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Plus size={14} />
            <span>Add Opening Stock</span>
          </PrimaryButton>

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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="animate-fade-in flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3 text-xs font-semibold text-success shadow-xs">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Main Box Card */}
      <div className="rounded-xl border border-border bg-surface shadow-xs print:border-none print:shadow-none space-y-4 p-4 sm:p-5">
        {/* Top Filter Form */}
        <div className="border-b border-border/80 pb-4 print:hidden">
          <form
            onSubmit={handleFilterSubmit}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="w-full sm:w-72 space-y-1">
              <label className="text-xs font-medium text-text-muted">
                Select Fiscal Year:
              </label>
              <select
                value={selectedFiscalYear}
                onChange={(e) => setSelectedFiscalYear(e.target.value)}
                className="h-8.5 w-full rounded-lg border border-border bg-surface px-2.5 text-xs text-text focus:border-accent focus:outline-hidden"
              >
                <option value="">--Select Fiscal Year--</option>
                {FISCAL_YEAR_OPTIONS.map((fy) => (
                  <option key={fy} value={fy}>
                    {fy}
                  </option>
                ))}
              </select>
            </div>

            <PrimaryButton
              type="submit"
              className="h-8.5 px-6 text-xs font-semibold shadow-xs"
            >
              Filter
            </PrimaryButton>

            {appliedFiscalYear && (
              <GhostButton
                type="button"
                onClick={() => {
                  setSelectedFiscalYear("");
                  setAppliedFiscalYear("");
                  showToast("Cleared fiscal year filter.");
                }}
                className="h-8.5 px-3 text-xs text-text-muted hover:text-text"
              >
                Clear Filter
              </GhostButton>
            )}
          </form>
        </div>

        {/* Station Branding for Print view */}
        <div className="hidden print:block text-center py-2 space-y-1 border-b border-border">
          <h2 className="text-xl font-bold text-text">{stationName}</h2>
          <p className="text-xs text-text-muted">{stationAddress}</p>
          <p className="text-xs font-semibold text-accent">
            Fiscal Year Opening Stock {appliedFiscalYear ? `(${appliedFiscalYear})` : "(All Years)"}
          </p>
        </div>

        {/* DataTables Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 print:hidden">
          {/* Left Buttons: Copy, CSV, Excel, Print & Page Size */}
          <div className="flex flex-wrap items-center gap-1.5">
            <GhostButton
              type="button"
              onClick={handleCopy}
              className="h-8 px-2.5 text-xs font-semibold rounded-md border border-border bg-surface hover:bg-surface-hi flex items-center gap-1 text-text shadow-2xs"
            >
              <Copy size={13} />
              <span>Copy</span>
            </GhostButton>

            <GhostButton
              type="button"
              onClick={handleDownloadCSV}
              className="h-8 px-2.5 text-xs font-semibold rounded-md border border-border bg-surface hover:bg-surface-hi flex items-center gap-1 text-text shadow-2xs"
            >
              <FileSpreadsheet size={13} />
              <span>CSV</span>
            </GhostButton>

            <GhostButton
              type="button"
              onClick={handleDownloadCSV}
              className="h-8 px-2.5 text-xs font-semibold rounded-md border border-border bg-surface hover:bg-surface-hi flex items-center gap-1 text-text shadow-2xs"
            >
              <Download size={13} />
              <span>Excel</span>
            </GhostButton>

            <GhostButton
              type="button"
              onClick={handlePrint}
              className="h-8 px-2.5 text-xs font-semibold rounded-md border border-border bg-surface hover:bg-surface-hi flex items-center gap-1 text-text shadow-2xs"
            >
              <Printer size={13} />
              <span>Print</span>
            </GhostButton>

            {/* Show entries dropdown */}
            <div className="flex items-center gap-1.5 pl-2 text-xs text-text-muted">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-md border border-border bg-surface px-2 text-xs font-mono text-text focus:border-accent focus:outline-hidden"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          {/* Right: Search input */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Search:</span>
            <div className="relative w-44 sm:w-56">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 pl-7.5 pr-2.5 text-xs w-full rounded-md border border-border bg-surface text-text focus:border-accent focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* 3. Table Layout */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[700px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-hi/80 font-data text-[11px] tracking-wide text-text-muted select-none">
                {/* SN */}
                <th
                  onClick={() => handleSort("sn")}
                  className="border-r border-border/60 px-3 py-2.5 text-center w-14 font-medium cursor-pointer hover:text-text hover:bg-surface-hi transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>SN</span>
                    {sortField === "sn" ? (
                      sortOrder === "asc" ? <ArrowUp size={12} className="text-accent" /> : <ArrowDown size={12} className="text-accent" />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-40" />
                    )}
                  </div>
                </th>

                {/* Fiscal Year */}
                <th
                  onClick={() => handleSort("fiscalYear")}
                  className="border-r border-border/60 px-3 py-2.5 w-32 font-medium cursor-pointer hover:text-text hover:bg-surface-hi transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Fiscal Year</span>
                    {sortField === "fiscalYear" ? (
                      sortOrder === "asc" ? <ArrowUp size={12} className="text-accent" /> : <ArrowDown size={12} className="text-accent" />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-40" />
                    )}
                  </div>
                </th>

                {/* Product */}
                <th
                  onClick={() => handleSort("product")}
                  className="border-r border-border/60 px-3 py-2.5 font-medium cursor-pointer hover:text-text hover:bg-surface-hi transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Product</span>
                    {sortField === "product" ? (
                      sortOrder === "asc" ? <ArrowUp size={12} className="text-accent" /> : <ArrowDown size={12} className="text-accent" />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-40" />
                    )}
                  </div>
                </th>

                {/* Stock */}
                <th
                  onClick={() => handleSort("stock")}
                  className="border-r border-border/60 px-3 py-2.5 text-right w-32 font-medium cursor-pointer hover:text-text hover:bg-surface-hi transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Stock</span>
                    {sortField === "stock" ? (
                      sortOrder === "asc" ? <ArrowUp size={12} className="text-accent" /> : <ArrowDown size={12} className="text-accent" />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-40" />
                    )}
                  </div>
                </th>

                {/* Amount */}
                <th
                  onClick={() => handleSort("amount")}
                  className="border-r border-border/60 px-3 py-2.5 text-right w-28 font-medium cursor-pointer hover:text-text hover:bg-surface-hi transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount</span>
                    {sortField === "amount" ? (
                      sortOrder === "asc" ? <ArrowUp size={12} className="text-accent" /> : <ArrowDown size={12} className="text-accent" />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-40" />
                    )}
                  </div>
                </th>

                {/* Total */}
                <th
                  onClick={() => handleSort("total")}
                  className="border-r border-border/60 px-3 py-2.5 text-right w-36 font-medium cursor-pointer hover:text-text hover:bg-surface-hi transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total</span>
                    {sortField === "total" ? (
                      sortOrder === "asc" ? <ArrowUp size={12} className="text-accent" /> : <ArrowDown size={12} className="text-accent" />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-40" />
                    )}
                  </div>
                </th>

                {/* Action */}
                <th className="px-3 py-2.5 text-center w-28 font-medium print:hidden">
                  <span>Action</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 text-[11.5px]">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-text-muted font-sans"
                  >
                    No data available in table
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-surface-hi/40 transition-colors whitespace-nowrap text-text"
                  >
                    {/* SN */}
                    <td className="border-r border-border/60 px-3 py-2.5 text-center font-data text-text-muted">
                      {r.sn}
                    </td>

                    {/* Fiscal Year */}
                    <td className="border-r border-border/60 px-3 py-2.5 font-mono text-text">
                      {r.fiscalYear}
                    </td>

                    {/* Product */}
                    <td className="border-r border-border/60 px-3 py-2.5 font-medium text-text">
                      {r.product}
                    </td>

                    {/* Stock */}
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data font-semibold text-text">
                      {r.stock.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Amount */}
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data text-text-muted">
                      {r.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Total */}
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data font-bold text-accent">
                      {r.total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Action */}
                    <td className="px-3 py-2.5 text-center print:hidden">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(r)}
                          title="Edit opening stock"
                          className="h-7 w-7 rounded-md border border-border bg-surface hover:bg-surface-hi flex items-center justify-center text-text-muted hover:text-accent transition-colors shadow-2xs"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(r.id)}
                          title="Delete opening stock"
                          className="h-7 w-7 rounded-md border border-border bg-surface hover:bg-surface-hi flex items-center justify-center text-text-muted hover:text-error transition-colors shadow-2xs"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Total Footer Row matching reference */}
            <tfoot>
              <tr className="border-t-2 border-border bg-surface-hi/80 font-data text-xs font-bold text-text whitespace-nowrap">
                <td className="border-r border-border/60 px-3 py-2.5"></td>
                <td className="border-r border-border/60 px-3 py-2.5"></td>
                <td className="border-r border-border/60 px-3 py-2.5 font-sans font-bold">
                  Total
                </td>
                <td className="border-r border-border/60 px-3 py-2.5 text-right font-bold text-text">
                  {totalStockSum.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="border-r border-border/60 px-3 py-2.5 text-right font-bold text-text-muted">
                  {totalAmountSum.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="border-r border-border/60 px-3 py-2.5 text-right font-bold text-accent">
                  {totalValuationSum.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3 py-2.5 print:hidden"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 4. Bottom Pagination & Info Bar matching DataTables */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-text-muted print:hidden">
          <div>
            {totalEntries === 0 ? (
              <span>Showing 0 to 0 of 0 entries</span>
            ) : (
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <GhostButton
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7.5 px-3 text-xs disabled:opacity-40"
            >
              Previous
            </GhostButton>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`h-7.5 w-7.5 rounded-md text-xs font-semibold transition-all ${
                  currentPage === pageNum
                    ? "bg-accent text-[#1A1306] shadow-xs"
                    : "border border-border bg-surface text-text hover:bg-surface-hi"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <GhostButton
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7.5 px-3 text-xs disabled:opacity-40"
            >
              Next
            </GhostButton>
          </div>
        </div>

        {/* Reset / Sample data helpers */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-text-muted print:hidden">
          <span>Station: <strong className="text-text">{stationName}</strong> ({stationAddress})</span>
          <button
            type="button"
            onClick={handleResetSample}
            className="text-text-muted hover:text-accent underline transition-colors cursor-pointer"
          >
            Reset Default Sample Data
          </button>
        </div>
      </div>

      {/* 5. Add / Edit Opening Stock Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
                <Coins size={17} className="text-accent" />
                <span>
                  {editingRow ? "Edit Opening Stock" : "Add Additional Opening Stock"}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-md p-1 text-text-muted hover:bg-surface-hi hover:text-text transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs">
              {/* Fiscal Year */}
              <div className="space-y-1">
                <label className="font-medium text-text">Fiscal Year</label>
                <select
                  value={formFiscalYear}
                  onChange={(e) => setFormFiscalYear(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-xs text-text focus:border-accent focus:outline-hidden"
                >
                  {FISCAL_YEAR_OPTIONS.map((fy) => (
                    <option key={fy} value={fy}>
                      {fy}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Selection */}
              <div className="space-y-1">
                <label className="font-medium text-text">Product</label>
                <select
                  value={formProduct}
                  onChange={(e) => setFormProduct(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-xs text-text focus:border-accent focus:outline-hidden"
                >
                  {COMMON_PRODUCTS.map((prod) => (
                    <option key={prod} value={prod}>
                      {prod}
                    </option>
                  ))}
                  <option value="Custom">+ Custom Product...</option>
                </select>
              </div>

              {formProduct === "Custom" && (
                <div className="space-y-1">
                  <label className="font-medium text-text">Custom Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter product name..."
                    value={formCustomProduct}
                    onChange={(e) => setFormCustomProduct(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-xs text-text focus:border-accent focus:outline-hidden"
                  />
                </div>
              )}

              {/* Stock Quantity */}
              <div className="space-y-1">
                <label className="font-medium text-text">Stock Quantity</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 15000.00"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-surface px-3 font-mono text-xs text-text focus:border-accent focus:outline-hidden"
                />
              </div>

              {/* Amount / Rate */}
              <div className="space-y-1">
                <label className="font-medium text-text">Unit Rate / Amount (NPR)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 160.00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-surface px-3 font-mono text-xs text-text focus:border-accent focus:outline-hidden"
                />
              </div>

              {/* Live Total Valuation preview */}
              <div className="rounded-lg border border-border/80 bg-surface-hi/50 p-2.5 flex items-center justify-between text-xs">
                <span className="text-text-muted">Calculated Total Valuation:</span>
                <span className="font-data font-bold text-accent">
                  NPR{" "}
                  {((parseFloat(formStock) || 0) * (parseFloat(formAmount) || 0)).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                  )}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <GhostButton
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-8.5 px-4 text-xs font-semibold"
                >
                  Cancel
                </GhostButton>
                <PrimaryButton
                  type="submit"
                  className="h-8.5 px-5 text-xs font-semibold shadow-xs"
                >
                  {editingRow ? "Update Record" : "Save Record"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-xl space-y-3">
            <h3 className="font-display text-sm font-bold text-text">
              Confirm Deletion
            </h3>
            <p className="text-xs text-text-muted">
              Are you sure you want to delete this fiscal opening stock entry? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <GhostButton
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="h-8 px-3 text-xs font-semibold"
              >
                Cancel
              </GhostButton>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="h-8 px-3 text-xs font-semibold rounded-lg bg-error text-white hover:bg-error/90 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
