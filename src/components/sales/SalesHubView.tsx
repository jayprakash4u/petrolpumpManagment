"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Download,
  Printer,
  Edit,
  FileSpreadsheet,
  Fuel,
  Car,
  Receipt,
  User,
  Clock,
  Undo2,
  CheckCircle2,
  Calendar,
  Filter,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Banknote,
  QrCode,
  SlidersHorizontal,
} from "lucide-react";
import { clsx } from "clsx";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { fmtRs, fmtL } from "@/lib/money";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { BillDetailsModal } from "./BillDetailsModal";
import { NewSaleModal } from "./NewSaleModal";
import { PrintReceiptModal } from "./PrintReceiptModal";
import { EditBillModal } from "./EditBillModal";
import type { SalesPageData, SerializedSale, TankOption, CustomerOption } from "@/lib/queries/sales";

export function SalesHubView({
  initialData,
  canSell,
  canVoid,
}: {
  initialData: SalesPageData;
  canSell: boolean;
  canVoid: boolean;
}) {
  const [sales, setSales] = useState<SerializedSale[]>(initialData.sales);
  const [searchQuery, setSearchQuery] = useState("");
  const [fuelFilter, setFuelFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"ALL" | "RETURNS">("ALL");
  const [selectedSale, setSelectedSale] = useState<SerializedSale | null>(null);
  const [printingSale, setPrintingSale] = useState<SerializedSale | null>(null);
  const [editingSale, setEditingSale] = useState<SerializedSale | null>(null);
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Filtered sales calculation
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // Tab filter (All vs Returns)
      if (activeTab === "RETURNS" && !s.voided) return false;

      // Fuel filter
      if (fuelFilter !== "ALL" && s.fuel !== fuelFilter) return false;

      // Payment mode filter
      if (paymentFilter !== "ALL") {
        if (paymentFilter === "ONLINE" && s.paymentMethod !== "ONLINE") return false;
        if (paymentFilter === "CASH" && s.paymentMethod !== "CASH") return false;
        if (paymentFilter === "CARD" && s.paymentMethod !== "CARD") return false;
        if (paymentFilter === "CREDIT" && s.paymentMethod !== "CREDIT") return false;
      }

      // Universal Instant Search: Bill #, Vehicle plate, Customer name, Attendant
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchBill = s.billNumber.toLowerCase().includes(q) || String(s.receiptNo).includes(q);
        const matchVehicle = s.vehicleNo ? s.vehicleNo.toLowerCase().includes(q) : false;
        const matchCustomer = s.customerName ? s.customerName.toLowerCase().includes(q) : false;
        const matchAttendant = s.soldByName.toLowerCase().includes(q);
        if (!matchBill && !matchVehicle && !matchCustomer && !matchAttendant) {
          return false;
        }
      }

      return true;
    });
  }, [sales, activeTab, fuelFilter, paymentFilter, searchQuery]);

  // Vehicle History Intelligence Detection
  const vehicleSearchMatch = useMemo(() => {
    const q = searchQuery.trim().toUpperCase();
    if (q.length >= 4) {
      const vehicleSales = sales.filter((s) => s.vehicleNo && s.vehicleNo.toUpperCase().includes(q));
      if (vehicleSales.length > 0) {
        const totalLiters = vehicleSales.reduce((sum, s) => sum + s.liters, 0);
        const totalSpend = vehicleSales.reduce((sum, s) => sum + s.totalAmount, 0);
        return {
          plate: vehicleSales[0].vehicleNo || q,
          count: vehicleSales.length,
          totalLiters,
          totalSpend,
        };
      }
    }
    return null;
  }, [searchQuery, sales]);

  const handleSaleVoided = (voidedId: string) => {
    setSales((prev) =>
      prev.map((s) =>
        s.id === voidedId
          ? { ...s, voided: true, voidReason: "Reversed / Sales Return" }
          : s
      )
    );
  };

  const handleExportCSV = () => {
    const headers = [
      "Bill Number",
      "Receipt No",
      "Date & Time",
      "Vehicle Plate",
      "Customer",
      "Fuel Grade",
      "Volume (Liters)",
      "Unit Rate (NPR/L)",
      "Total Amount (NPR)",
      "Payment Mode",
      "Attendant",
      "Status",
    ];

    const rows = filteredSales.map((s) => [
      `"${s.billNumber}"`,
      `"${s.receiptNo}"`,
      `"${s.createdAt}"`,
      `"${s.vehicleNo || ""}"`,
      `"${s.customerName || "Walk-In"}"`,
      `"${s.fuel}"`,
      `"${s.liters}"`,
      `"${s.ratePerL}"`,
      `"${s.totalAmount}"`,
      `"${s.paymentMethod}"`,
      `"${s.soldByName}"`,
      `"${s.voided ? "VOIDED RETURN" : "PAID"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `sales_bills_register_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);
  };

  const handlePrintRegister = () => {
    window.print();
    setIsExportOpen(false);
  };

  const getPaymentBadge = (method: string) => {
    switch (method) {
      case "CASH":
        return <Badge tone="success">CASH</Badge>;
      case "ONLINE":
        return <Badge tone="accent">QR / ONLINE</Badge>;
      case "CARD":
        return <Badge tone="accent">POS CARD</Badge>;
      case "CREDIT":
        return <Badge tone="muted">CREDIT</Badge>;
      default:
        return <Badge tone="muted">{method}</Badge>;
    }
  };

  return (
    <div className="space-y-5 w-full">
      {/* 1. Header Bar: Title, Search, Export & New Sale Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Receipt size={22} />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Sales (बिक्री कारोबार केन्द्र)
            </h2>
            <p className="text-[12px] text-text-muted">
              Unified bill search, fast dispensing entry, reprint slips, vehicle history, and returns.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Export Dropdown */}
          <div className="relative">
            <GhostButton
              type="button"
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="text-[13px] font-medium"
            >
              <Download size={15} /> Export <span className="text-[10px]">▼</span>
            </GhostButton>

            {isExportOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-40 w-48 rounded-xl border border-border bg-surface p-1.5 shadow-xl animate-fade-in">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12.5px] text-text hover:bg-surface-hi transition-colors"
                >
                  <FileSpreadsheet size={14} className="text-success" /> Export as CSV (.csv)
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12.5px] text-text hover:bg-surface-hi transition-colors"
                >
                  <FileSpreadsheet size={14} className="text-accent" /> Export for Excel (.csv)
                </button>
                <button
                  type="button"
                  onClick={handlePrintRegister}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12.5px] text-text hover:bg-surface-hi transition-colors"
                >
                  <Printer size={14} className="text-text-muted" /> Print Register (PDF)
                </button>
              </div>
            )}
          </div>

          {/* New Sale Button */}
          {canSell && (
            <PrimaryButton
              type="button"
              onClick={() => setIsNewSaleOpen(true)}
              className="px-4 py-2 text-[13.5px] shadow-sm"
            >
              <Plus size={16} className="stroke-[3]" /> New Sale
            </PrimaryButton>
          )}
        </div>
      </div>

      {/* 2. Universal Search & Filter Strip */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Universal Search Input */}
          <div className="flex flex-1 min-w-[280px] items-center gap-2.5 rounded-xl border border-border bg-bg px-3.5 py-2 text-text transition-colors focus-within:border-accent">
            <Search size={16} className="text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-[13.5px] text-text focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[11.5px] text-text-muted hover:text-text"
              >
                Clear
              </button>
            )}
          </div>

          {/* Tab Selector: All Sales vs Returns */}
          <div className="flex gap-1 rounded-xl border border-border bg-bg p-1 text-[12px]">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={clsx(
                "rounded-lg px-3 py-1.5 font-semibold transition-colors",
                activeTab === "ALL"
                  ? "bg-accent/15 text-accent"
                  : "text-text-muted hover:text-text"
              )}
            >
              All Sales ({sales.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("RETURNS")}
              className={clsx(
                "rounded-lg px-3 py-1.5 font-semibold transition-colors flex items-center gap-1",
                activeTab === "RETURNS"
                  ? "bg-error/15 text-error"
                  : "text-text-muted hover:text-text"
              )}
            >
              <Undo2 size={13} /> Returns ({sales.filter((s) => s.voided).length})
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-[12.5px]">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Filter size={13} /> Filters:
          </div>

          {/* Fuel Filter */}
          <select
            value={fuelFilter}
            onChange={(e) => setFuelFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
          >
            <option value="ALL">All Fuels</option>
            <option value="PETROL">Petrol (MS 91)</option>
            <option value="DIESEL">Diesel (HSD)</option>
            <option value="CNG">CNG</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="CASH">Cash (नगद)</option>
            <option value="ONLINE">QR / Wallet (Fonepay/eSewa)</option>
            <option value="CARD">Card / POS</option>
            <option value="CREDIT">Credit (खाता)</option>
          </select>

          <span className="text-[12px] text-text-muted ml-auto">
            Showing <strong>{filteredSales.length}</strong> transactions
          </span>
        </div>
      </div>

      {/* 3. Vehicle History Intelligence Card (shows when user searches a vehicle plate) */}
      {vehicleSearchMatch && (
        <div className="animate-fade-in flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
              <Car size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-text text-[15px]">
                  Vehicle History:
                </span>
                <span className="font-mono bg-bg px-2.5 py-0.5 rounded text-[13px] font-bold text-accent">
                  {vehicleSearchMatch.plate}
                </span>
              </div>
              <div className="text-[12px] text-text-muted mt-0.5">
                Matched <strong>{vehicleSearchMatch.count}</strong> visits · Total Volume:{" "}
                <strong>{fmtL(vehicleSearchMatch.totalLiters)}</strong> · Total Spend:{" "}
                <strong>{fmtRs(vehicleSearchMatch.totalSpend)}</strong>
              </div>
            </div>
          </div>

          <span className="text-[11.5px] text-accent font-semibold">
            Filtered below in table ↓
          </span>
        </div>
      )}

      {/* 4. The Unified Sales & Bills Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-hi text-[11.5px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3.5">Bill #</th>
                <th className="px-3 py-3.5">Time</th>
                <th className="px-3 py-3.5">Vehicle</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-3 py-3.5">Fuel</th>
                <th className="px-3 py-3.5 text-right">Qty</th>
                <th className="px-4 py-3.5 text-right font-bold">Amount</th>
                <th className="px-3 py-3.5 text-center">Payment</th>
                <th className="px-3 py-3.5 text-center">Status</th>
                <th className="px-3 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-text-muted">
                    No sales matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const fuelId = s.fuel as FuelId;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSale(s)}
                      className={clsx(
                        "cursor-pointer hover:bg-surface-hi/70 transition-colors",
                        s.voided && "opacity-60 bg-error/5"
                      )}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-accent">
                        {s.billNumber}
                      </td>
                      <td className="px-3 py-3 text-text-muted">{s.formattedTime}</td>
                      <td className="px-3 py-3 font-body">
                        {s.vehicleNo ? (
                          <span className="font-mono bg-bg border border-border px-2 py-0.5 rounded text-[11.5px] font-bold text-text">
                            {s.vehicleNo}
                          </span>
                        ) : (
                          <span className="text-[11.5px] text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-body font-medium text-text">
                        {s.customerName || (
                          <span className="text-text-muted text-[11.5px]">Walk-In Cash</span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-body">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={clsx(
                              "h-2 w-2 rounded-full",
                              fuelId === "PETROL"
                                ? "bg-amber-500"
                                : fuelId === "DIESEL"
                                ? "bg-blue-500"
                                : "bg-emerald-500"
                            )}
                          />
                          <span className="font-medium text-text">{FUEL_LABEL[fuelId]}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-text">
                        {fmtL(s.liters)}
                      </td>
                      <td
                        className={clsx(
                          "px-4 py-3 text-right font-bold text-[13.5px]",
                          s.voided ? "line-through text-text-muted" : "text-text"
                        )}
                      >
                        {fmtRs(s.totalAmount)}
                      </td>
                      <td className="px-3 py-3 text-center font-body">
                        {getPaymentBadge(s.paymentMethod)}
                      </td>
                      <td className="px-3 py-3 text-center font-body">
                        {s.voided ? (
                          <Badge tone="error">RETURNED</Badge>
                        ) : (
                          <span className="text-[11.5px] text-success font-semibold flex items-center justify-center gap-1">
                            <CheckCircle2 size={12} /> PAID
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-body">
                        <div className="flex items-center justify-end gap-1">
                          {/* 1-Click Print Duplicate */}
                          <GhostButton
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrintingSale(s);
                            }}
                            className="px-2 py-1 text-[11.5px]"
                            title="Print Receipt Slip"
                          >
                            <Printer size={13} />
                          </GhostButton>

                          {/* Quick Edit */}
                          {!s.voided && (
                            <GhostButton
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSale(s);
                              }}
                              className="px-2 py-1 text-[11.5px]"
                              title="Edit Bill Details"
                            >
                              <Edit size={13} />
                            </GhostButton>
                          )}

                          {/* Full Drawer View */}
                          <GhostButton
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSale(s);
                            }}
                            className="text-[11.5px] px-2 py-1 font-semibold"
                          >
                            View
                          </GhostButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Bill Details Slide-Over Drawer */}
      {selectedSale && (
        <BillDetailsModal
          sale={selectedSale}
          canVoid={canVoid}
          customers={initialData.customers}
          stationName={initialData.stationName}
          business={initialData.invoiceConfig}
          settings={initialData.invoiceConfig}
          onClose={() => setSelectedSale(null)}
          onSaleVoided={handleSaleVoided}
        />
      )}

      {/* 6. Print Thermal Slip Modal */}
      {printingSale && (
        <PrintReceiptModal
          sale={printingSale}
          stationName={initialData.stationName}
          business={initialData.invoiceConfig}
          settings={initialData.invoiceConfig}
          onClose={() => setPrintingSale(null)}
        />
      )}

      {/* 7. Quick Edit Bill Modal */}
      {editingSale && (
        <EditBillModal
          sale={editingSale}
          customers={initialData.customers}
          onClose={() => setEditingSale(null)}
          onSaved={() => {
            // Refetched or revalidated on next load
          }}
        />
      )}

      {/* 8. Fast New Sale Modal (Opens on + New Sale button) */}
      {isNewSaleOpen && (
        <NewSaleModal
          tanks={initialData.tanks}
          customers={initialData.customers}
          canSell={canSell}
          invoiceConfig={initialData.invoiceConfig}
          onClose={() => setIsNewSaleOpen(false)}
        />
      )}
    </div>
  );
}
