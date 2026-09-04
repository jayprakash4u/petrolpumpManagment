import { requireUser } from "@/lib/dal";
import { CatalogSubnav } from "@/components/catalog/CatalogSubnav";
import { OpeningStockView } from "@/components/catalog/OpeningStockView";

export default async function OpeningStockPage() {
  await requireUser();

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full min-w-0 animate-fade-in">
      <CatalogSubnav />
      <OpeningStockView title="Station Opening Stock" />
    </div>
  );
}
