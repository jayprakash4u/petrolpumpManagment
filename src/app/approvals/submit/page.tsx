import { PlusCircle } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ApprovalSubnav } from "@/components/approvals/ApprovalSubnav";
import { ApprovalSubmitForm } from "@/components/approvals/ApprovalSubmitForm";

export default async function ApprovalSubmitPage() {
  const user = await requireUser();

  return (
    <div>
      <ApprovalSubnav />

      <Card className="mb-6">
        <SectionTitle
          icon={PlusCircle}
          title="Submit New Approval Request"
          subtitle="Prepare a transaction voucher or operational request for authorized checker review & sign-off"
        />
        <ApprovalSubmitForm
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
