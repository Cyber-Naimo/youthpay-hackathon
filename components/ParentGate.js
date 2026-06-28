"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Delete, ArrowLeft } from "lucide-react";

// Lightweight access gate for the parent dashboard. Parent sets a 4-digit PIN
// (stored in this browser); the teen can't open the parent view without it.
// Demo-grade only — production would use Supabase auth + parent invite codes.
const PIN_KEY = "yp_parent_pin_v1";

export default function ParentGate({ children }) {
  const [phase, setPhase] = useState("loading"); // loading | set | enter | open
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  // Lock on EVERY entry to the parent view — the teen can never slip in.
  // (No session persistence: re-mounting the route always asks again.)
  useEffect(() => {
    const saved = window.localStorage.getItem(PIN_KEY);
    setPhase(saved ? "enter" : "set");
  }, []);

  function press(d) {
    setError("");
    if (confirmMode()) {
      if (confirm.length < 4) setConfirm((c) => (c + d).slice(0, 4));
    } else if (pin.length < 4) {
      setPin((p) => (p + d).slice(0, 4));
    }
  }
  function confirmMode() {
    return phase === "set" && pin.length === 4;
  }
  function back() {
    setError("");
    if (confirmMode()) setConfirm((c) => c.slice(0, -1));
    else setPin((p) => p.slice(0, -1));
  }

  useEffect(() => {
    if (phase === "set" && pin.length === 4 && confirm.length === 4) {
      if (pin === confirm) {
        window.localStorage.setItem(PIN_KEY, pin);
        setPhase("open");
      } else {
        setError("PINs don't match. Try again.");
        setPin("");
        setConfirm("");
      }
    }
    if (phase === "enter" && pin.length === 4) {
      if (pin === window.localStorage.getItem(PIN_KEY)) {
        setPhase("open");
      } else {
        setError("Wrong PIN.");
        setPin("");
      }
    }
  }, [pin, confirm, phase]);

  if (phase === "open") return children;
  if (phase === "loading") return <div className="min-h-dvh bg-slate-50" />;

  const setting = phase === "set";
  const entering = confirmMode() ? confirm : pin;
  const title = setting
    ? confirmMode()
      ? "Confirm parent PIN"
      : "Create a parent PIN"
    : "Enter parent PIN";
  const sub = setting
    ? "Set a 4-digit PIN so only you can open the parent view."
    : "This area is for parents. Enter your PIN to continue.";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6">
      <Link
        href="/teen"
        className="absolute left-4 top-4 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
      >
        <ArrowLeft size={16} /> Teen view
      </Link>

      <div className="w-full max-w-xs text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-trust-600 text-white">
          {setting ? <ShieldCheck size={26} /> : <Lock size={24} />}
        </span>
        <h1 className="mt-5 text-xl font-extrabold text-slate-900 font-[family-name:var(--font-jakarta)]">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{sub}</p>

        {/* PIN dots */}
        <div className="mt-6 flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-3.5 w-3.5 rounded-full transition ${
                i < entering.length ? "bg-trust-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

        {/* Keypad */}
        <div className="mx-auto mt-7 grid max-w-[240px] grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <Key key={d} onClick={() => press(String(d))}>
              {d}
            </Key>
          ))}
          <span />
          <Key onClick={() => press("0")}>0</Key>
          <Key onClick={back} aria-label="Delete">
            <Delete size={20} />
          </Key>
        </div>
      </div>
    </main>
  );
}

function Key({ children, onClick, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 items-center justify-center rounded-2xl bg-white text-xl font-extrabold text-slate-800 shadow-sm ring-1 ring-slate-100 transition active:scale-95 active:bg-slate-100"
      {...rest}
    >
      {children}
    </button>
  );
}
