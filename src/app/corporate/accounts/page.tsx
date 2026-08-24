import { Building2, IndianRupee, ShieldCheck, Car } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { CorporateSubnav } from "@/components/corporate/CorporateSubnav";
import { CorporateAccountsTable } from "@/components/corporate/CorporateAccountsTable";
import { MOCK_CORPORATE_ACCOUNTS, MOCK_CORPORATE_TOTALS } from "@/lib/mock/corporate";
import { fmtRs } from "@/lib/money";

export default async function CorporateAccountsPage() {
  const user = await requireUser();

  if (!can(user.role, "manageCustomers")) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h2 className="font-display text-[17px] font-semibold text-text">Access Restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          Only owners and managers are authorized to manage corporate client credit accounts.
        </p>
      </Card>
    );
  }

  const totalCreditLines = MOCK_CORPORATE_ACCOUNTS.reduce((sum, a) => sum + a.monthlyCreditLimitNpr, 0);
  const totalDeposits = MOCK_CORPORATE_ACCOUNTS.reduce((sum, a) => sum + a.securityDepositNpr, 0);

  return (
    <div>
      <CorporateSubnav />

      {/* Summary KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Corporate Clients"
          value={`${MOCK_CORPORATE_ACCOUNTS.length} Clients`}
          icon={Building2}
          tone="text"
        />
        <StatCard
          label="Total Credit Lines"
          value={fmtRs(totalCreditLines)}
          icon={IndianRupee}
          tone="accent"
        />
        <StatCard
          label="Current Receivables"
          value={fmtRs(MOCK_CORPORATE_TOTALS.totalCorporateReceivablesNpr)}
          icon={IndianRupee}
          tone={MOCK_CORPORATE_TOTALS.totalCorporateReceivablesNpr > 0 ? "accent" : "success"}
        />
        <StatCard
          label="Security Deposits Held"
          value={fmtRs(totalDeposits)}
          icon={ShieldCheck}
          tone="success"
        />
      </div>

      <Card>
        <CorporateAccountsTable accounts={MOCK_CORPORATE_ACCOUNTS} />
      </Card>
    </div>
  );
}
