"use client";

import { Languages } from "lucide-react";
import { useLang } from "@/lib/i18n";

// Floating EN / اردو switch. Fixed top-right, on every page.
export default function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="no-print fixed bottom-5 left-5 z-50 flex items-center rounded-full bg-white/95 p-0.5 text-xs font-bold shadow-lg backdrop-blur ring-1 ring-slate-200">
      <Languages size={13} className="mx-1.5 text-slate-400" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`rounded-full px-2.5 py-1 transition ${
          lang === "en" ? "bg-brand-600 text-white" : "text-slate-500"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("ur")}
        aria-pressed={lang === "ur"}
        className={`rounded-full px-2.5 py-1 transition ${
          lang === "ur" ? "bg-brand-600 text-white" : "text-slate-500"
        }`}
      >
        اردو
      </button>
    </div>
  );
}
