import { requireUser } from "@/lib/dal";
import { fiscalYearOf, fiscalYearRange } from "@/lib/bs-date";
import { recentFiscalYears } from "@/lib/queries/purchase-register";
import { getPartiesAboveThreshold } from "@/lib/queries/customers";
import { CustomersSubnav } from "@/components/customers/CustomersSubnav";
import { PartiesAbove1View } from "@/components/customers/PartiesAbove1View";

export default async function PartiesAbove1Page({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string | string[] }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const rawFy = Array.isArray(params.fy) ? params.fy[0] : params.fy;

  const fiscalYears = recentFiscalYears();
  const currentFY = fiscalYearOf(new Date());
  const defaultStartYear = currentFY ? parseInt(currentFY.split("/")[0], 10) : fiscalYears[0].startYear;

  const parsedFy = rawFy ? parseInt(rawFy, 10) : NaN;
  const startYear = fiscalYears.some((fy) => fy.startYear === parsedFy) ? parsedFy : defaultStartYear;

  const range = fiscalYearRange(startYear) ?? fiscalYearRange(defaultStartYear);
  const rows = range ? await getPartiesAboveThreshold(user.stationId, range) : [];
  const fiscalYearLabel = fiscalYears.find((fy) => fy.startYear === startYear)?.label ?? currentFY ?? "";

  return (
    <div className="space-y-4 w-full min-w-0 animate-fade-in">
      <CustomersSubnav />
      <PartiesAbove1View
        rows={rows}
        fiscalYears={fiscalYears}
        selectedStartYear={startYear}
        fiscalYearLabel={fiscalYearLabel}
      />
    </div>
  );
}
