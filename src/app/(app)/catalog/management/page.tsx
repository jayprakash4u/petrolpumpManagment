import { requireUser } from "@/lib/dal";
import { CatalogSubnav } from "@/components/catalog/CatalogSubnav";
import { ProductsListView } from "@/components/catalog/ProductsListView";

export default async function ProductManagementPage() {
  await requireUser();

  return (
    <div className="space-y-4">
      <CatalogSubnav />
      <ProductsListView />
    </div>
  );
}
