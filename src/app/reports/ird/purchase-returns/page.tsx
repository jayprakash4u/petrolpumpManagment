import { Undo2 } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { IrdReturnsView } from "@/components/ird/IrdReturnsView";

export default async function IrdPurchaseReturnsPage() {
  const user = await requireUser();

  if (!can(user.role, "viewReports")) {
    return (
      <Card className="mx-auto max-w-md text-center py-10">
        <h2 className="font-display text-[17px] font-semibold text-text">Access Restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          Only station owners and managers have permission to access statutory IRD registers.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle
        icon={Undo2}
        title="Purchase Return Register (खरिद फिर्ता खाता)"
        subtitle="Debit notes raised against NOC / lubricant suppliers for damaged stock and transit returns"
      />
      <IrdReturnsView defaultTab="PURCHASE_RETURN" />
    </Card>
  );
}
