"use client";

import { useState } from "react";
import { Download, Printer, Filter, Building2, Car, IndianRupee, FileText, CheckCircle2 } from "lucide-react";
import {
  MOCK_CORPORATE_STATEMENTS,
  MOCK_FLEET_DISPENSE_LOGS,
  MOCK_CORPORATE_ACCOUNTS,
} from "@/lib/mock/corporate";
import { fmtRs, fmtL } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";

export function CorporateStatementsView() {
  const [selectedAccount, setSelectedAccount] = useState("ALL");

  const filteredStatements = MOCK_CORPORATE_STATEMENTS.filter((s) => {
    if (selectedAccount !== "ALL" && s.accountId !== selectedAccount) return false;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    alert("Exporting Corporate Monthly Billing Statements (BS) to CSV...");
  };

  return (
    <div>
      {/* Filter and Action Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
            <Filter size={13} />
            <span>CLIENT STATEMENT:</span>
          </div>

          <div className="w-[240px]">
            <Select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="py-1.5 text-xs"
            >
              <option value="ALL">All Corporate Accounts</option>
              {MOCK_CORPORATE_ACCOUNTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.companyName}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer size={14} />
            Print Statements
          </GhostButton>
          <PrimaryButton onClick={handleExport} className="gap-1.5 text-xs">
            <Download size={14} />
            Export CSV
          </PrimaryButton>
        </div>
      </div>

      {/* Statements Table */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
              <th className="px-3 py-2.5 font-medium">STATEMENT NO</th>
              <th className="px-3 py-2.5 font-medium">CORPORATE CLIENT</th>
              <th className="px-3 py-2.5 font-medium">BILLING PERIOD (BS)</th>
              <th className="px-3 py-2.5 text-right font-medium">FUEL VOLUME</th>
              <th className="px-3 py-2.5 text-right font-medium">TOTAL BILLED</th>
              <th className="px-3 py-2.5 text-right font-medium">PAID RECEIVED</th>
              <th className="px-3 py-2.5 text-right font-medium">CLOSING DUE</th>
              <th className="px-3 py-2.5 font-medium">DUE DATE</th>
              <th className="px-3 py-2.5 text-center font-medium">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filteredStatements.map((s) => (
              <tr key={s.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                <td className="px-3 py-3 font-data text-[13px] font-bold text-accent">{s.statementNo}</td>

                <td className="px-3 py-3">
                  <div className="font-display text-[13px] font-semibold text-text">{s.companyName}</div>
                  <div className="font-data text-[11px] text-text-muted">PAN: {s.panVatNo} · {s.totalFillsCount} Fills</div>
                </td>

                <td className="px-3 py-3 font-data text-[12px] text-text-muted">{s.periodBS}</td>

                <td className="px-3 py-3 text-right font-data text-[12.5px] text-text">{fmtL(s.totalFuelVolumeL)}</td>

                <td className="px-3 py-3 text-right font-data text-[13px] font-semibold text-text">
                  {fmtRs(s.totalFuelAmountNpr + s.lubricantsAmountNpr)}
                </td>

                <td className="px-3 py-3 text-right font-data text-[12.5px] text-success">
                  {fmtRs(s.paymentsReceivedNpr)}
                </td>

                <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-error">
                  {fmtRs(s.closingBalanceDueNpr)}
                </td>

                <td className="px-3 py-3 font-data text-[12px] text-text-muted">{s.dueDateBS}</td>

                <td className="px-3 py-3 text-center">
                  <Badge tone="accent">PARTIALLY PAID</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vehicle-level Fueling Audit Breakdown */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car size={16} className="text-accent" />
            <h4 className="font-display text-sm font-bold text-text">Vehicle Dispense Audit Log</h4>
          </div>
          <span className="font-data text-xs text-text-muted">Verified dispenser receipts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
                <th className="px-3 py-2 font-medium">DATE / TIME</th>
                <th className="px-3 py-2 font-medium">VEHICLE PLATE</th>
                <th className="px-3 py-2 font-medium">COMPANY</th>
                <th className="px-3 py-2 font-medium">DRIVER & ODOMETER</th>
                <th className="px-3 py-2 text-right font-medium">LITRES</th>
                <th className="px-3 py-2 text-right font-medium">AMOUNT</th>
                <th className="px-3 py-2 text-right font-medium">RECEIPT NO</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_FLEET_DISPENSE_LOGS.map((log) => (
                <tr key={log.id} className="border-b border-border/40 text-xs">
                  <td className="px-3 py-2 font-data text-text-muted">
                    {log.dateBS} {log.time}
                  </td>
                  <td className="px-3 py-2 font-data font-bold text-accent">{log.vehiclePlateNo}</td>
                  <td className="px-3 py-2 text-text">{log.companyName}</td>
                  <td className="px-3 py-2 text-text-muted">
                    {log.driverName} ({log.odometerKm.toLocaleString()} km)
                  </td>
                  <td className="px-3 py-2 text-right font-data font-semibold text-text">{fmtL(log.litresDispensed)}</td>
                  <td className="px-3 py-2 text-right font-data font-bold text-accent">{fmtRs(log.totalAmountNpr)}</td>
                  <td className="px-3 py-2 text-right font-data text-text-muted">#{log.receiptNo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
