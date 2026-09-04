"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog";
import { MOCK_CATALOG_PRODUCTS } from "@/lib/catalog";
import { Field, Input, Select } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

const STORAGE_KEY = "fsm_catalog_products";

const PARENT_CATEGORIES = [
  "Fuel",
  "Lubricant",
  "Engine Oil",
  "Gear & Brake Oil",
  "Coolant & Additives",
  "Spares & Equipment",
  "Consumable",
  "Services",
  "Transportation",
  "Other Items",
];

const BRANDS = [
  "Nepal Oil Corporation (NOC)",
  "Gulf Oil",
  "Castrol",
  "Servo Lubricants",
  "Mobil",
  "Shell",
  "TotalEnergies",
  "Mak Lubricants",
  "ZVA Elaflex",
  "Tokheim",
  "Gilbarco",
  "Local / In-House",
];

const UNITS = [
  "Litre",
  "Piece",
  "Bottle",
  "Can (5L)",
  "Can (1L)",
  "Drum (208L)",
  "KG",
  "Pack",
  "Service / Trip",
  "Set",
];

export function AddProductForm() {
  const router = useRouter();

  const [parentCategory, setParentCategory] = useState("Fuel");
  const [name, setName] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [hsCode, setHsCode] = useState("");
  const [unit, setUnit] = useState("Litre");
  const [taxable, setTaxable] = useState(true);
  const [active, setActive] = useState(true);
  const [openingStock, setOpeningStock] = useState("");
  const [rate, setRate] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live total calculation: Opening Stock * Rate
  const totalAmount = useMemo(() => {
    const qty = parseFloat(openingStock) || 0;
    const r = parseFloat(rate) || 0;
    if (qty > 0 && r > 0) {
      return (qty * r).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return "";
  }, [openingStock, rate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter the Product Name.");
      return;
    }

    const price = parseFloat(sellingPrice) || 0;
    if (price <= 0) {
      setErrorMessage("Please enter a valid Selling Price.");
      return;
    }

    setIsSubmitting(true);

    const qty = parseFloat(openingStock) || 0;
    const r = parseFloat(rate) || 0;

    const newProduct: CatalogProduct = {
      id: `prod-${Date.now()}`,
      code: hsCode.trim() || `PRD-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      category: (parentCategory || "Fuel") as any,
      unit: (unit.trim() || "Litre") as any,
      hsnCode: hsCode.trim() || "-",
      costPriceNpr: r,
      sellingPriceNpr: price,
      stockInHand: qty,
      reorderLevel: 10,
      vatRate: taxable ? 0.13 : 0,
      vatable: taxable,
      active,
      description: brand ? `Brand: ${brand}` : "",
      lastRestockedDateBS: "2083-05-19",
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const existing: CatalogProduct[] = saved ? JSON.parse(saved) : MOCK_CATALOG_PRODUCTS;
      const updated = [newProduct, ...existing];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(`Product "${newProduct.name}" added successfully.`);
      setTimeout(() => {
        router.push("/catalog/products");
      }, 700);
    }, 300);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Parent Category">
          <Select
            value={parentCategory}
            onChange={(e) => setParentCategory(e.target.value)}
            required
          >
            {PARENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Brand / Manufacturer">
          <Select value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">Select Brand</option>
            {BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Product Name">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="HS Code">
          <Input
            value={hsCode}
            onChange={(e) => setHsCode(e.target.value)}
            className="font-mono"
          />
        </Field>

        <Field label="Measurement Unit">
          <Select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Selling Price (Rs.)">
          <Input
            inputMode="decimal"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            required
            className="font-data"
          />
        </Field>

        <div className="flex flex-col justify-end gap-2 pb-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text select-none">
            <input
              type="checkbox"
              checked={taxable}
              onChange={(e) => setTaxable(e.target.checked)}
              className="h-4 w-4 rounded border-border text-accent accent-accent focus:ring-accent"
            />
            <span>Taxable (13% VAT)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text select-none">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-border text-accent accent-accent focus:ring-accent"
            />
            <span>Active in Catalog</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Opening Stock (Qty)">
          <Input
            inputMode="decimal"
            value={openingStock}
            onChange={(e) => setOpeningStock(e.target.value)}
            className="font-data"
          />
        </Field>

        <Field label="Cost Rate (Rs.)">
          <Input
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="font-data"
          />
        </Field>

        <Field label="Total Valuation (Rs.)">
          <Input
            readOnly
            value={totalAmount}
            className="font-data bg-surface-hi/50 font-bold text-accent"
          />
        </Field>
      </div>

      {successMessage && (
        <div className="animate-fade-in flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="animate-fade-in flex items-center gap-2.5 rounded-xl border border-error/30 bg-error/10 p-3.5 text-[13px] text-error">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="mt-2 flex items-center justify-end gap-2.5 border-t border-border pt-4">
        <GhostButton type="button" onClick={() => router.push("/catalog/products")}>
          Cancel
        </GhostButton>
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving Product..." : "Save Product"}
        </PrimaryButton>
      </div>
    </form>
  );
}
