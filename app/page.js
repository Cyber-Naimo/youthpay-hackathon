"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  Brain,
  ArrowRight,
  Users,
  Smartphone,
  UploadCloud,
  MessageSquareText,
  PencilLine,
  Bitcoin,
} from "lucide-react";
import UploadZone from "@/components/UploadZone";
import PasteSMS from "@/components/PasteSMS";
import ManualEntry from "@/components/ManualEntry";
import { hasData } from "@/lib/store";
import { useLang } from "@/lib/i18n";

export default function Landing() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("upload");
  const { t } = useLang();

  useEffect(() => {
    setReady(hasData());
  }, []);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#FAFAFC]">
      {/* ambient aurora blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-indigo-300/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 right-0 h-80 w-80 rounded-full bg-fuchsia-300/35 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col px-5 py-6 sm:px-8">
        {/* Nav */}
        <header className="flex items-center justify-between">
          <Logo />
          <span className="hidden items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm ring-1 ring-slate-100 sm:flex">
            <Smartphone size={13} /> {t("tagline")}
          </span>
        </header>

        {/* Hero + upload */}
        <div className="mt-10 grid items-center gap-10 lg:mt-16 lg:grid-cols-2">
          <section className="animate-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              <Sparkles size={13} /> {t("badge")}
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl font-[family-name:var(--font-jakarta)]">
              {t("hero1")}{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                {t("hero2")}
              </span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600">
              {t("heroSub")}
            </p>

            <ul className="mt-6 flex flex-wrap gap-2.5">
              {[
                { icon: Brain, label: t("fAi") },
                { icon: ShieldCheck, label: t("fDup") },
                { icon: Users, label: t("fViews") },
                { icon: Bitcoin, label: t("fWeb3") },
              ].map((f) => (
                <li
                  key={f.label}
                  className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100"
                >
                  <f.icon size={15} className="text-indigo-600" /> {f.label}
                </li>
              ))}
            </ul>

            {ready && (
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <DashLink
                  href="/teen"
                  className="from-indigo-600 via-violet-600 to-fuchsia-500"
                  title={t("teenDash")}
                  sub={t("teenDashSub")}
                />
                <DashLink
                  href="/parent"
                  className="from-trust-600 to-trust-700"
                  title={t("parentDash")}
                  sub={t("parentDashSub")}
                />
              </div>
            )}
          </section>

          {/* Add-data card with method tabs */}
          <div className="animate-fade-up">
            <section className="rounded-3xl bg-white p-5 card-shadow-lg sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">{t("getStarted")}</h2>
              <p className="mb-4 text-sm text-slate-500">
                Pick how you want to add your spending.
              </p>

              {/* Method tabs */}
              <div className="mb-5 grid grid-cols-3 gap-2">
                <MethodTab
                  active={tab === "upload"}
                  onClick={() => setTab("upload")}
                  icon={UploadCloud}
                  label="Email & Gmail"
                />
                <MethodTab
                  active={tab === "sms"}
                  onClick={() => setTab("sms")}
                  icon={MessageSquareText}
                  label="Paste SMS"
                />
                <MethodTab
                  active={tab === "manual"}
                  onClick={() => setTab("manual")}
                  icon={PencilLine}
                  label="Manual"
                />
              </div>

              {tab === "upload" && <UploadZone onComplete={() => setReady(true)} />}
              {tab === "sms" && <PasteSMS onComplete={() => setReady(true)} />}
              {tab === "manual" && (
                <ManualEntry onComplete={() => setReady(true)} alwaysOpen />
              )}

              {ready && (
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
                  <Link
                    href="/teen"
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 active:scale-95"
                  >
                    {t("teenView")} <ArrowRight size={15} />
                  </Link>
                  <Link
                    href="/parent"
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-trust-600 px-4 py-2.5 text-sm font-bold text-white transition active:scale-95"
                  >
                    {t("parentView")} <ArrowRight size={15} />
                  </Link>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* How it works — for first-time visitors / judges */}
        <section className="mt-16">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 font-[family-name:var(--font-jakarta)]">
              How it works
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              From raw bank alerts to clear money insights, in four steps.
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: UploadCloud,
                step: "1",
                title: "Add your data",
                text: "Connect Gmail, upload .eml files, paste an SMS, or add manually. Or click Load Sample to try instantly.",
              },
              {
                icon: Brain,
                step: "2",
                title: "We parse it",
                text: "8 Pakistani banks + wallets + Binance crypto are read by smart rules, with an AI fallback for anything unusual.",
              },
              {
                icon: ShieldCheck,
                step: "3",
                title: "We organize it",
                text: "Every transaction is categorized, duplicates are flagged, and recurring subscriptions are detected automatically.",
              },
              {
                icon: Sparkles,
                step: "4",
                title: "You get insights",
                text: "Health score, budgets, savings goals, needs-vs-wants, and personalized recommendations, for teens and parents.",
              },
            ].map((s) => (
              <li
                key={s.step}
                className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white">
                    <s.icon size={18} strokeWidth={2.2} />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Step {s.step}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-extrabold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-sm leading-snug text-slate-500">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-16 border-t border-slate-200 pt-6">
          <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-xs font-black text-white">
                B
              </span>
              <span className="text-sm font-extrabold text-slate-700">
                Bachat <span className="font-medium text-slate-400">by YouthPay</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Saving made simple · Built for Pakistani teens · Amounts in PKR (Rs.)
            </p>
          </div>
          <p className="mt-4 text-center text-[11px] text-slate-300">
            © {new Date().getFullYear()} Bachat · YouthPay Financial Intelligence Engine
          </p>
        </footer>
      </div>
    </main>
  );
}

function MethodTab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-bold transition ${
        active
          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
          : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-slate-50"
      }`}
    >
      <Icon size={18} strokeWidth={2.2} />
      {label}
    </button>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Bachat home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white shadow-sm">
        <span className="text-base font-black font-[family-name:var(--font-jakarta)]">B</span>
      </span>
      <div className="leading-none">
        <p className="text-lg font-extrabold tracking-tight font-[family-name:var(--font-jakarta)]">
          Bachat
        </p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          by YouthPay
        </p>
      </div>
    </Link>
  );
}

function DashLink({ href, className, title, sub }) {
  return (
    <Link
      href={href}
      className={`group flex flex-1 items-center justify-between rounded-2xl bg-gradient-to-r ${className} px-5 py-3.5 text-white shadow-lg transition active:scale-[0.98]`}
    >
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs text-white/80">{sub}</span>
      </span>
      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
