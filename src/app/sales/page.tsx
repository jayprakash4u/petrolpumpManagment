import { Receipt as ReceiptIcon, Calendar } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { getSalesPageData } from "@/lib/queries/sales";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SaleForm } from "@/components/sales/SaleForm";
import { fmtBSDate } from "@/lib/bs-date";

export default async function SalesPage() {
  const user = await requireUser();
  const data = await getSalesPageData(user.stationId);
  const todayBS = fmtBSDate(new Date());

  return (
    <div className="mx-auto max-w-220">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionTitle icon={ReceiptIcon} title="New Sale" subtitle="Billed at the current pump rate" />
          <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-text-muted">
            <Calendar size={13} className="text-accent" />
            Invoice Date: <strong className="text-text">{todayBS}</strong>
          </div>
        </div>
        <SaleForm tanks={data.tanks} customers={data.customers} canSell={can(user.role, "recordSale")} />
      </Card>
    </div>
  );
}
