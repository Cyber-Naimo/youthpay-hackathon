import { NextResponse } from "next/server";
import { getAuthUrl, isGmailConfigured } from "@/lib/gmail";

export const runtime = "nodejs";

// Kick off the OAuth consent flow.
export async function GET(request) {
  const origin = new URL(request.url).origin;
  if (!isGmailConfigured()) {
    return NextResponse.redirect(`${origin}/?gmail=notconfigured`);
  }
  return NextResponse.redirect(getAuthUrl());
}
