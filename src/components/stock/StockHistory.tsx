import { TrendingUp, TrendingDown } from "lucide-react";
import type { StockPageData } from "@/lib/queries/stock";
import { FUEL_LABEL } from "@/lib/fuel";
import { fmtRate } from "@/lib/money";
import { fmtBSDateTime } from "@/lib/bs-date";
import { Badge } from "@/components/ui/Badge";

const when = (d: Date) => fmtBSDateTime(d);

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
