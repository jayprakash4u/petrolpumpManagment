import { requireUser } from "@/lib/dal";
import { CatalogSubnav } from "@/components/catalog/CatalogSubnav";
import { StockAdjustmentListView } from "@/components/catalog/StockAdjustmentListView";

export default async function ShowStockAdjustmentsPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-7xl w-full animate-fade-in space-y-4">
      <CatalogSubnav />
      <StockAdjustmentListView />
    </div>
  );
}

