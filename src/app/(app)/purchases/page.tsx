import Link from "next/link";
import {
  Truck,
  Contact,
  Package,
  Undo2,
  Wallet,
  Warehouse,
  FileBarChart2,
  TrendingUp,
  IndianRupee,
  ChevronRight,
  ShieldCheck,
  Building,
  AlertTriangle,
} from "lucide-react";
import { requireUser } from "@/lib/dal";
import { requireTenantDb } from "@/lib/tenant-db";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import {
  MOCK_PURCHASE_TOTALS,
  MOCK_SUPPLIERS,
  MOCK_FUEL_PURCHASES,
  MOCK_INVENTORY_ITEMS,
} from "@/lib/mock/purchases";
import { fmtRs, fmtL } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";

export default async function PurchaseOverviewPage() {
  await requireUser();
  const { prisma: tenantDb, stationId } = await requireTenantDb();

  const dbPurchases = await tenantDb.purchase.findMany({
    where: { stationId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      recordedBy: { select: { name: true } },
    },
  });

  const liveFuelPurchases =
    dbPurchases.length > 0
      ? dbPurchases.map((p) => {
          const d = new Date(p.createdAt);
          const liters = Number(p.liters);
          const totalCost = Number(p.totalCost);
          return {
            id: p.id,
            dateBS: d.toISOString().slice(0, 10),
            invoiceNo: p.invoiceNo || `NOC-${p.id.slice(-5).toUpperCase()}`,
            tankerNo: "NOC Tanker",
            tankName:
              p.fuel === "PETROL"
                ? "Underground Tank 1 (Petrol)"
                : p.fuel === "DIESEL"
                  ? "Underground Tank 2 (Diesel)"
                  : "Bank 3 (CNG)",
            litresDelivered: liters,
            totalAmountNpr: totalCost,
          };
        })
      : MOCK_FUEL_PURCHASES;

  const totalFuelProcurement = liveFuelPurchases.reduce(
    (sum, f) => sum + f.totalAmountNpr,
    0
  );

  const lowStockCount = MOCK_INVENTORY_ITEMS.filter((i) => i.stockInHand <= i.reorderLevel).length;

  return (
    <div>
      <PurchaseSubnav />

      {/* Summary KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Fuel Procurement (Month)"
          value={fmtRs(totalFuelProcurement)}
          icon={Truck}
          tone="accent"
        />
        <StatCard
          label="Lubricants & Spares Value"
          value={fmtRs(MOCK_PURCHASE_TOTALS.totalLubricantStockValueNpr)}
          icon={Package}
          tone="text"
        />
        <StatCard
          label="Operating Expenses"
          value={fmtRs(MOCK_PURCHASE_TOTALS.totalMonthlyExpensesNpr)}
          icon={Wallet}
          tone="text"
        />
        <StatCard
          label="Supplier Payables"
          value={fmtRs(MOCK_PURCHASE_TOTALS.pendingSupplierPayablesNpr)}
          icon={IndianRupee}
          tone={MOCK_PURCHASE_TOTALS.pendingSupplierPayablesNpr > 0 ? "accent" : "success"}
        />
      </div>

      {/* Sub-module Fast Action Navigation Grid */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/purchases/suppliers"
          className="group rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-accent/60 hover:bg-surface-hi"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-black">
              <Contact size={18} />
            </div>
            <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-text group-hover:text-accent">Suppliers Directory</h3>
          <p className="mt-1 text-xs text-text-muted">
            Manage NOC depot relationships, lubricant distributors, and equipment suppliers with PAN/VAT records.
          </p>
          <div className="mt-3 font-data text-[11px] font-semibold text-accent">
            {MOCK_SUPPLIERS.length} Active Vendors
          </div>
        </Link>

        <Link
          href="/purchases/fuel"
          className="group rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-accent/60 hover:bg-surface-hi"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-black">
              <Truck size={18} />
            </div>
            <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-text group-hover:text-accent">Purchase Bill Entry</h3>
          <p className="mt-1 text-xs text-text-muted">
            Tanker truck decantation ledger, NOC challan tracking, and density/temperature verification logs.
          </p>
          <div className="mt-3 font-data text-[11px] font-semibold text-success">
            {MOCK_FUEL_PURCHASES.length} Decantations Logged
          </div>
        </Link>

        <Link
          href="/purchases/items"
          className="group rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-accent/60 hover:bg-surface-hi"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-black">
              <Package size={18} />
            </div>
            <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-text group-hover:text-accent">Other Items (Lubricants)</h3>
          <p className="mt-1 text-xs text-text-muted">
            Non-fuel inventory: Castrol/Gulf 4T oils, coolants, brake fluids, and spares with profit margins.
          </p>
          <div className="mt-3 font-data text-[11px] font-semibold text-accent">
            {lowStockCount > 0 ? (
              <span className="text-error">{lowStockCount} Items Low Stock</span>
            ) : (
              "All Items Stocked"
            )}
          </div>
        </Link>

        <Link
          href="/purchases/returns"
          className="group rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-accent/60 hover:bg-surface-hi"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-black">
              <Undo2 size={18} />
            </div>
            <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-text group-hover:text-accent">Purchase Returns</h3>
          <p className="mt-1 text-xs text-text-muted">
            Issue formal debit notes for damaged packaging, seal leaks, or rejected off-spec deliveries.
          </p>
          <div className="mt-3 font-data text-[11px] font-semibold text-text-muted">
            Debit Notes & Adjustments
          </div>
        </Link>

        <Link
          href="/purchases/expenses"
          className="group rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-accent/60 hover:bg-surface-hi"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-black">
              <Wallet size={18} />
            </div>
            <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-text group-hover:text-accent">Station Expenses</h3>
          <p className="mt-1 text-xs text-text-muted">
            Day book petty cash disbursements, NEA power bills, generator diesel, and technician fees.
          </p>
          <div className="mt-3 font-data text-[11px] font-semibold text-text">
            {fmtRs(MOCK_PURCHASE_TOTALS.totalMonthlyExpensesNpr)} this month
          </div>
        </Link>

        <Link
          href="/purchases/assets"
          className="group rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-accent/60 hover:bg-surface-hi"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-black">
              <Warehouse size={18} />
            </div>
            <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-text group-hover:text-accent">Fixed Assets</h3>
          <p className="mt-1 text-xs text-text-muted">
            Station capital infrastructure: Tokheim MPDs, underground tanks, Kirloskar generator, and CCTV.
          </p>
          <div className="mt-3 font-data text-[11px] font-semibold text-success">
            All Capital Assets Active
          </div>
        </Link>
      </div>

      {/* Two columns: Recent Fuel Deliveries & Supplier Balances */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle
              icon={Truck}
              title="Recent Fuel Deliveries"
              subtitle="Latest bulk tanker decantations"
            />
            <Link href="/purchases/fuel" className="text-xs font-semibold text-accent hover:underline">
              View All →
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {liveFuelPurchases.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg border border-border bg-bg p-3">
                <div>
                  <div className="font-display text-[13.5px] font-semibold text-text">{f.tankName}</div>
                  <div className="font-data text-[11px] text-text-muted">
                    {f.invoiceNo} · <span className="font-semibold text-accent">{f.tankerNo}</span> · {f.dateBS}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-data text-[13px] font-bold text-text">{fmtL(f.litresDelivered)}</div>
                  <div className="font-data text-[11px] text-accent font-semibold">{fmtRs(f.totalAmountNpr)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle
              icon={Contact}
              title="Supplier Payables & Balances"
              subtitle="Vendor ledger status"
            />
            <Link href="/purchases/suppliers" className="text-xs font-semibold text-accent hover:underline">
              Suppliers Directory →
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {MOCK_SUPPLIERS.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-bg p-3">
                <div>
                  <div className="font-display text-[13.5px] font-semibold text-text">{s.name}</div>
                  <div className="text-[11px] text-text-muted">
                    {s.contactPerson} ({s.paymentTerms})
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-data text-[13px] font-bold">
                    {s.balanceDueNpr > 0 ? (
                      <span className="text-error">{fmtRs(s.balanceDueNpr)}</span>
                    ) : (
                      <span className="text-success">Paid</span>
                    )}
                  </div>
                  <div className="font-data text-[10.5px] text-text-muted">
                    Vol: {fmtRs(s.totalPurchasedNpr)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
