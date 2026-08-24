import { Banknote } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AccountSubnav } from "@/components/accounts/AccountSubnav";
import { VouchersView } from "@/components/accounts/VouchersView";

export default async function ReceiptsPage() {
  const user = await requireUser();

  return (
    <div>
      <AccountSubnav />

      <Card>
        <SectionTitle
          icon={Banknote}
          title="Receipt Vouchers (Money In)"
          subtitle="Record customer payments, debtor collections, direct cash inflows, and print receipt slips"
        />
        <VouchersView voucherType="RECEIPT" userName={user.name} />
      </Card>
    </div>
  );
}
