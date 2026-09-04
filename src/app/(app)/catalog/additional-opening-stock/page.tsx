import { requireUser } from "@/lib/dal";
import { CatalogSubnav } from "@/components/catalog/CatalogSubnav";
import { AdditionalOpeningStockView } from "@/components/catalog/AdditionalOpeningStockView";

export default async function AdditionalOpeningStockPage() {
  await requireUser();

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full min-w-0 animate-fade-in">
      <CatalogSubnav />
      <AdditionalOpeningStockView />
    </div>
  );
}


