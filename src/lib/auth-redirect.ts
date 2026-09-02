/**
 * Validates post-login redirect targets. Only same-origin relative paths are
 * allowed — blocks open redirects and auth-page loops.
 */
export function safeInternalPath(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;

  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (path.includes("\\")) return fallback;
  if (/^\/[^/?#]*:/i.test(path)) return fallback;

  const pathname = path.split(/[?#]/, 1)[0] ?? path;
  if (pathname === "/login" || pathname.startsWith("/login/")) return fallback;
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) return fallback;

  return path;
}
