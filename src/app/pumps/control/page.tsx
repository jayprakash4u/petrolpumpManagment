import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { Lock } from "lucide-react";
import { PumpControlView } from "@/components/pumps/PumpControlView";

export default async function PumpControlPage() {
  const user = await requireUser();

  if (!can(user.role, "manageOtherShifts")) {
    return (
      <Card className="mx-auto max-w-md text-center py-10">
        <div className="mb-3 flex justify-center text-text-muted">
          <Lock size={28} />
        </div>
        <h2 className="font-display text-[17px] font-semibold text-text">Access Restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          Pump control commands and forecourt presets are restricted to supervisors and managers.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <PumpControlView />
    </div>
  );
}
