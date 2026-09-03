"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Check } from "lucide-react";
import { fmtRs } from "@/lib/money";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { Input } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { updatePurchaseAction } from "@/lib/actions/purchase-bill";
import type { PurchaseRegisterData, PurchaseRegisterRow } from "@/lib/queries/purchase-register";

function EditRow({ row, onDone }: { row: PurchaseRegisterRow; onDone: () => void }) {
  const router = useRouter();
  const [invoiceNo, setInvoiceNo] = useState(row.invoiceNo ?? "");
  const [supplier, setSupplier] = useState(row.supplier);
  const [supplierPan, setSupplierPan] = useState(row.supplierPan ?? "");
  const [tankerNo, setTankerNo] = useState(row.tankerNo ?? "");
  const [remarks, setRemarks] = useState(row.remarks ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSave = () => {
    const formData = new FormData();
    formData.set("purchaseId", row.id);
    formData.set("invoiceNo", invoiceNo);
    formData.set("supplier", supplier);
    formData.set("supplierPan", supplierPan);
    formData.set("tankerNo", tankerNo);
    formData.set("remarks", remarks);

    startTransition(async () => {
      const result = await updatePurchaseAction({}, formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
        onDone();
      }
    });
  };

  return (
    <tr className="border-b border-border/60 bg-accent/5">
      <td colSpan={9} className="px-3 py-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-text-muted">
            Bill Number
            <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="text-[12.5px]" />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-text-muted">
            Supplier Name
            <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} className="text-[12.5px]" />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-text-muted">
            Supplier PAN
            <Input value={supplierPan} onChange={(e) => setSupplierPan(e.target.value)} className="text-[12.5px]" />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-text-muted">
            Tanker No.
            <Input value={tankerNo} onChange={(e) => setTankerNo(e.target.value)} className="text-[12.5px]" />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-text-muted">
            Remarks
            <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} className="text-[12.5px]" />
          </label>
        </div>

        {error && <p className="mt-2 text-[12px] text-error">{error}</p>}

        <div className="mt-3 flex items-center justify-end gap-2">
          <GhostButton type="button" onClick={onDone} className="gap-1 text-xs">
            <X size={13} /> Cancel
          </GhostButton>
          <PrimaryButton type="button" onClick={handleSave} disabled={pending} className="gap-1 text-xs">
            <Check size={13} /> {pending ? "Saving…" : "Save"}
          </PrimaryButton>
        </div>
      </td>
    </tr>
  );
}

export function EditPurchaseRegisterView({ data }: { data: PurchaseRegisterData }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-245 border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-surface-hi font-data text-[11px] tracking-wide text-text-muted">
            <th className="px-3 py-2.5 font-medium">DATE (BS)</th>
            <th className="px-3 py-2.5 font-medium">BILL NUMBER</th>
            <th className="px-3 py-2.5 font-medium">SUPPLIER</th>
            <th className="px-3 py-2.5 font-medium">SUPPLIER PAN</th>
            <th className="px-3 py-2.5 font-medium">FUEL</th>
            <th className="px-3 py-2.5 text-right font-medium">VOLUME</th>
            <th className="px-3 py-2.5 text-right font-medium">TOTAL (RS)</th>
            <th className="px-3 py-2.5 font-medium">TANKER NO.</th>
            <th className="px-3 py-2.5 font-medium">ACTION</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-3 py-10 text-center text-xs text-text-muted">
                No purchases recorded in this range.
              </td>
            </tr>
          ) : (
            data.rows.map((r) =>
              editingId === r.id ? (
                <EditRow key={r.id} row={r} onDone={() => setEditingId(null)} />
              ) : (
                <tr key={r.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                  <td className="px-3 py-3 font-data text-[12.5px] text-text">{r.purchaseDateBS ?? "—"}</td>
                  <td className="px-3 py-3 font-data text-xs font-semibold text-accent">{r.invoiceNo ?? "—"}</td>
                  <td className="px-3 py-3 text-[13px] text-text">{r.supplier}</td>
                  <td className="px-3 py-3 font-data text-[12px] text-text-muted">{r.supplierPan ?? "—"}</td>
                  <td className="px-3 py-3 text-[12.5px] text-text">{FUEL_LABEL[r.fuel as FuelId] ?? r.fuel}</td>
                  <td className="px-3 py-3 text-right font-data text-[12.5px] text-text">{Number(r.liters).toLocaleString("en-IN")} L</td>
                  <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-accent">{fmtRs(r.totalAmount)}</td>
                  <td className="px-3 py-3 font-data text-[12px] text-text-muted">{r.tankerNo ?? "—"}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(r.id)}
                      className="flex items-center gap-1 text-[11.5px] font-semibold text-accent hover:underline"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  </td>
                </tr>
              )
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
