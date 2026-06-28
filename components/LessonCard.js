"use client";

import { GraduationCap } from "lucide-react";
import { useTransactions } from "@/lib/useTransactions";
import { computeStats } from "@/lib/insights";
import { dailyLesson } from "@/lib/lessons";

// Money lesson of the day — slim top banner, contextual to the user's data.
export default function LessonCard() {
  const { transactions } = useTransactions();
  const stats = transactions.length ? computeStats(transactions) : null;
  const lesson = dailyLesson(stats);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
        <GraduationCap size={18} strokeWidth={2.2} />
      </span>
      <p className="min-w-0 text-sm text-slate-600">
        <span className="text-[11px] font-bold uppercase tracking-wide text-indigo-500">
          Money tip ·{" "}
        </span>
        <span className="font-extrabold text-slate-900">{lesson.title}.</span>{" "}
        {lesson.text}
      </p>
    </div>
  );
}
