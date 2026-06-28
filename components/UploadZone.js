"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  UploadCloud,
  Sparkles,
  Loader2,
  FileWarning,
  CheckCircle2,
  FolderUp,
  Trash2,
  Mail,
} from "lucide-react";
import { getMockEmails } from "@/data/mock-emails";
import { mergeTransactions, clearTransactions, getTransactions } from "@/lib/store";
import LoadingOverlay from "@/components/LoadingOverlay";

const MIN_LOADER_MS = 2000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const minWait = (t0) => sleep(Math.max(0, MIN_LOADER_MS - (Date.now() - t0)));

export default function UploadZone({ onComplete }) {
  const [status, setStatus] = useState("idle"); // idle | loading | error | done
  const [message, setMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [total, setTotal] = useState(0);
  const [days, setDays] = useState(30); // Gmail fetch window
  const inputRef = useRef(null);
  const folderRef = useRef(null);

  // Reflect any data already stored from a previous visit, and restore the
  // chosen Gmail window (persists across the OAuth redirect round-trip).
  useEffect(() => {
    setTotal(getTransactions().length);
    const saved = parseInt(window.localStorage.getItem("yp_gmail_days"), 10);
    if (saved > 0) setDays(saved);
    // webkitdirectory must be set on the DOM node — React drops it from JSX.
    if (folderRef.current) {
      folderRef.current.setAttribute("webkitdirectory", "");
      folderRef.current.setAttribute("directory", "");
      folderRef.current.setAttribute("mozdirectory", "");
    }
  }, []);

  // Accumulate across uploads instead of overwriting — lets users add emails
  // in several batches (or whole folders) without losing earlier data.
  const finish = useCallback(
    (transactions, justAdded) => {
      const merged = mergeTransactions(transactions);
      setTotal(merged.length);
      setStatus("done");
      setMessage(
        `Added ${justAdded}. ${merged.length} transaction${merged.length === 1 ? "" : "s"} total.`
      );
      onComplete?.(merged);
    },
    [onComplete]
  );

  function reset() {
    clearTransactions();
    setTotal(0);
    setStatus("idle");
    setMessage("");
    onComplete?.([]);
  }

  // Rotate fun/status messages while an async op runs (KodeKloud-style).
  function startTips(lines) {
    let i = 0;
    setMessage(lines[0]);
    const id = setInterval(() => {
      i = (i + 1) % lines.length;
      setMessage(lines[i]);
    }, 1900);
    return () => clearInterval(id);
  }

  // Pull emails from a connected Gmail account through the parse pipeline.
  const fetchFromGmail = useCallback(async () => {
    setStatus("loading");
    const t0 = Date.now();
    const d = parseInt(window.localStorage.getItem("yp_gmail_days"), 10) || days || 30;
    const stop = startTips([
      `Connecting to Gmail…`,
      `Reading last ${d} days of bank emails…`,
      `Tip: most Pakistani banks alert by SMS too, paste those here.`,
      `Parsing transactions…`,
      `Did you know? The 50/30/20 rule keeps spending balanced.`,
      `Categorizing spends & spotting subscriptions…`,
      `Converting any crypto to PKR…`,
      `Almost there…`,
    ]);
    try {
      const res = await fetch(`/api/gmail/fetch?days=${d}`);
      if (res.status === 401) {
        stop();
        setStatus("error");
        setMessage("Gmail not connected. Click Connect Gmail first.");
        return;
      }
      if (!res.ok) throw new Error((await res.json()).detail || "Gmail fetch failed");
      const data = await res.json();
      await minWait(t0);
      stop();
      if (!data.transactions || data.transactions.length === 0) {
        setStatus("error");
        setMessage(`Scanned ${data.scanned || 0} email(s) but found no transaction alerts.`);
        return;
      }
      finish(data.transactions, `${data.transactions.length} from Gmail (last ${data.days}d)`);
    } catch (e) {
      await minWait(t0);
      stop();
      setStatus("error");
      setMessage(e.message || "Gmail fetch failed.");
    }
  }, [finish, days]);

  // React to the OAuth redirect (?gmail=connected|denied|notconfigured|error).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const g = params.get("gmail");
    if (!g) return;
    // Clean the URL so a refresh doesn't re-trigger.
    window.history.replaceState({}, "", window.location.pathname);
    if (g === "connected") {
      fetchFromGmail();
    } else if (g === "notconfigured") {
      setStatus("error");
      setMessage(
        "Gmail auto-fetch isn't configured. Add Google OAuth credentials to .env (see setup notes)."
      );
    } else if (g === "denied") {
      setStatus("error");
      setMessage("Gmail access was denied. You can still upload .eml files.");
    } else if (g === "error") {
      setStatus("error");
      setMessage("Gmail connection failed. Check OAuth credentials and try again.");
    }
  }, [fetchFromGmail]);

  async function loadMock() {
    setStatus("loading");
    const t0 = Date.now();
    const stop = startTips([
      "Loading sample Pakistani bank emails…",
      "Parsing HBL, UBL, Easypaisa, JazzCash & more…",
      "Tip: real bank alerts work too — connect Gmail or paste an SMS.",
      "Categorizing spends & detecting subscriptions…",
      "Building your insights…",
    ]);
    try {
      const emails = getMockEmails().map((e) => ({
        id: e.id,
        subject: e.subject,
        sender: e.sender,
        body: e.raw_body,
        received_at: e.received_at,
        source: e.source,
      }));
      const res = await fetch("/api/parse-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails, source: "sample" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Parse failed");
      const data = await res.json();
      const txs = data.transactions || [];
      await minWait(t0);
      stop();
      finish(txs, `${txs.length} sample`);
    } catch (e) {
      await minWait(t0);
      stop();
      setStatus("error");
      setMessage(e.message || "Something went wrong. Please try again.");
    }
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList).filter((f) =>
      /\.eml$|\.txt$/i.test(f.name)
    );
    if (files.length === 0) {
      setStatus("error");
      setMessage("No .eml files found. Drop bank email exports or pick a folder of them.");
      return;
    }
    setStatus("loading");
    const t0 = Date.now();
    setMessage(`Reading ${files.length} email${files.length > 1 ? "s" : ""}…`);
    try {
      // Upload in chunks so very large folders don't hit request-size limits.
      const CHUNK = 40;
      let added = [];
      for (let i = 0; i < files.length; i += CHUNK) {
        const fd = new FormData();
        files.slice(i, i + CHUNK).forEach((f) => fd.append("files", f));
        const res = await fetch("/api/upload-email", { method: "POST", body: fd });
        if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
        const data = await res.json();
        added = added.concat(data.transactions || []);
        setMessage(`Parsed ${Math.min(i + CHUNK, files.length)}/${files.length} emails…`);
      }
      if (added.length === 0) {
        throw new Error(
          "No transaction alerts found. These emails (limit changes, OTPs, login or statement notices) don't contain a spend. Upload a bank alert that shows a purchase, debit or credit."
        );
      }
      await minWait(t0);
      finish(added, `${added.length} from ${files.length} file${files.length === 1 ? "" : "s"}`);
    } catch (e) {
      await minWait(t0);
      setStatus("error");
      setMessage(e.message || "Upload failed. Please try again.");
    }
  }

  const loading = status === "loading";

  return (
    <div className="w-full">
      {loading && <LoadingOverlay message={message} />}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload .eml bank email files"
        onClick={() => !loading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !loading) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!loading) handleFiles(e.dataTransfer.files);
        }}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragOver
            ? "border-brand-500 bg-brand-50"
            : "border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-50/40"
        } ${loading ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".eml,.txt,message/rfc822"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {/* Folder picker — webkitdirectory set via ref (React strips the JSX attr) */}
        <input
          ref={folderRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-pink-500 text-white shadow-lg shadow-brand-200 transition-transform group-hover:scale-105">
          {loading ? (
            <Loader2 size={26} className="animate-spin" />
          ) : (
            <UploadCloud size={26} strokeWidth={2.2} />
          )}
        </span>
        <p className="mt-4 text-base font-bold text-slate-900">
          {loading ? "Working…" : "Drop your bank emails here"}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Drag &amp; drop <span className="font-semibold">many .eml</span> files, or click to
          select multiple
        </p>
      </div>

      {/* Bulk folder upload */}
      <button
        type="button"
        onClick={() => !loading && folderRef.current?.click()}
        disabled={loading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-brand-400 hover:bg-brand-50/40 active:scale-[0.98] disabled:opacity-60"
      >
        <FolderUp size={17} strokeWidth={2.3} className="text-brand-600" />
        Upload a whole folder of emails
      </button>

      <div className="my-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-300">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="mb-3 flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => {
            if (loading) return;
            window.localStorage.setItem("yp_gmail_days", String(days));
            window.location.href = "/api/gmail/auth";
          }}
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 transition hover:border-brand-400 hover:bg-brand-50/40 active:scale-[0.98] disabled:opacity-60"
        >
          <Mail size={18} strokeWidth={2.3} className="text-brand-600" />
          Connect Gmail &amp; auto-fetch
        </button>
        <label className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500">
          Last
          <input
            type="number"
            min={1}
            max={3650}
            value={days}
            onChange={(e) => {
              const v = Math.max(1, Math.min(3650, parseInt(e.target.value, 10) || 1));
              setDays(v);
              window.localStorage.setItem("yp_gmail_days", String(v));
            }}
            aria-label="Number of days of Gmail history to fetch"
            className="w-12 rounded-lg border border-slate-200 px-1.5 py-2 text-center text-sm font-bold text-slate-800 tnum focus:border-brand-400 focus:outline-none"
          />
          days
        </label>
      </div>

      <button
        type="button"
        onClick={loadMock}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 via-fuchsia-600 to-pink-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-200 transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Sparkles size={18} strokeWidth={2.4} />
        )}
        Load Sample Data (25 emails)
      </button>

      {status === "error" && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          <FileWarning size={16} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {status === "loading" && (
        <p className="mt-3 text-center text-sm text-slate-400">{message}</p>
      )}
      {status === "done" && (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700">
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {(total > 0 || status === "done") && (
        <button
          type="button"
          onClick={reset}
          disabled={loading}
          className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-red-500 disabled:opacity-60"
        >
          <Trash2 size={13} /> Clear all data &amp; start over
        </button>
      )}
    </div>
  );
}
