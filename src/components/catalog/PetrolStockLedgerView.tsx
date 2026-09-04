"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Printer,
  ArrowLeft,
  Search,
  CheckCircle2,
  Package,
  Building2,
} from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";

export interface PetrolLedgerEntry {
  id: string;
  sn?: number;
  dateBS: string;
  particulars: string;
  inQty: number;
  outQty: number;
  balance?: number;
  isOpening?: boolean;
}

const STORAGE_KEY_PETROL = "fsm_petrol_stock_ledger_records";

const INITIAL_PETROL_LEDGER_ENTRIES: PetrolLedgerEntry[] = [
  {
    id: "ptl-open",
    dateBS: "",
    particulars: "Opening Stock",
    inQty: 4850.25,
    outQty: 0,
    isOpening: true,
  },
  {
    id: "ptl-1",
    sn: 1,
    dateBS: "2083.05.18",
    particulars: "NOC 20009818 (Nepal Oil Corporation Thanxot Depo)",
    inQty: 4000.0,
    outQty: 0,
  },
  {
    id: "ptl-2",
    sn: 2,
    dateBS: "2083.05.18",
    particulars: "CASH 10-4152-083/084",
    inQty: 0,
    outQty: 15.0,
  },
  {
    id: "ptl-3",
    sn: 3,
    dateBS: "2083.05.18",
    particulars: "Kantipur Media Group Pvt. Ltd. 10-4153-083/084",
    inQty: 0,
    outQty: 60.0,
  },
  {
    id: "ptl-4",
    sn: 4,
    dateBS: "2083.05.18",
    particulars: "CASH 10-4155-083/084",
    inQty: 0,
    outQty: 10.5,
  },
  {
    id: "ptl-5",
    sn: 5,
    dateBS: "2083.05.18",
    particulars: "Siddhartha Bank Ltd. 10-4158-083/084",
    inQty: 0,
    outQty: 35.0,
  },
  {
    id: "ptl-6",
    sn: 6,
    dateBS: "2083.05.18",
    particulars: "Apex College Vehicle Cell 10-4162-083/084",
    inQty: 0,
    outQty: 50.0,
  },
  {
    id: "ptl-7",
    sn: 7,
    dateBS: "2083.05.18",
    particulars: "CASH 10-4205-083/084",
    inQty: 0,
    outQty: 12.0,
  },
  {
    id: "ptl-8",
    sn: 8,
    dateBS: "2083.05.18",
    particulars: "Himalayan Travels & Tours 10-4210-083/084",
    inQty: 0,
    outQty: 45.0,
  },
  {
    id: "ptl-9",
    sn: 9,
    dateBS: "2083.05.18",
    particulars: "CASH 10-4218-083/084",
    inQty: 0,
    outQty: 20.0,
  },
  {
    id: "ptl-10",
    sn: 10,
    dateBS: "2083.05.18",
    particulars: "CASH 10-4220-083/084",
    inQty: 0,
    outQty: 30.0,
  },
  {
    id: "ptl-11",
    sn: 11,
    dateBS: "2083.05.18",
    particulars: "Nepal Telecom Regional Office 10-4225-083/084",
    inQty: 0,
    outQty: 80.0,
  },
  {
    id: "ptl-12",
    sn: 12,
    dateBS: "2083.05.19",
    particulars: "amrit-eps 200461 1935",
    inQty: 0,
    outQty: 22.15,
  },
  {
    id: "ptl-13",
    sn: 13,
    dateBS: "2083.05.19",
    particulars: "CASH 10-4256-083/084",
    inQty: 0,
    outQty: 25.0,
  },
  {
    id: "ptl-14",
    sn: 14,
    dateBS: "2083.05.19",
    particulars: "CASH 10-4258-083/084",
    inQty: 0,
    outQty: 14.5,
  },
  {
    id: "ptl-15",
    sn: 15,
    dateBS: "2083.05.19",
    particulars: "Pathao Nepal Fleet Delivery 10-4260-083/084",
    inQty: 0,
    outQty: 40.0,
  },
  {
    id: "ptl-16",
    sn: 16,
    dateBS: "2083.05.19",
    particulars: "CASH 10-4265-083/084",
    inQty: 0,
    outQty: 18.0,
  },
  {
    id: "ptl-17",
    sn: 17,
    dateBS: "2083.05.19",
    particulars: "United Insurance Co. Nepal 10-4270-083/084",
    inQty: 0,
    outQty: 35.0,
  },
  {
    id: "ptl-18",
    sn: 18,
    dateBS: "2083.05.19",
    particulars: "CASH 10-4275-083/084",
    inQty: 0,
    outQty: 16.5,
  },
  {
    id: "ptl-19",
    sn: 19,
    dateBS: "2083.05.19",
    particulars: "Everest Bank Ltd. Operational Pool 10-4280-083/084",
    inQty: 0,
    outQty: 45.0,
  },
  {
    id: "ptl-20",
    sn: 20,
    dateBS: "2083.05.19",
    particulars: "CASH 10-4285-083/084",
    inQty: 0,
    outQty: 30.0,
  },
];

interface PetrolStockLedgerViewProps {
  stationName?: string;
  stationAddress?: string;
}

export function PetrolStockLedgerView({
  stationName = "Nepal Petroleum",
  stationAddress = "New Baneshwor-31, Kathmandu",
}: PetrolStockLedgerViewProps) {
  const [entries, setEntries] = useState<PetrolLedgerEntry[]>(() => {
    if (typeof window === "undefined") return INITIAL_PETROL_LEDGER_ENTRIES;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PETROL);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PETROL_LEDGER_ENTRIES;
  });

  const [fromDate, setFromDate] = useState("2083.05.18");
  const [toDate, setToDate] = useState("2083.05.19");
  const [activeDateRange, setActiveDateRange] = useState({ from: "2083.05.18", to: "2083.05.19" });
  const [searchQuery, setSearchQuery] = useState("");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleSubmitFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveDateRange({ from: fromDate, to: toDate });
    setSuccessToast(`Report updated for ${fromDate} to ${toDate}`);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((r) => {
      if (r.isOpening) return true;
      if (activeDateRange.from && r.dateBS < activeDateRange.from) return false;
      if (activeDateRange.to && r.dateBS > activeDateRange.to) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          r.particulars.toLowerCase().includes(q) ||
          r.dateBS.includes(q) ||
          String(r.inQty).includes(q) ||
          String(r.outQty).includes(q)
        );
      }
      return true;
    });
  }, [entries, activeDateRange, searchQuery]);

  const computedRows = useMemo(() => {
    let runningBalance = 0;
    return filteredEntries.map((item) => {
      if (item.isOpening) {
        runningBalance = item.inQty;
        return {
          ...item,
          balance: runningBalance,
        };
      }
      runningBalance = runningBalance + item.inQty - item.outQty;
      return {
        ...item,
        balance: runningBalance,
      };
    });
  }, [filteredEntries]);

  const totalIn = useMemo(() => {
    return computedRows.reduce((sum, r) => sum + r.inQty, 0);
  }, [computedRows]);

  const totalOut = useMemo(() => {
    return computedRows.reduce((sum, r) => sum + r.outQty, 0);
  }, [computedRows]);

  const finalBalance = useMemo(() => {
    if (computedRows.length === 0) return 0;
    return computedRows[computedRows.length - 1].balance || 0;
  }, [computedRows]);

  const handleDownloadExcel = () => {
    const headers = ["S.No", "Date", "Particulars", "In", "Out", "Balance"];
    const rowsText = computedRows.map((r) => [
      r.isOpening ? "" : r.sn || "",
      r.dateBS,
      `"${r.particulars.replace(/"/g, '""')}"`,
      r.inQty.toFixed(3),
      r.outQty > 0 ? r.outQty.toFixed(3) : "0",
      (r.balance || 0).toFixed(3),
    ]);
    const totalsText = ["", "", "Total", totalIn.toFixed(2), totalOut.toFixed(2), finalBalance.toFixed(2)];
    const csvContent = [
      `"${stationName}"`,
      `"${stationAddress}"`,
      `"Petrol (MS) Stock Ledger (${activeDateRange.from} to ${activeDateRange.to})"`,
      "",
      headers.join(","),
      ...rowsText.map((r) => r.join(",")),
      totalsText.join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `petrol_stock_ledger_${activeDateRange.from}_${activeDateRange.to}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. Page Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3 print:hidden">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl flex items-center gap-2">
            <Building2 size={20} className="text-accent" />
            <span>Stock Ledger (Petrol - MS)</span>
          </h1>
          <p className="text-[12px] text-text-muted mt-0.5">
            Audit book of tank receipts, nozzle retail sales, institutional credit dispensings, and daily balances.
          </p>
        </div>

        <Link href="/catalog">
          <GhostButton
            type="button"
            className="h-8 px-3 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-surface-hi flex items-center gap-1.5 cursor-pointer text-text hover:text-accent transition-colors shadow-xs"
          >
            <ArrowLeft size={13} />
            <span>« Back</span>
          </GhostButton>
        </Link>
      </div>

      {/* Toast message */}
      {successToast && (
        <div className="animate-fade-in flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3 text-xs font-semibold text-success shadow-xs">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 2. Main Box / Card */}
      <div className="rounded-xl border border-border bg-surface shadow-xs print:border-none print:shadow-none space-y-4 p-4 sm:p-5">
        {/* Card Header & Filter Form */}
        <div className="border-b border-border/80 pb-4">
          <div className="font-display text-xs font-bold text-text uppercase tracking-wider mb-3">
            Stock Ledger Period Filter
          </div>

          <form
            onSubmit={handleSubmitFilter}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end print:hidden"
          >
            {/* From Date */}
            <div className="sm:col-span-4 space-y-1">
              <label className="text-xs font-medium text-text-muted">From Date (BS):</label>
              <input
                type="text"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8.5 w-full rounded-lg border border-border bg-surface px-2.5 text-xs font-mono text-text focus:border-accent focus:outline-hidden"
              />
            </div>

            {/* To Date */}
            <div className="sm:col-span-4 space-y-1">
              <label className="text-xs font-medium text-text-muted">To Date (BS):</label>
              <input
                type="text"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8.5 w-full rounded-lg border border-border bg-surface px-2.5 text-xs font-mono text-text focus:border-accent focus:outline-hidden"
              />
            </div>

            {/* Submit Action Button */}
            <div className="sm:col-span-4">
              <PrimaryButton
                type="submit"
                className="h-8.5 w-full text-xs font-semibold shadow-xs"
              >
                Submit
              </PrimaryButton>
            </div>
          </form>
        </div>

        {/* 3. Station Branding Header */}
        <div className="text-center py-3 space-y-1 border-b border-border/60">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-text tracking-wide">
            {stationName}
          </h2>
          <p className="text-xs text-text-muted font-medium">{stationAddress}</p>
          <p className="text-xs font-semibold text-accent pt-1">
            Petrol (MS) Stock Ledger ({activeDateRange.from} to {activeDateRange.to})
          </p>
        </div>

        {/* 4. Action Bar (Download Excel & Search) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 print:hidden">
          <div className="flex items-center gap-2">
            <PrimaryButton
              type="button"
              onClick={handleDownloadExcel}
              className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs"
            >
              <FileSpreadsheet size={14} />
              <span>Download Excel</span>
            </PrimaryButton>

            <GhostButton
              type="button"
              onClick={handlePrint}
              className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-2xs"
            >
              <Printer size={14} />
              <span>Print</span>
            </GhostButton>
          </div>

          <div className="relative w-48 sm:w-64">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search ledger entries…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-7.5 pr-3 text-xs w-full rounded-lg border border-border bg-surface text-text focus:border-accent focus:outline-hidden"
            />
          </div>
        </div>

        {/* 5. Ledger Data Table */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[850px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-hi/80 font-data text-[11px] tracking-wide text-text-muted select-none">
                <th className="border-r border-border/60 px-3 py-2.5 text-center w-14 font-medium">S.No</th>
                <th className="border-r border-border/60 px-3 py-2.5 w-28 font-medium">Date</th>
                <th className="border-r border-border/60 px-3 py-2.5 font-medium">Particulars</th>
                <th className="border-r border-border/60 px-3 py-2.5 text-right w-28 font-medium">In</th>
                <th className="border-r border-border/60 px-3 py-2.5 text-right w-28 font-medium">Out</th>
                <th className="px-3 py-2.5 text-right w-32 font-medium">Balance</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 text-[11.5px]">
              {computedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package size={22} className="text-text-muted/40" />
                      <span>No ledger transactions found for this period.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                computedRows.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={
                      r.isOpening
                        ? "bg-surface-hi/50 font-semibold text-text whitespace-nowrap"
                        : "hover:bg-surface-hi/40 transition-colors whitespace-nowrap text-text font-normal"
                    }
                  >
                    {/* S.No */}
                    <td className="border-r border-border/60 px-3 py-2.5 text-center font-data text-text-muted">
                      {r.isOpening ? "" : r.sn || idx}
                    </td>

                    {/* Date */}
                    <td className="border-r border-border/60 px-3 py-2.5 font-mono text-text">
                      {r.dateBS}
                    </td>

                    {/* Particulars */}
                    <td className="border-r border-border/60 px-3 py-2.5 max-w-md truncate text-text font-medium">
                      {r.particulars}
                    </td>

                    {/* In */}
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data font-bold text-success">
                      {r.inQty > 0
                        ? r.inQty.toLocaleString(undefined, {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                          })
                        : "0"}
                    </td>

                    {/* Out */}
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data text-text">
                      {r.isOpening
                        ? ""
                        : r.outQty > 0
                        ? r.outQty.toLocaleString(undefined, {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                          })
                        : "0"}
                    </td>

                    {/* Balance */}
                    <td className="px-3 py-2.5 text-right font-data font-bold text-accent">
                      {(r.balance || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Summary / Total Footer Row */}
            {computedRows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-surface-hi/80 font-data text-xs font-bold text-text whitespace-nowrap">
                  <td className="border-r border-border/60 px-3 py-2.5"></td>
                  <td className="border-r border-border/60 px-3 py-2.5"></td>
                  <td className="border-r border-border/60 px-3 py-2.5 font-sans font-bold">TOTAL</td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-bold text-success">
                    {totalIn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-bold text-text">
                    {totalOut.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-accent">
                    {finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* 6. Signature / Authorization Footer matching Nepal Statutory Layout */}
        <div className="grid grid-cols-3 gap-4 pt-8 pb-4 text-xs text-text border-t border-dashed border-border/80 mt-6">
          <div className="text-left space-y-1">
            <div className="font-semibold text-text">तयार गर्ने :-</div>
            <div className="text-text-muted text-[11px]">Preparer</div>
            <div className="pt-4 text-text font-medium">लेखापाल</div>
          </div>

          <div className="text-center space-y-1">
            <div className="font-semibold text-text">बुझाउने :-</div>
            <div className="text-text-muted text-[11px]">Authorized Cashier / Driver</div>
            <div className="pt-4 text-text font-medium">Recieved By</div>
          </div>

          <div className="text-right space-y-1">
            <div className="font-semibold text-text">प्रमाणित गर्ने :-</div>
            <div className="text-text-muted text-[11px]">Approver</div>
            <div className="pt-4 text-text font-medium">कार्यालय प्रमुख</div>
          </div>
        </div>
      </div>
    </div>
  );
}
