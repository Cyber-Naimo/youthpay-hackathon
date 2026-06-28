import { NextResponse } from "next/server";
import { buildSummary, askCoach, fallbackAnswer } from "@/lib/coach";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const question = (body?.question || "").trim();
    const transactions = body?.transactions || [];
    const history = body?.history || [];

    if (!question) {
      return NextResponse.json({ error: "Ask a question." }, { status: 400 });
    }

    const summary = buildSummary(transactions);
    const ai = await askCoach(question, summary.text, history);

    if (ai) {
      return NextResponse.json({ answer: ai, source: "ai" });
    }
    return NextResponse.json({
      answer: fallbackAnswer(question, summary.stats),
      source: "fallback",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Coach failed: " + (e?.message || "unknown") },
      { status: 500 }
    );
  }
}
