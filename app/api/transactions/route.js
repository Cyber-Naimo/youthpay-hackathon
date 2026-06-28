import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

// Returns persisted transactions from Supabase when configured.
// The client falls back to localStorage when this is empty.
export async function GET() {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ transactions: [], source: "none" });
  }
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ transactions: data || [], source: "supabase" });
  } catch (e) {
    return NextResponse.json({ transactions: [], source: "error", error: e?.message });
  }
}
