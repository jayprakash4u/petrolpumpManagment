import { requireUser } from "@/lib/dal";
import { can, type Role } from "@/lib/permissions";
import { getSalesReturnsPageData } from "@/lib/queries/sales";
import { ProcessSalesReturnView } from "@/components/sales/ProcessSalesReturnView";

export default async function SalesReturnProcessPage() {
  const user = await requireUser();
  const canVoid = can(user.role as Role, "voidSale");
  const data = await getSalesReturnsPageData(user.stationId);

  return (
    <div>
      <ProcessSalesReturnView initialData={data} canVoid={canVoid} />
    </div>
  );
}
