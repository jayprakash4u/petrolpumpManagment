"use server";

import * as z from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireTenantDb } from "@/lib/tenant-db";
import { can, type Role } from "@/lib/permissions";
import { checkDelivery } from "@/lib/stock-math";
import { fmtRs, fmtL } from "@/lib/money";
import { parseBSInput } from "@/lib/bs-date";

const D = Prisma.Decimal;

/** Nepal's standard VAT rate — the same figure used throughout the invoice and reporting code. */
const VAT_RATE = new D("0.13");

const FUEL_LABELS: Record<string, string> = { PETROL: "Petrol", DIESEL: "Diesel", CNG: "CNG" };

/** Thrown inside the transaction to roll it back with a message the operator can act on. */
class PurchaseBillError extends Error {}

function decimalOrNull(raw: FormDataEntryValue | null): Prisma.Decimal | null {
  if (raw === null) return null;
  const s = String(raw).trim();
  if (s === "") return null;
  try {
    const d = new D(s);
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

/**
 * A data URI is capped well above what a 2 MB image (the client's own
 * limit) base64-encodes to, so a legitimate upload always passes and a
 * hand-crafted request can't smuggle an unbounded blob into an NVARCHAR(MAX)
 * column.
 */
const MAX_DATA_URI_LENGTH = 3_000_000;

const dataUriField = z
  .string()
  .trim()
  .max(MAX_DATA_URI_LENGTH, "That file is too large.")
  .regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "Not a recognised image file.")
  .optional()
  .or(z.literal(""));

export interface PurchaseBillState {
  error?: string;
  message?: string;
}

const PurchaseBillSchema = z.object({
  purchaseDateBS: z.string().trim().min(1, "Enter the purchase date"),
  tankAId: z.string().min(1, "Choose which tank receives the fuel"),
  tankBId: z.string().trim().optional(),
  tankBQuantity: z.string().trim().optional(),

  tankerNo: z.string().trim().min(1, "Enter the tanker number").max(100),
  invoiceNo: z.string().trim().min(1, "Enter the invoice / bill number").max(100),
  supplier: z.string().trim().min(2, "Enter the supplier name").max(200),
  supplierPan: z.string().trim().min(2, "Enter the supplier's PAN number").max(50),
  density: z.string().trim().optional(),
  temperature: z.string().trim().optional(),
  quantity: z.string().trim().min(1, "Enter the quantity purchased"),
  ratePerL: z.string().trim().min(1, "Enter the rate (without VAT)"),
  invoiceImage: dataUriField,
  scannedBill: dataUriField,

  insuranceBillNo: z.string().trim().max(100).optional(),
  insuranceCost: z.string().trim().optional(),
  insuranceStamp: z.string().trim().optional(),

  transporterName: z.string().trim().max(200).optional(),
  transportBillNo: z.string().trim().max(100).optional(),
  transportCost: z.string().trim().optional(),

  remarks: z.string().trim().max(1000).optional(),
});

/**
 * Records one NOC fuel purchase bill: the tanker's own cost (optionally
 * decanted into two tanks from a single invoice), plus whatever insurance
 * and transportation charges rode on the same bill. Everything beyond the
 * NOC section is optional — a station that doesn't track those simply
 * leaves them blank rather than having zeroes invented for it.
 */
export async function recordPurchaseBillAction(
  _prev: PurchaseBillState,
  formData: FormData
): Promise<PurchaseBillState> {
  const { prisma: tenantDb, stationId, user } = await requireTenantDb();
  if (!can(user.role as Role, "recordPurchase")) {
    return { error: "Only an owner or manager can record a purchase bill." };
  }

  const parsed = PurchaseBillSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  if (!parseBSInput(d.purchaseDateBS)) {
    return { error: "Enter the purchase date as a real BS date, e.g. 2083-05-18." };
  }

  const quantity = decimalOrNull(d.quantity);
  const rate = decimalOrNull(d.ratePerL);
  if (!quantity || quantity.lte(0)) return { error: "Enter a quantity greater than zero." };
  if (!rate || rate.lte(0)) return { error: "Enter a valid rate." };

  const density = decimalOrNull(d.density ?? null);
  const temperature = decimalOrNull(d.temperature ?? null);

  let tankBQuantity: Prisma.Decimal | null = null;
  if (d.tankBId) {
    tankBQuantity = decimalOrNull(d.tankBQuantity ?? null);
    if (!tankBQuantity || tankBQuantity.lte(0) || tankBQuantity.gte(quantity)) {
      return { error: "Enter how much of the load goes to Tank B — less than the total quantity." };
    }
  }
  const tankAQuantity = tankBQuantity ? quantity.sub(tankBQuantity) : quantity;

  const subTotal = quantity.mul(rate).toDecimalPlaces(2);
  const vatAmount = subTotal.mul(VAT_RATE).toDecimalPlaces(2);
  const grandTotal = subTotal.add(vatAmount);

  // Insurance: only recorded as a group when at least one field was filled in.
  const insuranceCost = decimalOrNull(d.insuranceCost ?? null);
  const insuranceStamp = decimalOrNull(d.insuranceStamp ?? null);
  // The stamp field carries a default value on the form, so its presence
  // alone doesn't mean there's a real insurance bill — only a bill number
  // or a cost does.
  const hasInsurance = !!d.insuranceBillNo || insuranceCost !== null;
  // VAT applies to the insurance premium itself, not the government stamp duty.
  const insuranceVat = hasInsurance ? (insuranceCost ?? new D(0)).mul(VAT_RATE).toDecimalPlaces(2) : null;
  const insuranceTotal = hasInsurance
    ? (insuranceCost ?? new D(0)).add(insuranceVat ?? new D(0)).add(insuranceStamp ?? new D(0))
    : null;

  const transportCost = decimalOrNull(d.transportCost ?? null);
  const hasTransport = !!d.transporterName || !!d.transportBillNo || transportCost !== null;
  const transportVat = hasTransport ? (transportCost ?? new D(0)).mul(VAT_RATE).toDecimalPlaces(2) : null;
  const transportTotal = hasTransport ? (transportCost ?? new D(0)).add(transportVat ?? new D(0)) : null;

  try {
    const result = await tenantDb.$transaction(async (tx) => {
      const tankA = await tx.tank.findFirst({ where: { id: d.tankAId, stationId } });
      if (!tankA) throw new PurchaseBillError("That tank isn't available at this station.");

      let tankB: typeof tankA | null = null;
      if (d.tankBId) {
        tankB = await tx.tank.findFirst({ where: { id: d.tankBId, stationId } });
        if (!tankB) throw new PurchaseBillError("The second tank isn't available at this station.");
        if (tankB.fuel !== tankA.fuel) {
          throw new PurchaseBillError("Both tanks must hold the same fuel to split one delivery.");
        }
      }

      const rows: { tank: typeof tankA; liters: Prisma.Decimal }[] = tankB
        ? [
            { tank: tankA, liters: tankAQuantity },
            { tank: tankB, liters: tankBQuantity! },
          ]
        : [{ tank: tankA, liters: quantity }];

      for (const row of rows) {
        const problem = checkDelivery(row.liters, row.tank.capacityL, row.tank.levelL);
        if (problem === "TOO_SMALL") throw new PurchaseBillError("Enter a quantity greater than zero.");
        if (problem === "TOO_LARGE") throw new PurchaseBillError("That quantity looks wrong. Record each tanker separately if it's genuine.");
        if (problem === "NOT_A_NUMBER") throw new PurchaseBillError("Enter a valid quantity.");
        if (problem === "EXCEEDS_CAPACITY") {
          throw new PurchaseBillError(
            `That won't fit — the ${FUEL_LABELS[row.tank.fuel] ?? row.tank.fuel} tank (${row.tank.id === tankA.id ? "A" : "B"}) has room for ` +
              `${row.tank.capacityL.sub(row.tank.levelL).toString()} L only.`
          );
        }
      }

      const createdIds: string[] = [];
      let remainingGrandTotal = grandTotal;
      let remainingSubTotal = subTotal;
      let remainingVat = vatAmount;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const isLast = i === rows.length - 1;

        // Pro-rate the bill across rows by litres, giving the last row
        // whatever remains — so the two rows always sum to exactly the
        // entered grand total instead of drifting a cent from rounding.
        const rowShare = isLast ? new D(1) : row.liters.div(quantity);
        const rowSubTotal = isLast ? remainingSubTotal : subTotal.mul(rowShare).toDecimalPlaces(2);
        const rowVat = isLast ? remainingVat : vatAmount.mul(rowShare).toDecimalPlaces(2);
        const rowTotal = isLast ? remainingGrandTotal : rowSubTotal.add(rowVat);
        remainingSubTotal = remainingSubTotal.sub(rowSubTotal);
        remainingVat = remainingVat.sub(rowVat);
        remainingGrandTotal = remainingGrandTotal.sub(rowTotal);

        const ceiling = row.tank.capacityL.sub(row.liters);
        const filled = await tx.tank.updateMany({
          where: { id: row.tank.id, levelL: { lte: ceiling } },
          data: { levelL: { increment: row.liters } },
        });
        if (filled.count === 0) {
          throw new PurchaseBillError("Another delivery was recorded while saving — check the tank level and try again.");
        }

        const purchase = await tx.purchase.create({
          data: {
            stationId: user.stationId,
            tankId: row.tank.id,
            fuel: row.tank.fuel,
            liters: row.liters,
            totalCost: rowTotal,
            supplier: d.supplier,
            supplierPan: d.supplierPan,
            invoiceNo: d.invoiceNo,
            recordedById: user.id,
            purchaseDateBS: d.purchaseDateBS,
            tankerNo: d.tankerNo,
            density,
            temperature,
            ratePerL: rate,
            subTotal: rowSubTotal,
            vatAmount: rowVat,
            invoiceImageUrl: i === 0 && d.invoiceImage ? d.invoiceImage : null,
            scannedBillUrl: i === 0 && d.scannedBill ? d.scannedBill : null,
            // Insurance and transport ride on the invoice once, not per tank —
            // keep them on the first row only so a landed-cost total never
            // double-counts a bill split across two tanks.
            insuranceBillNo: i === 0 && hasInsurance ? d.insuranceBillNo || null : null,
            insuranceCost: i === 0 && hasInsurance ? insuranceCost : null,
            insuranceStamp: i === 0 && hasInsurance ? insuranceStamp : null,
            insuranceTotal: i === 0 && hasInsurance ? insuranceTotal : null,
            transporterName: i === 0 && hasTransport ? d.transporterName || null : null,
            transportBillNo: i === 0 && hasTransport ? d.transportBillNo || null : null,
            transportCost: i === 0 && hasTransport ? transportCost : null,
            transportTotal: i === 0 && hasTransport ? transportTotal : null,
            remarks: d.remarks || null,
          },
        });
        createdIds.push(purchase.id);

        await tx.auditLog.create({
          data: {
            stationId: user.stationId,
            actorId: user.id,
            action: "PURCHASE_BILL_RECORDED",
            entityType: "Purchase",
            entityId: purchase.id,
            metadata: JSON.stringify({
              fuel: row.tank.fuel,
              liters: row.liters.toString(),
              totalCost: rowTotal.toString(),
              invoiceNo: d.invoiceNo,
              tankerNo: d.tankerNo,
              tankLevelAfter: row.tank.levelL.add(row.liters).toString(),
            }),
          },
        });
      }

      return {
        fuel: FUEL_LABELS[tankA.fuel] ?? tankA.fuel,
        quantity: fmtL(quantity),
        grandTotal: fmtRs(grandTotal),
        split: !!tankB,
      };
    });

    revalidatePath("/stock");
    revalidatePath("/purchases");
    revalidatePath("/purchases/fuel");
    revalidatePath("/dashboard");

    return {
      message: result.split
        ? `${result.quantity} of ${result.fuel} recorded across both tanks for ${result.grandTotal}.`
        : `${result.quantity} of ${result.fuel} recorded for ${result.grandTotal}.`,
    };
  } catch (err) {
    if (err instanceof PurchaseBillError) return { error: err.message };
    console.error("recordPurchaseBillAction failed", err);
    return { error: "Could not record the purchase bill. Nothing was saved — please try again." };
  }
}

/* ------------------------------------------------------------------ *
 * Editing a recorded purchase bill
 * ------------------------------------------------------------------ */

export interface EditPurchaseState {
  error?: string;
  message?: string;
}

const EditPurchaseSchema = z.object({
  purchaseId: z.string().min(1),
  invoiceNo: z.string().trim().min(1, "Enter the invoice / bill number").max(100),
  supplier: z.string().trim().min(2, "Enter the supplier name").max(200),
  supplierPan: z.string().trim().min(2, "Enter the supplier's PAN number").max(50),
  tankerNo: z.string().trim().max(100).optional(),
  remarks: z.string().trim().max(1000).optional(),
});

/**
 * Corrects the paperwork fields on an already-recorded purchase — the
 * invoice number, supplier, PAN, tanker, and remarks. Deliberately doesn't
 * touch liters, rate, or totals: those drive tank stock and VAT that were
 * already applied when the bill was saved, and changing them here would
 * silently desync the tank level from what was actually delivered.
 */
export async function updatePurchaseAction(_prev: EditPurchaseState, formData: FormData): Promise<EditPurchaseState> {
  const { prisma: tenantDb, stationId, user } = await requireTenantDb();
  if (!can(user.role as Role, "recordPurchase")) {
    return { error: "Only an owner or manager can edit a purchase bill." };
  }

  const parsed = EditPurchaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  try {
    const existing = await tenantDb.purchase.findFirst({ where: { id: d.purchaseId, stationId } });
    if (!existing) return { error: "That purchase bill could not be found." };

    await tenantDb.purchase.update({
      where: { id: d.purchaseId },
      data: {
        invoiceNo: d.invoiceNo,
        supplier: d.supplier,
        supplierPan: d.supplierPan,
        tankerNo: d.tankerNo || null,
        remarks: d.remarks || null,
      },
    });

    await tenantDb.auditLog.create({
      data: {
        stationId: user.stationId,
        actorId: user.id,
        action: "PURCHASE_BILL_EDITED",
        entityType: "Purchase",
        entityId: d.purchaseId,
        metadata: JSON.stringify({ invoiceNo: d.invoiceNo, supplier: d.supplier }),
      },
    });

    revalidatePath("/purchases/report");
    revalidatePath("/purchases/report/edit");
    return { message: "Purchase bill updated." };
  } catch (err) {
    console.error("updatePurchaseAction failed", err);
    return { error: "Could not update the purchase bill. Please try again." };
  }
}
