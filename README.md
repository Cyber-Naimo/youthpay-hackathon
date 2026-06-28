# YouthPay — Financial Intelligence Engine

Pakistan's first financial intelligence platform for teenagers (13–17). It ingests
Pakistani bank / wallet / crypto transaction emails (Gmail auto-fetch, `.eml`
upload, SMS paste, or manual entry), parses them into structured transactions,
categorizes and analyzes spending, and shows two dashboards:

- **Tilla** (teen) — playful, light-aurora dashboard with health score, savings
  goals, AI coach, needs-vs-wants, recommendations.
- **Parent** — clean, trustworthy summary (PIN-protected), with alerts, PDF export.

## Stack
Next.js 16 (App Router, JS) · Tailwind v4 · Recharts · Gemini (AI) · Supabase (optional) · localStorage-first.

## Run locally
```bash
npm install
cp .env.example .env   # fill in your keys (see below)
npm run dev            # http://localhost:3000
```
Click **Load Sample Data** to try it instantly — no keys required.

## Parsing supported
HBL · UBL · Meezan · Easypaisa · JazzCash · SadaPay · NayaPay · Standard Chartered ·
Binance (crypto, USDT/BTC/… → PKR). Regex-first, Gemini fallback when confidence < 0.7.

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo → **Deploy**.
3. Add **Environment Variables** (Settings → Environment Variables) — same keys as `.env.example`:
   - `GEMINI_API_KEY`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI = https://YOUR-APP.vercel.app/api/gmail/callback`
   - `GMAIL_FETCH_DAYS=30`, `GMAIL_FETCH_MAX=50`
   - (optional) `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. In **Google Cloud Console → Credentials → your OAuth client**, add the prod redirect URI:
   `https://YOUR-APP.vercel.app/api/gmail/callback`
5. Redeploy. App runs fully (localStorage) even without Supabase.

## Supabase (optional cloud persistence)
The app works on localStorage by default. To persist parsed transactions to a DB:

1. Create a project at [supabase.com](https://supabase.com).
2. SQL editor → run:
   ```sql
   create table emails (
     id uuid primary key default gen_random_uuid(),
     raw_body text, subject text, sender text,
     received_at timestamptz, processed boolean default false,
     created_at timestamptz default now()
   );
   create table transactions (
     id uuid primary key default gen_random_uuid(),
     email_id uuid references emails(id),
     merchant_name text, amount numeric(12,2),
     type text, date timestamptz, payment_method text,
     bank_name text, category text, raw_text text,
     is_duplicate boolean default false, confidence numeric(3,2),
     created_at timestamptz default now()
   );
   ```
3. Settings → API → copy **Project URL** + **anon key** into Vercel env
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. The ingestion pipeline best-effort writes to Supabase when configured; localStorage
   stays the instant client source of truth.

## Security
- `.env*` is gitignored — never commit real keys.
- `*.eml` is gitignored — personal/account emails never ship.
