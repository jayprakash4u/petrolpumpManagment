import { Boxes } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { IrdQuantitativeStockView } from "@/components/ird/IrdQuantitativeStockView";

export default async function IrdStockPage() {
  const user = await requireUser();

  if (!can(user.role, "viewReports")) {
    return (
      <Card className="mx-auto max-w-md text-center py-10">
        <h2 className="font-display text-[17px] font-semibold text-text">Access Restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          Only station owners and managers have permission to access statutory quantitative stock statements.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle
        icon={Boxes}
        title="Quantitative Stock Register (मात्रात्मक मौज्दात विवरण)"
        subtitle="Statutory fuel inventory reconciliation between opening balance, receipts, sales, and closing dips"
      />
      <IrdQuantitativeStockView />
    </Card>
  );
}
