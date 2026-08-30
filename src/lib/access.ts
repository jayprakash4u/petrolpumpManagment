import { PERMISSIONS, type Permission, type Role } from "@/lib/permissions";

export interface RoleInfo {
  role: Role;
  name: string;
  badgeTone: "accent" | "success" | "muted" | "error";
  summary: string;
  responsibilities: string[];
  staffCount: number;
}

export interface PermissionDefinition {
  key: Permission;
  name: string;
  category: "Sales & Cash" | "Pumps & Forecourt" | "Stock & Pricing" | "Expenses & Accounts" | "Operations & Admin";
  description: string;
  sidebarMenu: string;
}

export const STATION_ROLES: RoleInfo[] = [
  {
    role: "OWNER",
    name: "Station Admin / Owner",
    badgeTone: "accent",
    summary: "Complete 100% authority over station financials, dispenser rates, employee accounts, and system configuration.",
    responsibilities: [
      "Create, edit, and customize employee accounts and granular permissions",
      "Update fuel pricing and tank master configurations",
      "Review station revenue, profit & loss, VAT returns, and audit logs",
      "Authorize high-value expense vouchers and manage platform sync",
    ],
    staffCount: 1,
  },
  {
    role: "MANAGER",
    name: "Station Manager",
    badgeTone: "accent",
    summary: "Oversees daily forecourt operations, stock deliveries, dispenser pricing, credit customers, and shift logs.",
    responsibilities: [
      "Record tanker fuel deliveries and procurement invoices",
      "Monitor daily tank dip readings and nozzle meter reconciliations",
      "Manage corporate credit accounts and approve vehicle fills",
      "Review daily sales reports and attendant shift closures",
    ],
    staffCount: 1,
  },
  {
    role: "CASHIER",
    name: "Shift Cashier",
    badgeTone: "success",
    summary: "Handles cash counter, customer payments, credit ledger settlements, and sales register.",
    responsibilities: [
      "Process quick sales and print billing receipts",
      "Record credit customer payments and settlements",
      "Manage cash drawer and shift handover reconciliation",
      "Redeem customer fuel coupons",
    ],
    staffCount: 1,
  },
  {
    role: "ACCOUNTANT",
    name: "Station Accountant",
    badgeTone: "success",
    summary: "Manages financial ledgers, operational expenses, customer credit limits, and IRD/VAT reports.",
    responsibilities: [
      "Record and approve operational expense vouchers and petty cash",
      "Inspect sales journals, billing registers, and daily collections",
      "Generate monthly VAT returns and auditor confirmation schedules",
      "Export Excel and tax-compliant transaction reports",
    ],
    staffCount: 1,
  },
  {
    role: "ATTENDANT",
    name: "Pump Operator",
    badgeTone: "muted",
    summary: "Dispenses fuel at the nozzles, records walk-in transactions, and logs shift electronic totalizers.",
    responsibilities: [
      "Start and close assigned nozzle shift meter readings",
      "Dispense petrol, diesel, or CNG to vehicles",
      "Issue cash sale receipts to drivers and record odometer/vehicle plates",
    ],
    staffCount: 2,
  },
  {
    role: "OTHER",
    name: "Other Staff",
    badgeTone: "muted",
    summary: "Customizable starting profile for trainees, forecourt cleaners, or specialized personnel.",
    responsibilities: [
      "Operate assigned shifts or assist forecourt duties",
      "Customizable permissions assigned directly by Station Admin",
    ],
    staffCount: 0,
  },
];

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    key: "viewSales",
    name: "View Sales Register",
    category: "Sales & Cash",
    description: "Browse invoice list, sale return vouchers, and customer receipt logs.",
    sidebarMenu: "Sales → Sales Register / Bills",
  },
  {
    key: "recordSale",
    name: "Record Sales & Issue Bills",
    category: "Sales & Cash",
    description: "Dispense fuel at pumps, enter quick sales, and print customer tax receipts.",
    sidebarMenu: "Sales → Quick Sale / Billing",
  },
  {
    key: "processPayment",
    name: "Process Payments",
    category: "Sales & Cash",
    description: "Accept and settle cash, QR codes, and bank payments at point of sale.",
    sidebarMenu: "Sales → Cash Register",
  },
  {
    key: "voidSale",
    name: "Void / Cancel Bills",
    category: "Sales & Cash",
    description: "Void erroneously recorded sale bills or duplicate receipts after attendant mistake.",
    sidebarMenu: "Sales → Sale Returns / Voids",
  },
  {
    key: "recordCustomerPayment",
    name: "Collect Credit Payments",
    category: "Expenses & Accounts",
    description: "Receive cash, bank transfer, or QR payments against outstanding customer balances.",
    sidebarMenu: "Credit → Record Payment",
  },
  {
    key: "manageCustomers",
    name: "Manage Credit Customers",
    category: "Expenses & Accounts",
    description: "Register new credit clients, set monthly credit limits, and view customer ledger books.",
    sidebarMenu: "Credit → Customers / Accounts",
  },
  {
    key: "viewExpenses",
    name: "View Expenses",
    category: "Expenses & Accounts",
    description: "Inspect station expense entries, petty cash logs, and payment receipts.",
    sidebarMenu: "Finance → Expenses",
  },
  {
    key: "manageExpenses",
    name: "Manage Expenses",
    category: "Expenses & Accounts",
    description: "Create, edit, and approve operational expense vouchers.",
    sidebarMenu: "Finance → Expenses / Vouchers",
  },
  {
    key: "viewPumps",
    name: "View Live Forecourt & Pumps",
    category: "Pumps & Forecourt",
    description: "Monitor live dispenser bays, nozzle status, and fueling flow telemetry.",
    sidebarMenu: "Live Pumps → Pump Status",
  },
  {
    key: "recordMeterReadings",
    name: "Record Meter Readings",
    category: "Pumps & Forecourt",
    description: "Log dispenser opening/closing totalizers and physical tank dip levels.",
    sidebarMenu: "Live Pumps → Nozzle Meter",
  },
  {
    key: "managePumps",
    name: "Control Pumps & Bays",
    category: "Pumps & Forecourt",
    description: "Forecourt emergency stop, dispenser lockout, and nozzle limits.",
    sidebarMenu: "Live Pumps → Pump Control",
  },
  {
    key: "editFuelRate",
    name: "Change Fuel Rates",
    category: "Stock & Pricing",
    description: "Update official retail price per litre for Petrol, Diesel, and CNG tanks.",
    sidebarMenu: "Tanks & Stock → Fuel Rates",
  },
  {
    key: "recordPurchase",
    name: "Record Stock Purchases",
    category: "Stock & Pricing",
    description: "Log bulk tanker fuel deliveries from NOC and other supplier procurement invoices.",
    sidebarMenu: "Purchases → Fuel Purchases",
  },
  {
    key: "manageInventory",
    name: "Manage Inventory & Dips",
    category: "Stock & Pricing",
    description: "Calibrate tank dip charts, write-offs, and stock adjustments.",
    sidebarMenu: "Tanks & Stock → Stock Master",
  },
  {
    key: "manageOwnShift",
    name: "Manage Own Shift",
    category: "Operations & Admin",
    description: "Clock in and out of assigned nozzle dispenser shift with opening and closing meters.",
    sidebarMenu: "Employees → Shift Button",
  },
  {
    key: "manageOtherShifts",
    name: "Manage Attendant Shifts",
    category: "Operations & Admin",
    description: "Start or force-close other staff shifts during shift change or absence.",
    sidebarMenu: "Employees → Staff Roster",
  },
  {
    key: "viewReports",
    name: "View Financial & Stock Reports",
    category: "Operations & Admin",
    description: "Access station revenue analytics, fuel volume summaries, and periodic audit reports.",
    sidebarMenu: "Reports → Daily / Monthly / Stock",
  },
  {
    key: "exportReports",
    name: "Export Reports & IRD Schedules",
    category: "Operations & Admin",
    description: "Export Excel spreadsheets, VAT registers, and auditor confirmation packages.",
    sidebarMenu: "Reports → Tax / Export",
  },
  {
    key: "manageUsers",
    name: "Manage Employees & Custom Permissions",
    category: "Operations & Admin",
    description: "Create employee login accounts, change roles, deactivate staff, and customize permissions.",
    sidebarMenu: "People → User Management / Access",
  },
  {
    key: "manageStationSettings",
    name: "Manage Station Settings",
    category: "Operations & Admin",
    description: "Configure station profiles, billing receipt templates, and device connections.",
    sidebarMenu: "Settings → Station Profile",
  },
];

// Current matrix state (initialized from compile-time permissions)
let dynamicPermissions: Record<Permission, Role[]> = {
  viewSales: [...PERMISSIONS.viewSales],
  recordSale: [...PERMISSIONS.recordSale],
  processPayment: [...PERMISSIONS.processPayment],
  recordCustomerPayment: [...PERMISSIONS.recordCustomerPayment],
  voidSale: [...PERMISSIONS.voidSale],
  viewPumps: [...PERMISSIONS.viewPumps],
  recordMeterReadings: [...PERMISSIONS.recordMeterReadings],
  managePumps: [...PERMISSIONS.managePumps],
  manageOwnShift: [...PERMISSIONS.manageOwnShift],
  manageOtherShifts: [...PERMISSIONS.manageOtherShifts],
  manageInventory: [...PERMISSIONS.manageInventory],
  recordPurchase: [...PERMISSIONS.recordPurchase],
  editFuelRate: [...PERMISSIONS.editFuelRate],
  viewExpenses: [...PERMISSIONS.viewExpenses],
  manageExpenses: [...PERMISSIONS.manageExpenses],
  manageCustomers: [...PERMISSIONS.manageCustomers],
  viewReports: [...PERMISSIONS.viewReports],
  exportReports: [...PERMISSIONS.exportReports],
  manageUsers: [...PERMISSIONS.manageUsers],
  manageStationSettings: [...PERMISSIONS.manageStationSettings],
};

export function getPermissionsMatrix(): Record<Permission, Role[]> {
  return { ...dynamicPermissions };
}

export function updatePermissionRoles(
  permission: Permission,
  roles: Role[]
): { success: boolean; message: string } {
  // Safety rule: OWNER must always retain manageUsers to prevent total lockout
  if (permission === "manageUsers" && !roles.includes("OWNER")) {
    return {
      success: false,
      message: "Safety Guard: The Owner role must retain employee and user management permissions.",
    };
  }

  dynamicPermissions[permission] = [...roles];
  return {
    success: true,
    message: `Updated capabilities for "${PERMISSION_DEFINITIONS.find((p) => p.key === permission)?.name || permission}".`,
  };
}

export function resetPermissionsToDefault(): void {
  dynamicPermissions = {
    viewSales: [...PERMISSIONS.viewSales],
    recordSale: [...PERMISSIONS.recordSale],
    processPayment: [...PERMISSIONS.processPayment],
    recordCustomerPayment: [...PERMISSIONS.recordCustomerPayment],
    voidSale: [...PERMISSIONS.voidSale],
    viewPumps: [...PERMISSIONS.viewPumps],
    recordMeterReadings: [...PERMISSIONS.recordMeterReadings],
    managePumps: [...PERMISSIONS.managePumps],
    manageOwnShift: [...PERMISSIONS.manageOwnShift],
    manageOtherShifts: [...PERMISSIONS.manageOtherShifts],
    manageInventory: [...PERMISSIONS.manageInventory],
    recordPurchase: [...PERMISSIONS.recordPurchase],
    editFuelRate: [...PERMISSIONS.editFuelRate],
    viewExpenses: [...PERMISSIONS.viewExpenses],
    manageExpenses: [...PERMISSIONS.manageExpenses],
    manageCustomers: [...PERMISSIONS.manageCustomers],
    viewReports: [...PERMISSIONS.viewReports],
    exportReports: [...PERMISSIONS.exportReports],
    manageUsers: [...PERMISSIONS.manageUsers],
    manageStationSettings: [...PERMISSIONS.manageStationSettings],
  };
}

export function getRoleActivePermissions(role: Role): PermissionDefinition[] {
  const matrix = getPermissionsMatrix();
  return PERMISSION_DEFINITIONS.filter((def) => matrix[def.key]?.includes(role));
}
