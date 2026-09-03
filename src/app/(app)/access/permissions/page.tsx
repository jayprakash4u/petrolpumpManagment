import { SlidersHorizontal } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AccessSubnav } from "@/components/access/AccessSubnav";
import { PermissionsMatrixView } from "@/components/access/PermissionsMatrixView";

export default async function AccessPermissionsPage() {
  await requireUser();

  return (
    <div>
      <AccessSubnav />

      <Card>
        <SectionTitle
          icon={SlidersHorizontal}
          title="Job Title Reference"
          subtitle="What each job title is traditionally responsible for — access itself is not restricted by role"
        />
        <PermissionsMatrixView />
      </Card>
    </div>
  );
}
