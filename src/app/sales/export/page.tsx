import { Download, FileSpreadsheet, Info } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { parseBillFilters } from "@/lib/bill-filters";
import { describeRange } from "@/lib/reports";
import { MOCK_BILLS } from "@/lib/mock/bills";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { BillFilterBar } from "@/components/billing/BillFilterBar";
import { ExportPreview } from "@/components/billing/ExportPreview";
import { StaticDataNotice } from "@/components/billing/StaticDataNotice";

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

  return (
    <div>
      <StaticDataNotice />

      <div className="mb-4 flex items-start gap-2 rounded-[10px] border border-border bg-surface px-[15px] py-[11px]">
        <Info size={15} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-[12.5px] text-text-muted">
          The export takes <strong className="text-text">exactly the rows the filters below select</strong> — the same
          set the register shows. Dates are written in Bikram Sambat, so the file matches what an accountant or the IRD
          expects without anyone converting by hand.
        </p>
      </div>

      <BillFilterBar basePath="/sales/export" filters={filters} showVehicle />

      <Card>
        <SectionTitle
          icon={Download}
          title="Bill Export"
          subtitle={`${describeRange(filters.range)} · ${MOCK_BILLS.length} rows selected`}
        />
        <ExportPreview bills={MOCK_BILLS} rangeLabel={describeRange(filters.range)} />
      </Card>

      <Card className="mt-4">
        <SectionTitle icon={FileSpreadsheet} title="Columns" subtitle="What each row of the file contains" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <tbody>
              {[
                ["Receipt No", "Gap-free, per station"],
                ["Date (BS)", "e.g. 2083-05-03 — the invoice date"],
                ["Time", "Local time of the sale"],
                ["Fuel", "Petrol, Diesel or CNG"],
                ["Litres", "Exact volume dispensed"],
                ["Rate", "Rate at the moment of sale, not today's rate"],
                ["Amount", "Litres × rate"],
                ["Payment", "Cash or Credit"],
                ["Customer", "Blank for a cash sale"],
                ["Vehicle No", "Blank where no plate was recorded"],
                ["Sold By", "Staff member who recorded it"],
                ["Status", "Live or Voided, with the void reason"],
              ].map(([col, note]) => (
                <tr key={col} className="border-b border-border/60">
                  <td className="px-2 py-2 font-data text-[12.5px] font-semibold text-text">{col}</td>
                  <td className="px-2 py-2 text-[12.5px] text-text-muted">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
