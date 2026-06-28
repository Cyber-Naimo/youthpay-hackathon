"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import CategoryBadge, { CATEGORY_META } from "./CategoryBadge";
import { formatPKR } from "@/lib/format";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Receipt,
  Mail,
  FileText,
  MessageSquare,
  PencilLine,
  Sparkles,
  Inbox,
  ChevronDown,
  Search,
} from "lucide-react";

function safeDate(d) {
  try {
    return format(new Date(d), "d MMM, h:mm a");
  } catch {
    return "";
  }
}

// How each transaction got in. Drives the per-row source chip + filter.
const SOURCE_META = {
  email: { label: "Email", icon: Mail, fg: "#1d4ed8", bg: "#dbeafe" },
  eml: { label: ".eml", icon: FileText, fg: "#7c3aed", bg: "#ede9fe" },
  gmail: { label: "Gmail", icon: Mail, fg: "#dc2626", bg: "#fee2e2" },
  sms: { label: "SMS", icon: MessageSquare, fg: "#0d9488", bg: "#ccfbf1" },
  manual: { label: "Manual", icon: PencilLine, fg: "#c2410c", bg: "#ffedd5" },
  sample: { label: "Sample", icon: Sparkles, fg: "#9333ea", bg: "#f3e8ff" },
};
function sourceMeta(s) {
  return SOURCE_META[s] || { label: "Auto", icon: Inbox, fg: "#475569", bg: "#f1f5f9" };
}

export default function TransactionList({
  transactions = [],
  variant = "teen",
  limit,
  showDuplicates = true,
  hideViewAll = false,
}) {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  const sorted = useMemo(() => {
    let l = transactions
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (!showDuplicates) l = l.filter((t) => !t.is_duplicate);
    return l;
  }, [transactions, showDuplicates]);

  // Distinct sources + categories present (for filters).
  const sources = useMemo(() => Array.from(new Set(sorted.map((t) => t.source || "email"))), [sorted]);
  const cats = useMemo(() => Array.from(new Set(sorted.map((t) => t.category || "Other"))).sort(), [sorted]);

  const filtered = sorted.filter((t) => {
    if (filter !== "all" && (t.source || "email") !== filter) return false;
    if (cat !== "all" && (t.category || "Other") !== cat) return false;
    if (q.trim() && !(t.merchant_name || "").toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const collapsed = limit && !showAll;
  const list = collapsed ? filtered.slice(0, limit) : filtered;

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 text-center text-slate-400">
        <Receipt size={32} strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-3 text-sm font-medium">No transactions yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search + category */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
          <Search size={15} className="text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search merchant"
            className="w-full bg-transparent py-2 text-sm focus:outline-none"
          />
        </div>
        {cats.length > 1 && (
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 focus:outline-none"
          >
            <option value="all">All categories</option>
            {cats.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Source filter */}
      {sources.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          {sources.map((s) => {
            const m = sourceMeta(s);
            return (
              <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
                <m.icon size={11} /> {m.label}
              </FilterChip>
            );
          })}
        </div>
      )}

      {list.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
          No transactions match your filters.
        </p>
      )}

      <ul
        className={`flex flex-col gap-2 ${
          !collapsed && list.length > 8 ? "nice-scroll max-h-[480px] overflow-y-auto pr-1" : ""
        }`}
      >
        {list.map((t, i) => {
          const meta = CATEGORY_META[t.category] || CATEGORY_META.Other;
          const src = sourceMeta(t.source || "email");
          const isCredit = t.type === "credit";
          return (
            <li
              key={`${t.id}-${i}`}
              className={`flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 card-shadow ${
                t.is_duplicate ? "opacity-60" : ""
              }`}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: meta.bg, color: meta.fg }}
                aria-hidden="true"
              >
                <meta.icon size={18} strokeWidth={2.2} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {t.merchant_name || "Unknown"}
                  </p>
                  {t.is_duplicate && (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      <Copy size={9} /> DUPLICATE
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ color: src.fg, background: src.bg }}
                  >
                    <src.icon size={9} /> {src.label}
                  </span>
                  <span className="truncate">{t.bank_name}</span>
                  <span aria-hidden="true">•</span>
                  <span className="whitespace-nowrap">{safeDate(t.date)}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span
                  className={`tnum flex items-center gap-0.5 text-sm font-extrabold ${
                    isCredit ? "text-green-600" : "text-slate-900"
                  }`}
                >
                  {isCredit ? (
                    <ArrowDownLeft size={13} strokeWidth={2.6} />
                  ) : (
                    <ArrowUpRight size={13} strokeWidth={2.6} />
                  )}
                  {isCredit ? "+" : "-"}
                  {formatPKR(t.amount)}
                </span>
                {variant !== "parent" && (
                  <CategoryBadge category={t.category} size="sm" />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* View all / show less */}
      {limit && !hideViewAll && filtered.length > limit && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700"
        >
          {showAll ? (
            <>Show less</>
          ) : (
            <>
              View all {filtered.length} <ChevronDown size={15} />
            </>
          )}
        </button>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
        active
          ? "bg-indigo-600 text-white"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
