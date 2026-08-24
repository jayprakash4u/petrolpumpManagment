import {
  LayoutDashboard,
  Receipt as ReceiptIcon,
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
 * The whole product, grouped by what a person came to do.
 *
 * Unbuilt modules are listed and disabled rather than hidden: the shell then
 * reads as the finished system from day one, and nobody has to guess whether
 * a missing feature is coming. Every entry here is a real requirement for a
 * Nepali fuel station — several of them (IRD sync, VCTS, NOC) are legal or
 * supply-chain obligations rather than conveniences.
 *
 * Deliberately grouped rather than one flat list. A competitor ships 28
 * ungrouped top-level items including development leftovers ("Tables",
 * "Entry-D", "home/super_admin_dashboard"); that is a menu nobody can scan.
 */
export const NAV: NavSection[] = [
  {
    label: "Operations",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, enabled: true },
      {
        href: "/sales",
        label: "Billing",
        icon: ReceiptIcon,
        enabled: true,
        children: [
          { href: "/sales", label: "New Sale", icon: ReceiptIcon, enabled: true },
          {
            href: "/sales/quick",
            label: "Quick Sale",
            icon: Zap,
            enabled: true,
            soonNote: "Cash-only fast entry for a queue, no customer lookup",
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
            soonNote: "Bill against a vehicle number for fleet and VCTS records",
          },
          {
            href: "/sales/export",
            label: "Bill Export",
            icon: Download,
            enabled: true,
            permission: "viewReports",
            soonNote: "Bulk export of bills and returns for accounts or audit",
          },
        ],
      },
      { href: "/stock", label: "Tank & Stock", icon: Fuel, enabled: true },
      {
        href: "/meter",
        label: "Meter Report",
        icon: Gauge,
        enabled: true,
        // Their three items collapse the two *different* measurements into
        // near-identical labels ("Meter Reading Lists", "Physical Readings",
        // "Physical Reading Lists"). The distinction is the whole point of the
        // module and is named explicitly here.
        children: [
          {
            href: "/meter/nozzle",
            label: "Nozzle Readings",
            icon: Gauge,
            enabled: true,
            // What the dispenser totaliser says was pumped.
            soonNote: "Opening and closing totaliser per nozzle, per shift",
          },
          {
            href: "/meter/dip",
            label: "Tank Dip Readings",
            icon: Ruler,
            enabled: true,
            permission: "manageOtherShifts",
            // What is physically in the tank, measured by dipstick. NOT the
            // same number as the nozzle total, and the gap between them is
            // exactly what catches leakage, evaporation and theft — which is
            // why taking the dip is a supervisory job, not the attendant's.
            soonNote: "Physical dip measurement of what is actually in the tank",
          },
          {
            href: "/meter/reconciliation",
            label: "Shift Reconciliation",
            icon: ArrowRightLeft,
            enabled: true,
            permission: "viewReports",
            // The daily operational check, run by a manager at shift close.
            // Gated because it shows cash variance and shortfall — telling the
            // attendant being reconciled what the gap is, before their
            // supervisor has seen it, defeats the control.
            soonNote: "Nozzle delta vs dip vs sales vs cash — variance flagged at shift close",
          },
        ],
      },
      {
        href: "/purchases",
        label: "Purchase",
        icon: Truck,
        enabled: true,
        permission: "recordPurchase",
        children: [
          {
            href: "/purchases/suppliers",
            label: "Suppliers",
            icon: Contact,
            enabled: true,
            soonNote: "Supplier directory — add and edit in one place, not two menu items",
          },
          {
            href: "/purchases/fuel",
            label: "Fuel Purchases",
            icon: Truck,
            enabled: true,
            soonNote: "Full delivery ledger. Recording a delivery already works under Tank & Stock",
          },
          {
            href: "/purchases/items",
            label: "Other Items",
            icon: Package,
            enabled: true,
            soonNote: "Non-fuel stock: lubricants, spares, consumables",
          },
          {
            href: "/purchases/returns",
            label: "Purchase Returns",
            icon: Undo2,
            enabled: true,
            soonNote: "Returns to a supplier, including voided ones",
          },
          {
            href: "/purchases/expenses",
            label: "Expenses",
            icon: Wallet,
            enabled: true,
            soonNote: "Operating expenses against the day book",
          },
          {
            href: "/purchases/assets",
            label: "Fixed Assets",
            icon: Warehouse,
            enabled: true,
            soonNote: "Capital purchases: dispensers, tanks, vehicles",
          },
          {
            href: "/purchases/report",
            label: "Purchase Report",
            icon: FileBarChart2,
            enabled: true,
            permission: "viewReports",
            // One report with a fuel filter. A competitor ships five separate
            // menu items for this — "Diesel Purchase Report", "Petrol Purchase
            // Report", "Petrol / Diesel Purchase", "Petrol Diesel Purchase
            // Report", "Edit Petrol Diesel Purchase Report" — which is a page
            // built per fuel type instead of a parameter, and five places for
            // the same bug to hide.
            soonNote: "Purchases by supplier, fuel and period — one report, filterable",
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
        // A competitor spends 13 items here, including "All coupons" AND
        // "List Coupons", and "Used Sub Coupons" AND "Used Subcoupon" — the
        // same screen twice, differing only in pluralisation. Billed/unbilled
        // and active/used/cancelled are *filters* on one register, not pages.
        children: [
          {
            href: "/coupons/issue",
            label: "Issue Coupons",
            icon: BookMarked,
            enabled: true,
            // The real model: a book carries N tear-off sub-coupons, each
            // redeemable once. Issuing books rather than loose vouchers is what
            // makes them traceable, so the book is the unit here.
            soonNote: "Issue a coupon book with numbered sub-coupons to a customer",
          },
          {
            href: "/coupons/redeem",
            label: "Redeem Coupon",
            icon: TicketCheck,
            enabled: true,
            permission: "recordSale",
            soonNote: "Take a coupon at the pump — validates it is unused and not cancelled",
          },
          {
            href: "/coupons/register",
            label: "Coupon Register",
            icon: ListOrdered,
            enabled: true,
            soonNote: "Every coupon and sub-coupon, filtered by status and billed/unbilled",
          },
          {
            href: "/coupons/cancellations",
            label: "Cancellations",
            icon: TicketX,
            enabled: true,
            soonNote: "Cancel a book or a single sub-coupon, with reason and audit",
          },
        ],
      },
      {
        href: "/corporate",
        label: "Corporate Pay",
        icon: Building2,
        enabled: true,
        permission: "manageCustomers",
        soonNote: "Fleet accounts with vehicle-level limits",
        children: [
          {
            href: "/corporate/accounts",
            label: "Corporate Accounts",
            icon: Building2,
            enabled: true,
            soonNote: "Corporate client directory, credit limits and deposits",
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
        label: "User Management",
        icon: Users,
        // No permission on the parent on purpose: an attendant still needs the
        // roster and their own shift button, and only sees Employees inside.
        enabled: true,
        children: [
          { href: "/employees", label: "Employees", icon: Users, enabled: true },
          {
            href: "/approvals",
            label: "Approvals",
            icon: Stamp,
            enabled: true,
            permission: "manageUsers",
            soonNote: "Maker-checker workflow: request preparation, verification & release",
          },
        ],
      },
      {
        href: "/access",
        label: "Access Level Management",
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
        href: "/accounts",
        label: "Account",
        icon: Landmark,
        enabled: true,
        permission: "viewReports",
        children: [
          {
            href: "/accounts/ledgers",
            label: "Chart of Accounts",
            icon: BookOpen,
            enabled: true,
            soonNote: "Ledger heads — list and create in one screen",
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
            soonNote: "Cash↔bank and bank↔bank movements, with void",
          },
          {
            href: "/accounts/opening",
            label: "Opening Balances",
            icon: PiggyBank,
            enabled: true,
            soonNote: "Carry balances in when a station starts on the system mid-year",
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
            soonNote: "Every entry for one day, all types together — the daily cash book",
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
            soonNote: "Period P&L — real margin, unlike the cash-movement view on Reports",
          },
          {
            href: "/accounts/notes",
            label: "Credit & Debit Notes",
            icon: ScrollText,
            enabled: true,
            soonNote: "Notes issued and received, including against purchase returns",
          },
        ],
      },
    ],
  },
  {
    label: "Reports",
    items: [
      // "Management Reports", not plain "Reports": it sits beside statutory
      // registers (IRD) and audit packs, and the distinction is the point —
      // these are for running the business, those are for filing.
      {
        href: "/reports",
        label: "Management Reports",
        icon: BarChart3,
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
            soonNote: "बिक्री खाता — statutory VAT sales book",
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
            soonNote: "खरिद खाता — statutory VAT purchase book",
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
            soonNote: "The periodic return itself: output VAT, input VAT, net payable",
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
        enabled: false,
        permission: "viewReports",
        // Scoped as "the year-end pack an external auditor asks for":
        // read-only, fiscal-year bounded. Deliberately does NOT re-list the
        // statutory registers — a competitor repeats "IRD Sales", "IRD
        // Purchase" and "IRD Purchase Return" here even though they already
        // exist one menu above. Same document in two places is two things to
        // keep in step, and eventually two answers to one question.
        children: [
          {
            href: "/reports/auditor/debtors",
            label: "Debtor Ageing",
            icon: HandCoins,
            enabled: false,
            // Buildable on today's schema: Customer.dueAmount already exists,
            // this adds the 0-30/30-60/60-90/90+ buckets an auditor expects.
            soonNote: "Receivables by age bucket, per credit customer",
          },
          {
            href: "/reports/auditor/creditors",
            label: "Creditor Ageing",
            icon: Truck,
            enabled: false,
            // BLOCKED on a schema change, not on UI work. Purchase.supplier is
            // a bare String and nothing records what is still owed, so the app
            // currently cannot answer "what do we owe?" at all. Needs a real
            // Supplier model with a payable balance first — the mirror of what
            // Customer already has.
            soonNote: "Payables by age. Blocked: suppliers are a text field with no balance yet",
          },
          {
            href: "/reports/auditor/confirmations",
            label: "Balance Confirmations",
            icon: MailCheck,
            enabled: false,
            // Their "Balance Confirmation lists" + "Supplier Balance
            // Confirmation" are one screen with a party filter: the year-end
            // letters sent to debtors and creditors to agree balances.
            soonNote: "Year-end confirmation letters for debtors and creditors",
          },
          {
            href: "/reports/auditor/large-transactions",
            label: "Large Transactions",
            icon: AlertTriangle,
            enabled: false,
            // Their "Above 1 lakh". A real Nepali reporting threshold rather
            // than an arbitrary filter, so the limit belongs in configuration —
            // thresholds change by circular and hardcoding one guarantees a
            // silent compliance failure the year it moves.
            soonNote: "Transactions above the reporting threshold (Rs 1,00,000), threshold configurable",
          },
          {
            href: "/reports/auditor/vat-split",
            label: "Taxable vs Non-Taxable",
            icon: Percent,
            enabled: false,
            // Two of their items (sales and purchase) collapsed into one report
            // with a direction filter. Needs a VAT classification on each line,
            // which the schema does not carry yet either.
            soonNote: "VAT-exempt vs taxable split, both directions. Needs a VAT class per item",
          },
          {
            href: "/reports/auditor/fiscal-stock",
            label: "Fiscal Year Stock",
            icon: Boxes,
            enabled: false,
            soonNote: "Opening and closing stock per Nepali fiscal year, for year-end accounts",
          },
          {
            href: "/reports/auditor/reconciliation",
            label: "Bank Reconciliation",
            icon: ClipboardCheck,
            enabled: false,
            // Narrowed to the financial one on purpose: stock reconciliation
            // is a daily operational job and lives under Meter Report › Shift
            // Reconciliation. Two screens reconciling stock would eventually
            // disagree, and nobody would know which to believe.
            soonNote: "Book cash and bank vs statement, over a period",
          },
        ],
      },
      {
        href: "/activity",
        label: "Activity Log",
        icon: ScrollText,
        enabled: false,
        permission: "viewReports",
        soonNote: "Viewer over the audit trail we already record on every change",
      },
      {
        href: "/archive",
        label: "Log Archive",
        icon: Archive,
        enabled: false,
        permission: "viewReports",
        soonNote: "Retention and export of closed periods",
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
        enabled: false,
        permission: "viewReports",
        soonNote: "Real-time sales and credit-note push to the IRD CBMS",
      },
      {
        href: "/noc",
        label: "NOC",
        icon: Fuel,
        enabled: false,
        permission: "recordPurchase",
        soonNote: "Nepal Oil Corporation orders and allocations",
      },
      {
        href: "/vcts",
        label: "VCTS",
        icon: Ship,
        enabled: false,
        permission: "recordPurchase",
        soonNote: "Vehicle and consignment tracking for inbound tankers",
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        href: "/settings",
        label: "Site Settings",
        icon: Cog,
        enabled: false,
        permission: "manageUsers",
        soonNote: "Station name, logo, invoice header and print layout",
      },
      {
        href: "/settings/maintenance",
        label: "Maintenance Mode",
        icon: Wrench,
        enabled: false,
        permission: "manageUsers",
        // Deliberately NOT under User Management, where a competitor puts it —
        // freezing a station is a station setting, not a question about who may
        // sign in. The platform-operator equivalent already exists: suspending a
        // tenant from /admin, which also revokes every live session. This is the
        // owner's own version: a temporary freeze for a stock count or day close,
        // with no billing meaning.
        soonNote: "Freeze transactions for a stock count or day close (not a billing suspension)",
      },
      {
        href: "/settings/corrections",
        label: "Data Corrections",
        icon: FilePenLine,
        enabled: false,
        permission: "manageUsers",
        // "Change Data" elsewhere. Named honestly, because the implementation
        // must be an amendment with a reason and an audit entry — never an
        // in-place edit of a posted sale. Sales are immutable by design here
        // (void + reason); silently rewriting history would destroy exactly the
        // audit guarantees the rest of the app is built to provide.
        soonNote: "Amend a posted entry with a reason and an audit record — never a silent edit",
      },
      { href: "/profile", label: "Profile", icon: UserCog, enabled: false, soonNote: "Your own name and password" },
      { href: "/help", label: "Help", icon: LifeBuoy, enabled: false, soonNote: "Guides and support contact" },
    ],
  },
];

/** Flattened, for anything that needs to look an item up by href. */
export const NAV_ITEMS: NavItem[] = NAV.flatMap((section) =>
  section.items.flatMap((item) => [item, ...(item.children ?? [])])
);
