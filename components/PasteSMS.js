"use client";

import { useState } from "react";
import { MessageSquareText, Loader2, CheckCircle2, FileWarning } from "lucide-react";
import { mergeTransactions } from "@/lib/store";
import { useLang } from "@/lib/i18n";

// Paste-a-bank-SMS ingestion. Most Pakistani bank alerts arrive as SMS, not
// email — this reuses the exact same parser pipeline (regex -> Gemini).
export default function PasteSMS({ onComplete }) {
  const { t } = useLang();
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error | done
  const [message, setMessage] = useState("");

  async function parse() {
    const raw = text.trim();
    if (!raw) return;
    // Split into separate messages on blank lines; otherwise treat as one.
    const blocks = raw.includes("\n\n")
      ? raw.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
      : [raw];
    const emails = blocks.map((body, i) => ({
      id: `sms-${i}`,
      subject: "SMS",
      sender: "sms",
      body,
      received_at: new Date().toISOString(),
    }));

    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/parse-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails, source: "sms" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Parse failed");
      const data = await res.json();
      const txs = data.transactions || [];
      if (txs.length === 0) {
        setStatus("error");
        setMessage("No transaction found in that SMS. Make sure it's a bank spend/credit alert.");
        return;
      }
      const merged = mergeTransactions(txs);
      setStatus("done");
      setMessage(`Added ${txs.length}. ${merged.length} total.`);
      setText("");
      onComplete?.(merged);
    } catch (e) {
      setStatus("error");
      setMessage(e.message || "Could not parse SMS.");
    }
  }

  const loading = status === "loading";

  return (
    <div className="rounded-3xl bg-white p-5 card-shadow-lg">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <MessageSquareText size={18} className="text-brand-600" /> {t("pasteSms")}
      </h2>
      <p className="mb-3 mt-1 text-sm text-slate-500">{t("pasteSmsSub")}</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder={t("pasteHint")}
        className="nice-scroll w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none"
      />

      <button
        type="button"
        onClick={parse}
        disabled={loading || !text.trim()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-pink-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-200 transition active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? <Loader2 size={17} className="animate-spin" /> : <MessageSquareText size={17} />}
        {t("parseSms")}
      </button>

      {status === "error" && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <FileWarning size={16} className="mt-0.5 shrink-0" /> <span>{message}</span>
        </div>
      )}
      {status === "done" && (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700">
          <CheckCircle2 size={16} /> {message}
        </div>
      )}
    </div>
  );
}
