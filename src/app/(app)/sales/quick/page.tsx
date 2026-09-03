import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { getSalesPageData } from "@/lib/queries/sales";
import { Card } from "@/components/ui/Card";
import { QuickSaleForm } from "@/components/billing/QuickSaleForm";
import { fmtBSDate } from "@/lib/bs-date";

export default async function QuickSalePage() {
  const user = await requireUser();

  if (!can(user.role, "recordSale")) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h2 className="font-display text-[17px] font-semibold text-text">Quick Sale is restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">Your role doesn&apos;t include recording sales.</p>
      </Card>
    );
  }

  const data = await getSalesPageData(user.stationId);
  const todayBS = fmtBSDate(new Date());

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <QuickSaleForm
        tanks={data.tanks}
        customers={data.customers}
        invoiceConfig={data.invoiceConfig}
        invoiceNumber={data.invoiceNumber}
        todayBS={todayBS}
      />
    </div>
  );
}
