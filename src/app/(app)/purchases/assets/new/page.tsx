import { Warehouse } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { AddFixedAssetForm } from "@/components/purchases/AddFixedAssetForm";

export default async function NewFixedAssetPage() {
  await requireUser();

  return (
    <div>
      <PurchaseSubnav />

      <div className="mx-auto max-w-2xl">
        <Card>
          <SectionTitle icon={Warehouse} title="Add Fixed Asset" subtitle="Register new station equipment or infrastructure" />
          <AddFixedAssetForm />
        </Card>
      </div>
    </div>
  );
}
