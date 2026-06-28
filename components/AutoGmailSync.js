"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, Check, Mail, X } from "lucide-react";
import { mergeTransactions } from "@/lib/store";

const DISMISS_KEY = "yp_gmail_prompt_dismissed";
const LAST_KEY = "yp_gmail_lastsync";
const CONNECTED_KEY = "yp_gmail_connected";
const THROTTLE_MS = 10 * 60 * 1000; // don't re-sync on navigation within 10 min

// Connect Gmail once → silently fetch on load + poll for new bank emails.
// Uses the server-side refresh token, so no re-auth. The toast always
// resolves and auto-hides (watchdog guards against a slow request).
const POLL_MS = 5 * 60 * 1000;

export default function AutoGmailSync() {
  const [phase, setPhase] = useState("hidden"); // hidden | syncing | done
  const [added, setAdded] = useState(0);
  const hideTimer = useRef(null);
  const watchdog = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let timer;

    const clearTimers = () => {
      clearTimeout(hideTimer.current);
      clearTimeout(watchdog.current);
    };

    // silent=true → no spinner toast (used for the first load so a non-connected
    // user never sees a "Checking…" flash that vanishes). The result toast
    // still shows when there's actually something synced.
    async function sync(silent) {
      if (cancelled) return false;
      clearTimers();
      if (!silent) {
        setPhase("syncing");
        watchdog.current = setTimeout(() => !cancelled && setPhase("hidden"), 12000);
      }

      try {
        const days = parseInt(window.localStorage.getItem("yp_gmail_days"), 10) || 30;
        const res = await fetch(`/api/gmail/fetch?days=${days}`);
        if (cancelled) return false;
        if (res.status === 401) {
          clearTimers();
          try {
            localStorage.removeItem(CONNECTED_KEY);
          } catch {}
          // Not connected — offer a one-click connect prompt (unless dismissed).
          const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
          setPhase(silent && !dismissed ? "connect" : "hidden");
          return false;
        }
        if (res.ok) {
          const data = await res.json();
          const key = "youthpay_transactions_v1";
          const before = JSON.parse(localStorage.getItem(key) || "[]").length;
          if (data.transactions?.length) mergeTransactions(data.transactions);
          const after = JSON.parse(localStorage.getItem(key) || "[]").length;
          try {
            localStorage.setItem(LAST_KEY, String(Date.now()));
            localStorage.setItem(CONNECTED_KEY, "1");
          } catch {}
          if (cancelled) return false;
          clearTimers();
          setAdded(Math.max(0, after - before));
          setPhase("done");
          hideTimer.current = setTimeout(() => !cancelled && setPhase("hidden"), 4000);
          return true;
        }
      } catch {
        /* ignore */
      }
      clearTimers();
      setPhase("hidden");
      return false;
    }

    (async () => {
      const last = Number(localStorage.getItem(LAST_KEY) || 0);
      const wasConnected = localStorage.getItem(CONNECTED_KEY) === "1";
      const fresh = Date.now() - last < THROTTLE_MS;

      // Skip the fetch on quick navigation if we synced recently; just resume
      // polling. Otherwise do a silent first sync.
      let connected = wasConnected;
      if (!(fresh && wasConnected)) {
        connected = await sync(true);
      }
      if (connected && !cancelled) timer = setInterval(() => sync(false), POLL_MS);
    })();

    return () => {
      cancelled = true;
      clearInterval(timer);
      clearTimeout(hideTimer.current);
      clearTimeout(watchdog.current);
    };
  }, []);

  if (phase === "hidden") return null;

  if (phase === "connect") {
    return (
      <div className="no-print fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 animate-fade-up">
        <div className="flex items-center gap-3 rounded-full border border-indigo-200 bg-white/95 py-2 pl-3 pr-2 shadow-lg backdrop-blur">
          <Mail size={15} className="text-indigo-600" />
          <span className="text-sm font-semibold text-slate-700">Connect Gmail to auto-sync</span>
          <a
            href="/api/gmail/auth"
            className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-700"
          >
            Connect
          </a>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem(DISMISS_KEY, "1");
              } catch {}
              setPhase("hidden");
            }}
            aria-label="Dismiss"
            className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="no-print fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 animate-fade-up">
      <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white/95 py-2 pl-2.5 pr-4 shadow-lg backdrop-blur">
        {phase === "syncing" ? (
          <>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white">
              <RefreshCw size={14} className="animate-spin" />
            </span>
            <span className="text-sm font-semibold text-slate-700">Checking Gmail…</span>
          </>
        ) : (
          <>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Check size={15} strokeWidth={2.6} />
            </span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <Mail size={13} className="text-slate-400" />
              {added > 0 ? `${added} new transaction${added > 1 ? "s" : ""} synced` : "Gmail up to date"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
