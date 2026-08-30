import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";

/**
 * Data Access Layer — the one place that resolves "who is making this
 * request". Wrapped in React's `cache()` so multiple Server Components in
 * the same render pass share one DB lookup instead of re-querying Session
 * per component. Every page/action that needs the current user should call
 * this (or requireUser) rather than reading the cookie directly.
 */
export const getCurrentSession = cache(async () => {
  return await readSession();
});

export const getCurrentUser = cache(async () => {
  const session = await getCurrentSession();
  return session?.user ?? null;
});

/** Use in Server Components / layouts that require auth: redirects to /login instead of returning null. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  return session;
}
