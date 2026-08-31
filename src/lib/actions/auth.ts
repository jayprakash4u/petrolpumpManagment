"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getTenantDb } from "@/lib/tenant-db";
import { createSession, destroySession } from "@/lib/session";
import { requireSession } from "@/lib/dal";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/rate-limit";
import { normalizeSlug } from "@/lib/tenant";
import { normalizeUsername } from "@/lib/username";

/** Matches the cost factor used elsewhere, so demo and real accounts verify at the same speed. */
const BCRYPT_ROUNDS = 10;

/**
 * A real bcrypt hash of a value nobody knows, compared against when no user
 * matched. Without it, a miss returns before any hashing happens and the
 * response time alone reveals whether a station code or username exists.
 */
const DUMMY_HASH = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

const LoginSchema = z.object({
  station: z.string().trim().min(1, "Station code is required"),
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    station: formData.get("station") ?? "",
    username: formData.get("username") ?? "",
    password: formData.get("password") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { password } = parsed.data;

  if (parsed.data.username.includes("@")) {
    return {
      error: "That looks like an email address. Sign in with your username (for example: ramesh), not your email.",
    };
  }

  const username = normalizeUsername(parsed.data.username);
  const slug = normalizeSlug(parsed.data.station);

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rateLimitKey = `${ip}:${slug}:${username}`;

  const rl = checkLoginRateLimit(rateLimitKey);
  if (!rl.allowed) {
    return { error: `Too many attempts. Try again in ${Math.ceil((rl.retryAfterSec ?? 60) / 60)} minute(s).` };
  }

  try {
    const tenantDb = await getTenantDb(slug);

    const station = await tenantDb.station.findUnique({
      where: { slug },
      select: { id: true, suspendedAt: true },
    });

    const usable = station && station.suspendedAt === null ? station : null;

    const user = usable
      ? await tenantDb.user.findUnique({
          where: { stationId_username: { stationId: usable.id, username } },
        })
      : null;

    if (!user || !user.active) {
      await bcrypt.compare(password, DUMMY_HASH);
      return { error: "Invalid station code, username, or password." };
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return { error: "Invalid station code, username, or password." };
    }

    resetLoginRateLimit(rateLimitKey);
    await createSession(user.id, slug, { userAgent: headerList.get("user-agent") ?? undefined, ipAddress: ip });
  } catch (err) {
    console.error("Login attempt error:", err);
    await bcrypt.compare(password, DUMMY_HASH);
    return { error: "Invalid station code, username, or password." };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/* ------------------------------------------------------------------ *
 * Self-service: update my own profile, and optionally my own password
 * ------------------------------------------------------------------ */

export interface OwnProfileState {
  error?: string;
  message?: string;
}

const UpdateOwnProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().max(200).optional(),
  currentPassword: z.string().optional().or(z.literal("")),
  newPassword: z.string().min(8, "New password must be at least 8 characters").optional().or(z.literal("")),
});

/**
 * Lets the signed-in user (any role — including the station Owner) update
 * their own name/phone/email, and change their own password if they supply
 * both their current password and a new one. This is the "software side"
 * counterpart to the platform admin's Account Recovery: a station owner who
 * simply wants to change their own password doesn't need to contact
 * platform support at all.
 */
export async function updateOwnProfileAction(_prev: OwnProfileState, formData: FormData): Promise<OwnProfileState> {
  const session = await requireSession();

  const parsed = UpdateOwnProfileSchema.safeParse({
    name: formData.get("name") ?? "",
    phone: formData.get("phone") ?? undefined,
    email: formData.get("email") ?? undefined,
    currentPassword: formData.get("currentPassword") ?? "",
    newPassword: formData.get("newPassword") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, phone, email, currentPassword, newPassword } = parsed.data;

  try {
    const tenantDb = await getTenantDb(session.tenantSlug);

    const updateData: { name: string; phone: string | null; email: string | null; passwordHash?: string } = {
      name,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
    };

    let passwordChanged = false;
    if (newPassword) {
      if (!currentPassword) {
        return { error: "Enter your current password to set a new one." };
      }
      // Re-read the hash fresh rather than trusting the session's copy —
      // it could be a few requests stale if something else just changed it.
      const fresh = await tenantDb.user.findUnique({ where: { id: session.user.id } });
      if (!fresh) return { error: "Your account could not be found. Please sign in again." };

      const valid = await bcrypt.compare(currentPassword, fresh.passwordHash);
      if (!valid) return { error: "Current password is incorrect." };

      updateData.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      passwordChanged = true;
    }

    await tenantDb.$transaction(async (tx) => {
      await tx.user.update({ where: { id: session.user.id }, data: updateData });

      if (passwordChanged) {
        // Keep the session that just did this; sign out everywhere else.
        await tx.session.updateMany({
          where: { userId: session.user.id, revokedAt: null, id: { not: session.sessionId } },
          data: { revokedAt: new Date() },
        });
      }

      await tx.auditLog.create({
        data: {
          stationId: session.user.stationId,
          actorId: session.user.id,
          action: passwordChanged ? "SELF_PASSWORD_CHANGED" : "SELF_PROFILE_UPDATED",
          entityType: "User",
          entityId: session.user.id,
          metadata: JSON.stringify({ name }),
        },
      });
    });

    revalidatePath("/profile");
    return {
      message: passwordChanged
        ? "Profile and password updated. You're still signed in here; other devices were signed out."
        : "Profile updated.",
    };
  } catch (err) {
    console.error("updateOwnProfileAction failed", err);
    return { error: "Could not update your profile. Please try again." };
  }
}
