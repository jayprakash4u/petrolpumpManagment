"use client";

import { useState } from "react";
import { Plus, X, Warehouse, CheckCircle2, ShieldCheck, Wrench, Check } from "lucide-react";
import type { FixedAsset } from "@/lib/purchases";
import { fmtRs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

export function FixedAssetsTable({ assets }: { assets: FixedAsset[] }) {
  const [list, setList] = useState<FixedAsset[]>(assets);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [category, setCategory] = useState<FixedAsset["category"]>("Dispensers & Pumps");
  const [brandModel, setBrandModel] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [dateBS, setDateBS] = useState("2083-05-03");
  const [cost, setCost] = useState("250000");
  const [vendor, setVendor] = useState("Himalayan Petroleum Equipment");
  const [location, setLocation] = useState("Station Forecourt");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newAsset: FixedAsset = {
      id: `ast-${Date.now()}`,
      assetTag: tag || `AST-CAP-${String(list.length + 1).padStart(2, "0")}`,
      name,
      category,
      brandModel,
      serialNo,
      purchaseDateBS: dateBS,
      purchaseCostNpr: parseFloat(cost) || 0,
      vendorName: vendor,
      currentCondition: "Optimal",
      warrantyExpiryBS: "2088-05-03",
      location,
    };

    setList([newAsset, ...list]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
      setName("");
      setBrandModel("");
      setSerialNo("");
    }, 1000);
  };

  const totalCapValue = list.reduce((sum, a) => sum + a.purchaseCostNpr, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold text-text">Fixed Assets & Infrastructure</h3>
          <p className="text-xs text-text-muted">Capital machinery, dispensers, generator sets, and underground tanks</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">
            Total Capital Value: <strong className="font-data text-accent">{fmtRs(totalCapValue)}</strong>
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
            {list.map((a) => (
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
                    <ShieldCheck size={10} />
                    {a.currentCondition.toUpperCase()}
                  </Badge>
                </td>
              </tr>
            ))}
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
                      onChange={(e) => setCategory(e.target.value as FixedAsset["category"])}
                    >
                      <option value="Dispensers & Pumps">Dispensers & Pumps</option>
                      <option value="Storage Tanks">Storage Tanks</option>
                      <option value="Power & Generator">Power & Generator</option>
                      <option value="Security & POS IT">Security & POS IT</option>
                      <option value="Canopy & Civil">Canopy & Civil</option>
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
