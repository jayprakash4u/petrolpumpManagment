import { ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ApprovalSubnav } from "@/components/approvals/ApprovalSubnav";
import { ApprovalRulesView } from "@/components/approvals/ApprovalRulesView";

export default async function ApprovalRulesPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-5xl">
      <ApprovalSubnav />

      <Card className="mb-6">
        <SectionTitle
          icon={ShieldAlert}
          title="Maker-Checker Governance Rules & Authority Matrix"
          subtitle="Configure separation of duties thresholds, dual sign-off requirements, and authorized checker roles"
        />
        <ApprovalRulesView
          currentUser={{
            id: user.id,
            name: user.name,
            role: user.role,
            username: user.username,
          }}
        />
      </Card>
    </div>
  );
}
