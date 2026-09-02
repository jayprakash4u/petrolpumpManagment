import { Car, Fuel, ShieldCheck, AlertTriangle } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { CorporateSubnav } from "@/components/corporate/CorporateSubnav";
import { FleetVehiclesTable } from "@/components/corporate/FleetVehiclesTable";
import { MOCK_FLEET_VEHICLES, MOCK_CORPORATE_ACCOUNTS } from "@/lib/mock/corporate";

export default async function FleetVehiclesPage() {
  const user = await requireUser();

  if (!can(user.role, "manageCustomers")) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h2 className="font-display text-[17px] font-semibold text-text">Access Restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          Only owners and managers are authorized to register fleet vehicles and modify quotas.
        </p>
      </Card>
    );
  }

  const companiesList = MOCK_CORPORATE_ACCOUNTS.map((a) => ({ id: a.id, name: a.companyName }));
  const nearLimitCount = MOCK_FLEET_VEHICLES.filter(
    (v) => (v.currentMonthConsumedL / v.monthlyQuotaL) * 100 >= 85
  ).length;

  return (
    <div>
      <CorporateSubnav />

      {/* Summary KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Whitelisted Fleet Vehicles"
          value={`${MOCK_FLEET_VEHICLES.length} Units`}
          icon={Car}
          tone="text"
        />
        <StatCard
          label="Pump Security Status"
          value="100% Authorized"
          icon={ShieldCheck}
          tone="success"
        />
        <StatCard
          label="Quota Near Limit"
          value={`${nearLimitCount} Vehicles (>=85%)`}
          icon={AlertTriangle}
          tone={nearLimitCount > 0 ? "accent" : "success"}
        />
        <StatCard
          label="Fuel Types Covered"
          value="Diesel & Petrol"
          icon={Fuel}
          tone="text"
        />
      </div>

      <Card>
        <FleetVehiclesTable vehicles={MOCK_FLEET_VEHICLES} companies={companiesList} />
      </Card>
    </div>
  );
}
