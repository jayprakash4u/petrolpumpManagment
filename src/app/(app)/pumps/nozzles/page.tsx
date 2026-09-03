import { requireUser } from "@/lib/dal";
import { NozzleStatusView } from "@/components/pumps/NozzleStatusView";

export default async function NozzleStatusPage() {
  await requireUser();

  return (
    <div>
      <NozzleStatusView />
    </div>
  );
}
