"use server";

import * as z from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireTenantDb } from "@/lib/tenant-db";
import { can, ForbiddenError, type Role, type PaymentMethod, type FuelType } from "@/lib/permissions";
import { deriveSale, checkLiters, creditHeadroom, type SaleMode } from "@/lib/sale-math";
import { fmtRs, fmtL, fmtRate } from "@/lib/money";
import { fmtBSDateTime } from "@/lib/bs-date";

const D = Prisma.Decimal;

/**
 * A completed sale, flattened to plain strings. Prisma.Decimal instances
 * can't cross the Server Action -> Client boundary (React can't serialize
 * them), and the client only ever *displays* these numbers, so formatting
 * happens here where the Decimal still exists.
 */
export interface ReceiptDTO {
  receiptNo: number;
  billNumber: string;
  stationName: string;
  fuelLabel: string;
  liters: string;
  rate: string;
  /** Gross line amount (litres × rate), before any discount — shown on the item row. */
  total: string;
  /** What's actually owed after discount — Grand Total. Falls back to `total` when there's no discount. */
  grandTotal?: string;
  subtotal?: string;
  taxableAmount?: string;
  vatAmount?: string;
  discount?: string;
  paymentMethod: "CASH" | "CREDIT" | "ONLINE" | "CARD";
  onlineProvider?: string | null;
  paymentRef?: string | null;
  customerName: string | null;
  /** Set whenever the buyer name matches a customer record with a PAN/VAT No. on file. */
  customerPanNo?: string | null;
  /** Set whenever the buyer name matches a customer record with a phone number on file. */
  customerPhone?: string | null;
  vehicleNo?: string | null;
  changeDue: string | null;
  soldBy: string;
  at: string;
  dateBS: string;
}

export interface SaleFormState {
  error?: string;
  receipt?: ReceiptDTO;
}

const FUEL_LABELS: Record<string, string> = { PETROL: "Petrol", DIESEL: "Diesel", CNG: "CNG" };

const SaleSchema = z.object({
  tankId: z.string().min(1, "Choose a fuel"),
  mode: z.enum(["LITERS", "AMOUNT"]),
  quantity: z.string().trim().min(1, "Enter a quantity"),
  paymentMethod: z.enum(["CASH", "CREDIT", "ONLINE", "CARD"]),
  onlineProvider: z.string().optional(),
  paymentRef: z.string().optional(),
  buyerName: z.string().optional(),
  vehicleNo: z.string().optional(),
  discountAmount: z.string().optional(),
  remarks: z.string().optional(),
  cashTendered: z.string().optional(),
  expectedRate: z.string().min(1),
});

function decimalOrNull(raw: string | undefined): Prisma.Decimal | null {
  if (raw === undefined) return null;
  const s = raw.trim();
  if (s === "") return null;
  try {
    const d = new D(s);
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

export async function recordSaleAction(_prev: SaleFormState, formData: FormData): Promise<SaleFormState> {
  const { prisma: tenantDb, stationId, user } = await requireTenantDb();
  if (!can(user.role as Role, "recordSale")) {
    return { error: new ForbiddenError("recordSale").message };
  }

  const parsed = SaleSchema.safeParse({
    tankId: formData.get("tankId"),
    mode: formData.get("mode"),
    quantity: formData.get("quantity"),
    paymentMethod: formData.get("paymentMethod"),
    onlineProvider: formData.get("onlineProvider") ?? undefined,
    paymentRef: formData.get("paymentRef") ?? undefined,
    buyerName: formData.get("buyerName") ?? undefined,
    vehicleNo: formData.get("vehicleNo") ?? undefined,
    discountAmount: formData.get("discountAmount") ?? undefined,
    remarks: formData.get("remarks") ?? undefined,
    cashTendered: formData.get("cashTendered") ?? undefined,
    expectedRate: formData.get("expectedRate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const input = parsed.data;
  const quantity = decimalOrNull(input.quantity);
  if (!quantity || quantity.lte(0)) {
    return { error: "Enter a quantity greater than zero." };
  }

  try {
    const receipt = await tenantDb.$transaction(async (tx) => {
      // Read the tank *inside* the transaction: the rate and level used for
      // the arithmetic must be the same ones the guarded update below tests.
      const tank = await tx.tank.findFirst({ where: { id: input.tankId, stationId } });
      if (!tank) throw new SaleError("That fuel isn't available at this station.");

      if (!tank.ratePerL.equals(new D(input.expectedRate))) {
        throw new SaleError(
          "The " +
            FUEL_LABELS[tank.fuel] +
            " rate changed to " +
            fmtRate(tank.ratePerL) +
            " while you were entering this sale. Check the amount and record it again."
        );
      }

      const { liters, totalAmount: grossAmount } = deriveSale(input.mode as SaleMode, quantity, tank.ratePerL);
      const problem = checkLiters(liters);
      if (problem === "TOO_SMALL") throw new SaleError("That works out to less than 0.01 L — check the amount.");
      if (problem === "TOO_LARGE") throw new SaleError("That volume looks wrong. Split it into separate sales if it's genuine.");
      if (problem === "NOT_A_NUMBER") throw new SaleError("Enter a valid quantity.");

      // A discount comes off the gross line amount before anything else
      // touches it — credit limit, the customer's ledger, and VAT all apply
      // to what's actually charged, not the pre-discount price.
      const discount = decimalOrNull(input.discountAmount) ?? new D(0);
      if (discount.isNegative()) throw new SaleError("Discount can't be negative.");
      if (discount.gt(grossAmount)) throw new SaleError("Discount can't be more than the sale amount.");
      const totalAmount = grossAmount.sub(discount);

      // Deduct stock with a *conditional* update rather than read-then-write:
      // the `levelL >= liters` predicate and the decrement are one atomic
      // statement, so two pumps selling the last of a tank at the same
      // instant can't both succeed and drive the level negative.
      const deducted = await tx.tank.updateMany({
        where: { id: tank.id, levelL: { gte: liters } },
        data: { levelL: { decrement: liters } },
      });
      if (deducted.count === 0) {
        throw new SaleError(
          "Not enough " + FUEL_LABELS[tank.fuel] + " in the tank — " + fmtL(tank.levelL) + " left. Record a delivery first."
        );
      }

      const buyerName = (input.buyerName ?? "").trim();

      let customerId: string | null = null;
      let customerPanNo: string | null = null;
      let customerPhone: string | null = null;
      if (input.paymentMethod === "CREDIT") {
        if (!buyerName) throw new SaleError("Enter the customer's name for a credit sale.");

        let customer = await tx.customer.findFirst({
          where: { stationId: user.stationId, active: true, name: buyerName },
        });

        if (!customer) {
          // First time this name has been billed on credit here — open a
          // ledger account for them with a zero limit. The sale below still
          // needs an explicit credit limit before it can go through, so a
          // mistyped name can't quietly walk out with unlimited credit.
          customer = await tx.customer.create({
            data: { stationId: user.stationId, name: buyerName, creditLimit: new D(0), dueAmount: new D(0) },
          });
        }

        const headroom = creditHeadroom(customer.creditLimit, customer.dueAmount);
        if (totalAmount.gt(headroom)) {
          throw new SaleError(
            customer.name +
              " has only " +
              fmtRs(headroom) +
              " of credit left (limit " +
              fmtRs(customer.creditLimit) +
              ", owes " +
              fmtRs(customer.dueAmount) +
              "). Set a credit limit for them on the Credit page, or take cash/card/online for this sale."
          );
        }

        // Compare-and-swap on the balance we just read. If another cashier
        // billed the same customer in the gap, count is 0 and we abort rather
        // than pushing them past their limit on a stale read. Works on every
        // provider, unlike a column-to-column predicate.
        const charged = await tx.customer.updateMany({
          where: { id: customer.id, dueAmount: customer.dueAmount },
          data: { dueAmount: customer.dueAmount.add(totalAmount) },
        });
        if (charged.count === 0) {
          throw new SaleError(customer.name + "'s balance changed while you were entering this. Try again.");
        }
        customerId = customer.id;
        customerPanNo = customer.panNo;
        customerPhone = customer.phone;
      } else if (buyerName) {
        // Not a credit sale, but the typed name may still match an existing
        // customer record — pull their PAN/phone for the invoice without
        // opening or touching a ledger account for them.
        const matched = await tx.customer.findFirst({
          where: { stationId: user.stationId, active: true, name: buyerName },
          select: { id: true, panNo: true, phone: true },
        });
        if (matched) {
          customerId = matched.id;
          customerPanNo = matched.panNo;
          customerPhone = matched.phone;
        }
      }

      // Mint a gap-free per-station receipt number. The atomic increment
      // returns the *new* counter, so this sale takes the value before it.
      const station = await tx.station.update({
        where: { id: user.stationId },
        data: { nextReceiptNo: { increment: 1 } },
        select: { nextReceiptNo: true, name: true },
      });
      const receiptNo = station.nextReceiptNo - 1;

      const sale = await tx.sale.create({
        data: {
          receiptNo,
          stationId: user.stationId,
          tankId: tank.id,
          fuel: tank.fuel,
          liters,
          ratePerL: tank.ratePerL,
          totalAmount,
          discountAmount: discount.gt(0) ? discount : null,
          remarks: input.remarks?.trim() || null,
          paymentMethod: input.paymentMethod === "CREDIT" ? "CREDIT" : "CASH",
          customerId,
          buyerName: buyerName || null,
          vehicleNo: input.vehicleNo ? input.vehicleNo.trim().toUpperCase() : null,
          soldById: user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          stationId: user.stationId,
          actorId: user.id,
          action: "SALE_RECORDED",
          entityType: "Sale",
          entityId: sale.id,
          metadata: JSON.stringify({
            receiptNo,
            fuel: tank.fuel,
            liters: liters.toString(),
            ratePerL: tank.ratePerL.toString(),
            grossAmount: grossAmount.toString(),
            discountAmount: discount.toString(),
            totalAmount: totalAmount.toString(),
            paymentMethod: input.paymentMethod,
            vehicleNo: input.vehicleNo ?? null,
            onlineProvider: input.onlineProvider ?? null,
            paymentRef: input.paymentRef ?? null,
            customerId,
            buyerName: buyerName || null,
            tankLevelAfter: tank.levelL.sub(liters).toString(),
          }),
        },
      });

      const tendered = input.paymentMethod === "CASH" ? decimalOrNull(input.cashTendered) : null;
      const taxable = totalAmount.div(1.13);
      const vat = totalAmount.sub(taxable);

      return {
        receiptNo,
        billNumber: `INV-${String(receiptNo).padStart(5, "0")}`,
        stationName: station.name,
        fuelLabel: FUEL_LABELS[tank.fuel],
        liters: fmtL(liters),
        rate: fmtRate(tank.ratePerL),
        total: fmtRs(grossAmount),
        grandTotal: fmtRs(totalAmount),
        subtotal: fmtRs(taxable),
        taxableAmount: fmtRs(taxable),
        vatAmount: fmtRs(vat),
        discount: discount.gt(0) ? fmtRs(discount) : undefined,
        paymentMethod: input.paymentMethod,
        onlineProvider: input.onlineProvider ?? null,
        paymentRef: input.paymentRef ?? null,
        customerName: buyerName || null,
        customerPanNo,
        customerPhone,
        vehicleNo: input.vehicleNo ? input.vehicleNo.trim().toUpperCase() : null,
        changeDue: tendered && tendered.gte(totalAmount) ? fmtRs(tendered.sub(totalAmount)) : null,
        soldBy: user.name,
        at: fmtBSDateTime(sale.createdAt),
        dateBS: fmtBSDateTime(sale.createdAt).split(" ")[0] || "",
      } satisfies ReceiptDTO;
    });

    revalidatePath("/sales");
    revalidatePath("/dashboard");
    return { receipt };
  } catch (err) {
    if (err instanceof SaleError) return { error: err.message };
    console.error("recordSaleAction failed", err);
    return { error: "Could not record the sale. Nothing was charged — please try again." };
  }
}

/** Thrown inside the transaction to roll everything back and surface a message the operator can act on. */
class SaleError extends Error {}

export interface VoidState {
  error?: string;
}

export async function voidSaleAction(_prev: VoidState, formData: FormData): Promise<VoidState> {
  const { prisma: tenantDb, stationId, user } = await requireTenantDb();
  if (!can(user.role as Role, "voidSale")) {
    return { error: "Only an owner or manager can void a sale." };
  }

  const saleId = String(formData.get("saleId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!saleId) return { error: "Missing sale." };
  if (reason.length < 3) return { error: "Give a reason for the void — it goes on the audit trail." };

  try {
    await tenantDb.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({ where: { id: saleId, stationId } });
      if (!sale) throw new SaleError("That sale doesn't exist.");
      if (sale.voided) throw new SaleError("That sale was already voided.");

      // Guarded flip: whoever sets voided first wins, so a double-click (or
      // two managers at once) can't return the same fuel to the tank twice.
      const flipped = await tx.sale.updateMany({
        where: { id: sale.id, voided: false },
        data: { voided: true, voidedAt: new Date(), voidReason: reason },
      });
      if (flipped.count === 0) throw new SaleError("That sale was already voided.");

      await tx.tank.update({ where: { id: sale.tankId }, data: { levelL: { increment: sale.liters } } });

      if (sale.paymentMethod === "CREDIT" && sale.customerId) {
        const customer = await tx.customer.findUnique({ where: { id: sale.customerId } });
        if (customer) {
          // Clamp at zero: a payment recorded between the sale and the void
          // may already have cleared the balance, and a negative due would
          // read as the station owing the customer money.
          const restored = customer.dueAmount.sub(sale.totalAmount);
          await tx.customer.update({
            where: { id: customer.id },
            data: { dueAmount: restored.isNegative() ? new D(0) : restored },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          stationId: user.stationId,
          actorId: user.id,
          action: "SALE_VOIDED",
          entityType: "Sale",
          entityId: sale.id,
          metadata: JSON.stringify({
            receiptNo: sale.receiptNo,
            reason,
            litersReturned: sale.liters.toString(),
            amountReversed: sale.totalAmount.toString(),
          }),
        },
      });
    });

    revalidatePath("/sales");
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    if (err instanceof SaleError) return { error: err.message };
    console.error("voidSaleAction failed", err);
    return { error: "Could not void the sale. Please try again." };
  }
}

export interface EditSaleState {
  error?: string;
  success?: boolean;
}

const EditSaleSchema = z.object({
  saleId: z.string().min(1, "Missing sale ID"),
  vehicleNo: z.string().optional(),
  buyerName: z.string().optional(),
  customerId: z.string().optional(),
  paymentMethod: z.enum(["CASH", "CREDIT", "ONLINE", "CARD"]),
  onlineProvider: z.string().optional(),
  paymentRef: z.string().optional(),
  remarks: z.string().optional(),
  reason: z.string().trim().min(3, "Please give a reason for editing this bill"),
});

export async function editSaleAction(_prev: EditSaleState, formData: FormData): Promise<EditSaleState> {
  const { prisma: tenantDb, stationId, user } = await requireTenantDb();

  const parsed = EditSaleSchema.safeParse({
    saleId: formData.get("saleId"),
    vehicleNo: formData.get("vehicleNo") || undefined,
    buyerName: formData.get("buyerName") || undefined,
    customerId: formData.get("customerId") || undefined,
    paymentMethod: formData.get("paymentMethod"),
    onlineProvider: formData.get("onlineProvider") || undefined,
    paymentRef: formData.get("paymentRef") || undefined,
    remarks: formData.get("remarks") || undefined,
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid edit data" };
  }

  const { saleId, vehicleNo, buyerName, customerId, paymentMethod, onlineProvider, paymentRef, remarks, reason } = parsed.data;

  try {
    await tenantDb.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, stationId },
        include: { customer: true },
      });
      if (!sale) throw new SaleError("Sale not found.");
      if (sale.voided) throw new SaleError("Cannot edit a voided bill.");

      const oldPaymentMethod = sale.paymentMethod;
      const oldCustomerId = sale.customerId;
      const newCustomerId = paymentMethod === "CREDIT" ? customerId || null : null;

      // 1. Revert previous customer credit if old was CREDIT
      if (oldPaymentMethod === "CREDIT" && oldCustomerId) {
        const prevCust = await tx.customer.findUnique({ where: { id: oldCustomerId } });
        if (prevCust) {
          const restored = prevCust.dueAmount.sub(sale.totalAmount);
          await tx.customer.update({
            where: { id: prevCust.id },
            data: { dueAmount: restored.isNegative() ? new D(0) : restored },
          });
        }
      }

      // 2. Apply new customer credit if new is CREDIT
      if (paymentMethod === "CREDIT" && newCustomerId) {
        const newCust = await tx.customer.findUnique({ where: { id: newCustomerId } });
        if (!newCust) throw new SaleError("Selected credit customer does not exist.");
        await tx.customer.update({
          where: { id: newCust.id },
          data: { dueAmount: { increment: sale.totalAmount } },
        });
      }

      // 3. Update the sale record
      await tx.sale.update({
        where: { id: sale.id },
        data: {
          vehicleNo: vehicleNo ? vehicleNo.trim().toUpperCase() : null,
          buyerName: buyerName ? buyerName.trim() : sale.buyerName,
          customerId: newCustomerId,
          paymentMethod: paymentMethod as PaymentMethod,
          remarks: remarks !== undefined ? remarks.trim() : sale.remarks,
        },
      });

      // 4. Record audit log
      await tx.auditLog.create({
        data: {
          stationId: user.stationId,
          actorId: user.id,
          action: "SALE_EDITED",
          entityType: "Sale",
          entityId: sale.id,
          metadata: JSON.stringify({
            receiptNo: sale.receiptNo,
            reason,
            previous: {
              vehicleNo: sale.vehicleNo,
              buyerName: sale.buyerName,
              customerId: sale.customerId,
              paymentMethod: sale.paymentMethod,
            },
            updated: {
              vehicleNo: vehicleNo || null,
              buyerName: buyerName || null,
              customerId: newCustomerId,
              paymentMethod,
              onlineProvider,
              paymentRef,
            },
          }),
        },
      });
    });

    revalidatePath("/sales");
    revalidatePath("/sales/bills");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    if (err instanceof SaleError) return { error: err.message };
    console.error("editSaleAction failed", err);
    return { error: "Could not update the bill. Please try again." };
  }
}

