"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { fmtRs } from "@/lib/money";
import { EmptyState } from "./RevenueTrendChart";

const COLORS = ["#fbbf24", "#f59e0b", "#eab308"];
const BORDER = "#1f2937";

export function FuelRevenueChart({ data }: { data: { label: string; revenue: number }[] }) {
  if (data.every((d) => d.revenue === 0)) {
    return <EmptyState label="No sales recorded yet today" />;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 6 }}>
        <XAxis type="number" hide />
        <YAxis dataKey="label" type="category" tick={{ fill: "#e5e7eb", fontSize: 12.5 }} axisLine={false} tickLine={false} width={54} />
        <Tooltip
          contentStyle={{ background: "#151f2e", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12.5 }}
          formatter={(v) => [fmtRs(Number(v ?? 0)), "Revenue"]}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={22}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
