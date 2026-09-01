"use client";

import { useState } from "react";
import {
  Printer,
  Download,
  X,
  Undo2,
  CheckCircle2,
  AlertTriangle,
  User,
  Car,
  Fuel,
  CreditCard,
  Banknote,
  QrCode,
  Calendar,
  Clock,
  Building2,
  Edit,
  Save,
} from "lucide-react";
import { clsx } from "clsx";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select, Field } from "@/components/ui/Field";
import { fmtRs, fmtL, fmtRate } from "@/lib/money";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { voidSaleAction, editSaleAction, type ReceiptDTO } from "@/lib/actions/sales";
import type { SerializedSale, CustomerOption } from "@/lib/queries/sales";
import { TaxInvoice } from "./TaxInvoice";

/** Reconstruct the same ReceiptDTO shape TaxInvoice renders everywhere else,
 *  from an already-recorded sale. */
function toReceiptDTO(sale: SerializedSale, stationName: string): ReceiptDTO {
  const total = sale.totalAmount;
  const taxable = total / 1.13;
  const vat = total - taxable;

  return {
    receiptNo: sale.receiptNo,
    billNumber: sale.billNumber,
    stationName,
    fuelLabel: FUEL_LABEL[sale.fuel as FuelId] || sale.fuel,
    liters: fmtL(sale.liters),
    rate: fmtRate(sale.ratePerL),
    total: fmtRs(total),
    subtotal: fmtRs(taxable),
    taxableAmount: fmtRs(taxable),
    vatAmount: fmtRs(vat),
    paymentMethod: sale.paymentMethod as ReceiptDTO["paymentMethod"],
    customerName: sale.customerName ?? null,
    vehicleNo: sale.vehicleNo ?? null,
    changeDue: null,
    soldBy: sale.soldByName,
    at: `${sale.formattedDateBS} ${sale.formattedTime}`,
    dateBS: sale.formattedDateBS,
  };
}

import type { StationBusinessProfile, StationInvoiceSettings } from "@/lib/invoice-settings";

export function BillDetailsModal({
  sale: initialSale,
  canVoid,
  customers = [],
  stationName,
  business,
  settings,
  onClose,
  onSaleVoided,
  onSaleEdited,
}: {
  sale: SerializedSale;
  canVoid: boolean;
  customers?: CustomerOption[];
  stationName: string;
  business?: Partial<StationBusinessProfile> | null;
  settings?: Partial<StationInvoiceSettings> | null;
  onClose: () => void;
  onSaleVoided?: (saleId: string) => void;
  onSaleEdited?: (updatedSale: SerializedSale) => void;
}) {
  const [sale, setSale] = useState<SerializedSale>(initialSale);
  const [isEditing, setIsEditing] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);

  // Edit form state
  const [editVehicleNo, setEditVehicleNo] = useState(sale.vehicleNo || "");
  const [editPaymentMethod, setEditPaymentMethod] = useState<"CASH" | "ONLINE" | "CARD" | "CREDIT">(
    (sale.paymentMethod as any) || "CASH"
  );
  const [editCustomerId, setEditCustomerId] = useState(sale.customerId || "");
  const [editPaymentRef, setEditPaymentRef] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditPending, setIsEditPending] = useState(false);

  // Void form state
  const [voidReason, setVoidReason] = useState("");
  const [voidError, setVoidError] = useState<string | null>(null);
  const [isVoidPending, setIsVoidPending] = useState(false);

  const fuelLabel = FUEL_LABEL[sale.fuel as FuelId] || sale.fuel;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSlip = () => {
    const textContent = `
========================================
   ${stationName}
========================================
INVOICE / RECEIPT: ${sale.billNumber}
Date & Time: ${new Date(sale.createdAt).toLocaleString()}
Attendant: ${sale.soldByName}
----------------------------------------
Vehicle No: ${sale.vehicleNo || "N/A"}
Customer: ${sale.customerName || "Retail Walk-In"}
Fuel Product: ${fuelLabel}
Unit Rate: Rs ${sale.ratePerL.toFixed(2)}/L
Volume Dispensed: ${fmtL(sale.liters)}
----------------------------------------
TOTAL AMOUNT: ${fmtRs(sale.totalAmount)}
Payment Mode: ${sale.paymentMethod}
Status: ${sale.voided ? `VOIDED RETURN (${sale.voidReason})` : "PAID / CLEARED"}
========================================
      Thank you for fueling with us!
    `;
    const element = document.createElement("a");
    const file = new Blob([textContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${sale.billNumber}_invoice.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleConfirmVoid = async () => {
    if (voidReason.trim().length < 3) {
      setVoidError("Please provide a valid reason (at least 3 characters).");
      return;
    }
    setIsVoidPending(true);
    setVoidError(null);

    const formData = new FormData();
    formData.append("saleId", sale.id);
    formData.append("reason", voidReason);

    const result = await voidSaleAction({}, formData);
    setIsVoidPending(false);

    if (result.error) {
      setVoidError(result.error);
    } else {
      setSale((prev) => ({
        ...prev,
        voided: true,
        voidReason: voidReason,
        voidedAt: new Date().toISOString(),
      }));
      if (onSaleVoided) onSaleVoided(sale.id);
      setIsVoiding(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editReason.trim().length < 3) {
      setEditError("Please provide a reason for editing this bill (at least 3 characters).");
      return;
    }

    setIsEditPending(true);
    setEditError(null);

    const formData = new FormData();
    formData.append("saleId", sale.id);
    formData.append("vehicleNo", editVehicleNo);
    formData.append("paymentMethod", editPaymentMethod);
    formData.append("customerId", editPaymentMethod === "CREDIT" ? editCustomerId : "");
    formData.append("paymentRef", editPaymentRef);
    formData.append("reason", editReason);

    const result = await editSaleAction({}, formData);
    setIsEditPending(false);

    if (result.error) {
      setEditError(result.error);
    } else {
      const selectedCust = customers.find((c) => c.id === editCustomerId);
      const updated: SerializedSale = {
        ...sale,
        vehicleNo: editVehicleNo ? editVehicleNo.trim().toUpperCase() : null,
        paymentMethod: editPaymentMethod,
        customerId: editPaymentMethod === "CREDIT" ? editCustomerId : null,
        customerName: editPaymentMethod === "CREDIT" ? selectedCust?.name || "Credit Customer" : null,
      };
      setSale(updated);
      setIsEditing(false);
      if (onSaleEdited) onSaleEdited(updated);
    }
  };

  const paper = settings?.paperSize || "80MM";
  const modalMaxWidth =
    paper === "A4" ? "max-w-3xl" : paper === "A5" ? "max-w-xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div
        className={clsx(
          "relative w-full rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden",
          modalMaxWidth
        )}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-hi px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Fuel size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-[16px] font-bold text-text">
                  Bill {sale.billNumber}
                </h3>
                {sale.voided ? (
                  <Badge tone="error">VOIDED RETURN</Badge>
                ) : (
                  <Badge tone="success">COMPLETED</Badge>
                )}
              </div>
              <div className="text-[11.5px] text-text-muted">
                Receipt #{sale.receiptNo} · {sale.formattedTime}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-white/10 hover:text-text cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Details / Edit / Void */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {isEditing ? (
            /* EDIT FORM VIEW */
            <form onSubmit={handleSaveEdit} className="space-y-4 animate-fade-in">
              <div className="rounded-xl border border-accent/40 bg-accent/5 p-3.5 space-y-1 text-[12px]">
                <div className="font-semibold text-text flex items-center gap-1.5 text-[13px]">
                  <Edit size={14} className="text-accent" /> Edit Bill #{sale.receiptNo}
                </div>
                <div className="text-text-muted">
                  {fuelLabel} · {fmtL(sale.liters)} ·{" "}
                  <strong className="text-accent font-data">{fmtRs(sale.totalAmount)}</strong>
                </div>
              </div>

              {/* Vehicle Registration Plate */}
              <Field label="Vehicle Registration Plate" htmlFor="modalVehicleNo">
                <Input
                  id="modalVehicleNo"
                  value={editVehicleNo}
                  onChange={(e) => setEditVehicleNo(e.target.value)}
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
                      onClick={() => setEditPaymentMethod(v)}
                      className={clsx(
                        "rounded-lg border px-2.5 py-2 text-center text-[12px] font-medium transition-colors cursor-pointer",
                        editPaymentMethod === v
                          ? "border-accent bg-accent text-[#1A1306] font-bold"
                          : "border-border bg-surface text-text hover:bg-surface-hi"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Credit Customer Selector */}
              {editPaymentMethod === "CREDIT" && (
                <Field label="Assign to Customer Account" htmlFor="modalCustomer">
                  <Select
                    id="modalCustomer"
                    value={editCustomerId}
                    onChange={(e) => setEditCustomerId(e.target.value)}
                    required
                  >
                    <option value="">Select customer…</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              {/* Payment Reference */}
              {(editPaymentMethod === "ONLINE" || editPaymentMethod === "CARD") && (
                <Field label="Payment Ref / Trace Code (optional)" htmlFor="modalPayRef">
                  <Input
                    id="modalPayRef"
                    value={editPaymentRef}
                    onChange={(e) => setEditPaymentRef(e.target.value)}
                    placeholder="e.g. Fonepay Trace / Slip No"
                  />
                </Field>
              )}

              {/* Reason for Edit */}
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-text">
                  Reason for Modification (Mandatory for Station Audit) <span className="text-error">*</span>
                </label>
                <Input
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. Corrected vehicle plate / Reassigned customer account"
                  required
                  minLength={3}
                  autoFocus
                />
              </div>

              {editError && (
                <div className="rounded-lg border border-error/30 bg-error/10 p-2.5 text-[12px] text-error flex items-center gap-1.5">
                  <AlertTriangle size={15} /> {editError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                <GhostButton type="button" onClick={() => setIsEditing(false)} className="text-[12px]">
                  Cancel
                </GhostButton>
                <PrimaryButton type="submit" disabled={isEditPending} className="text-[12px]">
                  <Save size={13} />
                  {isEditPending ? "Saving..." : "Save Changes"}
                </PrimaryButton>
              </div>
            </form>
          ) : (
            /* STANDARD INVOICE DETAILS VIEW */
            <>
              {/* Printable Ticket Box */}
              <TaxInvoice
                receipt={toReceiptDTO(sale, stationName)}
                business={business || { name: stationName }}
                settings={settings}
              />

              {sale.voided && (
                <div className="rounded-lg border border-error/30 bg-error/10 p-2.5 text-[11.5px] text-error">
                  <strong>Void Reason:</strong> {sale.voidReason || "Sales Return Recorded"}
                </div>
              )}

              {/* Void / Return Form (if triggered) */}
              {isVoiding && (
                <div className="rounded-xl border border-error/40 bg-error/5 p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-[13px] font-bold text-error">
                    <AlertTriangle size={16} /> Process Sales Return / Void Bill
                  </div>
                  <p className="text-[11.5px] text-text-muted">
                    This will reverse the invoice, restock <strong>{fmtL(sale.liters)}</strong> back to tank, and adjust the customer balance.
                  </p>
                  <Input
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="Reason for return (e.g. Dispense aborted, Wrong fuel entry)"
                    autoFocus
                  />
                  {voidError && <p className="text-[11.5px] text-error">{voidError}</p>}
                  <div className="flex justify-end gap-2">
                    <GhostButton onClick={() => setIsVoiding(false)} className="text-[12px]">
                      Cancel
                    </GhostButton>
                    <PrimaryButton
                      onClick={handleConfirmVoid}
                      disabled={isVoidPending}
                      className="bg-error hover:bg-error/90 text-white text-[12px]"
                    >
                      {isVoidPending ? "Reversing..." : "Confirm Return"}
                    </PrimaryButton>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        {!isEditing && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-hi px-5 py-3.5">
            <div className="flex gap-2">
              <GhostButton onClick={handlePrint} className="text-[12.5px]">
                <Printer size={14} /> Print Bill
              </GhostButton>
              <GhostButton onClick={handleDownloadSlip} className="text-[12.5px]">
                <Download size={14} /> Download
              </GhostButton>
              {canVoid && !sale.voided && (
                <GhostButton
                  onClick={() => setIsEditing(true)}
                  className="text-[12.5px] text-accent"
                >
                  <Edit size={14} /> Edit Bill
                </GhostButton>
              )}
            </div>

            {!sale.voided && (
              <div>
                {canVoid ? (
                  !isVoiding && (
                    <GhostButton
                      tone="error"
                      onClick={() => setIsVoiding(true)}
                      className="text-[12.5px]"
                    >
                      <Undo2 size={14} /> Process Return
                    </GhostButton>
                  )
                ) : (
                  <span className="text-[11px] text-text-muted italic">
                    Return requires Manager approval
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
