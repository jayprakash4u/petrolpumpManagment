import Link from "next/link";
import { clsx } from "clsx";
import type { ReportData } from "@/lib/queries/reports";
import { PRESETS, PRESET_LABEL, toDateInput, type DateRange } from "@/lib/reports";
import { ROLE_LABEL } from "@/lib/permissions";
import { fmtRs, fmtL, fmtRate, toNum } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";

/**
 * Range picker. Presets are plain links and the custom range is a GET form,
 * so the whole thing works without client JS and every report is a real,
 * shareable URL — a manager can send "the numbers for last month" to an
 * owner as a link.
 */
export function RangePicker({ range }: { range: DateRange }) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-2">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Link
            key={p}
            href={`/reports?preset=${p}`}
            className={clsx(
              "font-display rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
              range.preset === p
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border text-text-muted hover:text-text"
            )}
          >
            {PRESET_LABEL[p]}
          </Link>
        ))}
      </div>

      <form method="GET" action="/reports" className="ml-auto flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-[11.5px] text-text-muted">
          From
          <Input type="date" name="from" defaultValue={toDateInput(range.from)} className="w-auto py-1.5 text-[12px]" />
        </label>
        <label className="flex flex-col gap-1 text-[11.5px] text-text-muted">
          To
          <Input type="date" name="to" defaultValue={toDateInput(range.to)} className="w-auto py-1.5 text-[12px]" />
        </label>
        <PrimaryButton type="submit" className="px-3 py-1.5 text-[12px]">
          Apply
        </PrimaryButton>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function FuelBreakdown({ rows }: { rows: ReportData["fuelRows"] }) {
  const anySales = rows.some((r) => r.saleCount > 0);
  if (!anySales) {
    return <p className="py-8 text-center text-[13.5px] text-text-muted">No sales in this period.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
            <th className="px-2 py-2 font-medium">FUEL</th>
            <th className="px-2 py-2 text-right font-medium">REVENUE</th>
            <th className="px-2 py-2 text-right font-medium">VOLUME</th>
            <th className="px-2 py-2 text-right font-medium">SALES</th>
            <th className="px-2 py-2 text-right font-medium">AVG RATE</th>
            <th className="px-2 py-2 text-right font-medium">BOUGHT</th>
            <th className="px-2 py-2 text-right font-medium">SHARE</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.fuel} className="border-b border-border/60">
              <td className="px-2 py-2.5 text-[13px] text-text">{r.label}</td>
              <td className="px-2 py-2.5 text-right font-data text-[13px] font-semibold text-accent">{fmtRs(r.revenue)}</td>
              <td className="px-2 py-2.5 text-right font-data text-[12.5px] text-text-muted">{fmtL(r.liters)}</td>
              <td className="px-2 py-2.5 text-right font-data text-[12.5px] text-text-muted">{r.saleCount}</td>
              <td className="px-2 py-2.5 text-right font-data text-[12.5px] text-text">
                {r.avgRate ? fmtRate(r.avgRate) : "—"}
              </td>
              <td className="px-2 py-2.5 text-right font-data text-[12.5px] text-text-muted">
                {r.purchasedL.gt(0) ? `${fmtL(r.purchasedL)} @ ${r.avgCost ? fmtRate(r.avgCost) : "—"}` : "—"}
              </td>
              <td className="px-2 py-2.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-hi">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, toNum(r.sharePct))}%` }} />
                  </div>
                  <span className="font-data w-11 text-right text-[12px] text-text-muted">{r.sharePct.toString()}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function StaffBreakdown({ rows }: { rows: ReportData["staffRows"] }) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-[13.5px] text-text-muted">No sales in this period.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
            <th className="px-2 py-2 font-medium">STAFF</th>
            <th className="px-2 py-2 text-right font-medium">REVENUE</th>
            <th className="px-2 py-2 text-right font-medium">VOLUME</th>
            <th className="px-2 py-2 text-right font-medium">SALES</th>
            <th className="px-2 py-2 text-right font-medium">AVG SALE</th>
            <th className="px-2 py-2 text-right font-medium">SHARE</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/60">
              <td className="px-2 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-text">{r.name}</span>
                  {r.role && <Badge tone="muted">{ROLE_LABEL[r.role].toUpperCase()}</Badge>}
                </div>
              </td>
              <td className="px-2 py-2.5 text-right font-data text-[13px] font-semibold text-accent">{fmtRs(r.revenue)}</td>
              <td className="px-2 py-2.5 text-right font-data text-[12.5px] text-text-muted">{fmtL(r.liters)}</td>
              <td className="px-2 py-2.5 text-right font-data text-[12.5px] text-text-muted">{r.saleCount}</td>
              <td className="px-2 py-2.5 text-right font-data text-[12.5px] text-text">
                {r.averageSale ? fmtRs(r.averageSale) : "—"}
              </td>
              <td className="px-2 py-2.5 text-right font-data text-[12.5px] text-text-muted">{r.sharePct.toString()}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Cash movement — deliberately not labelled profit. See the note in queries/reports.ts. */
export function CashMovement({ data }: { data: ReportData }) {
  const rows: { label: string; value: string; tone: "in" | "out" }[] = [
    { label: "Cash sales", value: fmtRs(data.cash), tone: "in" },
    { label: "Credit payments collected", value: fmtRs(data.paymentsCollected), tone: "in" },
    { label: "Fuel purchases", value: fmtRs(data.purchaseTotal), tone: "out" },
  ];

  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline justify-between rounded-lg border border-border bg-bg px-3 py-2.5">
          <span className="text-[12.5px] text-text-muted">{r.label}</span>
          <span className={clsx("font-data text-[13.5px] font-semibold", r.tone === "in" ? "text-success" : "text-error")}>
            {r.tone === "in" ? "+" : "−"}
            {r.value}
          </span>
        </div>
      ))}

      <div className="mt-1 flex items-baseline justify-between rounded-lg border border-accent/30 bg-accent/8 px-3 py-2.5">
        <span className="text-[12.5px] text-text">Net movement</span>
        <span
          className={clsx(
            "font-data text-[15px] font-bold",
            data.netCashMovement.isNegative() ? "text-error" : "text-accent"
          )}
        >
          {fmtRs(data.netCashMovement)}
        </span>
      </div>

      <p className="mt-1 text-[11.5px] text-text-muted">
        Cash in and out over the period — <strong>not</strong> profit. Fuel bought in a window isn&apos;t the fuel sold
        in it, so a large delivery shows as an outflow rather than a loss.
      </p>

      {data.voidedCount > 0 && (
        <div className="mt-2 flex items-baseline justify-between rounded-lg border border-border bg-bg px-3 py-2.5">
          <span className="text-[12.5px] text-text-muted">Voided sales (excluded above)</span>
          <span className="font-data text-[13px] text-text-muted">
            {data.voidedCount} · {fmtRs(data.voidedValue)}
          </span>
        </div>
      )}
    </div>
  );
}
