"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Download, Search, Pencil, Check, X } from "lucide-react";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

export interface CombinedPurchaseEntry {
  id: string;
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
  tankALiters: number;
  tankBLiters: number;
}

const MOCK_COMBINED_PURCHASES: CombinedPurchaseEntry[] = [
  {
    id: "p-01",
    sn: 1,
    dateBS: "2083-Bhadra-18",
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
    tankALiters: 2982.0,
    tankBLiters: 0.0,
  },
  {
    id: "p-02",
    sn: 2,
    dateBS: "2083-Bhadra-18",
    billNo: "3009043",
    density: 735,
    temperature: 27,
    tankerNo: "1882",
    purchaseLiters: 9000.0,
    ratePerL: 170.50256,
    taxableAmount: 1534523.04,
    vatAmount: 199488.0,
    totalAmount: 1734011.04,
    remarks: "",
    tankALiters: 9000.0,
    tankBLiters: 0.0,
  },
  {
    id: "p-03",
    sn: 3,
    dateBS: "2083-Bhadra-17",
    billNo: "30008743",
    density: 731,
    temperature: 27,
    tankerNo: "BP01004KA1662",
    purchaseLiters: 6000.0,
    ratePerL: 170.50256,
    taxableAmount: 1023015.36,
    vatAmount: 132992.0,
    totalAmount: 1156007.36,
    remarks: "",
    tankALiters: 6000.0,
    tankBLiters: 0.0,
  },
  {
    id: "p-04",
    sn: 4,
    dateBS: "2083-Bhadra-16",
    billNo: "30008453",
    density: 742,
    temperature: 28,
    tankerNo: "2201",
    purchaseLiters: 6000.0,
    ratePerL: 170.50256,
    taxableAmount: 1023015.36,
    vatAmount: 132992.0,
    totalAmount: 1156007.36,
    remarks: "",
    tankALiters: 6000.0,
    tankBLiters: 0.0,
  },
  {
    id: "p-05",
    sn: 5,
    dateBS: "2083-Bhadra-16",
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
    tankALiters: 3988.0,
    tankBLiters: 0.0,
  },
  {
    id: "p-06",
    sn: 6,
    dateBS: "2083-Bhadra-15",
    billNo: "30008161",
    density: 743,
    temperature: 27,
    tankerNo: "4349",
    purchaseLiters: 12000.0,
    ratePerL: 170.50256,
    taxableAmount: 2046030.72,
    vatAmount: 265983.99,
    totalAmount: 2312014.71,
    remarks: "",
    tankALiters: 12000.0,
    tankBLiters: 0.0,
  },
  {
    id: "p-07",
    sn: 7,
    dateBS: "2083-Bhadra-13",
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
    tankALiters: 3000.0,
    tankBLiters: 0.0,
  },
  {
    id: "p-08",
    sn: 8,
    dateBS: "2083-Bhadra-13",
    billNo: "30007891",
    density: 742,
    temperature: 28,
    tankerNo: "BP01004KA1662",
    purchaseLiters: 9000.0,
    ratePerL: 170.50256,
    taxableAmount: 1534523.04,
    vatAmount: 199488.0,
    totalAmount: 1734011.04,
    remarks: "",
    tankALiters: 9000.0,
    tankBLiters: 0.0,
  },
  {
    id: "p-09",
    sn: 9,
    dateBS: "2083-Bhadra-11",
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
    tankALiters: 3000.0,
    tankBLiters: 0.0,
  },
  {
    id: "p-10",
    sn: 10,
    dateBS: "2083-Bhadra-11",
    billNo: "30007613",
    density: 744,
    temperature: 27,
    tankerNo: "BP01004KA1662",
    purchaseLiters: 12000.0,
    ratePerL: 170.50256,
    taxableAmount: 2046030.72,
    vatAmount: 265983.99,
    totalAmount: 2312014.71,
    remarks: "",
    tankALiters: 12000.0,
    tankBLiters: 0.0,
  },
];

export function CombinedPurchaseReportView({
  title = "Petrol/diesel Purchase Report",
  stationPan = "300054891",
  stationName = "Nepal Petroleum Center",
  stationAddress = "Kathmandu, Nepal",
}: {
  title?: string;
  stationPan?: string;
  stationName?: string;
  stationAddress?: string;
}) {
  const [dateFrom, setDateFrom] = useState("2083-05-01");
  const [dateTo, setDateTo] = useState("2083-05-18");
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<CombinedPurchaseEntry[]>(MOCK_COMBINED_PURCHASES);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit fields
  const [editBillNo, setEditBillNo] = useState("");
  const [editTankerNo, setEditTankerNo] = useState("");
  const [editDensity, setEditDensity] = useState("");
  const [editTemp, setEditTemp] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  const startEdit = (r: CombinedPurchaseEntry) => {
    setEditingId(r.id);
    setEditBillNo(r.billNo);
    setEditTankerNo(r.tankerNo);
    setEditDensity(String(r.density));
    setEditTemp(String(r.temperature));
    setEditRemarks(r.remarks);
  };

  const saveEdit = (id: string) => {
    setEntries((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            billNo: editBillNo,
            tankerNo: editTankerNo,
            density: editDensity,
            temperature: editTemp,
            remarks: editRemarks,
          };
        }
        return r;
      })
    );
    setEditingId(null);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.trim().toLowerCase();
    return entries.filter(
      (r) =>
        r.billNo.toLowerCase().includes(q) ||
        r.tankerNo.toLowerCase().includes(q) ||
        r.dateBS.toLowerCase().includes(q)
    );
  }, [entries, search]);

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
      "Tank A (L)",
      "Tank B (L)",
    ];
    const rows = filtered.map((r) => [
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
      r.tankALiters.toFixed(3),
      r.tankBLiters.toFixed(3),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `petrol_diesel_purchase_report_${dateFrom}_${dateTo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full">
      {/* Header bar */}
      <div className="mb-4 flex items-center justify-between border-b border-border/80 pb-3 print:hidden">
        <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl">
          {title}
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
          {/* Print action link */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted transition-colors hover:text-accent"
            >
              <span>Print / {title.toLowerCase()}</span>
              <span className="text-sm">🖨️</span>
            </button>
          </div>

          {/* Date range filter form */}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-text-muted">
                Date from
              </label>
              <input
                type="text"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="nepalidate"
                className="h-8.5 rounded-lg border border-border bg-surface-hi/50 px-3 text-xs font-medium text-text focus:border-accent focus:outline-hidden font-data"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-text-muted">
                Date to
              </label>
              <input
                type="text"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="nepalidate"
                className="h-8.5 rounded-lg border border-border bg-surface-hi/50 px-3 text-xs font-medium text-text focus:border-accent focus:outline-hidden font-data"
              />
            </div>

            <PrimaryButton type="button" className="h-8.5 px-6 text-xs font-semibold">
              Submit
            </PrimaryButton>
          </div>
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
        </div>

        {/* Table Toolbar */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-md border border-border bg-surface px-3 py-1 text-xs font-medium text-text shadow-2xs hover:bg-surface-hi"
            >
              Print
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="rounded-md border border-border bg-surface px-3 py-1 text-xs font-medium text-text shadow-2xs hover:bg-surface-hi"
            >
              CSV
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted">Search:</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="h-7.5 rounded-md border border-border bg-bg px-2.5 text-xs text-text focus:border-accent focus:outline-hidden"
            />
          </div>
        </div>

        {/* Tax Ledger Data Table */}
        <div className="overflow-x-auto rounded-lg border border-border print:border-black">
          <table className="w-full min-w-[1100px] border-collapse text-left text-[11.5px] print:min-w-full print:text-[10px]">
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
                <th className="border-r border-border px-2.5 py-2 text-right print:border-black">Tank A</th>
                <th className="border-r border-border px-2.5 py-2 text-right print:border-black">Tank B</th>
                <th className="px-2.5 py-2 text-center print:hidden">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-3 py-8 text-center text-xs text-text-muted">
                    No purchases found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/50 text-text transition-colors hover:bg-surface-hi/40 print:border-black"
                  >
                    <td className="border-r border-border px-2.5 py-2 text-center text-text-muted print:border-black">
                      {row.sn}
                    </td>
                    <td className="border-r border-border px-2.5 py-2 text-center font-data print:border-black">
                      {row.dateBS}
                    </td>
                    <td className="border-r border-border px-2.5 py-2 text-center font-data text-accent font-medium print:border-black print:text-black">
                      {editingId === row.id ? (
                        <input
                          type="text"
                          value={editBillNo}
                          onChange={(e) => setEditBillNo(e.target.value)}
                          className="h-6 w-20 rounded border border-accent bg-bg px-1 text-center font-data text-xs text-text"
                        />
                      ) : (
                        row.billNo
                      )}
                    </td>
                    <td className="border-r border-border px-2 py-2 text-center font-data print:border-black">
                      {editingId === row.id ? (
                        <input
                          type="text"
                          value={editDensity}
                          onChange={(e) => setEditDensity(e.target.value)}
                          className="h-6 w-14 rounded border border-accent bg-bg px-1 text-center font-data text-xs text-text"
                        />
                      ) : (
                        row.density
                      )}
                    </td>
                    <td className="border-r border-border px-2 py-2 text-center font-data print:border-black">
                      {editingId === row.id ? (
                        <input
                          type="text"
                          value={editTemp}
                          onChange={(e) => setEditTemp(e.target.value)}
                          className="h-6 w-14 rounded border border-accent bg-bg px-1 text-center font-data text-xs text-text"
                        />
                      ) : (
                        row.temperature
                      )}
                    </td>
                    <td className="border-r border-border px-2.5 py-2 text-center font-data font-semibold tracking-wide print:border-black">
                      {editingId === row.id ? (
                        <input
                          type="text"
                          value={editTankerNo}
                          onChange={(e) => setEditTankerNo(e.target.value.toUpperCase())}
                          className="h-6 w-28 rounded border border-accent bg-bg px-1 text-center font-mono text-xs text-text uppercase"
                        />
                      ) : (
                        row.tankerNo
                      )}
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
                      {editingId === row.id ? (
                        <input
                          type="text"
                          value={editRemarks}
                          onChange={(e) => setEditRemarks(e.target.value)}
                          className="h-6 w-20 rounded border border-accent bg-bg px-1 text-center text-xs text-text"
                        />
                      ) : (
                        row.remarks || ""
                      )}
                    </td>
                    <td className="border-r border-border px-2.5 py-2 text-right font-data print:border-black">
                      {row.tankALiters.toLocaleString("en-IN", {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })}
                    </td>
                    <td className="border-r border-border px-2.5 py-2 text-right font-data text-text-muted print:text-black">
                      {row.tankBLiters.toLocaleString("en-IN", {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })}
                    </td>
                    <td className="px-2.5 py-2 text-center print:hidden">
                      {editingId === row.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => saveEdit(row.id)}
                            className="rounded bg-accent px-2 py-0.5 text-[11px] font-semibold text-white shadow-2xs hover:bg-accent/90"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded border border-border px-1.5 py-0.5 text-[11px] text-text-muted hover:bg-surface-hi"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="rounded bg-[#1B4D8C] px-3 py-0.75 text-[11px] font-semibold text-white shadow-2xs hover:bg-[#1B4D8C]/90"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Status Footer */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-text-muted print:hidden">
          <span>
            Showing 1 to {filtered.length} of 470 entries
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded border border-border px-2.5 py-1 text-xs text-text-muted hover:bg-surface-hi"
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded border border-accent bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent"
            >
              1
            </button>
            <button
              type="button"
              className="rounded border border-border px-2.5 py-1 text-xs text-text-muted hover:bg-surface-hi"
            >
              2
            </button>
            <button
              type="button"
              className="rounded border border-border px-2.5 py-1 text-xs text-text-muted hover:bg-surface-hi"
            >
              3
            </button>
            <button
              type="button"
              className="rounded border border-border px-2.5 py-1 text-xs text-text-muted hover:bg-surface-hi"
            >
              4
            </button>
            <button
              type="button"
              className="rounded border border-border px-2.5 py-1 text-xs text-text-muted hover:bg-surface-hi"
            >
              5
            </button>
            <span className="px-1 text-xs">...</span>
            <button
              type="button"
              className="rounded border border-border px-2.5 py-1 text-xs text-text-muted hover:bg-surface-hi"
            >
              47
            </button>
            <button
              type="button"
              className="rounded border border-border px-2.5 py-1 text-xs text-text-muted hover:bg-surface-hi"
            >
              Next
            </button>
          </div>
        </div>

        {/* Statutory Signatures Section */}
        <div className="mt-12 flex items-center justify-between pt-4 text-center text-[12px] sm:text-[13px]">
          {/* Presenter / लेखापाल */}
          <div className="flex flex-col items-start text-left">
            <span className="font-semibold text-text">पेश गर्ने :-</span>
            <span className="mt-1 text-[11px] text-text-muted">Presenter</span>
            <span className="mt-0.5 font-medium text-text">लेखापाल</span>
          </div>

          {/* Approver / कार्यालय प्रमुख */}
          <div className="flex flex-col items-end text-right">
            <span className="font-semibold text-text">प्रमाणित गर्ने :-</span>
            <span className="mt-1 text-[11px] text-text-muted">Approver</span>
            <span className="mt-0.5 font-medium text-text">कार्यालय प्रमुख</span>
          </div>
        </div>
      </div>
    </div>
  );
}
