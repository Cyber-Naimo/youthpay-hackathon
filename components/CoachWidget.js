"use client";

import { useState } from "react";
import { Bot, X, MessageCircle } from "lucide-react";
import CoachChat from "@/components/CoachChat";
import { useLang } from "@/lib/i18n";

// Floating AI coach launcher + popup chat panel (Intercom-style).
export default function CoachWidget({ transactions = [], variant = "teen" }) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  const grad =
    variant === "parent" ? "from-trust-500 to-trust-700" : "from-indigo-600 to-fuchsia-500";

  return (
    <>
      {/* Popup panel */}
      {open && (
        <div
          role="dialog"
          aria-label={t("coach")}
          className="fixed inset-x-3 bottom-24 z-[60] sm:inset-x-auto sm:right-5 sm:bottom-24 sm:w-[380px]"
        >
          <div className="relative animate-fade-up">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close coach"
              className="absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-slate-700"
            >
              <X size={15} />
            </button>
            <CoachChat transactions={transactions} variant={variant} />
          </div>
        </div>
      )}

      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close coach" : t("coach")}
        aria-expanded={open}
        className={`fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${grad} text-white shadow-xl shadow-black/20 transition active:scale-90`}
      >
        {open ? <X size={22} /> : <Bot size={24} strokeWidth={2.1} />}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white">
            <MessageCircle size={10} className="text-indigo-600" fill="currentColor" />
          </span>
        )}
      </button>
    </>
  );
}
