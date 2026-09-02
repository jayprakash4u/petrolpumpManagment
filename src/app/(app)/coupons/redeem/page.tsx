import { TicketCheck, Zap, Info } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { CouponSubnav } from "@/components/coupons/CouponSubnav";
import { RedeemCouponCard } from "@/components/coupons/RedeemCouponCard";

export default async function RedeemCouponPage() {
  const user = await requireUser();

  if (!can(user.role, "recordSale")) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h2 className="font-display text-[17px] font-semibold text-text">Redemption Restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          Your role does not include dispensing fuel or redeeming coupons.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <CouponSubnav />

      {/* Operational Notice */}
      <div className="mx-auto mb-5 max-w-2xl flex items-start gap-2.5 rounded-xl border border-border bg-surface px-4 py-3">
        <Zap size={16} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-xs leading-relaxed text-text-muted">
          Pump attendants must validate the sub-coupon code prior to fueling. The system checks against lost,
          cancelled, or previously redeemed vouchers to prevent duplicate claims.
        </p>
      </div>

      <RedeemCouponCard />
    </div>
  );
}
