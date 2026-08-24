import { NotebookPen } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AccountSubnav } from "@/components/accounts/AccountSubnav";
import { VouchersView } from "@/components/accounts/VouchersView";

export default async function JournalPage() {
  const user = await requireUser();

  return (
    <div>
      <AccountSubnav />

      <Card>
        <SectionTitle
          icon={NotebookPen}
          title="Journal Vouchers (Adjustment Entries)"
          subtitle="Manual double-entry general adjustments, depreciation, and accrued accounts"
        />
        <VouchersView voucherType="JOURNAL" userName={user.name} />
      </Card>
    </div>
  );
}
