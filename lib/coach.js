// AI Spending Coach. Builds a compact context from the user's transactions,
// asks Gemini for a friendly, concise answer, and falls back to a deterministic
// answer if Gemini is unavailable — so the feature always works in a demo.

import { computeStats } from "./insights";

const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

function rs(n) {
  return "Rs. " + Math.round(Number(n) || 0).toLocaleString("en-PK");
}

// Compact, model-friendly summary of the user's finances.
export function buildSummary(transactions) {
  const s = computeStats(transactions);
  const cats = s.breakdown
    .slice(0, 5)
    .map((c) => `${c.category} ${rs(c.amount)}`)
    .join(", ");
  return {
    stats: s,
    text: [
      `Total spent: ${rs(s.totalSpent)}`,
      `Total received: ${rs(s.totalReceived)}`,
      `Spent this week: ${rs(s.spentThisWeek)}`,
      `Daily average: ${rs(s.dailyAverage)}`,
      `Net saved: ${rs(Math.max(0, s.totalReceived - s.totalSpent))}`,
      `Financial health score: ${s.healthScore}/100`,
      `Top categories: ${cats || "none"}`,
      s.topMerchant ? `Most visited: ${s.topMerchant.name} (${s.topMerchant.visits} times)` : "",
      s.biggest ? `Biggest purchase: ${rs(s.biggest.amount)} at ${s.biggest.merchant_name}` : "",
      `Impulse late-night purchases: ${s.impulseCount}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

const SYSTEM = `You are YouthPay's financial coach for a Pakistani teenager aged 13-17.
Rules:
- All money is Pakistani Rupees, written as "Rs.".
- Be warm, encouraging and practical. Talk like a smart older sibling, not a banker.
- Keep answers to 2-4 short sentences. Plain text only: no markdown headings, no bullet symbols, no emojis.
- Base every answer on the user's data provided. If asked whether they can afford something, compare it to their net saved and daily average and give a clear yes/no with a short reason.
- Never invent numbers that are not in the data.`;

export async function askCoach(question, summaryText, history = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("your_")) return null;

  const contents = [];
  contents.push({
    role: "user",
    parts: [{ text: `${SYSTEM}\n\nUser's financial data:\n${summaryText}` }],
  });
  contents.push({ role: "model", parts: [{ text: "Got it. I'll help based on that data." }] });
  for (const m of history.slice(-6)) {
    contents.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "").slice(0, 1000) }],
    });
  }
  contents.push({ role: "user", parts: [{ text: question }] });

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 300 },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? text.trim() : null;
  } catch {
    return null;
  }
}

// Deterministic fallback so the coach is useful even without Gemini.
export function fallbackAnswer(question, stats) {
  const q = (question || "").toLowerCase();
  const saved = Math.max(0, stats.totalReceived - stats.totalSpent);

  // "Can I afford Rs X?"
  const amt = q.match(/(\d[\d,]{2,})/);
  if (/afford|buy|can i get|kharid/.test(q) && amt) {
    const price = parseInt(amt[1].replace(/,/g, ""), 10);
    if (price <= saved) {
      return `Yes. You've saved ${rs(saved)}, so ${rs(price)} is within reach. After buying it you'd have about ${rs(saved - price)} left.`;
    }
    return `Not yet. You've saved ${rs(saved)}, and that costs ${rs(price)}. You're ${rs(price - saved)} short. At your current saving pace, keep setting a bit aside and you'll get there.`;
  }

  // "Where can I save / cut?"
  if (/save|cut|reduce|spend less|bachat/.test(q) && stats.topCategory) {
    return `Your biggest spending is on ${stats.topCategory.category} (${rs(stats.topCategory.amount)}). Trimming that by even 20% is the fastest way to save more. Your daily average is ${rs(stats.dailyAverage)}.`;
  }

  // "How am I doing?"
  if (/how.*doing|health|score|kaisa/.test(q)) {
    return `Your financial health score is ${stats.healthScore}/100. You've spent ${rs(stats.totalSpent)} and saved ${rs(saved)} so far. ${stats.healthScore >= 65 ? "Solid work, keep it up." : "A little more saving will push that score up."}`;
  }

  // default
  return `So far you've spent ${rs(stats.totalSpent)}, received ${rs(stats.totalReceived)}, and saved ${rs(saved)}. Your top category is ${stats.topCategory ? stats.topCategory.category : "varied"} and your health score is ${stats.healthScore}/100. Ask me if you can afford something, or where to save.`;
}
