import { CalendarDays } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AccountSubnav } from "@/components/accounts/AccountSubnav";
import { DayBookView } from "@/components/accounts/DayBookView";

export default async function DayBookPage() {
  await requireUser();

  return (
    <div>
      <AccountSubnav />

      <Card>
        <SectionTitle
          icon={CalendarDays}
          title="Daily Cash & General Day Book (दैनिक खाता)"
          subtitle="All transactions for a single day in one view: sales, receipts, payments, and contra"
        />
        <DayBookView />
      </Card>
    </div>
  );
}
