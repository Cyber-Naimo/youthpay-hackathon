import { NextResponse } from "next/server";
import { ingestEmails } from "@/lib/pipeline";
import { parseEml } from "@/lib/eml";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files");
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
    }

    const emails = [];
    for (const file of files) {
      if (typeof file === "string") continue;
      const text = await file.text();
      emails.push(parseEml(text));
    }

    if (emails.length === 0) {
      return NextResponse.json({ error: "No readable emails found." }, { status: 400 });
    }

    const transactions = await ingestEmails(emails, "eml");
    return NextResponse.json({
      transactions,
      count: transactions.length,
      duplicates: transactions.filter((t) => t.is_duplicate).length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Upload failed: " + (e?.message || "unknown error") },
      { status: 500 }
    );
  }
}
