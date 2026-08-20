"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { can, ROLE_LABEL } from "@/lib/permissions";
import { normalizeUsername, checkUsername, USERNAME_PROBLEM_MESSAGE } from "@/lib/username";

/** Matches the cost factor used by the seed, so demo and real accounts verify at the same speed. */
const BCRYPT_ROUNDS = 10;

class UserError extends Error {}

export interface UserFormState {
  error?: string;
  message?: string;
}

const CreateUserSchema = z.object({
  name: z.string().trim().min(2, "Enter the employee's name").max(80),
  username: z.string().trim().min(1, "Username is required"),
  email: z.string().trim().max(200).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  role: z.enum(["OWNER", "MANAGER", "CASHIER", "ATTENDANT"]),
});

export async function createUserAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const actor = await requireUser();
  if (!can(actor.role, "manageUsers")) {
    return { error: "Only an owner can add employees." };
  }

  const parsed = CreateUserSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username") ?? "",
    email: formData.get("email") ?? undefined,
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Normalised because that's the form loginAction looks up — the unique
  // index is case-sensitive, so "Ramesh" and "ramesh" would otherwise both be
  // creatable and neither would reliably log in.
  const username = normalizeUsername(parsed.data.username);
  const usernameProblem = checkUsername(username);
  if (usernameProblem) return { error: USERNAME_PROBLEM_MESSAGE[usernameProblem] };

  // Email is optional contact detail, not a credential. Blank becomes null
  // rather than "" so the column means "we don't have one" instead of holding
  // an empty string that looks like an address.
  const email = parsed.data.email?.trim() ? parsed.data.email.trim().toLowerCase() : null;

  try {
    // Scoped to this station. A global lookup here would tell one pump's
    // owner that a username is taken at some *other* pump — a cross-tenant
    // leak dressed up as a validation message.
    const existing = await prisma.user.findUnique({
      where: { stationId_username: { stationId: actor.stationId, username } },
    });
    if (existing) throw new UserError("Someone at this station already uses that username.");

    const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          stationId: actor.stationId,
          name: parsed.data.name,
          username,
          email,
          passwordHash,
          role: parsed.data.role as Role,
          active: true,
        },
      });

      await tx.auditLog.create({
        data: {
          stationId: actor.stationId,
          actorId: actor.id,
          action: "USER_CREATED",
          entityType: "User",
          entityId: user.id,
          // Never the password or its hash.
          metadata: { name: user.name, username: user.username, email: user.email, role: user.role },
        },
      });

      return user;
    });

    revalidatePath("/employees");
    return { message: `${created.name} added as ${ROLE_LABEL[created.role]}.` };
  } catch (err) {
    if (err instanceof UserError) return { error: err.message };
    console.error("createUserAction failed", err);
    return { error: "Could not add the employee. Please try again." };
  }
}

/**
 * Deactivating is the closest thing this app has to firing someone: the
 * account stops working immediately. Deleting isn't an option — `Sale`,
 * `Purchase` and `AuditLog` all reference the user with `onDelete: Restrict`,
 * and rightly so; the history has to stay attributable.
 */
export async function setUserActiveAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const actor = await requireUser();
  if (!can(actor.role, "manageUsers")) {
    return { error: "Only an owner can activate or deactivate employees." };
  }

  const targetId = String(formData.get("userId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!targetId) return { error: "Missing employee." };

  try {
    const name = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findFirst({ where: { id: targetId, stationId: actor.stationId } });
      if (!target) throw new UserError("That employee isn't at this station.");
      if (target.active === active) {
        throw new UserError(`${target.name} is already ${active ? "active" : "deactivated"}.`);
      }

      if (!active) {
        // Locking yourself out is never what you meant.
        if (target.id === actor.id) {
          throw new UserError("You can't deactivate your own account.");
        }
        // Nor is leaving the station with nobody who can manage users.
        if (target.role === Role.OWNER) {
          const otherOwners = await tx.user.count({
            where: { stationId: actor.stationId, role: Role.OWNER, active: true, id: { not: target.id } },
          });
          if (otherOwners === 0) {
            throw new UserError("That's the last active owner — promote someone else first.");
          }
        }
      }

      await tx.user.update({
        where: { id: target.id },
        data: active ? { active: true } : { active: false, onShift: false, shiftStartedAt: null },
      });

      if (!active) {
        // Revoke every live session. This is what makes deactivation take
        // effect on the target's *next request* rather than whenever their
        // token happens to expire — readSession() checks the row, not just
        // the JWT.
        await tx.session.updateMany({
          where: { userId: target.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        // Close any shift they were mid-way through, so it isn't left open forever.
        await tx.shift.updateMany({
          where: { userId: target.id, endedAt: null },
          data: { endedAt: new Date(), endedById: actor.id },
        });
      }

      await tx.auditLog.create({
        data: {
          stationId: actor.stationId,
          actorId: actor.id,
          action: active ? "USER_REACTIVATED" : "USER_DEACTIVATED",
          entityType: "User",
          entityId: target.id,
          metadata: { name: target.name, role: target.role },
        },
      });

      return target.name;
    });

    revalidatePath("/employees");
    revalidatePath("/dashboard");
    return { message: active ? `${name} reactivated.` : `${name} deactivated and signed out everywhere.` };
  } catch (err) {
    if (err instanceof UserError) return { error: err.message };
    console.error("setUserActiveAction failed", err);
    return { error: "Could not update the employee. Please try again." };
  }
}

const ChangeRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["OWNER", "MANAGER", "CASHIER", "ATTENDANT"]),
});

export async function changeUserRoleAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const actor = await requireUser();
  if (!can(actor.role, "manageUsers")) {
    return { error: "Only an owner can change roles." };
  }

  const parsed = ChangeRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Choose a valid role." };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findFirst({ where: { id: parsed.data.userId, stationId: actor.stationId } });
      if (!target) throw new UserError("That employee isn't at this station.");

      const newRole = parsed.data.role as Role;
      if (target.role === newRole) throw new UserError(`${target.name} is already ${ROLE_LABEL[newRole]}.`);

      if (target.id === actor.id && newRole !== Role.OWNER) {
        throw new UserError("You can't demote your own account — ask another owner to do it.");
      }

      if (target.role === Role.OWNER && newRole !== Role.OWNER) {
        const otherOwners = await tx.user.count({
          where: { stationId: actor.stationId, role: Role.OWNER, active: true, id: { not: target.id } },
        });
        if (otherOwners === 0) {
          throw new UserError("That's the last active owner — promote someone else first.");
        }
      }

      await tx.user.update({ where: { id: target.id }, data: { role: newRole } });

      // A role change is a permission change, so drop their sessions: they
      // sign back in and pick up the new capabilities immediately, instead of
      // carrying the old ones until the token expires.
      await tx.session.updateMany({
        where: { userId: target.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          stationId: actor.stationId,
          actorId: actor.id,
          action: "USER_ROLE_CHANGED",
          entityType: "User",
          entityId: target.id,
          metadata: { name: target.name, oldRole: target.role, newRole },
        },
      });

      return { name: target.name, newRole };
    });

    revalidatePath("/employees");
    return { message: `${result.name} is now ${ROLE_LABEL[result.newRole]} and has been signed out.` };
  } catch (err) {
    if (err instanceof UserError) return { error: err.message };
    console.error("changeUserRoleAction failed", err);
    return { error: "Could not change the role. Please try again." };
  }
}
