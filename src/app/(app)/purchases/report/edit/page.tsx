import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { CombinedPurchaseReportView } from "@/components/purchases/CombinedPurchaseReportView";

export default async function EditPurchaseReportPage() {
  const user = await requireUser();

  if (!can(user.role, "recordPurchase")) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h2 className="font-display text-[17px] font-semibold text-text">Editing purchase bills is restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">Only an owner or manager can correct a recorded purchase bill.</p>
      </Card>
    );
  }

  const stationName = user.station?.name || "Nepal Petroleum Center";
  const stationAddress = user.station?.address || "Kathmandu, Nepal";
  const stationPan = (user.station as any)?.panNo || "300054891";

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <PurchaseSubnav />
      </div>

      <CombinedPurchaseReportView
        title="Edit Petrol/diesel Purchase Report"
        stationPan={stationPan}
        stationName={stationName}
        stationAddress={stationAddress}
      />
    </div>
  );
}

