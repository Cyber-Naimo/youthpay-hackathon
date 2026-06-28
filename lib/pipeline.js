// Server-side ingestion pipeline shared by the API routes.
// emails: [{ id?, subject, sender, body|raw_body, received_at }]
// -> parses (regex, Gemini fallback), categorizes, dedupes, best-effort
//    persists to Supabase, and returns the transaction array.

import { parseEmail, markDuplicates, CONFIDENCE_THRESHOLD } from "./parser";
import { parseWithGemini } from "./gemini";
import { categorize } from "./categorizer";
import { supabase, isSupabaseConfigured } from "./supabase";

export async function ingestEmails(emails, source = "email") {
  const list = Array.isArray(emails) ? emails : [];
  const transactions = [];

  for (const email of list) {
    const body = email.body || email.raw_body || "";
    let parsed = parseEmail({
      subject: email.subject,
      sender: email.sender,
      body,
    });

    // Gemini fallback when regex confidence is too low.
    if (parsed.confidence < CONFIDENCE_THRESHOLD) {
      const ai = await parseWithGemini(body);
      if (ai && ai.amount != null) parsed = ai;
    }

    // Ensure category present.
    if (!parsed.category) {
      parsed.category = categorize(parsed.merchant_name, body);
    }
    // Money IN is income — but don't clobber a specific category (Crypto).
    if (
      parsed.type === "credit" &&
      (!parsed.category || parsed.category === "Transfer" || parsed.category === "Other")
    ) {
      parsed.category = "Income";
    }

    transactions.push({
      id:
        (email.id ? `tx-${email.id}` : null) ||
        `tx-${transactions.length}-${Math.random().toString(36).slice(2, 8)}`,
      email_id: email.id || null,
      merchant_name: parsed.merchant_name,
      amount: parsed.amount,
      type: parsed.type,
      date: parsed.date || email.received_at || new Date().toISOString(),
      payment_method: parsed.payment_method,
      bank_name: parsed.bank_name,
      category: parsed.category,
      currency: parsed.currency || "PKR",
      original_amount: parsed.original_amount ?? parsed.amount,
      is_crypto: parsed.is_crypto || false,
      source: email.source || source,
      raw_text: body,
      is_duplicate: false,
      confidence: parsed.confidence,
      parsed_by: parsed.parsed_by || "regex",
      created_at: new Date().toISOString(),
    });
  }

  // Keep only successfully-parsed rows, then mark duplicates.
  const valid = transactions.filter((t) => t.amount != null && t.amount > 0);
  const deduped = markDuplicates(valid);

  // Best-effort persistence. Never let a DB failure break the response.
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("transactions").insert(
        deduped.map((t) => ({
          email_id: t.email_id,
          merchant_name: t.merchant_name,
          amount: t.amount,
          type: t.type,
          date: t.date,
          payment_method: t.payment_method,
          bank_name: t.bank_name,
          category: t.category,
          raw_text: t.raw_text,
          is_duplicate: t.is_duplicate,
          confidence: t.confidence,
        }))
      );
    } catch (e) {
      // swallow — localStorage on the client is the demo source of truth
    }
  }

  return deduped;
}
