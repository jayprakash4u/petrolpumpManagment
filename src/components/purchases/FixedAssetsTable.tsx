"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X, Warehouse, CheckCircle2, Search, Filter } from "lucide-react";
import type { FixedAsset } from "@/lib/purchases";
import { fmtRs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";

const STORAGE_KEY = "fsm_fixed_assets";

export function FixedAssetsTable({ assets }: { assets: FixedAsset[] }) {
  // Read once, synchronously, as the initial value, so an asset just added
  // on the full-page form is there on the very first render.
  const [list] = useState<FixedAsset[]>(() => {
    if (typeof window === "undefined") return assets;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return assets;
  });
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = Array.from(
    new Set([
      "Dispensers & Pumps",
      "Storage Tanks",
      "Power & Generator",
      "Security & POS IT",
      "Canopy & Civil",
      ...list.map((a) => a.category),
    ])
  );

  const filtered = list.filter((a) => {
    if (categoryFilter !== "ALL" && a.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = a.name.toLowerCase().includes(q);
      const matchTag = a.assetTag.toLowerCase().includes(q);
      const matchCategory = a.category.toLowerCase().includes(q);
      const matchBrand = a.brandModel.toLowerCase().includes(q);
      const matchSerial = a.serialNo.toLowerCase().includes(q);
      const matchLoc = a.location.toLowerCase().includes(q);
      if (!matchName && !matchTag && !matchCategory && !matchBrand && !matchSerial && !matchLoc) return false;
    }
    return true;
  });

  const totalCapValue = filtered.reduce((sum, a) => sum + a.purchaseCostNpr, 0);

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-[240px] sm:w-[280px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Search asset, tag, brand, serial..."
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

          <div className="w-[190px]">
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

        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">
            Valuation: <strong className="font-data text-accent">{fmtRs(totalCapValue)}</strong>
          </span>
          <Link href="/purchases/assets/new">
            <PrimaryButton type="button" className="gap-1.5 text-xs">
              <Plus size={15} />
              Add Fixed Asset
            </PrimaryButton>
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
              <th className="px-3 py-2.5 font-medium">ASSET TAG / NAME</th>
              <th className="px-3 py-2.5 font-medium">CATEGORY</th>
              <th className="px-3 py-2.5 font-medium">BRAND / MODEL</th>
              <th className="px-3 py-2.5 font-medium">SERIAL NO</th>
              <th className="px-3 py-2.5 font-medium">INSTALLED DATE</th>
              <th className="px-3 py-2.5 text-right font-medium">PURCHASE COST</th>
              <th className="px-3 py-2.5 font-medium">WARRANTY UNTIL</th>
              <th className="px-3 py-2.5 text-center font-medium">CONDITION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-xs text-text-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Warehouse size={24} className="text-text-muted/40" />
                    <span>No assets match &ldquo;{searchQuery || categoryFilter}&rdquo;.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-hi text-accent">
                        <Warehouse size={15} />
                      </div>
                      <div>
                        <div className="font-display text-[13px] font-semibold text-text">{a.name}</div>
                        <div className="font-data text-[11px] text-text-muted">{a.assetTag} · {a.location}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <Badge tone="muted">{a.category}</Badge>
                  </td>

                  <td className="px-3 py-3 text-xs font-medium text-text">{a.brandModel}</td>

                  <td className="px-3 py-3 font-data text-[12px] text-text-muted">{a.serialNo}</td>

                  <td className="px-3 py-3 font-data text-[12.5px] text-text-muted">{a.purchaseDateBS}</td>

                  <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-accent">
                    {fmtRs(a.purchaseCostNpr)}
                  </td>

                  <td className="px-3 py-3 font-data text-[12px] text-text-muted">{a.warrantyExpiryBS}</td>

                  <td className="px-3 py-3 text-center">
                    <Badge tone={a.currentCondition === "Optimal" ? "success" : "accent"}>
                      <CheckCircle2 size={10} />
                      {a.currentCondition}
                    </Badge>
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
