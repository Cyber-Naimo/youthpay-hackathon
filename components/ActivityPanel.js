"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Mail,
  FileText,
  MessageSquare,
  PencilLine,
  Sparkles,
  Inbox,
  ArrowUpRight,
  ArrowDownLeft,
  ReceiptText,
  Database,
} from "lucide-react";
import { useTransactions } from "@/lib/useTransactions";
import { updateTransaction, deleteTransaction, mergeTransactions, clearAll } from "@/lib/store";
import { computeStats } from "@/lib/insights";
import { CATEGORIES } from "@/lib/categorizer";
import { CATEGORY_META } from "@/components/CategoryBadge";
import { formatPKR } from "@/lib/format";
import { formatCrypto } from "@/lib/crypto";
import { format } from "date-fns";

const SOURCE_META = {
  email: { label: "Email", icon: Mail, fg: "#1d4ed8", bg: "#dbeafe" },
  eml: { label: ".eml", icon: FileText, fg: "#7c3aed", bg: "#ede9fe" },
  gmail: { label: "Gmail", icon: Mail, fg: "#dc2626", bg: "#fee2e2" },
  sms: { label: "SMS", icon: MessageSquare, fg: "#0d9488", bg: "#ccfbf1" },
  manual: { label: "Manual", icon: PencilLine, fg: "#c2410c", bg: "#ffedd5" },
  sample: { label: "Sample", icon: Sparkles, fg: "#9333ea", bg: "#f3e8ff" },
};
const srcMeta = (s) => SOURCE_META[s] || { label: "Auto", icon: Inbox, fg: "#475569", bg: "#f1f5f9" };

export default function ActivityPanel() {
  const { transactions } = useTransactions();
  const [q, setQ] = useState("");
  const [source, setSource] = useState("all");
  const [typeF, setTypeF] = useState("all");
  const [cat, setCat] = useState("all");
  const [bank, setBank] = useState("all");
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const [adding, setAdding] = useState(false);

  // Single source of truth for totals — same as the dashboard.
  const stats = useMemo(() => computeStats(transactions), [transactions]);

  const sources = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.source || "email"))),
    [transactions]
  );
  const banks = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.bank_name).filter(Boolean))).sort(),
    [transactions]
  );

  const list = useMemo(() => {
    let l = transactions
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (q.trim()) l = l.filter((t) => (t.merchant_name || "").toLowerCase().includes(q.toLowerCase()));
    if (source !== "all") l = l.filter((t) => (t.source || "email") === source);
    if (typeF !== "all") l = l.filter((t) => t.type === typeF);
    if (cat !== "all") l = l.filter((t) => t.category === cat);
    if (bank !== "all") l = l.filter((t) => t.bank_name === bank);
    return l;
  }, [transactions, q, source, typeF, cat, bank]);

  function startEdit(t) {
    setEditing(t.id);
    setDraft({
      merchant_name: t.merchant_name || "",
      amount: String(t.amount),
      type: t.type,
      category: t.category,
      date: new Date(t.date).toISOString().slice(0, 10),
    });
  }
  function saveEdit(id) {
    const amt = parseFloat(String(draft.amount).replace(/[^\d.]/g, ""));
    if (!draft.merchant_name.trim() || !amt) return;
    updateTransaction(id, {
      merchant_name: draft.merchant_name.trim().toUpperCase(),
      amount: amt,
      type: draft.type,
      category: draft.type === "credit" ? "Income" : draft.category,
      date: new Date(`${draft.date}T12:00:00`).toISOString(),
    });
    setEditing(null);
  }
  function remove(id) {
    if (window.confirm("Delete this transaction? This cannot be undone.")) deleteTransaction(id);
  }
  function addNew(tx) {
    mergeTransactions([tx]);
    setAdding(false);
  }
  function wipe() {
    if (window.confirm("Clear ALL records (transactions, savings, goal)? This cannot be undone.")) clearAll();
  }

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <ReceiptText size={16} className="text-indigo-600" /> All activity
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
            {stats.txCount + (transactions.filter((t) => t.type === "credit" && !t.is_duplicate).length)}
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 active:scale-95"
          >
            <Plus size={15} /> Add
          </button>
          <button
            type="button"
            onClick={wipe}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 transition hover:border-red-300 hover:text-red-600"
          >
            <Trash2 size={14} /> Clear all
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="Spent" value={formatPKR(stats.totalSpent)} tone="text-slate-900" />
        <Stat label="Received" value={formatPKR(stats.totalReceived)} tone="text-green-600" />
        <Stat label="Net" value={formatPKR(stats.totalReceived - stats.totalSpent)} tone="text-indigo-600" />
      </div>

      {adding && <AddRow onAdd={addNew} onCancel={() => setAdding(false)} />}

      {/* Filters */}
      <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
          <Search size={15} className="text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search merchant"
            className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Chip active={typeF === "all"} onClick={() => setTypeF("all")}>All</Chip>
          <Chip active={typeF === "debit"} onClick={() => setTypeF("debit")}>Spent</Chip>
          <Chip active={typeF === "credit"} onClick={() => setTypeF("credit")}>Received</Chip>
          {sources.map((s) => {
            const m = srcMeta(s);
            return (
              <Chip key={s} active={source === s} onClick={() => setSource(source === s ? "all" : s)}>
                <m.icon size={11} /> {m.label}
              </Chip>
            );
          })}
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 focus:outline-none"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {banks.length > 1 && (
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 focus:outline-none"
            >
              <option value="all">All banks</option>
              {banks.map((bk) => (
                <option key={bk} value={bk}>{bk}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
          No transactions match your filters.
        </div>
      ) : (
        <ul className="nice-scroll max-h-[560px] space-y-2 overflow-y-auto pr-1">
          {list.map((t) =>
            editing === t.id ? (
              <EditRow key={t.id} draft={draft} setDraft={setDraft} onSave={() => saveEdit(t.id)} onCancel={() => setEditing(null)} />
            ) : (
              <Row key={t.id} t={t} onEdit={() => startEdit(t)} onDelete={() => remove(t.id)} />
            )
          )}
        </ul>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
        <Database size={12} /> Saved privately in this browser (localStorage). Nothing is sent to a server.
      </p>
    </section>
  );
}

function Row({ t, onEdit, onDelete }) {
  const meta = CATEGORY_META[t.category] || CATEGORY_META.Other;
  const src = srcMeta(t.source || "email");
  const isCredit = t.type === "credit";
  return (
    <li className={`flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 ${t.is_duplicate ? "opacity-60" : ""}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: meta.bg, color: meta.fg }}>
        <meta.icon size={18} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900">{t.merchant_name || "Unknown"}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ color: src.fg, background: src.bg }}>
            <src.icon size={9} /> {src.label}
          </span>
          {t.bank_name && (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
              {t.bank_name}
            </span>
          )}
          {t.is_crypto && (
            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
              {formatCrypto(t.original_amount, t.currency)}
            </span>
          )}
          <span>{t.category}</span>
          <span aria-hidden="true">•</span>
          <span className="whitespace-nowrap">{safeDate(t.date)}</span>
        </div>
      </div>
      <span className={`tnum flex shrink-0 items-center gap-0.5 text-sm font-extrabold ${isCredit ? "text-green-600" : "text-slate-900"}`}>
        {isCredit ? <ArrowDownLeft size={13} strokeWidth={2.6} /> : <ArrowUpRight size={13} strokeWidth={2.6} />}
        {isCredit ? "+" : "-"}
        {formatPKR(t.amount)}
      </span>
      <div className="flex shrink-0 gap-1">
        <button type="button" onClick={onEdit} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600" aria-label="Edit">
          <Pencil size={14} />
        </button>
        <button type="button" onClick={onDelete} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600" aria-label="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

function EditRow({ draft, setDraft, onSave, onCancel }) {
  return (
    <li className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input value={draft.merchant_name} onChange={(e) => setDraft({ ...draft, merchant_name: e.target.value })} placeholder="Merchant" className={inp} />
        <input value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} inputMode="numeric" placeholder="Amount" className={`${inp} tnum`} />
        <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={inp}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className={inp} />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-1.5">
          {["debit", "credit"].map((ty) => (
            <button key={ty} type="button" onClick={() => setDraft({ ...draft, type: ty })} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${draft.type === ty ? "bg-indigo-600 text-white" : "bg-white text-slate-500"}`}>
              {ty === "debit" ? "Spent" : "Received"}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={onCancel} className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-500"><X size={13} /> Cancel</button>
          <button type="button" onClick={onSave} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white"><Check size={13} /> Save</button>
        </div>
      </div>
    </li>
  );
}

function AddRow({ onAdd, onCancel }) {
  const [d, setD] = useState({ merchant_name: "", amount: "", type: "debit", category: "Shopping", date: new Date().toISOString().slice(0, 10) });
  function submit() {
    const amt = parseFloat(String(d.amount).replace(/[^\d.]/g, ""));
    if (!d.merchant_name.trim() || !amt) return;
    onAdd({
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      merchant_name: d.merchant_name.trim().toUpperCase(),
      amount: amt,
      type: d.type,
      date: new Date(`${d.date}T12:00:00`).toISOString(),
      payment_method: "Manual entry",
      bank_name: "Manual",
      category: d.type === "credit" ? "Income" : d.category,
      raw_text: "Added manually",
      is_duplicate: false,
      confidence: 1,
      parsed_by: "manual",
      source: "manual",
      created_at: new Date().toISOString(),
    });
  }
  return (
    <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-3">
      <p className="mb-2 text-sm font-bold text-slate-900">New transaction</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input value={d.merchant_name} onChange={(e) => setD({ ...d, merchant_name: e.target.value })} placeholder="Merchant" className={inp} />
        <input value={d.amount} onChange={(e) => setD({ ...d, amount: e.target.value })} inputMode="numeric" placeholder="Amount" className={`${inp} tnum`} />
        <select value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })} className={inp}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} className={inp} />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-1.5">
          {["debit", "credit"].map((ty) => (
            <button key={ty} type="button" onClick={() => setD({ ...d, type: ty })} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${d.type === ty ? "bg-indigo-600 text-white" : "bg-white text-slate-500"}`}>
              {ty === "debit" ? "Spent" : "Received"}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={onCancel} className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-500">Cancel</button>
          <button type="button" onClick={submit} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white"><Plus size={13} /> Add</button>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm focus:border-indigo-400 focus:outline-none";

function Stat({ label, value, tone = "text-slate-900" }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm">
      <p className="text-[11px] font-semibold text-slate-400">{label}</p>
      <p className={`tnum mt-0.5 text-base font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
      {children}
    </button>
  );
}

function safeDate(d) {
  try {
    return format(new Date(d), "d MMM, h:mm a");
  } catch {
    return "";
  }
}
