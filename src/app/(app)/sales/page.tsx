import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { getSalesPageData } from "@/lib/queries/sales";
import { SaleForm } from "@/components/sales/SaleForm";
import { fmtBSDate } from "@/lib/bs-date";

export default async function SalesPage() {
  const user = await requireUser();
  const data = await getSalesPageData(user.stationId);
  const todayBS = fmtBSDate(new Date());

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <SaleForm
        tanks={data.tanks}
        customers={data.customers}
        canSell={can(user.role, "recordSale")}
        invoiceConfig={data.invoiceConfig}
        invoiceNumber={data.invoiceNumber}
        todayBS={todayBS}
      />
    </div>
  );
}
