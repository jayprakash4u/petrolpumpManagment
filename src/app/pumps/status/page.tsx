import { requireUser } from "@/lib/dal";
import { PumpStatusView } from "@/components/pumps/PumpStatusView";

export default async function PumpStatusPage() {
  await requireUser();

  return (
    <div>
      <PumpStatusView />
    </div>
  );
}
