import { FileCheck2 } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { IrdVatReturnView } from "@/components/ird/IrdVatReturnView";

export default async function IrdVatReturnPage() {
  const user = await requireUser();

  if (!can(user.role, "viewReports")) {
    return (
      <Card className="mx-auto max-w-md text-center py-10">
        <h2 className="font-display text-[17px] font-semibold text-text">Access Restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          Only station owners and managers have permission to access statutory VAT returns.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle
        icon={FileCheck2}
        title="Periodic VAT Return (मूल्य अभिवृद्धि कर विवरण — अनुसूची १०)"
        subtitle="Periodic tax declaration filed with the Inland Revenue Department (IRD)"
      />
      <IrdVatReturnView />
    </Card>
  );
}
