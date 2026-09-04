import { requireUser } from "@/lib/dal";
import { todayBS, bsMonthRange } from "@/lib/bs-date";
import { getBilledListForMonth } from "@/lib/queries/customers";
import { CustomersSubnav } from "@/components/customers/CustomersSubnav";
import { BilledListView } from "@/components/customers/BilledListView";

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function BilledListPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[]; year?: string | string[] }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const today = todayBS(new Date()) ?? { year: 2082, month: 1, day: 1 };

  const rawMonth = parseInt(first(params.month) ?? "", 10);
  const rawYear = parseInt(first(params.year) ?? "", 10);
  const month = rawMonth >= 1 && rawMonth <= 12 ? rawMonth : today.month;
  const year = Number.isFinite(rawYear) && rawYear > 0 ? rawYear : today.year;

  const range = bsMonthRange(year, month) ?? bsMonthRange(today.year, today.month)!;
  const data = await getBilledListForMonth(user.stationId, range);

  const years = Array.from({ length: 6 }, (_, i) => today.year - i);
  if (!years.includes(year)) years.unshift(year);
  years.sort((a, b) => b - a);

  return (
    <div className="space-y-4 w-full min-w-0 animate-fade-in">
      <CustomersSubnav />
      <BilledListView data={data} month={month} year={year} years={years} />
    </div>
  );
}
