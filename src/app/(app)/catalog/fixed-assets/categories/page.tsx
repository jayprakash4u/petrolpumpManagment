import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { CatalogSubnav } from "@/components/catalog/CatalogSubnav";
import { AssetCategoriesView } from "@/components/catalog/AssetCategoriesView";

export default async function FixedAssetCategoriesPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-5xl w-full animate-fade-in space-y-4">
      <CatalogSubnav />

      <Card>
        <AssetCategoriesView />
      </Card>
    </div>
  );
}
