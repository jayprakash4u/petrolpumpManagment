"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FixedAsset } from "@/lib/purchases";
import { Field, Input, Select } from "@/components/ui/Field";
import { BSDateField } from "@/components/ui/BSDateField";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

const STORAGE_KEY = "fsm_fixed_assets";

/** A full page, not a modal — matching Add Supplier and Add Expense. */
export function AddFixedAssetForm() {
  const router = useRouter();

  const [existingCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  });

  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [category, setCategory] = useState("Dispensers & Pumps");
  const [customCategory, setCustomCategory] = useState("");
  const [brandModel, setBrandModel] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [dateBS, setDateBS] = useState("");
  const [cost, setCost] = useState("");
  const [vendor, setVendor] = useState("");
  const [location, setLocation] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = category === "Other" ? (customCategory.trim() || "Station Equipment") : category;

    const newAsset: FixedAsset = {
      id: `ast-${Date.now()}`,
      assetTag: tag.trim() || `AST-CAP-${String(existingCount + 1).padStart(2, "0")}`,
      name: name.trim(),
      category: finalCategory,
      brandModel: brandModel.trim(),
      serialNo: serialNo.trim(),
      purchaseDateBS: dateBS,
      purchaseCostNpr: parseFloat(cost) || 0,
      vendorName: vendor.trim(),
      currentCondition: "Optimal",
      warrantyExpiryBS: "",
      location: location.trim(),
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const existing: FixedAsset[] = saved ? JSON.parse(saved) : [];
      const list = Array.isArray(existing) ? existing : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newAsset, ...list]));
    } catch {}

    router.push("/purchases/assets");
  };

  return (
    <form onSubmit={handleAdd} className="flex flex-col gap-4">
      <Field label="Asset / Equipment Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Dispensers & Pumps">Dispensers & Pumps</option>
            <option value="Storage Tanks">Storage Tanks</option>
            <option value="Power & Generator">Power & Generator</option>
            <option value="Security & POS IT">Security & POS IT</option>
            <option value="Canopy & Civil">Canopy & Civil</option>
            <option value="Other">Other (Specify)</option>
          </Select>
        </Field>
        <Field label="Asset Tag / ID">
          <Input value={tag} onChange={(e) => setTag(e.target.value)} />
        </Field>
      </div>

      {category === "Other" && (
        <Field label="Custom Asset Category">
          <Input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} required autoFocus />
        </Field>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Brand / Model">
          <Input value={brandModel} onChange={(e) => setBrandModel(e.target.value)} required />
        </Field>
        <Field label="Serial Number">
          <Input value={serialNo} onChange={(e) => setSerialNo(e.target.value)} required />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Purchase Cost (NPR)">
          <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} required />
        </Field>
        <Field label="Installation Date (BS)">
          <BSDateField value={dateBS} onChange={setDateBS} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Supplier / Vendor">
          <Input value={vendor} onChange={(e) => setVendor(e.target.value)} required />
        </Field>
        <Field label="Physical Location">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
        </Field>
      </div>

      <div className="mt-2 flex items-center justify-end gap-2.5 border-t border-border pt-4">
        <GhostButton type="button" onClick={() => router.push("/purchases/assets")}>
          Cancel
        </GhostButton>
        <PrimaryButton type="submit">Save Asset</PrimaryButton>
      </div>
    </form>
  );
}
