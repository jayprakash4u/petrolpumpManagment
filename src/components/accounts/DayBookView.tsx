"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays,
  Printer,
  Download,
  Search,
  CheckCircle2,
  Calendar,
  BookOpen,
} from "lucide-react";
import { formatDayBookItems } from "@/lib/accounts";
import { getVoucherEntries } from "@/lib/mock/accounts";
import { fmtRs } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { GhostButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";

export function DayBookView() {
  const [vouchers] = useState(() => getVoucherEntries());
  const [selectedDateBS, setSelectedDateBS] = useState("2083-05-08");
  const [searchQuery, setSearchQuery] = useState("");

  const dayBookItems = useMemo(() => {
    const items = formatDayBookItems(vouchers, selectedDateBS);
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.voucherNo.toLowerCase().includes(q) ||
        item.particulars.toLowerCase().includes(q) ||
        item.debitLedgerName.toLowerCase().includes(q) ||
        item.creditLedgerName.toLowerCase().includes(q)
    );
  }, [vouchers, selectedDateBS, searchQuery]);

  const totalDebit = dayBookItems.reduce((sum, d) => sum + d.debitAmountNpr, 0);
  const totalCredit = dayBookItems.reduce((sum, d) => sum + d.creditAmountNpr, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Time",
      "Voucher #",
      "Type",
      "Debit Account",
      "Credit Account",
      "Particulars / Narration",
      "Debit (NPR)",
      "Credit (NPR)",
      "Prepared By",
    ];

    const rows = dayBookItems.map((d) => [
      `"${d.time}"`,
      `"${d.voucherNo}"`,
      `"${d.voucherType}"`,
      `"${d.debitLedgerName}"`,
      `"${d.creditLedgerName}"`,
      `"${d.particulars.replace(/"/g, '""')}"`,
      `"${d.debitAmountNpr}"`,
      `"${d.creditAmountNpr}"`,
      `"${d.preparedBy}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `day_book_${selectedDateBS}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <CalendarDays size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">Day Book (दैनिक खाता)</h3>
            <p className="text-[12.5px] text-text-muted">
              Unified chronological register of all transactions, receipts, payments, and contra entries for the selected day.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Day Book
          </GhostButton>
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export CSV
          </GhostButton>
        </div>
      </div>

      {/* Date & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-accent" />
          <span className="text-[12.5px] font-medium text-text-muted">Selected Date (BS):</span>
          <Select
            value={selectedDateBS}
            onChange={(e) => setSelectedDateBS(e.target.value)}
            className="text-[12.5px] w-auto py-1"
          >
            <option value="2083-05-08">2083-05-08 (Today)</option>
            <option value="2083-05-07">2083-05-07 (Yesterday)</option>
            <option value="2083-05-06">2083-05-06</option>
          </Select>
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search particulars or account..."
            className="pl-8 text-[12px]"
          />
        </div>
      </div>

      {/* Day Book Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-hi font-medium text-text-muted">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Voucher #</th>
                <th className="p-3">Particulars & Narration</th>
                <th className="p-3">Debit Ledger (Dr)</th>
                <th className="p-3">Credit Ledger (Cr)</th>
                <th className="p-3 text-right">Debit (NPR)</th>
                <th className="p-3 text-right">Credit (NPR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dayBookItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-text-muted">
                    No transactions recorded for {selectedDateBS}.
                  </td>
                </tr>
              ) : (
                dayBookItems.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-hi/40 transition-colors">
                    <td className="p-3 font-data text-text-muted whitespace-nowrap">{item.time}</td>
                    <td className="p-3 font-data font-bold text-accent whitespace-nowrap">{item.voucherNo}</td>
                    <td className="p-3 font-medium text-text">{item.particulars}</td>
                    <td className="p-3 text-text-muted">{item.debitLedgerName}</td>
                    <td className="p-3 text-text-muted">{item.creditLedgerName}</td>
                    <td className="p-3 font-data text-right font-semibold text-text whitespace-nowrap">
                      {fmtRs(item.debitAmountNpr)}
                    </td>
                    <td className="p-3 font-data text-right font-semibold text-text whitespace-nowrap">
                      {fmtRs(item.creditAmountNpr)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {dayBookItems.length > 0 && (
              <tfoot className="border-t-2 border-border bg-surface-hi/80 font-bold">
                <tr>
                  <td colSpan={5} className="p-3 text-right text-text">
                    Total Transactions ({dayBookItems.length} entries):
                  </td>
                  <td className="p-3 font-data text-right text-accent text-[13.5px]">
                    {fmtRs(totalDebit)}
                  </td>
                  <td className="p-3 font-data text-right text-accent text-[13.5px]">
                    {fmtRs(totalCredit)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}
