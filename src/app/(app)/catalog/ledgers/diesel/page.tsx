import { requireUser } from "@/lib/dal";
import { CatalogSubnav } from "@/components/catalog/CatalogSubnav";
import { DieselStockLedgerView } from "@/components/catalog/DieselStockLedgerView";

export default async function DieselStockLedgerPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-7xl w-full animate-fade-in space-y-4">
      <CatalogSubnav />
      <DieselStockLedgerView fuelName="Diesel" />
    </div>
  );
}

