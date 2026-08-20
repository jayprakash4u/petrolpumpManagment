import { NextResponse, type NextRequest } from "next/server";
import { hasSessionCookieOptimistic } from "@/lib/session";
import { hasAdminCookieOptimistic } from "@/lib/platform-session";

/**
 * Optimistic auth gate (Next.js's "Proxy", formerly Middleware). Only reads
 * the signed cookie — no DB round trip — so this stays fast on every
 * navigation. It is a UX convenience, NOT the security boundary: every
 * Server Action and data query re-verifies against the Session table via
 * src/lib/dal.ts, which is what actually protects data.
 */
const PUBLIC_PATHS = ["/login"];
const ADMIN_LOGIN = "/admin/login";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ---- Platform plane: separate cookie, separate table, checked separately.
  // A tenant cookie grants nothing here, and an operator cookie grants
  // nothing in the tenant app.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // Never redirect away from the operator login — same reasoning as the
    // tenant login below. Bouncing on a signature-only check loops forever
    // once the session row is gone. See src/proxy.test.ts.
    if (pathname === ADMIN_LOGIN || pathname.startsWith(ADMIN_LOGIN + "/")) {
      return NextResponse.next();
    }
    if (!(await hasAdminCookieOptimistic())) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, req.url));
    }
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const authed = await hasSessionCookieOptimistic();

  if (!authed && !isPublic) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Deliberately NO "authed && /login -> /dashboard" rule here.
  //
  // This check is signature-only; the database is the real authority. The two
  // disagree whenever a session is revoked server-side while the cookie is
  // still cryptographically valid — a logout elsewhere, an expiry sweep, a
  // deactivated user, a restored backup. Bouncing /login -> /dashboard on the
  // optimistic answer then fights requireUser() bouncing /dashboard -> /login
  // on the real one, and the browser loops until it gives up.
  //
  // src/app/login/page.tsx already redirects a genuinely signed-in visitor to
  // the dashboard using a DB-backed check, so nothing is lost by leaving it
  // to the page — and a user holding a dead cookie reaches the login form
  // instead of an infinite redirect.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
