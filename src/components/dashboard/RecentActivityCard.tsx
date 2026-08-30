import Link from "next/link";
import { Activity, ArrowRight, Receipt, User, Car } from "lucide-react";
import { fmtRs, fmtL } from "@/lib/money";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { Badge } from "@/components/ui/Badge";
import type { Prisma } from "@prisma/client";

export type RecentSaleItem = {
  id: string;
  receiptNo: number;
  fuel: string;
  liters: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  paymentMethod: string;
  vehicleNo: string | null;
  createdAt: Date;
  customer?: { name: string } | null;
  soldBy?: { name: string } | null;
};

export function RecentActivityCard({ sales }: { sales: RecentSaleItem[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Activity size={17} />
          </div>
          <div>
            <h3 className="font-display text-[15px] font-bold text-text">
              Recent Activity (भर्खरैका कारोबारहरू)
            </h3>
            <p className="text-[11.5px] text-text-muted">
              Live stream of latest sales and dispenser transactions
            </p>
          </div>
        </div>

        <Link
          href="/sales/bills"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-accent hover:underline"
        >
          View All <ArrowRight size={13} />
        </Link>
      </div>

      {sales.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border text-center text-[12.5px] text-text-muted">
          No transactions recorded yet today. Use Quick Actions above to record a sale.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {sales.map((sale) => {
            const fuelId = sale.fuel as FuelId;
            const timeStr = new Date(sale.createdAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });

            return (
              <div
                key={sale.id}
                className="flex items-center justify-between py-3 text-[12.5px] first:pt-1 last:pb-1"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-hi text-text">
                    <Receipt size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-text">
                        Sale #{sale.receiptNo}
                      </span>
                      <span className="text-[11.5px] text-text-muted">·</span>
                      <span className="font-semibold text-accent">
                        {fmtL(sale.liters)} {FUEL_LABEL[fuelId]}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-text-muted">
                      {sale.vehicleNo ? (
                        <span className="font-mono text-text flex items-center gap-1">
                          <Car size={11} /> {sale.vehicleNo}
                        </span>
                      ) : sale.customer ? (
                        <span>{sale.customer.name}</span>
                      ) : (
                        <span>Retail Walk-in</span>
                      )}
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <User size={11} /> {sale.soldBy?.name || "Staff"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-data font-bold text-[14px] text-text">
                    {fmtRs(sale.totalAmount)}
                  </div>
                  <div className="mt-0.5 flex items-center justify-end gap-1.5">
                    <span className="rounded bg-surface-hi px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
                      {sale.paymentMethod}
                    </span>
                    <span className="text-[10.5px] text-text-muted font-mono">{timeStr}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
