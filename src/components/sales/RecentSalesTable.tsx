import type { SalesPageData } from "@/lib/queries/sales";
import { FUEL_LABEL } from "@/lib/fuel";
import { fmtRs, fmtL } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { VoidSaleButton } from "./VoidSaleButton";

const time = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

/**
 * Server Component — the money stays as Prisma.Decimal right up to the
 * formatter, and only the void control (which needs state) crosses into the
 * client.
 */
export function RecentSalesTable({ sales, canVoid }: { sales: SalesPageData["recentSales"]; canVoid: boolean }) {
  if (sales.length === 0) {
    return <p className="py-8 text-center text-[13.5px] text-text-muted">No sales recorded yet today.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
            <th className="px-2 py-2 font-medium">RECEIPT</th>
            <th className="px-2 py-2 font-medium">FUEL</th>
            <th className="px-2 py-2 text-right font-medium">VOLUME</th>
            <th className="px-2 py-2 text-right font-medium">AMOUNT</th>
            <th className="px-2 py-2 font-medium">PAYMENT</th>
            <th className="px-2 py-2 font-medium">BY</th>
            <th className="px-2 py-2 text-right font-medium">TIME</th>
            {canVoid && <th className="px-2 py-2" />}
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id} className={"border-b border-border/60 " + (s.voided ? "opacity-50" : "")}>
              <td className="px-2 py-2.5 font-data text-[12.5px] text-text-muted">#{s.receiptNo}</td>
              <td className="px-2 py-2.5 text-[13px] text-text">{FUEL_LABEL[s.fuel]}</td>
              <td className="px-2 py-2.5 text-right font-data text-[12.5px] text-text-muted">{fmtL(s.liters)}</td>
              <td
                className={
                  "px-2 py-2.5 text-right font-data text-[13px] font-semibold " +
                  (s.voided ? "text-text-muted line-through" : "text-text")
                }
              >
                {fmtRs(s.totalAmount)}
              </td>
              <td className="px-2 py-2.5">
                {s.voided ? (
                  <Badge tone="error" title={s.voidReason ?? undefined}>
                    VOIDED
                  </Badge>
                ) : s.paymentMethod === "CASH" ? (
                  <Badge tone="success">CASH</Badge>
                ) : (
                  <Badge tone="accent">{s.customer?.name ?? "CREDIT"}</Badge>
                )}
              </td>
              <td className="px-2 py-2.5 text-[12.5px] text-text-muted">{s.soldBy.name}</td>
              <td className="px-2 py-2.5 text-right font-data text-[12px] text-text-muted">{time(s.createdAt)}</td>
              {canVoid && (
                <td className="px-2 py-2.5 text-right">
                  {!s.voided && <VoidSaleButton saleId={s.id} receiptNo={s.receiptNo} />}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
