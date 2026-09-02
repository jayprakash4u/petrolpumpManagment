import { FileBarChart2 } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HrSubnav } from "@/components/hr/HrSubnav";
import { SalaryReportView } from "@/components/hr/SalaryReportView";

export default async function SalaryReportPage() {
  const user = await requireUser();

  if (!can(user.role, "viewReports")) {
    return (
      <div>
        <HrSubnav />
        <Card className="mx-auto max-w-md text-center py-10">
          <h2 className="font-display text-[17px] font-semibold text-text">Salary Report is restricted</h2>
          <p className="mt-1.5 text-[13.5px] text-text-muted">
            Only the station owner or manager can view historical salary reports and staff payslips.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <HrSubnav />

      <Card>
        <SectionTitle
          icon={FileBarChart2}
          title="Staff Salary Audit Report & Payslips"
          subtitle="Monthly salary disbursement history, wage expense trends, and printable payslips"
        />
        <SalaryReportView />
      </Card>
    </div>
  );
}
