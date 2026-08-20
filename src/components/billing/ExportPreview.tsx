"use client";

import { useState } from "react";
import { Download, FileText, Table2 } from "lucide-react";
import { clsx } from "clsx";
import type { MockBill } from "@/lib/mock/bills";
import { FUEL_LABEL } from "@/lib/fuel";
import { PrimaryButton } from "@/components/ui/Button";

type Format = "csv" | "excel" | "pdf";

const FORMATS: { id: Format; label: string; note: string; icon: typeof Table2 }[] = [
  { id: "csv", label: "CSV", note: "Opens anywhere, best for accounts software", icon: Table2 },
  { id: "excel", label: "Excel", note: "Formatted columns and totals", icon: FileText },
  { id: "pdf", label: "PDF", note: "For printing or emailing as-is", icon: FileText },
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
 * Export format picker with a live preview of the first rows.
 *
 * The preview is not decoration: an export that turns out wrong is usually
 * discovered in a spreadsheet an hour later, by which point nobody remembers
 * which filters produced it. Showing the actual first rows, with the actual
 * headers, makes a mistake obvious before the download.
 *
 * Static for now — the button explains that rather than producing a file that
 * would contain sample data.
 */
export function ExportPreview({ bills, rangeLabel }: { bills: MockBill[]; rangeLabel: string }) {
  const [format, setFormat] = useState<Format>("csv");
  const preview = bills.slice(0, 4).map(toRow);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="mb-1.5 block text-[12.5px] font-medium text-text-muted">Format</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f.id)}
              aria-pressed={format === f.id}
              className={clsx(
                "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                format === f.id
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border text-text-muted hover:text-text"
              )}
            >
              <span className="font-display flex items-center gap-1.5 text-[13.5px] font-semibold">
                <f.icon size={14} />
                {f.label}
              </span>
              <span className="text-[11px] opacity-80">{f.note}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-[12.5px] font-medium text-text-muted">Preview</span>
          <span className="font-data text-[11px] text-text-muted">
            first {preview.length} of {bills.length} rows
          </span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-bg">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border font-data text-[10.5px] tracking-wide text-text-muted">
                {HEADERS.map((h) => (
                  <th key={h} className="px-2 py-2 font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="border-b border-border/60">
                  {row.map((cell, j) => (
                    <td key={j} className="font-data px-2 py-1.5 text-[11.5px] whitespace-nowrap text-text-muted">
                      {cell === "" ? <span className="text-text-muted/40">—</span> : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton type="button" disabled className="py-2.5">
          <Download size={15} />
          Download {format.toUpperCase()}
        </PrimaryButton>
        <span className="text-[12px] text-text-muted">
          Disabled while this screen is on sample data — exporting placeholders as a real file is how they end up in
          someone&apos;s books. Covers {rangeLabel.toLowerCase()}.
        </span>
      </div>
    </div>
  );
}
