"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, Printer, FileText, UserCheck, ArrowRightLeft } from "lucide-react";
import type { ShiftReconciliationData } from "@/lib/meter";
import { FUEL_LABEL } from "@/lib/fuel";
import { FUEL_ICON } from "@/components/fuel-icons";
import { fmtL, fmtRs, fmtRate } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

export function ReconciliationMatrix({ data }: { data: ShiftReconciliationData }) {
  const [signed, setSigned] = useState(data.status === "reconciled");
  const [activeTab, setActiveTab] = useState<"fuels" | "financials">("fuels");

  const totalPhysicalDepletion = data.fuels.reduce((sum, f) => sum + f.physicalDepletionL, 0);
  const totalNozzleSales = data.fuels.reduce((sum, f) => sum + f.nozzleTotaliserSoldL, 0);
  const totalPosBilled = data.fuels.reduce((sum, f) => sum + f.posBilledL, 0);
  const totalVarianceL = totalNozzleSales - totalPhysicalDepletion;

  const handleSignOff = () => {
    setSigned(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner with Shift Info & Sign-off */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-bg p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <ArrowRightLeft size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold text-text">
                {data.shift} · {data.dateBS}
              </h3>
              {signed ? (
                <Badge tone="success">
                  <CheckCircle2 size={11} />
                  RECONCILED & SIGNED
                </Badge>
              ) : (
                <Badge tone="accent">
                  <AlertTriangle size={11} />
                  PENDING SIGN-OFF
                </Badge>
              )}
            </div>
            <p className="text-xs text-text-muted">
              Supervisor: <span className="font-medium text-text">{data.supervisorName}</span> · Attendants:{" "}
              <span className="font-medium text-text">{data.attendants.join(", ")}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <GhostButton onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer size={14} />
            Print Shift Sheet
          </GhostButton>

          {!signed ? (
            <PrimaryButton onClick={handleSignOff} className="gap-1.5 text-xs">
              <ShieldCheck size={14} />
              Approve & Close Shift
            </PrimaryButton>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/10 px-3 py-1.5 font-data text-xs font-semibold text-success">
              <CheckCircle2 size={14} />
              Shift Closed
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("fuels")}
          className={`cursor-pointer rounded-lg px-4 py-2 font-display text-xs font-semibold transition-colors ${
            activeTab === "fuels"
              ? "bg-accent/15 text-accent"
              : "text-text-muted hover:bg-surface-hi hover:text-text"
          }`}
        >
          1. Fuel & Stock Reconciliation (Litres)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("financials")}
          className={`cursor-pointer rounded-lg px-4 py-2 font-display text-xs font-semibold transition-colors ${
            activeTab === "financials"
              ? "bg-accent/15 text-accent"
              : "text-text-muted hover:bg-surface-hi hover:text-text"
          }`}
        >
          2. Cash & Collections Balancing (NPR)
        </button>
      </div>

      {/* Fuel Reconciliation Matrix */}
      {activeTab === "fuels" ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
                <th className="px-3 py-2.5 font-medium">FUEL PRODUCT</th>
                <th className="px-3 py-2.5 text-right font-medium">OPENING DIP</th>
                <th className="px-3 py-2.5 text-right font-medium">CLOSING DIP</th>
                <th className="px-3 py-2.5 text-right font-medium">PHYSICAL DROP</th>
                <th className="px-3 py-2.5 text-right font-medium">NOZZLE TOTALS</th>
                <th className="px-3 py-2.5 text-right font-medium">POS BILLED</th>
                <th className="px-3 py-2.5 text-right font-medium">DIP VARIANCE</th>
                <th className="px-3 py-2.5 text-right font-medium">PUMP REVENUE</th>
                <th className="px-3 py-2.5 text-center font-medium">TOLERANCE</th>
              </tr>
            </thead>
            <tbody>
              {data.fuels.map((f) => {
                const Icon = FUEL_ICON[f.fuel];
                return (
                  <tr key={f.fuel} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-accent" />
                        <span className="font-display text-[13.5px] font-semibold text-text">
                          {FUEL_LABEL[f.fuel]}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[12.5px] text-text-muted">
                      {fmtL(f.openingDipL)}
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[12.5px] text-text-muted">
                      {fmtL(f.closingDipL)}
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[13px] font-semibold text-text">
                      {fmtL(f.physicalDepletionL)}
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-accent">
                      {fmtL(f.nozzleTotaliserSoldL)}
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[13px] text-text">
                      {fmtL(f.posBilledL)}
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[12.5px]">
                      <span className={f.volumeVarianceL < 0 ? "text-error font-semibold" : "text-success font-semibold"}>
                        {f.volumeVarianceL > 0 ? `+${fmtL(f.volumeVarianceL)}` : fmtL(f.volumeVarianceL)}
                      </span>
                      <div className="text-[10px] text-text-muted">({f.variancePct.toFixed(2)}%)</div>
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-text">
                      {fmtRs(f.pumpRevenue)}
                    </td>

                    <td className="px-3 py-3 text-center">
                      <Badge tone={Math.abs(f.variancePct) <= 0.5 ? "success" : "error"}>
                        {Math.abs(f.variancePct) <= 0.5 ? "WITHIN ±0.5%" : "FLAGGED"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-surface-hi/50 font-data text-[13px] font-bold text-text">
                <td className="px-3 py-3 font-display">Shift Totals</td>
                <td colSpan={2} />
                <td className="px-3 py-3 text-right">{fmtL(totalPhysicalDepletion)}</td>
                <td className="px-3 py-3 text-right text-accent">{fmtL(totalNozzleSales)}</td>
                <td className="px-3 py-3 text-right">{fmtL(totalPosBilled)}</td>
                <td className="px-3 py-3 text-right font-semibold text-error">{fmtL(totalVarianceL)}</td>
                <td className="px-3 py-3 text-right text-accent">{fmtRs(data.financials.totalMeterRevenue)}</td>
                <td className="px-3 py-3 text-center">
                  <Badge tone="success">BALANCED</Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        /* Financial Reconciliation Breakdown */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg p-4.5">
            <h4 className="font-display mb-3 text-sm font-bold text-text">1. Expected Revenue from Meters</h4>
            <div className="flex flex-col gap-2.5 text-xs text-text-muted">
              {data.fuels.map((f) => (
                <div key={f.fuel} className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span>
                    {FUEL_LABEL[f.fuel]} ({fmtL(f.nozzleTotaliserSoldL)} × {fmtRate(f.ratePerL)})
                  </span>
                  <span className="font-data font-semibold text-text">{fmtRs(f.pumpRevenue)}</span>
                </div>
              ))}
              <div className="mt-1 flex items-center justify-between font-display text-sm font-bold text-accent">
                <span>Total Expected Meter Sales</span>
                <span className="font-data text-base">{fmtRs(data.financials.totalMeterRevenue)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-bg p-4.5">
            <h4 className="font-display mb-3 text-sm font-bold text-text">2. Shift Collections & Settlements</h4>
            <div className="flex flex-col gap-2.5 text-xs text-text-muted">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span>Physical Cash Handover (Safe till)</span>
                <span className="font-data font-semibold text-text">{fmtRs(data.financials.cashCollected)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span>Credit Account Chits / Signed Slips</span>
                <span className="font-data font-semibold text-text">{fmtRs(data.financials.creditSlips)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span>Digital / Fonepay QR / Card POS</span>
                <span className="font-data font-semibold text-text">{fmtRs(data.financials.digitalPayments)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between font-display text-sm font-bold text-text">
                <span>Total Settled Collections</span>
                <span className="font-data text-base">{fmtRs(data.financials.totalCollected)}</span>
              </div>
            </div>

            {/* Reconciliation Balance Verdict */}
            <div className="mt-4 rounded-lg border border-success/30 bg-success/10 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 font-display text-sm font-bold text-success">
                <CheckCircle2 size={16} />
                Shift Collections Reconciled (Difference: {fmtRs(data.financials.shortageSurplus)})
              </div>
              <p className="mt-0.5 text-[11px] text-text-muted">No attendant cash shortfall or unaccounted revenue.</p>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Audit Remarks */}
      {data.notes && (
        <div className="rounded-xl border border-border bg-surface p-3.5 text-xs text-text-muted">
          <span className="font-semibold text-text">Shift Supervisor Notes: </span>
          {data.notes}
        </div>
      )}
    </div>
  );
}
