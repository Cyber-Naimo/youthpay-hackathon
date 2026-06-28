"use client";

import { Sparkles } from "lucide-react";

// Beautiful full-screen loader: spinning gradient ring + rotating message +
// indeterminate progress bar. Shown while fetching / parsing.
export default function LoadingOverlay({ message = "Working…", title = "YouthPay" }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-fade-up rounded-3xl bg-white p-8 text-center shadow-2xl">
        {/* Gradient ring spinner */}
        <div className="relative mx-auto h-20 w-20">
          <div
            className="absolute inset-0 animate-spin rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg,#6366f1,#a855f7,#d946ef,#ec4899,#6366f1)",
              WebkitMask: "radial-gradient(farthest-side, transparent 62%, #000 64%)",
              mask: "radial-gradient(farthest-side, transparent 62%, #000 64%)",
              animationDuration: "1s",
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={26} className="animate-pulse text-indigo-600" strokeWidth={2.3} />
          </div>
        </div>

        <p className="mt-5 text-base font-extrabold tracking-tight text-slate-900 font-[family-name:var(--font-jakarta)]">
          {title}
        </p>
        <p className="mt-1.5 min-h-[2.5rem] text-sm leading-snug text-slate-500">{message}</p>

        {/* Indeterminate progress bar */}
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="loader-bar h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
        </div>
      </div>
    </div>
  );
}
