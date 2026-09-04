"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Warehouse,
  ArrowLeft,
  Search,
  X,
  Copy,
  Download,
  FileSpreadsheet,
  Printer,
  Tag,
  CheckCircle2,
  Calendar,
  Filter as FilterIcon,
  Plus,
} from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";

export interface FixedAssetRecord {
  id: string;
  sn: number;
  itemNo: number;
  name: string;
  serialNumber: string;
  category: string;
  model: string;
  status: "Active" | "Inactive";
  details: string;
  user: string;
  purchasedCost: number;
  purchasedDateBS: string;
  purchaseId: string;
  ledger: string;
  inactivatedDate: string;
  inactiveRemarks: string;
  expiryDate: string;
}

const STORAGE_KEY = "fsm_fixed_asset_items_records";

const INITIAL_ASSET_ITEMS: FixedAssetRecord[] = [
  {
    id: "ast-inv-1",
    sn: 1,
    itemNo: 1,
    name: "Inverter",
    serialNumber: "12.25",
    category: "B- Computers, Data processing Equipments, Furnitures, Fixtures and Office Equipments",
    model: "-",
    status: "Active",
    details: "-",
    user: "0",
    purchasedCost: 63717,
    purchasedDateBS: "2082-4-30",
    purchaseId: "697",
    ledger: "FA",
    inactivatedDate: "--",
    inactiveRemarks: "--",
    expiryDate: "--",
  },
  {
    id: "ast-inv-2",
    sn: 2,
    itemNo: 2,
    name: "Heater",
    serialNumber: "1225",
    category: "B- Computers, Data processing Equipments, Furnitures, Fixtures and Office Equipments",
    model: "-",
    status: "Active",
    details: "-",
    user: "0",
    purchasedCost: 7221,
    purchasedDateBS: "2082-9-30",
    purchaseId: "1088",
    ledger: "FA",
    inactivatedDate: "--",
    inactiveRemarks: "--",
    expiryDate: "--",
  },
];

// Helper to convert numbers to English words (Indian numbering system)
function numberToWordsIndian(num: number): string {
  if (num === 0) return "Zero";

  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const formatBelowThousand = (n: number): string => {
    let str = "";
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? "-" + a[n % 10] : "") + " ";
    } else if (n > 0) {
      str += a[n] + " ";
    }
    return str.trim();
  };

  const integerPart = Math.floor(Math.abs(num));
  let result = "";

  const crore = Math.floor(integerPart / 10000000);
  let rem = integerPart % 10000000;

  const lakh = Math.floor(rem / 100000);
  rem %= 100000;

  const thousand = Math.floor(rem / 1000);
  rem %= 1000;

  if (crore > 0) result += formatBelowThousand(crore) + " Crore ";
  if (lakh > 0) result += formatBelowThousand(lakh) + " Lakh ";
  if (thousand > 0) result += formatBelowThousand(thousand) + " Thousand ";
  if (rem > 0) result += formatBelowThousand(rem);

  return result.trim();
}

export function FixedAssetsTable({ assets }: { assets?: any[] }) {
  const [records, setRecords] = useState<FixedAssetRecord[]>(() => {
    if (typeof window === "undefined") return INITIAL_ASSET_ITEMS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ASSET_ITEMS;
  });

  // Filter states
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Print Tag Modal state
  const [tagModalRecord, setTagModalRecord] = useState<FixedAssetRecord | null>(null);

  // Filter logic
  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (fromDate && r.purchasedDateBS < fromDate) return false;
      if (toDate && r.purchasedDateBS > toDate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = r.name.toLowerCase().includes(q);
        const matchSerial = r.serialNumber.toLowerCase().includes(q);
        const matchCat = r.category.toLowerCase().includes(q);
        const matchCost = String(r.purchasedCost).includes(q);
        const matchDate = r.purchasedDateBS.includes(q);
        const matchPid = r.purchaseId.toLowerCase().includes(q);
        if (!matchName && !matchSerial && !matchCat && !matchCost && !matchDate && !matchPid) {
          return false;
        }
      }
      return true;
    });
  }, [records, fromDate, toDate, searchQuery]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const displayed = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Total Purchased Cost calculation
  const totalPurchasedCost = useMemo(() => {
    return filtered.reduce((sum, r) => sum + r.purchasedCost, 0);
  }, [filtered]);

  const totalInWords = useMemo(() => {
    return numberToWordsIndian(totalPurchasedCost);
  }, [totalPurchasedCost]);

  // Copy to clipboard
  const handleCopy = () => {
    const headers = [
      "SN",
      "ID",
      "Name",
      "Serial Number",
      "category",
      "Model",
      "Status",
      "Details",
      "User",
      "Purchased cost",
      "Purchased Date",
      "Purchase Id",
      "Ledger",
      "Inactivated Date",
      "Inactive Remarks",
      "Expiry Date",
    ];
    const rows = filtered.map((r) => [
      r.sn,
      r.itemNo,
      r.name,
      r.serialNumber,
      r.category,
      r.model,
      r.status,
      r.details,
      r.user,
      r.purchasedCost,
      r.purchasedDateBS,
      r.purchaseId,
      r.ledger,
      r.inactivatedDate,
      r.inactiveRemarks,
      r.expiryDate,
    ]);
    const text = [headers.join("\t"), ...rows.map((row) => row.join("\t"))].join("\n");
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "SN",
      "ID",
      "Name",
      "Serial Number",
      "category",
      "Model",
      "Status",
      "Details",
      "User",
      "Purchased cost",
      "Purchased Date",
      "Purchase Id",
      "Ledger",
      "Inactivated Date",
      "Inactive Remarks",
      "Expiry Date",
    ];
    const rows = filtered.map((r) => [
      r.sn,
      r.itemNo,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.serialNumber}"`,
      `"${r.category}"`,
      `"${r.model}"`,
      r.status,
      `"${r.details}"`,
      r.user,
      r.purchasedCost,
      r.purchasedDateBS,
      r.purchaseId,
      r.ledger,
      r.inactivatedDate,
      r.inactiveRemarks,
      r.expiryDate,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `asset_management_${new Date().toISOString().slice(0, 10)}.csv`;
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
      {/* 1. Top Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3 print:hidden">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl flex items-center gap-2">
            <Warehouse size={20} className="text-accent" />
            <span>Asset Management</span>
          </h1>
          <p className="text-[12px] text-text-muted mt-0.5">
            Station capital assets, serial numbers, depreciation classes, and asset tag printing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/purchases/assets/new">
            <PrimaryButton type="button" className="h-8 gap-1.5 px-3 text-xs font-semibold shadow-xs">
              <Plus size={14} />
              <span>Add Fixed Asset</span>
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

      {/* 2. Top Asset Date Filter Card matching screenshot */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-xs print:hidden space-y-2.5">
        <div className="font-display text-xs font-bold text-text uppercase tracking-wider">
          Asset
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4 space-y-1">
            <label className="text-[11px] font-semibold text-text-muted block">From Date</label>
            <Input
              type="text"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label className="text-[11px] font-semibold text-text-muted block">To Date</label>
            <Input
              type="text"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>

          <div className="sm:col-span-4">
            <PrimaryButton
              type="button"
              onClick={() => setCurrentPage(1)}
              className="h-8 w-full text-xs font-semibold shadow-xs"
            >
              Filter
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* 3. Toolbar: Copy, CSV, Excel, Print, Show entries, Search */}
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

      {/* 4. Full 17-Column Asset Management Table matching screenshot */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface print:border-black print:bg-white shadow-xs">
        <table className="w-full min-w-[1300px] border-collapse text-left text-xs print:min-w-full">
          <thead>
            <tr className="border-b border-border bg-surface-hi/80 font-data text-[11px] tracking-wide text-text-muted print:border-black print:bg-gray-100 whitespace-nowrap">
              <th className="px-3 py-2.5 font-medium text-center w-12">SN</th>
              <th className="px-3 py-2.5 font-medium text-center w-12">ID</th>
              <th className="px-3 py-2.5 font-medium min-w-[120px]">Name</th>
              <th className="px-3 py-2.5 font-medium min-w-[110px]">Serial Number</th>
              <th className="px-3 py-2.5 font-medium min-w-[220px]">category</th>
              <th className="px-3 py-2.5 font-medium text-center w-16">Model</th>
              <th className="px-3 py-2.5 font-medium text-center w-20">Status</th>
              <th className="px-3 py-2.5 font-medium text-center w-16">Details</th>
              <th className="px-3 py-2.5 font-medium text-center w-14">User</th>
              <th className="px-3 py-2.5 font-medium text-right min-w-[120px]">Purchased cost</th>
              <th className="px-3 py-2.5 font-medium text-center min-w-[110px]">Purchased Date</th>
              <th className="px-3 py-2.5 font-medium text-center min-w-[90px]">Purchase Id</th>
              <th className="px-3 py-2.5 font-medium text-center w-16">Ledger</th>
              <th className="px-3 py-2.5 font-medium text-center min-w-[110px]">Inactivated Date</th>
              <th className="px-3 py-2.5 font-medium text-center min-w-[110px]">Inactive Remarks</th>
              <th className="px-3 py-2.5 font-medium text-center min-w-[90px]">Expiry Date</th>
              <th className="px-3 py-2.5 font-medium text-center min-w-[100px] print:hidden">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={17} className="px-4 py-10 text-center text-xs text-text-muted">
                  No asset records found matching your filter criteria.
                </td>
              </tr>
            ) : (
              displayed.map((r, idx) => (
                <tr
                  key={r.id}
                  className="hover:bg-surface-hi/40 transition-colors whitespace-nowrap"
                >
                  {/* SN */}
                  <td className="px-3 py-3 text-center font-data text-xs text-text-muted">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>

                  {/* ID */}
                  <td className="px-3 py-3 text-center font-data text-xs text-text-muted">
                    {r.itemNo}
                  </td>

                  {/* Name */}
                  <td className="px-3 py-3 font-semibold text-text">
                    {r.name}
                  </td>

                  {/* Serial Number */}
                  <td className="px-3 py-3 font-mono text-xs text-text-muted">
                    {r.serialNumber}
                  </td>

                  {/* Category */}
                  <td className="px-3 py-3 text-xs text-text-muted">
                    {r.category}
                  </td>

                  {/* Model */}
                  <td className="px-3 py-3 text-center text-xs text-text-muted">
                    {r.model}
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3 text-center">
                    <Badge tone={r.status === "Active" ? "success" : "muted"} className="text-[10px]">
                      {r.status}
                    </Badge>
                  </td>

                  {/* Details */}
                  <td className="px-3 py-3 text-center text-xs text-text-muted">
                    {r.details}
                  </td>

                  {/* User */}
                  <td className="px-3 py-3 text-center font-data text-xs text-text-muted">
                    {r.user}
                  </td>

                  {/* Purchased Cost */}
                  <td className="px-3 py-3 text-right font-data font-semibold text-text">
                    {r.purchasedCost.toLocaleString("en-IN")}
                  </td>

                  {/* Purchased Date */}
                  <td className="px-3 py-3 text-center font-data text-xs text-text-muted">
                    {r.purchasedDateBS}
                  </td>

                  {/* Purchase Id */}
                  <td className="px-3 py-3 text-center font-data text-xs text-text-muted">
                    {r.purchaseId}
                  </td>

                  {/* Ledger */}
                  <td className="px-3 py-3 text-center font-data text-xs text-text-muted">
                    {r.ledger}
                  </td>

                  {/* Inactivated Date */}
                  <td className="px-3 py-3 text-center text-xs text-text-muted">
                    {r.inactivatedDate}
                  </td>

                  {/* Inactive Remarks */}
                  <td className="px-3 py-3 text-center text-xs text-text-muted">
                    {r.inactiveRemarks}
                  </td>

                  {/* Expiry Date */}
                  <td className="px-3 py-3 text-center text-xs text-text-muted">
                    {r.expiryDate}
                  </td>

                  {/* Action: Print Tag */}
                  <td className="px-3 py-3 text-center print:hidden">
                    <button
                      type="button"
                      onClick={() => setTagModalRecord(r)}
                      className="inline-flex items-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1 text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                      title="Print Barcode Tag"
                    >
                      <Tag size={11} />
                      <span>Print Tag</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Table Summary Row matching screenshot */}
          {displayed.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-border bg-surface-hi/70 font-data text-xs font-bold text-text">
                <td colSpan={9} className="px-3 py-2.5 text-right font-sans text-text-muted">
                  Total Purchased Cost:
                </td>
                <td className="px-3 py-2.5 text-right text-accent font-data">
                  Rs.{" "}
                  {totalPurchasedCost.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td colSpan={7}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* 5. Pagination & Bottom Left Number In Words matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-text-muted print:hidden">
        {/* Left: Showing info and Total Purchased Cost in words */}
        <div className="space-y-1">
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

          <div className="font-medium text-text">
            <span>Total Purchased Cost: </span>
            <strong className="text-accent font-data">
              Rs.{totalPurchasedCost.toLocaleString("en-IN")}
            </strong>{" "}
            <span className="text-text-muted">({totalInWords})</span>
          </div>
        </div>

        {/* Right: Pagination controls */}
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

      {/* 6. Print Tag Modal */}
      {tagModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in print:p-0">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4 print:border-none print:shadow-none print:p-0">
            <div className="flex items-center justify-between border-b border-border/80 pb-3 print:hidden">
              <h3 className="font-display text-sm font-bold text-text flex items-center gap-2">
                <Tag size={16} className="text-accent" />
                <span>Asset Physical Label Tag</span>
              </h3>
              <button
                type="button"
                onClick={() => setTagModalRecord(null)}
                className="rounded-lg p-1 text-text-muted hover:bg-surface-hi hover:text-text cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Printable Tag Card */}
            <div className="rounded-xl border-2 border-dashed border-border p-5 text-center space-y-3 bg-bg print:border-black print:bg-white">
              <div className="font-display text-xs font-bold uppercase tracking-wider text-accent">
                Nepal Petroleum Center
              </div>
              <div className="text-sm font-bold text-text">
                {tagModalRecord.name}
              </div>

              <div className="inline-block px-3 py-1 rounded bg-surface-hi border border-border font-mono text-xs font-bold text-text">
                TAG: {tagModalRecord.serialNumber || `AST-${tagModalRecord.itemNo}`}
              </div>

              <div className="text-[11px] text-text-muted space-y-0.5">
                <div>Purchased: <span className="font-mono text-text">{tagModalRecord.purchasedDateBS}</span></div>
                <div>Cost: <span className="font-data font-bold text-accent">Rs. {tagModalRecord.purchasedCost.toLocaleString("en-IN")}</span></div>
                <div>Ledger: <span className="font-mono text-text">{tagModalRecord.ledger} (ID: {tagModalRecord.purchaseId})</span></div>
              </div>

              {/* Barcode representation */}
              <div className="pt-2 font-mono text-[10px] tracking-widest text-text-muted">
                ||||| | |||| ||| |||||| |||| | ||
                <div className="text-[9px] mt-0.5">{tagModalRecord.purchaseId}-{tagModalRecord.serialNumber}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border print:hidden">
              <GhostButton
                type="button"
                onClick={() => setTagModalRecord(null)}
                className="h-8 px-3 text-xs"
              >
                Close
              </GhostButton>
              <PrimaryButton
                type="button"
                onClick={() => window.print()}
                className="h-8 px-4 text-xs font-semibold gap-1.5"
              >
                <Printer size={13} />
                <span>Print Tag</span>
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
