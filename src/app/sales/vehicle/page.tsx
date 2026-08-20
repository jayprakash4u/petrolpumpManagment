import Link from "next/link";
import { Car, TrendingUp, Fuel, AlertTriangle } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { parseBillFilters } from "@/lib/bill-filters";
import { describeRange } from "@/lib/reports";
import { formatVehicleNo } from "@/lib/vehicle";
import { MOCK_VEHICLE_ROWS, MOCK_VEHICLE_TOTALS } from "@/lib/mock/bills";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { BillFilterBar } from "@/components/billing/BillFilterBar";
import { StaticDataNotice } from "@/components/billing/StaticDataNotice";

export default async function VehicleBillingPage({ searchParams }: PageProps<"/sales/vehicle">) {
  await requireUser();
  const filters = parseBillFilters(await searchParams);

  const rows = filters.vehicleNo
    ? MOCK_VEHICLE_ROWS.filter((r) => r.vehicleNo === filters.vehicleNo)
    : MOCK_VEHICLE_ROWS;

  return (
    <div>
      <StaticDataNotice />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Vehicles" value={String(MOCK_VEHICLE_TOTALS.vehicleCount)} icon={Car} tone="text" />
        <StatCard label="Billed to Vehicles" value={MOCK_VEHICLE_TOTALS.totalAmount} icon={TrendingUp} tone="accent" />
        <StatCard label="Fuel Dispensed" value={MOCK_VEHICLE_TOTALS.totalLiters} icon={Fuel} tone="text" />
        <StatCard
          label="No Plate Recorded"
          value={String(MOCK_VEHICLE_TOTALS.unattributed)}
          icon={AlertTriangle}
          tone={MOCK_VEHICLE_TOTALS.unattributed > 0 ? "accent" : "success"}
        />
      </div>

      {MOCK_VEHICLE_TOTALS.unattributed > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-[10px] border border-border bg-surface px-[15px] py-[11px]">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-[12.5px] text-text-muted">
            {MOCK_VEHICLE_TOTALS.unattributed} sales in this period have no vehicle recorded, so they are missing from the
            totals below. That is legitimate for a jerry-can walk-in — but if a fleet customer&apos;s fuel is going
            unattributed, their per-vehicle costs will read low.
          </p>
        </div>
      )}

      <BillFilterBar basePath="/sales/vehicle" filters={filters} showStatus={false} showVehicle />

      <Card>
        <SectionTitle
          icon={Car}
          title="Vehicle-wise Billing"
          subtitle={`${describeRange(filters.range)} · ranked by spend`}
        />

        {rows.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[13.5px] text-text-muted">
              No fuel billed to{" "}
              <span className="font-data text-text">{formatVehicleNo(filters.vehicleNo ?? "")}</span> in this period.
            </p>
            <Link href="/sales/vehicle" className="mt-2 inline-block text-[12.5px] text-accent hover:underline">
              Show all vehicles
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
                  <th className="px-2 py-2 font-medium">VEHICLE</th>
                  <th className="px-2 py-2 font-medium">ACCOUNT</th>
                  <th className="px-2 py-2 text-right font-medium">FILLS</th>
                  <th className="px-2 py-2 text-right font-medium">VOLUME</th>
                  <th className="px-2 py-2 text-right font-medium">AMOUNT</th>
                  <th className="px-2 py-2 text-right font-medium">LAST FILL (BS)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.vehicleNo} className="border-b border-border/60">
                    <td className="px-2 py-2.5 font-data text-[13px] font-semibold text-text">
                      {formatVehicleNo(r.vehicleNo)}
                    </td>
                    <td className="px-2 py-2.5 text-[12.5px] text-text-muted">
                      {r.topCustomer ?? <span className="text-text-muted/50">cash sales</span>}
                    </td>
                    <td className="px-2 py-2.5 text-right font-data text-[12.5px] text-text-muted">{r.saleCount}</td>
                    <td className="px-2 py-2.5 text-right font-data text-[12.5px] text-text-muted">{r.liters}</td>
                    <td className="px-2 py-2.5 text-right font-data text-[13px] font-semibold text-accent">{r.amount}</td>
                    <td className="px-2 py-2.5 text-right font-data text-[12px] text-text-muted">{r.lastSeenBS}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
