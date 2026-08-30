import { requireUser } from "@/lib/dal";
import { parseBillFilters } from "@/lib/bill-filters";
import { getVehicleBillingData } from "@/lib/queries/vehicles";
import { VehicleBillingView } from "@/components/billing/VehicleBillingView";

export default async function VehicleBillingPage({ searchParams }: PageProps<"/sales/vehicle">) {
  const user = await requireUser();
  const filters = parseBillFilters(await searchParams);
  const data = await getVehicleBillingData(user.stationId, filters);

  return <VehicleBillingView initialData={data} />;
}
