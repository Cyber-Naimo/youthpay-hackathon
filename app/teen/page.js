"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  Plus,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Flame,
  CalendarRange,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Sparkles,
  ReceiptText,
  ArrowLeft,
} from "lucide-react";
import { useTransactions, useExtraSavings } from "@/lib/useTransactions";
import {
  computeStats,
  generateInsights,
  dailySpendSeries,
  onTrackStreak,
} from "@/lib/insights";
import { formatPKR, formatCompactPKR } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import HealthScore from "@/components/HealthScore";
import { TrendChart } from "@/components/SpendingChart";
import SpendingBreakdown from "@/components/SpendingBreakdown";
import InsightCard from "@/components/InsightCard";
import GoalsCard from "@/components/GoalsCard";
import CoachWidget from "@/components/CoachWidget";
import ActivityPanel from "@/components/ActivityPanel";
import RecommendationsCard from "@/components/RecommendationsCard";
import SubscriptionsCard from "@/components/SubscriptionsCard";
import RewardsCard from "@/components/RewardsCard";

/* ── Tilla: light-aurora teen dashboard (sidebar + main/rail layout) ── */

export default function TeenDashboard() {
  const { transactions, loading } = useTransactions();
  const extraSavings = useExtraSavings();
  const { t } = useLang();
  const [period, setPeriod] = useState(null); // null = auto

  if (loading) return <Skeleton />;
  if (!transactions.length) return <EmptyState />;

  const stats = computeStats(transactions, { extraSavings });
  const insights = generateInsights(transactions, "teen").slice(0, 4);
  const trend = dailySpendSeries(transactions, 14);
  const streak = onTrackStreak(transactions);
  const net = stats.totalReceived - stats.totalSpent;
  const overspent = net < 0;
  const savedLabel = overspent ? "Overspent" : t("saved");
  const netAbs = Math.abs(net);

  // Auto-pick the smallest period that actually has data, until the user picks.
  const effPeriod =
    period || (stats.spentThisWeek > 0 ? "week" : stats.spentThisMonth > 0 ? "month" : "all");
  const periodSpent =
    effPeriod === "week"
      ? stats.spentThisWeek
      : effPeriod === "month"
      ? stats.spentThisMonth
      : stats.totalSpent;

  return (
    <div className="min-h-dvh bg-[#FAFAFC] text-slate-900 lg:flex">
      <Sidebar t={t} />

      <main className="min-w-0 flex-1">
        <MobileBar t={t} />

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Page header */}
          <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-400">{t("greeting")}</p>
              <h1 className="text-2xl font-extrabold tracking-tight font-[family-name:var(--font-jakarta)] sm:text-[1.7rem]">
                {t("overview")}
              </h1>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95"
            >
              <Plus size={16} /> {t("addData")}
            </Link>
          </header>

          {/* Hero balance — aurora gradient, full width */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-6 text-white shadow-lg shadow-indigo-200/60 sm:p-7">
            <Aurora />
            <div className="relative">
              {/* Period toggle */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white/75">{t("spent")}</p>
                <div className="flex rounded-full bg-white/15 p-0.5 text-xs font-bold backdrop-blur">
                  {[
                    { k: "week", label: t("pWeek") },
                    { k: "month", label: t("pMonth") },
                    { k: "all", label: t("pAll") },
                  ].map((o) => (
                    <button
                      key={o.k}
                      type="button"
                      onClick={() => setPeriod(o.k)}
                      className={`rounded-full px-3 py-1 transition ${
                        effPeriod === o.k ? "bg-white text-indigo-700" : "text-white/80"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <p className="tnum text-4xl font-extrabold leading-none font-[family-name:var(--font-jakarta)] sm:text-5xl">
                  {formatPKR(periodSpent)}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:w-[300px]">
                  <MiniFlow icon={ArrowDownRight} label={t("received")} value={formatCompactPKR(stats.totalReceived)} full={formatPKR(stats.totalReceived)} />
                  <MiniFlow icon={overspent ? ArrowUpRight : PiggyBank} label={savedLabel} value={formatCompactPKR(netAbs)} full={formatPKR(netAbs)} />
                </div>
              </div>
            </div>
          </section>

          {/* KPI row */}
          <section className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi
              icon={overspent ? ArrowUpRight : PiggyBank}
              tint={overspent ? "from-rose-500 to-red-500" : "from-emerald-500 to-teal-500"}
              label={savedLabel}
              value={formatPKR(netAbs)}
            />
            <Kpi icon={CalendarRange} tint="from-indigo-500 to-violet-500" label={t("dailyAvg")} value={formatPKR(stats.dailyAverage)} />
            <Kpi icon={ReceiptText} tint="from-violet-500 to-fuchsia-500" label={t("recent")} value={`${stats.txCount}`} />
            <Kpi icon={ArrowUpRight} tint="from-fuchsia-500 to-pink-500" label={t("received")} value={formatPKR(stats.totalReceived)} />
          </section>

          {/* Main + rail — balanced heights */}
          <div className="mt-5 space-y-5 lg:flex lg:gap-5 lg:space-y-0">
            {/* Main */}
            <div className="min-w-0 flex-1 space-y-5">
              <Card>
                <CardHead icon={LineIcon} title={t("last14")} />
                <TrendChart data={trend} variant="teen" />
              </Card>

              <Card>
                <CardHead icon={PieIcon} title={t("whereWent")} />
                <SpendingBreakdown data={stats.breakdown} />
              </Card>

              <RecommendationsCard transactions={transactions} variant="teen" />
            </div>

            {/* Rail */}
            <div className="space-y-5 lg:w-[340px] lg:shrink-0">
              <RewardsCard />

              <Card className="flex flex-col items-center">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  {t("healthScore")}
                </p>
                <HealthScore score={stats.healthScore} variant="teen" size={128} />
                {streak > 0 && (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">
                    <Flame size={13} /> {streak} {t("onTrackStreak")}
                  </span>
                )}
              </Card>

              <GoalsCard streak={streak} />

              <SubscriptionsCard transactions={transactions} variant="teen" />
            </div>
          </div>

          {/* Smart insights — clean full-width row */}
          <section className="mt-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <Sparkles size={16} className="text-indigo-600" /> {t("smartInsights")}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {insights.map((ins) => (
                <InsightCard key={ins.id} insight={ins} />
              ))}
            </div>
          </section>

          {/* Activity — full panel inline (search, filters, add/edit/delete) */}
          <section id="activity" className="mt-5">
            <ActivityPanel />
          </section>
        </div>
      </main>

      {/* Floating AI coach */}
      <CoachWidget transactions={transactions} variant="teen" />
    </div>
  );
}

/* ── Brand + chrome ── */

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white shadow-sm">
        <span className="text-base font-black font-[family-name:var(--font-jakarta)]">T</span>
      </span>
      <div className="leading-none">
        <p className="text-lg font-extrabold tracking-tight font-[family-name:var(--font-jakarta)]">
          Tilla
        </p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          by YouthPay
        </p>
      </div>
    </div>
  );
}

function Sidebar({ t }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex">
      <Logo />
      <nav className="mt-8 flex flex-col gap-1">
        <NavItem icon={LayoutGrid} label={t("overview")} active />
        <NavItem icon={ReceiptText} label={t("activity")} href="/teen#activity" />
        <NavItem icon={Plus} label={t("addData")} href="/" />
        <NavItem icon={ShieldCheck} label={t("parent")} href="/parent" />
      </nav>
      <div className="mt-auto">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
        >
          <ArrowLeft size={16} /> Home
        </Link>
      </div>
    </aside>
  );
}

function NavItem({ icon: Icon, label, href, active }) {
  const cls = `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
    active
      ? "bg-indigo-50 text-indigo-700"
      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
  }`;
  const inner = (
    <>
      <Icon size={17} strokeWidth={2.2} /> {label}
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <span className={cls} aria-current="page">
      {inner}
    </span>
  );
}

function MobileBar({ t }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
      <Logo />
      <div className="flex items-center gap-2">
        <Link
          href="/teen#activity"
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition active:scale-95"
        >
          <ReceiptText size={14} /> {t("activity")}
        </Link>
        <Link
          href="/parent"
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition active:scale-95"
        >
          <ShieldCheck size={14} /> {t("parent")}
        </Link>
      </div>
    </div>
  );
}

/* ── Primitives ── */

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-3xl border border-slate-100 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardHead({ icon: Icon, title, inline }) {
  return (
    <h3 className={`flex items-center gap-2 text-sm font-extrabold text-slate-900 ${inline ? "" : "mb-4"}`}>
      <Icon size={16} className="text-indigo-600" /> {title}
    </h3>
  );
}

function Kpi({ icon: Icon, label, value, tint }) {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${tint} text-white`}>
        <Icon size={17} strokeWidth={2.3} />
      </span>
      <div className="mt-4">
        <p className="text-[11px] font-semibold text-slate-500">{label}</p>
        <p className="tnum mt-0.5 text-lg font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function MiniFlow({ icon: Icon, label, value, full }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-white/15 px-3 py-2.5 backdrop-blur">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-white/70">{label}</p>
        <p className="tnum text-sm font-extrabold" title={full || value}>
          {value}
        </p>
      </div>
    </div>
  );
}

function Aurora() {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-fuchsia-300/40 blur-3xl" />
    </>
  );
}

/* ── States ── */

function Skeleton() {
  return (
    <div className="min-h-dvh bg-[#FAFAFC] lg:flex">
      <div className="hidden h-dvh w-60 border-r border-slate-200 bg-white lg:block" />
      <div className="mx-auto max-w-6xl flex-1 px-6 py-8">
        <div className="skeleton mb-6 h-10 w-48 rounded-xl" />
        <div className="skeleton h-40 rounded-3xl" />
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-3xl" />
          ))}
        </div>
        <div className="mt-5 lg:flex lg:gap-5">
          <div className="skeleton h-72 flex-1 rounded-3xl" />
          <div className="skeleton mt-5 h-72 rounded-3xl lg:mt-0 lg:w-[340px]" />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#FAFAFC] px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white">
        <span className="text-2xl font-black">T</span>
      </span>
      <h1 className="mt-5 text-xl font-extrabold text-slate-900">No data yet</h1>
      <p className="mt-2 max-w-xs text-sm text-slate-500">
        Add some transactions first to see your Tilla dashboard.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white active:scale-95"
      >
        Go to upload
      </Link>
    </main>
  );
}
