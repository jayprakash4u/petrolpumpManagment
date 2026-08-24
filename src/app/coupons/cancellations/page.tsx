import { TicketX, AlertTriangle, ShieldCheck, IndianRupee } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { CouponSubnav } from "@/components/coupons/CouponSubnav";
import { CancellationsTable } from "@/components/coupons/CancellationsTable";
import { MOCK_COUPON_CANCELLATIONS } from "@/lib/mock/coupons";
import { fmtRs } from "@/lib/money";

export default async function CouponCancellationsPage() {
  const user = await requireUser();

  if (!can(user.role, "manageCustomers")) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h2 className="font-display text-[17px] font-semibold text-text">Cancellations Restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          Only owners and managers are authorized to void coupons or view cancellation audits.
        </p>
      </Card>
    );
  }

  const totalVoidedLeaves = MOCK_COUPON_CANCELLATIONS.reduce((sum, c) => sum + c.leafCount, 0);
  const totalVoidedValue = MOCK_COUPON_CANCELLATIONS.reduce((sum, c) => sum + c.valueImpactNpr, 0);

  return (
    <div>
      <CouponSubnav />

      {/* Summary KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Cancellations Recorded" value={`${MOCK_COUPON_CANCELLATIONS.length} Incidents`} icon={TicketX} tone="text" />
        <StatCard label="Total Leaves Voided" value={`${totalVoidedLeaves} Leaves`} icon={AlertTriangle} tone="accent" />
        <StatCard label="Total Value Revoked" value={fmtRs(totalVoidedValue)} icon={IndianRupee} tone="text" />
        <StatCard label="Security Status" value="Pump Terminals Synced" icon={ShieldCheck} tone="success" />
      </div>

      <Card>
        <CancellationsTable cancellations={MOCK_COUPON_CANCELLATIONS} />
      </Card>
    </div>
  );
}
