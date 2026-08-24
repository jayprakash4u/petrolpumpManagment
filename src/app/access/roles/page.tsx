import { KeyRound } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AccessSubnav } from "@/components/access/AccessSubnav";
import { RolesView } from "@/components/access/RolesView";

export default async function AccessRolesPage() {
  await requireUser();

  return (
    <div>
      <AccessSubnav />

      <Card>
        <SectionTitle
          icon={KeyRound}
          title="Station Roles & Responsibility Overview"
          subtitle="Defined access tiers and assigned operational scope for petrol pump staff"
        />
        <RolesView />
      </Card>
    </div>
  );
}
