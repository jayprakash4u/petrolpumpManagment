"use client";

import { useState } from "react";
import { Printer, Edit } from "lucide-react";
import type { SalesPageData } from "@/lib/queries/sales";
import { FUEL_LABEL } from "@/lib/fuel";
import { fmtRs, fmtL } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { GhostButton } from "@/components/ui/Button";
import { VoidSaleButton } from "./VoidSaleButton";
import { PrintReceiptModal } from "./PrintReceiptModal";
import { EditBillModal } from "./EditBillModal";

const time = (d: Date | string) =>
  new Date(d).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

export function RecentSalesTable({
  sales,
  canVoid,
  customers = [],
}: {
  sales: SalesPageData["recentSales"];
  canVoid: boolean;
  customers?: SalesPageData["customers"];
}) {
  const [printingSale, setPrintingSale] = useState<any | null>(null);
  const [editingSale, setEditingSale] = useState<any | null>(null);

  if (sales.length === 0) {
    return <p className="py-8 text-center text-[13.5px] text-text-muted">No sales recorded yet today.</p>;
  }

  return (
    <>
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
              <th className="px-2 py-2 text-right font-medium">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className={"border-b border-border/60 " + (s.voided ? "opacity-50" : "")}>
                <td className="px-2 py-2.5 font-data text-[12.5px] text-text-muted font-mono font-bold">
                  #{s.receiptNo}
                </td>
                <td className="px-2 py-2.5 text-[13px] text-text font-medium">{FUEL_LABEL[s.fuel as keyof typeof FUEL_LABEL] ?? s.fuel}</td>
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
                  ) : s.paymentMethod === "ONLINE" ? (
                    <Badge tone="accent">QR / ONLINE</Badge>
                  ) : s.paymentMethod === "CARD" ? (
                    <Badge tone="accent">POS CARD</Badge>
                  ) : (
                    <Badge tone="accent">{s.customerName ?? "CREDIT"}</Badge>
                  )}
                </td>
                <td className="px-2 py-2.5 text-[12.5px] text-text-muted">{s.soldByName}</td>
                <td className="px-2 py-2.5 text-right font-data text-[12px] text-text-muted">{time(s.createdAt)}</td>
                <td className="px-2 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <GhostButton
                      type="button"
                      onClick={() =>
                        setPrintingSale({
                          id: s.id,
                          receiptNo: s.receiptNo,
                          fuel: s.fuel,
                          liters: s.liters,
                          ratePerL: s.ratePerL,
                          totalAmount: s.totalAmount,
                          paymentMethod: s.paymentMethod,
                          createdAt: s.createdAt,
                          customerName: s.customerName,
                          soldByName: s.soldByName,
                        })
                      }
                      className="px-2 py-1 text-[11.5px]"
                      title="Print receipt slip"
                    >
                      <Printer size={13} />
                      Print
                    </GhostButton>

                    {canVoid && !s.voided && (
                      <GhostButton
                        type="button"
                        onClick={() =>
                          setEditingSale({
                            id: s.id,
                            receiptNo: s.receiptNo,
                            fuel: s.fuel,
                            liters: s.liters,
                            ratePerL: s.ratePerL,
                            totalAmount: s.totalAmount,
                            paymentMethod: s.paymentMethod,
                            customerId: (s as any).customerId,
                            customerName: s.customerName,
                            createdAt: s.createdAt,
                            soldByName: s.soldByName,
                          })
                        }
                        className="px-2 py-1 text-[11.5px]"
                        title="Edit bill details"
                      >
                        <Edit size={13} />
                        Edit
                      </GhostButton>
                    )}

                    {canVoid && !s.voided && (
                      <VoidSaleButton saleId={s.id} receiptNo={s.receiptNo} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {printingSale && (
        <PrintReceiptModal sale={printingSale} onClose={() => setPrintingSale(null)} />
      )}

      {editingSale && (
        <EditBillModal
          sale={editingSale}
          customers={customers}
          onClose={() => setEditingSale(null)}
        />
      )}
    </>
  );
}
