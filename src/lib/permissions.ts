/**
 * Fuel Station Manager — access model
 *
 * Two planes only:
 * - PLATFORM ADMIN plane: the software company, provisions and manages
 *   tenant stations (separate login, separate table — see platform-session.ts).
 * - STATION plane: one panel per station, "Pump Admin". There is no
 *   Owner/Manager/Cashier/Accountant/Attendant hierarchy — every staff login
 *   at a station has identical, full access to everything in that station's
 *   panel. `Role` is a single value for that reason; it exists as a type
 *   only because `User.role` is a plain string column shared with older
 *   data and audit-log entries, not because there is more than one role to
 *   choose between.
 */

export type Role = "OWNER";

export const Role = {
  OWNER: "OWNER",
} as const;

export const FuelType = {
  PETROL: "PETROL",
  DIESEL: "DIESEL",
  CNG: "CNG",
} as const;
export type FuelType = (typeof FuelType)[keyof typeof FuelType];

export const PaymentMethod = {
  CASH: "CASH",
  CREDIT: "CREDIT",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

/**
 * The set of capabilities the app has — used as the `Permission` type
 * threaded through `can()` call sites. Every key maps to `["OWNER"]`
 * because there is only one role; this exists so a permission name is
 * still a checked string literal at each call site, not because the list
 * of roles per capability means anything anymore.
 */
export const PERMISSIONS = {
  // Sales & Billing
  viewSales: ["OWNER"],
  recordSale: ["OWNER"],
  processPayment: ["OWNER"],
  recordCustomerPayment: ["OWNER"],
  voidSale: ["OWNER"],

  // Pumps & Forecourt
  viewPumps: ["OWNER"],
  recordMeterReadings: ["OWNER"],
  managePumps: ["OWNER"],

  // Shifts
  manageOwnShift: ["OWNER"],
  manageOtherShifts: ["OWNER"],

  // Stock & Pricing
  manageInventory: ["OWNER"],
  recordPurchase: ["OWNER"],
  editFuelRate: ["OWNER"],

  // Expenses & Accounts
  viewExpenses: ["OWNER"],
  manageExpenses: ["OWNER"],
  manageCustomers: ["OWNER"],

  // Reports & Auditing
  viewReports: ["OWNER"],
  exportReports: ["OWNER"],

  // Administration
  manageUsers: ["OWNER"],
  manageStationSettings: ["OWNER"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Every station login has full, identical access — there is no "Owner can,
 * Cashier can't" distinction at login time. `permission` is still threaded
 * through call sites (so a future reintroduction of granular access has
 * somewhere to plug back in) but it no longer gates anything.
 */
export function can(_role: Role | string, _permission: Permission): boolean {
  return true;
}

export interface UserPermissionContext {
  role: Role | string;
  permissions?: string[] | string | null;
}

/**
 * Every station login has full access — see `can` above. Per-user
 * `permissions` overrides are no longer read for gating.
 */
export function hasUserPermission(_user: UserPermissionContext, _permission: Permission): boolean {
  return true;
}

export class ForbiddenError extends Error {
  constructor(permission: string) {
    super(`Not authorized to perform: ${permission}`);
    this.name = "ForbiddenError";
  }
}

/** Throws for use at the top of a Server Action. */
export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    throw new ForbiddenError(permission);
  }
}

/**
 * Every value in the User.role column resolves to this one label. A
 * fallback ("Pump Admin") covers any historical row still holding an old
 * value (MANAGER, CASHIER, ...) from before roles were collapsed to one.
 */
export const ROLE_LABEL = new Proxy({ OWNER: "Pump Admin" } as Record<string, string>, {
  get: (target, prop: string) => target[prop] ?? "Pump Admin",
});
