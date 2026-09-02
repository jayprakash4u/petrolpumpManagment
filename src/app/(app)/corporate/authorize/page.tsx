import { Fuel, Info } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { CorporateSubnav } from "@/components/corporate/CorporateSubnav";
import { FleetAuthorizeTerminal } from "@/components/corporate/FleetAuthorizeTerminal";

export default async function FleetAuthorizePage() {
  const user = await requireUser();

  if (!can(user.role, "recordSale")) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h2 className="font-display text-[17px] font-semibold text-text">Access Restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          Your account role does not have authorization to dispense corporate fleet fuel.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <CorporateSubnav />

      {/* Notice Banner */}
      <div className="mx-auto mb-5 max-w-2xl flex items-start gap-2.5 rounded-xl border border-border bg-surface px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-xs leading-relaxed text-text-muted">
          Enter the vehicle registration plate before starting the dispenser pump. The system validates whether the
          vehicle is whitelisted, the corporate account is active, and the fuel request is within the vehicle’s daily volume limit.
        </p>
      </div>

      <FleetAuthorizeTerminal />
    </div>
  );
}
