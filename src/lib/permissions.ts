import type { Role } from "@prisma/client";

/**
 * Single source of truth for role capabilities. UI code uses this to decide
 * what to render; every server action re-checks the same function against
 * the *server-verified* session role before touching data — the client is
 * never trusted (see the Server Actions guidance in Next.js's auth docs:
 * "treat Server Actions like public API endpoints").
 */
export const PERMISSIONS = {
  recordSale: ["OWNER", "MANAGER", "CASHIER", "ATTENDANT"],
  recordPurchase: ["OWNER", "MANAGER"],
  editFuelRate: ["OWNER", "MANAGER"],
  manageCustomers: ["OWNER", "MANAGER", "CASHIER"],
  recordCustomerPayment: ["OWNER", "MANAGER", "CASHIER"],
  viewReports: ["OWNER", "MANAGER"],
  manageOwnShift: ["OWNER", "MANAGER", "CASHIER", "ATTENDANT"],
  manageOtherShifts: ["OWNER", "MANAGER"],
  manageUsers: ["OWNER"],
  voidSale: ["OWNER", "MANAGER"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export class ForbiddenError extends Error {
  constructor(permission: string) {
    super(`Not authorized to perform: ${permission}`);
    this.name = "ForbiddenError";
  }
}

/** Throws (rather than returning a boolean) for use at the top of a Server Action, so a missing check fails loudly instead of silently no-op-ing. */
export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    throw new ForbiddenError(permission);
  }
}

export const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  CASHIER: "Cashier",
  ATTENDANT: "Attendant",
};
