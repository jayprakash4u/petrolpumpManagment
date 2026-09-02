import { CreditCard, Banknote, Users, AlertTriangle, History, UserPlus, ReceiptText } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { getCreditPageData } from "@/lib/queries/customers";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { CustomerList, CustomerLedger, RecentPayments } from "@/components/credit/CustomerList";
import { PaymentForm } from "@/components/credit/PaymentForm";
import { AddCustomerForm } from "@/components/credit/CustomerAdmin";
import { fmtRs } from "@/lib/money";

export default async function CreditPage({ searchParams }: PageProps<"/credit">) {
  const user = await requireUser();

  const params = await searchParams;
  const raw = Array.isArray(params.customer) ? params.customer[0] : params.customer;

  const data = await getCreditPageData(user.stationId, raw);

  const canManage = can(user.role, "manageCustomers");
  const canRecordPayment = can(user.role, "recordCustomerPayment");
  const canEditLimit = can(user.role, "viewReports");

  return (
    <div>
      {data.overExtendedCount > 0 && (
        <div className="animate-fade-in mb-5 flex items-center gap-2 rounded-[10px] border border-error/30 bg-error/8 px-[15px] py-[11px]">
          <AlertTriangle size={16} className="shrink-0 text-error" />
          <span className="text-[13.5px] text-text">
            {data.overExtendedCount} {data.overExtendedCount === 1 ? "account is" : "accounts are"} at or over the credit
            limit — no further credit sales until they pay down.
          </span>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Outstanding" value={fmtRs(data.totalOutstanding)} icon={CreditCard} tone="accent" />
        <StatCard label="Credit Extended" value={fmtRs(data.totalExtended)} icon={Banknote} tone="text" />
        <StatCard label="Accounts Owing" value={String(data.owingCount)} icon={Users} tone="text" />
        <StatCard
          label="At Limit"
          value={String(data.overExtendedCount)}
          icon={AlertTriangle}
          tone={data.overExtendedCount > 0 ? "accent" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <Card>
            <SectionTitle icon={Users} title="Accounts" subtitle="Select an account to see its ledger and take payment" />
            <CustomerList
              customers={data.customers}
              selectedId={data.selected?.id}
              canEditLimit={canEditLimit}
              canManage={canManage}
            />
          </Card>

          {data.selected && (
            <Card>
              <SectionTitle
                icon={ReceiptText}
                title={`${data.selected.name} — Ledger`}
                subtitle="Credit sales and payments, newest first"
              />
              <CustomerLedger ledger={data.ledger} />
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {data.selected && (
            <Card className="h-fit">
              <SectionTitle icon={Banknote} title="Record Payment" subtitle={data.selected.name} />
              <PaymentForm
                customerId={data.selected.id}
                customerName={data.selected.name}
                dueAmount={data.selected.dueAmount.toString()}
                canRecord={canRecordPayment}
              />
            </Card>
          )}

          <Card className="h-fit">
            <SectionTitle icon={UserPlus} title="Add Customer" subtitle="Opens a credit account at this station" />
            <AddCustomerForm canAdd={canManage} />
          </Card>

          <Card className="h-fit">
            <SectionTitle icon={History} title="Recent Payments" subtitle="Across all accounts" />
            <RecentPayments payments={data.recentPayments} />
          </Card>
        </div>
      </div>
    </div>
  );
}
