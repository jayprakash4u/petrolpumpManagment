import { requireUser } from "@/lib/dal";
import { DataCorrectionsView } from "@/components/system/DataCorrectionsView";

export default async function DataCorrectionsPage() {
  await requireUser();
  return <DataCorrectionsView />;
}
