/**
 * Vehicle number handling.
 *
 * A plate gets typed a dozen ways at a busy pump — "ba 2 kha 1234",
 * "BA-2-KHA-1234", "Ba2Kha1234". Stored verbatim, vehicle-wise billing would
 * split one lorry across several rows and every per-vehicle total would be
 * wrong in a way nobody notices.
 *
 * So there are two forms, deliberately:
 *   - the CANONICAL form, stored and matched on (uppercase, no separators)
 *   - the DISPLAY form, spaced back out for a human reading a report
 *
 * Nepali plates look like "BA 2 KHA 1234" (zone, lot number, Devanagari
 * letter romanised, serial), but embossed plates and other countries' formats
 * turn up too, so the rules are permissive: normalise aggressively, reject
 * only what is clearly not a plate.
 */

export const MIN_VEHICLE_LENGTH = 4;
export const MAX_VEHICLE_LENGTH = 20;

/**
 * Canonical form: uppercase alphanumerics only. Everything a human might use
 * as a separator — spaces, hyphens, dots, slashes — is dropped, so all the
 * spellings of one plate collapse to a single key.
 */
export function normalizeVehicleNo(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export type VehicleProblem = "EMPTY" | "TOO_SHORT" | "TOO_LONG" | "NO_DIGIT";

export function checkVehicleNo(normalized: string): VehicleProblem | null {
  if (normalized.length === 0) return "EMPTY";
  if (normalized.length < MIN_VEHICLE_LENGTH) return "TOO_SHORT";
  if (normalized.length > MAX_VEHICLE_LENGTH) return "TOO_LONG";
  // Every real plate carries a number. Requiring one rejects a cashier typing
  // a customer's name into the vehicle box, which is the common mis-entry.
  if (!/[0-9]/.test(normalized)) return "NO_DIGIT";
  return null;
}

export const VEHICLE_PROBLEM_MESSAGE: Record<VehicleProblem, string> = {
  EMPTY: "Enter a vehicle number.",
  TOO_SHORT: `A vehicle number needs at least ${MIN_VEHICLE_LENGTH} characters.`,
  TOO_LONG: `A vehicle number can be at most ${MAX_VEHICLE_LENGTH} characters.`,
  NO_DIGIT: "A vehicle number must contain at least one digit.",
};

/**
 * Display form: regroups the canonical string at each letter/digit boundary,
 * so "BA2KHA1234" reads back as "BA 2 KHA 1234" without having to store the
 * spacing the operator happened to type.
 */
export function formatVehicleNo(normalized: string): string {
  if (!normalized) return "";
  return normalized.replace(/([A-Z]+)(?=[0-9])|([0-9]+)(?=[A-Z])/g, "$1$2 ");
}

/** Parses a form field. Returns null for blank — a vehicle number is optional on a sale. */
export function parseVehicleInput(raw: FormDataEntryValue | null): string | null {
  if (raw === null) return null;
  const normalized = normalizeVehicleNo(String(raw));
  return normalized === "" ? null : normalized;
}
