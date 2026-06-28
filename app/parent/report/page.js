"use client";

import Link from "next/link";
import { ArrowLeft, Printer, ShieldCheck, Lightbulb } from "lucide-react";
import { useTransactions } from "@/lib/useTransactions";
import {
  computeStats,
  detectRecurring,
  generateRecommendations,
  healthLabel,
} from "@/lib/insights";
import { formatPKR } from "@/lib/format";
import ParentGate from "@/components/ParentGate";
import { format } from "date-fns";

const NEEDS = new Set(["Food & Dining", "Transport", "Education", "Health", "Utilities"]);
const WANTS = new Set(["Shopping", "Entertainment"]);

export default function ReportPage() {
  return (
    <ParentGate>
      <Report />
    </ParentGate>
  );
}

function Report() {
  const { transactions, loading } = useTransactions();

  if (loading) return <div className="min-h-dvh bg-white" />;
  if (!transactions.length) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-white px-6 text-center">
        <p className="text-slate-500">No data yet to build a report.</p>
        <Link href="/" className="rounded-xl bg-trust-600 px-5 py-2.5 text-sm font-bold text-white">
          Add data
        </Link>
      </main>
    );
  }

  const stats = computeStats(transactions);
  const subs = detectRecurring(transactions);
  const recs = generateRecommendations(transactions, {});
  const hl = healthLabel(stats.healthScore);
  const net = stats.totalReceived - stats.totalSpent;

  const dates = transactions.map((t) => new Date(t.date).getTime());
  const from = format(new Date(Math.min(...dates)), "d MMM yyyy");
  const to = format(new Date(Math.max(...dates)), "d MMM yyyy");

  let needs = 0, wants = 0;
  for (const b of stats.breakdown) {
    if (NEEDS.has(b.category)) needs += b.amount;
    else if (WANTS.has(b.category)) wants += b.amount;
  }
  const classified = needs + wants;
  const wantsPct = classified ? Math.round((wants / classified) * 100) : 0;

  const recent = transactions
    .filter((t) => !t.is_duplicate)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20);

  return (
    <main className="min-h-dvh bg-slate-100 py-6 print:bg-white print:py-0">
      {/* Toolbar (screen only) */}
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between px-4">
        <Link href="/parent" className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> Back
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-trust-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-trust-700"
        >
          <Printer size={16} /> Download PDF
        </button>
      </div>

      {/* The document */}
      <article className="mx-auto max-w-3xl bg-white p-8 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        {/* Header */}
        <header className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-[family-name:var(--font-jakarta)]">
              Teen Spending Report
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Period: {from} – {to}
            </p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 text-base font-extrabold text-trust-700">
              <ShieldCheck size={18} /> YouthPay
            </p>
            <p className="text-xs text-slate-400">
              Generated {format(new Date(), "d MMM yyyy")}
            </p>
          </div>
        </header>

        {/* 1. Overview */}
        <Section n="1" title="Overview">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Total spent" value={formatPKR(stats.totalSpent)} />
            <Metric label="Money received" value={formatPKR(stats.totalReceived)} good />
            <Metric label={net >= 0 ? "Saved (net)" : "Overspent"} value={formatPKR(Math.abs(net))} bad={net < 0} />
            <Metric label="Transactions" value={String(stats.txCount)} />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <span className="text-sm font-semibold text-slate-600">Financial health score</span>
            <span className="tnum text-lg font-extrabold text-slate-900">
              {stats.healthScore}/100 <span className="text-sm font-bold text-trust-700">· {hl.label}</span>
            </span>
          </div>
        </Section>

        {/* 2. Where the money goes */}
        <Section n="2" title="Where the money goes">
          <p className="mb-3 text-sm text-slate-600">
            Top spending category: <strong>{stats.topCategory ? stats.topCategory.category : "—"}</strong>
            {stats.topCategory ? ` (${formatPKR(stats.topCategory.amount)})` : ""}.
            Needs vs wants: <strong>{100 - wantsPct}% needs</strong>, <strong>{wantsPct}% wants</strong>.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3 font-semibold">Category</th>
                <th className="py-2 pr-3 text-right font-semibold">Amount</th>
                <th className="w-16 py-2 text-right font-semibold">Share</th>
              </tr>
            </thead>
            <tbody>
              {stats.breakdown.map((b) => {
                const pct = Math.round((b.amount / stats.totalSpent) * 100);
                return (
                  <tr key={b.category} className="border-b border-slate-100">
                    <td className="py-2 pr-3 text-slate-700">{b.category}</td>
                    <td className="tnum py-2 pr-3 text-right font-semibold text-slate-900">{formatPKR(b.amount)}</td>
                    <td className="tnum py-2 text-right text-slate-500">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>

        {/* 3. Habits */}
        <Section n="3" title="Spending habits">
          <ul className="space-y-1.5 text-sm text-slate-700">
            <li>• Daily average spend: <strong>{formatPKR(stats.dailyAverage)}</strong></li>
            <li>• Weekend spending: <strong>{Math.round(stats.weekendRatio * 100)}%</strong> of total</li>
            <li>• Late-night impulse buys (after 10pm, &lt;Rs 500): <strong>{stats.impulseCount}</strong> ({formatPKR(stats.impulseSpend)})</li>
            {stats.topMerchant && (
              <li>• Most visited: <strong>{stats.topMerchant.name}</strong> ({stats.topMerchant.visits}×, {formatPKR(stats.topMerchant.spend)})</li>
            )}
            {stats.biggest && (
              <li>• Biggest single purchase: <strong>{formatPKR(stats.biggest.amount)}</strong> at {stats.biggest.merchant_name}</li>
            )}
          </ul>
        </Section>

        {/* 4. Recurring */}
        {subs.length > 0 && (
          <Section n="4" title="Recurring charges & subscriptions">
            <table className="w-full text-sm">
              <tbody>
                {subs.map((s) => (
                  <tr key={s.merchant} className="border-b border-slate-100">
                    <td className="py-2 text-slate-700">{s.merchant}</td>
                    <td className="py-2 text-slate-400">{s.count}× · {s.category}</td>
                    <td className="tnum py-2 text-right font-semibold text-slate-900">{formatPKR(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* 5. Recent transactions */}
        <Section n={subs.length > 0 ? "5" : "4"} title="Recent transactions">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-16" />
              <col />
              <col className="w-28" />
              <col className="w-28" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 pr-3 font-semibold">Merchant</th>
                <th className="py-2 pr-3 font-semibold">Category</th>
                <th className="py-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap text-slate-500">{format(new Date(t.date), "d MMM")}</td>
                  <td className="py-2 pr-3 font-medium text-slate-800">{t.merchant_name}</td>
                  <td className="py-2 pr-3 text-slate-400">{t.category}</td>
                  <td className={`tnum py-2 text-right font-semibold whitespace-nowrap ${t.type === "credit" ? "text-green-600" : "text-slate-900"}`}>
                    {t.type === "credit" ? "+" : "-"}{formatPKR(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* 6. YouthPay feedback (last) */}
        <section className="print-avoid-break mt-6 rounded-2xl border-2 border-trust-600 bg-trust-50 p-5">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-trust-900">
            <Lightbulb size={18} /> What YouthPay suggests
          </h2>
          <ol className="mt-3 space-y-2.5">
            {recs.map((r, i) => (
              <li key={r.id} className="text-sm text-slate-700">
                <strong>{i + 1}. {r.title}.</strong> {r.text}
              </li>
            ))}
          </ol>
          <p className="mt-4 border-t border-trust-200 pt-3 text-xs text-slate-500">
            This report is generated from your teen's transaction alerts. YouthPay helps teenagers
            in Pakistan build healthy money habits. Amounts in PKR (Rs.).
          </p>
        </section>
      </article>
    </main>
  );
}

function Section({ n, title, children }) {
  return (
    <section className="print-avoid-break mt-6">
      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-slate-400">
        {n}. {title}
      </h2>
      {children}
    </section>
  );
}

function Metric({ label, value, good, bad }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-[11px] font-semibold text-slate-400">{label}</p>
      <p className={`tnum mt-0.5 text-lg font-extrabold ${bad ? "text-red-600" : good ? "text-green-600" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}
