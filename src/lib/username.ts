/**
 * Username rules.
 *
 * Staff sign in with a username, not an email. At a petrol pump most
 * attendants have no work email at all, and inventing one just to satisfy a
 * login form produces addresses nobody reads and nobody can recover. A
 * username the owner assigns is what actually matches how a pump hires.
 *
 * Usernames are unique **per station**, exactly like the emails they replace
 * — so two pumps can both have a `ramesh` without knowing about each other.
 */

export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;

/**
 * Reserved so a username can never be mistaken for a role or a system
 * account in a log line, a URL, or a support conversation.
 */
export const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "root",
  "system",
  "support",
  "help",
  "owner",
  "manager",
  "cashier",
  "attendant",
  "staff",
  "user",
  "guest",
  "test",
  "null",
  "undefined",
  "me",
]);

/**
 * Canonical form: lowercase, spaces to dots, only letters, digits, dot,
 * underscore and hyphen kept, no repeated or edge separators.
 *
 * Both creation and login normalise, so "Ramesh Thapa", "ramesh.thapa" and
 * "  RAMESH_THAPA  " all resolve to one account instead of failing a lookup
 * for a reason the operator can't see. Case-insensitivity also stops two
 * accounts differing only by capitals — an obvious impersonation route.
 */
export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._@-]/g, "")
    .replace(/([._-])\1+/g, "$1")
    .replace(/^[._-]+|[._-]+$/g, "");
}

export type UsernameProblem = "EMPTY" | "TOO_SHORT" | "TOO_LONG" | "RESERVED" | "NO_LETTER";

export function checkUsername(normalized: string): UsernameProblem | null {
  if (normalized.length === 0) return "EMPTY";
  // Reserved is checked before length so the list stays authoritative: a
  // short entry like "me" would otherwise be reported as TOO_SHORT and its
  // reservation would be silently unreachable.
  if (RESERVED_USERNAMES.has(normalized)) return "RESERVED";
  if (normalized.length < MIN_USERNAME_LENGTH) return "TOO_SHORT";
  if (normalized.length > MAX_USERNAME_LENGTH) return "TOO_LONG";
  // At least one letter, so a username can never be confused with an id or a
  // receipt number in a log, a report, or a conversation.
  if (!/[a-z]/.test(normalized)) return "NO_LETTER";
  return null;
}

export const USERNAME_PROBLEM_MESSAGE: Record<UsernameProblem, string> = {
  EMPTY: "Enter a username.",
  TOO_SHORT: `A username needs at least ${MIN_USERNAME_LENGTH} characters.`,
  TOO_LONG: `A username can be at most ${MAX_USERNAME_LENGTH} characters.`,
  RESERVED: "That username is reserved. Pick another.",
  NO_LETTER: "A username must contain at least one letter.",
};

/** Suggests a username from a person's name, for prefilling a form. */
export function usernameFromName(name: string): string {
  return normalizeUsername(name).slice(0, MAX_USERNAME_LENGTH).replace(/[._-]+$/, "");
}
