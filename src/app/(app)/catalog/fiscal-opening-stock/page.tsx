import { requireUser } from "@/lib/dal";
import { CatalogSubnav } from "@/components/catalog/CatalogSubnav";
import { FiscalOpeningStockView } from "@/components/catalog/FiscalOpeningStockView";

export default async function FiscalOpeningStockPage() {
  await requireUser();

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full min-w-0 animate-fade-in">
      <CatalogSubnav />
      <FiscalOpeningStockView />
    </div>
  );
}

