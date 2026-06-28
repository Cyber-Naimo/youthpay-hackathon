"use client";

import { useState } from "react";
import { PencilLine, Plus, Check, ChevronDown } from "lucide-react";
import { CATEGORIES } from "@/lib/categorizer";
import { mergeTransactions } from "@/lib/store";
import { useLang } from "@/lib/i18n";

// Manual transaction entry — for spends/credits the user wants to log by hand
// (cash, something not in email/SMS, a pending purchase).
export default function ManualEntry({ onComplete, alwaysOpen = false }) {
  const { t } = useLang();
  const [openState, setOpenState] = useState(false);
  const open = alwaysOpen || openState;
  const setOpen = setOpenState;
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("debit");
  const [category, setCategory] = useState("Shopping");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [done, setDone] = useState("");

  function add() {
    const amt = parseFloat(String(amount).replace(/[^\d.]/g, ""));
    if (!merchant.trim() || !amt || amt <= 0) return;
    const tx = {
      id: `manual-${date}-${merchant}-${amt}-${Math.random().toString(36).slice(2, 7)}`,
      email_id: null,
      merchant_name: merchant.trim().toUpperCase(),
      amount: amt,
      type,
      date: new Date(`${date}T12:00:00`).toISOString(),
      payment_method: "Manual entry",
      bank_name: "Manual",
      category,
      raw_text: "Added manually",
      is_duplicate: false,
      confidence: 1,
      parsed_by: "manual",
      source: "manual",
      created_at: new Date().toISOString(),
    };
    const merged = mergeTransactions([tx]);
    setDone(`Added ${merchant.trim()}. ${merged.length} total.`);
    setMerchant("");
    setAmount("");
    onComplete?.(merged);
  }

  return (
    <div className={alwaysOpen ? "" : "rounded-3xl bg-white p-5 card-shadow-lg"}>
      {!alwaysOpen && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-brand-400 hover:bg-brand-50/40"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <PencilLine size={17} className="text-brand-600" /> Add a transaction manually
            </span>
            <ChevronDown
              size={18}
              className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Log a cash spend or anything not in your emails or SMS.
          </p>
        </>
      )}

      {open && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Merchant">
              <input
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Khaadi"
                className={inputCls}
              />
            </Field>
            <Field label="Amount (Rs.)">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="numeric"
                placeholder="1500"
                className={`${inputCls} tnum`}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Type toggle */}
          <div className="flex gap-2">
            {[
              { key: "debit", label: "I spent" },
              { key: "credit", label: "I received" },
            ].map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setType(o.key)}
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                  type === o.key
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={add}
            disabled={!merchant.trim() || !amount}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-pink-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-200 transition active:scale-[0.98] disabled:opacity-50"
          >
            <Plus size={17} /> Add transaction
          </button>

          {done && (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700">
              <Check size={16} /> {done}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-brand-400 focus:bg-white focus:outline-none";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  );
}
