import { CalendarCheck } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HrSubnav } from "@/components/hr/HrSubnav";
import { AttendanceView } from "@/components/hr/AttendanceView";

export default async function AttendancePage() {
  const user = await requireUser();

  return (
    <div>
      <HrSubnav />

      <Card>
        <SectionTitle
          icon={CalendarCheck}
          title="Staff Attendance & Leave Ledger"
          subtitle="Daily shift check-in tracking, overtime logs, and leave management"
        />
        <AttendanceView
          currentUser={{
            id: user.id,
            name: user.name,
            role: user.role,
            username: user.username,
          }}
        />
      </Card>
    </div>
  );
}
