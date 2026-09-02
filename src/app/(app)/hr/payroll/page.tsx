import { Wallet } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HrSubnav } from "@/components/hr/HrSubnav";
import { PayrollView } from "@/components/hr/PayrollView";

export default async function PayrollPage() {
  const user = await requireUser();

  if (!can(user.role, "manageUsers")) {
    return (
      <div>
        <HrSubnav />
        <Card className="mx-auto max-w-md text-center py-10">
          <h2 className="font-display text-[17px] font-semibold text-text">Payroll access is restricted</h2>
          <p className="mt-1.5 text-[13.5px] text-text-muted">
            Only the station owner or authorized management can view and process staff salary payrolls.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <HrSubnav />

      <Card>
        <SectionTitle
          icon={Wallet}
          title="Monthly Payroll & Salary Disbursement"
          subtitle="Salary calculation with overtime, allowances, advances, and 1-click disbursement"
        />
        <PayrollView
          currentUser={{
            id: user.id,
            name: user.name,
            role: user.role,
            username: user.username,
          }}
        />
      </Card>
    </div>
  );
}
