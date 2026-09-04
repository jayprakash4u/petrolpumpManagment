import { requireUser } from "@/lib/dal";
import { CatalogSubnav } from "@/components/catalog/CatalogSubnav";
import { PetrolMeterStockLedgerView } from "@/components/catalog/PetrolMeterStockLedgerView";

export default async function PetrolMeterLedgerPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-7xl w-full animate-fade-in space-y-4">
      <CatalogSubnav />
      <PetrolMeterStockLedgerView />
    </div>
  );
}


