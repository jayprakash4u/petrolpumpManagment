"use client";

import { useState } from "react";
import {
  Fuel,
  Printer,
  Download,
  Truck,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Banknote,
  Send,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { fmtRs, fmtL } from "@/lib/money";
import { MOCK_NOC_INDENTS, MOCK_NOC_PRICING_NOTICES } from "@/lib/mock/compliance";
import { evaluateDecantingLoss, type NocIndentOrder, type NocLoadingStatus } from "@/lib/compliance";

export function NocPortalView() {
  const [indents, setIndents] = useState<NocIndentOrder[]>(MOCK_NOC_INDENTS);
  const [pricingNotices] = useState(MOCK_NOC_PRICING_NOTICES);

  const totalOrderedLiters = indents.reduce((sum, i) => sum + i.orderedLiters, 0);
  const inTransitCount = indents.filter((i) => i.loadingStatus === "IN_TRANSIT").length;
  const deliveredCount = indents.filter((i) => i.loadingStatus === "DELIVERED_DECANTED").length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Indent Order No",
      "Date (BS)",
      "Depot",
      "Product",
      "Ordered Liters",
      "Rate (NPR/L)",
      "Total Cost (NPR)",
      "Tanker Plate No",
      "Driver Name",
      "Driver Phone",
      "Status",
      "Decanted Liters",
      "Decanting Loss (Liters)",
    ];

    const rows = indents.map((i) => [
      `"${i.indentNumber}"`,
      `"${i.dateBS}"`,
      `"${i.depotName}"`,
      `"${i.productType}"`,
      `"${i.orderedLiters}"`,
      `"${i.ratePerL}"`,
      `"${i.totalCostNpr}"`,
      `"${i.tankerPlateNo}"`,
      `"${i.driverName}"`,
      `"${i.driverPhone}"`,
      `"${i.loadingStatus}"`,
      `"${i.decantedLiters || ""}"`,
      `"${i.decantingLossLiters || 0}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `noc_indent_deliveries_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: NocLoadingStatus) => {
    switch (status) {
      case "IN_TRANSIT":
        return <Badge tone="accent">En-Route (In Transit)</Badge>;
      case "DELIVERED_DECANTED":
        return <Badge tone="success">Decanted to Tanks</Badge>;
      case "LOADING_AT_DEPOT":
        return <Badge tone="muted">Loading at Depot</Badge>;
      case "INDENT_PLACED":
        return <Badge tone="muted">Indent Placed</Badge>;
      case "PAYMENT_CONFIRMED":
        return <Badge tone="success">RTGS Confirmed</Badge>;
      case "CANCELLED":
        return <Badge tone="error">Cancelled</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Fuel size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              NOC Dealership Portal & Indent Allocation (नेपाल आयल निगम)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Petroleum indent orders, tanker loading tracking, wholesale pricing circulars, and decanting loss reconciliations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Indent Log
          </GhostButton>
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export CSV
          </GhostButton>
        </div>
      </div>

      {/* NOC Dealership Account & Advance Balance Strip */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-[12px] uppercase font-semibold tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
            <Building2 size={14} className="text-accent" /> NOC Dealership Account
          </div>
          <div className="space-y-1.5 text-[12.5px]">
            <div className="flex justify-between">
              <span className="text-text-muted">Dealer Code:</span>
              <span className="font-data font-semibold text-text">KTM-DEALER-4091</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Linked Depot:</span>
              <span className="font-medium text-text">Amlekhgunj / Thankot</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Quota Status:</span>
              <span className="text-success font-semibold">Active · 100% Allocation</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-[12px] uppercase font-semibold tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
            <Banknote size={14} className="text-success" /> Advance RTGS Balance with NOC
          </div>
          <div className="space-y-1.5 text-[12.5px]">
            <div className="flex justify-between">
              <span className="text-text-muted">Available Deposit:</span>
              <span className="font-data font-bold text-success text-[15px]">Rs 42,50,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Committed to Indents:</span>
              <span className="font-data text-text">Rs 28,00,000</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1">
              <span className="text-text-muted">Free Purchasing Power:</span>
              <span className="font-data font-semibold text-accent">Rs 14,50,000</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-[12px] uppercase font-semibold tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
            <Truck size={14} className="text-accent" /> Inbound Logistics
          </div>
          <div className="space-y-1.5 text-[12.5px]">
            <div className="flex justify-between">
              <span className="text-text-muted">Tankers En-Route:</span>
              <span className="font-bold text-accent">{inTransitCount} Tanker (20 KL)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Delivered This Week:</span>
              <span className="font-semibold text-text">{deliveredCount} Tankers (32 KL)</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1">
              <span className="text-text-muted">Avg Transit Duration:</span>
              <span className="text-text font-medium">6.5 Hours (Amlekhgunj)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official NOC Pricing Circulars */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display text-[15px] font-bold text-text">
            Official NOC Wholesale Pricing & Dealer Margin Structure (मूल्य संरचना)
          </h4>
          <Badge tone="accent">Effective BS: 2083-05-01</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pricingNotices.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-bg p-4 space-y-2 text-[12.5px]">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-semibold text-text text-[13.5px]">{p.product}</span>
                <span className="font-mono text-[11px] text-text-muted">{p.circularNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">NOC Wholesale Purchase Rate:</span>
                <span className="font-data font-bold text-text">Rs {p.newWholesaleRateNpr.toFixed(2)} / L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Prescribed Retail Selling Price:</span>
                <span className="font-data font-bold text-success">Rs {p.retailSellingPriceNpr.toFixed(2)} / L</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
                <span className="text-accent">Dealer Commission Margin:</span>
                <span className="font-data text-accent font-bold">Rs {p.dealerMarginNpr.toFixed(2)} / L</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active & Historical Indents Table */}
      <div className="space-y-3">
        <h4 className="font-display text-[15px] font-bold text-text">
          NOC Tanker Indents & Decanting Reconciliation
        </h4>

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead className="border-b border-border bg-surface-hi text-[11.5px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 py-3">Indent No</th>
                  <th className="px-3 py-3">Date (BS)</th>
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3 text-right">Volume</th>
                  <th className="px-3 py-3 text-right">Total Cost</th>
                  <th className="px-4 py-3">Tanker Plate & Driver</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-right">Decanted Vol</th>
                  <th className="px-4 py-3 text-right">Decanting Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-data">
                {indents.map((i) => {
                  const evalLoss = i.decantedLiters
                    ? evaluateDecantingLoss(i.orderedLiters, i.decantedLiters)
                    : null;
                  return (
                    <tr key={i.id} className="hover:bg-surface-hi/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-accent">
                        {i.indentNumber}
                      </td>
                      <td className="px-3 py-3 text-text-muted">{i.dateBS}</td>
                      <td className="px-3 py-3 font-body font-semibold text-text">
                        {i.productType === "PETROL_MS" ? "Petrol (MS 91)" : "Diesel (HSD Euro VI)"}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-text">
                        {fmtL(i.orderedLiters)}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-text">
                        {fmtRs(i.totalCostNpr)}
                      </td>
                      <td className="px-4 py-3 font-body">
                        <div className="font-mono font-semibold text-text">{i.tankerPlateNo}</div>
                        <div className="text-[11px] text-text-muted">
                          {i.driverName} ({i.driverPhone})
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-body">
                        {getStatusBadge(i.loadingStatus)}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-text">
                        {i.decantedLiters ? fmtL(i.decantedLiters) : "In Transit"}
                      </td>
                      <td className="px-4 py-3 text-right font-body">
                        {evalLoss ? (
                          <div>
                            <span className={evalLoss.isClaimableLoss ? "text-error font-bold" : "text-text"}>
                              {evalLoss.lossLiters} L ({evalLoss.lossPct}%)
                            </span>
                            <div className="text-[10.5px] text-text-muted">
                              {evalLoss.isClaimableLoss ? "⚠️ Claimable Loss" : "Within 0.20% Tolerance"}
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
