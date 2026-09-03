import { requirePlatformAdmin } from "@/lib/platform-dal";
import { SystemNotificationsView } from "@/components/admin/SystemNotificationsView";

export default async function AdminNotificationsPage() {
  await requirePlatformAdmin();
  return <SystemNotificationsView />;
}
