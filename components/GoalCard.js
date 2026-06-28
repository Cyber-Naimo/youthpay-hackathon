"use client";

import { useEffect, useState } from "react";
import { Target, Flame, Pencil, Check, Plus, Info } from "lucide-react";
import { formatPKR } from "@/lib/format";
import { useLang } from "@/lib/i18n";

const KEY = "yp_goal_v1";

// Savings goal + on-track streak. Goal persists in localStorage.
// "Saved" = (money received - money spent) PLUS manual top-ups (extraSavings),
// which the parent owns so the health score updates live when you add savings.
export default function GoalCard({ saved, streak, extraSavings = 0, onAddSavings }) {
  const { t } = useLang();
  const [goal, setGoal] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [addAmt, setAddAmt] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const g = JSON.parse(raw);
        setGoal(g);
        setName(g.name || "");
        setTarget(String(g.target || ""));
      } else {
        setEditing(true);
      }
    } catch {
      setEditing(true);
    }
  }, []);

  function addSavings() {
    const a = parseInt(String(addAmt).replace(/[^\d]/g, ""), 10);
    if (!a || a <= 0) return;
    onAddSavings?.(a);
    setAddAmt("");
  }

  function persist() {
    const tgt = Math.max(0, parseInt(String(target).replace(/[^\d]/g, ""), 10) || 0);
    if (!name.trim() || tgt <= 0) return;
    const g = { name: name.trim(), target: tgt };
    setGoal(g);
    setEditing(false);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(g));
    } catch {}
  }

  const savedAmt = Math.max(0, (saved || 0) + extraSavings);
  const pct = goal ? Math.min(100, Math.round((savedAmt / goal.target) * 100)) : 0;
  const reached = goal && savedAmt >= goal.target;

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

      {editing || !goal ? (
        <div className="space-y-2.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("goalName") + " (e.g. New phone)"}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-brand-400 focus:bg-white focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              inputMode="numeric"
              placeholder={t("targetAmount")}
              className="tnum w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-brand-400 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={persist}
              disabled={!name.trim() || !target}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition active:scale-95 disabled:opacity-50"
            >
              <Check size={16} /> {t("save")}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">{goal.name}</p>
              <p className="tnum mt-0.5 text-xs text-slate-500">
                {formatPKR(savedAmt)} / {formatPKR(goal.target)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-brand-600"
            >
              <Pencil size={12} /> {t("edit")}
            </button>
          </div>

          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-600 to-pink-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="mt-2 text-xs font-semibold text-slate-600">
            {reached
              ? t("goalReached")
              : `${pct}% saved. ${formatPKR(Math.max(0, goal.target - savedAmt))} ${t("toGo")}.`}
          </p>

          {/* How "saved" is calculated */}
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-slate-400">
            <Info size={12} className="mt-0.5 shrink-0" />
            Saved = money you received minus what you spent
            {extraSavings > 0 ? `, plus ${formatPKR(extraSavings)} you added` : ""}.
          </p>

          {/* Manual top-up */}
          <div className="mt-3 flex gap-2">
            <input
              value={addAmt}
              onChange={(e) => setAddAmt(e.target.value)}
              inputMode="numeric"
              placeholder="Add savings (Rs.)"
              className="tnum w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-400 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={addSavings}
              disabled={!addAmt}
              className="flex shrink-0 items-center gap-1 rounded-xl bg-brand-50 px-3 text-sm font-bold text-brand-700 transition hover:bg-brand-100 active:scale-95 disabled:opacity-50"
            >
              <Plus size={15} /> Add
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
