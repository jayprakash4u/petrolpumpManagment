import { requireUser } from "@/lib/dal";
import { CatalogSubnav } from "@/components/catalog/CatalogSubnav";
import { PetrolStockLedgerView } from "@/components/catalog/PetrolStockLedgerView";

export default async function PetrolStockLedgerPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-7xl w-full animate-fade-in space-y-4">
      <CatalogSubnav />
      <PetrolStockLedgerView />
    </div>
  );
}


