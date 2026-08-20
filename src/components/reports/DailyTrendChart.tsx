"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fmtRs } from "@/lib/money";
import { EmptyState } from "@/components/dashboard/RevenueTrendChart";

const ACCENT = "#fbbf24";
const BORDER = "#1f2937";
const TEXT_MUTED = "#9ca3af";

/** Daily revenue across the range. Quiet days are seeded as zero upstream, so the line never jumps a gap. */
export function DailyTrendChart({ data }: { data: { label: string; revenue: number }[] }) {
  if (data.length === 0 || data.every((d) => d.revenue === 0)) {
    return <EmptyState label="No sales in this period" />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="reportRevGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={BORDER} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: TEXT_MUTED, fontSize: 11 }}
          axisLine={{ stroke: BORDER }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={18}
        />
        <YAxis
          tick={{ fill: TEXT_MUTED, fontSize: 11.5 }}
          axisLine={false}
          tickLine={false}
          width={40}
          tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
        />
        <Tooltip
          contentStyle={{ background: "#151f2e", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12.5 }}
          labelStyle={{ color: "#e5e7eb" }}
          formatter={(v) => [fmtRs(Number(v ?? 0)), "Revenue"]}
        />
        <Area type="monotone" dataKey="revenue" stroke={ACCENT} strokeWidth={2.5} fill="url(#reportRevGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
