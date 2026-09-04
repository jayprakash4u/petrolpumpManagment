import { PackagePlus } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CatalogSubnav } from "@/components/catalog/CatalogSubnav";
import { AddProductForm } from "@/components/catalog/AddProductForm";

export default async function NewCatalogProductPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-2xl w-full animate-fade-in space-y-4">
      <CatalogSubnav />

      <Card>
        <SectionTitle
          icon={PackagePlus}
          title="Add Product"
          subtitle="Register a new fuel grade, lubricant, spare part, or consumable catalog item"
        />
        <AddProductForm />
      </Card>
    </div>
  );
}
