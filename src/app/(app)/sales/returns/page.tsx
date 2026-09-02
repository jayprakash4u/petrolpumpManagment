import { requireUser } from "@/lib/dal";
import { can, type Role } from "@/lib/permissions";
import { getSalesReturnsPageData } from "@/lib/queries/sales";
import { Card } from "@/components/ui/Card";
import { Lock } from "lucide-react";
import { SalesReturnsView } from "@/components/sales/SalesReturnsView";

export default async function SalesReturnsPage() {
  const user = await requireUser();

  const canVoid = can(user.role as Role, "voidSale");

  const data = await getSalesReturnsPageData(user.stationId);

  return (
    <div>
      <SalesReturnsView initialData={data} canVoid={canVoid} />
    </div>
  );
}
