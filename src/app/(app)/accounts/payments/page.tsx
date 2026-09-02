import { FileText } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AccountSubnav } from "@/components/accounts/AccountSubnav";
import { VouchersView } from "@/components/accounts/VouchersView";

export default async function PaymentsPage() {
  const user = await requireUser();

  return (
    <div>
      <AccountSubnav />

      <Card>
        <SectionTitle
          icon={FileText}
          title="Payment Vouchers (Money Out)"
          subtitle="Record operating expenses, supplier payments, tanker decanting dues, and cash disbursements"
        />
        <VouchersView voucherType="PAYMENT" userName={user.name} />
      </Card>
    </div>
  );
}
