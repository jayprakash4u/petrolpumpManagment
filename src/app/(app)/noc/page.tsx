import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { Lock } from "lucide-react";
import { NocPortalView } from "@/components/compliance/NocPortalView";

export default async function NocPage() {
  const user = await requireUser();

  if (!can(user.role, "recordPurchase")) {
    return (
      <Card className="mx-auto max-w-md text-center py-10">
        <div className="mb-3 flex justify-center text-text-muted">
          <Lock size={28} />
        </div>
        <h2 className="font-display text-[17px] font-semibold text-text">Access Restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          NOC indents and dealership portal access are restricted to owners and procurement managers.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <NocPortalView />
    </div>
  );
}
