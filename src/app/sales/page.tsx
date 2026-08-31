import { Receipt as ReceiptIcon, History, TrendingUp, Fuel, Hash } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { getSalesPageData } from "@/lib/queries/sales";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { SaleForm } from "@/components/sales/SaleForm";
import { RecentSalesTable } from "@/components/sales/RecentSalesTable";
import { fmtRs, fmtL } from "@/lib/money";

export default async function SalesPage() {
  const user = await requireUser();
  const data = await getSalesPageData(user.stationId);

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Today's Revenue" value={fmtRs(data.todayTotal)} icon={TrendingUp} tone="accent" />
        <StatCard label="Fuel Sold Today" value={fmtL(data.todayLiters)} icon={Fuel} tone="text" />
        <StatCard label="Sales Recorded" value={String(data.todayCount)} icon={Hash} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit">
          <SectionTitle icon={ReceiptIcon} title="New Sale" subtitle="Billed at the current pump rate" />
          <SaleForm tanks={data.tanks} customers={data.customers} canSell={can(user.role, "recordSale")} />
        </Card>

        <Card>
          <SectionTitle icon={History} title="Recent Sales" subtitle="Last 15 transactions at this station" />
          <RecentSalesTable
            sales={data.recentSales}
            canVoid={can(user.role, "voidSale")}
            customers={data.customers}
            stationName={data.stationName}
          />
        </Card>
      </div>
    </div>
  );
}
