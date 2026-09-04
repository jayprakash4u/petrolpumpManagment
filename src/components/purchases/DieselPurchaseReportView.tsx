"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

export interface DieselPurchaseEntry {
  sn: number;
  dateBS: string;
  billNo: string;
  density: number | string;
  temperature: number | string;
  tankerNo: string;
  purchaseLiters: number;
  ratePerL: number;
  taxableAmount: number;
  vatAmount: number;
  totalAmount: number;
  remarks: string;
  pump1Liters: number;
  pump2Liters: number;
}

const MONTHS_NEP = [
  { index: 1, name: "Baisakh", nepali: "बैशाख" },
  { index: 2, name: "Jestha", nepali: "जेठ" },
  { index: 3, name: "Ashadh", nepali: "असार" },
  { index: 4, name: "Shrawan", nepali: "साउन" },
  { index: 5, name: "Bhadra", nepali: "भदौ" },
  { index: 6, name: "Ashwin", nepali: "असोज" },
  { index: 7, name: "Kartik", nepali: "कात्तिक" },
  { index: 8, name: "Mangsir", nepali: "मंसिर" },
  { index: 9, name: "Poush", nepali: "पुस" },
  { index: 10, name: "Magh", nepali: "माघ" },
  { index: 11, name: "Falgun", nepali: "फागुन" },
  { index: 12, name: "Chaitra", nepali: "चैत" },
];

const YEARS_BS = [2083, 2082, 2081, 2080, 2079, 2078];

// Authentic records for Bhadra 2083 matching the screenshot exactly
const MOCK_BHADRA_2083: DieselPurchaseEntry[] = [
  {
    sn: 1,
    dateBS: "2083-5-1",
    billNo: "30005442",
    density: 812,
    temperature: 30,
    tankerNo: "3711NA7KHA",
    purchaseLiters: 3994.0,
    ratePerL: 171.70351,
    taxableAmount: 685784.22,
    vatAmount: 89151.95,
    totalAmount: 774936.17,
    remarks: "",
    pump1Liters: 3994.0,
    pump2Liters: 0.0,
  },
  {
    sn: 2,
    dateBS: "2083-5-3",
    billNo: "30005890",
    density: 814,
    temperature: 29.5,
    tankerNo: "5574P31KH",
    purchaseLiters: 3000.0,
    ratePerL: 171.70351,
    taxableAmount: 515110.53,
    vatAmount: 66964.41,
    totalAmount: 582075.24,
    remarks: "",
    pump1Liters: 3000.0,
    pump2Liters: 0.0,
  },
  {
    sn: 3,
    dateBS: "2083-5-5",
    billNo: "30006495",
    density: 814,
    temperature: 31,
    tankerNo: "5831NA3KHA",
    purchaseLiters: 3992.0,
    ratePerL: 171.70351,
    taxableAmount: 685440.81,
    vatAmount: 89107.31,
    totalAmount: 774548.12,
    remarks: "",
    pump1Liters: 3992.0,
    pump2Liters: 0.0,
  },
  {
    sn: 4,
    dateBS: "2083-5-8",
    billNo: "30006740",
    density: 813,
    temperature: 32,
    tankerNo: "7256NA4KHA",
    purchaseLiters: 3982.0,
    ratePerL: 171.70351,
    taxableAmount: 683723.78,
    vatAmount: 88884.09,
    totalAmount: 772607.87,
    remarks: "",
    pump1Liters: 3982.0,
    pump2Liters: 0.0,
  },
  {
    sn: 5,
    dateBS: "2083-5-11",
    billNo: "30007405",
    density: 815,
    temperature: 28,
    tankerNo: "BP01004KA1562",
    purchaseLiters: 3000.0,
    ratePerL: 171.70351,
    taxableAmount: 515110.53,
    vatAmount: 66964.41,
    totalAmount: 582075.24,
    remarks: "",
    pump1Liters: 3000.0,
    pump2Liters: 0.0,
  },
  {
    sn: 6,
    dateBS: "2083-5-13",
    billNo: "30007711",
    density: 812,
    temperature: 30,
    tankerNo: "0372NSK",
    purchaseLiters: 3000.0,
    ratePerL: 171.70351,
    taxableAmount: 515110.53,
    vatAmount: 66964.41,
    totalAmount: 582075.24,
    remarks: "",
    pump1Liters: 3000.0,
    pump2Liters: 0.0,
  },
  {
    sn: 7,
    dateBS: "2083-5-16",
    billNo: "30008312",
    density: 810,
    temperature: 30,
    tankerNo: "0784",
    purchaseLiters: 3988.0,
    ratePerL: 171.70351,
    taxableAmount: 684410.59,
    vatAmount: 88973.38,
    totalAmount: 773383.97,
    remarks: "",
    pump1Liters: 3988.0,
    pump2Liters: 0.0,
  },
  {
    sn: 8,
    dateBS: "2083-5-18",
    billNo: "30009017",
    density: 812,
    temperature: 27.5,
    tankerNo: "0925",
    purchaseLiters: 2982.0,
    ratePerL: 171.70351,
    taxableAmount: 512020.17,
    vatAmount: 66562.62,
    totalAmount: 578582.79,
    remarks: "",
    pump1Liters: 2982.0,
    pump2Liters: 0.0,
  },
];

function generateMonthData(year: number, monthIdx: number): DieselPurchaseEntry[] {
  if (year === 2083 && monthIdx === 5) {
    return MOCK_BHADRA_2083;
  }
  // Generate sample consistent data for other months
  const tankerList = ["3711NA7KHA", "5574P31KH", "5831NA3KHA", "7256NA4KHA", "BP01004KA1562", "0372NSK"];
  const count = 5;
  const rate = 171.70351;
  const rows: DieselPurchaseEntry[] = [];
  const days = [2, 7, 12, 19, 25];

  for (let i = 0; i < count; i++) {
    const liters = i % 2 === 0 ? 3990 : 3000;
    const taxable = Number((liters * rate).toFixed(2));
    const vat = Number((taxable * 0.13).toFixed(2));
    const total = Number((taxable + vat).toFixed(2));
    rows.push({
      sn: i + 1,
      dateBS: `${year}-${monthIdx}-${days[i]}`,
      billNo: String(30005000 + monthIdx * 100 + i * 15),
      density: 810 + (i % 5),
      temperature: 28 + (i % 4),
      tankerNo: tankerList[i % tankerList.length],
      purchaseLiters: liters,
      ratePerL: rate,
      taxableAmount: taxable,
      vatAmount: vat,
      totalAmount: total,
      remarks: "",
      pump1Liters: liters,
      pump2Liters: 0.0,
    });
  }
  return rows;
}

export function DieselPurchaseReportView({
  initialMonth = 5,
  initialYear = 2083,
  stationPan = "300054891",
  stationName = "Nepal Petroleum Center",
  stationAddress = "Kathmandu, Nepal",
}: {
  initialMonth?: number;
  initialYear?: number;
  stationPan?: string;
  stationName?: string;
  stationAddress?: string;
}) {
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);

  // Active submitted view values
  const [appliedMonth, setAppliedMonth] = useState<number>(initialMonth);
  const [appliedYear, setAppliedYear] = useState<number>(initialYear);
  const [entries, setEntries] = useState<DieselPurchaseEntry[]>(() =>
    generateMonthData(initialYear, initialMonth)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedMonth(selectedMonth);
    setAppliedYear(selectedYear);
    setEntries(generateMonthData(selectedYear, selectedMonth));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "S.N.",
      "Date (BS)",
      "Bill No",
      "Density",
      "Temp (°C)",
      "Tanker No",
      "Purchase Litres",
      "Rate (Rs)",
      "Taxable Amount (Rs)",
      "VAT Amount (Rs)",
      "Total Amount (Rs)",
      "Remarks",
      "Pump 1 (L)",
      "Pump 2 (L)",
    ];
    const rows = entries.map((r) => [
      r.sn,
      r.dateBS,
      r.billNo,
      r.density,
      r.temperature,
      r.tankerNo,
      r.purchaseLiters.toFixed(3),
      r.ratePerL.toFixed(5),
      r.taxableAmount.toFixed(2),
      r.vatAmount.toFixed(2),
      r.totalAmount.toFixed(2),
      r.remarks,
      r.pump1Liters.toFixed(3),
      r.pump2Liters.toFixed(3),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `diesel_purchase_report_${appliedYear}_${appliedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Totals calculations
  const totalLiters = entries.reduce((acc, r) => acc + r.purchaseLiters, 0);
  const totalTaxable = entries.reduce((acc, r) => acc + r.taxableAmount, 0);
  const totalVat = entries.reduce((acc, r) => acc + r.vatAmount, 0);
  const grandTotal = entries.reduce((acc, r) => acc + r.totalAmount, 0);
  const totalPump1 = entries.reduce((acc, r) => acc + r.pump1Liters, 0);
  const totalPump2 = entries.reduce((acc, r) => acc + r.pump2Liters, 0);

  const monthObj = MONTHS_NEP.find((m) => m.index === appliedMonth) ?? MONTHS_NEP[4];

  return (
    <div className="w-full">
      {/* Header bar */}
      <div className="mb-4 flex items-center justify-between border-b border-border/80 pb-3 print:hidden">
        <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl">
          Diesel Purchase Report
        </h1>
        <Link
          href="/purchases"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-2xs transition-colors hover:bg-surface-hi hover:border-accent/40"
        >
          <ArrowLeft size={14} />
          « Back
        </Link>
      </div>

      {/* Main Printable Card Container */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-xs sm:p-6 print:border-none print:bg-white print:p-0 print:shadow-none">
        {/* Top Control Bar */}
        <div className="mb-6 flex flex-col gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
          {/* Print action button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted transition-colors hover:text-accent"
            >
              <span>
                Print {appliedMonth}/{appliedYear} purchase Report
              </span>
              <span className="text-sm">🖨️</span>
            </button>
          </div>

          {/* Filter form */}
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-text-muted">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="h-8.5 rounded-lg border border-border bg-surface-hi/50 px-3 text-xs font-medium text-text focus:border-accent focus:outline-hidden"
              >
                {MONTHS_NEP.map((m) => (
                  <option key={m.index} value={m.index}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-text-muted">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="h-8.5 rounded-lg border border-border bg-surface-hi/50 px-3 text-xs font-medium text-text focus:border-accent focus:outline-hidden"
              >
                {YEARS_BS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <PrimaryButton type="submit" className="h-8.5 px-5 text-xs font-semibold">
              Submit
            </PrimaryButton>

            <GhostButton type="button" onClick={handleExportCSV} className="h-8.5 gap-1.5 text-xs">
              <Download size={13} />
              Export CSV
            </GhostButton>
          </form>
        </div>

        {/* Statutory Station Header */}
        <div className="mb-6 text-center">
          <p className="font-data text-[12px] font-medium tracking-wide text-text-muted">
            PAN NO : {stationPan}
          </p>
          <h2 className="font-display text-[15px] font-bold text-text sm:text-[16px]">
            {stationName}
          </h2>
          <p className="text-[12px] text-text-muted">{stationAddress}</p>
          <h3 className="mt-1.5 text-[13px] font-bold text-text">
            {appliedYear} साल {monthObj.name} महिनाको डिजेल खरिद विवरण :-
          </h3>
        </div>

        {/* Tax Ledger Data Table */}
        <div className="overflow-x-auto rounded-lg border border-border print:border-black">
          <table className="w-full min-w-[1050px] border-collapse text-left text-[11.5px] print:min-w-full print:text-[10px]">
            <thead>
              <tr className="border-b border-border bg-surface-hi font-medium text-text print:border-black print:bg-gray-100">
                <th className="border-r border-border px-2.5 py-2 text-center print:border-black">सि. नं.</th>
                <th className="border-r border-border px-2.5 py-2 text-center print:border-black">मिति</th>
                <th className="border-r border-border px-2.5 py-2 text-center print:border-black">बिल नं.</th>
                <th className="border-r border-border px-2 py-2 text-center print:border-black">डेन्सिटि</th>
                <th className="border-r border-border px-2 py-2 text-center print:border-black">तापक्रम</th>
                <th className="border-r border-border px-2.5 py-2 text-center print:border-black">ट्याङ्कर नं.</th>
                <th className="border-r border-border px-2.5 py-2 text-right print:border-black">खरिद लि.</th>
                <th className="border-r border-border px-2.5 py-2 text-right print:border-black">दर रु</th>
                <th className="border-r border-border px-2.5 py-2 text-right print:border-black">भ्याट बाहेकको रु</th>
                <th className="border-r border-border px-2.5 py-2 text-right print:border-black">भ्याट रकम रु</th>
                <th className="border-r border-border px-2.5 py-2 text-right print:border-black">जम्मा रकम</th>
                <th className="border-r border-border px-2 py-2 text-center print:border-black">कैफियत</th>
                <th className="border-r border-border px-2.5 py-2 text-right print:border-black">पम्प १</th>
                <th className="px-2.5 py-2 text-right">पम्प २</th>
              </tr>
            </thead>
            <tbody>
              {/* Brought Forward (क्र. ल्या.) row */}
              <tr className="border-b border-border/70 text-text-muted print:border-black">
                <td className="border-r border-border px-2.5 py-1.5 text-center font-medium print:border-black">
                  क्र. ल्या.
                </td>
                <td className="border-r border-border px-2.5 py-1.5 print:border-black"></td>
                <td className="border-r border-border px-2.5 py-1.5 print:border-black"></td>
                <td className="border-r border-border px-2 py-1.5 print:border-black"></td>
                <td className="border-r border-border px-2 py-1.5 print:border-black"></td>
                <td className="border-r border-border px-2.5 py-1.5 print:border-black"></td>
                <td className="border-r border-border px-2.5 py-1.5 text-right print:border-black"></td>
                <td className="border-r border-border px-2.5 py-1.5 text-right print:border-black"></td>
                <td className="border-r border-border px-2.5 py-1.5 text-right print:border-black"></td>
                <td className="border-r border-border px-2.5 py-1.5 text-right print:border-black"></td>
                <td className="border-r border-border px-2.5 py-1.5 text-right print:border-black"></td>
                <td className="border-r border-border px-2 py-1.5 text-center font-data text-xs text-text print:border-black">
                  0
                </td>
                <td className="border-r border-border px-2.5 py-1.5 text-right print:border-black"></td>
                <td className="px-2.5 py-1.5 text-right"></td>
              </tr>

              {/* Data Rows */}
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-3 py-8 text-center text-xs text-text-muted">
                    No diesel purchases recorded for {monthObj.name} {appliedYear}.
                  </td>
                </tr>
              ) : (
                entries.map((row) => (
                  <tr
                    key={row.sn}
                    className="border-b border-border/50 text-text transition-colors hover:bg-surface-hi/40 print:border-black"
                  >
                    <td className="border-r border-border px-2.5 py-2 text-center text-text-muted print:border-black">
                      {row.sn}
                    </td>
                    <td className="border-r border-border px-2.5 py-2 text-center font-data print:border-black">
                      {row.dateBS}
                    </td>
                    <td className="border-r border-border px-2.5 py-2 text-center font-data text-accent font-medium print:border-black print:text-black">
                      {row.billNo}
                    </td>
                    <td className="border-r border-border px-2 py-2 text-center font-data print:border-black">
                      {row.density}
                    </td>
                    <td className="border-r border-border px-2 py-2 text-center font-data print:border-black">
                      {row.temperature}
                    </td>
                    <td className="border-r border-border px-2.5 py-2 text-center font-data font-semibold tracking-wide print:border-black">
                      {row.tankerNo}
                    </td>
                    <td className="border-r border-border px-2.5 py-2 text-right font-data print:border-black">
                      {row.purchaseLiters.toLocaleString("en-IN", {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })}
                    </td>
                    <td className="border-r border-border px-2.5 py-2 text-right font-data text-text-muted print:border-black print:text-black">
                      {row.ratePerL.toFixed(5)}
                    </td>
                    <td className="border-r border-border px-2.5 py-2 text-right font-data print:border-black">
                      {row.taxableAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="border-r border-border px-2.5 py-2 text-right font-data print:border-black">
                      {row.vatAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="border-r border-border px-2.5 py-2 text-right font-data font-semibold text-accent print:border-black print:text-black">
                      {row.totalAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="border-r border-border px-2 py-2 text-center text-text-muted print:border-black">
                      {row.remarks || ""}
                    </td>
                    <td className="border-r border-border px-2.5 py-2 text-right font-data print:border-black">
                      {row.pump1Liters.toLocaleString("en-IN", {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })}
                    </td>
                    <td className="px-2.5 py-2 text-right font-data text-text-muted print:text-black">
                      {row.pump2Liters.toLocaleString("en-IN", {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })}
                    </td>
                  </tr>
                ))
              )}

              {/* Total Row (खरिद जम्मा) */}
              <tr className="border-t-2 border-border bg-surface-hi/70 font-bold text-text print:border-black print:bg-gray-100">
                <td
                  colSpan={6}
                  className="border-r border-border px-3 py-2.5 text-center font-display tracking-wide print:border-black"
                >
                  खरिद जम्मा
                </td>
                <td className="border-r border-border px-2.5 py-2.5 text-right font-data text-accent print:border-black print:text-black">
                  {totalLiters.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="border-r border-border px-2.5 py-2.5 print:border-black"></td>
                <td className="border-r border-border px-2.5 py-2.5 text-right font-data print:border-black">
                  {totalTaxable.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="border-r border-border px-2.5 py-2.5 text-right font-data print:border-black">
                  {totalVat.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="border-r border-border px-2.5 py-2.5 text-right font-data text-accent print:border-black print:text-black">
                  {grandTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="border-r border-border px-2 py-2.5 print:border-black"></td>
                <td className="border-r border-border px-2.5 py-2.5 text-right font-data print:border-black">
                  {totalPump1.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-2.5 py-2.5 text-right font-data">
                  {totalPump2.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Statutory 3-Party Signatures Section */}
        <div className="mt-14 grid grid-cols-3 gap-6 pt-4 text-center text-[12px] sm:text-[13px]">
          {/* Presenter / लेखापाल */}
          <div className="flex flex-col items-start text-left sm:items-center sm:text-center">
            <span className="font-semibold text-text">पेश गर्ने :-</span>
            <span className="mt-1 text-[11px] text-text-muted">Presenter</span>
            <span className="mt-0.5 font-medium text-text">लेखापाल</span>
          </div>

          {/* Recommended By */}
          <div className="flex flex-col items-center text-center">
            <span className="font-semibold text-text">सिफारिस गर्ने :-</span>
            <span className="mt-1 text-[11px] text-text-muted">Recommended By</span>
          </div>

          {/* Approver / कार्यालय प्रमुख */}
          <div className="flex flex-col items-end text-right sm:items-center sm:text-center">
            <span className="font-semibold text-text">प्रमाणित गर्ने :-</span>
            <span className="mt-1 text-[11px] text-text-muted">Approver</span>
            <span className="mt-0.5 font-medium text-text">कार्यालय प्रमुख</span>
          </div>
        </div>
      </div>
    </div>
  );
}
