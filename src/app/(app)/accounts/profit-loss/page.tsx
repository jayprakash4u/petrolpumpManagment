import { Calculator } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AccountSubnav } from "@/components/accounts/AccountSubnav";
import { FinancialStatementsView } from "@/components/accounts/FinancialStatementsView";

export default async function ProfitLossPage() {
  await requireUser();

  return (
    <div>
      <AccountSubnav />

      <Card>
        <SectionTitle
          icon={Calculator}
          title="Profit & Loss Statement (P&L)"
          subtitle="Real trading margin, COGS, operating overheads, and net station profit"
        />
        <FinancialStatementsView initialTab="PROFIT_LOSS" />
      </Card>
    </div>
  );
}
