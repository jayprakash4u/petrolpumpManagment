import { requireUser } from "@/lib/dal";
import { ActivityLogView } from "@/components/system/ActivityLogView";

export default async function ActivityPage() {
  await requireUser();
  return <ActivityLogView />;
}
