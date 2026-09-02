import { requireUser } from "@/lib/dal";
import { SiteSettingsView } from "@/components/system/SiteSettingsView";

export default async function SettingsPage() {
  await requireUser();
  return <SiteSettingsView />;
}
