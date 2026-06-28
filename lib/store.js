// Client-side persistence + a tiny pub/sub so every mounted view stays in
// sync. localStorage is the demo source of truth; any mutation notifies all
// subscribers so the dashboard, activity page, etc. update live and stay
// consistent.

const KEY = "youthpay_transactions_v1";
const TOPUP_KEY = "yp_goal_topup_v1";

const listeners = new Set();
function emit() {
  listeners.forEach((l) => {
    try {
      l();
    } catch {}
  });
}

// Subscribe to any store change. Returns an unsubscribe fn.
export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/* ── Transactions ── */

export function saveTransactions(transactions) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(transactions || []));
  } catch (e) {
    /* storage full / disabled */
  }
  emit();
}

export function getTransactions() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    // Migrate older data: money received was previously tagged "Transfer".
    return list.map((t) =>
      t.type === "credit" && (t.category === "Transfer" || !t.category)
        ? { ...t, category: "Income" }
        : t
    );
  } catch (e) {
    return [];
  }
}

export function clearTransactions() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch (e) {}
  emit();
}

// Wipe everything: transactions, savings top-ups, and the goal.
export function clearAll() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(TOPUP_KEY);
    window.localStorage.removeItem("yp_goal_v1");
    window.localStorage.removeItem(GOALS_KEY);
  } catch (e) {}
  emit();
}

export function hasData() {
  return getTransactions().length > 0;
}

// Re-flag duplicates across the whole set after any change.
function reflag(list) {
  const seen = new Set();
  return list.map((t) => {
    const bucket = Math.floor(new Date(t.date).getTime() / 120000);
    const sig = `${(t.merchant_name || "").toUpperCase()}|${Number(t.amount)}|${bucket}`;
    const dup = seen.has(sig);
    seen.add(sig);
    return { ...t, is_duplicate: dup };
  });
}

export function updateTransaction(id, patch) {
  const list = getTransactions().map((t) => (t.id === id ? { ...t, ...patch } : t));
  const out = reflag(list);
  saveTransactions(out);
  return out;
}

export function deleteTransaction(id) {
  const out = reflag(getTransactions().filter((t) => t.id !== id));
  saveTransactions(out);
  return out;
}

export function mergeTransactions(incoming) {
  const out = reflag([...getTransactions(), ...(incoming || [])]);
  saveTransactions(out);
  return out;
}

/* ── Savings goals (multiple) ── */

const GOALS_KEY = "yp_goals_v1";

export function getGoals() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GOALS_KEY);
    if (raw) return JSON.parse(raw);
    // Migrate a previous single goal + top-up into the new array format.
    const old = window.localStorage.getItem("yp_goal_v1");
    const topup = parseInt(window.localStorage.getItem(TOPUP_KEY), 10) || 0;
    if (old) {
      const g = JSON.parse(old);
      const migrated = [
        { id: `goal-${Date.now()}`, name: g.name || "My goal", target: g.target || 0, saved: topup },
      ];
      window.localStorage.setItem(GOALS_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return [];
  } catch {
    return [];
  }
}

function saveGoals(goals) {
  try {
    window.localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  } catch {}
  emit();
  return goals;
}

export function addGoal(name, target) {
  const g = {
    id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: String(name).trim(),
    target: Math.max(0, Number(target) || 0),
    saved: 0,
  };
  return saveGoals([...getGoals(), g]);
}

export function updateGoal(id, patch) {
  return saveGoals(getGoals().map((g) => (g.id === id ? { ...g, ...patch } : g)));
}

export function deleteGoal(id) {
  return saveGoals(getGoals().filter((g) => g.id !== id));
}

// Add savings to a specific goal. Overflow is kept (saved may exceed target),
// so no money you logged is ever lost — it stays as surplus in that goal and
// still counts toward your health score.
export function contributeGoal(id, amount) {
  const amt = Number(amount) || 0;
  return saveGoals(
    getGoals().map((g) => (g.id === id ? { ...g, saved: g.saved + amt } : g))
  );
}

// Total saved across all goals — feeds the health score.
export function totalSaved() {
  return getGoals().reduce((s, g) => s + (Number(g.saved) || 0), 0);
}
