import { requireUser } from "@/lib/dal";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { AddFixedAssetForm } from "@/components/purchases/AddFixedAssetForm";

export default async function NewFixedAssetPage() {
  await requireUser();

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full min-w-0 animate-fade-in">
      <PurchaseSubnav />
      <AddFixedAssetForm />
    </div>
  );
}
