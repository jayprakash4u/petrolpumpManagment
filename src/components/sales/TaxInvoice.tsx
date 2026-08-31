import type { ReceiptDTO } from "@/lib/actions/sales";
import { amountInWords } from "@/lib/number-to-words";

function formatPaymentDisplay(receipt: ReceiptDTO): string {
  if (receipt.paymentMethod === "ONLINE") {
    const provider = receipt.onlineProvider ? receipt.onlineProvider.replace("_", " ") : "QR / Wallet";
    return receipt.paymentRef ? `${provider} (Ref: ${receipt.paymentRef})` : `${provider} QR`;
  }
  if (receipt.paymentMethod === "CARD") {
    return receipt.paymentRef ? `Card / POS (${receipt.paymentRef})` : "Card / POS";
  }
  if (receipt.paymentMethod === "CREDIT") {
    return `Credit Account (${receipt.customerName || "Customer"})`;
  }
  return "Cash";
}

/**
 * The one canonical printable tax invoice layout. Every screen that prints
 * a bill — the receipt shown right after a sale, the quick reprint slip,
 * and the full bill details view — renders this same component off the
 * same `ReceiptDTO` shape, so the station name, tax breakdown, and
 * formatting can't drift apart between them the way three separately
 * hand-rolled copies once did.
 */
export function TaxInvoice({ receipt }: { receipt: ReceiptDTO }) {
  const grandTotalStr = receipt.grandTotal ?? receipt.total;
  const grandTotalNum = Number(grandTotalStr.replace(/[^0-9.]/g, "")) || 0;

  return (
    <div className="print-area overflow-hidden rounded-xl border border-border bg-surface text-text shadow-xs print:rounded-none print:border-0 print:bg-white print:text-black">
      {/* Header band */}
      <div className="bg-text py-2 text-center font-display text-[12px] font-bold tracking-[0.35em] text-bg print:bg-black print:text-white">
        TAX INVOICE
      </div>

      <div className="space-y-3 p-5 text-xs">
        {/* Station block */}
        <div className="border-b border-border pb-3 text-center">
          <div className="font-display text-[16px] font-bold text-text print:text-black">{receipt.stationName}</div>
          <div className="mt-0.5 text-[10.5px] text-text-muted print:text-gray-600">
            PAN / VAT: 601234567 · Kathmandu, Nepal
          </div>
        </div>

        {/* Bill To / Invoice meta */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-b border-border pb-3 text-[11px]">
          <div>
            <span className="block text-[10px] text-text-muted">Bill To</span>
            <strong className="text-text print:text-black">{receipt.customerName || "Walk-In Retail Customer"}</strong>
            {receipt.customerPhone && (
              <div className="text-[10.5px] text-text-muted">Mobile: {receipt.customerPhone}</div>
            )}
            {receipt.customerPanNo && (
              <div className="text-[10.5px] text-text-muted">PAN/VAT: {receipt.customerPanNo}</div>
            )}
            {receipt.vehicleNo && <div className="font-mono text-[10.5px] text-text-muted">{receipt.vehicleNo}</div>}
          </div>
          <div className="text-right">
            <span className="block text-[10px] text-text-muted">Invoice No</span>
            <strong className="font-mono text-accent print:text-black">
              {receipt.billNumber} (#{receipt.receiptNo})
            </strong>
            <div className="mt-0.5 text-[10px] text-text-muted">{receipt.at}</div>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="bg-surface-hi text-[10px] uppercase tracking-wide text-text-muted print:bg-gray-100">
              <th className="border border-border px-2 py-1.5">Product</th>
              <th className="border border-border px-2 py-1.5 text-right">Qty</th>
              <th className="border border-border px-2 py-1.5 text-right">Rate</th>
              <th className="border border-border px-2 py-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border px-2 py-2 font-semibold">{receipt.fuelLabel}</td>
              <td className="border border-border px-2 py-2 text-right">{receipt.liters}</td>
              <td className="border border-border px-2 py-2 text-right">{receipt.rate}</td>
              <td className="border border-border px-2 py-2 text-right font-semibold">{receipt.total}</td>
            </tr>
          </tbody>
        </table>

        {/* Amount in words + totals box */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-[10.5px] text-text-muted">
            <span className="block text-[10px] font-semibold uppercase tracking-wide">In Words</span>
            <span className="italic">{amountInWords(grandTotalNum)}</span>
          </div>

          <table className="w-full border-collapse text-[11px] sm:w-56 sm:shrink-0">
            <tbody>
              {receipt.discount && (
                <>
                  <tr>
                    <td className="border border-border px-2 py-1 text-text-muted">Gross Total</td>
                    <td className="border border-border px-2 py-1 text-right">{receipt.total}</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-2 py-1 text-text-muted">Discount</td>
                    <td className="border border-border px-2 py-1 text-right">-{receipt.discount}</td>
                  </tr>
                </>
              )}
              {receipt.subtotal && (
                <tr>
                  <td className="border border-border px-2 py-1 text-text-muted">Taxable</td>
                  <td className="border border-border px-2 py-1 text-right">{receipt.subtotal}</td>
                </tr>
              )}
              {receipt.vatAmount && (
                <tr>
                  <td className="border border-border px-2 py-1 text-text-muted">VAT 13%</td>
                  <td className="border border-border px-2 py-1 text-right">{receipt.vatAmount}</td>
                </tr>
              )}
              <tr className="font-bold">
                <td className="border border-border bg-surface-hi px-2 py-1.5 print:bg-gray-100">Net Amount</td>
                <td className="border border-border bg-surface-hi px-2 py-1.5 text-right text-accent print:bg-gray-100 print:text-black">
                  {grandTotalStr}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment mode / change */}
        <div className="flex items-center justify-between border-t border-dashed border-border pt-2 text-[11px]">
          <span className="text-text-muted">
            Payment Mode: <strong className="text-text print:text-black">{formatPaymentDisplay(receipt)}</strong>
          </span>
          {receipt.changeDue && <span className="font-semibold text-success">Change: {receipt.changeDue}</span>}
        </div>
      </div>
    </div>
  );
}
