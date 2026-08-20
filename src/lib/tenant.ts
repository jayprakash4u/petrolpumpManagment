/**
 * Tenant identity helpers.
 *
 * One petrol pump is one tenant, and `Station.slug` is its public handle —
 * the code a member of staff types at login. It is deliberately the *only*
 * globally unique thing a tenant exposes: emails are unique per station, so
 * nothing about one pump's staff can be inferred from another's.
 */

/** Bounds chosen so a code fits on a printed card and in a subdomain label. */
export const MIN_SLUG_LENGTH = 3;
export const MAX_SLUG_LENGTH = 40;

/**
 * Reserved because they'd collide with routes or read as system-owned if a
 * tenant slug ever becomes a subdomain or a path segment.
 */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "dashboard",
  "login",
  "logout",
  "signup",
  "register",
  "settings",
  "support",
  "help",
  "www",
  "mail",
  "static",
  "assets",
  "public",
  "system",
  "root",
  "station",
  "stations",
]);

/**
 * Normalises whatever the user typed into the canonical form stored in the
 * database: lowercase, spaces and underscores to hyphens, punctuation
 * dropped, no leading/trailing/repeated hyphens.
 *
 * Both sides go through this — the signup that creates the slug and the
 * login that looks it up — so "Shree Petroleum", "shree_petroleum" and
 * "  SHREE-PETROLEUM  " all resolve to the same tenant instead of failing a
 * lookup for a reason nobody can see.
 */
export function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export type SlugProblem = "EMPTY" | "TOO_SHORT" | "TOO_LONG" | "RESERVED";

export function checkSlug(normalized: string): SlugProblem | null {
  if (normalized.length === 0) return "EMPTY";
  if (normalized.length < MIN_SLUG_LENGTH) return "TOO_SHORT";
  if (normalized.length > MAX_SLUG_LENGTH) return "TOO_LONG";
  if (RESERVED_SLUGS.has(normalized)) return "RESERVED";
  return null;
}

/** Suggests a slug from a station's name, for prefilling a signup form. */
export function slugFromName(name: string): string {
  return normalizeSlug(name).slice(0, MAX_SLUG_LENGTH).replace(/-$/, "");
}

export const SLUG_PROBLEM_MESSAGE: Record<SlugProblem, string> = {
  EMPTY: "Enter your station code.",
  TOO_SHORT: `A station code needs at least ${MIN_SLUG_LENGTH} characters.`,
  TOO_LONG: `A station code can be at most ${MAX_SLUG_LENGTH} characters.`,
  RESERVED: "That station code is reserved. Pick another.",
};
