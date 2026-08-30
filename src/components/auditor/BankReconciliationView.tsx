"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  Printer,
  Download,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  PlusCircle,
  MinusCircle,
  FileCheck,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { fmtRs } from "@/lib/money";
import { MOCK_BANK_RECONCILIATIONS } from "@/lib/mock/auditor";
import type { BankReconciliationStatement, BankReconciliationItem } from "@/lib/auditor";

export function BankReconciliationView() {
  const [selectedBankId, setSelectedBankId] = useState<string>("bank-nabil");
  const statement = MOCK_BANK_RECONCILIATIONS[selectedBankId] || MOCK_BANK_RECONCILIATIONS["bank-nabil"];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Bank Account",
      "Account No",
      "As of Date (BS)",
      "Balance per Cash Book (NPR)",
      "Unpresented Cheques (+) (NPR)",
      "Direct Bank Credits (+) (NPR)",
      "Uncredited Deposits (-) (NPR)",
      "Bank Charges (-) (NPR)",
      "Calculated Balance per Bank Statement (NPR)",
      "Actual Bank Statement Balance (NPR)",
      "Variance (NPR)",
    ];

    const mainRow = [
      `"${statement.bankName}"`,
      `"${statement.accountNumber}"`,
      `"${statement.asOfDateBS}"`,
      `"${statement.balanceAsPerCashBookNpr}"`,
      `"${statement.unpresentedChequesTotalNpr}"`,
      `"${statement.directBankCreditsTotalNpr}"`,
      `"${statement.uncreditedDepositsTotalNpr}"`,
      `"${statement.bankChargesAndDirectDebitsTotalNpr}"`,
      `"${statement.calculatedBalanceAsPerBankStatementNpr}"`,
      `"${statement.actualBankStatementBalanceNpr}"`,
      `"${statement.varianceNpr}"`,
    ];

    const itemHeaders = [
      "",
      "Date (BS)",
      "Reference",
      "Item Particulars",
      "Type",
      "Amount (NPR)",
      "Clearance Status",
    ];

    const itemRows = statement.items.map((i) => [
      "",
      `"${i.dateBS}"`,
      `"${i.reference}"`,
      `"${i.particulars}"`,
      `"${i.type}"`,
      `"${i.amountNpr}"`,
      `"${i.cleared ? "CLEARED" : "UNCLEARED"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        mainRow.join(","),
        "",
        `"RECONCILIATION LINE ITEMS FOR ${statement.bankName}"`,
        itemHeaders.join(","),
        ...itemRows.map((e) => e.join(",")),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `bank_reconciliation_${statement.bankId}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getItemTypeBadge = (type: BankReconciliationItem["type"]) => {
    switch (type) {
      case "CHEQUE_ISSUED_NOT_PRESENTED":
        return <Badge tone="accent">+ Add (Unpresented Cheque)</Badge>;
      case "DIRECT_BANK_CREDIT":
        return <Badge tone="success">+ Add (Direct Credit)</Badge>;
      case "DEPOSIT_IN_TRANSIT":
        return <Badge tone="error">- Deduct (Deposit in Transit)</Badge>;
      case "DIRECT_BANK_DEBIT_CHARGES":
        return <Badge tone="muted">- Deduct (Bank Charge)</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              Bank Reconciliation Statement (बैंक मौज्दात हिसाब मिलान विवरण)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Monthly and year-end reconciliation between station cash book ledger and external bank statements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print BRS
          </GhostButton>
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export CSV
          </GhostButton>
        </div>
      </div>

      {/* Bank Account Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-2">
        <button
          type="button"
          onClick={() => setSelectedBankId("bank-nabil")}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
            selectedBankId === "bank-nabil"
              ? "bg-accent/15 font-semibold text-accent"
              : "text-text-muted hover:text-text"
          }`}
        >
          <Building2 size={15} />
          <span>Nabil Bank Operating A/C (..1234)</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedBankId("bank-global")}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
            selectedBankId === "bank-global"
              ? "bg-accent/15 font-semibold text-accent"
              : "text-text-muted hover:text-text"
          }`}
        >
          <Building2 size={15} />
          <span>Global IME Collection A/C (..9182)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Balance per Cash Book"
          value={fmtRs(statement.balanceAsPerCashBookNpr)}
          icon={Building2}
          tone="accent"
          small
        />
        <StatCard
          label="Unpresented Cheques (+)"
          value={fmtRs(statement.unpresentedChequesTotalNpr)}
          icon={PlusCircle}
          tone="text"
          small
        />
        <StatCard
          label="Deposits in Transit (-)"
          value={fmtRs(statement.uncreditedDepositsTotalNpr)}
          icon={MinusCircle}
          tone="text"
          small
        />
        <StatCard
          label="Balance per Bank Statement"
          value={fmtRs(statement.actualBankStatementBalanceNpr)}
          icon={CheckCircle2}
          tone="success"
          small
        />
      </div>

      {/* Bank Reconciliation Statement Form (Auditor Style) */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h4 className="font-display text-[15px] font-bold text-text">
              {statement.bankName}
            </h4>
            <div className="text-[12px] text-text-muted">
              Account No: <span className="font-mono text-text">{statement.accountNumber}</span> · As of:{" "}
              <span className="font-medium text-text">{statement.asOfDateBS} BS</span> ({statement.asOfDateAD} AD)
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statement.varianceNpr === 0 ? (
              <Badge tone="success">Perfect Match (0.00 Variance)</Badge>
            ) : (
              <Badge tone="error">Variance: {fmtRs(statement.varianceNpr)}</Badge>
            )}
          </div>
        </div>

        {/* Step-by-step math */}
        <div className="mt-4 divide-y divide-border text-[13px]">
          <div className="flex items-center justify-between py-2.5">
            <span className="font-semibold text-text">
              1. Balance as per Station Cash Book (Ledger A/C)
            </span>
            <span className="font-data font-bold text-text">
              {fmtRs(statement.balanceAsPerCashBookNpr)}
            </span>
          </div>

          <div className="space-y-1.5 py-2.5 bg-accent/5 -mx-5 px-5">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-accent">
              Add: Adjustments Increasing Bank Balance
            </div>
            <div className="flex items-center justify-between text-text text-[12.5px]">
              <span>• Cheques issued to suppliers but not yet presented at bank</span>
              <span className="font-data font-medium text-accent">
                + {fmtRs(statement.unpresentedChequesTotalNpr)}
              </span>
            </div>
            <div className="flex items-center justify-between text-text text-[12.5px]">
              <span>• Direct bank credits / RTGS receipts from customers not yet entered</span>
              <span className="font-data font-medium text-accent">
                + {fmtRs(statement.directBankCreditsTotalNpr)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 py-2.5 bg-surface-hi -mx-5 px-5">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-text-muted">
              Less: Adjustments Decreasing Bank Balance
            </div>
            <div className="flex items-center justify-between text-text text-[12.5px]">
              <span>• Cheques and cash deposited in transit (not yet credited by bank)</span>
              <span className="font-data font-medium text-text-muted">
                - {fmtRs(statement.uncreditedDepositsTotalNpr)}
              </span>
            </div>
            <div className="flex items-center justify-between text-text text-[12.5px]">
              <span>• Bank service charges and POS terminal maintenance debited directly</span>
              <span className="font-data font-medium text-text-muted">
                - {fmtRs(statement.bankChargesAndDirectDebitsTotalNpr)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 font-display text-[14.5px] font-bold text-text bg-accent/10 -mx-5 px-5 rounded-b-lg">
            <span>2. Balance as per External Bank Statement (Reconciled)</span>
            <span className="font-data text-accent">
              {fmtRs(statement.calculatedBalanceAsPerBankStatementNpr)}
            </span>
          </div>
        </div>
      </div>

      {/* Individual Uncleared Items Breakdown */}
      <div className="space-y-3">
        <h4 className="font-display text-[14px] font-bold text-text">
          Reconciling Items Register ({statement.items.length} Records)
        </h4>

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead className="border-b border-border bg-surface-hi text-[11.5px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 py-3">Date (BS)</th>
                  <th className="px-3 py-3">Ref No</th>
                  <th className="px-3 py-3">Adjustment Type</th>
                  <th className="px-4 py-3">Particulars / Transaction Narrative</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                  <th className="px-3 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-data">
                {statement.items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-hi/60 transition-colors">
                    <td className="px-4 py-3 text-text font-medium">{item.dateBS}</td>
                    <td className="px-3 py-3 font-mono text-accent">{item.reference}</td>
                    <td className="px-3 py-3 font-body">{getItemTypeBadge(item.type)}</td>
                    <td className="px-4 py-3 font-body text-text font-medium">
                      {item.particulars}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-text">
                      {fmtRs(item.amountNpr)}
                    </td>
                    <td className="px-3 py-3 text-center font-body">
                      {item.cleared ? (
                        <Badge tone="success">Cleared</Badge>
                      ) : (
                        <Badge tone="accent">In Transit</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
