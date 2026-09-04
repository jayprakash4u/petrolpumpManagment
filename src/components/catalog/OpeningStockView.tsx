"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  X,
  Copy,
  Download,
  FileSpreadsheet,
  Printer,
  Pencil,
  Check,
  Package,
  CheckCircle2,
} from "lucide-react";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export interface OpeningStockRecord {
  id: string;
  sn: number;
  product: string;
  quantity: number;
  barcode: string;
  rateWithoutVat: number;
  unit?: string;
}

const STORAGE_KEY = "fsm_opening_stocks_records";

const INITIAL_OPENING_STOCKS: OpeningStockRecord[] = [
  {
    id: "op-ms",
    sn: 1,
    product: "MS - PETROL",
    quantity: 30084.0,
    barcode: "27101210",
    rateWithoutVat: 160.0,
    unit: "Litre",
  },
  {
    id: "op-hsd",
    sn: 2,
    product: "HSD - Diesel",
    quantity: 14805.46,
    barcode: "27101930",
    rateWithoutVat: 128.666679,
    unit: "Litre",
  },
  {
    id: "op-trans",
    sn: 3,
    product: "Transportation",
    quantity: 0.0,
    barcode: "-",
    rateWithoutVat: 0.0,
    unit: "Trip",
  },
];

export function OpeningStockView({ title = "Opening Stocks" }: { title?: string }) {
  const [records, setRecords] = useState<OpeningStockRecord[]>(() => {
    if (typeof window === "undefined") return INITIAL_OPENING_STOCKS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_OPENING_STOCKS;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editRate, setEditRate] = useState("");
  const [editBarcode, setEditBarcode] = useState("");

  const startEdit = (rec: OpeningStockRecord) => {
    setEditingId(rec.id);
    setEditQty(String(rec.quantity));
    setEditRate(String(rec.rateWithoutVat));
    setEditBarcode(rec.barcode);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    const updated = records.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          quantity: parseFloat(editQty) || 0,
          rateWithoutVat: parseFloat(editRate) || 0,
          barcode: editBarcode.trim() || r.barcode,
        };
      }
      return r;
    });

    setRecords(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    setEditingId(null);
    setSuccessMessage("Opening stock record updated successfully.");
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  // Filtered records
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.trim().toLowerCase();
    return records.filter(
      (r) =>
        r.product.toLowerCase().includes(q) ||
        r.barcode.toLowerCase().includes(q) ||
        String(r.quantity).includes(q) ||
        String(r.rateWithoutVat).includes(q)
    );
  }, [records, searchQuery]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const displayed = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Dynamic Grand Totals based on filtered / active dataset
  const totalQuantity = useMemo(() => {
    return filtered.reduce((sum, r) => sum + r.quantity, 0);
  }, [filtered]);

  const grandTotal = useMemo(() => {
    return filtered.reduce((sum, r) => sum + r.quantity * r.rateWithoutVat, 0);
  }, [filtered]);

  // Copy to clipboard
  const handleCopy = () => {
    const headers = ["SN.", "Product", "Quantity", "Barcode", "Rate (Without Vat)", "Total"];
    const rows = filtered.map((r) => {
      const lineTotal = r.quantity * r.rateWithoutVat;
      return [
        r.sn,
        r.product,
        r.quantity.toFixed(3),
        r.barcode,
        r.rateWithoutVat > 0 ? `Rs. ${r.rateWithoutVat.toFixed(2)}` : "Rs. ",
        lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      ];
    });
    const text = [headers.join("\t"), ...rows.map((row) => row.join("\t"))].join("\n");
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["SN.", "Product", "Quantity", "Barcode", "Rate (Without Vat)", "Total"];
    const rows = filtered.map((r) => {
      const lineTotal = r.quantity * r.rateWithoutVat;
      return [
        r.sn,
        `"${r.product.replace(/"/g, '""')}"`,
        r.quantity.toFixed(3),
        `"${r.barcode}"`,
        r.rateWithoutVat,
        lineTotal.toFixed(2),
      ];
    });
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `opening_stocks_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full">
      {/* Top Page Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3 print:hidden">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl flex items-center gap-2">
            <BookOpen size={20} className="text-accent" />
            <span>{title}</span>
          </h1>
          <p className="text-[12px] text-text-muted mt-0.5">
            Initial tank volumes, standard barcodes, cost valuations, and total opening stock values.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="animate-fade-in mb-4 flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs font-semibold text-success shadow-xs">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Action Toolbar matching screenshot layout */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          {/* Show [50] entries */}
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-text focus:border-accent focus:outline-hidden cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-1 ml-2">
            <GhostButton
              type="button"
              onClick={handleCopy}
              className="h-8 px-2.5 text-xs font-semibold"
            >
              <Copy size={13} />
              <span>{copyFeedback ? "Copied" : "Copy"}</span>
            </GhostButton>

            <GhostButton
              type="button"
              onClick={handleExportCSV}
              className="h-8 px-2.5 text-xs font-semibold"
            >
              <Download size={13} />
              <span>CSV</span>
            </GhostButton>

            <GhostButton
              type="button"
              onClick={handleExportCSV}
              className="h-8 px-2.5 text-xs font-semibold"
            >
              <FileSpreadsheet size={13} />
              <span>Excel</span>
            </GhostButton>

            <GhostButton
              type="button"
              onClick={handlePrint}
              className="h-8 px-2.5 text-xs font-semibold"
            >
              <Printer size={13} />
              <span>Print</span>
            </GhostButton>
          </div>
        </div>

        {/* Right Search Input */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-text-muted">Search:</label>
          <div className="relative w-48 sm:w-56">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 pl-7.5 pr-6 text-xs w-full"
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

      {/* Opening Stocks Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface print:border-black print:bg-white">
        <table className="w-full min-w-[860px] border-collapse text-left print:min-w-full">
          <thead>
            <tr className="border-b border-border bg-surface-hi/80 font-data text-[11px] tracking-wide text-text-muted print:border-black print:bg-gray-100">
              <th className="px-3.5 py-2.5 font-medium w-14 text-center">SN.</th>
              <th className="px-3.5 py-2.5 font-medium">Product</th>
              <th className="px-3.5 py-2.5 text-right font-medium">Quantity</th>
              <th className="px-3.5 py-2.5 font-medium text-center">Barcode</th>
              <th className="px-3.5 py-2.5 text-right font-medium">Rate (Without Vat)</th>
              <th className="px-3.5 py-2.5 text-right font-medium">Total</th>
              <th className="px-3.5 py-2.5 text-center font-medium print:hidden">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-xs text-text-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package size={24} className="text-text-muted/40" />
                    <span>No opening stock records match &ldquo;{searchQuery}&rdquo;.</span>
                  </div>
                </td>
              </tr>
            ) : (
              displayed.map((r, idx) => {
                const isEditing = editingId === r.id;
                const lineTotal = isEditing
                  ? (parseFloat(editQty) || 0) * (parseFloat(editRate) || 0)
                  : r.quantity * r.rateWithoutVat;

                return (
                  <tr
                    key={r.id}
                    className="border-b border-border/60 transition-colors hover:bg-surface-hi/40 print:border-black"
                  >
                    {/* SN. */}
                    <td className="px-3.5 py-3 text-center font-data text-xs text-text-muted">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>

                    {/* Product */}
                    <td className="px-3.5 py-3">
                      <div className="font-display text-[13.5px] font-semibold text-text">
                        {r.product}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="px-3.5 py-3 text-right">
                      {isEditing ? (
                        <Input
                          inputMode="decimal"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          className="h-7.5 py-1 text-right text-xs font-data w-28 ml-auto font-bold"
                        />
                      ) : (
                        <span className="font-data text-xs font-semibold text-text">
                          {r.quantity.toFixed(3)}
                        </span>
                      )}
                    </td>

                    {/* Barcode */}
                    <td className="px-3.5 py-3 text-center">
                      {isEditing ? (
                        <Input
                          value={editBarcode}
                          onChange={(e) => setEditBarcode(e.target.value)}
                          className="h-7.5 py-1 text-center text-xs font-mono w-28 mx-auto"
                        />
                      ) : (
                        <span className="font-mono text-xs text-text-muted">
                          {r.barcode}
                        </span>
                      )}
                    </td>

                    {/* Rate (Without Vat) */}
                    <td className="px-3.5 py-3 text-right">
                      {isEditing ? (
                        <Input
                          inputMode="decimal"
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value)}
                          className="h-7.5 py-1 text-right text-xs font-data w-28 ml-auto"
                        />
                      ) : (
                        <span className="font-data text-xs text-text">
                          {r.rateWithoutVat > 0 ? `Rs. ${r.rateWithoutVat}` : "Rs. "}
                        </span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="px-3.5 py-3 text-right font-data text-xs font-bold text-accent">
                      {lineTotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-3.5 py-3 text-center print:hidden">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => saveEdit(r.id)}
                            className="h-7 w-7 rounded-lg bg-accent text-[#1A1306] flex items-center justify-center hover:opacity-90 shadow-2xs cursor-pointer"
                            title="Save"
                          >
                            <Check size={13} strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="h-7 w-7 rounded-lg border border-border bg-surface text-text-muted hover:text-text flex items-center justify-center cursor-pointer"
                            title="Cancel"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(r)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-[11px] font-semibold text-text-muted hover:border-accent/50 hover:text-accent transition-colors shadow-2xs cursor-pointer"
                          title="Edit Quantity / Rate"
                        >
                          <Pencil size={11} />
                          <span>Edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Grand Summary matching screenshot */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-text-muted print:hidden">
        {/* Left: Showing entries info */}
        <div>
          Showing{" "}
          <span className="font-semibold text-text">
            {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-text">
            {Math.min(currentPage * pageSize, filtered.length)}
          </span>{" "}
          of <span className="font-semibold text-text">{filtered.length}</span> entries
        </div>

        {/* Center: Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7.5 px-2.5 rounded-lg border border-border bg-surface text-xs font-semibold text-text hover:bg-surface-hi disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-7.5 w-7.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs ${
                    isActive
                      ? "bg-accent text-[#1A1306] font-bold"
                      : "border border-border bg-surface text-text hover:bg-surface-hi"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7.5 px-2.5 rounded-lg border border-border bg-surface text-xs font-semibold text-text hover:bg-surface-hi disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Bottom Right Grand Summary Block matching screenshot exactly */}
      <div className="mt-4 flex justify-end">
        <div className="rounded-xl border border-border bg-surface-hi/40 p-4 space-y-1.5 min-w-[260px] text-right font-data">
          <div className="text-xs font-bold text-text">
            <span>Grand Total: </span>
            <span className="text-accent text-sm">
              Rs.{" "}
              {grandTotal.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="text-xs font-semibold text-text-muted">
            <span>Total Quantities: </span>
            <span className="text-text font-bold">
              {totalQuantity.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 3,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
