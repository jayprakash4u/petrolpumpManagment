"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Pencil, X, AlertCircle } from "lucide-react";
import { createCustomerAction, updateCustomerDetailsAction, type CustomerFormState } from "@/lib/actions/customers";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

const initialState: CustomerFormState = {};

export interface EditableCustomer {
  id: string;
  name: string;
  phone: string | null;
  panNo: string | null;
  email: string | null;
  address: string | null;
}

/**
 * Create a new credit account, or edit an existing one's contact/identity
 * details — reachable right from the point of billing instead of only the
 * Credit Customers page. Editing here never touches the credit limit; that
 * stays a Credit-page decision (`CreditLimitEditor`), not something changed
 * mid-sale.
 *
 * Both modes post to the same server actions the Credit page uses
 * (`createCustomerAction` / `updateCustomerDetailsAction`) — one place that
 * actually writes a customer record, not a parallel copy.
 */
export function AddCustomerModal({
  editingCustomer,
  onClose,
  onSaved,
}: {
  /** Omit to create a new customer; pass an existing one to edit it. */
  editingCustomer?: EditableCustomer | null;
  onClose: () => void;
  onSaved: (name: string) => void;
}) {
  const isEditing = !!editingCustomer;
  const router = useRouter();
  const [state, action, pending] = useActionState(
    isEditing ? updateCustomerDetailsAction : createCustomerAction,
    initialState
  );
  const [name, setName] = useState(editingCustomer?.name ?? "");

  useEffect(() => {
    if (state.message) {
      router.refresh();
      onSaved(name);
    }
    // Only react to a fresh success message from the action itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.message]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <form action={action} className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        {isEditing && <input type="hidden" name="customerId" value={editingCustomer.id} />}

        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            {isEditing ? <Pencil size={18} className="text-accent" /> : <UserPlus size={18} className="text-accent" />}
            <h3 className="font-display text-[16px] font-bold text-text">
              {isEditing ? "Edit Customer" : "Add Customer"}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer p-1 text-text-muted hover:text-text">
            <X size={16} />
          </button>
        </div>

        <Field label="Customer Name" htmlFor="acName">
          <Input id="acName" name="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </Field>

        <Field label="PAN / VAT No. (optional)" htmlFor="acPan">
          <Input id="acPan" name="panNo" defaultValue={editingCustomer?.panNo ?? ""} placeholder="600123456" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone (optional)" htmlFor="acPhone">
            <Input id="acPhone" name="phone" inputMode="tel" defaultValue={editingCustomer?.phone ?? ""} placeholder="98410 22310" />
          </Field>
          <Field label="Email (optional)" htmlFor="acEmail">
            <Input id="acEmail" name="email" type="email" defaultValue={editingCustomer?.email ?? ""} />
          </Field>
        </div>

        <Field label="Address (optional)" htmlFor="acAddress">
          <Input id="acAddress" name="address" defaultValue={editingCustomer?.address ?? ""} placeholder="New Baneshwor, Kathmandu" />
        </Field>

        {!isEditing && (
          <Field label="Credit Limit" htmlFor="acLimit">
            <Input id="acLimit" name="creditLimit" inputMode="decimal" defaultValue="0" />
          </Field>
        )}

        {isEditing && (
          <p className="text-[11px] text-text-muted">
            Credit limit isn&apos;t edited here — change it from the Credit Customers page.
          </p>
        )}

        {state.error && (
          <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/8 p-2.5 text-xs text-error">
            <AlertCircle size={14} className="shrink-0" />
            {state.error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
          <PrimaryButton type="submit" disabled={pending}>
            {isEditing ? <Pencil size={14} /> : <UserPlus size={14} />}
            {pending ? "Saving…" : isEditing ? "Save Changes" : "Add Customer"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
