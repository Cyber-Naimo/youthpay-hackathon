"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatPKR, formatCompactPKR } from "@/lib/format";
import { categoryColor } from "./CategoryBadge";
import { PieChart as PieIcon } from "lucide-react";

function DonutTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-xs card-shadow border border-slate-100">
      <div className="font-bold text-slate-900">{p.name}</div>
      <div className="tnum text-slate-600">{formatPKR(p.value)}</div>
    </div>
  );
}

// Category donut. data = [{ category, amount }]
export function SpendingChart({ data = [], variant = "teen" }) {
  const total = data.reduce((s, d) => s + d.amount, 0);

  if (!data.length || total === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center text-slate-400">
        <PieIcon size={36} strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-3 text-sm font-medium">No spending to chart yet</p>
        <p className="text-xs">Upload emails or load sample data to see the breakdown.</p>
      </div>
    );
  }

  const accent = variant === "parent" ? "#1d4ed8" : "#9333ea";

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative aspect-square w-40 shrink-0 sm:w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              innerRadius="64%"
              outerRadius="95%"
              paddingAngle={2}
              stroke="none"
              animationDuration={700}
            >
              {data.map((d) => (
                <Cell key={d.category} fill={categoryColor(d.category)} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Total
          </span>
          <span className="tnum text-base font-extrabold" style={{ color: accent }}>
            {formatCompactPKR(total)}
          </span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2">
        {data.map((d) => {
          const pct = Math.round((d.amount / total) * 100);
          return (
            <li key={d.category} className="flex min-w-0 items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: categoryColor(d.category) }}
              />
              <span className="min-w-0 flex-1 truncate text-slate-600">{d.category}</span>
              <span className="tnum shrink-0 font-semibold text-slate-900">
                {formatCompactPKR(d.amount)}
              </span>
              <span className="tnum w-8 shrink-0 text-right text-xs text-slate-400">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Daily trend area chart. data = [{ label, amount }]
export function TrendChart({ data = [], variant = "teen" }) {
  const has = data.some((d) => d.amount > 0);
  const color = variant === "parent" ? "#2563eb" : "#a855f7";
  const gradId = `trend-${variant}`;

  if (!has) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        No daily spending yet
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) => formatCompactPKR(v).replace("Rs. ", "")}
          />
          <Tooltip
            formatter={(v) => [formatPKR(v), "Spent"]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradId})`}
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SpendingChart;
