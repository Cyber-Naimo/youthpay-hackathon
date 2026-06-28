// Insight + analytics engine. All functions take an array of transactions
// (the shape returned by the parser / stored in Supabase) and return plain
// data — no React, no formatting. Duplicates are excluded automatically.

import {
  isWeekend,
  startOfWeek,
  differenceInCalendarDays,
  parseISO,
} from "date-fns";

function clean(transactions) {
  return (transactions || []).filter(
    (t) => t && !t.is_duplicate && t.amount != null && Number(t.amount) > 0
  );
}

function asDate(d) {
  if (d instanceof Date) return d;
  try {
    return parseISO(d);
  } catch {
    return new Date(d);
  }
}

function debits(txs) {
  return txs.filter((t) => t.type === "debit");
}
function credits(txs) {
  return txs.filter((t) => t.type === "credit");
}

export function sum(txs) {
  return txs.reduce((acc, t) => acc + Number(t.amount || 0), 0);
}

// Spend = all money OUT (every debit, including transfers/Raast sent). Only
// money IN (credits / Income) is excluded from spend.
function isSpend() {
  return true;
}
function spendDebits(txs) {
  return debits(txs);
}

// Spending grouped by category (real spend only). Returns sorted desc array.
export function categoryBreakdown(transactions) {
  const txs = spendDebits(clean(transactions));
  const map = {};
  for (const t of txs) {
    const c = t.category || "Other";
    map[c] = (map[c] || 0) + Number(t.amount);
  }
  return Object.entries(map)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

// Daily spend series for the last `days` days (real spend only).
export function dailySpendSeries(transactions, days = 14) {
  const txs = spendDebits(clean(transactions));
  const today = new Date();
  const buckets = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = { date: key, amount: 0 };
  }
  for (const t of txs) {
    const key = asDate(t.date).toISOString().slice(0, 10);
    if (buckets[key]) buckets[key].amount += Number(t.amount);
  }
  return Object.values(buckets).map((b) => ({
    ...b,
    label: new Date(b.date).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
    }),
  }));
}

function thisWeek(txs) {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  return txs.filter((t) => asDate(t.date) >= start);
}

// Core stats object consumed by both dashboards.
// opts.extraSavings = manual savings top-ups the user logged on their goal,
// which the transaction data can't see but should count toward health.
export function computeStats(transactions, opts = {}) {
  const extraSavings = Number(opts.extraSavings) || 0;
  const all = clean(transactions);
  const debs = spendDebits(all); // real spend only (excludes transfers)
  const creds = credits(all);
  const transfersOut = sum(debits(all).filter((t) => !isSpend(t)));

  const totalSpent = sum(debs);
  const totalReceived = sum(creds);

  const weekDebs = spendDebits(thisWeek(all));
  const spentThisWeek = sum(weekDebs);

  // Spend in the current calendar month.
  const now = new Date();
  const spentThisMonth = sum(
    debs.filter((t) => {
      const d = asDate(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
  );

  const breakdown = categoryBreakdown(transactions);
  const topCategory = breakdown[0] || null;

  // weekend vs weekday
  let weekend = 0;
  let weekday = 0;
  for (const t of debs) {
    if (isWeekend(asDate(t.date))) weekend += Number(t.amount);
    else weekday += Number(t.amount);
  }

  // merchant frequency
  const merchantCount = {};
  const merchantSpend = {};
  for (const t of debs) {
    const m = t.merchant_name || "Unknown";
    merchantCount[m] = (merchantCount[m] || 0) + 1;
    merchantSpend[m] = (merchantSpend[m] || 0) + Number(t.amount);
  }
  const topMerchant = Object.entries(merchantCount).sort(
    (a, b) => b[1] - a[1]
  )[0];

  // biggest single transaction
  const biggest = debs.reduce(
    (max, t) => (Number(t.amount) > Number(max?.amount || 0) ? t : max),
    null
  );

  // impulse spends: < Rs 500, Food/Entertainment, after 10pm
  const impulse = debs.filter((t) => {
    const hr = asDate(t.date).getHours();
    return (
      Number(t.amount) < 500 &&
      (t.category === "Food & Dining" || t.category === "Entertainment") &&
      hr >= 22
    );
  });

  // daily average (over active day span, min 1)
  let spanDays = 1;
  if (debs.length > 0) {
    const dates = debs.map((t) => asDate(t.date).getTime());
    spanDays = Math.max(
      1,
      differenceInCalendarDays(new Date(Math.max(...dates)), new Date(Math.min(...dates))) + 1
    );
  }
  const dailyAverage = totalSpent / spanDays;

  // savings rate
  const savingsRate =
    totalReceived > 0
      ? Math.max(0, Math.min(1, (totalReceived - totalSpent) / totalReceived))
      : 0;

  return {
    txCount: debs.length,
    totalSpent,
    totalReceived,
    transfersOut,
    spentThisWeek,
    spentThisMonth,
    breakdown,
    topCategory,
    weekendSpend: weekend,
    weekdaySpend: weekday,
    weekendRatio: weekend + weekday > 0 ? weekend / (weekend + weekday) : 0,
    topMerchant: topMerchant
      ? { name: topMerchant[0], visits: topMerchant[1], spend: merchantSpend[topMerchant[0]] }
      : null,
    biggest,
    impulseCount: impulse.length,
    impulseSpend: sum(impulse),
    dailyAverage,
    savingsRate,
    extraSavings,
    healthScore: healthScore(transactions, extraSavings),
  };
}

// Financial health score 0-100 from spending variety, frequency, avg size,
// and savings behaviour. Tuned for a teenager's spending pattern.
// extraSavings = manual goal top-ups that should reward the savings component.
export function healthScore(transactions, extraSavings = 0) {
  const all = clean(transactions);
  const debs = spendDebits(all); // exclude transfers from spending behaviour
  if (debs.length === 0 && extraSavings === 0) return 50;

  const n = debs.length;

  // Spending behaviour — up to 40 pts total, with sensible floors so messy
  // data isn't punished into the ground.
  // 1. Variety — up to 14
  const cats = new Set(debs.map((t) => t.category || "Other"));
  const varietyScore = n === 0 ? 7 : Math.min(14, 4 + cats.size * 3);

  // 2. Consistency — up to 14
  const avg = n ? sum(debs) / n : 0;
  let consistencyScore = 8;
  if (n > 1) {
    const variance = debs.reduce((a, t) => a + Math.pow(Number(t.amount) - avg, 2), 0) / n;
    const cv = avg > 0 ? Math.sqrt(variance) / avg : 1;
    consistencyScore = Math.max(4, 14 - cv * 7);
  }

  // 3. Average transaction size — up to 12
  let sizeScore;
  if (n === 0) sizeScore = 7;
  else if (avg <= 800) sizeScore = 12;
  else if (avg <= 1500) sizeScore = 9;
  else if (avg <= 2500) sizeScore = 6;
  else sizeScore = 4;

  // 4. Savings — the DOMINANT lever, up to 60 pts, LINEAR (~1 pt per Rs 1,000
  // of positive net flow + goal top-ups, maxing at Rs 60,000). Saving more
  // always moves the score until the ceiling.
  const received = sum(credits(all));
  const spent = sum(debs);
  const savedTotal = Math.max(0, received - spent) + extraSavings;
  const savingsScore = Math.min(60, savedTotal / 1000);

  const total = varietyScore + consistencyScore + sizeScore + savingsScore;
  return Math.max(0, Math.min(100, Math.round(total)));
}

// "On-track" streak: consecutive most-recent days where daily spend stayed at
// or below the user's daily average (a no-spend day counts as on-track).
export function onTrackStreak(transactions) {
  const all = clean(transactions);
  const debs = debits(all);
  if (debs.length === 0) return 0;
  const avg = sum(debs) / Math.max(1, debs.length);
  const budget = avg * 1.15; // small tolerance
  const series = dailySpendSeries(transactions, 30); // oldest -> newest
  let streak = 0;
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].amount <= budget) streak++;
    else break;
  }
  return streak;
}

export function healthLabel(score) {
  if (score >= 80) return { label: "Excellent", tone: "good" };
  if (score >= 65) return { label: "Healthy", tone: "good" };
  if (score >= 45) return { label: "Okay", tone: "warn" };
  return { label: "Needs Work", tone: "bad" };
}

// Human-readable insight cards. `audience` = 'teen' | 'parent'.
export function generateInsights(transactions, audience = "teen") {
  const s = computeStats(transactions);
  const out = [];
  const teen = audience === "teen";

  if (s.topCategory) {
    out.push({
      id: "top-category",
      icon: "trophy",
      tone: "info",
      title: teen ? "Top spending category" : "Top spending category",
      text: teen
        ? `Most of your spending goes to ${s.topCategory.category}. Worth keeping an eye on.`
        : `The largest spending category is ${s.topCategory.category}, totalling ${money(s.topCategory.amount)}.`,
    });
  }

  if (s.weekendSpend + s.weekdaySpend > 0) {
    const pct = Math.round(s.weekendRatio * 100);
    out.push({
      id: "weekend",
      icon: "calendar",
      tone: pct > 60 ? "warn" : "info",
      title: teen ? "Weekend spending" : "Weekend vs weekday",
      text: teen
        ? `${pct}% of your spending happens on weekends. ${pct > 60 ? "Weekends take a big chunk of your budget." : "Nicely balanced through the week."}`
        : `${pct}% of spending occurs on weekends versus ${100 - pct}% on weekdays.`,
    });
  }

  if (s.impulseCount > 0) {
    out.push({
      id: "impulse",
      icon: "moon",
      tone: "warn",
      title: teen ? "Late-night spending" : "Possible impulse spending",
      text: teen
        ? `You made ${s.impulseCount} small late-night food or fun purchase${s.impulseCount > 1 ? "s" : ""}. Those add up over time.`
        : `${s.impulseCount} small late-night (after 10pm) food/entertainment purchase${s.impulseCount > 1 ? "s" : ""} detected, totalling ${money(s.impulseSpend)}.`,
    });
  }

  if (s.totalReceived > 0) {
    const pct = Math.round(s.savingsRate * 100);
    out.push({
      id: "savings",
      icon: "piggy",
      tone: pct >= 20 ? "good" : "warn",
      title: teen ? "Your savings" : "Savings rate",
      text: teen
        ? `You kept ${pct}% of the money you received. ${pct >= 20 ? "Solid saving habit." : "Try setting a little aside next month."}`
        : `Approximately ${pct}% of received funds were saved rather than spent.`,
    });
  }

  if (s.topMerchant) {
    out.push({
      id: "merchant",
      icon: "store",
      tone: "info",
      title: teen ? "Most visited" : "Most frequent merchant",
      text: teen
        ? `You spent at ${s.topMerchant.name} ${s.topMerchant.visits} times. Clearly a favourite.`
        : `${s.topMerchant.name} was the most frequent merchant (${s.topMerchant.visits} transactions, ${money(s.topMerchant.spend)}).`,
    });
  }

  if (s.biggest) {
    out.push({
      id: "biggest",
      icon: "flame",
      tone: "info",
      title: teen ? "Biggest purchase" : "Largest single transaction",
      text: teen
        ? `Your biggest spend was ${money(s.biggest.amount)} at ${s.biggest.merchant_name}.`
        : `The largest single transaction was ${money(s.biggest.amount)} at ${s.biggest.merchant_name}.`,
    });
  }

  out.push({
    id: "daily",
    icon: "trend",
    tone: "info",
    title: teen ? "Daily average" : "Daily average spend",
    text: teen
      ? `On average you spend ${money(s.dailyAverage)} a day. Small choices add up.`
      : `Average daily spending is ${money(s.dailyAverage)}.`,
  });

  return out;
}

function money(n) {
  return "Rs. " + Math.round(Number(n) || 0).toLocaleString("en-PK");
}

// Detect recurring charges / subscriptions / EMIs: same merchant billed 2+
// times with a similar amount. Returns one entry per recurring merchant.
export function detectRecurring(transactions) {
  const txs = spendDebits(clean(transactions));
  const byMerchant = {};
  for (const t of txs) {
    const m = (t.merchant_name || "Unknown").toUpperCase();
    (byMerchant[m] = byMerchant[m] || []).push(t);
  }
  const out = [];
  for (const [merchant, list] of Object.entries(byMerchant)) {
    if (list.length < 2) continue;
    const amounts = list.map((t) => Number(t.amount));
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    // amounts within 12% of the average → looks like a fixed recurring bill
    const consistent = amounts.every((a) => Math.abs(a - avg) <= avg * 0.12);
    if (!consistent) continue;
    out.push({
      merchant,
      amount: Math.round(avg),
      count: list.length,
      category: list[0].category || "Other",
    });
  }
  return out.sort((a, b) => b.amount - a.amount);
}

// Actionable, personalized recommendations — what YouthPay would advise.
// opts.extraSavings (manual goal top-ups), opts.goals (array).
export function generateRecommendations(transactions, opts = {}) {
  const s = computeStats(transactions, { extraSavings: opts.extraSavings || 0 });
  const recs = [];
  const net = s.totalReceived - s.totalSpent;

  if (net < 0) {
    recs.push({
      id: "overspend",
      icon: "alert",
      tone: "bad",
      title: "You're spending more than you receive",
      text: `You've spent ${money(-net)} more than came in. Try to keep spending below what you get.`,
    });
  }

  if (s.topCategory) {
    const cut = Math.round(s.topCategory.amount * 0.15);
    recs.push({
      id: "top-cut",
      icon: "scissors",
      tone: "info",
      title: `Trim your biggest category: ${s.topCategory.category}`,
      text: `It's your largest spend (${money(s.topCategory.amount)}). Cutting just 15% would save about ${money(cut)}.`,
    });
  }

  if (s.weekendRatio > 0.55) {
    recs.push({
      id: "weekend",
      icon: "calendar",
      tone: "warn",
      title: "Weekends are eating your budget",
      text: `${Math.round(s.weekendRatio * 100)}% of spending happens on weekends. Set a small weekend limit.`,
    });
  }

  if (s.impulseCount > 0) {
    recs.push({
      id: "impulse",
      icon: "moon",
      tone: "warn",
      title: "Watch late-night spending",
      text: `${s.impulseCount} small late-night food/fun buy${s.impulseCount > 1 ? "s" : ""}. Sleep on it — decide in the morning.`,
    });
  }

  const subs = detectRecurring(transactions);
  if (subs.length) {
    const monthly = subs.reduce((a, b) => a + b.amount, 0);
    recs.push({
      id: "subs",
      icon: "repeat",
      tone: "info",
      title: "Review your subscriptions",
      text: `You have ${subs.length} recurring charge${subs.length > 1 ? "s" : ""} (~${money(monthly)}). Cancel any you don't use.`,
    });
  }

  const goals = opts.goals || [];
  const activeGoal = goals.find((g) => g.saved < g.target);
  if (activeGoal) {
    const remaining = activeGoal.target - activeGoal.saved;
    const perWeek = Math.ceil(remaining / 8 / 100) * 100;
    recs.push({
      id: "goal",
      icon: "target",
      tone: "good",
      title: `Reach "${activeGoal.name}" faster`,
      text: `Set aside about ${money(perWeek)}/week to hit it in ~2 months. ${money(remaining)} to go.`,
    });
  } else if (net >= 0 && (opts.extraSavings || 0) === 0 && goals.length === 0) {
    recs.push({
      id: "start-saving",
      icon: "piggy",
      tone: "good",
      title: "Start a savings goal",
      text: `You're not overspending — put a little aside. Even ${money(500)}/week adds up to ${money(26000)} a year.`,
    });
  }

  return recs.slice(0, 4);
}
