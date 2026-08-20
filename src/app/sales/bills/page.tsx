import { ListOrdered, TrendingUp, Fuel, Ban } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { parseBillFilters } from "@/lib/bill-filters";
import { describeRange } from "@/lib/reports";
import { MOCK_BILLS, MOCK_TOTALS } from "@/lib/mock/bills";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { BillFilterBar } from "@/components/billing/BillFilterBar";
import { BillsTable } from "@/components/billing/BillsTable";
import { StaticDataNotice } from "@/components/billing/StaticDataNotice";

export default async function ListBillsPage({ searchParams }: PageProps<"/sales/bills">) {
  await requireUser();
  const filters = parseBillFilters(await searchParams);

  // Static sample rows for now; the filters are parsed for real so the URL
  // behaviour and the layout are settled before any query is written.
  const bills = MOCK_BILLS;

  return (
    <div>
      <StaticDataNotice />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Net Sales" value={MOCK_TOTALS.netAmount} icon={TrendingUp} tone="accent" />
        <StatCard label="Fuel Sold" value={MOCK_TOTALS.netLiters} icon={Fuel} tone="text" />
        <StatCard label="Bills" value={String(MOCK_TOTALS.liveCount)} icon={ListOrdered} tone="text" />
        <StatCard
          label="Voided"
          value={`${MOCK_TOTALS.voidedCount} · ${MOCK_TOTALS.voidedAmount}`}
          icon={Ban}
          tone="text"
          small
        />
      </div>

      <BillFilterBar basePath="/sales/bills" filters={filters} showVehicle />

      <Card>
        <SectionTitle
          icon={ListOrdered}
          title="Bill Register"
          subtitle={`${describeRange(filters.range)} · ${bills.length} bills`}
        />
        <BillsTable bills={bills} />
      </Card>
    </div>
  );
}
