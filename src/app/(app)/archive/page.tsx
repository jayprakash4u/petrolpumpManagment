import { requireUser } from "@/lib/dal";
import { LogArchiveView } from "@/components/system/LogArchiveView";

export default async function ArchivePage() {
  await requireUser();
  return <LogArchiveView />;
}
