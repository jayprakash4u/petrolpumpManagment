import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { CatalogSubnav } from "@/components/catalog/CatalogSubnav";
import { FuelStockTransferView } from "@/components/catalog/FuelStockTransferView";

export default async function StockTransferPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-4xl w-full animate-fade-in space-y-4">
      <CatalogSubnav />

      <Card>
        <FuelStockTransferView />
      </Card>
    </div>
  );
}
