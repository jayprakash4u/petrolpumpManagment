/**
 * TopBar title per section, keyed by the route prefix that owns it.
 *
 * This used to be a `title` prop hand-set in ~20 near-identical layout.tsx
 * files, one per top-level route — which meant every cross-section click
 * (Dashboard -> Sales -> Credit, ...) unmounted and remounted the whole
 * shell (Sidebar, TopBar) because each section had its own separate layout
 * instance, instead of the one shared layout React needs to keep the shell
 * mounted across navigations. Consolidating them into a single
 * `(app)/layout.tsx` fixed that, but the layout is one component with no
 * per-page title prop to set anymore — so the title is looked up here from
 * the pathname instead.
 */
export const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/sales": "Sales",
  "/credit": "Credit Customers",
  "/coupons": "Coupon Management",
  "/corporate": "Corporate Pay & Fleet Management",
  "/employees": "Employees",
  "/approvals": "User Management Approvals",
  "/access": "Access Level Management",
  "/hr": "HR & Payroll",
  "/accounts": "Finance & Accounts",
  "/reports": "Reports",
  "/purchases": "Purchase Management",
  "/stock": "Tank & Stock",
  "/meter": "Meter Report",
  "/settings": "System & Settings",
  "/profile": "Profile & Security",
  "/activity": "Activity Log",
  "/archive": "Log Archive",
  "/help": "Help & Support",
  "/pumps": "Live Pumps",
  "/ird": "IRD Sync",
  "/noc": "NOC",
  "/vcts": "VCTS",
};

/** Longest-prefix match, so `/sales/bills` still resolves to the `/sales` title. */
export function titleForPath(pathname: string): string {
  let best: string | null = null;
  for (const prefix of Object.keys(ROUTE_TITLES)) {
    if ((pathname === prefix || pathname.startsWith(prefix + "/")) && (!best || prefix.length > best.length)) {
      best = prefix;
    }
  }
  return best ? ROUTE_TITLES[best] : "Dashboard";
}
