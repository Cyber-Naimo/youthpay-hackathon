import { NextResponse } from "next/server";
import { ingestEmails } from "@/lib/pipeline";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const emails = body?.emails || [];
    const source = body?.source || "email";
    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Provide an `emails` array." },
        { status: 400 }
      );
    }

    const transactions = await ingestEmails(emails, source);
    return NextResponse.json({
      transactions,
      count: transactions.length,
      duplicates: transactions.filter((t) => t.is_duplicate).length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to parse emails: " + (e?.message || "unknown error") },
      { status: 500 }
    );
  }
}
