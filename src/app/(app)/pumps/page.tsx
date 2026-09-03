import { requireUser } from "@/lib/dal";
import { PumpStatusView } from "@/components/pumps/PumpStatusView";

export default async function PumpsPage() {
  await requireUser();

  return (
    <div>
      <PumpStatusView />
    </div>
  );
}
