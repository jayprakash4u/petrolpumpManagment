import { ArrowLeftRight } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AccountSubnav } from "@/components/accounts/AccountSubnav";
import { VouchersView } from "@/components/accounts/VouchersView";

export default async function ContraPage() {
  const user = await requireUser();

  return (
    <div>
      <AccountSubnav />

      <Card>
        <SectionTitle
          icon={ArrowLeftRight}
          title="Contra Entries (Cash ↔ Bank Transfers)"
          subtitle="Record internal movements between station cash safe, tills, and bank accounts in one screen"
        />
        <VouchersView voucherType="CONTRA" userName={user.name} />
      </Card>
    </div>
  );
}
