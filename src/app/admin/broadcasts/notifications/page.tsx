import { requirePlatformAdmin } from "@/lib/platform-dal";
import { SystemNotificationsView } from "@/components/admin/SystemNotificationsView";

export default async function SystemNotificationsPage() {
  await requirePlatformAdmin();
  return <SystemNotificationsView />;
}
