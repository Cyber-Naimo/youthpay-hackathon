"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ActivityPanel from "@/components/ActivityPanel";

// Standalone activity route (the same panel is also embedded on /teen).
export default function ActivityPage() {
  return (
    <div className="min-h-dvh bg-[#FAFAFC]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/teen"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-base font-extrabold tracking-tight font-[family-name:var(--font-jakarta)]">
            All activity
          </h1>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
        <ActivityPanel />
      </div>
    </div>
  );
}
