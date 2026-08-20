"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fmtRs } from "@/lib/money";

const ACCENT = "#fbbf24";
const BORDER = "#1f2937";
const TEXT_MUTED = "#9ca3af";

export function RevenueTrendChart({ data }: { data: { hour: string; revenue: number }[] }) {
  if (data.length === 0) {
    return <EmptyState label="No sales recorded yet today" />;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={BORDER} vertical={false} />
        <XAxis dataKey="hour" tick={{ fill: TEXT_MUTED, fontSize: 11.5 }} axisLine={{ stroke: BORDER }} tickLine={false} />
        <YAxis
          tick={{ fill: TEXT_MUTED, fontSize: 11.5 }}
          axisLine={false}
          tickLine={false}
          width={36}
          tickFormatter={(v: number) => `${v / 1000}k`}
        />
        <Tooltip
          contentStyle={{ background: "#151f2e", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12.5 }}
          labelStyle={{ color: "#e5e7eb" }}
          formatter={(v) => [fmtRs(Number(v ?? 0)), "Revenue"]}
        />
        <Area type="monotone" dataKey="revenue" stroke={ACCENT} strokeWidth={2.5} fill="url(#revGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-text-muted">
      {label}
    </div>
  );
}
