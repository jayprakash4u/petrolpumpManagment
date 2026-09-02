import { Truck, Fuel, IndianRupee, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { requireTenantDb } from "@/lib/tenant-db";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { FuelPurchasesTable } from "@/components/purchases/FuelPurchasesTable";
import type { FuelPurchaseDelivery } from "@/lib/purchases";
import { MOCK_FUEL_PURCHASES } from "@/lib/mock/purchases";
import { fmtL, fmtRs } from "@/lib/money";

export default async function FuelPurchasesPage() {
  await requireUser();
  const { prisma: tenantDb, stationId } = await requireTenantDb();

  const purchases = await tenantDb.purchase.findMany({
    where: { stationId },
    orderBy: { createdAt: "desc" },
    include: {
      recordedBy: { select: { name: true } },
      tank: { select: { id: true, fuel: true } },
    },
  });

  const dbDeliveries: FuelPurchaseDelivery[] = purchases.map((p) => {
    const d = new Date(p.createdAt);
    const litersNum = Number(p.liters);
    const totalAmount = Number(p.totalCost);
    const ratePerL = litersNum > 0 ? totalAmount / litersNum : 0;
    return {
      id: p.id,
      dateBS: d.toISOString().slice(0, 10),
      time: d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }),
      invoiceNo: p.invoiceNo || `NOC-${p.id.slice(-5).toUpperCase()}`,
      challanNo: `CH-${p.id.slice(-6).toUpperCase()}`,
      tankerNo: "NOC Tanker",
      supplierId: "sup-noc",
      supplierName: p.supplier || "Nepal Oil Corporation (NOC)",
      depotLocation: "Depot Decantation",
      fuel: p.fuel as FuelPurchaseDelivery["fuel"],
      tankId: p.tankId,
      tankName:
        p.fuel === "PETROL"
          ? "Underground Tank 1 (Petrol)"
          : p.fuel === "DIESEL"
            ? "Underground Tank 2 (Diesel)"
            : "Bank 3 (CNG)",
      litresOrdered: litersNum,
      litresDelivered: litersNum,
      invoiceRatePerL: ratePerL,
      totalAmountNpr: totalAmount,
      vatAmountNpr: 0,
      densityObserved: 735.0,
      temperatureC: 24.0,
      recordedByName: p.recordedBy?.name ?? "Attendant",
      paymentStatus: "Paid",
    };
  });

  const deliveries = dbDeliveries.length > 0 ? dbDeliveries : MOCK_FUEL_PURCHASES;
  const totalLitres = deliveries.reduce((sum, f) => sum + f.litresDelivered, 0);
  const totalCost = deliveries.reduce((sum, f) => sum + f.totalAmountNpr, 0);

  return (
    <div>
      <PurchaseSubnav />

      {/* Summary KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Fuel Received" value={fmtL(totalLitres)} icon={Fuel} tone="text" />
        <StatCard label="Total Procurement Cost" value={fmtRs(totalCost)} icon={IndianRupee} tone="accent" />
        <StatCard label="Tanker Decantations" value={`${deliveries.length} Shipments`} icon={Truck} tone="text" />
        <StatCard label="Density & QA Checks" value="100% Passed" icon={ShieldCheck} tone="success" />
      </div>

      <Card>
        <FuelPurchasesTable deliveries={deliveries} />
      </Card>
    </div>
  );
}

