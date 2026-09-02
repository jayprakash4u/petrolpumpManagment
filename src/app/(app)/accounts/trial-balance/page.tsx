import { Scale } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AccountSubnav } from "@/components/accounts/AccountSubnav";
import { FinancialStatementsView } from "@/components/accounts/FinancialStatementsView";

export default async function TrialBalancePage() {
  await requireUser();

  return (
    <div>
      <AccountSubnav />

      <Card>
        <SectionTitle
          icon={Scale}
          title="Trial Balance Parity Statement"
          subtitle="Double-entry audit parity checking that total debits match total credits"
        />
        <FinancialStatementsView initialTab="TRIAL_BALANCE" />
      </Card>
    </div>
  );
}
