import { FileBarChart2 } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { PurchaseReportView } from "@/components/purchases/PurchaseReportView";

export default async function PurchaseReportPage() {
  const user = await requireUser();

  if (!can(user.role, "viewReports")) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h2 className="font-display text-[17px] font-semibold text-text">Purchase report is restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          Only an owner or manager can view overall procurement reports and audit registers.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <PurchaseSubnav />

      <Card>
        <SectionTitle
          icon={FileBarChart2}
          title="Procurement & Purchase Audit Register"
          subtitle="Consolidated analysis by supplier, fuel type, lubricant stock, and operational expenses"
        />
        <PurchaseReportView />
      </Card>
    </div>
  );
}
