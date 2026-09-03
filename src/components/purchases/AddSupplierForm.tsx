"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Supplier } from "@/lib/purchases";
import { Field, Input, Select } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

const STORAGE_KEY = "fsm_suppliers";

/**
 * A full page, not a modal — matching how every other record in this app
 * (a bill, a purchase, a customer) is created: its own page you navigate to
 * and away from, not a dialog stacked on top of a list.
 *
 * Deliberately just the fields a vendor record actually needs: with fuel
 * purchases now billed to a fixed NOC supplier, this directory exists for
 * the other invoices that ride along a purchase — insurance and transport.
 */
export function AddSupplierForm() {
  const router = useRouter();

  const [panVat, setPanVat] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    const newSupplier: Supplier = {
      id: `sup-${Date.now()}`,
      name: name.trim(),
      category,
      panVatNo: panVat.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim(),
      paymentTerms: "Net 30 Days",
      balanceDueNpr: 0,
      totalPurchasedNpr: 0,
      active: true,
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const existing: Supplier[] = saved ? JSON.parse(saved) : [];
      const list = Array.isArray(existing) ? existing : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newSupplier, ...list]));
    } catch {}

    router.push("/purchases/suppliers");
  };

  return (
    <form onSubmit={handleAdd} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Supplier Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Choose Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="" disabled>
              Choose Category
            </option>
            <option value="Insurance">Insurance</option>
            <option value="Transport">Transport</option>
            <option value="Other">Other</option>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="PAN No.">
          <Input value={panVat} onChange={(e) => setPanVat(e.target.value)} required />
        </Field>
        <Field label="Phone No.">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Contact Person">
          <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required />
        </Field>
        <Field label="Email Address">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>

      <Field label="Supplier Address">
        <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
      </Field>

      <div className="mt-2 flex items-center justify-end gap-2.5 border-t border-border pt-4">
        <GhostButton type="button" onClick={() => router.push("/purchases/suppliers")}>
          Cancel
        </GhostButton>
        <PrimaryButton type="submit">Save Supplier</PrimaryButton>
      </div>
    </form>
  );
}
