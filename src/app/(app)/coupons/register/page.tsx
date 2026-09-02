import { ListOrdered, BookMarked, TicketCheck, IndianRupee, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { CouponSubnav } from "@/components/coupons/CouponSubnav";
import { CouponRegisterTable } from "@/components/coupons/CouponRegisterTable";
import { MOCK_COUPON_BOOKS, MOCK_SUB_COUPONS, MOCK_COUPON_TOTALS } from "@/lib/mock/coupons";
import { fmtRs } from "@/lib/money";

export default async function CouponRegisterPage() {
  await requireUser();

  return (
    <div>
      <CouponSubnav />

      {/* Summary KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Books Issued" value={`${MOCK_COUPON_BOOKS.length} Books`} icon={BookMarked} tone="text" />
        <StatCard
          label="Total Leaves Issued"
          value={`${MOCK_COUPON_TOTALS.totalSubCouponsIssuedCount} Leaves`}
          icon={ListOrdered}
          tone="text"
        />
        <StatCard
          label="Redeemed to Date"
          value={`${MOCK_COUPON_TOTALS.totalSubCouponsRedeemedCount} Leaves`}
          icon={TicketCheck}
          tone="success"
        />
        <StatCard
          label="Unredeemed Value"
          value={fmtRs(MOCK_COUPON_TOTALS.totalUnredeemedLiabilityNpr)}
          icon={IndianRupee}
          tone="accent"
        />
      </div>

      <Card>
        <CouponRegisterTable books={MOCK_COUPON_BOOKS} subCoupons={MOCK_SUB_COUPONS} />
      </Card>
    </div>
  );
}
