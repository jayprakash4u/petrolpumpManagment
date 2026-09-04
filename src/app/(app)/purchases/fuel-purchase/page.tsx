import { ListOrdered, Fuel } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { FuelPurchasesTable } from "@/components/purchases/FuelPurchasesTable";
import { PurchaseBillEntryForm } from "@/components/purchases/PurchaseBillEntryForm";
import { getFuelPurchasesPageData } from "@/lib/queries/fuel-purchases";

/**
 * Same underlying form and delivery ledger as Purchase Bill Entry
 * (/purchases/fuel) — a distinct menu entry and title, not a second
 * implementation, so a delivery recorded from either page lands in the one
 * real Purchase table and neither can drift out of sync with the other.
 */
export default async function PetrolDieselPurchasePage() {
  await requireUser();
  const data = await getFuelPurchasesPageData();

  return (
    <div className="space-y-6">
      <PurchaseSubnav />

      <PurchaseBillEntryForm tanks={data.tankOptions} />

      <Card>
        <SectionTitle
          icon={ListOrdered}
          title="Delivery History"
          subtitle="Every tanker received, cost per litre and margin at today's rate"
        />
        <FuelPurchasesTable deliveries={data.deliveries} />
      </Card>
    </div>
  );
}

