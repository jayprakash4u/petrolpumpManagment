"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Warehouse,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  PackagePlus,
} from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import type { FixedAsset, Supplier } from "@/lib/purchases";
import { MOCK_SUPPLIERS, MOCK_FIXED_ASSETS } from "@/lib/mock/purchases";
import { fmtBSDate } from "@/lib/bs-date";
import { fmtRs } from "@/lib/money";

export interface AssetItemRow {
  id: string;
  assetName: string;
  category: string;
  serialNumber: string;
  model: string;
  details: string;
  vatable: boolean;
  ledger: string;
  quantity: string;
  purchaseCost: string;
  expiryDate: string;
}

const STORAGE_KEY = "fsm_fixed_assets";
const SUPPLIERS_STORAGE_KEY = "fsm_suppliers";

const ASSET_CATEGORIES = [
  "Machinery & Equipment",
  "Fuel Dispenser / Pumps",
  "Generators & Power Backup",
  "Underground Fuel Tanks",
  "Electronics & POS Hardware",
  "Vehicles & Tankers",
  "Furniture & Fixtures",
  "Building & Civil Structures",
  "Safety & Firefighting Equipment",
  "Others",
];

const ASSET_LEDGERS = [
  "Fixed Assets - Machinery & Plant",
  "Fixed Assets - Fuel Dispensers & Nozzles",
  "Fixed Assets - Underground Fuel Tanks",
  "Fixed Assets - Generators & Power Backup",
  "Fixed Assets - IT, POS & Computers",
  "Fixed Assets - Vehicles & Transportation",
  "Fixed Assets - Building & Canopy Civil Works",
  "Fixed Assets - Furniture & Fixtures",
  "Other Fixed Asset Ledgers",
];

const SUPPLIER_CATEGORIES = [
  "Petroleum / Fuel",
  "Lubricants & Oils",
  "Spares & Equipment",
  "Transport / Dhuwani",
  "Publishing & Stationery",
  "Utilities & Govt",
  "Consumables & Spares",
  "General Supplies",
  "Others",
];

const createEmptyAssetRow = (): AssetItemRow => ({
  id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  assetName: "",
  category: "",
  serialNumber: "",
  model: "",
  details: "",
  vatable: true,
  ledger: "",
  quantity: "1",
  purchaseCost: "",
  expiryDate: "",
});

export function AddFixedAssetForm({
  onSaved,
  onCancel,
}: {
  onSaved?: (asset: FixedAsset) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();

  // Active Suppliers list initialized from localStorage or mock
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    if (typeof window === "undefined") return MOCK_SUPPLIERS;
    try {
      const saved = localStorage.getItem(SUPPLIERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MOCK_SUPPLIERS;
  });

  // Modal State for "Add New Supplier"
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [newSupplierPan, setNewSupplierPan] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierAddress, setNewSupplierAddress] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierContact, setNewSupplierContact] = useState("");
  const [newSupplierEmail, setNewSupplierEmail] = useState("");
  const [newSupplierCategory, setNewSupplierCategory] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  // 1. Purchase Detail State
  const [supplierId, setSupplierId] = useState("");
  const [purchaseDateBS, setPurchaseDateBS] = useState(() => fmtBSDate(new Date()) || "2083-05-19");
  const [invoiceNo, setInvoiceNo] = useState("");

  // 2. Fixed Assets Items State
  const [assetRows, setAssetRows] = useState<AssetItemRow[]>([createEmptyAssetRow()]);

  // 3. Amount Detail State (can be auto-calculated or manually tuned)
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<string>("0");
  const [nonTaxableAmount, setNonTaxableAmount] = useState<string>("0");
  const [taxableAmount, setTaxableAmount] = useState<string>("");
  const [vatAmount, setVatAmount] = useState<string>("0");
  const [description, setDescription] = useState<string>("");

  const [isTaxableManual, setIsTaxableManual] = useState(false);
  const [isVatManual, setIsVatManual] = useState(false);
  const [isTotalManual, setIsTotalManual] = useState(false);

  // Form submission feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync Amount Details from assetRows when not overridden manually
  useEffect(() => {
    if (isTotalManual) return;

    let computedTotal = 0;
    let computedTaxable = 0;
    let computedNonTaxable = 0;

    assetRows.forEach((row) => {
      const qty = parseFloat(row.quantity) || 0;
      const unitCost = parseFloat(row.purchaseCost) || 0;
      const lineCost = qty * unitCost;

      computedTotal += lineCost;
      if (row.vatable) {
        computedTaxable += lineCost;
      } else {
        computedNonTaxable += lineCost;
      }
    });

    setTotalAmount(computedTotal > 0 ? computedTotal.toFixed(2) : "");
    setNonTaxableAmount(computedNonTaxable > 0 ? computedNonTaxable.toFixed(2) : "0");

    if (!isTaxableManual) {
      const disc = parseFloat(discountAmount) || 0;
      const effectiveTaxable = Math.max(0, computedTaxable - disc);
      setTaxableAmount(effectiveTaxable > 0 ? effectiveTaxable.toFixed(2) : "");

      if (!isVatManual) {
        const computedVat = effectiveTaxable * 0.13;
        setVatAmount(computedVat > 0 ? computedVat.toFixed(2) : "0");
      }
    }
  }, [assetRows, discountAmount, isTotalManual, isTaxableManual, isVatManual]);

  // Compute Grand Total: Total Purchase Amount - Discount Amount + Vat Amount
  const grandTotal = useMemo(() => {
    const tot = parseFloat(totalAmount) || 0;
    const disc = parseFloat(discountAmount) || 0;
    const vat = parseFloat(vatAmount) || 0;
    return Math.max(0, tot - disc + vat);
  }, [totalAmount, discountAmount, vatAmount]);

  // Update specific asset row
  const updateAssetRow = (id: string, patch: Partial<AssetItemRow>) => {
    setAssetRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  // Add more asset row
  const handleAddMoreRow = () => {
    setAssetRows((prev) => [...prev, createEmptyAssetRow()]);
  };

  // Remove asset row
  const handleRemoveRow = (id: string) => {
    if (assetRows.length <= 1) return;
    setAssetRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Handle New Supplier Creation from Modal
  const handleCreateSupplierFromModal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSupplierName.trim()) {
      setModalError("Supplier Name is required.");
      return;
    }

    const newSupplier: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSupplierName.trim(),
      panVatNo: newSupplierPan.trim() || "-",
      address: newSupplierAddress.trim() || "-",
      phone: newSupplierPhone.trim() || "-",
      contactPerson: newSupplierContact.trim() || "-",
      email: newSupplierEmail.trim() || undefined,
      category:
        newSupplierCategory && newSupplierCategory !== "-------Choose Category-------"
          ? newSupplierCategory
          : "General Supplies",
      paymentTerms: "Net 30 Days",
      balanceDueNpr: 0,
      totalPurchasedNpr: 0,
      active: true,
    };

    const updated = [newSupplier, ...suppliers];
    setSuppliers(updated);
    try {
      localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    setSupplierId(newSupplier.id);
    setNewSupplierPan("");
    setNewSupplierName("");
    setNewSupplierAddress("");
    setNewSupplierPhone("");
    setNewSupplierContact("");
    setNewSupplierEmail("");
    setNewSupplierCategory("");
    setModalError(null);
    setIsAddSupplierModalOpen(false);

    setSuccessMessage(`Supplier "${newSupplier.name}" added and selected successfully!`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleCloseSupplierModal = () => {
    setIsAddSupplierModalOpen(false);
    setModalError(null);
    if (supplierId === "__ADD_NEW_SUPPLIER__") {
      setSupplierId("");
    }
  };

  // Save Fixed Asset Handler
  const handleSaveFixedAsset = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!supplierId || supplierId === "__ADD_NEW_SUPPLIER__") {
      setErrorMessage("Please select a Supplier Name.");
      return;
    }

    if (!invoiceNo.trim()) {
      setErrorMessage("Please enter an Invoice / Bill Number.");
      return;
    }

    const validRows = assetRows.filter((r) => r.assetName.trim() !== "");
    if (validRows.length === 0) {
      setErrorMessage("Please enter at least one Asset Name.");
      return;
    }

    const tot = parseFloat(totalAmount) || 0;
    if (tot <= 0) {
      setErrorMessage("Please enter a valid Total Purchase Amount.");
      return;
    }

    setIsSubmitting(true);

    const selectedSupplier = suppliers.find((s) => s.id === supplierId);
    const supplierName = selectedSupplier ? selectedSupplier.name : supplierId;

    // Construct new fixed asset records from rows
    const newAssets: FixedAsset[] = validRows.map((row, idx) => {
      const qty = parseFloat(row.quantity) || 1;
      const unitCost = parseFloat(row.purchaseCost) || 0;
      return {
        id: `ast-${Date.now()}-${idx}`,
        assetTag: `AST-CAP-${String(Math.floor(Math.random() * 900) + 100)}`,
        name: row.assetName.trim(),
        category: row.category || "Machinery & Equipment",
        brandModel: row.model.trim() || "Standard",
        serialNo: row.serialNumber.trim() || `SN-${Date.now().toString().slice(-6)}`,
        purchaseDateBS: purchaseDateBS.trim() || "2083-05-19",
        purchaseCostNpr: qty * unitCost > 0 ? qty * unitCost : tot / validRows.length,
        vendorName: supplierName,
        currentCondition: "Optimal",
        warrantyExpiryBS: row.expiryDate.trim() || "2085-05-19",
        location: row.details.trim() || "Main Forecourt / Plant",
      };
    });

    // Save to LocalStorage
    try {
      const existingStr = localStorage.getItem(STORAGE_KEY);
      const existing: FixedAsset[] = existingStr ? JSON.parse(existingStr) : MOCK_FIXED_ASSETS;
      const updated = [...newAssets, ...existing];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(
        `${newAssets.length} Fixed Asset(s) saved under Invoice #${invoiceNo} from ${supplierName}!`
      );

      if (onSaved && newAssets[0]) {
        onSaved(newAssets[0]);
      }

      // Reset form after short delay
      setTimeout(() => {
        setSupplierId("");
        setInvoiceNo("");
        setAssetRows([createEmptyAssetRow()]);
        setTotalAmount("");
        setDiscountAmount("0");
        setNonTaxableAmount("0");
        setTaxableAmount("");
        setVatAmount("0");
        setDescription("");
        setIsTaxableManual(false);
        setIsVatManual(false);
        setIsTotalManual(false);
        setSuccessMessage(null);
      }, 2000);
    }, 600);
  };

  // Keyboard shortcut listener: Ctrl + D to save, Ctrl + A to add more row, Escape to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAddSupplierModalOpen) {
        e.preventDefault();
        handleCloseSupplierModal();
        return;
      }
      if (!isAddSupplierModalOpen) {
        if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) {
          e.preventDefault();
          handleSaveFixedAsset();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
          e.preventDefault();
          handleAddMoreRow();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full min-w-0 animate-fade-in pb-12">
      {/* 1. Top Header Toolbar matching design system */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            Fixed Asset <span className="text-accent">management</span>
          </h1>
          <p className="text-[11.5px] text-text-muted hidden sm:block">
            Capitalize dispensers, power generators, underground tanks, IT equipment, and forecourt infrastructure.
          </p>
        </div>

        <GhostButton
          type="button"
          onClick={() => {
            if (onCancel) onCancel();
            else router.back();
          }}
          className="h-8 px-3 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-surface-hi flex items-center gap-1 cursor-pointer text-text hover:text-accent transition-colors shadow-xs"
          title="Return to previous screen"
        >
          « Back
        </GhostButton>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="animate-fade-in flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-success font-semibold text-xs shadow-xs">
          <CheckCircle2 size={16} className="shrink-0 text-success" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="animate-fade-in flex items-center gap-3 rounded-xl border border-error/30 bg-error/10 p-4 text-error font-semibold text-xs shadow-xs">
          <AlertCircle size={16} className="shrink-0 text-error" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Main Form Card matching screenshot layout & site color pattern */}
      <form onSubmit={handleSaveFixedAsset} className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        {/* Card Header Bar */}
        <div className="bg-surface-hi border-b border-border text-text px-5 py-2.5 text-center font-display font-bold text-sm sm:text-base tracking-wide shadow-xs flex items-center justify-center gap-2">
          <Warehouse size={16} className="text-accent" />
          <span>Add Fixed Asset</span>
        </div>

        <div className="p-5 sm:p-7 space-y-7">
          {/* SECTION A: Purchase Detail */}
          <div className="space-y-3">
            <h2 className="font-display text-xs sm:text-sm font-bold text-accent uppercase tracking-wider border-b border-border/70 pb-1.5">
              Purchase Detail
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* Supplier Name */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-muted block">
                    Supplier Name: <span className="text-error">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setModalError(null);
                      setIsAddSupplierModalOpen(true);
                    }}
                    className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-0.5 cursor-pointer"
                    title="Add new supplier / vendor"
                  >
                    <Plus size={11} />
                    <span>New Supplier</span>
                  </button>
                </div>
                <select
                  value={supplierId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "__ADD_NEW_SUPPLIER__") {
                      setModalError(null);
                      setIsAddSupplierModalOpen(true);
                      return;
                    }
                    setSupplierId(val);
                  }}
                  required
                  className="h-8.5 w-full rounded-lg border border-border bg-bg px-2.5 text-xs font-medium text-text focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="">--Select Supplier--</option>
                  <option value="__ADD_NEW_SUPPLIER__" className="font-bold text-accent bg-surface-hi">
                    New Suplier
                  </option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Purchase Date (in Nepali) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-muted block">
                  Purchase Date(in Nepali): <span className="text-error">*</span>
                </label>
                <Input
                  type="text"
                  value={purchaseDateBS}
                  onChange={(e) => setPurchaseDateBS(e.target.value)}
                  placeholder="e.g. 2083-5-19"
                  required
                  className="h-8.5 px-2.5 text-xs font-mono w-full"
                />
              </div>

              {/* Invoice/Bill Number */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-muted block">
                  Invoice/Bill Number: <span className="text-error">*</span>
                </label>
                <Input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="e.g. INV-FA-8910"
                  required
                  className="h-8.5 px-2.5 text-xs font-mono w-full"
                />
              </div>
            </div>
          </div>

          {/* SECTION B: Fixed Assets Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-1.5">
              <h2 className="font-display text-xs sm:text-sm font-bold text-accent uppercase tracking-wider">
                Fixed Assets Details
              </h2>
              {assetRows.length > 1 && (
                <span className="text-[11px] font-mono text-text-muted">
                  {assetRows.length} asset line items
                </span>
              )}
            </div>

            {assetRows.map((row, index) => (
              <div
                key={row.id}
                className="relative rounded-xl border border-border/80 bg-surface-hi/20 p-4 sm:p-5 space-y-4"
              >
                {assetRows.length > 1 && (
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="font-display text-xs font-bold text-text-muted">
                      Asset Item #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.id)}
                      className="text-xs font-semibold text-error hover:underline flex items-center gap-1 cursor-pointer"
                      title="Remove this asset line item"
                    >
                      <Trash2 size={12} />
                      <span>Remove</span>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 items-start">
                  {/* Left Column */}
                  <div className="space-y-3">
                    {/* Asset Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted block">
                        Asset Name <span className="text-error">*</span>
                      </label>
                      <Input
                        type="text"
                        value={row.assetName}
                        onChange={(e) => updateAssetRow(row.id, { assetName: e.target.value })}
                        placeholder="e.g. Tokheim 4-Nozzle Dispenser / 62.5 kVA Kirloskar Generator"
                        required
                        className="h-8.5 px-2.5 text-xs w-full"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted block">
                        Category
                      </label>
                      <select
                        value={row.category}
                        onChange={(e) => updateAssetRow(row.id, { category: e.target.value })}
                        className="h-8.5 w-full rounded-lg border border-border bg-bg px-2.5 text-xs font-medium text-text focus:outline-none focus:border-accent cursor-pointer"
                      >
                        <option value="">Select a Category</option>
                        {ASSET_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Serial Number */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted block">
                        Serial Number
                      </label>
                      <Input
                        type="text"
                        value={row.serialNumber}
                        onChange={(e) => updateAssetRow(row.id, { serialNumber: e.target.value })}
                        placeholder="e.g. SN-TKH-90213"
                        className="h-8.5 px-2.5 text-xs font-mono w-full"
                      />
                    </div>

                    {/* Model */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted block">
                        Model
                      </label>
                      <Input
                        type="text"
                        value={row.model}
                        onChange={(e) => updateAssetRow(row.id, { model: e.target.value })}
                        placeholder="e.g. Quantium 510M / KG62.5"
                        className="h-8.5 px-2.5 text-xs w-full"
                      />
                    </div>

                    {/* Details */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted block">
                        Details
                      </label>
                      <Input
                        type="text"
                        value={row.details}
                        onChange={(e) => updateAssetRow(row.id, { details: e.target.value })}
                        placeholder="Installation location, technical specs, capacity"
                        className="h-8.5 px-2.5 text-xs w-full"
                      />
                    </div>

                    {/* Vatable Checkbox */}
                    <div className="pt-1 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`vatable-${row.id}`}
                        checked={row.vatable}
                        onChange={(e) => updateAssetRow(row.id, { vatable: e.target.checked })}
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
                      />
                      <label
                        htmlFor={`vatable-${row.id}`}
                        className="text-xs font-semibold text-text cursor-pointer select-none"
                      >
                        Vatable
                      </label>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    {/* Ledger */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted block">
                        Ledger
                      </label>
                      <select
                        value={row.ledger}
                        onChange={(e) => updateAssetRow(row.id, { ledger: e.target.value })}
                        className="h-8.5 w-full rounded-lg border border-border bg-bg px-2.5 text-xs font-medium text-text focus:outline-none focus:border-accent cursor-pointer"
                      >
                        <option value="">--Select Ledger--</option>
                        {ASSET_LEDGERS.map((led) => (
                          <option key={led} value={led}>
                            {led}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted block">
                        Quantity
                      </label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={row.quantity}
                        onChange={(e) => updateAssetRow(row.id, { quantity: e.target.value })}
                        placeholder="1"
                        className="h-8.5 px-2.5 text-xs font-mono w-full"
                      />
                    </div>

                    {/* Purchase Cost */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted block">
                        Purchase Cost (NPR) <span className="text-error">*</span>
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={row.purchaseCost}
                        onChange={(e) => updateAssetRow(row.id, { purchaseCost: e.target.value })}
                        placeholder="0.00"
                        required
                        className="h-8.5 px-2.5 text-xs font-mono w-full font-bold"
                      />
                    </div>

                    {/* Expiry Date */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted block">
                        Expiry Date (Warranty / AMC)
                      </label>
                      <Input
                        type="date"
                        value={row.expiryDate}
                        onChange={(e) => updateAssetRow(row.id, { expiryDate: e.target.value })}
                        className="h-8.5 px-2.5 text-xs font-mono w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Bottom Right + Add More Button */}
            <div className="flex flex-col items-end gap-1 pt-1">
              <PrimaryButton
                type="button"
                onClick={handleAddMoreRow}
                className="h-7.5 px-3.5 text-xs font-semibold gap-1.5 shadow-xs"
                title="Add another fixed asset line item (Ctrl + A)"
              >
                <Plus size={13} />
                <span>Add More</span>
              </PrimaryButton>
              <span className="text-[10px] text-text-muted font-medium">
                Press Ctrl + A
              </span>
            </div>
          </div>

          {/* SECTION C: Amount Detail */}
          <div className="space-y-4 pt-2">
            <h2 className="font-display text-xs sm:text-sm font-bold text-accent uppercase tracking-wider border-b border-border/70 pb-1.5">
              Amount Detail
            </h2>

            {/* Row 1: Total Purchase Amount, Taxable Amount, Non Taxable Amount */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-muted block">
                    Total Purchase Amount: <span className="text-error">*</span>
                  </label>
                  <span className="text-[10px] text-text-muted">
                    {isTotalManual ? "(Manual)" : "(Auto)"}
                  </span>
                </div>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={totalAmount}
                  onChange={(e) => {
                    setTotalAmount(e.target.value);
                    setIsTotalManual(true);
                  }}
                  placeholder="0.00"
                  required
                  className="h-8.5 px-2.5 text-xs font-mono w-full font-bold"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-muted block">
                    Taxable Amount:
                  </label>
                  <span className="text-[10px] text-text-muted">
                    {isTaxableManual ? "(Manual)" : "(Auto)"}
                  </span>
                </div>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={taxableAmount}
                  onChange={(e) => {
                    setTaxableAmount(e.target.value);
                    setIsTaxableManual(true);
                  }}
                  placeholder="0.00"
                  className="h-8.5 px-2.5 text-xs font-mono w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-muted block">
                  Non Taxable Amount:
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={nonTaxableAmount}
                  onChange={(e) => setNonTaxableAmount(e.target.value)}
                  placeholder="0"
                  className="h-8.5 px-2.5 text-xs font-mono w-full bg-surface-hi/40"
                />
              </div>
            </div>

            {/* Row 2: Discount Amount, Vat Amount, Grand Total */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-muted block">
                  Discount Amount:
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="0"
                  className="h-8.5 px-2.5 text-xs font-mono w-full"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-muted block">
                    Vat Amount:
                  </label>
                  <span className="text-[10px] text-text-muted">
                    {isVatManual ? "(Manual)" : "(13% VAT)"}
                  </span>
                </div>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={vatAmount}
                  onChange={(e) => {
                    setVatAmount(e.target.value);
                    setIsVatManual(true);
                  }}
                  placeholder="0"
                  className="h-8.5 px-2.5 text-xs font-mono w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted block">
                  Grand Total:
                </label>
                <div className="h-8.5 px-3 rounded-lg border border-border/80 bg-surface-hi/80 flex items-center font-mono font-bold text-sm text-accent shadow-xs">
                  {grandTotal > 0 ? fmtRs(grandTotal) : "Rs 0.00"}
                </div>
              </div>
            </div>

            {/* Row 3: Purchase Description */}
            <div className="space-y-1 pt-1">
              <label className="text-xs font-semibold text-text-muted block">
                Purchase Description:
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="purchase Description here"
                className="w-full rounded-lg border border-border bg-bg p-2.5 text-xs font-sans text-text placeholder:text-text-muted/60 focus:outline-none focus:border-accent resize-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Bottom Action Bar matching site style pattern */}
        <div className="p-4 sm:p-5 border-t border-border bg-surface-hi/40 flex flex-col items-center justify-center gap-1.5">
          <PrimaryButton
            type="submit"
            disabled={isSubmitting}
            className="h-8.5 px-7 text-xs font-semibold shadow-xs"
          >
            {isSubmitting ? "Saving Fixed Asset..." : "Save Purchase"}
          </PrimaryButton>
          <span className="text-[10.5px] font-medium text-text-muted">
            Press Ctrl + D
          </span>
        </div>
      </form>

      {/* 4. "Add New Supplier" In-Line Modal Dialog */}
      {isAddSupplierModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseSupplierModal();
          }}
        >
          <div
            className="relative w-full max-w-[460px] rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-2xl space-y-4 my-auto animate-scale-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-add-supplier-title"
          >
            {/* Modal Title & Close Button */}
            <div className="relative pb-1">
              <h3
                id="modal-add-supplier-title"
                className="text-center font-display font-semibold text-sm sm:text-base text-text"
              >
                Add New Supplier
              </h3>
              <button
                type="button"
                onClick={handleCloseSupplierModal}
                className="absolute right-0 top-0 text-text-muted hover:text-text p-1 rounded-md hover:bg-surface-hi transition-colors cursor-pointer"
                title="Close modal"
              >
                <X size={15} />
              </button>
            </div>

            {/* Error Message inside modal */}
            {modalError && (
              <div className="rounded-lg border border-error/30 bg-error/10 p-2 text-xs text-error font-medium flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Modal Form Fields */}
            <form onSubmit={handleCreateSupplierFromModal} className="space-y-3">
              {/* Pan No. */}
              <div className="space-y-1">
                <label className="text-[11.5px] font-semibold text-text-muted block">
                  Pan No.
                </label>
                <Input
                  type="text"
                  placeholder="Enter 9-digit PAN"
                  value={newSupplierPan}
                  onChange={(e) => setNewSupplierPan(e.target.value)}
                  maxLength={15}
                  className="h-8 px-2.5 text-xs w-full font-mono"
                />
              </div>

              {/* Supplier Name * */}
              <div className="space-y-1">
                <label className="text-[11.5px] font-semibold text-text-muted block">
                  Supplier Name <span className="text-error">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Enter Supplier Name"
                  value={newSupplierName}
                  onChange={(e) => {
                    setNewSupplierName(e.target.value);
                    if (modalError) setModalError(null);
                  }}
                  required
                  autoFocus
                  className="h-8 px-2.5 text-xs w-full"
                />
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-[11.5px] font-semibold text-text-muted block">
                  Address
                </label>
                <Input
                  type="text"
                  placeholder="Enter Address"
                  value={newSupplierAddress}
                  onChange={(e) => setNewSupplierAddress(e.target.value)}
                  className="h-8 px-2.5 text-xs w-full"
                />
              </div>

              {/* Phone No. */}
              <div className="space-y-1">
                <label className="text-[11.5px] font-semibold text-text-muted block">
                  Phone No.
                </label>
                <Input
                  type="text"
                  placeholder="Enter Phone Number"
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  className="h-8 px-2.5 text-xs w-full font-mono"
                />
              </div>

              {/* Contact Person */}
              <div className="space-y-1">
                <label className="text-[11.5px] font-semibold text-text-muted block">
                  Contact Person
                </label>
                <Input
                  type="text"
                  placeholder="Enter Contact Person"
                  value={newSupplierContact}
                  onChange={(e) => setNewSupplierContact(e.target.value)}
                  className="h-8 px-2.5 text-xs w-full"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[11.5px] font-semibold text-text-muted block">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="Enter Email"
                  value={newSupplierEmail}
                  onChange={(e) => setNewSupplierEmail(e.target.value)}
                  className="h-8 px-2.5 text-xs w-full"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[11.5px] font-semibold text-text-muted block">
                  Category
                </label>
                <select
                  value={newSupplierCategory}
                  onChange={(e) => setNewSupplierCategory(e.target.value)}
                  className="h-8 w-full rounded-lg border border-border bg-bg px-2.5 text-xs font-medium text-text focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="">-------Choose Category-------</option>
                  {SUPPLIER_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-2 pt-3">
                <PrimaryButton
                  type="submit"
                  className="h-7.5 px-4 text-xs font-semibold"
                >
                  Add Supplier
                </PrimaryButton>
                <GhostButton
                  type="button"
                  onClick={handleCloseSupplierModal}
                  className="h-7.5 px-4 text-xs font-medium"
                >
                  Cancel
                </GhostButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
