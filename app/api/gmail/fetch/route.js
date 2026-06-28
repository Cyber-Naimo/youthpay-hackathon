import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  listBankMessages,
  getRawMessage,
  refreshAccessToken,
} from "@/lib/gmail";
import { parseEml } from "@/lib/eml";
import { ingestEmails } from "@/lib/pipeline";

export const runtime = "nodejs";

// Pull bank-alert emails from the connected Gmail account, parse them through
// the SAME pipeline as uploads (regex first, Gemini fallback), return the
// transactions. The client merges them into local storage.
// Resolve the fetch window: ?days / ?max query params override the env
// defaults (GMAIL_FETCH_DAYS / GMAIL_FETCH_MAX), which default to 30d / 50.
function resolveWindow(url) {
  const envDays = parseInt(process.env.GMAIL_FETCH_DAYS, 10);
  const envMax = parseInt(process.env.GMAIL_FETCH_MAX, 10);
  const qDays = parseInt(url.searchParams.get("days"), 10);
  const qMax = parseInt(url.searchParams.get("max"), 10);
  const days = clamp(qDays || envDays || 30, 1, 3650);
  const max = clamp(qMax || envMax || 50, 1, 500);
  return { days, max };
}
function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

export async function GET(request) {
  const { days, max } = resolveWindow(new URL(request.url));
  const store = await cookies();
  const raw = store.get("yp_gmail")?.value;
  if (!raw) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  let tokens;
  try {
    tokens = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_token" }, { status: 400 });
  }

  async function withAccess(token) {
    const ids = await listBankMessages(token, max, days);
    const emails = [];
    for (const id of ids) {
      const rawMsg = await getRawMessage(token, id);
      if (!rawMsg) continue;
      const e = parseEml(rawMsg);
      emails.push({ id, ...e });
    }
    return emails;
  }

  try {
    let emails;
    try {
      emails = await withAccess(tokens.access_token);
    } catch (e) {
      // Access token likely expired — try one refresh.
      if (!tokens.refresh_token) throw e;
      const refreshed = await refreshAccessToken(tokens.refresh_token);
      emails = await withAccess(refreshed.access_token);
      // (token rotation persistence omitted for demo simplicity)
    }

    const transactions = await ingestEmails(emails, "gmail");
    return NextResponse.json({
      transactions,
      scanned: emails.length,
      count: transactions.length,
      duplicates: transactions.filter((t) => t.is_duplicate).length,
      days,
      max,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "fetch_failed", detail: e?.message || "unknown" },
      { status: 500 }
    );
  }
}
