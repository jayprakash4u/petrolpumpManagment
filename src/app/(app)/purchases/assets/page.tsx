import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { FixedAssetsTable } from "@/components/purchases/FixedAssetsTable";
import { MOCK_FIXED_ASSETS } from "@/lib/mock/purchases";

export default async function FixedAssetsPage() {
  await requireUser();

  return (
    <div className="space-y-4">
      <PurchaseSubnav />

      <Card>
        <FixedAssetsTable assets={MOCK_FIXED_ASSETS} />
      </Card>
    </div>
  );
}
