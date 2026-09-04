import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { creditHeadroom, utilizationPct, isOverExtended } from "@/lib/credit";

const D = Prisma.Decimal;

/** One line of a customer's account history — a credit sale that added to the debt, or a payment that reduced it. */
export type LedgerEntry = {
  id: string;
  kind: "SALE" | "PAYMENT";
  at: Date;
  amount: Prisma.Decimal;
  detail: string;
  by: string;
  voided?: boolean;
};

export async function getCreditPageData(stationId: string, selectedId?: string) {
  const [customers, recentPayments] = await Promise.all([
    prisma.customer.findMany({
      where: { stationId },
      orderBy: [{ active: "desc" }, { dueAmount: "desc" }, { name: "asc" }],
    }),
    prisma.customerPayment.findMany({
      where: { customer: { stationId } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        amount: true,
        createdAt: true,
        customer: { select: { name: true } },
        recordedBy: { select: { name: true } },
      },
    }),
  ]);

  const rows = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    creditLimit: c.creditLimit,
    dueAmount: c.dueAmount,
    active: c.active,
    createdAt: c.createdAt,
    headroom: creditHeadroom(c.creditLimit, c.dueAmount),
    utilization: utilizationPct(c.dueAmount, c.creditLimit),
    overExtended: isOverExtended(c.dueAmount, c.creditLimit),
  }));

  // Resolve the selected account, falling back to whoever owes the most —
  // opening the page on an empty panel would waste the most useful click.
  const selected = rows.find((r) => r.id === selectedId) ?? rows.find((r) => r.dueAmount.gt(0)) ?? rows[0] ?? null;

  let ledger: LedgerEntry[] = [];
  if (selected) {
    const [sales, payments] = await Promise.all([
      prisma.sale.findMany({
        where: { customerId: selected.id },
        orderBy: { createdAt: "desc" },
        take: 25,
        select: {
          id: true,
          receiptNo: true,
          fuel: true,
          liters: true,
          totalAmount: true,
          createdAt: true,
          voided: true,
          soldBy: { select: { name: true } },
        },
      }),
      prisma.customerPayment.findMany({
        where: { customerId: selected.id },
        orderBy: { createdAt: "desc" },
        take: 25,
        select: { id: true, amount: true, createdAt: true, recordedBy: { select: { name: true } } },
      }),
    ]);

    // Merged into one chronological stream, because "what happened on this
    // account" is a single story — charges and payments interleaved.
    ledger = [
      ...sales.map(
        (s): LedgerEntry => ({
          id: s.id,
          kind: "SALE",
          at: s.createdAt,
          amount: s.totalAmount,
          detail: `Receipt #${s.receiptNo} · ${s.liters.toString()} L ${s.fuel.toLowerCase()}`,
          by: s.soldBy.name,
          voided: s.voided,
        })
      ),
      ...payments.map(
        (p): LedgerEntry => ({
          id: p.id,
          kind: "PAYMENT",
          at: p.createdAt,
          amount: p.amount,
          detail: "Payment received",
          by: p.recordedBy.name,
        })
      ),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 30);
  }

  const activeRows = rows.filter((r) => r.active);

  return {
    customers: rows,
    selected,
    ledger,
    recentPayments,
    totalOutstanding: activeRows.reduce((sum, r) => sum.add(r.dueAmount), new D(0)),
    totalExtended: activeRows.reduce((sum, r) => sum.add(r.creditLimit), new D(0)),
    owingCount: activeRows.filter((r) => r.dueAmount.gt(0)).length,
    overExtendedCount: activeRows.filter((r) => r.overExtended).length,
  };
}

export type CreditPageData = Awaited<ReturnType<typeof getCreditPageData>>;
export type CustomerRow = CreditPageData["customers"][number];

/* ------------------------------------------------------------------ *
 * Credit customers directory — the lighter list view behind
 * /customers/credit: every account with a credit line, its balance and
 * headroom, without the ledger/recent-payments work the full /credit
 * workstation page does for a single selected account.
 * ------------------------------------------------------------------ */

export async function getCreditCustomerDirectory(stationId: string) {
  const customers = await prisma.customer.findMany({
    where: { stationId, creditLimit: { gt: 0 } },
    orderBy: [{ active: "desc" }, { dueAmount: "desc" }, { name: "asc" }],
  });

  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    panNo: c.panNo,
    creditLimit: c.creditLimit,
    dueAmount: c.dueAmount,
    active: c.active,
    headroom: creditHeadroom(c.creditLimit, c.dueAmount),
    utilization: utilizationPct(c.dueAmount, c.creditLimit),
    overExtended: isOverExtended(c.dueAmount, c.creditLimit),
  }));
}

export type CreditCustomerDirectoryRow = Awaited<ReturnType<typeof getCreditCustomerDirectory>>[number];

/* ------------------------------------------------------------------ *
 * Non-credit customers — accounts kept for name/PAN/vehicle records and
 * bill history at the pump, but not extended credit. There's no separate
 * flag for this: it's simply a Customer whose creditLimit is zero, the
 * same rule the Credit page and createCustomerAction already use.
 * ------------------------------------------------------------------ */

export async function getNonCreditCustomers(stationId: string) {
  const customers = await prisma.customer.findMany({
    where: { stationId, creditLimit: { lte: 0 } },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
  if (customers.length === 0) return [];

  const stats = await prisma.sale.groupBy({
    by: ["customerId"],
    where: { customerId: { in: customers.map((c) => c.id) }, voided: false },
    _sum: { totalAmount: true },
    _max: { createdAt: true },
    _count: true,
  });
  const statsByCustomer = new Map(stats.map((s) => [s.customerId as string, s]));

  return customers.map((c) => {
    const s = statsByCustomer.get(c.id);
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      panNo: c.panNo,
      email: c.email,
      address: c.address,
      active: c.active,
      createdAt: c.createdAt,
      billCount: s?._count ?? 0,
      totalSpend: s?._sum.totalAmount ?? new D(0),
      lastVisit: s?._max.createdAt ?? null,
    };
  });
}

export type NonCreditCustomerRow = Awaited<ReturnType<typeof getNonCreditCustomers>>[number];

/* ------------------------------------------------------------------ *
 * Parties above a purchase threshold — customers whose billed volume
 * (credit or cash) within a date window clears a Rs figure, for targeted
 * collection/relationship review. "Total purchase" here means what the
 * customer has bought from the station, computed straight from the Sale
 * ledger for the window — not a stored running total that could drift.
 * ------------------------------------------------------------------ */

export interface PartyAboveThresholdRow {
  id: string;
  name: string;
  panNo: string | null;
  phone: string | null;
  address: string | null;
  active: boolean;
  totalPurchase: Prisma.Decimal;
}

export async function getPartiesAboveThreshold(
  stationId: string,
  range: { from: Date; to: Date },
  thresholdNpr = 100000
): Promise<PartyAboveThresholdRow[]> {
  const totals = await prisma.sale.groupBy({
    by: ["customerId"],
    where: {
      stationId,
      customerId: { not: null },
      voided: false,
      createdAt: { gte: range.from, lte: range.to },
    },
    _sum: { totalAmount: true },
  });

  const above = totals.filter((t) => t.customerId && (t._sum.totalAmount ?? new D(0)).gte(thresholdNpr));
  if (above.length === 0) return [];

  const customers = await prisma.customer.findMany({
    where: { id: { in: above.map((t) => t.customerId as string) }, stationId },
  });
  const byId = new Map(customers.map((c) => [c.id, c]));

  return above
    .map((t): PartyAboveThresholdRow | null => {
      const c = byId.get(t.customerId as string);
      if (!c) return null;
      return {
        id: c.id,
        name: c.name,
        panNo: c.panNo,
        phone: c.phone,
        address: c.address,
        active: c.active,
        totalPurchase: t._sum.totalAmount ?? new D(0),
      };
    })
    .filter((r): r is PartyAboveThresholdRow => r !== null)
    .sort((a, b) => b.totalPurchase.cmp(a.totalPurchase));
}

/* ------------------------------------------------------------------ *
 * Billed list — a printable, per-party sheet of credit bills issued in one
 * BS month, for the collection round: what was billed this month, what the
 * account still owes overall, and blank Receiver/Mobile/Signature/Remarks
 * columns for the handwritten acknowledgment. Only credit sales are billed
 * this way — a cash sale is settled at the pump and has nothing to sign for.
 * ------------------------------------------------------------------ */

export interface BilledListRow {
  customerId: string;
  name: string;
  /** The account's current outstanding balance — not scoped to the month, so it reflects what's actually owed today. */
  dueAmount: Prisma.Decimal;
  /** Receipt numbers billed to this party within the month, in order. */
  billNos: string;
  /** Sum of those bills' totals. */
  billAmount: Prisma.Decimal;
}

export interface BilledListData {
  station: { name: string; panNo: string | null; vatNo: string | null; address: string } | null;
  rows: BilledListRow[];
}

export async function getBilledListForMonth(stationId: string, range: { from: Date; to: Date }): Promise<BilledListData> {
  const [station, sales] = await Promise.all([
    prisma.station.findFirst({
      where: { id: stationId },
      select: { name: true, panNo: true, vatNo: true, address: true },
    }),
    prisma.sale.findMany({
      where: {
        stationId,
        customerId: { not: null },
        paymentMethod: "CREDIT",
        voided: false,
        createdAt: { gte: range.from, lte: range.to },
      },
      orderBy: { receiptNo: "asc" },
      select: {
        customerId: true,
        receiptNo: true,
        totalAmount: true,
        customer: { select: { name: true, dueAmount: true } },
      },
    }),
  ]);

  const byCustomer = new Map<string, { name: string; dueAmount: Prisma.Decimal; billNos: number[]; billAmount: Prisma.Decimal }>();
  for (const s of sales) {
    if (!s.customerId || !s.customer) continue;
    const existing = byCustomer.get(s.customerId);
    if (existing) {
      existing.billNos.push(s.receiptNo);
      existing.billAmount = existing.billAmount.add(s.totalAmount);
    } else {
      byCustomer.set(s.customerId, {
        name: s.customer.name,
        dueAmount: s.customer.dueAmount,
        billNos: [s.receiptNo],
        billAmount: s.totalAmount,
      });
    }
  }

  const rows: BilledListRow[] = Array.from(byCustomer.entries())
    .map(([customerId, v]) => ({
      customerId,
      name: v.name,
      dueAmount: v.dueAmount,
      billNos: v.billNos.sort((a, b) => a - b).join(", "),
      billAmount: v.billAmount,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { station, rows };
}

/* ------------------------------------------------------------------ *
 * Customer usage report — per-customer fuel consumption for a date
 * range: how much petrol/diesel/CNG each named account bought, and what
 * it cost, straight from the Sale ledger. Cash and credit sales both
 * count — this is about volume, not who's owed what.
 * ------------------------------------------------------------------ */

export interface CustomerUsageRow {
  customerId: string;
  name: string;
  petrolLiters: Prisma.Decimal;
  dieselLiters: Prisma.Decimal;
  cngLiters: Prisma.Decimal;
  totalVolume: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  billCount: number;
}

export async function getCustomerUsageReport(stationId: string, range: { from: Date; to: Date }): Promise<CustomerUsageRow[]> {
  const stats = await prisma.sale.groupBy({
    by: ["customerId", "fuel"],
    where: {
      stationId,
      customerId: { not: null },
      voided: false,
      createdAt: { gte: range.from, lte: range.to },
    },
    _sum: { liters: true, totalAmount: true },
    _count: true,
  });
  if (stats.length === 0) return [];

  const customerIds = Array.from(new Set(stats.map((s) => s.customerId as string)));
  const customers = await prisma.customer.findMany({ where: { id: { in: customerIds }, stationId } });
  const nameById = new Map(customers.map((c) => [c.id, c.name]));

  const byCustomer = new Map<string, CustomerUsageRow>();
  for (const s of stats) {
    const customerId = s.customerId;
    if (!customerId) continue;
    const name = nameById.get(customerId);
    if (!name) continue; // customer belongs to a different station, or was removed

    const row =
      byCustomer.get(customerId) ??
      ({
        customerId,
        name,
        petrolLiters: new D(0),
        dieselLiters: new D(0),
        cngLiters: new D(0),
        totalVolume: new D(0),
        totalAmount: new D(0),
        billCount: 0,
      } satisfies CustomerUsageRow);

    const liters = s._sum.liters ?? new D(0);
    if (s.fuel === "PETROL") row.petrolLiters = row.petrolLiters.add(liters);
    else if (s.fuel === "DIESEL") row.dieselLiters = row.dieselLiters.add(liters);
    else if (s.fuel === "CNG") row.cngLiters = row.cngLiters.add(liters);

    row.totalVolume = row.totalVolume.add(liters);
    row.totalAmount = row.totalAmount.add(s._sum.totalAmount ?? new D(0));
    row.billCount += s._count;

    byCustomer.set(customerId, row);
  }

  return Array.from(byCustomer.values()).sort((a, b) => b.totalAmount.cmp(a.totalAmount));
}
