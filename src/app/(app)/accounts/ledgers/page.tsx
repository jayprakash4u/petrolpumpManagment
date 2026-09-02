import { BookOpen } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AccountSubnav } from "@/components/accounts/AccountSubnav";
import { LedgersView } from "@/components/accounts/LedgersView";

export default async function LedgersPage() {
  await requireUser();

  return (
    <div>
      <AccountSubnav />

      <Card>
        <SectionTitle
          icon={BookOpen}
          title="Chart of Accounts & General Ledger"
          subtitle="Master accounts registry, categories, running balances, and account creation"
        />
        <LedgersView />
      </Card>
    </div>
  );
}
