import { Package, AlertTriangle, TrendingUp, IndianRupee } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { InventoryItemsTable } from "@/components/purchases/InventoryItemsTable";
import { MOCK_INVENTORY_ITEMS } from "@/lib/mock/purchases";
import { fmtRs } from "@/lib/money";

export default async function InventoryItemsPage() {
  await requireUser();

  const totalCostValue = MOCK_INVENTORY_ITEMS.reduce((sum, i) => sum + i.stockInHand * i.costPriceNpr, 0);
  const totalRetailValue = MOCK_INVENTORY_ITEMS.reduce((sum, i) => sum + i.stockInHand * i.sellingPriceNpr, 0);
  const totalUnits = MOCK_INVENTORY_ITEMS.reduce((sum, i) => sum + i.stockInHand, 0);
  const lowStockCount = MOCK_INVENTORY_ITEMS.filter((i) => i.stockInHand <= i.reorderLevel).length;

  return (
    <div>
      <PurchaseSubnav />

      {/* Summary KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Stock Value (Cost)" value={fmtRs(totalCostValue)} icon={IndianRupee} tone="accent" />
        <StatCard label="Retail Value (MRP)" value={fmtRs(totalRetailValue)} icon={TrendingUp} tone="text" />
        <StatCard label="Stock Units In Hand" value={`${totalUnits} Units`} icon={Package} tone="text" />
        <StatCard
          label="Low Stock Alert"
          value={`${lowStockCount} Items Low`}
          icon={AlertTriangle}
          tone={lowStockCount > 0 ? "accent" : "success"}
        />
      </div>

      <Card>
        <InventoryItemsTable items={MOCK_INVENTORY_ITEMS} />
      </Card>
    </div>
  );
}
