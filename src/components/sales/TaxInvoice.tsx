import React from "react";
import type { ReceiptDTO } from "@/lib/actions/sales";
import { amountInWords } from "@/lib/number-to-words";
import {
  mergeInvoiceConfig,
  type StationBusinessProfile,
  type StationInvoiceSettings,
} from "@/lib/invoice-settings";
import { clsx } from "clsx";

function getHsCode(fuelLabel?: string): string {
  const f = (fuelLabel || "").toUpperCase();
  if (f.includes("PETROL") || f.includes("MS")) return "27101210";
  if (f.includes("DIESEL") || f.includes("HSD")) return "27101910";
  if (f.includes("CNG") || f.includes("GAS") || f.includes("LPG")) return "27112100";
  return "27101210";
}

function formatPaymentMode(paymentMethod: string): string {
  switch (paymentMethod) {
    case "CASH":
      return "Cash";
    case "ONLINE":
      return "Online / QR (Fonepay)";
    case "CARD":
      return "Card / POS";
    case "CREDIT":
      return "Credit";
    default:
      return paymentMethod || "Cash";
  }
}

export interface TaxInvoiceProps {
  receipt: ReceiptDTO;
  business?: Partial<StationBusinessProfile> | null;
  settings?: Partial<StationInvoiceSettings> | null;
  preview?: boolean;
  className?: string;
}

/**
 * Standard Nepal Petrol Pump Master Tax Invoice.
 *
 * Implements the exact layout from the reference image:
 * - Centered circular logo emblem + station name + address + VAT/PAN + phone
 * - "Copy 1 of Original" indicator & "Invoice" header
 * - 2-Column boxed metadata (Party Name, Address, Vehicle No, PAN vs Invoice No, Dates, Payment Mode)
 * - Structured full-width grid table: S.No | HS Code | Description of Goods | Qty | Unit | Rate | Amount
 * - Bottom summary: In Words on left, Gross/Taxable/VAT 13%/Net Amount on right
 * - Receiver Signature vs Authorised Signatory with dynamic station name
 * - Computer Generated Invoice footer with Print timestamp and Printed By
 */
export function TaxInvoice({
  receipt,
  business,
  settings,
  preview = false,
  className,
}: TaxInvoiceProps) {
  const config = mergeInvoiceConfig(
    {
      name: receipt.stationName || business?.name,
      ...business,
    },
    settings
  );

  const st = config;
  const s = config;

  const rawGrand = (receipt as any).grandTotal ?? (receipt as any).total ?? (receipt as any).totalAmount ?? "0";
  const grandTotalStr = typeof rawGrand === "number" ? (rawGrand as number).toFixed(2) : String(rawGrand || "0");
  const grandTotalNum = Number(grandTotalStr.replace(/[^0-9.]/g, "")) || 0;

  const rawTotal = (receipt as any).total ?? (receipt as any).grandTotal ?? (receipt as any).totalAmount ?? grandTotalStr;
  const totalStr = typeof rawTotal === "number" ? (rawTotal as number).toFixed(2) : String(rawTotal || "0");
  const totalNum = Number(totalStr.replace(/[^0-9.]/g, "")) || grandTotalNum;

  // Calculate standard tax breakdown
  const taxableNum = grandTotalNum / 1.13;
  const vatNum = grandTotalNum - taxableNum;
  const taxableStr =
    receipt.taxableAmount ||
    taxableNum.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const vatStr =
    receipt.vatAmount ||
    vatNum.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const grossStr = receipt.discount
    ? totalNum.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : taxableStr;

  const rawLiters = receipt.liters ?? (receipt as any).quantity ?? "0";
  const cleanLiters = String(rawLiters || "0").replace(/[^0-9.]/g, "");

  const rawRate = receipt.rate ?? (receipt as any).ratePerL ?? "0";
  const cleanRate = String(rawRate || "0").replace(/[^0-9.]/g, "");

  const fuelLabel = receipt.fuelLabel ?? (receipt as any).fuel ?? "MS - PETROL";
  const hsCode = getHsCode(fuelLabel);
  const wordsText = `Nepali Rupees ${amountInWords(grandTotalNum).replace(
    / Rupees Only$/i,
    ""
  )} Only`;

  const paper = s.paperSize;

  // =========================================================================
  // 1. 58MM COMPACT MINI THERMAL ROLL
  // =========================================================================
  if (paper === "58MM") {
    return (
      <div
        className={clsx(
          "print-area print-thermal-58 mx-auto w-full max-w-[260px] bg-white text-black font-sans text-[10px] p-3 border border-black shadow-xs print:w-[56mm] print:max-w-none print:border-0 print:p-0",
          className
        )}
      >
        <div className="text-center pb-2 border-b border-black">
          {s.showLogo !== false && (
            st.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={st.logoUrl}
                alt={st.name || "Station Logo"}
                className="mx-auto mb-1.5 max-h-12 max-w-[130px] h-auto w-auto object-contain"
              />
            ) : (
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black text-[10px] font-bold mx-auto mb-1">
                {(st.name || "?").charAt(0).toUpperCase()}
              </div>
            )
          )}
          <div className="font-bold text-[12px] uppercase">{st.name}</div>
          <div className="text-[9px]">{st.address}</div>
          {s.showPan && st.panNo && (
            <div className="text-[9.5px] font-bold">VAT No : {st.panNo}</div>
          )}
          {st.phone && <div className="text-[9px]">Tel. No : {st.phone}</div>}
          <div className="font-bold text-[11px] uppercase mt-1 tracking-wider">
            {s.headerTitle || "Invoice"}
          </div>
        </div>

        <div className="py-2 border-b border-black text-[9px] space-y-0.5">
          <div className="flex justify-between">
            <span>Party:</span>
            <span className="font-bold truncate max-w-[150px]">
              {receipt.customerName || "Walk-In Retail"}
            </span>
          </div>
          {s.showVehicle && receipt.vehicleNo && (
            <div className="flex justify-between">
              <span>Vehicle:</span>
              <span className="font-mono font-bold">{receipt.vehicleNo}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Invoice No:</span>
            <span className="font-mono font-bold">{receipt.billNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{receipt.dateBS || receipt.at}</span>
          </div>
        </div>

        <table className="w-full text-left text-[9px] my-2">
          <thead>
            <tr className="border-b border-black font-bold">
              <th className="py-0.5">Goods</th>
              <th className="py-0.5 text-right">Qty</th>
              <th className="py-0.5 text-right">Rate</th>
              <th className="py-0.5 text-right">Amt</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1 font-semibold">{receipt.fuelLabel}</td>
              <td className="py-1 text-right">{cleanLiters} L</td>
              <td className="py-1 text-right">{cleanRate}</td>
              <td className="py-1 text-right font-bold">{taxableStr}</td>
            </tr>
          </tbody>
        </table>

        <div className="border-t border-black pt-1.5 text-[9px] space-y-0.5">
          {s.showVat && (
            <div className="flex justify-between">
              <span>VAT 13%:</span>
              <span>Rs {vatStr}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-[11px] border-t border-black pt-1">
            <span>Net Amount:</span>
            <span>{grandTotalStr}</span>
          </div>
        </div>

        {s.showAmountInWords && (
          <div className="border-t border-dotted border-black pt-1 mt-1 text-[8.5px] italic">
            In words: {wordsText}
          </div>
        )}

        <div className="border-t border-black pt-2 mt-2 text-center text-[8.5px] space-y-1">
          <div>Mode: {formatPaymentMode(receipt.paymentMethod)}</div>
          {s.showSignature && (
            <div className="pt-2">
              <div className="border-t border-dotted border-black w-24 mx-auto mb-0.5" />
              Authorised Signatory
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. 80MM STANDARD THERMAL POS ROLL
  // =========================================================================
  if (paper === "80MM") {
    return (
      <div
        className={clsx(
          "print-area print-thermal-80 mx-auto w-full max-w-[340px] bg-white text-black font-sans text-xs p-4 border border-black shadow-xs print:w-[78mm] print:max-w-none print:border-0 print:p-0",
          className
        )}
      >
        {/* Header */}
        <div className="text-center pb-3 border-b border-black">
          {s.showLogo !== false && (
            st.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={st.logoUrl}
                alt={st.name || "Station Logo"}
                className="mx-auto mb-2 max-h-16 max-w-[180px] h-auto w-auto object-contain"
              />
            ) : (
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-black text-[12px] font-bold mx-auto mb-1.5">
                {(st.name || "?").charAt(0).toUpperCase()}
              </div>
            )
          )}
          <div className="font-bold text-[14px] uppercase tracking-wide">
            {st.name}
          </div>
          <div className="text-[11px]">{st.address}</div>
          {s.showPan && st.panNo && (
            <div className="text-[11px] font-bold mt-0.5">
              VAT No : {st.panNo}
            </div>
          )}
          {st.phone && <div className="text-[10.5px]">Tel. No : {st.phone}</div>}
          <div className="font-bold text-[13px] uppercase mt-1.5 tracking-widest">
            {s.headerTitle || "Invoice"}
          </div>
        </div>

        {/* 2-Column Info Box */}
        <div className="border border-black my-2.5 p-2 text-[11px] grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <div>
              <span className="text-gray-600">Party:</span>{" "}
              <strong>{receipt.customerName || "Walk-In Retail"}</strong>
            </div>
            {s.showCustomerPan && receipt.customerPanNo && (
              <div>
                <span className="text-gray-600">PAN:</span>{" "}
                {receipt.customerPanNo}
              </div>
            )}
            {s.showVehicle && receipt.vehicleNo && (
              <div>
                <span className="text-gray-600">Veh:</span>{" "}
                <strong className="font-mono">{receipt.vehicleNo}</strong>
              </div>
            )}
          </div>
          <div className="text-right space-y-0.5">
            <div>
              <span className="text-gray-600">Inv #:</span>{" "}
              <strong className="font-mono">{receipt.billNumber}</strong>
            </div>
            <div>
              <span className="text-gray-600">Date:</span>{" "}
              {receipt.dateBS || receipt.at}
            </div>
            <div>
              <span className="text-gray-600">Mode:</span>{" "}
              {formatPaymentMode(receipt.paymentMethod)}
            </div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse border border-black text-[11px] my-2">
          <thead>
            <tr className="bg-gray-100 border-b border-black font-bold">
              <th className="border-r border-black p-1 text-left">Goods</th>
              <th className="border-r border-black p-1 text-center">HS</th>
              <th className="border-r border-black p-1 text-right">Qty</th>
              <th className="border-r border-black p-1 text-right">Rate</th>
              <th className="p-1 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-r border-black p-1 font-semibold">
                {receipt.fuelLabel}
              </td>
              <td className="border-r border-black p-1 text-center font-mono text-[10px]">
                {hsCode}
              </td>
              <td className="border-r border-black p-1 text-right font-mono">
                {cleanLiters} L
              </td>
              <td className="border-r border-black p-1 text-right font-mono">
                {cleanRate}
              </td>
              <td className="p-1 text-right font-mono font-bold">{taxableStr}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="border border-black text-[11px] p-2 space-y-1 my-2">
          <div className="flex justify-between">
            <span>Taxable:</span>
            <span className="font-mono">Rs {taxableStr}</span>
          </div>
          {s.showVat && (
            <div className="flex justify-between">
              <span>VAT 13%:</span>
              <span className="font-mono">Rs {vatStr}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t border-black pt-1 text-[13px]">
            <span>Net Amount:</span>
            <span className="font-mono">{grandTotalStr}</span>
          </div>
        </div>

        {s.showAmountInWords && (
          <div className="text-[10px] text-gray-700 italic border-b border-dotted border-black pb-2 mb-2">
            In words: {wordsText}
          </div>
        )}

        {/* Signatures */}
        {s.showSignature && (
          <div className="flex justify-between items-end pt-4 pb-2 text-[10px]">
            <div className="text-center">
              <div className="border-t border-dotted border-black w-24 mb-1" />
              Receiver Signature
            </div>
            <div className="text-center">
              <div className="border-t border-dotted border-black w-28 mb-1" />
              Authorised Signatory
            </div>
          </div>
        )}

        <div className="text-center text-[9px] text-gray-500 pt-1 border-t border-gray-300">
          Computer Generated Invoice · Printed By: {receipt.soldBy || "STAFF"}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. PROPER FULL-WIDTH A4 & A5 FULL FORMAL TAX INVOICE (REFERENCE MATCH)
  // =========================================================================
  return (
    <div
      className={clsx(
        "print-area w-full bg-white text-black font-sans text-xs p-6 md:p-8 border border-black shadow-md print:w-full print:max-w-none print:border-0 print:p-0 print:shadow-none",
        preview ? "max-w-3xl" : "max-w-none",
        className
      )}
      style={{ color: "#000000" }}
    >
      {/* Top Header Center */}
      <div className="text-center relative pb-3">
        {/* Centered Logo Emblem */}
        {s.showLogo !== false && (
          <div className="flex justify-center mb-3">
            {st.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={st.logoUrl}
                alt={st.name || "Station Logo"}
                className="max-h-24 max-w-[280px] h-auto w-auto object-contain drop-shadow-2xs print:drop-shadow-none"
              />
            ) : (
              <div className="h-16 w-16 rounded-full border-2 border-black flex items-center justify-center shadow-2xs">
                <span className="text-[22px] font-bold tracking-tight">
                  {(st.name || "?").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Station Legal Heading */}
        <h1 className="font-serif text-[20px] font-bold tracking-wide uppercase text-black leading-tight">
          {st.name}
        </h1>
        <div className="text-[12.5px] text-black mt-0.5">{st.address}</div>
        {s.showPan && (st.panNo || st.vatNo) && (
          <div className="text-[12px] font-semibold text-black mt-0.5">
            VAT No : {st.panNo || st.vatNo}
          </div>
        )}
        {st.phone && (
          <div className="text-[12px] text-black">Tel. No : {st.phone}</div>
        )}

        {/* Centered Document Title */}
        <div className="text-center font-bold text-[15px] uppercase tracking-wider mt-2">
          {s.headerTitle || "Invoice"}
        </div>

        {/* Top Right: Copy Indicator */}
        <div className="absolute right-0 bottom-0 text-[11px] text-gray-800 font-medium">
          Copy 1 of Original
        </div>
      </div>

      {/* Metadata Framed Box (Two Columns Divided by Center Border) */}
      <div className="w-full border border-black grid grid-cols-2 text-[12px] leading-relaxed my-2.5">
        {/* Left Column: Party / Buyer Information */}
        <div className="p-3 border-r border-black space-y-1">
          <div className="flex">
            <span className="w-28 shrink-0 text-black">Party Name :</span>
            <strong className="text-black font-semibold">
              {receipt.customerName || "Walk-In Retail Customer"}
            </strong>
          </div>
          {s.showCustomerAddress && (
            <div className="flex">
              <span className="w-28 shrink-0 text-black">Address :</span>
              <span>{st.address}</span>
            </div>
          )}
          {s.showVehicle && (
            <div className="flex">
              <span className="w-28 shrink-0 text-black">Vehicle No. :</span>
              <strong className="font-mono text-black">
                {receipt.vehicleNo || ""}
              </strong>
            </div>
          )}
          {s.showCustomerPan && receipt.customerPanNo && (
            <div className="flex">
              <span className="w-28 shrink-0 text-black">Pan No. :</span>
              <span className="font-mono text-black font-medium">{receipt.customerPanNo}</span>
            </div>
          )}
        </div>

        {/* Right Column: Invoice Details */}
        <div className="p-3 space-y-1">
          <div className="flex">
            <span className="w-36 shrink-0 text-black">Invoice No. :</span>
            <strong className="font-mono text-black font-semibold">{receipt.billNumber}</strong>
          </div>
          <div className="flex">
            <span className="w-36 shrink-0 text-black">Invoice Date :</span>
            <span>{receipt.dateBS || receipt.at}</span>
          </div>
          <div className="flex">
            <span className="w-36 shrink-0 text-black">Transaction Date :</span>
            <span>{receipt.dateBS || receipt.at}</span>
          </div>
          {s.showPaymentMode && (
            <div className="flex">
              <span className="w-36 shrink-0 text-black">Mode of payment :</span>
              <span>{formatPaymentMode(receipt.paymentMethod)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Items Table with Full Width & Continuous Vertical Column Dividers */}
      <div className="w-full border border-black border-b-0">
        <table className="w-full text-left text-[12px] border-collapse">
          <thead>
            <tr className="border-b border-black text-center font-bold">
              <th className="border-r border-black py-2 px-2 w-[7%] text-center">
                S.No
              </th>
              <th className="border-r border-black py-2 px-2 w-[14%] text-center">
                HS Code
              </th>
              <th className="border-r border-black py-2 px-3 text-left w-[37%]">
                Description of Goods
              </th>
              <th className="border-r border-black py-2 px-2 w-[9%] text-center">
                Qty
              </th>
              <th className="border-r border-black py-2 px-2 w-[9%] text-center">
                Unit
              </th>
              {s.showRate && (
                <th className="border-r border-black py-2 px-2 w-[12%] text-right">
                  Rate
                </th>
              )}
              <th className="py-2 px-3 w-[12%] text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="align-top min-h-[220px] h-60 print:min-h-[75mm] print:h-64">
              <td className="border-r border-black py-3 px-2 text-center">1</td>
              <td className="border-r border-black py-3 px-2 text-center font-mono">
                {hsCode}
              </td>
              <td className="border-r border-black py-3 px-3 font-semibold uppercase">
                {receipt.fuelLabel.toUpperCase().includes("PETROL")
                  ? "MS - PETROL"
                  : receipt.fuelLabel.toUpperCase().includes("DIESEL")
                  ? "HSD - DIESEL"
                  : receipt.fuelLabel}
              </td>
              <td className="border-r border-black py-3 px-2 text-center font-mono">
                {cleanLiters}
              </td>
              <td className="border-r border-black py-3 px-2 text-center">
                Ltr
              </td>
              {s.showRate && (
                <td className="border-r border-black py-3 px-2 text-right font-mono">
                  {cleanRate}
                </td>
              )}
              <td className="py-3 px-3 text-right font-mono font-semibold">
                {taxableStr}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Box (Left: In Words | Right: Gross/Taxable/VAT/Net Total) */}
      <div className="w-full border border-black grid grid-cols-12 text-[12px]">
        {/* Left Spanning: In Words */}
        <div className="col-span-7 p-3.5 border-r border-black flex flex-col justify-between">
          {s.showAmountInWords && (
            <div>
              <div className="font-semibold text-black">In words:</div>
              <div className="font-medium text-black mt-1 leading-snug">
                {wordsText}
              </div>
            </div>
          )}
        </div>

        {/* Right Spanning: Calculations Table */}
        <div className="col-span-5 divide-y divide-black">
          <div className="flex justify-between px-3.5 py-1.5">
            <span className="font-semibold">Gross Total</span>
            <span className="font-mono font-medium">{grossStr}</span>
          </div>
          <div className="flex justify-between px-3.5 py-1.5">
            <span className="font-semibold">Taxable</span>
            <span className="font-mono font-medium">{taxableStr}</span>
          </div>
          {s.showVat && (
            <div className="flex justify-between px-3.5 py-1.5">
              <span className="font-semibold">VAT 13%</span>
              <span className="font-mono font-medium">{vatStr}</span>
            </div>
          )}
          <div className="flex justify-between px-3.5 py-2 font-bold text-[13px] bg-gray-50 print:bg-transparent">
            <span>Net Amount</span>
            <span className="font-mono text-[13.5px]">{grandTotalStr}</span>
          </div>
        </div>
      </div>

      {/* Signatures Row */}
      {s.showSignature && (
        <div className="grid grid-cols-2 gap-8 pt-12 pb-6 text-[12px]">
          {/* Receiver Signature (Left) */}
          <div className="text-left pl-2">
            <div className="border-t border-dotted border-black w-56 mb-1" />
            <div className="font-semibold text-black">Receiver Signature:</div>
          </div>

          {/* Authorised Signatory (Right) */}
          <div className="text-right pr-2">
            <div className="border-t border-dotted border-black w-64 ml-auto mb-1" />
            <div className="font-semibold text-black">Authorised Signatory</div>
            <div className="text-[11px] text-gray-800">For: {st.name}</div>
          </div>
        </div>
      )}

      {/* Very Bottom Metadata Bar */}
      <div className="border-t border-gray-400 pt-2.5 mt-4 flex items-center justify-between text-[10px] text-gray-600">
        <div>Computer Generated Invoice</div>
        <div>
          Printed On : {new Date().toISOString().slice(0, 10)},{" "}
          {new Date().toLocaleTimeString("en-IN")}
        </div>
        <div>
          Printed By : {receipt.soldBy ? receipt.soldBy.toUpperCase() : "STAFF"}
        </div>
      </div>
    </div>
  );
}
