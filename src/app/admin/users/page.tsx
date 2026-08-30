import { requirePlatformAdmin } from "@/lib/platform-dal";
import { PlatformUsersView } from "@/components/admin/PlatformUsersView";

export default async function PlatformUsersPage() {
  await requirePlatformAdmin();
  return <PlatformUsersView />;
}
