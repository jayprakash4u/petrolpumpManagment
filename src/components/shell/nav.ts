import {
  LayoutDashboard,
  Receipt as ReceiptIcon,
  Printer,
  Fuel,
  Users,
  CreditCard,
  BarChart3,
  Gauge,
  Truck,
  Ticket,
  Building2,
  ShieldCheck,
  Landmark,
  FileCheck2,
  ScrollText,
  Archive,
  RefreshCw,
  Ship,
  Cog,
  UserCog,
  LifeBuoy,
  Zap,
  ListOrdered,
  Undo2,
  Car,
  Download,
  Contact,
  Package,
  Wallet,
  Warehouse,
  FileBarChart2,
  BookOpen,
  ArrowLeftRight,
  Scale,
  Banknote,
  FileText,
  PiggyBank,
  BookText,
  Calculator,
  NotebookPen,
  Coins,
  Stamp,
  Wrench,
  FilePenLine,
  KeyRound,
  SlidersHorizontal,
  FileSpreadsheet,
  Boxes,
  MailCheck,
  Percent,
  AlertTriangle,
  ClipboardCheck,
  HandCoins,
  TicketCheck,
  TicketX,
  Ruler,
  CalendarCheck,
  BookMarked,
  ArrowRightLeft,
  CalendarDays,
  Radio,
  Sliders,
  Clock,
  Activity,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Routes not yet built land here — shown, but not clickable, so the shell reads as the whole app from day one. */
  enabled: boolean;
  /**
   * Hides the item from roles that can't use the page at all. Purely
   * cosmetic — the page and every action behind it re-check the same
   * permission server-side, so hiding a link is never the control.
   */
  permission?: Permission;
  /** Shown on hover for an unbuilt item, so "SOON" isn't the whole story. */
  soonNote?: string;
  /**
   * Sub-pages of a module. A parent with children is a disclosure, not a
   * link — it expands rather than navigating, so there is never an ambiguous
   * "does clicking this go somewhere or open something?" moment.
   *
   * Only one level deep on purpose. Two levels of nesting in a sidebar is
   * where menus stop being scannable.
   */
  children?: NavItem[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * Station Operations & Management hierarchy, organized by operational priority:
 * 1. Operations (Forecourt, Live Pumps, Sales, Shifts, Meters, Tanks, Purchases)
 * 2. Customers (Credit, Coupons, Corporate Fleets)
 * 3. People (Staff, Users, Access Levels, HR)
 * 4. Finance (Payments, Billing, Chart of Accounts)
 * 5. Reports (Sales, Fuel, Shift, Stock, Management, IRD, Auditor)
 * 6. Compliance (IRD Sync, NOC, VCTS)
 * 7. System (Settings, Maintenance, Corrections, Profile)
 */
export const NAV: NavSection[] = [
  {
    label: "Operations",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, enabled: true },
      {
        href: "/pumps",
        label: "Live Pumps",
        icon: Fuel,
        enabled: true,
        children: [
          {
            href: "/pumps/status",
            label: "Pump Status",
            icon: Gauge,
            enabled: true,
            soonNote: "Real-time dispenser bays, flow telemetry and active fueling",
          },
          {
            href: "/pumps/nozzles",
            label: "Nozzle Status",
            icon: Radio,
            enabled: true,
            soonNote: "Live nozzle microswitch sensors and cumulative totalizers",
          },
          {
            href: "/pumps/control",
            label: "Pump Control",
            icon: Sliders,
            enabled: true,
            permission: "manageOtherShifts",
            soonNote: "Forecourt E-Stop, bay lockout, and preset limit commands",
          },
        ],
      },
      {
        href: "/sales",
        label: "Sales / Transactions",
        icon: ReceiptIcon,
        enabled: true,
        children: [
          { href: "/sales", label: "New Sale", icon: ReceiptIcon, enabled: true },
          {
            href: "/sales/quick",
            label: "Quick Sale",
            icon: Zap,
            enabled: true,
            soonNote: "Fast single-column entry for a queue at the pump",
          },
          {
            href: "/sales/bills",
            label: "List Bills",
            icon: ListOrdered,
            enabled: true,
            soonNote: "Searchable invoice register with filters and reprint",
          },
          {
            href: "/sales/returns",
            label: "Sales Returns",
            icon: Undo2,
            enabled: true,
            permission: "voidSale",
            soonNote: "Credit notes against an issued bill",
          },
          {
            href: "/sales/vehicle",
            label: "Vehicle-wise Billing",
            icon: Car,
            enabled: true,
            soonNote: "Bill against vehicle registration plate for fleets and VCTS",
          },
          {
            href: "/sales/export",
            label: "Bill Export",
            icon: Download,
            enabled: true,
            permission: "viewReports",
            soonNote: "Bulk export of invoices and returns for tax and audit",
          },
        ],
      },
      {
        href: "/employees",
        label: "Shift Management",
        icon: Clock,
        enabled: true,
        children: [
          { href: "/employees", label: "Shift Roster", icon: Users, enabled: true },
          {
            href: "/meter/reconciliation",
            label: "Shift Reconciliation",
            icon: ArrowRightLeft,
            enabled: true,
            permission: "viewReports",
            soonNote: "Attendant shift handover, nozzle delta vs cash variance",
          },
        ],
      },
      {
        href: "/meter",
        label: "Meter Readings",
        icon: Gauge,
        enabled: true,
        children: [
          {
            href: "/meter/nozzle",
            label: "Nozzle Readings",
            icon: Gauge,
            enabled: true,
            soonNote: "Opening and closing totaliser per nozzle, per shift",
          },
          {
            href: "/meter/dip",
            label: "Tank Dip Readings",
            icon: Ruler,
            enabled: true,
            permission: "manageOtherShifts",
            soonNote: "Physical dipstick measurement of underground tank fuel",
          },
          {
            href: "/meter/reconciliation",
            label: "Shift Reconciliation",
            icon: ArrowRightLeft,
            enabled: true,
            permission: "viewReports",
            soonNote: "Nozzle delta vs dip vs sales vs cash variance",
          },
        ],
      },
      { href: "/stock", label: "Tanks & Stock", icon: Boxes, enabled: true },
      {
        href: "/purchases",
        label: "Purchases",
        icon: Truck,
        enabled: true,
        permission: "recordPurchase",
        children: [
          {
            href: "/purchases/suppliers",
            label: "Suppliers",
            icon: Contact,
            enabled: true,
            soonNote: "Supplier directory (Nepal Oil Corp, Lubes, Spares)",
          },
          {
            href: "/purchases/fuel",
            label: "Fuel Purchases",
            icon: Truck,
            enabled: true,
            soonNote: "Inbound fuel tanker deliveries and decanting logs",
          },
          {
            href: "/purchases/items",
            label: "Other Items",
            icon: Package,
            enabled: true,
            soonNote: "Lubricants, spares, and consumable supplies",
          },
          {
            href: "/purchases/returns",
            label: "Purchase Returns",
            icon: Undo2,
            enabled: true,
            soonNote: "Debit notes and returns to suppliers",
          },
          {
            href: "/purchases/expenses",
            label: "Expenses",
            icon: Wallet,
            enabled: true,
            soonNote: "Station operating expenses and petty cash disbursements",
          },
          {
            href: "/purchases/assets",
            label: "Fixed Assets",
            icon: Warehouse,
            enabled: true,
            soonNote: "Capital equipment: pumps, generators, tanks, nozzles",
          },
          {
            href: "/purchases/report",
            label: "Purchase Report",
            icon: FileBarChart2,
            enabled: true,
            permission: "viewReports",
            soonNote: "Supplier-wise and product-wise procurement summary",
          },
        ],
      },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/credit", label: "Credit Customers", icon: CreditCard, enabled: true },
      {
        href: "/coupons",
        label: "Coupon Management",
        icon: Ticket,
        enabled: true,
        permission: "manageCustomers",
        children: [
          {
            href: "/coupons/issue",
            label: "Issue Coupons",
            icon: BookMarked,
            enabled: true,
            soonNote: "Issue coupon books with serial numbers to customers",
          },
          {
            href: "/coupons/redeem",
            label: "Redeem Coupon",
            icon: TicketCheck,
            enabled: true,
            permission: "recordSale",
            soonNote: "Verify and accept coupon vouchers at the dispenser",
          },
          {
            href: "/coupons/register",
            label: "Coupon Register",
            icon: ListOrdered,
            enabled: true,
            soonNote: "Audit log of all issued, redeemed, and cancelled coupons",
          },
          {
            href: "/coupons/cancellations",
            label: "Cancellations",
            icon: TicketX,
            enabled: true,
            soonNote: "Void or cancel unused coupon serials with audit reason",
          },
        ],
      },
      {
        href: "/corporate",
        label: "Corporate Accounts",
        icon: Building2,
        enabled: true,
        permission: "manageCustomers",
        soonNote: "Fleet accounts with vehicle-level quotas",
        children: [
          {
            href: "/corporate/accounts",
            label: "Corporate Accounts",
            icon: Building2,
            enabled: true,
            soonNote: "Institutional client directory, credit limits and deposits",
          },
          {
            href: "/corporate/vehicles",
            label: "Fleet Vehicles",
            icon: Car,
            enabled: true,
            soonNote: "Whitelisted vehicles, assigned drivers and fuel quotas",
          },
          {
            href: "/corporate/authorize",
            label: "Authorize Dispense",
            icon: Fuel,
            enabled: true,
            permission: "recordSale",
            soonNote: "Pump attendant authorization terminal and odometer logging",
          },
          {
            href: "/corporate/statements",
            label: "Billing Statements",
            icon: FileBarChart2,
            enabled: true,
            soonNote: "Monthly consolidated corporate statements and tax invoices",
          },
        ],
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        href: "/employees",
        label: "Staff & Attendants",
        icon: Users,
        enabled: true,
      },
      {
        href: "/approvals",
        label: "User Management",
        icon: Users,
        enabled: true,
        permission: "manageUsers",
        children: [
          { href: "/employees", label: "Employees", icon: Users, enabled: true },
          {
            href: "/employees/new",
            label: "Create Staff",
            icon: UserPlus,
            enabled: true,
            permission: "manageUsers",
            soonNote: "Add a member of staff and choose what they can access",
          },
          {
            href: "/approvals",
            label: "Approvals",
            icon: Stamp,
            enabled: true,
            permission: "manageUsers",
            soonNote: "Maker-checker workflow: request preparation & verification",
          },
        ],
      },
      {
        href: "/access",
        label: "Access Levels",
        icon: ShieldCheck,
        enabled: true,
        permission: "manageUsers",
        children: [
          {
            href: "/access/roles",
            label: "Roles",
            icon: KeyRound,
            enabled: true,
            soonNote: "Station role definitions and assigned capabilities",
          },
          {
            href: "/access/permissions",
            label: "Permissions",
            icon: SlidersHorizontal,
            enabled: true,
            soonNote: "Visual permissions matrix and capability controls",
          },
        ],
      },
      {
        href: "/hr",
        label: "HR & Payroll",
        icon: UserCog,
        enabled: true,
        permission: "manageUsers",
        children: [
          {
            href: "/hr/attendance",
            label: "Attendance & Leave",
            icon: CalendarCheck,
            enabled: true,
            soonNote: "Daily staff attendance and leave tracking",
          },
          {
            href: "/hr/payroll",
            label: "Payroll",
            icon: Wallet,
            enabled: true,
            soonNote: "Salary structures and monthly payroll generation",
          },
          {
            href: "/hr/salary-report",
            label: "Salary Report",
            icon: FileBarChart2,
            enabled: true,
            permission: "viewReports",
            soonNote: "Historical paid salaries, payslips and wage reports",
          },
        ],
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        href: "/accounts/payments",
        label: "Payments",
        icon: Banknote,
        enabled: true,
        permission: "viewReports",
      },
      {
        href: "/accounts/day-book",
        label: "Billing",
        icon: FileText,
        enabled: true,
        permission: "viewReports",
      },
      {
        href: "/accounts",
        label: "Accounts",
        icon: Landmark,
        enabled: true,
        permission: "viewReports",
        children: [
          {
            href: "/accounts/ledgers",
            label: "Chart of Accounts",
            icon: BookOpen,
            enabled: true,
            soonNote: "Ledger heads — standard chart of accounts",
          },
          {
            href: "/accounts/receipts",
            label: "Receipts",
            icon: Banknote,
            enabled: true,
            soonNote: "Money in, against a ledger head",
          },
          {
            href: "/accounts/payments",
            label: "Payment Vouchers",
            icon: FileText,
            enabled: true,
            soonNote: "Money out, against a ledger head",
          },
          {
            href: "/accounts/journal",
            label: "Journal Vouchers",
            icon: NotebookPen,
            enabled: true,
            soonNote: "Manual double-entry adjustments",
          },
          {
            href: "/accounts/contra",
            label: "Contra Entries",
            icon: ArrowLeftRight,
            enabled: true,
            soonNote: "Cash↔bank and bank↔bank movements",
          },
          {
            href: "/accounts/opening",
            label: "Opening Balances",
            icon: PiggyBank,
            enabled: true,
            soonNote: "Carry balances in when a station starts mid-year",
          },
          {
            href: "/accounts/cash-confirmation",
            label: "Cash & Deposit Confirmation",
            icon: Coins,
            enabled: true,
            soonNote: "Day-end: cash counted vs cash expected vs banked",
          },
          {
            href: "/accounts/day-book",
            label: "Day Book",
            icon: CalendarDays,
            enabled: true,
            soonNote: "Daily transaction log, all vouchers together",
          },
          {
            href: "/accounts/trial-balance",
            label: "Trial Balance",
            icon: Scale,
            enabled: true,
            soonNote: "Period trial balance across all ledger heads",
          },
          {
            href: "/accounts/profit-loss",
            label: "Profit & Loss",
            icon: Calculator,
            enabled: true,
            soonNote: "Period P&L — operational and fuel gross margins",
          },
          {
            href: "/accounts/notes",
            label: "Credit & Debit Notes",
            icon: ScrollText,
            enabled: true,
            soonNote: "Notes issued and received, including purchase returns",
          },
        ],
      },
    ],
  },
  {
    label: "Reports",
    items: [
      {
        href: "/reports",
        label: "Station Reports",
        icon: BarChart3,
        enabled: true,
        permission: "viewReports",
      },
      {
        href: "/meter/reconciliation",
        label: "Shift Reports",
        icon: Clock,
        enabled: true,
        permission: "viewReports",
      },
      {
        href: "/reports/ird/stock",
        label: "Stock Reports",
        icon: Boxes,
        enabled: true,
        permission: "viewReports",
      },
      {
        href: "/reports/ird",
        label: "IRD Reports",
        icon: FileCheck2,
        enabled: true,
        permission: "viewReports",
        children: [
          {
            href: "/reports/ird/sales",
            label: "Sales Register",
            icon: BookText,
            enabled: true,
            soonNote: "बिक्री खाता — statutory VAT sales book (अनुसूची ५)",
          },
          {
            href: "/reports/ird/sales-returns",
            label: "Sales Return Register",
            icon: Undo2,
            enabled: true,
            soonNote: "Credit notes issued, in IRD register format",
          },
          {
            href: "/reports/ird/purchase",
            label: "Purchase Register",
            icon: FileSpreadsheet,
            enabled: true,
            soonNote: "खरिद खाता — statutory VAT purchase book (अनुसूची ४)",
          },
          {
            href: "/reports/ird/purchase-returns",
            label: "Purchase Return Register",
            icon: Undo2,
            enabled: true,
            soonNote: "Debit notes raised against suppliers",
          },
          {
            href: "/reports/ird/vat-return",
            label: "VAT Return",
            icon: FileCheck2,
            enabled: true,
            soonNote: "The periodic return itself: output VAT, input VAT (अनुसूची १०)",
          },
          {
            href: "/reports/ird/monthly",
            label: "Monthly Sales Summary",
            icon: BarChart3,
            enabled: true,
            soonNote: "Per BS month sales aggregate",
          },
          {
            href: "/reports/ird/stock",
            label: "Quantitative Stock",
            icon: Boxes,
            enabled: true,
            soonNote: "मात्रात्मक विवरण — quantity in/out/closing, reconciled to tank stock",
          },
        ],
      },
      {
        href: "/reports/auditor",
        label: "Auditor Reports",
        icon: ScrollText,
        enabled: true,
        permission: "viewReports",
        children: [
          {
            href: "/reports/auditor/debtors",
            label: "Debtor Ageing",
            icon: HandCoins,
            enabled: true,
            soonNote: "Receivables by age bucket, per credit customer",
          },
          {
            href: "/reports/auditor/creditors",
            label: "Creditor Ageing",
            icon: Truck,
            enabled: true,
            soonNote: "Payables by age bucket, per supplier",
          },
          {
            href: "/reports/auditor/confirmations",
            label: "Balance Confirmations",
            icon: MailCheck,
            enabled: true,
            soonNote: "Year-end confirmation letters for debtors and creditors",
          },
          {
            href: "/reports/auditor/large-transactions",
            label: "Large Transactions",
            icon: AlertTriangle,
            enabled: true,
            soonNote: "Transactions above the reporting threshold (Rs 1,00,000), threshold configurable",
          },
          {
            href: "/reports/auditor/vat-split",
            label: "Taxable vs Non-Taxable",
            icon: Percent,
            enabled: true,
            soonNote: "VAT-exempt vs taxable split, both directions",
          },
          {
            href: "/reports/auditor/fiscal-stock",
            label: "Fiscal Year Stock",
            icon: Boxes,
            enabled: true,
            soonNote: "Opening and closing stock per Nepali fiscal year, for year-end accounts",
          },
          {
            href: "/reports/auditor/reconciliation",
            label: "Bank Reconciliation",
            icon: ClipboardCheck,
            enabled: true,
            soonNote: "Book cash and bank vs statement, over a period",
          },
        ],
      },
    ],
  },
  {
    label: "Compliance",
    items: [
      {
        href: "/ird",
        label: "IRD Sync",
        icon: RefreshCw,
        enabled: true,
        permission: "viewReports",
        soonNote: "Real-time sales and credit-note push to the IRD CBMS server",
      },
      {
        href: "/noc",
        label: "NOC",
        icon: Fuel,
        enabled: true,
        permission: "recordPurchase",
        soonNote: "Nepal Oil Corporation indent orders and quota allocations",
      },
      {
        href: "/vcts",
        label: "VCTS",
        icon: Ship,
        enabled: true,
        permission: "recordPurchase",
        soonNote: "Vehicle and Consignment Tracking System for inbound fuel tankers",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        href: "/settings/invoice",
        label: "Invoice & Logo Studio",
        icon: Printer,
        enabled: true,
        permission: "manageUsers",
        soonNote: "Upload station logo, configure tax invoice layout, field visibility, and thermal/A4 printing",
      },
      {
        href: "/settings",
        label: "Site Settings",
        icon: Cog,
        enabled: true,
        permission: "manageUsers",
        soonNote: "Station name, logo, invoice headers, and receipt print template",
      },
      {
        href: "/settings/maintenance",
        label: "Maintenance Mode",
        icon: Wrench,
        enabled: true,
        permission: "manageUsers",
        soonNote: "Temporary transaction freeze for dip audit or tank cleaning",
      },
      {
        href: "/settings/corrections",
        label: "Data Corrections",
        icon: FilePenLine,
        enabled: true,
        permission: "manageUsers",
        soonNote: "Amend posted entries with reason and immutable audit log",
      },
      {
        href: "/profile",
        label: "Profile",
        icon: UserCog,
        enabled: true,
        soonNote: "Your account credentials and display preferences",
      },
      {
        href: "/activity",
        label: "Activity Log",
        icon: ScrollText,
        enabled: true,
        permission: "viewReports",
        soonNote: "Immutable audit trail recorded on every station action",
      },
      {
        href: "/archive",
        label: "Log Archive",
        icon: Archive,
        enabled: true,
        permission: "viewReports",
        soonNote: "Retention and export of closed financial periods",
      },
      {
        href: "/help",
        label: "Help & Support",
        icon: LifeBuoy,
        enabled: true,
        soonNote: "Operating manual and technician support contact",
      },
    ],
  },
];

/** Flattened, for anything that needs to look an item up by href. */
export const NAV_ITEMS: NavItem[] = NAV.flatMap((section) =>
  section.items.flatMap((item) => [item, ...(item.children ?? [])])
);
