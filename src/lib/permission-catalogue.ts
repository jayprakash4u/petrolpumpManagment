import { PERMISSIONS, type Permission, type Role } from "@/lib/permissions";

/**
 * Human-facing description of every permission for the Station Admin staff-creation
 * and permission customization screens.
 */
export interface PermissionMeta {
  key: Permission;
  label: string;
  description: string;
  group: PermissionGroup;
  /**
   * Escalating permissions grant administrative control over users or station settings.
   */
  escalating?: boolean;
}

export type PermissionGroup =
  | "Sales & Billing"
  | "Pumps & Forecourt"
  | "Shifts"
  | "Stock & Purchasing"
  | "Expenses & Accounts"
  | "Reports & Analytics"
  | "Administration";

export const PERMISSION_GROUPS: PermissionGroup[] = [
  "Sales & Billing",
  "Pumps & Forecourt",
  "Shifts",
  "Stock & Purchasing",
  "Expenses & Accounts",
  "Reports & Analytics",
  "Administration",
];

export const PERMISSION_CATALOGUE: PermissionMeta[] = [
  // Sales & Billing
  {
    key: "viewSales",
    label: "View sales register",
    description: "Inspect customer invoices, quick sale bills, and receipt logs",
    group: "Sales & Billing",
  },
  {
    key: "recordSale",
    label: "Record sales",
    description: "Bill fuel at dispenser nozzles for walk-in and credit customers",
    group: "Sales & Billing",
  },
  {
    key: "processPayment",
    label: "Process payments",
    description: "Accept and settle cash, QR, and credit card payments",
    group: "Sales & Billing",
  },
  {
    key: "recordCustomerPayment",
    label: "Take credit payments",
    description: "Record payments received against outstanding customer ledger balance",
    group: "Sales & Billing",
  },
  {
    key: "voidSale",
    label: "Void a sale",
    description: "Reverse a bill — return fuel volume to tank and undo ledger charge",
    group: "Sales & Billing",
  },

  // Pumps & Forecourt
  {
    key: "viewPumps",
    label: "View assigned pumps",
    description: "Monitor live forecourt dispenser bays, telemetry, and nozzle status",
    group: "Pumps & Forecourt",
  },
  {
    key: "recordMeterReadings",
    label: "Record meter readings",
    description: "Log opening/closing electronic totalizer counters and tank dips",
    group: "Pumps & Forecourt",
  },
  {
    key: "managePumps",
    label: "Manage forecourt & pumps",
    description: "Forecourt emergency stop, dispenser lockout, and preset controls",
    group: "Pumps & Forecourt",
  },

  // Shifts
  {
    key: "manageOwnShift",
    label: "Manage own shift",
    description: "Clock on and off, start and close own shift counter",
    group: "Shifts",
  },
  {
    key: "manageOtherShifts",
    label: "Manage others' shifts",
    description: "Start, force-close, or reassign shifts for other pump attendants",
    group: "Shifts",
  },

  // Stock & Purchasing
  {
    key: "manageInventory",
    label: "Manage tank inventory",
    description: "Calibrate dip charts, stock write-offs, and tank master configuration",
    group: "Stock & Purchasing",
  },
  {
    key: "recordPurchase",
    label: "Record deliveries",
    description: "Book bulk tanker fuel received from suppliers against procurement invoices",
    group: "Stock & Purchasing",
  },
  {
    key: "editFuelRate",
    label: "Change pump rates",
    description: "Set retail selling price per litre for Petrol, Diesel, and CNG",
    group: "Stock & Purchasing",
  },

  // Expenses & Accounts
  {
    key: "viewExpenses",
    label: "View expenses",
    description: "Review station operational expense vouchers, ledgers, and petty cash",
    group: "Expenses & Accounts",
  },
  {
    key: "manageExpenses",
    label: "Manage expenses",
    description: "Create, edit, and authorize operational expense vouchers and payouts",
    group: "Expenses & Accounts",
  },
  {
    key: "manageCustomers",
    label: "Manage credit accounts",
    description: "Register credit clients, set credit limits, and inspect customer ledgers",
    group: "Expenses & Accounts",
  },

  // Reports & Analytics
  {
    key: "viewReports",
    label: "View financial reports",
    description: "Station revenue, margins, sales breakdown, and VAT returns",
    group: "Reports & Analytics",
  },
  {
    key: "exportReports",
    label: "Export reports",
    description: "Download Excel, PDF, and IRD/auditor tax summaries",
    group: "Reports & Analytics",
  },

  // Administration
  {
    key: "manageUsers",
    label: "Manage staff accounts",
    description: "Create employee logins, customize access permissions, deactivate staff",
    group: "Administration",
    escalating: true,
  },
  {
    key: "manageStationSettings",
    label: "Manage station settings",
    description: "Configure pump hardware parameters, receipt formats, and station details",
    group: "Administration",
    escalating: true,
  },
];

/** Every permission key, in catalogue order. */
export const ALL_PERMISSIONS: Permission[] = PERMISSION_CATALOGUE.map((p) => p.key);

export function permissionMeta(key: Permission): PermissionMeta {
  const found = PERMISSION_CATALOGUE.find((p) => p.key === key);
  if (!found) throw new Error(`No catalogue entry for permission: ${key}`);
  return found;
}

export function permissionsInGroup(group: PermissionGroup): PermissionMeta[] {
  return PERMISSION_CATALOGUE.filter((p) => p.group === group);
}

/**
 * The default permission set for a role — the template a Station Admin starts
 * from before customising for a specific staff member.
 */
export function defaultPermissionsFor(role: Role): Set<Permission> {
  const granted = new Set<Permission>();
  for (const [key, roles] of Object.entries(PERMISSIONS)) {
    if ((roles as readonly Role[]).includes(role)) granted.add(key as Permission);
  }
  return granted;
}

/**
 * An owner has 100% full access to their station always, and does not require checkboxes.
 */
export function isFullAccessRole(role: Role): boolean {
  return role === "OWNER";
}

/** Permissions a Station Admin may assign to staff accounts (excluding escalating owner-only perms). */
export function grantablePermissions(): PermissionMeta[] {
  return PERMISSION_CATALOGUE.filter((p) => !p.escalating);
}

/**
 * Calculates differences between the user's custom selection and the role's default template.
 */
export function diffFromTemplate(role: Role, selected: Set<Permission>) {
  const template = defaultPermissionsFor(role);
  const added: Permission[] = [];
  const removed: Permission[] = [];

  for (const key of ALL_PERMISSIONS) {
    const inTemplate = template.has(key);
    const isSelected = selected.has(key);
    if (isSelected && !inTemplate) added.push(key);
    if (!isSelected && inTemplate) removed.push(key);
  }

  return { added, removed, isCustomised: added.length > 0 || removed.length > 0 };
}
