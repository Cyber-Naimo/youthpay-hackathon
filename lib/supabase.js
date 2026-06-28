import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// In a hackathon demo the Supabase project may not be wired up yet.
// Treat obvious placeholder values as "not configured" so the app can
// gracefully fall back to local storage instead of crashing.
function looksReal(v) {
  return (
    typeof v === "string" &&
    v.length > 0 &&
    !v.includes("your_") &&
    !v.includes("_here")
  );
}

export const isSupabaseConfigured = looksReal(url) && looksReal(anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, { auth: { persistSession: false } })
  : null;
