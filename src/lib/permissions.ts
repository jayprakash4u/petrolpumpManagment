/**
 * Fuel Station Manager — Role-Based Access Control (RBAC)
 *
 * Hierarchy:
 * - SUPER ADMIN (Platform plane): Provisions and manages tenant stations.
 * - STATION ADMIN (Owner): 100% access to all station functions. Does not require
 *   permission checkboxes as they possess complete station authority.
 * - STAFF ACCOUNTS (Manager, Cashier, Accountant, Pump Operator, Other Staff):
 *   - Role represents the job profile and starting default permission template.
 *   - Permissions represent the granular toggles customizable by the Station Admin.
 */

export type Role = "OWNER" | "MANAGER" | "CASHIER" | "ACCOUNTANT" | "ATTENDANT" | "OTHER";

export const Role = {
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  CASHIER: "CASHIER",
  ACCOUNTANT: "ACCOUNTANT",
  ATTENDANT: "ATTENDANT",
  OTHER: "OTHER",
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
 * Single source of truth for default role capabilities.
 */
export const PERMISSIONS = {
  // Sales & Billing
  viewSales: ["OWNER", "MANAGER", "CASHIER", "ACCOUNTANT"],
  recordSale: ["OWNER", "MANAGER", "CASHIER", "ATTENDANT"],
  processPayment: ["OWNER", "MANAGER", "CASHIER"],
  recordCustomerPayment: ["OWNER", "MANAGER", "CASHIER"],
  voidSale: ["OWNER", "MANAGER"],

  // Pumps & Forecourt
  viewPumps: ["OWNER", "MANAGER", "ATTENDANT"],
  recordMeterReadings: ["OWNER", "MANAGER", "ATTENDANT"],
  managePumps: ["OWNER", "MANAGER"],

  // Shifts
  manageOwnShift: ["OWNER", "MANAGER", "CASHIER", "ATTENDANT", "OTHER"],
  manageOtherShifts: ["OWNER", "MANAGER"],

  // Stock & Pricing
  manageInventory: ["OWNER", "MANAGER"],
  recordPurchase: ["OWNER", "MANAGER"],
  editFuelRate: ["OWNER", "MANAGER"],

  // Expenses & Accounts
  viewExpenses: ["OWNER", "MANAGER", "ACCOUNTANT"],
  manageExpenses: ["OWNER", "MANAGER", "ACCOUNTANT"],
  manageCustomers: ["OWNER", "MANAGER", "CASHIER", "ACCOUNTANT"],

  // Reports & Auditing
  viewReports: ["OWNER", "MANAGER", "ACCOUNTANT"],
  exportReports: ["OWNER", "MANAGER", "ACCOUNTANT"],

  // Administration
  manageUsers: ["OWNER"],
  manageStationSettings: ["OWNER", "MANAGER"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | string, permission: Permission): boolean {
  if (role === "OWNER") return true;
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

export interface UserPermissionContext {
  role: Role | string;
  permissions?: string[] | string | null;
}

/**
 * Checks permission for a specific user.
 * 1. Station Admin (OWNER) always has 100% full access.
 * 2. If the user has explicit customized permissions stored, those are evaluated.
 * 3. Otherwise, falls back to the default permissions for their Role.
 */
export function hasUserPermission(user: UserPermissionContext, permission: Permission): boolean {
  if (user.role === "OWNER") return true;

  if (user.permissions) {
    let list: string[] = [];
    if (typeof user.permissions === "string") {
      try {
        list = JSON.parse(user.permissions);
      } catch {
        list = [];
      }
    } else if (Array.isArray(user.permissions)) {
      list = user.permissions;
    }
    if (Array.isArray(list) && list.length > 0) {
      return list.includes(permission);
    }
  }

  return can(user.role as Role, permission);
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

export const ROLE_LABEL: Record<string, string> = {
  OWNER: "Station Admin",
  MANAGER: "Station Manager",
  CASHIER: "Shift Cashier",
  ACCOUNTANT: "Accountant",
  ATTENDANT: "Pump Operator",
  OTHER: "Other Staff",
};
