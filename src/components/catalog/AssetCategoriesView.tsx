"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Boxes,
  ArrowLeft,
  Search,
  X,
  Copy,
  Download,
  FileSpreadsheet,
  Printer,
  Pencil,
  Check,
  CheckCircle2,
  Package,
} from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";

export interface AssetCategoryItem {
  id: string;
  sn: number;
  name: string;
  details: string;
  depreciationRate: number;
}

const STORAGE_KEY = "fsm_fixed_asset_categories";

const INITIAL_ASSET_CATEGORIES: AssetCategoryItem[] = [
  {
    id: "cat-a",
    sn: 1,
    name: "A-Building, Structure and other products of nature",
    details: "A",
    depreciationRate: 5,
  },
  {
    id: "cat-b",
    sn: 2,
    name: "B- Computers, Data processing Equipments, Furnitures, Fixtures and Office Equipments",
    details: "B",
    depreciationRate: 25,
  },
  {
    id: "cat-d",
    sn: 3,
    name: "D- Construction and Other Earth moving Equipments, Plants and Machinaries, Production Equipments and Unabsorbed PCC and R&D crust",
    details: "D",
    depreciationRate: 15,
  },
  {
    id: "cat-c",
    sn: 4,
    name: "C- Automobiles, Bus and Minibus, Car and Jeep, Motorbike and other Vehicles",
    details: "C",
    depreciationRate: 20,
  },
];

export function AssetCategoriesView() {
  const [categories, setCategories] = useState<AssetCategoryItem[]>(() => {
    if (typeof window === "undefined") return INITIAL_ASSET_CATEGORIES;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ASSET_CATEGORIES;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editRate, setEditRate] = useState("");

  const startEdit = (cat: AssetCategoryItem) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDetails(cat.details);
    setEditRate(String(cat.depreciationRate));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    const updated = categories.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          name: editName.trim() || c.name,
          details: editDetails.trim() || c.details,
          depreciationRate: parseFloat(editRate) || c.depreciationRate,
        };
      }
      return c;
    });

    setCategories(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    setEditingId(null);
    setSuccessMessage("Asset category updated successfully.");
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  // Filtered categories
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.trim().toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.details.toLowerCase().includes(q) ||
        String(c.depreciationRate).includes(q)
    );
  }, [categories, searchQuery]);

  // Paginated categories
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const displayed = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Copy to clipboard
  const handleCopy = () => {
    const headers = ["SN", "Name", "Details", "Depreciation Rate"];
    const rows = filtered.map((c) => [c.sn, c.name, c.details, `${c.depreciationRate}%`]);
    const text = [headers.join("\t"), ...rows.map((row) => row.join("\t"))].join("\n");
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["SN", "Name", "Details", "Depreciation Rate (%)"];
    const rows = filtered.map((c) => [c.sn, `"${c.name.replace(/"/g, '""')}"`, `"${c.details}"`, c.depreciationRate]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `asset_categories_${new Date().toISOString().slice(0, 10)}.csv`;
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
      {/* Top Header matching screenshot */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3 print:hidden">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl flex items-center gap-2">
            <Boxes size={20} className="text-accent" />
            <span>Asset Category</span>
          </h1>
          <p className="text-[12px] text-text-muted mt-0.5">
            Statutory depreciation blocks and asset classifications under the Nepal Income Tax Act.
          </p>
        </div>

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

      {/* Success Notification */}
      {successMessage && (
        <div className="animate-fade-in mb-4 flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs font-semibold text-success shadow-xs">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Action Toolbar matching screenshot */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3 print:hidden">
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

      {/* Asset Category Table matching screenshot layout */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface print:border-black print:bg-white">
        <table className="w-full min-w-[760px] border-collapse text-left print:min-w-full">
          <thead>
            <tr className="border-b border-border bg-surface-hi/80 font-data text-[11px] tracking-wide text-text-muted print:border-black print:bg-gray-100">
              <th className="px-3.5 py-2.5 font-medium w-14 text-center">SN</th>
              <th className="px-3.5 py-2.5 font-medium">Name</th>
              <th className="px-3.5 py-2.5 font-medium text-center w-24">Details</th>
              <th className="px-3.5 py-2.5 text-right font-medium w-36">Depreciation Rate</th>
              <th className="px-3.5 py-2.5 text-center font-medium w-24 print:hidden">Action</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-xs text-text-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package size={24} className="text-text-muted/40" />
                    <span>No asset categories match &ldquo;{searchQuery}&rdquo;.</span>
                  </div>
                </td>
              </tr>
            ) : (
              displayed.map((c, idx) => {
                const isEditing = editingId === c.id;

                return (
                  <tr
                    key={c.id}
                    className="border-b border-border/60 transition-colors hover:bg-surface-hi/40 print:border-black"
                  >
                    {/* SN */}
                    <td className="px-3.5 py-3 text-center font-data text-xs text-text-muted">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>

                    {/* Name */}
                    <td className="px-3.5 py-3">
                      {isEditing ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7.5 py-1 text-xs w-full font-medium"
                        />
                      ) : (
                        <div className="font-display text-xs font-semibold text-text leading-snug">
                          {c.name}
                        </div>
                      )}
                    </td>

                    {/* Details (Block Code) */}
                    <td className="px-3.5 py-3 text-center">
                      {isEditing ? (
                        <Input
                          value={editDetails}
                          onChange={(e) => setEditDetails(e.target.value)}
                          className="h-7.5 py-1 text-center text-xs font-mono font-bold w-16 mx-auto"
                        />
                      ) : (
                        <Badge tone="muted" className="font-mono text-xs font-bold">
                          {c.details}
                        </Badge>
                      )}
                    </td>

                    {/* Depreciation Rate */}
                    <td className="px-3.5 py-3 text-right">
                      {isEditing ? (
                        <Input
                          inputMode="decimal"
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value)}
                          className="h-7.5 py-1 text-right text-xs font-data font-bold w-20 ml-auto"
                        />
                      ) : (
                        <span className="font-data text-xs font-bold text-accent">
                          {c.depreciationRate}
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-3.5 py-3 text-center print:hidden">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => saveEdit(c.id)}
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
                          onClick={() => startEdit(c)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-text-muted hover:border-accent/50 hover:text-accent transition-colors shadow-2xs cursor-pointer"
                          title="Edit Category"
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

      {/* Pagination matching screenshot */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-text-muted print:hidden">
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
