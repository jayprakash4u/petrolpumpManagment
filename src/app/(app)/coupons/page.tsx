import Link from "next/link";
import {
  Ticket,
  BookMarked,
  TicketCheck,
  ListOrdered,
  TicketX,
  IndianRupee,
  Fuel,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { CouponSubnav } from "@/components/coupons/CouponSubnav";
import {
  MOCK_COUPON_TOTALS,
  MOCK_COUPON_BOOKS,
  MOCK_COUPON_REDEMPTIONS,
} from "@/lib/mock/coupons";
import { fmtRs, fmtL } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";

export default async function CouponOverviewPage() {
  await requireUser();

  return (
    <div>
      <CouponSubnav />

      {/* Summary KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Coupon Books"
          value={`${MOCK_COUPON_TOTALS.totalActiveBooksCount} Books`}
          icon={BookMarked}
          tone="text"
        />
        <StatCard
          label="Redeemed (This Month)"
          value={fmtRs(MOCK_COUPON_TOTALS.totalRedeemedThisMonthNpr)}
          icon={TrendingUp}
          tone="accent"
        />
        <StatCard
          label="Unredeemed Fuel Liability"
          value={fmtRs(MOCK_COUPON_TOTALS.totalUnredeemedLiabilityNpr)}
          icon={IndianRupee}
          tone="text"
        />
        <StatCard
          label="Sub-Coupons Issued"
          value={`${MOCK_COUPON_TOTALS.totalSubCouponsIssuedCount} Leaves`}
          icon={Ticket}
          tone="success"
        />
      </div>

      {/* Fast Action Cards Grid */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/coupons/issue"
          className="group rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-accent/60 hover:bg-surface-hi"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-black">
              <BookMarked size={18} />
            </div>
            <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-text group-hover:text-accent">Issue Coupons</h3>
          <p className="mt-1 text-xs text-text-muted">
            Issue numbered coupon books with sequential tear-off sub-coupons to corporate fleet accounts.
          </p>
          <div className="mt-3 font-data text-[11px] font-semibold text-accent">
            Volume & Amount Denominations
          </div>
        </Link>

        <Link
          href="/coupons/redeem"
          className="group rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-accent/60 hover:bg-surface-hi"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-black">
              <TicketCheck size={18} />
            </div>
            <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-text group-hover:text-accent">Redeem Coupon</h3>
          <p className="mt-1 text-xs text-text-muted">
            Attendant pump terminal to scan or enter sub-coupon serials, validate status, and dispense fuel.
          </p>
          <div className="mt-3 font-data text-[11px] font-semibold text-success">
            Instant Duplicate Protection
          </div>
        </Link>

        <Link
          href="/coupons/register"
          className="group rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-accent/60 hover:bg-surface-hi"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-black">
              <ListOrdered size={18} />
            </div>
            <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-text group-hover:text-accent">Coupon Register</h3>
          <p className="mt-1 text-xs text-text-muted">
            Consolidated directory of all issued books and individual leaf sub-coupons with status filters.
          </p>
          <div className="mt-3 font-data text-[11px] font-semibold text-text">
            Billed & Unbilled Tracking
          </div>
        </Link>

        <Link
          href="/coupons/cancellations"
          className="group rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-accent/60 hover:bg-surface-hi"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-black">
              <TicketX size={18} />
            </div>
            <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-text group-hover:text-accent">Cancellations</h3>
          <p className="mt-1 text-xs text-text-muted">
            Revoke damaged, lost, or suspended coupons with mandatory reason logging and supervisor sign-off.
          </p>
          <div className="mt-3 font-data text-[11px] font-semibold text-text-muted">
            Full Audit Trail
          </div>
        </Link>
      </div>

      {/* Two columns: Active Books & Recent Redemptions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle
              icon={BookMarked}
              title="Active Coupon Books"
              subtitle="Corporate accounts with outstanding leaves"
            />
            <Link href="/coupons/register" className="text-xs font-semibold text-accent hover:underline">
              View Register →
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {MOCK_COUPON_BOOKS.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-border bg-bg p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-data text-[13px] font-bold text-accent">{b.bookNumber}</span>
                    <span className="font-display text-[13px] font-semibold text-text truncate max-w-[220px]">
                      {b.customerName.split("(")[0]}
                    </span>
                  </div>
                  <div className="font-data text-[11px] text-text-muted">
                    {b.activeLeaves} / {b.totalLeaves} leaves active · Valid: {b.expiryDateBS}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-data text-[13px] font-bold text-text">{fmtRs(b.totalBookValueNpr)}</div>
                  <Badge tone={b.status === "ACTIVE" ? "success" : "muted"}>{b.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle
              icon={TicketCheck}
              title="Recent Pump Redemptions"
              subtitle="Vouchers validated at dispenser"
            />
            <Link href="/coupons/redeem" className="text-xs font-semibold text-accent hover:underline">
              Redeem Terminal →
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {MOCK_COUPON_REDEMPTIONS.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-bg p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-data text-[13px] font-bold text-accent">{r.couponCode}</span>
                    <span className="font-display text-[12.5px] font-medium text-text">{r.customerName.split(" ")[0]} {r.customerName.split(" ")[1]}</span>
                  </div>
                  <div className="font-data text-[11px] text-text-muted">
                    Vehicle: <span className="font-semibold text-text">{r.vehicleNo}</span> · {r.redeemedAtBS} {r.time}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-data text-[13px] font-bold text-text">{fmtL(r.volumeLitres)}</div>
                  <div className="font-data text-[11px] text-accent">Receipt #{r.receiptNo}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
