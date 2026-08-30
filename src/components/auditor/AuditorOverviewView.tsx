"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ScrollText,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  HandCoins,
  Truck,
  MailCheck,
  AlertTriangle,
  Percent,
  Boxes,
  ClipboardCheck,
  ShieldCheck,
  Building2,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { fmtRs } from "@/lib/money";
import {
  MOCK_DEBTOR_AGEING,
  MOCK_CREDITOR_AGEING,
  MOCK_CONFIRMATIONS,
  MOCK_LARGE_TRANSACTIONS,
  MOCK_FISCAL_STOCK,
  MOCK_BANK_RECONCILIATIONS,
  getVatSplitSummary,
} from "@/lib/mock/auditor";

export function AuditorOverviewView() {
  const [fiscalYear, setFiscalYear] = useState("2083/84 (आ.व. २०८३/८४)");

  const totalDebtors = MOCK_DEBTOR_AGEING.reduce((sum, d) => sum + d.totalDueNpr, 0);
  const criticalDebtors = MOCK_DEBTOR_AGEING.filter((d) => d.riskLevel === "CRITICAL" || d.riskLevel === "HIGH").length;

  const totalCreditors = MOCK_CREDITOR_AGEING.reduce((sum, c) => sum + c.totalPayableNpr, 0);
  const totalStockValuation = MOCK_FISCAL_STOCK.reduce((sum, s) => sum + s.closingValuationNpr, 0);

  const nabilBank = MOCK_BANK_RECONCILIATIONS["bank-nabil"];
  const globalBank = MOCK_BANK_RECONCILIATIONS["bank-global"];
  const totalBankBalances =
    (nabilBank?.calculatedBalanceAsPerBankStatementNpr ?? 0) +
    (globalBank?.calculatedBalanceAsPerBankStatementNpr ?? 0);

  const vatSummary = getVatSplitSummary();

  const handlePrint = () => {
    window.print();
  };

  const handleExportAll = () => {
    // Generate combined audit CSV summary pack
    const content = [
      `"AUDITOR REPORT PACK - FISCAL YEAR ${fiscalYear}"`,
      `"Generated At: ${new Date().toLocaleString()}"`,
      "",
      `"SECTION 1: RECEIVABLES SUMMARY"`,
      `"Total Debtors Due (NPR)","${totalDebtors}"`,
      `"High Risk / Critical Accounts","${criticalDebtors}"`,
      "",
      `"SECTION 2: PAYABLES SUMMARY"`,
      `"Total Creditors Payable (NPR)","${totalCreditors}"`,
      "",
      `"SECTION 3: CLOSING STOCK VALUATION"`,
      `"Total Fuel & Lubes Closing Valuation (NPR)","${totalStockValuation}"`,
      "",
      `"SECTION 4: RECONCILED BANK BALANCES"`,
      `"Total Reconciled Bank Liquidity (NPR)","${totalBankBalances}"`,
      "",
      `"SECTION 5: STATUTORY VAT POSITION"`,
      `"Sales Output VAT 13% (NPR)","${vatSummary.salesOutputVatNpr}"`,
      `"Purchases Input VAT 13% (NPR)","${vatSummary.purchaseInputVatNpr}"`,
      `"Net VAT Payable (NPR)","${vatSummary.netVatLiabilityNpr}"`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `auditor_pack_summary_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const AUDIT_SCHEDULES = [
    {
      title: "Debtor Ageing Schedule",
      nepaliTitle: "ग्राहक उधारी वर्गीकरण",
      href: "/reports/auditor/debtors",
      icon: HandCoins,
      status: "Ready for Audit",
      metric: fmtRs(totalDebtors),
      metricLabel: "Total Receivables Outstanding",
      desc: "Detailed 0-30, 31-60, 61-90, 90+ days aging with risk grading and credit limits.",
      tone: "accent" as const,
    },
    {
      title: "Creditor Ageing Schedule",
      nepaliTitle: "आपूर्तिकर्ता भुक्तानी दायित्व",
      href: "/reports/auditor/creditors",
      icon: Truck,
      status: "Ready for Audit",
      metric: fmtRs(totalCreditors),
      metricLabel: "Trade & Refinery Payables",
      desc: "Accounts payable aging for Nepal Oil Corporation (NOC) and trade suppliers.",
      tone: "text" as const,
    },
    {
      title: "Balance Confirmations",
      nepaliTitle: "वर्षान्त मौज्दात प्रमाणीकरण",
      href: "/reports/auditor/confirmations",
      icon: MailCheck,
      status: "3 Agreed · 1 Disputed · 1 Pending",
      metric: `${MOCK_CONFIRMATIONS.length} Parties`,
      metricLabel: "Circularisation Letters",
      desc: "Auditor circular letters sent to top debtors and suppliers with response tracking.",
      tone: "text" as const,
    },
    {
      title: "Large Transactions (>1 Lakh)",
      nepaliTitle: "ठूला कारोबार विवरण (रु १ लाख माथि)",
      href: "/reports/auditor/large-transactions",
      icon: AlertTriangle,
      status: "Compliance Verified",
      metric: `${MOCK_LARGE_TRANSACTIONS.length} Txns`,
      metricLabel: "Above Rs 1,00,000 Threshold",
      desc: "Statutory IRD / AML reporting list of single transactions exceeding 1 Lakh NPR.",
      tone: "success" as const,
    },
    {
      title: "Taxable vs Non-Taxable Split",
      nepaliTitle: "करयोग्य र करछुट कारोबार विभाजन",
      href: "/reports/auditor/vat-split",
      icon: Percent,
      status: "Reconciled to IRD",
      metric: fmtRs(vatSummary.netVatLiabilityNpr),
      metricLabel: "Net VAT Liability (13%)",
      desc: "Classification between 13% VAT goods, Schedule 1 exempt energy, and utilities.",
      tone: "accent" as const,
    },
    {
      title: "Fiscal Year Stock Valuation",
      nepaliTitle: "आर्थिक वर्षान्त मौज्दात मूल्याङ्कन",
      href: "/reports/auditor/fiscal-stock",
      icon: Boxes,
      status: "Dip Verified",
      metric: fmtRs(totalStockValuation),
      metricLabel: "Closing Inventory Valuation",
      desc: "Opening stock, NOC receipts, decanting loss allowance, sales outward and closing dips.",
      tone: "success" as const,
    },
    {
      title: "Bank Reconciliation Statement",
      nepaliTitle: "बैंक मौज्दात हिसाब मिलान",
      href: "/reports/auditor/reconciliation",
      icon: ClipboardCheck,
      status: "0 Unreconciled Variance",
      metric: fmtRs(totalBankBalances),
      metricLabel: "Reconciled Bank Funds",
      desc: "Reconciliation of station cash book with Nabil Bank & Global IME bank statements.",
      tone: "success" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <ScrollText size={24} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-lg font-bold text-text">
                External Auditor Pack (लेखापरीक्षक वार्षिक विवरण)
              </h2>
              <Badge tone="accent">FY 2083/84</Badge>
              <Badge tone="success">External Audit Ready</Badge>
            </div>
            <p className="mt-1 text-[13px] text-text-muted">
              Statutory year-end schedules, verification sheets, and circular letters prepared for chartered accountants and tax authorities.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-1.5 font-data text-[12.5px] text-text"
          >
            <option value="2083/84 (आ.व. २०८३/८४)">FY 2083/84 (Current)</option>
            <option value="2082/83 (आ.व. २०८२/८३)">FY 2082/83 (Previous)</option>
            <option value="2081/82 (आ.व. २०८१/८२)">FY 2081/82 (Closed)</option>
          </select>
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Pack
          </GhostButton>
          <PrimaryButton onClick={handleExportAll} className="text-[12.5px]">
            <Download size={14} /> Export All Schedules (CSV)
          </PrimaryButton>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Debtors Outstanding"
          value={fmtRs(totalDebtors)}
          icon={HandCoins}
          tone="accent"
          small
        />
        <StatCard
          label="Total Trade Payables (NOC & Trade)"
          value={fmtRs(totalCreditors)}
          icon={Truck}
          tone="text"
          small
        />
        <StatCard
          label="Fuel Stock Asset Valuation"
          value={fmtRs(totalStockValuation)}
          icon={Boxes}
          tone="success"
          small
        />
        <StatCard
          label="Reconciled Bank Liquidity"
          value={fmtRs(totalBankBalances)}
          icon={ClipboardCheck}
          tone="accent"
          small
        />
      </div>

      {/* Auditor Information & Station Metadata Card */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-text font-semibold text-[13.5px] mb-2">
            <Building2 size={16} className="text-accent" /> Station & Entity Info
          </div>
          <div className="space-y-1.5 text-[12.5px] text-text-muted">
            <div className="flex justify-between">
              <span>Station Name:</span>
              <span className="font-medium text-text">Shree Pashupati Petroleum Center</span>
            </div>
            <div className="flex justify-between">
              <span>PAN / VAT Reg No:</span>
              <span className="font-data font-semibold text-text">300192847</span>
            </div>
            <div className="flex justify-between">
              <span>NOC Dealership Code:</span>
              <span className="font-data font-semibold text-text">KTM-DEALER-4091</span>
            </div>
            <div className="flex justify-between">
              <span>Station Address:</span>
              <span className="font-medium text-text">Ring Road, Maharajgunj, Kathmandu</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-text font-semibold text-[13.5px] mb-2">
            <ShieldCheck size={16} className="text-success" /> Appointed Statutory Auditor
          </div>
          <div className="space-y-1.5 text-[12.5px] text-text-muted">
            <div className="flex justify-between">
              <span>Audit Firm:</span>
              <span className="font-medium text-text">Sharma & Associates, CAs</span>
            </div>
            <div className="flex justify-between">
              <span>Lead Partner:</span>
              <span className="font-medium text-text">CA. Pradeep Sharma, FCA</span>
            </div>
            <div className="flex justify-between">
              <span>ICAN Reg No:</span>
              <span className="font-data font-semibold text-text">FCA-1928</span>
            </div>
            <div className="flex justify-between">
              <span>Audit Period:</span>
              <span className="font-medium text-text">2083 Shrawan 1 – 2084 Ashadh 31</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-text font-semibold text-[13.5px] mb-2">
            <Calendar size={16} className="text-accent" /> Audit Readiness Status
          </div>
          <div className="space-y-2 text-[12px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-text">
                <CheckCircle2 size={14} className="text-success" /> Physical Stock Dip Certificate
              </span>
              <Badge tone="success">Verified</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-text">
                <CheckCircle2 size={14} className="text-success" /> Bank Reconciliation (0 Variance)
              </span>
              <Badge tone="success">Matched</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-text">
                <Clock size={14} className="text-accent" /> Debtors / Creditors Circularisation
              </span>
              <Badge tone="accent">In Progress</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of 7 Auditor Schedules */}
      <div className="space-y-3">
        <h3 className="font-display text-[15px] font-bold text-text">
          Statutory Year-End Audit Schedules (लेखापरीक्षण अनुसूचीहरू)
        </h3>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {AUDIT_SCHEDULES.map((sched) => {
            const Icon = sched.icon;
            return (
              <Link
                key={sched.href}
                href={sched.href}
                className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-4 transition-all hover:border-accent/40 hover:bg-surface-hi hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-bg transition-colors">
                      <Icon size={18} />
                    </div>
                    <Badge tone={sched.tone}>{sched.status}</Badge>
                  </div>

                  <h4 className="font-display text-[14px] font-bold text-text group-hover:text-accent transition-colors">
                    {sched.title}
                  </h4>
                  <p className="text-[11.5px] text-text-muted/80">{sched.nepaliTitle}</p>
                  <p className="mt-2 text-[12px] text-text-muted line-clamp-2">{sched.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-end justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-text-muted">
                      {sched.metricLabel}
                    </div>
                    <div className="font-data text-[15px] font-bold text-text">
                      {sched.metric}
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[12px] font-semibold text-accent group-hover:translate-x-1 transition-transform">
                    View Schedule <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
