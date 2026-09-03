import "server-only";
import { Prisma } from "@prisma/client";
import type { FuelType, PaymentMethod } from "@/lib/permissions";
import { requireTenantDb } from "@/lib/tenant-db";
import type { BillFilters } from "@/lib/bill-filters";
import { fmtBSDate } from "@/lib/bs-date";
import type { MergedStationInvoiceConfig } from "@/lib/invoice-settings";
import { creditHeadroom } from "@/lib/sale-math";

export interface SerializedBillItem {
  id: string;
  receiptNo: number;
  billNumber: string;
  dateBS: string;
  time: string;
  createdAt: string;
  fuel: FuelType;
  liters: number;
  rate: number;
  amount: number;
  payment: string;
  vehicleNo: string | null;
  customerId: string | null;
  customerName: string | null;
  soldBy: string;
  voided: boolean;
  voidReason: string | null;
  voidedAt: string | null;
}

export interface BillsPageTotals {
  totalCount: number;
  liveCount: number;
  voidedCount: number;
  netAmount: number;
  netLiters: number;
  voidedAmount: number;
  cashAmount: number;
  onlineAmount: number;
  creditAmount: number;
  cardAmount: number;
}

export interface BillsPageData {
  stationName: string;
  invoiceConfig?: MergedStationInvoiceConfig;
  bills: SerializedBillItem[];
  totals: BillsPageTotals;
  tanks?: { id: string; name: string; fuel: FuelType; ratePerL: number; levelL: number; capacityL: number }[];
  customers: {
    id: string;
    name: string;
    phone: string | null;
    panNo: string | null;
    email: string | null;
    address: string | null;
    headroom: string;
    dueAmount: string;
  }[];
}

export async function getBillsPageData(
  _stationId: string,
  filters: BillFilters
): Promise<BillsPageData> {
  const { prisma: tenantDb, stationId } = await requireTenantDb();

  const where: Prisma.SaleWhereInput = {
    stationId,
    createdAt: {
      gte: filters.range.from,
      lte: filters.range.to,
    },
  };

  if (filters.status === "active") {
    where.voided = false;
  } else if (filters.status === "voided") {
    where.voided = true;
  }

  if (filters.fuel) {
    where.fuel = filters.fuel;
  }

  if (filters.payment) {
    where.paymentMethod = filters.payment as PaymentMethod;
  }

  if (filters.vehicleNo) {
    where.vehicleNo = {
      contains: filters.vehicleNo,
    };
  }

  if (filters.search) {
    const q = filters.search.trim();
    const asNum = parseInt(q.replace(/\D/g, ""), 10);
    where.OR = [
      ...(Number.isFinite(asNum) && asNum > 0 ? [{ receiptNo: asNum }] : []),
      { vehicleNo: { contains: q } },
      { customer: { name: { contains: q } } },
      { soldBy: { name: { contains: q } } },
    ];
  }

  const [station, tanks, rawSales, customers] = await Promise.all([
    tenantDb.station.findFirst({ where: { id: stationId }, select: { name: true } }),
    tenantDb.tank.findMany({ where: { stationId }, orderBy: { fuel: "asc" } }),
    tenantDb.sale.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        customer: { select: { id: true, name: true } },
        soldBy: { select: { name: true } },
      },
    }),
    tenantDb.customer.findMany({
      where: { stationId, active: true },
      select: { id: true, name: true, phone: true, panNo: true, email: true, address: true, creditLimit: true, dueAmount: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const dbBills: SerializedBillItem[] = rawSales.map((s) => {
    const d = new Date(s.createdAt);
    return {
      id: s.id,
      receiptNo: s.receiptNo,
      billNumber: `SL-${s.receiptNo}`,
      dateBS: fmtBSDate(d),
      time: d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }),
      createdAt: s.createdAt.toISOString(),
      fuel: s.fuel as FuelType,
      liters: Number(s.liters),
      rate: Number(s.ratePerL),
      amount: Number(s.totalAmount),
      payment: s.paymentMethod as PaymentMethod,
      vehicleNo: s.vehicleNo ?? null,
      customerId: s.customerId ?? null,
      customerName: s.customer?.name ?? null,
      soldBy: s.soldBy.name,
      voided: s.voided,
      voidReason: s.voidReason ?? null,
      voidedAt: s.voidedAt ? s.voidedAt.toISOString() : null,
    };
  });

  const bills = dbBills;

  let liveCount = 0;
  let voidedCount = 0;
  let netAmount = 0;
  let netLiters = 0;
  let voidedAmount = 0;
  let cashAmount = 0;
  let onlineAmount = 0;
  let creditAmount = 0;
  let cardAmount = 0;

  for (const b of bills) {
    if (b.voided) {
      voidedCount++;
      voidedAmount += b.amount;
    } else {
      liveCount++;
      netAmount += b.amount;
      netLiters += b.liters;

      if (b.payment === "CASH") cashAmount += b.amount;
      else if (b.payment === "ONLINE") onlineAmount += b.amount;
      else if (b.payment === "CARD") cardAmount += b.amount;
      else if (b.payment === "CREDIT") creditAmount += b.amount;
    }
  }

  let rawStation: any = null;
  let rawInvoiceSettings: any = null;
  try {
    const sRows: any[] = await tenantDb.$queryRawUnsafe(
      `SELECT TOP 1 * FROM [dbo].[Station] WHERE [id] = '${stationId.replace(/'/g, "''")}'`
    );
    if (sRows && sRows.length > 0) rawStation = sRows[0];

    const iRows: any[] = await tenantDb.$queryRawUnsafe(
      `SELECT TOP 1 * FROM [dbo].[StationInvoiceSettings] WHERE [stationId] = '${stationId.replace(/'/g, "''")}'`
    );
    if (iRows && iRows.length > 0) rawInvoiceSettings = iRows[0];
  } catch {
    // Fallback
  }

  const { mergeInvoiceConfig } = await import("@/lib/invoice-settings");
  const invoiceConfig = mergeInvoiceConfig(rawStation, rawInvoiceSettings);

  return {
    stationName: station?.name ?? rawStation?.name ?? "Station",
    invoiceConfig,
    bills,
    totals: {
      totalCount: bills.length,
      liveCount,
      voidedCount,
      netAmount,
      netLiters,
      voidedAmount,
      cashAmount,
      onlineAmount,
      creditAmount,
      cardAmount,
    },
    tanks: tanks.map((t) => ({
      id: t.id,
      name: (t as any).name || t.fuel,
      fuel: t.fuel as FuelType,
      ratePerL: Number(t.ratePerL),
      levelL: Number(t.levelL),
      capacityL: Number(t.capacityL),
    })),
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone ?? null,
      panNo: c.panNo ?? null,
      email: c.email ?? null,
      address: c.address ?? null,
      headroom: creditHeadroom(c.creditLimit, c.dueAmount).toString(),
      dueAmount: c.dueAmount ? c.dueAmount.toString() : "0",
    })),
  };
}
