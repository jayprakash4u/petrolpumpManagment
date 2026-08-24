import { Coins } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AccountSubnav } from "@/components/accounts/AccountSubnav";
import { CashConfirmationView } from "@/components/accounts/CashConfirmationView";

export default async function CashConfirmationPage() {
  const user = await requireUser();

  return (
    <div>
      <AccountSubnav />

      <Card>
        <SectionTitle
          icon={Coins}
          title="Day-End Cash & Deposit Confirmation"
          subtitle="Reconcile daily cash counted vs expected takings and record bank branch deposits"
        />
        <CashConfirmationView userName={user.name} />
      </Card>
    </div>
  );
}
