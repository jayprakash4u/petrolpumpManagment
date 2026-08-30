import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { Lock } from "lucide-react";
import { AuditorOverviewView } from "@/components/auditor/AuditorOverviewView";

export default async function AuditorOverviewPage() {
  const user = await requireUser();

  if (!can(user.role, "viewReports")) {
    return (
      <Card className="mx-auto max-w-md text-center py-10">
        <div className="mb-3 flex justify-center text-text-muted">
          <Lock size={28} />
        </div>
        <h2 className="font-display text-[17px] font-semibold text-text">Access Restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          External auditor reports are restricted to station owners and managers.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <AuditorOverviewView />
    </div>
  );
}
