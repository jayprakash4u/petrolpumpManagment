import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { SuppliersTable } from "@/components/purchases/SuppliersTable";
import { MOCK_SUPPLIERS } from "@/lib/mock/purchases";

export default async function SuppliersPage() {
  await requireUser();

  return (
    <div>
      <PurchaseSubnav />

      <Card>
        <SuppliersTable suppliers={MOCK_SUPPLIERS} />
      </Card>
    </div>
  );
}
