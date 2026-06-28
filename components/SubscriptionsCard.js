"use client";

import { Repeat } from "lucide-react";
import { detectRecurring } from "@/lib/insights";
import { CATEGORY_META } from "@/components/CategoryBadge";
import { formatPKR } from "@/lib/format";

// Recurring charges / subscriptions / EMIs — same merchant billed repeatedly.
export default function SubscriptionsCard({ transactions = [], variant = "teen" }) {
  const subs = detectRecurring(transactions);
  const monthly = subs.reduce((a, b) => a + b.amount, 0);
  const accent = variant === "parent" ? "text-trust-600" : "text-indigo-600";

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <Repeat size={16} className={accent} /> Recurring &amp; subscriptions
        </h3>
        {subs.length > 0 && (
          <span className="tnum rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
            ~{formatPKR(monthly)}
          </span>
        )}
      </div>

      {subs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
          No recurring charges detected yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {subs.map((s) => {
            const meta = CATEGORY_META[s.category] || CATEGORY_META.Other;
            return (
              <li
                key={s.merchant}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: meta.bg, color: meta.fg }}
                >
                  <meta.icon size={17} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{s.merchant}</p>
                  <p className="text-xs text-slate-400">
                    {s.count}× · {s.category}
                  </p>
                </div>
                <span className="tnum shrink-0 text-sm font-extrabold text-slate-900">
                  {formatPKR(s.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
