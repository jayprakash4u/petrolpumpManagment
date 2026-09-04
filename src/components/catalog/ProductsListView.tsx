"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Check,
  X,
  Search,
  Copy,
  Download,
  FileSpreadsheet,
  Printer,
  Package,
  CheckCircle2,
} from "lucide-react";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";

export interface ProductItem {
  id: string;
  sn: number;
  name: string;
  hsCode: string;
  sellingPrice: number;
  vatable: boolean;
  billingStock: number;
  active: boolean;
}

const STORAGE_KEY = "fsm_catalog_products_list";

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: "prod-ms",
    sn: 1,
    name: "MS - PETROL",
    hsCode: "27101210",
    sellingPrice: 200,
    vatable: true,
    billingStock: 37958.06,
    active: true,
  },
  {
    id: "prod-hsd",
    sn: 2,
    name: "HSD - Diesel",
    hsCode: "27101930",
    sellingPrice: 200,
    vatable: true,
    billingStock: 9880.3,
    active: true,
  },
  {
    id: "prod-trans",
    sn: 3,
    name: "Transportation",
    hsCode: "-",
    sellingPrice: 1,
    vatable: true,
    billingStock: 0.0,
    active: true,
  },
];

export function ProductsListView() {
  const [products, setProducts] = useState<ProductItem[]>(() => {
    if (typeof window === "undefined") return INITIAL_PRODUCTS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PRODUCTS;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editHsCode, setEditHsCode] = useState("");
  const [editSellingPrice, setEditSellingPrice] = useState("");
  const [editVatable, setEditVatable] = useState(true);
  const [editBillingStock, setEditBillingStock] = useState("");

  const startEdit = (p: ProductItem) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditHsCode(p.hsCode);
    setEditSellingPrice(String(p.sellingPrice));
    setEditVatable(p.vatable);
    setEditBillingStock(String(p.billingStock));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          name: editName.trim() || p.name,
          hsCode: editHsCode.trim() || p.hsCode,
          sellingPrice: parseFloat(editSellingPrice) || p.sellingPrice,
          vatable: editVatable,
          billingStock: parseFloat(editBillingStock) || p.billingStock,
        };
      }
      return p;
    });

    setProducts(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    setEditingId(null);
    setSuccessMessage("Product updated successfully.");
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const toggleActivate = (id: string) => {
    const updated = products.map((p) => (p.id === id ? { ...p, active: !p.active } : p));
    setProducts(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Filtered products
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.hsCode.toLowerCase().includes(q) ||
        String(p.sellingPrice).includes(q) ||
        String(p.billingStock).includes(q)
    );
  }, [products, searchQuery]);

  // Paginated products
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const displayed = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Copy table content to clipboard
  const handleCopy = () => {
    const headers = ["S.N.", "Name", "HS Code", "Selling Price", "Vatable?", "Billing Stock"];
    const rows = filtered.map((p) => [
      p.sn,
      p.name,
      p.hsCode,
      `Rs. ${p.sellingPrice}`,
      p.vatable ? "YES" : "NO",
      p.billingStock.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ]);
    const text = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["S.N.", "Name", "HS Code", "Selling Price", "Vatable?", "Billing Stock"];
    const rows = filtered.map((p) => [
      p.sn,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.hsCode}"`,
      p.sellingPrice,
      p.vatable ? "YES" : "NO",
      p.billingStock,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `product_management_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. Header Toolbar matching screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3 print:hidden">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl flex items-center gap-2">
            <Package size={20} className="text-accent" />
            <span>Product Management</span>
          </h1>
          <p className="text-[12px] text-text-muted mt-0.5">
            Active products catalog, statutory HS codes, retail rates, and live billing stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/catalog/products/new">
            <PrimaryButton type="button" className="h-8 gap-1.5 px-3 text-xs font-semibold shadow-xs">
              <Plus size={14} />
              <span>Add Product</span>
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

      {/* 2. Control Toolbar matching screenshot: Copy, CSV, Print, Excel, Show entries, Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Action Buttons */}
          <div className="flex items-center gap-1">
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
              onClick={handlePrint}
              className="h-8 px-2.5 text-xs font-semibold"
            >
              <Printer size={13} />
              <span>Print</span>
            </GhostButton>

            <GhostButton
              type="button"
              onClick={handleExportCSV}
              className="h-8 px-2.5 text-xs font-semibold"
            >
              <FileSpreadsheet size={13} />
              <span>Excel</span>
            </GhostButton>
          </div>

          {/* Show [10] entries */}
          <div className="flex items-center gap-1.5 text-xs text-text-muted ml-2">
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

      {/* 3. 7-Column Product Table matching screenshot */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface print:border-black print:bg-white shadow-xs">
        <table className="w-full min-w-[760px] border-collapse text-left print:min-w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-hi/80 font-data text-[11px] tracking-wide text-text-muted print:border-black print:bg-gray-100">
              <th className="px-3.5 py-2.5 font-medium w-14 text-center">S.N.</th>
              <th className="px-3.5 py-2.5 font-medium">Name</th>
              <th className="px-3.5 py-2.5 font-medium text-center">HS Code</th>
              <th className="px-3.5 py-2.5 font-medium">Selling Price</th>
              <th className="px-3.5 py-2.5 font-medium text-center">Vatable?</th>
              <th className="px-3.5 py-2.5 font-medium">Billing Stock</th>
              <th className="px-3.5 py-2.5 font-medium text-center print:hidden">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-xs text-text-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package size={24} className="text-text-muted/40" />
                    <span>No products match &ldquo;{searchQuery}&rdquo;.</span>
                  </div>
                </td>
              </tr>
            ) : (
              displayed.map((p, idx) => {
                const isEditing = editingId === p.id;

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-surface-hi/40 transition-colors print:border-black"
                  >
                    {/* S.N. */}
                    <td className="px-3.5 py-3 text-center font-data text-xs text-text-muted">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>

                    {/* Name */}
                    <td className="px-3.5 py-3 font-semibold text-text">
                      {isEditing ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7.5 py-1 text-xs w-full"
                        />
                      ) : (
                        <span className="font-display font-semibold text-text">{p.name}</span>
                      )}
                    </td>

                    {/* HS Code */}
                    <td className="px-3.5 py-3 text-center">
                      {isEditing ? (
                        <Input
                          value={editHsCode}
                          onChange={(e) => setEditHsCode(e.target.value)}
                          className="h-7.5 py-1 text-center text-xs font-mono w-28 mx-auto"
                        />
                      ) : (
                        <span className="font-mono text-xs text-text-muted">{p.hsCode}</span>
                      )}
                    </td>

                    {/* Selling Price */}
                    <td className="px-3.5 py-3">
                      {isEditing ? (
                        <Input
                          inputMode="decimal"
                          value={editSellingPrice}
                          onChange={(e) => setEditSellingPrice(e.target.value)}
                          className="h-7.5 py-1 text-xs font-data w-24"
                        />
                      ) : (
                        <span className="font-data text-xs font-medium text-text">
                          Rs. {p.sellingPrice}
                        </span>
                      )}
                    </td>

                    {/* Vatable? */}
                    <td className="px-3.5 py-3 text-center">
                      {isEditing ? (
                        <label className="inline-flex items-center gap-1 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={editVatable}
                            onChange={(e) => setEditVatable(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent"
                          />
                          <span>YES</span>
                        </label>
                      ) : (
                        <span className="font-data text-xs font-semibold text-text">
                          {p.vatable ? "YES" : "NO"}
                        </span>
                      )}
                    </td>

                    {/* Billing Stock */}
                    <td className="px-3.5 py-3 font-data text-xs font-medium text-text">
                      {isEditing ? (
                        <Input
                          inputMode="decimal"
                          value={editBillingStock}
                          onChange={(e) => setEditBillingStock(e.target.value)}
                          className="h-7.5 py-1 text-xs font-data w-28"
                        />
                      ) : (
                        p.billingStock.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-3.5 py-3 text-center print:hidden">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => saveEdit(p.id)}
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
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(p)}
                            className="inline-flex items-center gap-1 rounded bg-sky-600 hover:bg-sky-500 text-white px-2 py-0.5 text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                            title="Edit"
                          >
                            <Pencil size={10} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActivate(p.id)}
                            className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer ${
                              p.active
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                : "border border-border bg-surface text-text-muted hover:text-text"
                            }`}
                          >
                            {p.active ? "Activate" : "Deactivate"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Pagination matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-text-muted print:hidden">
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
    </div>
  );
}
