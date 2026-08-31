"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Search,
  FileText,
  Table2,
  ChevronDown,
  Info,
  Fuel,
  Scale,
  ListOrdered,
  Ban,
} from "lucide-react";
import { clsx } from "clsx";
import type { MockBill } from "@/lib/mock/bills";
import type { BillFilters } from "@/lib/bill-filters";
import { PRESETS, PRESET_LABEL } from "@/lib/reports";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { Input } from "@/components/ui/Field";
import { StatCard } from "@/components/dashboard/StatCard";

type Format = "csv" | "excel" | "pdf";

const FORMATS: { id: Format; label: string; ext: string; icon: typeof Table2 }[] = [
  { id: "csv", label: "CSV", ext: ".csv", icon: Table2 },
  { id: "excel", label: "Excel", ext: ".xlsx", icon: FileText },
  { id: "pdf", label: "PDF", ext: ".pdf", icon: FileText },
];

const HEADERS = [
  "Receipt No",
  "Date (BS)",
  "Time",
  "Fuel",
  "Litres",
  "Rate",
  "Amount",
  "Payment",
  "Customer",
  "Vehicle No",
  "Sold By",
  "Status",
];

/** Strips the display formatting so a spreadsheet gets a number, not "Rs 11,081". */
const bare = (v: string) => v.replace(/[^0-9.]/g, "");
const rs = (n: number) => "Rs " + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

function toRow(b: MockBill): string[] {
  return [
    String(b.receiptNo),
    b.dateBS,
    b.time,
    FUEL_LABEL[b.fuel],
    bare(b.liters),
    bare(b.rate),
    bare(b.amount),
    b.payment === "CASH" ? "Cash" : "Credit",
    b.customer ?? "",
    b.vehicleNo ?? "",
    b.soldBy,
    b.voided ? `Voided — ${b.voidReason ?? ""}`.trim() : "Live",
  ];
}

/**
 * Bill Export — filters the register down to a slice, previews it in the
 * chosen format, and (once wired to real data) hands over the file.
 *
 * The filter/KPI/dropdown shape here matches Sales Returns and Vehicle-wise
 * Billing: a header bar, a KPI deck, compact `<select>` dropdowns instead of
 * a wall of chips, and an "Export ▼" menu — so the four billing screens read
 * as one family instead of visibly different iterations.
 *
 * Static for now — the export is disabled rather than producing a file that
 * would contain sample rows. Period stays server-resolved (it's a real
 * BS-calendar computation reused from the other reports), but it doesn't
 * narrow these fixed sample rows — there's nothing to narrow honestly until
 * real dated invoices are behind it.
 */
export function BillExportView({
  initialFilters,
  basePath,
  bills,
  rangeLabel,
}: {
  initialFilters: BillFilters;
  basePath: string;
  bills: MockBill[];
  rangeLabel: string;
}) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState(initialFilters.search);
  const [vehicleQuery, setVehicleQuery] = useState(initialFilters.vehicleNo ?? "");
  const [fuelFilter, setFuelFilter] = useState<string>(initialFilters.fuel ?? "ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>(initialFilters.payment ?? "ALL");
  const [statusFilter, setStatusFilter] = useState<string>(initialFilters.status);
  const [format, setFormat] = useState<Format>("csv");
  const [isFormatOpen, setIsFormatOpen] = useState(false);

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (statusFilter === "active" && b.voided) return false;
      if (statusFilter === "voided" && !b.voided) return false;
      if (fuelFilter !== "ALL" && b.fuel !== fuelFilter) return false;
      if (paymentFilter !== "ALL" && b.payment !== paymentFilter) return false;

      if (vehicleQuery.trim()) {
        const v = vehicleQuery.toLowerCase().replace(/\s+/g, "");
        if (!b.vehicleNo || !b.vehicleNo.toLowerCase().replace(/\s+/g, "").includes(v)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchReceipt = String(b.receiptNo).includes(q);
        const matchCustomer = b.customer ? b.customer.toLowerCase().includes(q) : false;
        if (!matchReceipt && !matchCustomer) return false;
      }

      return true;
    });
  }, [bills, statusFilter, fuelFilter, paymentFilter, vehicleQuery, searchQuery]);

  const metrics = useMemo(() => {
    const live = filteredBills.filter((b) => !b.voided);
    const totalAmount = live.reduce((sum, b) => sum + Number(bare(b.amount)), 0);
    const totalLiters = live.reduce((sum, b) => sum + Number(bare(b.liters)), 0);
    const voidedCount = filteredBills.length - live.length;
    return { totalAmount, totalLiters, voidedCount };
  }, [filteredBills]);

  const preview = filteredBills.slice(0, 4).map(toRow);

  const applyPreset = (preset: string) => {
    const params = new URLSearchParams();
    params.set("preset", preset);
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Download size={20} />
          </div>
          <div>
            <h2 className="font-display text-[17px] font-bold text-text">Bill Export</h2>
            <p className="text-[12px] text-text-muted">
              Bulk export of invoices and credit notes for tax and audit — exactly the rows the filters below select.
            </p>
          </div>
        </div>

        {/* Export ▼ */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsFormatOpen(!isFormatOpen)}
            className="font-display inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-transparent px-3.5 py-2 text-[13px] font-medium text-text transition-colors hover:bg-surface-hi"
          >
            <Download size={14} /> Export {format.toUpperCase()} <ChevronDown size={13} className="opacity-60" />
          </button>

          {isFormatOpen && (
            <div className="absolute right-0 top-full z-40 mt-1.5 w-52 rounded-xl border border-border bg-surface p-1.5 shadow-2xl animate-fade-in">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFormat(f.id);
                    setIsFormatOpen(false);
                  }}
                  className={clsx(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] transition-colors",
                    format === f.id ? "bg-accent/10 text-accent" : "text-text hover:bg-surface-hi"
                  )}
                >
                  <f.icon size={14} />
                  {f.label} <span className="ml-auto text-text-muted">{f.ext}</span>
                </button>
              ))}
              <div className="mt-1 border-t border-border px-3 pt-2 text-[10.5px] text-text-muted">
                Preview-only below — download is disabled on sample data.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. KPI deck */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Rows Selected" value={`${filteredBills.length}`} icon={ListOrdered} tone="text" small />
        <StatCard label="Net Value" value={rs(metrics.totalAmount)} icon={Scale} tone="accent" small />
        <StatCard label="Volume" value={`${metrics.totalLiters.toLocaleString("en-IN")} L`} icon={Fuel} tone="text" small />
        <StatCard label="Voided / Returns" value={`${metrics.voidedCount}`} icon={Ban} tone="error" small />
      </div>

      {/* 3. Filter strip */}
      <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 min-w-[240px] items-center gap-2.5 rounded-xl border border-border bg-bg px-3.5 py-2 text-text transition-colors focus-within:border-accent">
            <Search size={15} className="text-text-muted" />
            <input
              type="text"
              placeholder="Receipt # or customer…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-[13px] text-text placeholder:text-text-muted/60 focus:outline-none"
            />
          </div>
          <Input
            value={vehicleQuery}
            onChange={(e) => setVehicleQuery(e.target.value)}
            placeholder="Vehicle plate…"
            className="w-40 py-2 text-[12.5px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-[12.5px]">
          <label className="flex items-center gap-1.5 text-text-muted">
            Period
            <select
              value={initialFilters.range.preset}
              onChange={(e) => applyPreset(e.target.value)}
              className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
            >
              {PRESETS.map((p) => (
                <option key={p} value={p}>
                  {PRESET_LABEL[p]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-text-muted">
            Fuel
            <select
              value={fuelFilter}
              onChange={(e) => setFuelFilter(e.target.value)}
              className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
            >
              <option value="ALL">All Fuels</option>
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="CNG">CNG</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-text-muted">
            Payment
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
            >
              <option value="ALL">All Modes</option>
              <option value="CASH">Cash</option>
              <option value="CREDIT">Credit</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-text-muted">
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
            >
              <option value="all">All Bills</option>
              <option value="active">Live Only</option>
              <option value="voided">Voided Only</option>
            </select>
          </label>

          <span className="ml-auto font-data text-[12px] text-text-muted">{rangeLabel} · covers all sample rows</span>
        </div>
      </div>

      {/* 4. Preview */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-display text-[13.5px] font-semibold text-text">
            Preview — {FORMATS.find((f) => f.id === format)?.label}
          </span>
          <span className="font-data text-[11px] text-text-muted">
            first {preview.length} of {filteredBills.length} rows
          </span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-bg">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border font-data text-[10.5px] tracking-wide text-text-muted">
                {HEADERS.map((h) => (
                  <th key={h} className="whitespace-nowrap px-2 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.length === 0 ? (
                <tr>
                  <td colSpan={HEADERS.length} className="py-8 text-center text-[12px] text-text-muted">
                    No rows match these filters.
                  </td>
                </tr>
              ) : (
                preview.map((row, i) => (
                  <tr key={i} className="border-b border-border/60">
                    {row.map((cell, j) => (
                      <td key={j} className="font-data whitespace-nowrap px-2 py-1.5 text-[11.5px] text-text-muted">
                        {cell === "" ? <span className="text-text-muted/40">—</span> : cell}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-bg px-3 py-2.5">
          <Info size={14} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-[12px] text-text-muted">
            <strong className="text-text">Download disabled on sample data.</strong> Exporting placeholders as a real
            file is how they end up in someone&apos;s books — this activates once the register is wired to the
            database.
          </p>
        </div>
      </div>
    </div>
  );
}
