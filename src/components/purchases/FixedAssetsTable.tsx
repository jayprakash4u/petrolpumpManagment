"use client";

import { useState, useEffect } from "react";
import { Plus, X, Warehouse, CheckCircle2, ShieldCheck, Wrench, Check, Search, Filter } from "lucide-react";
import type { FixedAsset } from "@/lib/purchases";
import { fmtRs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

const STORAGE_KEY = "fsm_fixed_assets";

export function FixedAssetsTable({ assets }: { assets: FixedAsset[] }) {
  const [list, setList] = useState<FixedAsset[]>(assets);
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

  const saveList = (updated: FixedAsset[]) => {
    setList(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Form state
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [category, setCategory] = useState<string>("Dispensers & Pumps");
  const [customCategory, setCustomCategory] = useState("");
  const [brandModel, setBrandModel] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [dateBS, setDateBS] = useState("2083-05-03");
  const [cost, setCost] = useState("250000");
  const [vendor, setVendor] = useState("Himalayan Petroleum Equipment");
  const [location, setLocation] = useState("Station Forecourt");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = category === "Other" ? (customCategory.trim() || "Station Equipment") : category;

    const newAsset: FixedAsset = {
      id: `ast-${Date.now()}`,
      assetTag: tag.trim() || `AST-CAP-${String(list.length + 1).padStart(2, "0")}`,
      name: name.trim(),
      category: finalCategory,
      brandModel: brandModel.trim(),
      serialNo: serialNo.trim(),
      purchaseDateBS: dateBS,
      purchaseCostNpr: parseFloat(cost) || 0,
      vendorName: vendor.trim(),
      currentCondition: "Optimal",
      warrantyExpiryBS: "2088-05-03",
      location: location.trim(),
    };

    saveList([newAsset, ...list]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
      setName("");
      setTag("");
      setBrandModel("");
      setSerialNo("");
      setCustomCategory("");
    }, 1000);
  };

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
          <PrimaryButton onClick={() => setModalOpen(true)} className="gap-1.5 text-xs">
            <Plus size={15} />
            Add Fixed Asset
          </PrimaryButton>
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
                    <span>No assets match "{searchQuery || categoryFilter}".</span>
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

      {/* Add Asset Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-fade-in">
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
                  <Warehouse size={18} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-text">Register Fixed Asset</h3>
                  <p className="text-xs text-text-muted">Record new station equipment or infrastructure</p>
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
                <h4 className="font-display text-base font-semibold text-text">Asset Cataloged</h4>
                <p className="mt-1 text-xs text-text-muted">{name} has been added to fixed assets.</p>
              </div>
            ) : (
              <form onSubmit={handleAdd} className="flex flex-col gap-4">
                <Field label="Asset / Equipment Name">
                  <Input
                    placeholder="e.g. Tokheim Quantium Multi-Product Dispenser"
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
                      <option value="Dispensers & Pumps">Dispensers & Pumps</option>
                      <option value="Storage Tanks">Storage Tanks</option>
                      <option value="Power & Generator">Power & Generator</option>
                      <option value="Security & POS IT">Security & POS IT</option>
                      <option value="Canopy & Civil">Canopy & Civil</option>
                      <option value="Other">Other (Specify)</option>
                    </Select>
                  </Field>
                  <Field label="Asset Tag / ID">
                    <Input
                      placeholder="e.g. AST-DISP-03"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                    />
                  </Field>
                </div>

                {category === "Other" && (
                  <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
                    <Field label="Custom Asset Category">
                      <Input
                        placeholder="e.g. Air Compressor, CCTV System, Fire Extinguishers"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        required
                        autoFocus
                      />
                    </Field>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Brand / Model">
                    <Input
                      placeholder="e.g. Tokheim 510"
                      value={brandModel}
                      onChange={(e) => setBrandModel(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Serial Number">
                    <Input
                      placeholder="e.g. TKH-2024-99120"
                      value={serialNo}
                      onChange={(e) => setSerialNo(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Purchase Cost (NPR)">
                    <Input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Installation Date (BS)">
                    <Input value={dateBS} onChange={(e) => setDateBS(e.target.value)} required />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Supplier / Vendor">
                    <Input
                      placeholder="e.g. Himalayan Petro Equipment"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Physical Location">
                    <Input
                      placeholder="e.g. Island 03 (East Forecourt)"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="mt-2 flex items-center justify-end gap-2.5">
                  <GhostButton type="button" onClick={() => setModalOpen(false)}>
                    Cancel
                  </GhostButton>
                  <PrimaryButton type="submit">Save Asset</PrimaryButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
