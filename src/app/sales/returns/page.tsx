import { Undo2, Ban, Info } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { parseBillFilters } from "@/lib/bill-filters";
import { describeRange } from "@/lib/reports";
import { MOCK_VOIDED_BILLS, MOCK_TOTALS } from "@/lib/mock/bills";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { BillFilterBar } from "@/components/billing/BillFilterBar";
import { BillsTable } from "@/components/billing/BillsTable";
import { StaticDataNotice } from "@/components/billing/StaticDataNotice";

export default async function SalesReturnsPage({ searchParams }: PageProps<"/sales/returns">) {
  const user = await requireUser();

  if (!can(user.role, "voidSale")) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h2 className="font-display text-[17px] font-semibold text-text">Sales returns are restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">Only an owner or manager can issue a credit note.</p>
      </Card>
    );
  }

  // Forced to the voided slice: a return IS a reversed bill, so this page is
  // the same register with one status, never a separate list to keep in step.
  const filters = parseBillFilters(await searchParams, "voided");
  const returns = MOCK_VOIDED_BILLS;

  return (
    <div>
      <StaticDataNotice />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Credit Notes" value={String(MOCK_TOTALS.voidedCount)} icon={Undo2} tone="text" />
        <StatCard label="Value Reversed" value={MOCK_TOTALS.voidedAmount} icon={Ban} tone="accent" />
        <StatCard label="Period" value={describeRange(filters.range)} icon={Info} tone="text" small />
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-[10px] border border-border bg-surface px-[15px] py-[11px]">
        <Info size={15} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-[12.5px] text-text-muted">
          A return is raised by voiding the original bill from <strong className="text-text">Sales Entry</strong>, which
          returns the fuel to the tank and reverses any credit charge. This page is the register of those credit notes —
          there is no second way to reverse a sale, so the two can never disagree.
        </p>
      </div>

      <BillFilterBar basePath="/sales/returns" filters={filters} showStatus={false} showVehicle />

      <Card>
        <SectionTitle icon={Undo2} title="Sales Returns" subtitle={`${describeRange(filters.range)} · credit notes issued`} />
        <BillsTable bills={returns} showVoidReason emptyMessage="No credit notes in this period — nothing has been voided." />
      </Card>
    </div>
  );
}
