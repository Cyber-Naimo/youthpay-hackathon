import { NextResponse } from "next/server";
import { exchangeCode } from "@/lib/gmail";

export const runtime = "nodejs";

// OAuth redirect target. Exchanges the code for tokens, stores them in an
// httpOnly cookie (demo-grade), and bounces back to the landing page.
export async function GET(request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/?gmail=denied`);
  }

  try {
    const tokens = await exchangeCode(code);
    const res = NextResponse.redirect(`${origin}/?gmail=connected`);
    res.cookies.set(
      "yp_gmail",
      JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }
    );
    return res;
  } catch (e) {
    return NextResponse.redirect(`${origin}/?gmail=error`);
  }
}
