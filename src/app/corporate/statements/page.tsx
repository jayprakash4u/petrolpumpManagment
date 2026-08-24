import { FileBarChart2 } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CorporateSubnav } from "@/components/corporate/CorporateSubnav";
import { CorporateStatementsView } from "@/components/corporate/CorporateStatementsView";

export default async function CorporateStatementsPage() {
  const user = await requireUser();

  if (!can(user.role, "manageCustomers")) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h2 className="font-display text-[17px] font-semibold text-text">Access Restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          Only owners and managers are authorized to view and generate corporate billing statements.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <CorporateSubnav />

      <Card>
        <SectionTitle
          icon={FileBarChart2}
          title="Corporate Monthly Billing Statements"
          subtitle="Tax-compliant monthly billing invoices and vehicle-level dispense audit logs (Bikram Sambat)"
        />
        <CorporateStatementsView />
      </Card>
    </div>
  );
}
