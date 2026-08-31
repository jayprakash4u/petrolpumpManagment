"use client";

import { useState, useEffect } from "react";
import { Plus, X, Package, AlertTriangle, CheckCircle2, TrendingUp, Filter, Check, Search } from "lucide-react";
import type { InventoryItem } from "@/lib/purchases";
import { fmtRs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

const STORAGE_KEY = "fsm_inventory_items";

export function InventoryItemsTable({ items }: { items: InventoryItem[] }) {
  const [list, setList] = useState<InventoryItem[]>(items);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Hydrate from localStorage
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

  const saveList = (updated: InventoryItem[]) => {
    setList(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [brand, setBrand] = useState("Gulf Oil");
  const [category, setCategory] = useState<string>("Engine Oil");
  const [customCategory, setCustomCategory] = useState("");
  const [unit, setUnit] = useState<string>("Can (1L)");
  const [customUnit, setCustomUnit] = useState("");
  const [stock, setStock] = useState("24");
  const [reorder, setReorder] = useState("10");
  const [cost, setCost] = useState("480");
  const [mrp, setMrp] = useState("650");
  const [supplier, setSupplier] = useState("Gulf Lubricants Nepal Ltd.");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = category === "Other" ? (customCategory.trim() || "Other Goods") : category;
    const finalUnit = unit === "Other" ? (customUnit.trim() || "Units") : unit;

    const newItem: InventoryItem = {
      id: `item-${Date.now()}`,
      code: code.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      brand: brand.trim(),
      category: finalCategory,
      unit: finalUnit,
      stockInHand: parseInt(stock, 10) || 0,
      reorderLevel: parseInt(reorder, 10) || 10,
      costPriceNpr: parseFloat(cost) || 0,
      sellingPriceNpr: parseFloat(mrp) || 0,
      supplierName: supplier,
      lastRestockedBS: "2083-05-03",
    };
    saveList([newItem, ...list]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
      setName("");
      setCode("");
      setCustomCategory("");
      setCustomUnit("");
    }, 1000);
  };

  const categories = Array.from(
    new Set(["Engine Oil", "Gear & Brake Oil", "Coolant & Additive", "Consumables & Spares", ...list.map((i) => i.category)])
  );

  const filtered = list.filter((item) => {
    if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCode = item.code.toLowerCase().includes(q);
      const matchBrand = item.brand.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchBrand) return false;
    }
    return true;
  });

  const totalCostValue = filtered.reduce((sum, i) => sum + i.stockInHand * i.costPriceNpr, 0);
  const totalRetailValue = filtered.reduce((sum, i) => sum + i.stockInHand * i.sellingPriceNpr, 0);

  return (
    <div>
      {/* Filter and Action Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box by Code and Item Name */}
          <div className="relative w-[240px] sm:w-[280px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Search by code, SKU or name..."
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

        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">
            Stock Valuation: <strong className="font-data text-accent">{fmtRs(totalCostValue)}</strong>
          </span>
          <PrimaryButton onClick={() => setModalOpen(true)} className="gap-1.5 text-xs">
            <Plus size={15} />
            Add Inventory Item
          </PrimaryButton>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
              <th className="px-3 py-2.5 font-medium">ITEM & CODE</th>
              <th className="px-3 py-2.5 font-medium">BRAND / CATEGORY</th>
              <th className="px-3 py-2.5 font-medium">UNIT / PACK</th>
              <th className="px-3 py-2.5 text-right font-medium">STOCK IN HAND</th>
              <th className="px-3 py-2.5 text-right font-medium">COST PRICE</th>
              <th className="px-3 py-2.5 text-right font-medium">MRP / SELLING</th>
              <th className="px-3 py-2.5 text-right font-medium">MARGIN (%)</th>
              <th className="px-3 py-2.5 text-right font-medium">TOTAL VALUE</th>
              <th className="px-3 py-2.5 text-center font-medium">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-xs text-text-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package size={24} className="text-text-muted/40" />
                    <span>No inventory items match "{searchQuery || categoryFilter}".</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isLow = item.stockInHand <= item.reorderLevel;
                const margin = item.costPriceNpr > 0 ? ((item.sellingPriceNpr - item.costPriceNpr) / item.costPriceNpr) * 100 : 0;
                const totalVal = item.stockInHand * item.costPriceNpr;

                return (
                  <tr key={item.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-hi text-accent">
                          <Package size={15} />
                        </div>
                        <div>
                          <div className="font-display text-[13px] font-semibold text-text">{item.name}</div>
                          <div className="font-data text-[11px] text-text-muted">{item.code}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-xs">
                      <div className="font-medium text-text">{item.brand}</div>
                      <div className="text-[11px] text-text-muted">{item.category}</div>
                    </td>

                    <td className="px-3 py-3 font-data text-[12px] text-text-muted">{item.unit}</td>

                    <td className="px-3 py-3 text-right font-data text-[13px]">
                      <span className={isLow ? "font-bold text-error" : "font-semibold text-text"}>
                        {item.stockInHand} units
                      </span>
                      <div className="text-[10px] text-text-muted">Reorder at {item.reorderLevel}</div>
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[12.5px] text-text-muted">
                      {fmtRs(item.costPriceNpr)}
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[13px] font-semibold text-text">
                      {fmtRs(item.sellingPriceNpr)}
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[12px] text-success">
                      +{margin.toFixed(0)}%
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-accent">
                      {fmtRs(totalVal)}
                    </td>

                    <td className="px-3 py-3 text-center">
                      {isLow ? (
                        <Badge tone="error">
                          <AlertTriangle size={10} />
                          LOW STOCK
                        </Badge>
                      ) : (
                        <Badge tone="success">
                          <CheckCircle2 size={10} />
                          IN STOCK
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-text">Add Inventory Item</h3>
                  <p className="text-xs text-text-muted">Add lubricants, engine oils, or consumable spares</p>
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
                <h4 className="font-display text-base font-semibold text-text">Item Added to Stock</h4>
                <p className="mt-1 text-xs text-text-muted">{name} has been cataloged.</p>
              </div>
            ) : (
              <form onSubmit={handleAdd} className="flex flex-col gap-4">
                <Field label="Item Name & Spec">
                  <Input
                    placeholder="e.g. Castrol Magnatec 10W-40 (4L)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Item Code / SKU">
                    <Input
                      placeholder="e.g. OIL-CAST-MAG4"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </Field>
                  <Field label="Brand / Manufacturer">
                    <Input
                      placeholder="e.g. Castrol / Gulf / Servo"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Category">
                    <Select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Engine Oil">Engine Oil</option>
                      <option value="Gear & Brake Oil">Gear & Brake Oil</option>
                      <option value="Coolant & Additive">Coolant & Additive</option>
                      <option value="Consumables & Spares">Consumables & Spares</option>
                      <option value="Other">Other (Custom Category)</option>
                    </Select>
                  </Field>
                  <Field label="Packaging Unit">
                    <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
                      <option value="Can (1L)">Can (1L)</option>
                      <option value="Can (5L)">Can (5L)</option>
                      <option value="Drum (208L)">Drum (208L)</option>
                      <option value="Bottle">Bottle</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Other">Other (Custom Unit)</option>
                    </Select>
                  </Field>
                </div>

                {/* Conditional Custom Inputs for Other */}
                {(category === "Other" || unit === "Other") && (
                  <div className="grid grid-cols-1 gap-3 rounded-xl border border-accent/30 bg-accent/5 p-3 sm:grid-cols-2">
                    {category === "Other" && (
                      <Field label="Custom Category Name">
                        <Input
                          placeholder="e.g. Grease, Tyre Polish, Car Polish"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          required
                          autoFocus
                        />
                      </Field>
                    )}
                    {unit === "Other" && (
                      <Field label="Custom Unit Specification">
                        <Input
                          placeholder="e.g. 500ml Pouch, 20kg Bucket, Box (12 pcs)"
                          value={customUnit}
                          onChange={(e) => setCustomUnit(e.target.value)}
                          required
                        />
                      </Field>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Initial Stock Qty">
                    <Input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Reorder Threshold">
                    <Input
                      type="number"
                      value={reorder}
                      onChange={(e) => setReorder(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cost Price (NPR)">
                    <Input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Selling MRP (NPR)">
                    <Input
                      type="number"
                      value={mrp}
                      onChange={(e) => setMrp(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="mt-2 flex items-center justify-end gap-2.5">
                  <GhostButton type="button" onClick={() => setModalOpen(false)}>
                    Cancel
                  </GhostButton>
                  <PrimaryButton type="submit">Save to Stock</PrimaryButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
