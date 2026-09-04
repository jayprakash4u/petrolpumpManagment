"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
  Truck,
  Shield,
  FileCheck,
  PackagePlus,
  ArrowLeft,
  Plus,
  X,
} from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input, Field, Select } from "@/components/ui/Field";
import type { Supplier } from "@/lib/purchases";
import { MOCK_SUPPLIERS } from "@/lib/mock/purchases";
import { fmtBSDate } from "@/lib/bs-date";
import { fmtRs } from "@/lib/money";

export interface OtherItemPurchaseRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  purchaseDateBS: string;
  invoiceNo: string;
  totalPurchaseAmount: number;
  discountAmount: number;
  nonTaxableAmount: number;
  taxableAmount: number;
  vatAmount: number;
  shippingAmount: number;
  insuranceAmount: number;
  clearanceExpense: number;
  importDuty: number;
  grandTotal: number;
  description: string;
  fileName?: string;
  createdAt: string;
}

const STORAGE_KEY = "fsm_other_item_purchases";
const SUPPLIERS_STORAGE_KEY = "fsm_suppliers";

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

export function AddOtherItemPurchaseForm({
  onSaved,
  onCancel,
}: {
  onSaved?: (record: OtherItemPurchaseRecord) => void;
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

  // 2. Amount Detail State
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<string>("0");
  const [nonTaxableAmount, setNonTaxableAmount] = useState<string>("0");
  const [taxableAmount, setTaxableAmount] = useState<string>("");
  const [vatAmount, setVatAmount] = useState<string>("0");
  const [shippingAmount, setShippingAmount] = useState<string>("0");
  const [insuranceAmount, setInsuranceAmount] = useState<string>("0");
  const [clearanceExpense, setClearanceExpense] = useState<string>("0");
  const [importDuty, setImportDuty] = useState<string>("0");
  const [description, setDescription] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Auto-calculation tracking
  const [isTaxableManual, setIsTaxableManual] = useState(false);
  const [isVatManual, setIsVatManual] = useState(false);

  // Form submission feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-calculate Taxable Amount & VAT if not manually overridden
  useEffect(() => {
    const tot = parseFloat(totalAmount) || 0;
    const disc = parseFloat(discountAmount) || 0;
    const nonTax = parseFloat(nonTaxableAmount) || 0;

    if (!isTaxableManual) {
      const calcTaxable = Math.max(0, tot - disc - nonTax);
      setTaxableAmount(calcTaxable > 0 ? calcTaxable.toFixed(2) : "");

      if (!isVatManual) {
        const calcVat = calcTaxable * 0.13;
        setVatAmount(calcVat > 0 ? calcVat.toFixed(2) : "0");
      }
    }
  }, [totalAmount, discountAmount, nonTaxableAmount, isTaxableManual, isVatManual]);

  // Compute Grand Total
  const grandTotal = useMemo(() => {
    const tot = parseFloat(totalAmount) || 0;
    const disc = parseFloat(discountAmount) || 0;
    const vat = parseFloat(vatAmount) || 0;
    const ship = parseFloat(shippingAmount) || 0;
    const ins = parseFloat(insuranceAmount) || 0;
    const clear = parseFloat(clearanceExpense) || 0;
    const duty = parseFloat(importDuty) || 0;

    // Grand Total = (Total - Discount) + VAT + Shipping + Insurance + Clearance + Duty
    return Math.max(0, tot - disc + vat + ship + ins + clear + duty);
  }, [
    totalAmount,
    discountAmount,
    vatAmount,
    shippingAmount,
    insuranceAmount,
    clearanceExpense,
    importDuty,
  ]);

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

    // Automatically set the new supplier as selected
    setSupplierId(newSupplier.id);

    // Reset modal fields and close
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

  // Save Purchase Handler
  const handleSavePurchase = (e?: React.FormEvent) => {
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

    const tot = parseFloat(totalAmount) || 0;
    if (tot <= 0) {
      setErrorMessage("Please enter a valid Total Purchase Amount.");
      return;
    }

    setIsSubmitting(true);

    const selectedSupplier = suppliers.find((s) => s.id === supplierId);
    const supplierName = selectedSupplier ? selectedSupplier.name : supplierId;

    const newPurchase: OtherItemPurchaseRecord = {
      id: `purch-${Date.now()}`,
      supplierId,
      supplierName,
      purchaseDateBS: purchaseDateBS.trim() || "2083-05-19",
      invoiceNo: invoiceNo.trim(),
      totalPurchaseAmount: tot,
      discountAmount: parseFloat(discountAmount) || 0,
      nonTaxableAmount: parseFloat(nonTaxableAmount) || 0,
      taxableAmount: parseFloat(taxableAmount) || 0,
      vatAmount: parseFloat(vatAmount) || 0,
      shippingAmount: parseFloat(shippingAmount) || 0,
      insuranceAmount: parseFloat(insuranceAmount) || 0,
      clearanceExpense: parseFloat(clearanceExpense) || 0,
      importDuty: parseFloat(importDuty) || 0,
      grandTotal,
      description: description.trim(),
      fileName: selectedFile ? selectedFile.name : undefined,
      createdAt: new Date().toISOString(),
    };

    // Save to LocalStorage
    try {
      const existingStr = localStorage.getItem(STORAGE_KEY);
      const existing: OtherItemPurchaseRecord[] = existingStr ? JSON.parse(existingStr) : [];
      const updated = [newPurchase, ...existing];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(`Purchase invoice #${invoiceNo} from ${supplierName} saved successfully!`);

      if (onSaved) {
        onSaved(newPurchase);
      }

      // Reset form after short delay
      setTimeout(() => {
        setSupplierId("");
        setInvoiceNo("");
        setTotalAmount("");
        setDiscountAmount("0");
        setNonTaxableAmount("0");
        setTaxableAmount("");
        setVatAmount("0");
        setShippingAmount("0");
        setInsuranceAmount("0");
        setClearanceExpense("0");
        setImportDuty("0");
        setDescription("");
        setSelectedFile(null);
        setIsTaxableManual(false);
        setIsVatManual(false);
        setSuccessMessage(null);
      }, 2000);
    }, 600);
  };

  // Keyboard shortcut listener: Ctrl + D or Ctrl + S to save, Escape to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAddSupplierModalOpen) {
        e.preventDefault();
        handleCloseSupplierModal();
        return;
      }
      if (
        !isAddSupplierModalOpen &&
        (e.ctrlKey || e.metaKey) &&
        (e.key === "d" || e.key === "D" || e.key === "s" || e.key === "S")
      ) {
        e.preventDefault();
        handleSavePurchase();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full min-w-0 animate-fade-in pb-12">
      {/* 1. Header Bar matching site pattern */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-text tracking-tight">
            Purchase management
          </h1>
          <p className="text-[11.5px] text-text-muted hidden sm:block">
            Record goods, spares, consumables, and other inventory procurements with statutory IRD tax breakdowns.
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

      {/* 2. Main "Add Purchase" Form Card matching site style pattern */}
      <form onSubmit={handleSavePurchase} className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        {/* Card Ribbon / Header Bar */}
        <div className="bg-surface-hi border-b border-border text-text px-5 py-2.5 text-center font-display font-bold text-sm sm:text-base tracking-wide shadow-xs flex items-center justify-center gap-2">
          <PackagePlus size={16} className="text-accent" />
          <span>Add Purchase</span>
        </div>

        <div className="p-5 sm:p-7 space-y-6">
          {/* SECTION A: Purchase Detail */}
          <div className="space-y-3">
            <h2 className="font-display text-sm font-bold text-text tracking-tight border-b border-border/70 pb-1.5">
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
                    title="Add new vendor / supplier"
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
                  placeholder="e.g. INV-9021"
                  required
                  className="h-8.5 px-2.5 text-xs font-mono w-full"
                />
              </div>
            </div>
          </div>

          {/* SECTION B: Amount Detail */}
          <div className="space-y-4 pt-2">
            <h2 className="font-display text-sm font-bold text-text tracking-tight border-b border-border/70 pb-1.5">
              Amount Detail
            </h2>

            {/* Row 1: Total Purchase Amount, Discount Amount */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-muted block">
                  Total Purchase Amount: <span className="text-error">*</span>
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="h-8.5 px-2.5 text-xs font-mono w-full font-bold"
                />
              </div>

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

              <div className="hidden md:block" />
            </div>

            {/* Row 2: Non Taxable Amount, Taxable Amount, Vat Amount */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
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
            </div>

            {/* Row 3: Shipping Amount */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-muted block">
                  Shipping Amount:
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={shippingAmount}
                  onChange={(e) => setShippingAmount(e.target.value)}
                  placeholder="0"
                  className="h-8.5 px-2.5 text-xs font-mono w-full"
                />
              </div>
              <div className="hidden md:block" />
              <div className="hidden md:block" />
            </div>

            {/* Row 4: Insurance Amount, Other clearance Expense, Import/Exercise Duty */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-muted block">
                  Insurance Amount:
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={insuranceAmount}
                  onChange={(e) => setInsuranceAmount(e.target.value)}
                  placeholder="0"
                  className="h-8.5 px-2.5 text-xs font-mono w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-muted block">
                  Other clearance Expense:
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={clearanceExpense}
                  onChange={(e) => setClearanceExpense(e.target.value)}
                  placeholder="0"
                  className="h-8.5 px-2.5 text-xs font-mono w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-muted block">
                  Import/Exercise Duty:
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={importDuty}
                  onChange={(e) => setImportDuty(e.target.value)}
                  placeholder="0"
                  className="h-8.5 px-2.5 text-xs font-mono w-full"
                />
              </div>
            </div>

            {/* Row 5: Scanned Bill Upload, Purchase Description, Grand Total */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start pt-1">
              {/* File Upload */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-muted block">
                  Upload scanned purchase bill:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="text-xs text-text-muted file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border file:border-border file:bg-surface file:text-xs file:font-semibold file:text-text hover:file:bg-surface-hi cursor-pointer"
                  />
                </div>
                {selectedFile && (
                  <span className="text-[11px] text-success font-mono block truncate mt-1">
                    ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>

              {/* Purchase Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-muted block">
                  Purchase Description:
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="purchase Description here"
                  className="w-full rounded-lg border border-border bg-bg p-2 text-xs font-sans text-text placeholder:text-text-muted/60 focus:outline-none focus:border-accent resize-none"
                />
              </div>

              {/* Grand Total */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted block">
                  Grand Total:
                </label>
                <div className="h-9 px-3 rounded-lg border border-border/80 bg-surface-hi/80 flex items-center font-mono font-bold text-sm text-accent shadow-xs">
                  {grandTotal > 0 ? fmtRs(grandTotal) : "Rs 0.00"}
                </div>
                <span className="text-[10px] text-text-muted block">
                  Net invoice payable with all duties & taxes
                </span>
              </div>
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
            {isSubmitting ? "Saving Purchase..." : "Save Purchase"}
          </PrimaryButton>
          <span className="text-[10.5px] font-medium text-text-muted">
            Press Ctrl + D
          </span>
        </div>
      </form>

      {/* 4. "Add New Supplier" In-Line Modal Dialog matching site style pattern */}
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
