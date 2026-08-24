"use client";

import { useState } from "react";
import { Download, Printer, Filter, FileSpreadsheet, Building2, TrendingUp, IndianRupee } from "lucide-react";
import { MOCK_FUEL_PURCHASES, MOCK_INVENTORY_ITEMS, MOCK_STATION_EXPENSES, MOCK_SUPPLIERS } from "@/lib/mock/purchases";
import { fmtRs, fmtL } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";

export function PurchaseReportView() {
  const [selectedSupplier, setSelectedSupplier] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");

  const fuelTotal = MOCK_FUEL_PURCHASES.reduce((sum, f) => sum + f.totalAmountNpr, 0);
  const itemsTotal = MOCK_INVENTORY_ITEMS.reduce((sum, i) => sum + i.stockInHand * i.costPriceNpr, 0);
  const expenseTotal = MOCK_STATION_EXPENSES.reduce((sum, e) => sum + e.amountNpr, 0);
  const grandTotal = fuelTotal + itemsTotal + expenseTotal;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    alert("Exporting Purchase Audit Register (Bikram Sambat) to CSV...");
  };

  return (
    <div>
      {/* Filters & Export Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
            <Filter size={13} />
            <span>REPORT FILTER:</span>
          </div>

          <div className="w-[180px]">
            <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="py-1.5 text-xs">
              <option value="ALL">All Purchase Types</option>
              <option value="FUEL">Bulk Fuel Decantations</option>
              <option value="ITEMS">Lubricants & Spares</option>
              <option value="EXPENSES">Operational Expenses</option>
            </Select>
          </div>

          <div className="w-[200px]">
            <Select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="py-1.5 text-xs">
              <option value="ALL">All Suppliers & Payees</option>
              {MOCK_SUPPLIERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer size={14} />
            Print Report
          </GhostButton>
          <PrimaryButton onClick={handleExport} className="gap-1.5 text-xs">
            <Download size={14} />
            Export CSV
          </PrimaryButton>
        </div>
      </div>

      {/* Summary KPI Breakdown */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Bulk Fuel Decantations</div>
          <div className="font-data mt-1 text-xl font-bold text-accent">{fmtRs(fuelTotal)}</div>
          <div className="mt-1 text-[11px] text-text-muted">{MOCK_FUEL_PURCHASES.length} tanker deliveries</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Lubricants & Spares Stock</div>
          <div className="font-data mt-1 text-xl font-bold text-text">{fmtRs(itemsTotal)}</div>
          <div className="mt-1 text-[11px] text-text-muted">{MOCK_INVENTORY_ITEMS.length} inventory lines</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Operational Expenses</div>
          <div className="font-data mt-1 text-xl font-bold text-text">{fmtRs(expenseTotal)}</div>
          <div className="mt-1 text-[11px] text-text-muted">Month to date (Bhadra)</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Grand Procurement Spend</div>
          <div className="font-data mt-1 text-xl font-bold text-accent">{fmtRs(grandTotal)}</div>
          <div className="mt-1 text-[11px] text-success">VAT & Tax compliant</div>
        </div>
      </div>

      {/* Unified Procurement Audit Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
              <th className="px-3 py-2.5 font-medium">DATE (BS)</th>
              <th className="px-3 py-2.5 font-medium">DOCUMENT / INVOICE</th>
              <th className="px-3 py-2.5 font-medium">SUPPLIER / RECIPIENT</th>
              <th className="px-3 py-2.5 font-medium">CATEGORY</th>
              <th className="px-3 py-2.5 font-medium">PARTICULARS</th>
              <th className="px-3 py-2.5 text-right font-medium">VOLUME / QTY</th>
              <th className="px-3 py-2.5 text-right font-medium">TOTAL AMOUNT (NPR)</th>
              <th className="px-3 py-2.5 text-center font-medium">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_FUEL_PURCHASES.map((f) => (
              <tr key={f.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                <td className="px-3 py-3 font-data text-[12.5px] text-text">{f.dateBS}</td>
                <td className="px-3 py-3 font-data text-xs text-accent font-semibold">{f.invoiceNo}</td>
                <td className="px-3 py-3 text-[13px] text-text">{f.supplierName}</td>
                <td className="px-3 py-3">
                  <Badge tone="accent">Fuel Bulk</Badge>
                </td>
                <td className="px-3 py-3 text-xs text-text-muted">
                  {f.tankName} ({f.tankerNo})
                </td>
                <td className="px-3 py-3 text-right font-data text-[12.5px] text-text">{fmtL(f.litresDelivered)}</td>
                <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-accent">
                  {fmtRs(f.totalAmountNpr)}
                </td>
                <td className="px-3 py-3 text-center">
                  <Badge tone="success">PAID</Badge>
                </td>
              </tr>
            ))}

            {MOCK_STATION_EXPENSES.map((e) => (
              <tr key={e.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                <td className="px-3 py-3 font-data text-[12.5px] text-text">{e.dateBS}</td>
                <td className="px-3 py-3 font-data text-xs text-text-muted">{e.voucherNo}</td>
                <td className="px-3 py-3 text-[13px] text-text">{e.recipientName}</td>
                <td className="px-3 py-3">
                  <Badge tone="muted">Expense</Badge>
                </td>
                <td className="px-3 py-3 text-xs text-text-muted">{e.description}</td>
                <td className="px-3 py-3 text-right font-data text-[12.5px] text-text-muted">1 Voucher</td>
                <td className="px-3 py-3 text-right font-data text-[13px] font-semibold text-text">
                  {fmtRs(e.amountNpr)}
                </td>
                <td className="px-3 py-3 text-center">
                  <Badge tone="success">SETTLED</Badge>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-surface-hi/50 font-data text-[13px] font-bold text-text">
              <td colSpan={4} className="px-3 py-3 font-display">
                Total Procurement & Expense Spend
              </td>
              <td colSpan={2} />
              <td className="px-3 py-3 text-right text-accent">{fmtRs(grandTotal)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
