"use client";

import { useState } from "react";
import { Edit, X, AlertTriangle, Fuel, User, CreditCard, Banknote, QrCode, Building2 } from "lucide-react";
import { clsx } from "clsx";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input, Select, Field } from "@/components/ui/Field";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { fmtRs, fmtL } from "@/lib/money";
import { editSaleAction } from "@/lib/actions/sales";
import type { CustomerOption } from "@/lib/queries/sales";

interface EditableSaleItem {
  id: string;
  receiptNo: number;
  fuel: string;
  liters: any;
  ratePerL: any;
  totalAmount: any;
  paymentMethod: string;
  vehicleNo?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  createdAt: Date | string;
  soldByName: string;
}

export function EditBillModal({
  sale,
  customers,
  onClose,
  onSaved,
}: {
  sale: EditableSaleItem;
  customers: CustomerOption[];
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [vehicleNo, setVehicleNo] = useState(sale.vehicleNo || "");
  const [buyerName, setBuyerName] = useState((sale as any).buyerName || (sale.customerId ? "" : sale.customerName || ""));
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "ONLINE" | "CARD" | "CREDIT">(
    (sale.paymentMethod as any) || "CASH"
  );
  const [customerId, setCustomerId] = useState(sale.customerId || "");
  const [paymentRef, setPaymentRef] = useState("");
  const [remarks, setRemarks] = useState((sale as any).remarks || "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const fuelLabel = FUEL_LABEL[sale.fuel as FuelId] || sale.fuel;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 3) {
      setError("Please specify a reason for this edit (at least 3 characters).");
      return;
    }

    setIsPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("saleId", sale.id);
    formData.append("vehicleNo", vehicleNo);
    formData.append("buyerName", buyerName);
    formData.append("paymentMethod", paymentMethod);
    formData.append("customerId", paymentMethod === "CREDIT" ? customerId : "");
    formData.append("paymentRef", paymentRef);
    formData.append("remarks", remarks);
    formData.append("reason", reason);

    const res = await editSaleAction({}, formData);
    setIsPending(false);

    if (res.error) {
      setError(res.error);
    } else {
      if (onSaved) onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-hi px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Edit size={18} />
            </div>
            <div>
              <h3 className="font-display text-[16px] font-bold text-text">
                Edit Bill #{sale.receiptNo} (बिल विवरण संशोधन)
              </h3>
              <p className="text-[11.5px] text-text-muted">
                Update vehicle number, customer account, payment mode & audit reason
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-white/10 hover:text-text"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Read-Only Bill Summary Box */}
          <div className="rounded-xl border border-border bg-bg p-3.5 space-y-1.5 text-[12px]">
            <div className="flex justify-between font-medium">
              <span className="text-text-muted">Fuel & Volume:</span>
              <span className="text-text">
                {fuelLabel} · {fmtL(sale.liters)} @ Rs {Number(sale.ratePerL).toFixed(2)}/L
              </span>
            </div>
            <div className="flex justify-between font-bold text-[13px] border-t border-border pt-1">
              <span className="text-accent">Billed Amount:</span>
              <span className="font-data text-accent">{fmtRs(sale.totalAmount)}</span>
            </div>
          </div>

          {/* Vehicle Number Input */}
          <Field label="Vehicle Registration Plate" htmlFor="editVehicleNo">
            <Input
              id="editVehicleNo"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              placeholder="e.g. BA 2 PA 1234 / GA 1 KHA 9021"
            />
          </Field>

          {/* Payment Method Selector */}
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-text-muted">
              Payment Mode
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  { v: "CASH", label: "Cash" },
                  { v: "ONLINE", label: "QR / Wallet" },
                  { v: "CARD", label: "Card / POS" },
                  { v: "CREDIT", label: "Credit" },
                ] as const
              ).map(({ v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPaymentMethod(v)}
                  className={clsx(
                    "rounded-lg border px-2.5 py-2 text-center text-[12px] font-medium transition-colors",
                    paymentMethod === v
                      ? "border-accent bg-accent text-[#1A1306] font-bold"
                      : "border-border bg-surface text-text hover:bg-surface-hi"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Party Name / Walk-In Customer Input */}
          {paymentMethod !== "CREDIT" && (
            <Field label="Party / Buyer Name (optional)" htmlFor="editBuyerName">
              <Input
                id="editBuyerName"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="e.g. Yani International Pvt Ltd / Walk-In Retail"
              />
            </Field>
          )}

          {/* Credit Customer Field */}
          {paymentMethod === "CREDIT" && (
            <Field label="Assign to Credit Customer" htmlFor="editCustomer">
              <Select
                id="editCustomer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              >
                <option value="">Select customer account…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.panNo ? `(PAN: ${c.panNo})` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {/* Digital Payment Ref */}
          {(paymentMethod === "ONLINE" || paymentMethod === "CARD") && (
            <Field label="Payment Ref / Trace Code (optional)" htmlFor="editPaymentRef">
              <Input
                id="editPaymentRef"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. Fonepay Ref / POS Auth Slip #"
              />
            </Field>
          )}

          {/* Shift / Billing Remarks */}
          <Field label="Billing Notes / Remarks (optional)" htmlFor="editRemarks">
            <Input
              id="editRemarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Verified odometer / Dispensed on forecourt nozzle 2"
            />
          </Field>

          {/* Mandatory Reason for Edit */}
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-text">
              Reason for Modification (Mandatory for Station Audit) <span className="text-error">*</span>
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Corrected vehicle license plate / Reassigned to corporate khata"
              required
              minLength={3}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-error/30 bg-error/10 p-2.5 text-[12px] text-error flex items-center gap-1.5">
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <GhostButton type="button" onClick={onClose} className="text-[12.5px]">
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" disabled={isPending} className="text-[12.5px]">
              {isPending ? "Saving Changes…" : "Save Changes"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
