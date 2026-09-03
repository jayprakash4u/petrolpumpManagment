import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { ExpensesTable } from "@/components/purchases/ExpensesTable";
import { MOCK_STATION_EXPENSES } from "@/lib/mock/purchases";

export default async function ExpensesPage() {
  await requireUser();

  return (
    <div>
      <PurchaseSubnav />

      <Card>
        <ExpensesTable expenses={MOCK_STATION_EXPENSES} />
      </Card>
    </div>
  );
}
