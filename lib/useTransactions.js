"use client";

import { useEffect, useState } from "react";
import { getTransactions, getGoals, totalSaved, getRewards, getBudgets, subscribe } from "./store";

// Reactive transactions hook — re-reads on any store mutation (edit, delete,
// add, merge) so every view stays consistent, and on cross-tab storage events.
export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => setTransactions(getTransactions());
    sync();
    setLoading(false);
    const unsub = subscribe(sync);
    window.addEventListener("storage", sync);
    return () => {
      unsub();
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { transactions, loading, setTransactions };
}

// Reactive total saved across all goals (feeds health score).
export function useExtraSavings() {
  const [extra, setExtra] = useState(0);
  useEffect(() => {
    const sync = () => setExtra(totalSaved());
    sync();
    const unsub = subscribe(sync);
    window.addEventListener("storage", sync);
    return () => {
      unsub();
      window.removeEventListener("storage", sync);
    };
  }, []);
  return extra;
}

// Reactive category budgets.
export function useBudgets() {
  const [b, setB] = useState({});
  useEffect(() => {
    const sync = () => setB(getBudgets());
    sync();
    const unsub = subscribe(sync);
    window.addEventListener("storage", sync);
    return () => {
      unsub();
      window.removeEventListener("storage", sync);
    };
  }, []);
  return b;
}

// Reactive rewards/points state.
export function useRewards() {
  const [r, setR] = useState({ points: 0, lastCheckIn: null, streak: 0 });
  useEffect(() => {
    const sync = () => setR(getRewards());
    sync();
    const unsub = subscribe(sync);
    window.addEventListener("storage", sync);
    return () => {
      unsub();
      window.removeEventListener("storage", sync);
    };
  }, []);
  return r;
}

// Reactive list of savings goals.
export function useGoals() {
  const [goals, setGoals] = useState([]);
  useEffect(() => {
    const sync = () => setGoals(getGoals());
    sync();
    const unsub = subscribe(sync);
    window.addEventListener("storage", sync);
    return () => {
      unsub();
      window.removeEventListener("storage", sync);
    };
  }, []);
  return goals;
}
