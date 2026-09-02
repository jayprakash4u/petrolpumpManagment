import { BookText } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { IrdSalesRegisterView } from "@/components/ird/IrdSalesRegisterView";

export default async function IrdSalesPage() {
  const user = await requireUser();

  if (!can(user.role, "viewReports")) {
    return (
      <Card className="mx-auto max-w-md text-center py-10">
        <h2 className="font-display text-[17px] font-semibold text-text">Access Restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          Only station owners and managers have permission to access statutory IRD VAT registers.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle
        icon={BookText}
        title="Sales Book / Register (बिक्री खाता — अनुसूची ५)"
        subtitle="Statutory VAT sales register under Rule 23(1) of VAT Rules, 2053"
      />
      <IrdSalesRegisterView />
    </Card>
  );
}
