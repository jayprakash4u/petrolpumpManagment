"use client";

import { useState, useEffect } from "react";
import { Plus, X, Contact, Phone, Mail, MapPin, Building, Check, Search, Filter } from "lucide-react";
import type { Supplier } from "@/lib/purchases";
import { fmtRs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

const STORAGE_KEY = "fsm_suppliers";

export function SuppliersTable({ suppliers }: { suppliers: Supplier[] }) {
  const [list, setList] = useState<Supplier[]>(suppliers);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setList(parsed);
        }
      }
    } catch {}
  }, []);

  const saveList = (updated: Supplier[]) => {
    setList(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Lubricants & Oils");
  const [customCategory, setCustomCategory] = useState("");
  const [panVat, setPanVat] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<string>("Net 30 Days");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = category === "Other" ? (customCategory.trim() || "General Supplier") : category;

    const newSupplier: Supplier = {
      id: `sup-${Date.now()}`,
      name: name.trim(),
      category: finalCategory,
      panVatNo: panVat.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim(),
      paymentTerms: paymentTerms,
      balanceDueNpr: 0,
      totalPurchasedNpr: 0,
      active: true,
    };
    saveList([newSupplier, ...list]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
      setName("");
      setPanVat("");
      setContactPerson("");
      setPhone("");
      setCustomCategory("");
    }, 1000);
  };

  const categories = Array.from(
    new Set(["Fuel Refinery", "Lubricants & Oils", "Spares & Equipment", "Utilities & Govt", ...list.map((s) => s.category)])
  );

  const filtered = list.filter((s) => {
    if (categoryFilter !== "ALL" && s.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchPan = s.panVatNo.toLowerCase().includes(q);
      const matchPerson = s.contactPerson.toLowerCase().includes(q);
      const matchCategory = s.category.toLowerCase().includes(q);
      const matchPhone = s.phone.toLowerCase().includes(q);
      if (!matchName && !matchPan && !matchPerson && !matchCategory && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Search and Action Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-[240px] sm:w-[280px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Search supplier, PAN, contact person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-1.5 pl-8 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
            <Filter size={13} />
            <span>CATEGORY:</span>
          </div>

          <div className="w-[180px]">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1.5 text-xs"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-xs text-text-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Contact size={24} className="text-text-muted/40" />
                    <span>No suppliers match "{searchQuery || categoryFilter}".</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
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
                    <Badge tone="muted">{s.category}</Badge>
                  </td>

                  <td className="px-3 py-3 font-data text-[12.5px] text-text">{s.panVatNo}</td>

                  <td className="px-3 py-3 text-xs">
                    <div className="font-medium text-text">{s.contactPerson}</div>
                    <div className="font-data text-[11px] text-text-muted">{s.phone}</div>
                  </td>

                  <td className="px-3 py-3 font-data text-[12px] text-text-muted">{s.paymentTerms}</td>

                  <td className="px-3 py-3 text-right font-data text-[13px] font-semibold text-text">
                    {fmtRs(s.totalPurchasedNpr)}
                  </td>

                  <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-accent">
                    {fmtRs(s.balanceDueNpr)}
                  </td>

                  <td className="px-3 py-3 text-center">
                    <Badge tone={s.active ? "success" : "muted"}>{s.active ? "ACTIVE" : "INACTIVE"}</Badge>
                  </td>
                </tr>
              ))
            )}
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
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Fuel Refinery">Fuel Refinery (NOC / IOC)</option>
                      <option value="Lubricants & Oils">Lubricants & Oils</option>
                      <option value="Spares & Equipment">Spares & Equipment</option>
                      <option value="Utilities & Govt">Utilities & Govt</option>
                      <option value="Other">Other (Specify)</option>
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

                {category === "Other" && (
                  <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
                    <Field label="Custom Category / Business Type">
                      <Input
                        placeholder="e.g. Uniforms & Safety, Security, Construction, Marketing"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        required
                        autoFocus
                      />
                    </Field>
                  </div>
                )}

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
