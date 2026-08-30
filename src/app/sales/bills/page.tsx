import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { parseBillFilters } from "@/lib/bill-filters";
import { getBillsPageData } from "@/lib/queries/bills";
import { ListBillsView } from "@/components/billing/ListBillsView";

export default async function ListBillsPage({ searchParams }: PageProps<"/sales/bills">) {
  const user = await requireUser();
  const filters = parseBillFilters(await searchParams);
  const data = await getBillsPageData(user.stationId, filters);

  return (
    <ListBillsView
      initialData={data}
      filters={filters}
      canVoid={can(user.role, "voidSale")}
    />
  );
}
