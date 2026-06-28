"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n";

// AI Spending Coach chat. Sends the user's transactions + question to
// /api/coach (Gemini, with deterministic fallback) and renders the thread.
export default function CoachChat({ transactions = [], variant = "teen" }) {
  const { t } = useLang();
  const [messages, setMessages] = useState([
    { role: "assistant", content: t("coachGreeting") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  async function send(question) {
    const q = (question || "").trim();
    if (!q || loading) return;
    const history = messages.filter((m, i) => i > 0); // drop greeting
    const next = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, transactions, history }),
      });
      const data = await res.json();
      setMessages([
        ...next,
        {
          role: "assistant",
          content: data.answer || "Sorry, I couldn't answer that. Try rephrasing.",
        },
      ]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const accent = variant === "parent" ? "text-trust-600" : "text-brand-600";

  return (
    <section className="rounded-3xl bg-white p-5 card-shadow">
      <div className="mb-1 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${variant === "parent" ? "from-trust-500 to-trust-700" : "from-brand-600 to-pink-500"} text-white`}>
          <Bot size={17} strokeWidth={2.2} />
        </span>
        <h3 className="text-sm font-extrabold text-slate-900">{t("coach")}</h3>
      </div>
      <p className="mb-3 text-xs text-slate-500">{t("coachSub")}</p>

      {/* Thread */}
      <div className="nice-scroll mb-3 max-h-72 space-y-2.5 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <p
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-snug ${
                m.role === "user"
                  ? "rounded-br-md bg-brand-600 text-white"
                  : "rounded-bl-md bg-slate-100 text-slate-800"
              }`}
            >
              {m.content}
            </p>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <p className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2 text-sm text-slate-500">
              <Loader2 size={14} className="animate-spin" /> Thinking…
            </p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {[t("sug1"), t("sug2"), t("sug3")].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              <Sparkles size={12} /> {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("coachPlaceholder")}
          className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${variant === "parent" ? "from-trust-500 to-trust-700" : "from-brand-600 to-pink-500"} text-white transition active:scale-95 disabled:opacity-50`}
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </form>
    </section>
  );
}
