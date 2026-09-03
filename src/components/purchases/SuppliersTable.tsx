"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X, Contact, MapPin, Building, Search, Filter } from "lucide-react";
import type { Supplier } from "@/lib/purchases";
import { fmtRs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";

const STORAGE_KEY = "fsm_suppliers";

export function SuppliersTable({ suppliers }: { suppliers: Supplier[] }) {
  // Read once, synchronously, as the initial value, so a supplier just added
  // on the full-page form is there on the very first render — no effect,
  // no extra render.
  const [list] = useState<Supplier[]>(() => {
    if (typeof window === "undefined") return suppliers;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return suppliers;
  });
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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

        <Link href="/purchases/suppliers/new">
          <PrimaryButton type="button" className="gap-1.5 text-xs">
            <Plus size={15} />
            Add Supplier
          </PrimaryButton>
        </Link>
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
                    <span>No suppliers match &ldquo;{searchQuery || categoryFilter}&rdquo;.</span>
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
    </div>
  );
}
