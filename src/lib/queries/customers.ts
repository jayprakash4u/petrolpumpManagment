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
