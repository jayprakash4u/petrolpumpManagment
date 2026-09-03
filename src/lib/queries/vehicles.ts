import "server-only";
import { Prisma } from "@prisma/client";
import type { FuelType } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import type { BillFilters } from "@/lib/bill-filters";
import { fmtBSDate } from "@/lib/bs-date";

export interface VehicleFillDetail {
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
  soldBy: string;
  customerName: string | null;
}

export interface VehicleSummaryRow {
  vehicleNo: string;
  customerName: string | null;
  customerId: string | null;
  primaryFuel: FuelType;
  fillCount: number;
  totalLiters: number;
  totalAmount: number;
  avgLitersPerFill: number;
  lastFillBS: string;
  lastFillTime: string;
  lastSeenDate: Date;
  fills: VehicleFillDetail[];
}

export interface VehicleBillingData {
  vehicles: VehicleSummaryRow[];
  totals: {
    vehicleCount: number;
    totalAmount: number;
    totalLiters: number;
    unattributedCount: number;
    unattributedAmount: number;
    unattributedLiters: number;
  };
  customers: { id: string; name: string }[];
}

export async function getVehicleBillingData(
  stationId: string,
  filters: BillFilters
): Promise<VehicleBillingData> {
  const where: Prisma.SaleWhereInput = {
    stationId,
    createdAt: {
      gte: filters.range.from,
      lte: filters.range.to,
    },
    voided: false,
  };

  if (filters.fuel) {
    where.fuel = filters.fuel;
  }

  const [rawSales, customers] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 300,
      include: {
        customer: { select: { id: true, name: true } },
        soldBy: { select: { name: true } },
      },
    }),
    prisma.customer.findMany({
      where: { stationId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  let unattributedCount = 0;
  let unattributedAmount = 0;
  let unattributedLiters = 0;

  const vehicleMap = new Map<string, VehicleSummaryRow>();

  for (const s of rawSales) {
    const amount = Number(s.totalAmount);
    const liters = Number(s.liters);
    const rate = Number(s.ratePerL);
    const d = new Date(s.createdAt);

    if (!s.vehicleNo || !s.vehicleNo.trim()) {
      unattributedCount++;
      unattributedAmount += amount;
      unattributedLiters += liters;
      continue;
    }

    const plate = s.vehicleNo.trim().toUpperCase();
    const fillDetail: VehicleFillDetail = {
      id: s.id,
      receiptNo: s.receiptNo,
      billNumber: `SL-${s.receiptNo}`,
      dateBS: fmtBSDate(d),
      time: d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }),
      createdAt: s.createdAt.toISOString(),
      fuel: s.fuel as FuelType,
      liters,
      rate,
      amount,
      payment: s.paymentMethod,
      soldBy: s.soldBy.name,
      customerName: s.customer?.name ?? null,
    };

    if (!vehicleMap.has(plate)) {
      vehicleMap.set(plate, {
        vehicleNo: plate,
        customerName: s.customer?.name ?? null,
        customerId: s.customerId ?? null,
        primaryFuel: s.fuel as FuelType,
        fillCount: 1,
        totalLiters: liters,
        totalAmount: amount,
        avgLitersPerFill: liters,
        lastFillBS: fmtBSDate(d),
        lastFillTime: d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }),
        lastSeenDate: d,
        fills: [fillDetail],
      });
    } else {
      const existing = vehicleMap.get(plate)!;
      existing.fillCount += 1;
      existing.totalLiters += liters;
      existing.totalAmount += amount;
      existing.avgLitersPerFill = existing.totalLiters / existing.fillCount;
      existing.fills.push(fillDetail);
      if (!existing.customerName && s.customer?.name) {
        existing.customerName = s.customer.name;
        existing.customerId = s.customerId;
      }
    }
  }

  const vehicles = Array.from(vehicleMap.values());

  // Sort by total spend descending
  vehicles.sort((a, b) => b.totalAmount - a.totalAmount);

  const totalAmount = vehicles.reduce((sum, v) => sum + v.totalAmount, 0);
  const totalLiters = vehicles.reduce((sum, v) => sum + v.totalLiters, 0);

  return {
    vehicles,
    totals: {
      vehicleCount: vehicles.length,
      totalAmount,
      totalLiters,
      unattributedCount,
      unattributedAmount,
      unattributedLiters,
    },
    customers,
  };
}
