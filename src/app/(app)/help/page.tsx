import { requireUser } from "@/lib/dal";
import { HelpSupportView } from "@/components/system/HelpSupportView";

export default async function HelpPage() {
  await requireUser();
  return <HelpSupportView />;
}
