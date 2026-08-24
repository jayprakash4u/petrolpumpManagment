"use client";

import { useState } from "react";
import { Plus, X, TicketX, AlertTriangle, ShieldCheck, Check } from "lucide-react";
import type { CouponCancellationRecord } from "@/lib/coupons";
import { fmtRs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

export function CancellationsTable({ cancellations }: { cancellations: CouponCancellationRecord[] }) {
  const [list, setList] = useState<CouponCancellationRecord[]>(cancellations);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [targetType, setTargetType] = useState<"BOOK" | "SUB_COUPON">("SUB_COUPON");
  const [code, setCode] = useState("");
  const [customerName, setCustomerName] = useState("Kathmandu Metropolitan City");
  const [reason, setReason] = useState<CouponCancellationRecord["reason"]>("Damaged / Torn");
  const [notes, setNotes] = useState("");

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: CouponCancellationRecord = {
      id: `can-${Date.now()}`,
      targetType,
      code,
      customerName,
      leafCount: targetType === "BOOK" ? 25 : 1,
      valueImpactNpr: targetType === "BOOK" ? 40000 : 3200,
      reason,
      cancelledByName: "Anita Shrestha (Manager)",
      cancelledAtBS: "2083-05-03",
      notes,
    };

    setList([newRecord, ...list]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
      setCode("");
      setNotes("");
    }, 1000);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold text-text">Coupon Cancellations & Revocations</h3>
          <p className="text-xs text-text-muted">
            Supervisor audit log for voided coupon books and individual damaged/lost tear-off leaves
          </p>
        </div>
        <PrimaryButton onClick={() => setModalOpen(true)} className="gap-1.5 text-xs bg-error/90 hover:bg-error text-white">
          <TicketX size={15} />
          Cancel Coupon / Book
        </PrimaryButton>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
              <th className="px-3 py-2.5 font-medium">CANCELLED TARGET</th>
              <th className="px-3 py-2.5 font-medium">DATE (BS)</th>
              <th className="px-3 py-2.5 font-medium">CUSTOMER ACCOUNT</th>
              <th className="px-3 py-2.5 font-medium">REASON FOR CANCELLATION</th>
              <th className="px-3 py-2.5 text-right font-medium">LEAVES VOIDED</th>
              <th className="px-3 py-2.5 text-right font-medium">VALUE REVOKED</th>
              <th className="px-3 py-2.5 font-medium">SUPERVISOR</th>
              <th className="px-3 py-2.5 text-center font-medium">AUDIT</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <TicketX size={15} className="text-error shrink-0" />
                    <div>
                      <div className="font-data text-[13px] font-bold text-error">{c.code}</div>
                      <div className="font-data text-[10.5px] text-text-muted">
                        {c.targetType === "BOOK" ? "Full Book Revocation" : "Single Sub-coupon Leaf"}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-3 py-3 font-data text-[12.5px] text-text-muted">{c.cancelledAtBS}</td>

                <td className="px-3 py-3 text-[13px] text-text font-medium">{c.customerName}</td>

                <td className="px-3 py-3">
                  <div className="text-[12.5px] font-semibold text-text">{c.reason}</div>
                  {c.notes && <div className="text-[11px] text-text-muted">{c.notes}</div>}
                </td>

                <td className="px-3 py-3 text-right font-data text-[12.5px] font-bold text-text">
                  {c.leafCount}
                </td>

                <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-error">
                  {fmtRs(c.valueImpactNpr)}
                </td>

                <td className="px-3 py-3 text-xs text-text-muted">{c.cancelledByName}</td>

                <td className="px-3 py-3 text-center">
                  <Badge tone="error">
                    <AlertTriangle size={10} />
                    VOIDED
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cancel Coupon Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-fade-in">
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-error/20 text-error">
                  <TicketX size={18} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-text">Cancel Coupon / Book</h3>
                  <p className="text-xs text-text-muted">Void coupon vouchers to prevent pump redemption</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-text-muted hover:bg-surface-hi hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            {submitted ? (
              <div className="py-8 text-center animate-fade-in">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-error/20 text-error">
                  <Check size={24} />
                </div>
                <h4 className="font-display text-base font-semibold text-text">Coupon Target Voided</h4>
                <p className="mt-1 text-xs text-text-muted">
                  {code} marked cancelled and locked out from pump terminals.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCancel} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cancellation Scope">
                    <Select
                      value={targetType}
                      onChange={(e) => setTargetType(e.target.value as "BOOK" | "SUB_COUPON")}
                    >
                      <option value="SUB_COUPON">Single Sub-coupon (e.g. BK-8801-03)</option>
                      <option value="BOOK">Entire Coupon Book (e.g. BK-8801)</option>
                    </Select>
                  </Field>
                  <Field label="Code / Serial Number">
                    <Input
                      placeholder={targetType === "BOOK" ? "e.g. BK-8801" : "e.g. BK-8801-03"}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="font-data uppercase font-bold"
                      required
                    />
                  </Field>
                </div>

                <Field label="Customer Account">
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </Field>

                <Field label="Reason for Revocation">
                  <Select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as CouponCancellationRecord["reason"])}
                  >
                    <option value="Damaged / Torn">Damaged / Torn leaf presented</option>
                    <option value="Lost by Customer">Lost / Stolen book reported</option>
                    <option value="Corporate Account Suspended">Corporate Account in Arrears / Suspended</option>
                    <option value="Printing Defect">Printing Defect / Void Serial</option>
                  </Select>
                </Field>

                <Field label="Audit Remarks">
                  <Input
                    placeholder="e.g. Driver reported leaf accidentally ripped in vehicle glovebox"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required
                  />
                </Field>

                <div className="mt-2 flex items-center justify-end gap-2.5">
                  <GhostButton type="button" onClick={() => setModalOpen(false)}>
                    Cancel
                  </GhostButton>
                  <button
                    type="submit"
                    className="font-display inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[9px] bg-error px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-error/90"
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
