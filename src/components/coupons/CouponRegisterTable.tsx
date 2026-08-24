"use client";

import { useState } from "react";
import { BookMarked, Ticket, Filter, CheckCircle2, AlertTriangle, XCircle, Search, Layers } from "lucide-react";
import type { CouponBook, SubCoupon } from "@/lib/coupons";
import { FUEL_LABEL } from "@/lib/fuel";
import { fmtL, fmtRs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { Select, Input } from "@/components/ui/Field";

export function CouponRegisterTable({
  books,
  subCoupons,
}: {
  books: CouponBook[];
  subCoupons: SubCoupon[];
}) {
  const [viewMode, setViewMode] = useState<"books" | "leaves">("books");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filteredBooks = books.filter((b) => {
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (search && !b.bookNumber.toLowerCase().includes(search.toLowerCase()) && !b.customerName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredLeaves = subCoupons.filter((s) => {
    if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
    if (
      search &&
      !s.couponCode.toLowerCase().includes(search.toLowerCase()) &&
      !s.customerName.toLowerCase().includes(search.toLowerCase()) &&
      !(s.redeemedVehicleNo && s.redeemedVehicleNo.toLowerCase().includes(search.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  return (
    <div>
      {/* Mode Switch & Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center rounded-lg border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setViewMode("books")}
              className={`cursor-pointer rounded-md px-3 py-1 font-display text-xs font-semibold transition-colors ${
                viewMode === "books"
                  ? "bg-accent/15 text-accent"
                  : "text-text-muted hover:text-text"
              }`}
            >
              1. Coupon Books View ({books.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode("leaves")}
              className={`cursor-pointer rounded-md px-3 py-1 font-display text-xs font-semibold transition-colors ${
                viewMode === "leaves"
                  ? "bg-accent/15 text-accent"
                  : "text-text-muted hover:text-text"
              }`}
            >
              2. Individual Sub-Coupons ({subCoupons.length})
            </button>
          </div>

          <div className="relative w-[200px]">
            <Search size={13} className="absolute top-2.5 left-3 text-text-muted" />
            <Input
              placeholder="Search code / customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="py-1.5 pr-3 pl-8 text-xs"
            />
          </div>

          <div className="w-[140px]">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="py-1.5 text-xs">
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active / Unused</option>
              <option value="REDEEMED">Redeemed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Books View Table */}
      {viewMode === "books" ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
                <th className="px-3 py-2.5 font-medium">BOOK SERIAL</th>
                <th className="px-3 py-2.5 font-medium">CUSTOMER ACCOUNT</th>
                <th className="px-3 py-2.5 font-medium">FUEL & DENOMINATION</th>
                <th className="px-3 py-2.5 text-right font-medium">LEAVES ISSUED</th>
                <th className="px-3 py-2.5 text-right font-medium">ACTIVE (UNUSED)</th>
                <th className="px-3 py-2.5 text-right font-medium">REDEEMED</th>
                <th className="px-3 py-2.5 text-right font-medium">TOTAL VALUE</th>
                <th className="px-3 py-2.5 font-medium">EXPIRY (BS)</th>
                <th className="px-3 py-2.5 text-center font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((b) => (
                <tr key={b.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <BookMarked size={15} className="text-accent shrink-0" />
                      <span className="font-data text-[13px] font-bold text-accent">{b.bookNumber}</span>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="font-display text-[13px] font-semibold text-text">{b.customerName}</div>
                    <div className="font-data text-[11px] text-text-muted">
                      {b.billingType === "CREDIT_BILLED" ? "Credit (Billed on use)" : "Pre-paid upfront"}
                    </div>
                  </td>

                  <td className="px-3 py-3 text-xs">
                    <div className="font-medium text-text">
                      {b.fuel === "ANY" ? "All Fuels" : FUEL_LABEL[b.fuel]}
                    </div>
                    <div className="font-data text-[11.5px] font-semibold text-accent">
                      {b.denominationType === "VOLUME" ? fmtL(b.denominationValue) : fmtRs(b.denominationValue)} per leaf
                    </div>
                  </td>

                  <td className="px-3 py-3 text-right font-data text-[12.5px] text-text">{b.totalLeaves}</td>

                  <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-success">
                    {b.activeLeaves}
                  </td>

                  <td className="px-3 py-3 text-right font-data text-[12.5px] text-text-muted">
                    {b.redeemedLeaves}
                  </td>

                  <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-text">
                    {fmtRs(b.totalBookValueNpr)}
                  </td>

                  <td className="px-3 py-3 font-data text-[12px] text-text-muted">{b.expiryDateBS}</td>

                  <td className="px-3 py-3 text-center">
                    {b.status === "ACTIVE" ? (
                      <Badge tone="success">
                        <CheckCircle2 size={10} />
                        ACTIVE
                      </Badge>
                    ) : b.status === "EXHAUSTED" ? (
                      <Badge tone="muted">EXHAUSTED</Badge>
                    ) : (
                      <Badge tone="error">CANCELLED</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Sub-Coupons Leaf Table */
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
                <th className="px-3 py-2.5 font-medium">SUB-COUPON CODE</th>
                <th className="px-3 py-2.5 font-medium">PARENT BOOK</th>
                <th className="px-3 py-2.5 font-medium">CUSTOMER ACCOUNT</th>
                <th className="px-3 py-2.5 font-medium">FACE VALUE</th>
                <th className="px-3 py-2.5 text-center font-medium">STATUS</th>
                <th className="px-3 py-2.5 font-medium">REDEMPTION DETAILS</th>
                <th className="px-3 py-2.5 font-medium">VEHICLE PLATE</th>
                <th className="px-3 py-2.5 text-right font-medium">SALE RECEIPT</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map((s) => (
                <tr key={s.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                  <td className="px-3 py-3 font-data text-[13px] font-bold text-accent">{s.couponCode}</td>

                  <td className="px-3 py-3 font-data text-xs text-text-muted">{s.bookNumber} (Leaf #{s.leafNumber})</td>

                  <td className="px-3 py-3 text-xs text-text font-medium">{s.customerName}</td>

                  <td className="px-3 py-3 font-data text-xs font-semibold text-text">
                    {s.denominationType === "VOLUME" ? fmtL(s.denominationValue) : fmtRs(s.denominationValue)} ({s.fuel})
                  </td>

                  <td className="px-3 py-3 text-center">
                    {s.status === "ACTIVE" ? (
                      <Badge tone="success">ACTIVE</Badge>
                    ) : s.status === "REDEEMED" ? (
                      <Badge tone="muted">REDEEMED</Badge>
                    ) : (
                      <Badge tone="error">CANCELLED</Badge>
                    )}
                  </td>

                  <td className="px-3 py-3 text-xs text-text-muted font-data">
                    {s.redeemedAtBS ? `${s.redeemedAtBS} · ${s.redeemedTime || ""}` : "—"}
                  </td>

                  <td className="px-3 py-3 font-data text-xs font-semibold text-accent">
                    {s.redeemedVehicleNo || "—"}
                  </td>

                  <td className="px-3 py-3 text-right font-data text-xs font-bold text-text">
                    {s.redeemedReceiptNo ? `#${s.redeemedReceiptNo}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
