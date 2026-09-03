import { requirePlatformAdmin } from "@/lib/platform-dal";
import { PlatformSupportView } from "@/components/admin/PlatformSupportView";

export default async function AdminSupportPage() {
  await requirePlatformAdmin();
  return <PlatformSupportView />;
}
