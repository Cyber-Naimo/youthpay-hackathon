"use client";

import { useState } from "react";
import { Target, Flame, Pencil, Trash2, Check, Plus, X, CheckCircle2 } from "lucide-react";
import { formatPKR } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { useGoals } from "@/lib/useTransactions";
import { addGoal, updateGoal, deleteGoal, contributeGoal } from "@/lib/store";

// Multiple savings goals: add / edit / delete, contribute per goal, auto-mark
// complete when the target is reached (no more contributions allowed).
export default function GoalsCard({ streak }) {
  const { t } = useLang();
  const goals = useGoals();
  const [adding, setAdding] = useState(false);

  return (
    <section className="rounded-3xl bg-white p-5 card-shadow">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
          <Target size={15} className="text-brand-600" /> {t("savingsGoal")}
        </h3>
        {streak > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600">
            <Flame size={13} /> {streak} {t("onTrackStreak")}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {goals.map((g) => (
          <GoalRow key={g.id} goal={g} />
        ))}
      </div>

      {adding ? (
        <GoalForm
          onSave={(name, target) => {
            addGoal(name, target);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 py-2.5 text-sm font-bold text-slate-500 transition hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-700"
        >
          <Plus size={16} /> Add a goal
        </button>
      )}

      {goals.length > 0 && (
        <p className="mt-3 text-[11px] leading-snug text-slate-400">
          Add savings as you set money aside. Reaching the target marks the goal complete.
        </p>
      )}
    </section>
  );
}

function GoalRow({ goal }) {
  const { t } = useLang();
  const [editing, setEditing] = useState(false);
  const [addAmt, setAddAmt] = useState("");
  const done = goal.saved >= goal.target && goal.target > 0;
  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;

  if (editing) {
    return (
      <GoalForm
        initial={goal}
        onSave={(name, target) => {
          updateGoal(goal.id, { name, target: Math.max(goal.saved, Number(target) || 0) });
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
        onDelete={() => deleteGoal(goal.id)}
      />
    );
  }

  function add() {
    const a = parseInt(String(addAmt).replace(/[^\d]/g, ""), 10);
    if (a > 0) contributeGoal(goal.id, a);
    setAddAmt("");
  }

  const surplus = goal.saved - goal.target;
  return (
    <div className={`rounded-2xl border p-3 ${done ? "border-green-200 bg-green-50/50" : "border-slate-100"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-bold text-slate-900">
            {goal.name}
            {done && <CheckCircle2 size={14} className="shrink-0 text-green-600" />}
          </p>
          <p className="tnum mt-0.5 text-xs text-slate-500">
            {formatPKR(goal.saved)} / {formatPKR(goal.target)}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand-600"
            aria-label="Edit goal"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={() => window.confirm(`Delete goal "${goal.name}"?`) && deleteGoal(goal.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            aria-label="Delete goal"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${done ? "bg-green-500" : "bg-gradient-to-r from-brand-600 to-pink-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {done && (
        <p className="mt-2 text-xs font-bold text-green-700">
          {t("goalReached")}
          {surplus > 0 ? ` — ${formatPKR(surplus)} extra saved` : ""}
        </p>
      )}

      {/* Add savings — allowed even after completion (kept as surplus) */}
      <div className="mt-2.5 flex gap-2">
        <input
          value={addAmt}
          onChange={(e) => setAddAmt(e.target.value)}
          inputMode="numeric"
          placeholder="Money you saved (Rs.)"
          className="tnum w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-400 focus:bg-white focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          disabled={!addAmt}
          className="flex shrink-0 items-center gap-1 rounded-xl bg-brand-600 px-3.5 text-sm font-bold text-white transition hover:bg-brand-700 active:scale-95 disabled:opacity-50"
        >
          <Plus size={15} /> Save
        </button>
      </div>
    </div>
  );
}

function GoalForm({ initial, onSave, onCancel, onDelete }) {
  const [name, setName] = useState(initial?.name || "");
  const [target, setTarget] = useState(initial ? String(initial.target) : "");
  const valid = name.trim() && parseInt(String(target).replace(/[^\d]/g, ""), 10) > 0;
  return (
    <div className="mt-3 space-y-2.5 rounded-2xl border border-brand-200 bg-brand-50/40 p-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Goal name (e.g. New phone)"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
      />
      <input
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        inputMode="numeric"
        placeholder="Target amount (Rs.)"
        className="tnum w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
      />
      <div className="flex items-center justify-between">
        {onDelete ? (
          <button type="button" onClick={onDelete} className="flex items-center gap-1 text-xs font-bold text-red-500">
            <Trash2 size={13} /> Delete
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-1.5">
          <button type="button" onClick={onCancel} className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
            <X size={13} /> Cancel
          </button>
          <button
            type="button"
            onClick={() => valid && onSave(name.trim(), target)}
            disabled={!valid}
            className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            <Check size={13} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
