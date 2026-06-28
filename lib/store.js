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
    window.localStorage.removeItem(REWARDS_KEY);
    window.localStorage.removeItem(BUDGETS_KEY);
  } catch (e) {}
  emit();
}

export function hasData() {
  return getTransactions().length > 0;
}

// Re-flag duplicates across the whole set after any change, and guarantee
// every transaction has a UNIQUE id (re-loading data can repeat ids → React
// key collisions).
function reflag(list) {
  const seen = new Set();
  const ids = new Set();
  return list.map((t) => {
    const bucket = Math.floor(new Date(t.date).getTime() / 120000);
    const sig = `${(t.merchant_name || "").toUpperCase()}|${Number(t.amount)}|${bucket}`;
    const dup = seen.has(sig);
    seen.add(sig);
    let id = t.id;
    while (!id || ids.has(id)) {
      id = `tx-${Math.random().toString(36).slice(2, 10)}`;
    }
    ids.add(id);
    return { ...t, id, is_duplicate: dup };
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

// Identity of an already-imported transaction: same merchant + amount + exact
// timestamp (+source). Re-syncing the same email won't re-add it. A genuine
// double-charge has a different timestamp, so it's still kept (and flagged).
function importKey(t) {
  return `${(t.merchant_name || "").toUpperCase()}|${Number(t.amount)}|${new Date(
    t.date
  ).getTime()}|${t.source || ""}`;
}

export function mergeTransactions(incoming) {
  const existing = getTransactions();
  const seen = new Set(existing.map(importKey));
  // Drop incoming rows that are already present (idempotent re-sync), and
  // de-dupe within the incoming batch itself.
  const fresh = [];
  for (const t of incoming || []) {
    const k = importKey(t);
    if (seen.has(k)) continue;
    seen.add(k);
    fresh.push(t);
  }
  const out = reflag([...existing, ...fresh]);
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

/* ── Rewards / points (daily engagement) ── */

const REWARDS_KEY = "yp_rewards_v1";
function dayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function getRewards() {
  if (typeof window === "undefined") return { points: 0, lastCheckIn: null, streak: 0 };
  try {
    const raw = window.localStorage.getItem(REWARDS_KEY);
    return raw ? JSON.parse(raw) : { points: 0, lastCheckIn: null, streak: 0 };
  } catch {
    return { points: 0, lastCheckIn: null, streak: 0 };
  }
}

function saveRewards(r) {
  try {
    window.localStorage.setItem(REWARDS_KEY, JSON.stringify(r));
  } catch {}
  emit();
  return r;
}

// Claim once per day. Builds a check-in streak; longer streak = more points.
export function dailyCheckIn() {
  const r = getRewards();
  const today = dayStr();
  if (r.lastCheckIn === today) return r; // already claimed
  const yesterday = dayStr(new Date(Date.now() - 86400000));
  const streak = r.lastCheckIn === yesterday ? r.streak + 1 : 1;
  const earned = 10 + Math.min(20, (streak - 1) * 2); // 10 base + up to +20 streak bonus
  return saveRewards({ points: r.points + earned, lastCheckIn: today, streak, lastEarned: earned });
}

export function awardPoints(n) {
  const r = getRewards();
  return saveRewards({ ...r, points: r.points + (Number(n) || 0) });
}

export function checkedInToday() {
  return getRewards().lastCheckIn === dayStr();
}

/* ── Category budgets ── */

const BUDGETS_KEY = "yp_budgets_v1";

export function getBudgets() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(BUDGETS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function setBudget(category, amount) {
  const b = getBudgets();
  const amt = Math.max(0, Number(amount) || 0);
  if (amt > 0) b[category] = amt;
  else delete b[category];
  try {
    window.localStorage.setItem(BUDGETS_KEY, JSON.stringify(b));
  } catch {}
  emit();
  return b;
}

export function removeBudget(category) {
  const b = getBudgets();
  delete b[category];
  try {
    window.localStorage.setItem(BUDGETS_KEY, JSON.stringify(b));
  } catch {}
  emit();
  return b;
}
