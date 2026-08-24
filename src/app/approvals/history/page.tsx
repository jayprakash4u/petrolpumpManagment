import { History } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ApprovalSubnav } from "@/components/approvals/ApprovalSubnav";
import { ApprovalHistoryView } from "@/components/approvals/ApprovalHistoryView";

export default async function ApprovalHistoryPage() {
  await requireUser();

  return (
    <div>
      <ApprovalSubnav />

      <Card className="mb-6">
        <SectionTitle
          icon={History}
          title="Approval Audit History & Register"
          subtitle="Historical record of all approved, rejected, and executed maker-checker requests"
        />
        <ApprovalHistoryView />
      </Card>
    </div>
  );
}
