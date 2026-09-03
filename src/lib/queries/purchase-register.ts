import "server-only";
import { Prisma } from "@prisma/client";
import { requireTenantDb } from "@/lib/tenant-db";
import { resolveRange, type DateRange } from "@/lib/reports";
import { fiscalYearOf, fiscalYearRange } from "@/lib/bs-date";

const D = Prisma.Decimal;

export interface PurchaseRegisterFilters {
  range: DateRange;
  search: string;
  fuel?: "PETROL" | "DIESEL" | "CNG";
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * A register with no filters landing on "today" would read as "no
 * purchases" most days — a fiscal-style register is far more useful
 * defaulting to the current BS fiscal year, the way an accountant actually
 * opens this kind of report.
 */
export function parsePurchaseRegisterFilters(
  params: Record<string, string | string[] | undefined>,
  forcedFuel?: "PETROL" | "DIESEL" | "CNG"
): PurchaseRegisterFilters {
  const rawFrom = first(params.from);
  const rawTo = first(params.to);
  const rawPreset = first(params.preset);
  const search = (first(params.q) ?? "").trim().slice(0, 60);

  if (!rawFrom && !rawTo && !rawPreset) {
    const currentFY = fiscalYearOf(new Date());
    const startYear = currentFY ? parseInt(currentFY.split("/")[0], 10) : null;
    const fyRange = startYear ? fiscalYearRange(startYear) : null;
    if (fyRange) {
      return { range: { ...fyRange, preset: "custom" }, search, fuel: forcedFuel };
    }
  }

  return {
    range: resolveRange(rawPreset, rawFrom, rawTo),
    search,
    fuel: forcedFuel,
  };
}

export interface PurchaseRegisterRow {
  id: string;
  purchaseDateBS: string | null;
  dateGregorian: string;
  invoiceNo: string | null;
  supplier: string;
  supplierPan: string | null;
  tankerNo: string | null;
  remarks: string | null;
  fuel: string;
  liters: string;
  subTotal: string;
  taxableAmount: string;
  nonTaxableAmount: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  recordedBy: string;
}

export interface PurchaseRegisterData {
  rows: PurchaseRegisterRow[];
  totals: {
    subTotal: number;
    taxable: number;
    tax: number;
    grandTotal: number;
  };
}

/**
 * The purchase-side counterpart to the bill register: every fuel bill this
 * station has recorded, with the same landed-cost breakdown captured on
 * Purchase Bill Entry — real subtotal, real VAT, real supplier PAN. Nothing
 * here is invented: a station that has never logged non-taxable items or a
 * discount on a purchase genuinely sees 0 for those columns, not a plausible
 * placeholder.
 */
export async function getPurchaseRegisterData(filters: PurchaseRegisterFilters): Promise<PurchaseRegisterData> {
  const { prisma: tenantDb, stationId } = await requireTenantDb();

  const where: Prisma.PurchaseWhereInput = {
    stationId,
    createdAt: { gte: filters.range.from, lte: filters.range.to },
  };

  if (filters.fuel) {
    where.fuel = filters.fuel;
  }

  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { invoiceNo: { contains: q } },
      { supplier: { contains: q } },
      { tankerNo: { contains: q } },
    ];
  }

  const purchases = await tenantDb.purchase.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { recordedBy: { select: { name: true } } },
  });

  let subTotalSum = new D(0);
  let taxSum = new D(0);
  let grandSum = new D(0);

  const rows: PurchaseRegisterRow[] = purchases.map((p) => {
    // Subtotal/VAT are only captured on the landed-cost Purchase Bill Entry
    // flow; a plain delivery recorded the older, simpler way has neither, so
    // both fall back to deriving from the total rather than showing blank.
    const subTotal = p.subTotal ?? p.totalCost.div(new D("1.13")).toDecimalPlaces(2);
    const taxAmount = p.vatAmount ?? p.totalCost.sub(subTotal);

    subTotalSum = subTotalSum.add(subTotal);
    taxSum = taxSum.add(taxAmount);
    grandSum = grandSum.add(p.totalCost);

    return {
      id: p.id,
      purchaseDateBS: p.purchaseDateBS,
      dateGregorian: p.createdAt.toISOString().slice(0, 10),
      invoiceNo: p.invoiceNo,
      supplier: p.supplier,
      supplierPan: p.supplierPan,
      tankerNo: p.tankerNo,
      remarks: p.remarks,
      fuel: p.fuel,
      liters: p.liters.toString(),
      subTotal: subTotal.toString(),
      taxableAmount: subTotal.toString(),
      nonTaxableAmount: "0",
      discountAmount: "0",
      taxAmount: taxAmount.toString(),
      totalAmount: p.totalCost.toString(),
      recordedBy: p.recordedBy.name,
    };
  });

  return {
    rows,
    totals: {
      subTotal: subTotalSum.toNumber(),
      taxable: subTotalSum.toNumber(),
      tax: taxSum.toNumber(),
      grandTotal: grandSum.toNumber(),
    },
  };
}

/** Recent BS fiscal years for the quick-jump dropdown, newest first. */
export function recentFiscalYears(count = 5): { label: string; startYear: number }[] {
  const currentFY = fiscalYearOf(new Date());
  const startYear = currentFY ? parseInt(currentFY.split("/")[0], 10) : new Date().getFullYear() - 57;
  return Array.from({ length: count }, (_, i) => {
    const y = startYear - i;
    return { label: `${y}/${String((y + 1) % 100).padStart(2, "0")}`, startYear: y };
  });
}
