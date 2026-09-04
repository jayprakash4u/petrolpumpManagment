import { Wallet } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { AddExpenseForm } from "@/components/purchases/AddExpenseForm";

export default async function NewExpensePage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-4xl">
      <PurchaseSubnav />

      <Card>
        <SectionTitle icon={Wallet} title="Add Expense" subtitle="Log a petty cash, utility, or maintenance disbursement" />
        <AddExpenseForm />
      </Card>
    </div>
  );
}
