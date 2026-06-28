// Gmail auto-fetch via OAuth 2.0 — dependency-free (plain fetch).
// Flow: getAuthUrl -> Google consent -> callback exchanges code for tokens ->
// fetch lists bank-alert emails as raw RFC822 and hands them to the parser.

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";
const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

function real(v) {
  return typeof v === "string" && v.length > 0 && !v.includes("your_") && !v.includes("_here");
}

export function isGmailConfigured() {
  return real(process.env.GOOGLE_CLIENT_ID) && real(process.env.GOOGLE_CLIENT_SECRET);
}

function redirectUri() {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/api/gmail/callback"
  );
}

// Senders for Pakistani banks/wallets we support. Used in the Gmail query.
const BANK_SENDERS = [
  "sc.com",
  "ubl.com.pk",
  "ubldigital.com",
  "hbl.com",
  "meezanbank.com",
  "easypaisa.com.pk",
  "jazzcash.com.pk",
  "sadapay.pk",
  "nayapay.com",
];

export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(code) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error("Token exchange failed: " + (await res.text()));
  return res.json(); // { access_token, refresh_token, expires_in, ... }
}

export async function refreshAccessToken(refreshToken) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Token refresh failed: " + (await res.text()));
  return res.json(); // { access_token, expires_in, ... }
}

// List message IDs matching our bank-alert query (last `days` days).
export async function listBankMessages(accessToken, max = 50, days = 120) {
  const from = BANK_SENDERS.map((d) => `from:${d}`).join(" OR ");
  const q = `(${from}) newer_than:${days}d`;
  const url = `${GMAIL_API}/messages?q=${encodeURIComponent(q)}&maxResults=${max}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Gmail list failed: " + (await res.text()));
  const data = await res.json();
  return (data.messages || []).map((m) => m.id);
}

// Fetch a single message as raw RFC822 text (so we can reuse the .eml parser).
export async function getRawMessage(accessToken, id) {
  const url = `${GMAIL_API}/messages/${id}?format=raw`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.raw) return null;
  // Gmail returns base64url-encoded RFC822.
  return Buffer.from(data.raw, "base64url").toString("utf8");
}
