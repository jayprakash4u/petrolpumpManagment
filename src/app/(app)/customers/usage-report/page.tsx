import { requireUser } from "@/lib/dal";
import { parsePurchaseRegisterFilters } from "@/lib/queries/purchase-register";
import { getCustomerUsageReport } from "@/lib/queries/customers";
import { CustomersSubnav } from "@/components/customers/CustomersSubnav";
import { CustomerUsageReportView } from "@/components/customers/CustomerUsageReportView";

export default async function CustomerUsageReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  // Same "default to the current fiscal year" logic the Purchase Register
  // uses — a consumption report landing on "today" would read as empty
  // most days.
  const { range } = parsePurchaseRegisterFilters(params);
  const rows = await getCustomerUsageReport(user.stationId, range);

  return (
    <div className="space-y-4 w-full min-w-0 animate-fade-in">
      <CustomersSubnav />
      <CustomerUsageReportView rows={rows} range={range} />
    </div>
  );
}
