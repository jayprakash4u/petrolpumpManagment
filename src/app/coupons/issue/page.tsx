import { BookMarked, Info } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { CouponSubnav } from "@/components/coupons/CouponSubnav";
import { IssueCouponForm } from "@/components/coupons/IssueCouponForm";

export default async function IssueCouponsPage() {
  const user = await requireUser();

  if (!can(user.role, "manageCustomers")) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h2 className="font-display text-[17px] font-semibold text-text">Coupon Issuance Restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          Only owners and managers are authorized to issue coupon books to customer accounts.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <CouponSubnav />

      {/* Notice Banner */}
      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-border bg-surface px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-xs leading-relaxed text-text-muted">
          Coupon books represent a pre-authorized volume or value of fuel. Each book generates sequentially numbered
          tear-off sub-coupons (e.g. <strong className="text-text">BK-8801-01</strong> to{" "}
          <strong className="text-text">BK-8801-25</strong>) that can be redeemed once at the dispenser.
        </p>
      </div>

      <IssueCouponForm />
    </div>
  );
}
