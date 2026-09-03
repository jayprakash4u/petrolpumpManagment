import { FileBarChart2 } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { ExpensesTable } from "@/components/purchases/ExpensesTable";
import { MOCK_STATION_EXPENSES } from "@/lib/mock/purchases";

export default async function ExpensesPage() {
  await requireUser();

  return (
    <div>
      <PurchaseSubnav />

      <Card>
        <SectionTitle
          icon={FileBarChart2}
          title="Expense Register"
          subtitle="Every expense bill recorded, with its subtotal, VAT, and landed total — by fiscal year or date range"
        />
        <ExpensesTable expenses={MOCK_STATION_EXPENSES} />
      </Card>
    </div>
  );
}
