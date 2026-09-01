import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { parseBillFilters } from "@/lib/bill-filters";
import { describeRange } from "@/lib/reports";
import { getBillsPageData } from "@/lib/queries/bills";
import { Card } from "@/components/ui/Card";
import { BillExportView } from "@/components/billing/BillExportView";

export default async function BillExportPage({ searchParams }: PageProps<"/sales/export">) {
  const user = await requireUser();

  if (!can(user.role, "viewReports")) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h2 className="font-display text-[17px] font-semibold text-text">Export is restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          Bulk export is available to owners and managers. A single bill can be reprinted from the register.
        </p>
      </Card>
    );
  }

  const filters = parseBillFilters(await searchParams);
  const data = await getBillsPageData(user.stationId, filters);

  return (
    <BillExportView
      initialFilters={filters}
      basePath="/sales/export"
      bills={data.bills}
      rangeLabel={describeRange(filters.range)}
    />
  );
}
