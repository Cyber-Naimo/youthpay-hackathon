// Gemini fallback parser. Used server-side only when regex confidence < 0.7.
// Gracefully returns null on any failure so the pipeline never crashes.

import { categorize } from "./categorizer";

const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const VALID_CATEGORIES = [
  "Food & Dining", "Transport", "Shopping", "Entertainment",
  "Education", "Health", "Utilities", "Transfer", "Other",
];

export async function parseWithGemini(emailBody) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("your_")) return null;

  const prompt =
    "You are a Pakistani bank transaction email parser. Extract transaction data " +
    "from the following email text and return ONLY a valid JSON object with these " +
    "exact fields: merchant_name (string), amount (number in PKR), type (debit or " +
    "credit), date (ISO string), payment_method (string or null), bank_name " +
    "(string), category (one of: Food & Dining, Transport, Shopping, Entertainment, " +
    "Education, Health, Utilities, Transfer, Other), confidence (number between 0 " +
    "and 1). Email text: " + emailBody;

  try {
    const payload = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, responseMimeType: "application/json" },
    });
    let res;
    // Retry transient overload (503) / rate-limit (429) a couple of times.
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
        body: payload,
      });
      if (res.ok || (res.status !== 503 && res.status !== 429)) break;
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const jsonStr = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    const category = VALID_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : categorize(parsed.merchant_name, emailBody);

    return {
      merchant_name: parsed.merchant_name || null,
      amount: typeof parsed.amount === "number" ? parsed.amount : Number(parsed.amount) || null,
      type: parsed.type === "credit" ? "credit" : "debit",
      date: parsed.date || new Date().toISOString(),
      payment_method: parsed.payment_method || null,
      bank_name: parsed.bank_name || null,
      category,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.75,
      raw_text: emailBody,
      parsed_by: "gemini",
    };
  } catch (e) {
    return null;
  }
}
