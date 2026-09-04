import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { CatalogSubnav } from "@/components/catalog/CatalogSubnav";
import { ProductsListView } from "@/components/catalog/ProductsListView";

export default async function CatalogProductsPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-5xl w-full animate-fade-in space-y-4">
      <CatalogSubnav />

      <Card>
        <ProductsListView />
      </Card>
    </div>
  );
}
