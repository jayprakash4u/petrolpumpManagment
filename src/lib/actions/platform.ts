"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/platform-dal";
import { createAdminSession, destroyAdminSession } from "@/lib/platform-session";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/rate-limit";
import { normalizeSlug, checkSlug, SLUG_PROBLEM_MESSAGE } from "@/lib/tenant";
import { normalizeUsername, checkUsername, USERNAME_PROBLEM_MESSAGE } from "@/lib/username";

const BCRYPT_ROUNDS = 10;

/** Same purpose as the tenant login's: keep a miss as slow as a hit. */
const DUMMY_HASH = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

class PlatformError extends Error {}

/* ------------------------------------------------------------------ *
 * Operator login
 * ------------------------------------------------------------------ */

export interface AdminLoginState {
  error?: string;
}

const AdminLoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function adminLoginAction(_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const parsed = AdminLoginSchema.safeParse({
    username: formData.get("username") ?? "",
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const username = normalizeUsername(parsed.data.username);
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

  // Namespaced away from tenant login attempts so the two can't consume each
  // other's budget.
  const rl = checkLoginRateLimit(`platform:${ip}:${username}`);
  if (!rl.allowed) {
    return { error: `Too many attempts. Try again in ${Math.ceil((rl.retryAfterSec ?? 60) / 60)} minute(s).` };
  }

  const admin = await prisma.platformAdmin.findUnique({ where: { username } });

  if (!admin || !admin.active) {
    await bcrypt.compare(parsed.data.password, DUMMY_HASH);
    return { error: "Invalid username or password." };
  }

  if (!(await bcrypt.compare(parsed.data.password, admin.passwordHash))) {
    return { error: "Invalid username or password." };
  }

  resetLoginRateLimit(`platform:${ip}:${username}`);
  await createAdminSession(admin.id, {
    userAgent: headerList.get("user-agent") ?? undefined,
    ipAddress: ip,
  });

  await prisma.platformAuditLog.create({
    data: { actorId: admin.id, action: "ADMIN_SIGNED_IN", entityType: "PlatformAdmin", entityId: admin.id },
  });

  redirect("/admin");
}

export async function adminLogoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}

/* ------------------------------------------------------------------ *
 * Onboard a tenant
 * ------------------------------------------------------------------ */

export interface OnboardState {
  error?: string;
  message?: string;
}

const OnboardSchema = z.object({
  name: z.string().trim().min(2, "Enter the station name").max(120),
  slug: z.string().trim().min(1, "Enter a station code"),
  address: z.string().trim().min(2, "Enter the station address").max(200),
  ownerName: z.string().trim().min(2, "Enter the owner's name").max(80),
  ownerUsername: z.string().trim().min(1, "Owner username is required"),
  ownerPassword: z.string().min(8, "Owner password must be at least 8 characters").max(200),
});

/**
 * Creates a tenant and its first owner in one transaction.
 *
 * These two must not be separable: a station with no owner is unreachable
 * (nobody can sign in to it, and only an owner can create users), and an
 * owner with no station violates the required `User.stationId`. Committing
 * one without the other leaves the platform with a tenant that has to be
 * repaired by hand.
 */
export async function onboardStationAction(_prev: OnboardState, formData: FormData): Promise<OnboardState> {
  const admin = await requirePlatformAdmin();

  const parsed = OnboardSchema.safeParse({
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    address: formData.get("address") ?? "",
    ownerName: formData.get("ownerName") ?? "",
    ownerUsername: formData.get("ownerUsername") ?? "",
    ownerPassword: formData.get("ownerPassword") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const slug = normalizeSlug(parsed.data.slug);
  const slugProblem = checkSlug(slug);
  if (slugProblem) return { error: SLUG_PROBLEM_MESSAGE[slugProblem] };

  const ownerUsername = normalizeUsername(parsed.data.ownerUsername);
  const usernameProblem = checkUsername(ownerUsername);
  if (usernameProblem) return { error: USERNAME_PROBLEM_MESSAGE[usernameProblem] };

  try {
    const passwordHash = await bcrypt.hash(parsed.data.ownerPassword, BCRYPT_ROUNDS);

    const created = await prisma.$transaction(async (tx) => {
      const clash = await tx.station.findUnique({ where: { slug } });
      if (clash) throw new PlatformError(`Station code "${slug}" is already taken.`);

      const station = await tx.station.create({
        data: { slug, name: parsed.data.name, address: parsed.data.address },
      });

      const owner = await tx.user.create({
        data: {
          stationId: station.id,
          name: parsed.data.ownerName,
          username: ownerUsername,
          passwordHash,
          role: Role.OWNER,
          active: true,
        },
      });

      await tx.platformAuditLog.create({
        data: {
          actorId: admin.id,
          action: "STATION_CREATED",
          entityType: "Station",
          entityId: station.id,
          // Never the password or its hash.
          metadata: { slug, name: station.name, ownerUsername: owner.username },
        },
      });

      return station;
    });

    revalidatePath("/admin");
    return {
      message: `${created.name} created. Staff sign in with station code "${created.slug}".`,
    };
  } catch (err) {
    if (err instanceof PlatformError) return { error: err.message };
    console.error("onboardStationAction failed", err);
    return { error: "Could not create the station. Nothing was saved — please try again." };
  }
}

/* ------------------------------------------------------------------ *
 * Suspend / restore a tenant
 * ------------------------------------------------------------------ */

export interface SuspendState {
  error?: string;
  message?: string;
}

export async function setStationSuspendedAction(_prev: SuspendState, formData: FormData): Promise<SuspendState> {
  const admin = await requirePlatformAdmin();

  const stationId = String(formData.get("stationId") ?? "");
  const suspend = String(formData.get("suspend") ?? "") === "true";
  const reason = String(formData.get("reason") ?? "").trim();

  if (!stationId) return { error: "Missing station." };
  if (suspend && reason.length < 3) {
    return { error: "Give a reason for the suspension — it goes on the platform audit trail." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const station = await tx.station.findUnique({ where: { id: stationId } });
      if (!station) throw new PlatformError("That station doesn't exist.");

      const alreadySuspended = station.suspendedAt !== null;
      if (alreadySuspended === suspend) {
        throw new PlatformError(`${station.name} is already ${suspend ? "suspended" : "active"}.`);
      }

      await tx.station.update({
        where: { id: station.id },
        data: suspend
          ? { suspendedAt: new Date(), suspendedReason: reason }
          : { suspendedAt: null, suspendedReason: null },
      });

      let revoked = 0;
      if (suspend) {
        // Cut off everyone at once. Login is already blocked for a suspended
        // station, but without this anyone already signed in would keep
        // trading for up to their remaining 8 hours.
        const result = await tx.session.updateMany({
          where: { user: { stationId: station.id }, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        revoked = result.count;

        // Close any open shift, so the suspension doesn't leave staff
        // recorded as on-duty indefinitely.
        await tx.shift.updateMany({
          where: { user: { stationId: station.id }, endedAt: null },
          data: { endedAt: new Date() },
        });
        await tx.user.updateMany({
          where: { stationId: station.id, onShift: true },
          data: { onShift: false, shiftStartedAt: null },
        });
      }

      await tx.platformAuditLog.create({
        data: {
          actorId: admin.id,
          action: suspend ? "STATION_SUSPENDED" : "STATION_RESTORED",
          entityType: "Station",
          entityId: station.id,
          metadata: { name: station.name, slug: station.slug, reason: suspend ? reason : null, sessionsRevoked: revoked },
        },
      });

      return { name: station.name, revoked };
    });

    revalidatePath("/admin");
    return {
      message: suspend
        ? `${result.name} suspended — ${result.revoked} active session(s) signed out.`
        : `${result.name} restored. Staff can sign in again.`,
    };
  } catch (err) {
    if (err instanceof PlatformError) return { error: err.message };
    console.error("setStationSuspendedAction failed", err);
    return { error: "Could not update the station. Please try again." };
  }
}
