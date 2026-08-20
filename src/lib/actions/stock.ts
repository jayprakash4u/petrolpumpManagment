"use server";

import * as z from "zod";
import { Prisma, type FuelType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { checkDelivery, checkRate, rateChangePercent, ullage, costPerLiter } from "@/lib/stock-math";
import { fmtRs, fmtL, fmtRate } from "@/lib/money";

const D = Prisma.Decimal;

const FUEL_LABELS: Record<FuelType, string> = { PETROL: "Petrol", DIESEL: "Diesel", CNG: "CNG" };

/** Thrown inside a transaction to roll it back with a message the operator can act on. */
class StockError extends Error {}

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

/* ------------------------------------------------------------------ *
 * Fuel rate
 * ------------------------------------------------------------------ */

export interface RateFormState {
  error?: string;
  message?: string;
}

const RateSchema = z.object({
  tankId: z.string().min(1),
  newRate: z.string().trim().min(1, "Enter the new rate"),
  /**
   * The rate the manager was shown when they opened the editor. If it no
   * longer matches, someone else repriced this fuel in the meantime and we
   * refuse — otherwise the second save would silently clobber the first, and
   * the history would record a change that never happened as the operator
   * understood it.
   */
  expectedRate: z.string().min(1),
  /** Set once the operator has acknowledged an unusually large move. */
  confirmedLarge: z.string().optional(),
});

export async function updateFuelRateAction(_prev: RateFormState, formData: FormData): Promise<RateFormState> {
  const user = await requireUser();
  if (!can(user.role, "editFuelRate")) {
    return { error: "Only an owner or manager can change fuel rates." };
  }

  const parsed = RateSchema.safeParse({
    tankId: formData.get("tankId"),
    newRate: formData.get("newRate"),
    expectedRate: formData.get("expectedRate"),
    confirmedLarge: formData.get("confirmedLarge") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const newRate = decimalOrNull(parsed.data.newRate);
  if (!newRate) return { error: "Enter a valid rate." };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const tank = await tx.tank.findFirst({ where: { id: parsed.data.tankId, stationId: user.stationId } });
      if (!tank) throw new StockError("That fuel isn't available at this station.");

      if (!tank.ratePerL.equals(new D(parsed.data.expectedRate))) {
        throw new StockError(
          "Someone else changed the " +
            FUEL_LABELS[tank.fuel] +
            " rate to " +
            fmtRate(tank.ratePerL) +
            " while this was open. Review it and try again."
        );
      }

      const problem = checkRate(newRate, tank.ratePerL);
      if (problem === "UNCHANGED") throw new StockError("That's already the current rate.");
      if (problem === "TOO_LOW") throw new StockError("A rate must be greater than zero.");
      if (problem === "TOO_HIGH") throw new StockError("That rate looks wrong — check for a misplaced decimal point.");
      if (problem === "NOT_A_NUMBER") throw new StockError("Enter a valid rate.");

      const changePct = rateChangePercent(tank.ratePerL, newRate);

      // The confirmation gate is deliberately enforced server-side too: the
      // client checkbox is a prompt, not the control.
      if (changePct.abs().gte(20) && parsed.data.confirmedLarge !== "yes") {
        throw new StockError(
          "That's a " + changePct.toString() + "% change. Tick the confirmation box if it's intentional."
        );
      }

      // Compare-and-swap, so a concurrent repricing loses rather than being
      // overwritten without trace.
      const updated = await tx.tank.updateMany({
        where: { id: tank.id, ratePerL: tank.ratePerL },
        data: { ratePerL: newRate },
      });
      if (updated.count === 0) {
        throw new StockError("The rate changed while saving. Review it and try again.");
      }

      await tx.fuelRateHistory.create({
        data: { tankId: tank.id, oldRate: tank.ratePerL, newRate, changedById: user.id },
      });

      await tx.auditLog.create({
        data: {
          stationId: user.stationId,
          actorId: user.id,
          action: "FUEL_RATE_CHANGED",
          entityType: "Tank",
          entityId: tank.id,
          metadata: {
            fuel: tank.fuel,
            oldRate: tank.ratePerL.toString(),
            newRate: newRate.toString(),
            changePct: changePct.toString(),
          },
        },
      });

      return {
        fuel: FUEL_LABELS[tank.fuel],
        oldRate: fmtRate(tank.ratePerL),
        newRate: fmtRate(newRate),
      };
    });

    revalidatePath("/stock");
    revalidatePath("/sales");
    revalidatePath("/dashboard");
    return { message: `${result.fuel} repriced from ${result.oldRate} to ${result.newRate}.` };
  } catch (err) {
    if (err instanceof StockError) return { error: err.message };
    console.error("updateFuelRateAction failed", err);
    return { error: "Could not change the rate. Nothing was saved — please try again." };
  }
}

/* ------------------------------------------------------------------ *
 * Delivery / purchase
 * ------------------------------------------------------------------ */

export interface DeliveryFormState {
  error?: string;
  message?: string;
}

const DeliverySchema = z.object({
  tankId: z.string().min(1, "Choose a fuel"),
  liters: z.string().trim().min(1, "Enter the volume delivered"),
  totalCost: z.string().trim().min(1, "Enter the invoice total"),
  supplier: z.string().trim().min(2, "Enter the supplier name").max(120),
  invoiceNo: z.string().trim().max(60).optional(),
});

export async function recordDeliveryAction(_prev: DeliveryFormState, formData: FormData): Promise<DeliveryFormState> {
  const user = await requireUser();
  if (!can(user.role, "recordPurchase")) {
    return { error: "Only an owner or manager can record a delivery." };
  }

  const parsed = DeliverySchema.safeParse({
    tankId: formData.get("tankId"),
    liters: formData.get("liters"),
    totalCost: formData.get("totalCost"),
    supplier: formData.get("supplier"),
    invoiceNo: formData.get("invoiceNo") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const liters = decimalOrNull(parsed.data.liters);
  const totalCost = decimalOrNull(parsed.data.totalCost);
  if (!liters || liters.lte(0)) return { error: "Enter a volume greater than zero." };
  if (!totalCost || totalCost.isNegative()) return { error: "Enter a valid invoice total." };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const tank = await tx.tank.findFirst({ where: { id: parsed.data.tankId, stationId: user.stationId } });
      if (!tank) throw new StockError("That fuel isn't available at this station.");

      const problem = checkDelivery(liters, tank.capacityL, tank.levelL);
      if (problem === "TOO_SMALL") throw new StockError("Enter a volume greater than zero.");
      if (problem === "TOO_LARGE") throw new StockError("That volume looks wrong. Record each tanker separately if it's genuine.");
      if (problem === "NOT_A_NUMBER") throw new StockError("Enter a valid volume.");
      if (problem === "EXCEEDS_CAPACITY") {
        throw new StockError(
          "That won't fit — the " +
            FUEL_LABELS[tank.fuel] +
            " tank has only " +
            fmtL(ullage(tank.capacityL, tank.levelL)) +
            " of room (" +
            fmtL(tank.levelL) +
            " of " +
            fmtL(tank.capacityL) +
            " used)."
        );
      }

      // Mirror image of the sale's stock guard: the capacity check and the
      // increment are one atomic statement, so two deliveries recorded at the
      // same instant can't both pass a stale headroom check and overfill the
      // tank. `ceiling` is a literal computed from the row we just read.
      const ceiling = tank.capacityL.sub(liters);
      const filled = await tx.tank.updateMany({
        where: { id: tank.id, levelL: { lte: ceiling } },
        data: { levelL: { increment: liters } },
      });
      if (filled.count === 0) {
        throw new StockError("Another delivery was recorded while saving — check the tank level and try again.");
      }

      const purchase = await tx.purchase.create({
        data: {
          stationId: user.stationId,
          tankId: tank.id,
          fuel: tank.fuel,
          liters,
          totalCost,
          supplier: parsed.data.supplier,
          invoiceNo: parsed.data.invoiceNo || null,
          recordedById: user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          stationId: user.stationId,
          actorId: user.id,
          action: "DELIVERY_RECORDED",
          entityType: "Purchase",
          entityId: purchase.id,
          metadata: {
            fuel: tank.fuel,
            liters: liters.toString(),
            totalCost: totalCost.toString(),
            costPerLiter: costPerLiter(totalCost, liters)?.toString() ?? null,
            supplier: parsed.data.supplier,
            invoiceNo: parsed.data.invoiceNo || null,
            tankLevelAfter: tank.levelL.add(liters).toString(),
          },
        },
      });

      return {
        fuel: FUEL_LABELS[tank.fuel],
        liters: fmtL(liters),
        cost: fmtRs(totalCost),
        levelAfter: fmtL(tank.levelL.add(liters)),
      };
    });

    revalidatePath("/stock");
    revalidatePath("/sales");
    revalidatePath("/dashboard");
    return {
      message: `${result.liters} of ${result.fuel} received for ${result.cost}. Tank now holds ${result.levelAfter}.`,
    };
  } catch (err) {
    if (err instanceof StockError) return { error: err.message };
    console.error("recordDeliveryAction failed", err);
    return { error: "Could not record the delivery. Nothing was saved — please try again." };
  }
}
