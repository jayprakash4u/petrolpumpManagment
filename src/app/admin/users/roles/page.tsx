import { requirePlatformAdmin } from "@/lib/platform-dal";
import { PlatformRolesView } from "@/components/admin/PlatformRolesView";

export default async function PlatformRolesPage() {
  await requirePlatformAdmin();
  return <PlatformRolesView />;
}
