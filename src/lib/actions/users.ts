"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { can, type Role, type Permission, ROLE_LABEL } from "@/lib/permissions";
import { normalizeUsername, checkUsername, USERNAME_PROBLEM_MESSAGE } from "@/lib/username";

/** Matches the cost factor used by the seed, so demo and real accounts verify at the same speed. */
const BCRYPT_ROUNDS = 10;

class UserError extends Error {}

export interface UserFormState {
  error?: string;
  message?: string;
}

const CreateUserSchema = z.object({
  name: z.string().trim().min(2, "Enter the employee's full name").max(80),
  username: z.string().trim().min(1, "Username is required"),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().max(200).optional(),
  employeeId: z.string().trim().max(50).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  role: z.enum(["OWNER", "MANAGER", "CASHIER", "ACCOUNTANT", "ATTENDANT", "OTHER"]),
  permissions: z.array(z.string()).optional(),
});

export async function createUserAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const actor = await requireUser();
  if (!can(actor.role as Role, "manageUsers")) {
    return { error: "Only a Station Admin can create staff accounts." };
  }

  // Parse permissions array from multiple checkbox inputs or JSON
  const rawPermissions = formData.getAll("permissions").map(String);
  const permissionsJson = formData.get("permissionsJson");
  let permissions: string[] | undefined = undefined;

  if (typeof permissionsJson === "string" && permissionsJson.trim().length > 0) {
    try {
      permissions = JSON.parse(permissionsJson);
    } catch {
      permissions = rawPermissions;
    }
  } else if (rawPermissions.length > 0) {
    permissions = rawPermissions;
  }

  const parsed = CreateUserSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username") ?? "",
    phone: formData.get("phone") ? String(formData.get("phone")).trim() : undefined,
    email: formData.get("email") ? String(formData.get("email")).trim() : undefined,
    employeeId: formData.get("employeeId") ? String(formData.get("employeeId")).trim() : undefined,
    password: formData.get("password"),
    role: formData.get("role"),
    permissions,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const username = normalizeUsername(parsed.data.username);
  const usernameProblem = checkUsername(username);
  if (usernameProblem) return { error: USERNAME_PROBLEM_MESSAGE[usernameProblem] };

  const email = parsed.data.email?.trim() ? parsed.data.email.trim().toLowerCase() : null;
  const phone = parsed.data.phone?.trim() || null;
  const employeeId = parsed.data.employeeId?.trim() || null;
  const role = parsed.data.role as Role;

  // Station Admin (OWNER) automatically has 100% full access, permissions are null
  const customPermissionsString = role === "OWNER" || !parsed.data.permissions
    ? null
    : JSON.stringify(parsed.data.permissions);

  try {
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
          phone,
          email,
          employeeId,
          passwordHash,
          role,
          permissions: customPermissionsString,
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
          metadata: JSON.stringify({
            name: user.name,
            username: user.username,
            role: user.role,
            employeeId: user.employeeId,
            customPermissions: customPermissionsString ? parsed.data.permissions : "DEFAULT",
          }),
        },
      });

      return user;
    });

    revalidatePath("/employees");
    revalidatePath("/access");
    return { message: `${created.name} created as ${ROLE_LABEL[created.role as Role]}.` };
  } catch (err) {
    if (err instanceof UserError) return { error: err.message };
    console.error("createUserAction failed", err);
    return { error: "Could not add the employee. Please try again." };
  }
}

/**
 * Updates an existing staff member's custom permissions.
 */
export async function updateUserPermissionsAction(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const actor = await requireUser();
  if (!can(actor.role as Role, "manageUsers")) {
    return { error: "Only a Station Admin can customize staff permissions." };
  }

  const userId = String(formData.get("userId") ?? "");
  const permissionsJson = String(formData.get("permissionsJson") ?? "");
  const resetToDefault = String(formData.get("resetToDefault") ?? "") === "true";

  if (!userId) return { error: "Employee ID is required." };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findFirst({
        where: { id: userId, stationId: actor.stationId },
      });
      if (!target) throw new UserError("Employee not found at this station.");

      if (target.role === "OWNER") {
        throw new UserError("Station Admin automatically has 100% full access — permissions cannot be restricted.");
      }

      let newPermissions: string | null = null;
      if (!resetToDefault && permissionsJson) {
        const parsed = JSON.parse(permissionsJson);
        if (Array.isArray(parsed)) {
          newPermissions = JSON.stringify(parsed);
        }
      }

      await tx.user.update({
        where: { id: target.id },
        data: { permissions: newPermissions },
      });

      // Drop active sessions so updated capabilities reflect immediately
      await tx.session.updateMany({
        where: { userId: target.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          stationId: actor.stationId,
          actorId: actor.id,
          action: "USER_PERMISSIONS_UPDATED",
          entityType: "User",
          entityId: target.id,
          metadata: JSON.stringify({
            name: target.name,
            role: target.role,
            permissions: newPermissions ? JSON.parse(newPermissions) : "DEFAULT",
          }),
        },
      });

      return target.name;
    });

    revalidatePath("/employees");
    revalidatePath("/access");
    return { message: `Permissions updated for ${result}.` };
  } catch (err) {
    if (err instanceof UserError) return { error: err.message };
    console.error("updateUserPermissionsAction failed", err);
    return { error: "Could not update permissions. Please try again." };
  }
}

/**
 * Deactivating or reactivating an employee account.
 */
export async function setUserActiveAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const actor = await requireUser();
  if (!can(actor.role as Role, "manageUsers")) {
    return { error: "Only a Station Admin can activate or deactivate employees." };
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
        if (target.id === actor.id) {
          throw new UserError("You can't deactivate your own account.");
        }
        if (target.role === "OWNER") {
          const otherOwners = await tx.user.count({
            where: { stationId: actor.stationId, role: "OWNER", active: true, id: { not: target.id } },
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
        await tx.session.updateMany({
          where: { userId: target.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
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
          metadata: JSON.stringify({ name: target.name, role: target.role }),
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
  role: z.enum(["OWNER", "MANAGER", "CASHIER", "ACCOUNTANT", "ATTENDANT", "OTHER"]),
});

export async function changeUserRoleAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const actor = await requireUser();
  if (!can(actor.role as Role, "manageUsers")) {
    return { error: "Only a Station Admin can change roles." };
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

      if (target.id === actor.id && newRole !== "OWNER") {
        throw new UserError("You can't demote your own account — ask another owner to do it.");
      }

      if (target.role === "OWNER" && newRole !== "OWNER") {
        const otherOwners = await tx.user.count({
          where: { stationId: actor.stationId, role: "OWNER", active: true, id: { not: target.id } },
        });
        if (otherOwners === 0) {
          throw new UserError("That's the last active owner — promote someone else first.");
        }
      }

      // Reset permissions override when role changes so new role default applies
      await tx.user.update({
        where: { id: target.id },
        data: { role: newRole, permissions: null },
      });

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
          metadata: JSON.stringify({ name: target.name, oldRole: target.role, newRole }),
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
