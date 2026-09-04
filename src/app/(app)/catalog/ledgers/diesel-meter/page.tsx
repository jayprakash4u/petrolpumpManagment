import { requireUser } from "@/lib/dal";
import { CatalogSubnav } from "@/components/catalog/CatalogSubnav";
import { DieselMeterStockLedgerView } from "@/components/catalog/DieselMeterStockLedgerView";

export default async function DieselMeterLedgerPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-7xl w-full animate-fade-in space-y-4">
      <CatalogSubnav />
      <DieselMeterStockLedgerView fuelName="Diesel" />
    </div>
  );
}

