"use client";

import { useState } from "react";
import { Wallet, Plus, Trash2, AlertTriangle, X } from "lucide-react";
import { useTransactions, useBudgets } from "@/lib/useTransactions";
import { setBudget, removeBudget } from "@/lib/store";
import { monthlyCategorySpend } from "@/lib/insights";
import { CATEGORY_META } from "@/components/CategoryBadge";
import { formatPKR } from "@/lib/format";

// Spendable categories a teen would budget (skip Income/Transfer/Crypto).
const BUDGETABLE = [
  "Food & Dining", "Transport", "Shopping", "Entertainment",
  "Education", "Health", "Utilities", "Other",
];

export default function BudgetsCard() {
  const { transactions } = useTransactions();
  const budgets = useBudgets();
  const spent = monthlyCategorySpend(transactions);
  const [adding, setAdding] = useState(false);
  const [cat, setCat] = useState(BUDGETABLE[0]);
  const [amt, setAmt] = useState("");

  const rows = Object.entries(budgets);

  function add() {
    const n = parseInt(String(amt).replace(/[^\d]/g, ""), 10);
    if (!n) return;
    setBudget(cat, n);
    setAmt("");
    setAdding(false);
  }

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 card-shadow">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <Wallet size={16} className="text-indigo-600" /> Monthly budgets
        </h3>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
        >
          <Plus size={13} /> Set budget
        </button>
      </div>
      <p className="mb-3 text-xs text-slate-500">Spending this month vs your limit.</p>

      {adding && (
        <div className="mb-3 flex gap-2 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-2.5">
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm focus:outline-none"
          >
            {BUDGETABLE.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            inputMode="numeric"
            placeholder="Limit Rs."
            className="tnum w-24 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm focus:outline-none"
          />
          <button type="button" onClick={add} disabled={!amt} className="rounded-lg bg-indigo-600 px-3 text-sm font-bold text-white disabled:opacity-50">
            Save
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
          No budgets yet. Set one to track a category.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map(([category, limit]) => {
            const used = spent[category] || 0;
            const pct = Math.min(100, Math.round((used / limit) * 100));
            const over = used > limit;
            const near = !over && used >= limit * 0.8;
            const meta = CATEGORY_META[category] || CATEGORY_META.Other;
            const color = over ? "#dc2626" : near ? "#d97706" : meta.dot;
            return (
              <li key={category}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    {category}
                    {over && (
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                        <AlertTriangle size={9} /> OVER
                      </span>
                    )}
                    {near && (
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                        CLOSE
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="tnum text-xs font-semibold text-slate-900">
                      {formatPKR(used)} <span className="font-normal text-slate-400">/ {formatPKR(limit)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBudget(category)}
                      className="text-slate-300 transition hover:text-red-500"
                      aria-label={`Remove ${category} budget`}
                    >
                      <X size={13} />
                    </button>
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
      )}
    </section>
  );
}
