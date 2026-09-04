import { requireUser } from "@/lib/dal";
import { CatalogSubnav } from "@/components/catalog/CatalogSubnav";
import { StockAdjustmentView } from "@/components/catalog/StockAdjustmentView";

export default async function CatalogAdjustmentPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-5xl w-full animate-fade-in space-y-4">
      <CatalogSubnav />
      <StockAdjustmentView initialShowForm={true} />
    </div>
  );
}
