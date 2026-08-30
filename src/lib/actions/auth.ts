"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getTenantDb } from "@/lib/tenant-db";
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
