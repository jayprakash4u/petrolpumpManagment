import { BarChart3 } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { IrdMonthlySummaryView } from "@/components/ird/IrdMonthlySummaryView";

export default async function IrdMonthlySalesPage() {
  const user = await requireUser();

  if (!can(user.role, "viewReports")) {
    return (
      <Card className="mx-auto max-w-md text-center py-10">
        <h2 className="font-display text-[17px] font-semibold text-text">Access Restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          Only station owners and managers have permission to access monthly sales reports.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle
        icon={BarChart3}
        title="Monthly Sales & Tax Summary (मासिक बिक्री सारांश)"
        subtitle="Nepali Bikram Sambat fiscal year monthly fuel volume and tax breakdown"
      />
      <IrdMonthlySummaryView />
    </Card>
  );
}
