import Link from "next/link";
import { clsx } from "clsx";
import { FileText } from "lucide-react";
import type { MockBill } from "@/lib/mock/bills";
import { FUEL_LABEL } from "@/lib/fuel";
import { formatVehicleNo } from "@/lib/vehicle";
import { Badge } from "@/components/ui/Badge";

/**
 * The bill register.
 *
 * Static for now — the data layer comes later — but the shape is the point:
 * one table serves List Bills and Sales Returns, differing only by which rows
 * are handed to it. Building two tables would be how the two screens
 * eventually start disagreeing about what a bill looks like.
 */
export function BillsTable({
  bills,
  showVoidReason = false,
  emptyMessage = "No bills match these filters.",
}: {
  bills: MockBill[];
  showVoidReason?: boolean;
  emptyMessage?: string;
}) {
  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <FileText size={26} className="text-text-muted/40" />
        <p className="text-[13.5px] text-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
            <th className="px-2 py-2 font-medium">RECEIPT</th>
            <th className="px-2 py-2 font-medium">DATE (BS)</th>
            <th className="px-2 py-2 font-medium">FUEL</th>
            <th className="px-2 py-2 text-right font-medium">VOLUME</th>
            <th className="px-2 py-2 text-right font-medium">RATE</th>
            <th className="px-2 py-2 text-right font-medium">AMOUNT</th>
            <th className="px-2 py-2 font-medium">PAYMENT</th>
            <th className="px-2 py-2 font-medium">VEHICLE</th>
            <th className="px-2 py-2 font-medium">BY</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((b) => (
            <tr key={b.id} className={clsx("border-b border-border/60", b.voided && "opacity-60")}>
              <td className="px-2 py-2.5">
                <Link
                  href={`/sales/bills/${b.id}`}
                  className="font-data text-[12.5px] text-accent hover:underline"
                  title="View bill details"
                >
                  #{b.receiptNo}
                </Link>
                {showVoidReason && b.voidReason && (
                  <div className="mt-0.5 max-w-[180px] truncate text-[11px] text-error" title={b.voidReason}>
                    {b.voidReason}
                  </div>
                )}
              </td>
              <td className="px-2 py-2.5">
                <div className="font-data text-[12.5px] text-text">{b.dateBS}</div>
                <div className="font-data text-[10.5px] text-text-muted">{b.time}</div>
              </td>
              <td className="px-2 py-2.5 text-[13px] text-text">{FUEL_LABEL[b.fuel]}</td>
              <td className="px-2 py-2.5 text-right font-data text-[12.5px] text-text-muted">{b.liters}</td>
              <td className="px-2 py-2.5 text-right font-data text-[12.5px] text-text-muted">{b.rate}</td>
              <td
                className={clsx(
                  "px-2 py-2.5 text-right font-data text-[13px] font-semibold",
                  b.voided ? "text-text-muted line-through" : "text-text"
                )}
              >
                {b.amount}
              </td>
              <td className="px-2 py-2.5">
                {b.voided ? (
                  <Badge tone="error">VOIDED</Badge>
                ) : b.payment === "CASH" ? (
                  <Badge tone="success">CASH</Badge>
                ) : (
                  <Badge tone="accent">{b.customer ?? "CREDIT"}</Badge>
                )}
              </td>
              <td className="px-2 py-2.5 font-data text-[12px] text-text-muted">
                {/* An absent plate says so, rather than showing an empty cell
                    that reads as a rendering fault. */}
                {b.vehicleNo ? (
                  <Link href={`/sales/vehicle?vehicle=${b.vehicleNo}`} className="text-accent hover:underline">
                    {formatVehicleNo(b.vehicleNo)}
                  </Link>
                ) : (
                  <span className="text-text-muted/50">not recorded</span>
                )}
              </td>
              <td className="px-2 py-2.5 text-[12.5px] text-text-muted">{b.soldBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
