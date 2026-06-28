import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";

export const metadata = { title: "Page not found — YouthPay" };

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#FAFAFC] px-6 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-300/30 blur-3xl"
      />

      <div className="relative">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white shadow-lg shadow-indigo-200">
          <Compass size={30} strokeWidth={2.1} />
        </span>

        <p className="mt-6 text-6xl font-extrabold tracking-tight text-slate-900 font-[family-name:var(--font-jakarta)]">
          404
        </p>
        <h1 className="mt-2 text-xl font-extrabold text-slate-900">Page not found</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">
          That page doesn&apos;t exist. Let&apos;s get you back to your money.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 active:scale-95"
          >
            <ArrowLeft size={16} /> Back home
          </Link>
          <Link
            href="/teen"
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-300 active:scale-95"
          >
            Open dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
