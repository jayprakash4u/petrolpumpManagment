import { FilePen } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { EditPurchaseRegisterView } from "@/components/purchases/EditPurchaseRegisterView";
import { getPurchaseRegisterData, parsePurchaseRegisterFilters } from "@/lib/queries/purchase-register";

export default async function EditPurchaseReportPage({ searchParams }: PageProps<"/purchases/report/edit">) {
  const user = await requireUser();

  if (!can(user.role, "recordPurchase")) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h2 className="font-display text-[17px] font-semibold text-text">Editing purchase bills is restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">Only an owner or manager can correct a recorded purchase bill.</p>
      </Card>
    );
  }

  const params = await searchParams;
  const filters = parsePurchaseRegisterFilters(params);
  const data = await getPurchaseRegisterData(filters);

  return (
    <div>
      <PurchaseSubnav />

      <Card>
        <SectionTitle
          icon={FilePen}
          title="Edit Petrol Diesel Purchase Report"
          subtitle="Correct the bill number, supplier, PAN, tanker, or remarks on a recorded purchase"
        />
        <EditPurchaseRegisterView data={data} />
      </Card>
    </div>
  );
}
