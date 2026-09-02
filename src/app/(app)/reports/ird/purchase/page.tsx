import { FileSpreadsheet } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { IrdPurchaseRegisterView } from "@/components/ird/IrdPurchaseRegisterView";

export default async function IrdPurchasePage() {
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
        icon={FileSpreadsheet}
        title="Purchase Book / Register (खरिद खाता — अनुसूची ४)"
        subtitle="Statutory VAT purchase register under Rule 23(1) of VAT Rules, 2053"
      />
      <IrdPurchaseRegisterView />
    </Card>
  );
}
