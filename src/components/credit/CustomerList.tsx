import Link from "next/link";
import { clsx } from "clsx";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { CreditPageData } from "@/lib/queries/customers";
import { fmtRs, toNum } from "@/lib/money";
import { fmtBSDateTime } from "@/lib/bs-date";
import { Badge } from "@/components/ui/Badge";
import { CreditLimitEditor, CustomerActiveToggle } from "./CustomerAdmin";

const when = (d: Date) =>
  fmtBSDateTime(d);

/**
 * The account list. Selecting a customer is a plain link (`?customer=<id>`)
 * rather than client state, so the ledger and payment panel are rendered on
 * the server against fresh balances — a stale balance is exactly the thing a
 * payment form must not have.
 */
export function CustomerList({
  customers,
  selectedId,
  canEditLimit,
  canManage,
}: {
  customers: CreditPageData["customers"];
  selectedId?: string;
  canEditLimit: boolean;
  canManage: boolean;
}) {
  if (customers.length === 0) {
    return <p className="py-8 text-center text-[13.5px] text-text-muted">No credit customers yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {customers.map((c) => {
        const util = Math.min(100, Math.max(0, toNum(c.utilization)));
        const selected = c.id === selectedId;

        return (
          <div
            key={c.id}
            className={clsx(
              "rounded-xl border bg-bg p-3.5 transition-colors",
              selected ? "border-accent/50" : "border-border",
              !c.active && "opacity-55"
            )}
          >
            <div className="flex flex-wrap items-start gap-3">
              <Link href={`/credit?customer=${c.id}`} className="min-w-[140px] flex-1" scroll={false}>
                <div className="flex items-center gap-2">
                  <span className="font-display text-[14.5px] font-semibold text-text">{c.name}</span>
                  {c.overExtended && c.active && (
                    <Badge tone="error">
                      <AlertTriangle size={10} />
                      AT LIMIT
                    </Badge>
                  )}
                  {!c.active && <Badge tone="muted">CLOSED</Badge>}
                </div>
                {c.phone && <div className="font-data mt-0.5 text-[11.5px] text-text-muted">{c.phone}</div>}
              </Link>

              <div className="text-right">
                <div className={clsx("font-data text-[15px] font-bold", c.dueAmount.gt(0) ? "text-accent" : "text-success")}>
                  {fmtRs(c.dueAmount)}
                </div>
                <div className="text-[11px] text-text-muted">
                  of {fmtRs(c.creditLimit)} · {fmtRs(c.headroom)} left
                </div>
              </div>
            </div>

            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-hi">
              <div
                className={clsx("h-full rounded-full", c.overExtended ? "bg-error" : "bg-accent")}
                style={{ width: `${util}%` }}
              />
            </div>

            {(canEditLimit || canManage) && (
              <div className="mt-2.5 flex flex-wrap items-center justify-end gap-2">
                {canEditLimit && <CreditLimitEditor customerId={c.id} currentLimit={c.creditLimit.toString()} />}
                {canManage && (
                  <CustomerActiveToggle customerId={c.id} active={c.active} hasDebt={c.dueAmount.gt(0)} />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Charges and payments interleaved — one story per account. */
export function CustomerLedger({ ledger }: { ledger: CreditPageData["ledger"] }) {
  if (ledger.length === 0) {
    return <p className="py-8 text-center text-[13.5px] text-text-muted">No activity on this account yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {ledger.map((e) => {
        const isPayment = e.kind === "PAYMENT";
        return (
          <li
            key={`${e.kind}:${e.id}`}
            className={clsx("flex items-center gap-3 rounded-lg border border-border bg-bg px-3 py-2.5", e.voided && "opacity-50")}
          >
            <div
              className={clsx(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                isPayment ? "bg-success/12 text-success" : "bg-accent/12 text-accent"
              )}
            >
              {isPayment ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] text-text">
                {e.detail}
                {e.voided && <span className="ml-1.5 text-[11px] text-error">VOIDED</span>}
              </div>
              <div className="font-data text-[11px] text-text-muted">
                {when(e.at)} · {e.by}
              </div>
            </div>

            <div
              className={clsx(
                "font-data text-[13.5px] font-semibold",
                e.voided ? "text-text-muted line-through" : isPayment ? "text-success" : "text-text"
              )}
            >
              {isPayment ? "−" : "+"}
              {fmtRs(e.amount)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Station-wide payment feed, so a manager can see collections without opening each account. */
export function RecentPayments({ payments }: { payments: CreditPageData["recentPayments"] }) {
  if (payments.length === 0) {
    return <p className="py-8 text-center text-[13.5px] text-text-muted">No payments recorded yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {payments.map((p) => (
        <li key={p.id} className="flex items-center gap-3 rounded-lg border border-border bg-bg px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] text-text">{p.customer.name}</div>
            <div className="font-data text-[11px] text-text-muted">
              {when(p.createdAt)} · {p.recordedBy.name}
            </div>
          </div>
          <span className="font-data text-[13.5px] font-semibold text-success">{fmtRs(p.amount)}</span>
        </li>
      ))}
    </ul>
  );
}
