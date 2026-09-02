import { Stamp } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ApprovalSubnav } from "@/components/approvals/ApprovalSubnav";
import { ApprovalQueueView } from "@/components/approvals/ApprovalQueueView";

export default async function ApprovalsPage() {
  const user = await requireUser();

  return (
    <div>
      <ApprovalSubnav />

      <Card>
        <SectionTitle
          icon={Stamp}
          title="Maker-Checker Approval Queue"
          subtitle="Review, verify, and release pending station financial, operational, and inventory transactions"
        />
        <ApprovalQueueView
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
