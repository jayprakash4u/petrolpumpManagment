import { TrendingUp, TrendingDown } from "lucide-react";
import type { StockPageData } from "@/lib/queries/stock";
import { FUEL_LABEL } from "@/lib/fuel";
import { fmtRs, fmtL, fmtRate } from "@/lib/money";
import { fmtBSDateTime } from "@/lib/bs-date";
import { Badge } from "@/components/ui/Badge";

const when = (d: Date) => fmtBSDateTime(d);

/** Deliveries received, newest first, with the derived per-litre cost and margin. */
export function PurchaseHistory({ purchases }: { purchases: StockPageData["purchases"] }) {
  if (purchases.length === 0) {
    return <p className="py-8 text-center text-[13.5px] text-text-muted">No deliveries recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
            <th className="px-2 py-2 font-medium">FUEL</th>
            <th className="px-2 py-2 text-right font-medium">VOLUME</th>
            <th className="px-2 py-2 text-right font-medium">INVOICE</th>
            <th className="px-2 py-2 text-right font-medium">PER LITRE</th>
            <th className="px-2 py-2 text-right font-medium">MARGIN</th>
            <th className="px-2 py-2 font-medium">SUPPLIER</th>
            <th className="px-2 py-2 text-right font-medium">RECEIVED</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((p) => (
            <tr key={p.id} className="border-b border-border/60">
              <td className="px-2 py-2.5 text-[13px] text-text">{FUEL_LABEL[p.fuel]}</td>
              <td className="px-2 py-2.5 text-right font-data text-[12.5px] text-text-muted">{fmtL(p.liters)}</td>
              <td className="px-2 py-2.5 text-right font-data text-[13px] font-semibold text-text">{fmtRs(p.totalCost)}</td>
              <td className="px-2 py-2.5 text-right font-data text-[12.5px] text-text-muted">
                {p.costPerL ? fmtRate(p.costPerL) : "—"}
              </td>
              <td
                className={
                  "px-2 py-2.5 text-right font-data text-[12.5px] font-semibold " +
                  (p.margin === null ? "text-text-muted" : p.margin.isNegative() ? "text-error" : "text-success")
                }
              >
                {p.margin ? fmtRate(p.margin) : "—"}
              </td>
              <td className="px-2 py-2.5 text-[12.5px] text-text-muted">
                {p.supplier}
                {p.invoiceNo && <span className="font-data ml-1.5 text-[11px] opacity-70">#{p.invoiceNo}</span>}
              </td>
              <td className="px-2 py-2.5 text-right font-data text-[11.5px] text-text-muted">{when(p.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Every repricing, so a manager can answer "why was this sale billed at that rate?". */
export function RateHistory({ history }: { history: StockPageData["rateHistory"] }) {
  if (history.length === 0) {
    return <p className="py-8 text-center text-[13.5px] text-text-muted">No rate changes recorded yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {history.map((h) => {
        const rose = h.newRate.gt(h.oldRate);
        return (
          <li key={h.id} className="flex items-center gap-3 rounded-lg border border-border bg-bg px-3 py-2.5">
            <Badge tone={rose ? "error" : "success"}>
              {rose ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {FUEL_LABEL[h.tank.fuel]}
            </Badge>
            <span className="font-data text-[12.5px] text-text">
              {fmtRate(h.oldRate)} → <span className="font-semibold text-accent">{fmtRate(h.newRate)}</span>
            </span>
            <span className="ml-auto text-right text-[11.5px] text-text-muted">
              {h.changedBy.name}
              <span className="font-data ml-2 opacity-70">{when(h.changedAt)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
