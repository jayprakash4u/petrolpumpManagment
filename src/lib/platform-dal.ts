import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readAdminSession } from "@/lib/platform-session";

/**
 * Data Access Layer for the platform plane. The operator equivalent of
 * src/lib/dal.ts, and the actual security boundary for /admin — the proxy's
 * cookie check is only a UX shortcut.
 *
 * Note what this deliberately does NOT provide: any way to obtain a tenant
 * `User`. An operator is never "acting as" a station; the console reads
 * tenant *metadata* (names, counts, dates), never tenant business data.
 */
export const getCurrentAdmin = cache(async () => {
  const session = await readAdminSession();
  return session?.admin ?? null;
});

/** Use in /admin pages and every platform Server Action. Redirects to the operator login, not the tenant one. */
export async function requirePlatformAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
