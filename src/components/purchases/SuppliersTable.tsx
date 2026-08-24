"use client";

import { useState } from "react";
import { Plus, X, Contact, Phone, Mail, MapPin, Building, Check } from "lucide-react";
import type { Supplier } from "@/lib/purchases";
import { fmtRs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

export function SuppliersTable({ suppliers }: { suppliers: Supplier[] }) {
  const [list, setList] = useState<Supplier[]>(suppliers);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Supplier["category"]>("Lubricants & Oils");
  const [panVat, setPanVat] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<Supplier["paymentTerms"]>("Net 30 Days");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newSupplier: Supplier = {
      id: `sup-${Date.now()}`,
      name,
      category,
      panVatNo: panVat,
      contactPerson,
      phone,
      email: email || undefined,
      address,
      paymentTerms,
      balanceDueNpr: 0,
      totalPurchasedNpr: 0,
      active: true,
    };
    setList([newSupplier, ...list]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
      setName("");
      setPanVat("");
      setContactPerson("");
      setPhone("");
    }, 1000);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold text-text">Registered Suppliers & Vendors</h3>
          <p className="text-xs text-text-muted">Direct supply lines for fuels, lubricants, and spare parts</p>
        </div>
        <PrimaryButton onClick={() => setModalOpen(true)} className="gap-1.5 text-xs">
          <Plus size={15} />
          Add Supplier
        </PrimaryButton>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
              <th className="px-3 py-2.5 font-medium">SUPPLIER / VENDOR</th>
              <th className="px-3 py-2.5 font-medium">CATEGORY</th>
              <th className="px-3 py-2.5 font-medium">PAN / VAT NO</th>
              <th className="px-3 py-2.5 font-medium">CONTACT DETAILS</th>
              <th className="px-3 py-2.5 font-medium">TERMS</th>
              <th className="px-3 py-2.5 text-right font-medium">LIFETIME VOLUME</th>
              <th className="px-3 py-2.5 text-right font-medium">BALANCE DUE</th>
              <th className="px-3 py-2.5 text-center font-medium">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-hi text-accent">
                      <Building size={15} />
                    </div>
                    <div>
                      <div className="font-display text-[13.5px] font-semibold text-text">{s.name}</div>
                      <div className="flex items-center gap-1 text-[11px] text-text-muted">
                        <MapPin size={11} />
                        <span>{s.address}</span>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-3 py-3">
                  <Badge tone={s.category === "Fuel Refinery" ? "accent" : "muted"}>{s.category}</Badge>
                </td>

                <td className="px-3 py-3 font-data text-[12.5px] text-text-muted">{s.panVatNo}</td>

                <td className="px-3 py-3 text-xs">
                  <div className="font-medium text-text">{s.contactPerson}</div>
                  <div className="flex items-center gap-1 font-data text-[11px] text-text-muted">
                    <Phone size={10} />
                    <span>{s.phone}</span>
                  </div>
                </td>

                <td className="px-3 py-3 font-data text-[12px] text-text-muted">{s.paymentTerms}</td>

                <td className="px-3 py-3 text-right font-data text-[12.5px] text-text">
                  {fmtRs(s.totalPurchasedNpr)}
                </td>

                <td className="px-3 py-3 text-right font-data text-[13px] font-bold">
                  {s.balanceDueNpr > 0 ? (
                    <span className="text-error">{fmtRs(s.balanceDueNpr)}</span>
                  ) : (
                    <span className="text-success">Rs 0 (Clear)</span>
                  )}
                </td>

                <td className="px-3 py-3 text-center">
                  <Badge tone="success">ACTIVE</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Supplier Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-fade-in">
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
                  <Contact size={18} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-text">Add New Supplier</h3>
                  <p className="text-xs text-text-muted">Register an authorized fuel or inventory vendor</p>
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
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
                  <Check size={24} />
                </div>
                <h4 className="font-display text-base font-semibold text-text">Supplier Registered</h4>
                <p className="mt-1 text-xs text-text-muted">{name} has been added to the directory.</p>
              </div>
            ) : (
              <form onSubmit={handleAdd} className="flex flex-col gap-4">
                <Field label="Company / Supplier Name">
                  <Input
                    placeholder="e.g. Nepal Oil Corporation or Castrol Lubricants"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Category">
                    <Select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Supplier["category"])}
                    >
                      <option value="Fuel Refinery">Fuel Refinery (NOC / IOC)</option>
                      <option value="Lubricants & Oils">Lubricants & Oils</option>
                      <option value="Spares & Equipment">Spares & Equipment</option>
                      <option value="Utilities & Govt">Utilities & Govt</option>
                    </Select>
                  </Field>
                  <Field label="PAN / VAT Number">
                    <Input
                      placeholder="e.g. 300054891"
                      value={panVat}
                      onChange={(e) => setPanVat(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Contact Person">
                    <Input
                      placeholder="e.g. Birendra Shrestha"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Phone / Mobile">
                    <Input
                      placeholder="e.g. +977 9851084721"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Email Address (Optional)">
                    <Input
                      type="email"
                      placeholder="supplier@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>
                  <Field label="Payment Terms">
                    <Select
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value as Supplier["paymentTerms"])}
                    >
                      <option value="Advance / Pre-paid">Advance / Pre-paid</option>
                      <option value="Net 15 Days">Net 15 Days</option>
                      <option value="Net 30 Days">Net 30 Days</option>
                      <option value="Immediate Cash">Immediate Cash</option>
                    </Select>
                  </Field>
                </div>

                <Field label="Depot / Physical Address">
                  <Input
                    placeholder="e.g. Amlekhgunj Depot, Bara"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </Field>

                <div className="mt-2 flex items-center justify-end gap-2.5">
                  <GhostButton type="button" onClick={() => setModalOpen(false)}>
                    Cancel
                  </GhostButton>
                  <PrimaryButton type="submit">Save Supplier</PrimaryButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
