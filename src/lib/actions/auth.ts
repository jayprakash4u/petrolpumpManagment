"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/rate-limit";
import { normalizeSlug } from "@/lib/tenant";
import { normalizeUsername } from "@/lib/username";

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
  // Coerced to "" rather than passed as null: a missing field would otherwise
  // fail zod's *type* check and surface "expected string, received null"
  // instead of the field's own message.
  const parsed = LoginSchema.safeParse({
    station: formData.get("station") ?? "",
    username: formData.get("username") ?? "",
    password: formData.get("password") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { password } = parsed.data;

  // Format guidance, decided *before* touching the database and derived only
  // from what the caller typed. It therefore reveals nothing about which
  // stations exist or who works at them, while rescuing the one mistake a
  // generic "invalid" makes impossible to diagnose: a browser that autofills
  // a saved email address into a field that used to be an email field.
  if (parsed.data.username.includes("@")) {
    return {
      error: "That looks like an email address. Sign in with your username (for example: ramesh), not your email.",
    };
  }

  const username = normalizeUsername(parsed.data.username);
  const slug = normalizeSlug(parsed.data.station);

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  // Keyed per tenant as well as per address, so one pump being attacked
  // can't lock out a different pump's staff who share an IP (or a username).
  const rateLimitKey = `${ip}:${slug}:${username}`;

  const rl = checkLoginRateLimit(rateLimitKey);
  if (!rl.allowed) {
    return { error: `Too many attempts. Try again in ${Math.ceil((rl.retryAfterSec ?? 60) / 60)} minute(s).` };
  }

  const station = slug
    ? await prisma.station.findUnique({ where: { slug }, select: { id: true, suspendedAt: true } })
    : null;

  // A suspended tenant is treated exactly like a non-existent one, so the
  // failure message never tells an outsider that a pump exists but is in
  // arrears. Staff hear that from their owner, not from the login screen.
  const usable = station && station.suspendedAt === null ? station : null;

  // Identity is (station, username) — never username alone. Looking up globally
  // would make one name usable at only one pump in the whole
  // system, and would leak across tenants.
  const user = usable
    ? await prisma.user.findUnique({ where: { stationId_username: { stationId: usable.id, username } } })
    : null;

  // One message for every failure — unknown station, unknown username, wrong
  // password, deactivated account. Distinguishing them would let anyone
  // enumerate which stations exist and who works at them.
  if (!user || !user.active) {
    // Still spend the time a real comparison would, so a missing station or
    // user isn't detectable by how fast the response comes back.
    await bcrypt.compare(password, DUMMY_HASH);
    return { error: "Invalid station code, username, or password." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid station code, username, or password." };
  }

  resetLoginRateLimit(rateLimitKey);
  await createSession(user.id, { userAgent: headerList.get("user-agent") ?? undefined, ipAddress: ip });
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
