import { requireUser } from "@/lib/dal";
import { AddOtherItemPurchaseForm } from "@/components/purchases/AddOtherItemPurchaseForm";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";

export default async function NewOtherItemPurchasePage() {
  await requireUser();

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full min-w-0 animate-fade-in">
      <PurchaseSubnav />
      <AddOtherItemPurchaseForm />
    </div>
  );
}
