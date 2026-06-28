"use client";

import {
  Lightbulb,
  AlertTriangle,
  Scissors,
  CalendarDays,
  Moon,
  Repeat,
  Target,
  PiggyBank,
  Sparkles,
} from "lucide-react";
import { generateRecommendations } from "@/lib/insights";
import { useGoals, useExtraSavings } from "@/lib/useTransactions";

const ICONS = {
  alert: AlertTriangle,
  scissors: Scissors,
  calendar: CalendarDays,
  moon: Moon,
  repeat: Repeat,
  target: Target,
  piggy: PiggyBank,
};
const TONES = {
  good: { fg: "#16a34a", bg: "#f0fdf4" },
  warn: { fg: "#d97706", bg: "#fffbeb" },
  bad: { fg: "#dc2626", bg: "#fef2f2" },
  info: { fg: "#4f46e5", bg: "#eef2ff" },
};

// "What YouthPay recommends" — personalized, actionable tips from the data.
export default function RecommendationsCard({ transactions = [], variant = "teen" }) {
  const goals = useGoals();
  const extraSavings = useExtraSavings();
  const recs = generateRecommendations(transactions, { goals, extraSavings });
  const accent = variant === "parent" ? "text-trust-600" : "text-indigo-600";

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-extrabold text-slate-900">
        <Sparkles size={16} className={accent} /> What YouthPay recommends
      </h3>
      <p className="mb-4 text-xs text-slate-500">Personalized tips based on your spending.</p>

      {recs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
          Add some transactions to get recommendations.
        </p>
      ) : (
        <ol className="space-y-3">
          {recs.map((r, i) => {
            const Icon = ICONS[r.icon] || Lightbulb;
            const tone = TONES[r.tone] || TONES.info;
            return (
              <li key={r.id} className="flex items-start gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold"
                  style={{ background: tone.bg, color: tone.fg }}
                >
                  <Icon size={16} strokeWidth={2.3} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{r.title}</p>
                  <p className="mt-0.5 text-sm leading-snug text-slate-500">{r.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
