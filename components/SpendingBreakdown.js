"use client";

import { formatPKR } from "@/lib/format";
import { categoryColor } from "./CategoryBadge";
import { PieChart as PieIcon } from "lucide-react";

// Needs vs Wants is a core money-literacy concept for teens — far more useful
// than a plain donut. We split spend into needs / wants, show the ratio with a
// coaching line, then list categories as bars.
const NEEDS = new Set(["Food & Dining", "Transport", "Education", "Health", "Utilities"]);
const WANTS = new Set(["Shopping", "Entertainment"]);

export default function SpendingBreakdown({ data = [] }) {
  const total = data.reduce((s, d) => s + d.amount, 0);

  if (!data.length || total === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center text-center text-slate-400">
        <PieIcon size={32} strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-3 text-sm font-medium">No spending to break down yet</p>
      </div>
    );
  }

  let needs = 0;
  let wants = 0;
  for (const d of data) {
    if (NEEDS.has(d.category)) needs += d.amount;
    else if (WANTS.has(d.category)) wants += d.amount;
  }
  const classified = needs + wants;
  const wantsPct = classified > 0 ? Math.round((wants / classified) * 100) : 0;
  const needsPct = 100 - wantsPct;

  const coach =
    classified === 0
      ? "Most of your spending is uncategorised."
      : wantsPct > 50
      ? `${wantsPct}% of your spending is on "wants". Try the 50/30/20 rule: keep wants nearer 30%.`
      : `Nice balance, ${needsPct}% needs, ${wantsPct}% wants. You're spending mostly on essentials.`;

  return (
    <div>
      {/* Needs vs Wants split */}
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="text-indigo-700">Needs {needsPct}%</span>
        <span className="text-fuchsia-600">Wants {wantsPct}%</span>
      </div>
      <div className="mt-1.5 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-indigo-500" style={{ width: `${needsPct}%` }} />
        <div className="h-full bg-fuchsia-500" style={{ width: `${wantsPct}%` }} />
      </div>
      <p className="mt-2 text-xs leading-snug text-slate-500">{coach}</p>

      {/* Category bars */}
      <ul className="mt-4 space-y-3">
        {data.slice(0, 6).map((d) => {
          const pct = Math.round((d.amount / total) * 100);
          const color = categoryColor(d.category);
          return (
            <li key={d.category}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                  {d.category}
                </span>
                <span className="tnum font-semibold text-slate-900">
                  {formatPKR(d.amount)}
                  <span className="ml-1.5 text-xs font-normal text-slate-400">{pct}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
