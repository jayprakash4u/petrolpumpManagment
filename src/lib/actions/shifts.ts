"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { can, type Role } from "@/lib/permissions";
import { shiftMinutes, fmtDuration } from "@/lib/staff";

export interface ShiftFormState {
  error?: string;
  message?: string;
}

/** Thrown inside a transaction to roll it back with a message the operator can act on. */
class ShiftError extends Error {}

/**
 * Starting a shift is the moment a person becomes accountable for the till.
 */
export async function startShiftAction(_prev: ShiftFormState, formData: FormData): Promise<ShiftFormState> {
  const actor = await requireUser();
  const targetId = String(formData.get("userId") ?? "") || actor.id;
  const isSelf = targetId === actor.id;

  if (isSelf && !can(actor.role as Role, "manageOwnShift")) {
    return { error: "Your role can't start a shift." };
  }
  if (!isSelf && !can(actor.role as Role, "manageOtherShifts")) {
    return { error: "Only an owner or manager can start someone else's shift." };
  }

  try {
    const name = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findFirst({ where: { id: targetId, stationId: actor.stationId } });
      if (!target) throw new ShiftError("That employee isn't at this station.");
      if (!target.active) throw new ShiftError(`${target.name} is deactivated and can't be put on shift.`);

      const startedAt = new Date();

      const flipped = await tx.user.updateMany({
        where: { id: target.id, onShift: false },
        data: { onShift: true, shiftStartedAt: startedAt },
      });
      if (flipped.count === 0) {
        throw new ShiftError(`${target.name} is already on shift.`);
      }

      await tx.shift.create({ data: { userId: target.id, startedAt } });

      await tx.auditLog.create({
        data: {
          stationId: actor.stationId,
          actorId: actor.id,
          action: "SHIFT_STARTED",
          entityType: "User",
          entityId: target.id,
          metadata: JSON.stringify({ startedBy: actor.name, self: isSelf }),
        },
      });

      return target.name;
    });

    revalidatePath("/employees");
    revalidatePath("/dashboard");
    return { message: isSelf ? "You're on shift." : `${name} is now on shift.` };
  } catch (err) {
    if (err instanceof ShiftError) return { error: err.message };
    console.error("startShiftAction failed", err);
    return { error: "Could not start the shift. Please try again." };
  }
}

export async function endShiftAction(_prev: ShiftFormState, formData: FormData): Promise<ShiftFormState> {
  const actor = await requireUser();
  const targetId = String(formData.get("userId") ?? "") || actor.id;
  const isSelf = targetId === actor.id;

  if (isSelf && !can(actor.role as Role, "manageOwnShift")) {
    return { error: "Your role can't end a shift." };
  }
  if (!isSelf && !can(actor.role as Role, "manageOtherShifts")) {
    return { error: "Only an owner or manager can end someone else's shift." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findFirst({ where: { id: targetId, stationId: actor.stationId } });
      if (!target) throw new ShiftError("That employee isn't at this station.");

      const endedAt = new Date();

      const flipped = await tx.user.updateMany({
        where: { id: target.id, onShift: true },
        data: { onShift: false, shiftStartedAt: null },
      });
      if (flipped.count === 0) {
        throw new ShiftError(`${target.name} isn't on shift.`);
      }

      const open = await tx.shift.findFirst({
        where: { userId: target.id, endedAt: null },
        orderBy: { startedAt: "desc" },
      });

      let minutes = 0;
      if (open) {
        minutes = shiftMinutes(open.startedAt, endedAt);
        await tx.shift.update({
          where: { id: open.id },
          data: { endedAt, endedById: actor.id },
        });
      }

      await tx.auditLog.create({
        data: {
          stationId: actor.stationId,
          actorId: actor.id,
          action: "SHIFT_ENDED",
          entityType: "User",
          entityId: target.id,
          metadata: JSON.stringify({
            endedBy: actor.name,
            self: isSelf,
            minutes,
            orphanedFlag: open === null,
          }),
        },
      });

      return { name: target.name, minutes };
    });

    revalidatePath("/employees");
    revalidatePath("/dashboard");
    return {
      message: isSelf
        ? `Shift ended — ${fmtDuration(result.minutes)} worked.`
        : `${result.name}'s shift ended — ${fmtDuration(result.minutes)} worked.`,
    };
  } catch (err) {
    if (err instanceof ShiftError) return { error: err.message };
    console.error("endShiftAction failed", err);
    return { error: "Could not end the shift. Please try again." };
  }
}
