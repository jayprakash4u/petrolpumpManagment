import { SlidersHorizontal } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AccessSubnav } from "@/components/access/AccessSubnav";
import { PermissionsMatrixView } from "@/components/access/PermissionsMatrixView";

export default async function AccessPermissionsPage() {
  const user = await requireUser();

  return (
    <div>
      <AccessSubnav />

      <Card>
        <SectionTitle
          icon={SlidersHorizontal}
          title="Role Capabilities & Permissions Matrix"
          subtitle="Simple, visual control of which operations and sidebar menus are accessible to each role"
        />
        <PermissionsMatrixView currentUserRole={user.role} />
      </Card>
    </div>
  );
}
