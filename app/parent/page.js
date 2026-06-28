"use client";

import Link from "next/link";
import {
  ShieldCheck,
  ArrowLeft,
  Smile,
  Wallet,
  TrendingUp,
  Receipt,
  CalendarDays,
  AlertTriangle,
  Copy,
  Moon,
  CheckCircle2,
  FileDown,
} from "lucide-react";
import { useTransactions } from "@/lib/useTransactions";
import { computeStats, generateInsights, dailySpendSeries } from "@/lib/insights";
import { formatPKR } from "@/lib/format";
import HealthScore from "@/components/HealthScore";
import SpendingChart, { TrendChart } from "@/components/SpendingChart";
import InsightCard from "@/components/InsightCard";
import TransactionList from "@/components/TransactionList";
import CoachWidget from "@/components/CoachWidget";
import ParentGate from "@/components/ParentGate";
import RecommendationsCard from "@/components/RecommendationsCard";
import SubscriptionsCard from "@/components/SubscriptionsCard";

function buildAlerts(transactions, stats) {
  const alerts = [];
  const dupes = transactions.filter((t) => t.is_duplicate).length;
  if (dupes > 0)
    alerts.push({
      icon: Copy,
      tone: "warn",
      title: `${dupes} duplicate charge${dupes > 1 ? "s" : ""} detected`,
      text: "Possible double-billing was automatically flagged and excluded from totals.",
    });
  if (stats.impulseCount > 0)
    alerts.push({
      icon: Moon,
      tone: "warn",
      title: `${stats.impulseCount} late-night purchase${stats.impulseCount > 1 ? "s" : ""}`,
      text: `Small food/entertainment spends after 10pm totalling ${formatPKR(stats.impulseSpend)}.`,
    });
  if (stats.biggest && Number(stats.biggest.amount) >= 3000)
    alerts.push({
      icon: AlertTriangle,
      tone: "warn",
      title: `Large purchase: ${formatPKR(stats.biggest.amount)}`,
      text: `At ${stats.biggest.merchant_name}. Worth a quick check-in.`,
    });
  if (stats.weekendRatio > 0.6)
    alerts.push({
      icon: CalendarDays,
      tone: "warn",
      title: "Weekend-heavy spending",
      text: `${Math.round(stats.weekendRatio * 100)}% of spending happens on weekends.`,
    });
  if (alerts.length === 0)
    alerts.push({
      icon: CheckCircle2,
      tone: "good",
      title: "Everything looks healthy",
      text: "No unusual spending patterns were detected this period.",
    });
  return alerts;
}

export default function ParentDashboard() {
  return (
    <ParentGate>
      <ParentDashboardInner />
    </ParentGate>
  );
}

function ParentDashboardInner() {
  const { transactions, loading } = useTransactions();

  if (loading) return <ParentSkeleton />;
  if (!transactions.length) return <EmptyState />;

  const stats = computeStats(transactions);
  const insights = generateInsights(transactions, "parent");
  const trend = dailySpendSeries(transactions, 14);
  const alerts = buildAlerts(transactions, stats);

  return (
    <main className="min-h-dvh bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              aria-label="Back to home"
            >
              <ArrowLeft size={18} />
            </Link>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-trust-600 text-white">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="text-sm font-extrabold text-slate-900">YouthPay</p>
              <p className="text-xs text-slate-400">Parent Dashboard</p>
            </div>
          </div>
          <div className="no-print flex items-center gap-2">
            <Link
              href="/teen#activity"
              className="hidden items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 sm:flex"
            >
              <Receipt size={14} /> Activity
            </Link>
            <Link
              href="/parent/report"
              className="flex items-center gap-1.5 rounded-lg bg-trust-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-trust-700"
            >
              <FileDown size={14} /> Report
            </Link>
            <Link
              href="/teen"
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              <Smile size={14} /> Teen view
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-6">
        {/* Print-only report header */}
        <div className="print-only mb-6 border-b border-slate-200 pb-4">
          <p className="text-lg font-extrabold text-slate-900">
            YouthPay — Teen Spending Report
          </p>
          <p className="text-xs text-slate-500">
            Generated {new Date().toLocaleDateString("en-PK", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="mb-5">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-[family-name:var(--font-jakarta)]">
            Weekly Summary
          </h1>
          <p className="text-sm text-slate-500">
            A clear, simple overview of your teen&apos;s spending and money habits.
          </p>
        </div>

        {/* Summary cards */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            label="Spent this week"
            value={formatPKR(stats.spentThisWeek)}
            icon={Wallet}
            accent="#2563eb"
          />
          <SummaryCard
            label="Money received"
            value={formatPKR(stats.totalReceived)}
            icon={TrendingUp}
            accent="#16a34a"
          />
          <SummaryCard
            label="Daily average"
            value={formatPKR(stats.dailyAverage)}
            icon={CalendarDays}
            accent="#7c3aed"
          />
          <SummaryCard
            label="Transactions"
            value={String(stats.txCount)}
            icon={Receipt}
            accent="#0891b2"
          />
        </section>

        {/* Main grid */}
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {/* left: charts */}
          <div className="space-y-4 lg:col-span-2">
            <Panel title="Spending by category">
              <SpendingChart data={stats.breakdown} variant="parent" />
            </Panel>
            <Panel title="Daily spending, last 14 days">
              <TrendChart data={trend} variant="parent" />
            </Panel>
          </div>

          {/* right: health + alerts */}
          <div className="space-y-4">
            <Panel title="Financial health">
              <div className="flex flex-col items-center py-2">
                <HealthScore score={stats.healthScore} variant="parent" size={140} />
                <p className="mt-3 text-center text-xs text-slate-500">
                  Based on spending variety, consistency, transaction size and savings.
                </p>
              </div>
            </Panel>

            <Panel title="Alerts">
              <ul className="space-y-2.5">
                {alerts.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        a.tone === "good"
                          ? "bg-green-100 text-green-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      <a.icon size={15} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{a.title}</p>
                      <p className="text-xs text-slate-500">{a.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>

        {/* Insights */}
        <section className="mt-5">
          <h2 className="mb-3 text-sm font-extrabold text-slate-900">Key insights</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {insights.map((ins) => (
              <InsightCard key={ins.id} insight={ins} variant="parent" />
            ))}
          </div>
        </section>

        {/* Recommendations + subscriptions */}
        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <RecommendationsCard transactions={transactions} variant="parent" />
          <SubscriptionsCard transactions={transactions} variant="parent" />
        </section>

        {/* Transactions */}
        <section className="mt-5">
          <h2 className="mb-3 text-sm font-extrabold text-slate-900">All transactions</h2>
          <Panel>
            <TransactionList transactions={transactions} variant="parent" />
          </Panel>
        </section>
      </div>

      {/* Floating AI coach */}
      <div className="no-print">
        <CoachWidget transactions={transactions} variant="parent" />
      </div>
    </main>
  );
}

function SummaryCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 card-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <Icon size={16} style={{ color: accent }} />
      </div>
      <p className="tnum mt-2 text-xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="print-avoid-break rounded-2xl border border-slate-100 bg-white p-5 card-shadow">
      {title && (
        <h3 className="mb-4 text-sm font-extrabold text-slate-900">{title}</h3>
      )}
      {children}
    </section>
  );
}

function ParentSkeleton() {
  return (
    <main className="min-h-dvh bg-slate-50">
      <div className="h-16 border-b border-slate-200 bg-white" />
      <div className="mx-auto max-w-5xl space-y-4 px-5 py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="skeleton h-80 rounded-2xl lg:col-span-2" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-trust-600 text-white">
        <ShieldCheck size={28} />
      </span>
      <h1 className="mt-5 text-xl font-extrabold text-slate-900">No data yet</h1>
      <p className="mt-2 max-w-xs text-sm text-slate-500">
        Load some transactions first to see the parent dashboard.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-2xl bg-trust-600 px-6 py-3 text-sm font-bold text-white active:scale-95"
      >
        Go to upload
      </Link>
    </main>
  );
}
