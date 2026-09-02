import { PiggyBank } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AccountSubnav } from "@/components/accounts/AccountSubnav";
import { OpeningBalancesView } from "@/components/accounts/OpeningBalancesView";

export default async function OpeningBalancesPage() {
  await requireUser();

  return (
    <div>
      <AccountSubnav />

      <Card>
        <SectionTitle
          icon={PiggyBank}
          title="Opening Balances Configuration"
          subtitle="Configure baseline ledger balances when starting books mid-fiscal year"
        />
        <OpeningBalancesView />
      </Card>
    </div>
  );
}
