"use client";

import { Trophy, Flame, Gift, Check } from "lucide-react";
import { useRewards } from "@/lib/useTransactions";
import { dailyCheckIn } from "@/lib/store";

const LEVELS = ["Starter", "Saver", "Smart Spender", "Money Pro", "Finance Master", "Legend"];
const PER_LEVEL = 100;

// Daily check-in + points + level. A reason for the teen to open the app daily.
export default function RewardsCard() {
  const r = useRewards();
  const today = new Date().toISOString().slice(0, 10);
  const claimed = r.lastCheckIn === today;

  const levelIdx = Math.min(LEVELS.length - 1, Math.floor(r.points / PER_LEVEL));
  const level = LEVELS[levelIdx];
  const intoLevel = r.points % PER_LEVEL;
  const pct = Math.round((intoLevel / PER_LEVEL) * 100);
  const nextStreak = r.lastCheckIn ? r.streak : 0;
  const willEarn = 10 + Math.min(20, nextStreak * 2);

  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 p-5 text-white shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-extrabold">
          <Trophy size={16} /> Rewards
        </h3>
        {r.streak > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold backdrop-blur">
            <Flame size={12} /> {r.streak}-day streak
          </span>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="tnum text-3xl font-extrabold leading-none font-[family-name:var(--font-jakarta)]">
            {r.points}
          </p>
          <p className="text-xs font-medium text-white/80">points · {level}</p>
        </div>
        <p className="text-xs font-semibold text-white/80">
          {PER_LEVEL - intoLevel} to next level
        </p>
      </div>

      {/* Level progress */}
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/25">
        <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>

      {/* Daily check-in */}
      <button
        type="button"
        onClick={() => !claimed && dailyCheckIn()}
        disabled={claimed}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition active:scale-[0.98] ${
          claimed
            ? "bg-white/20 text-white/80"
            : "bg-white text-orange-600 shadow-sm hover:bg-white/90"
        }`}
      >
        {claimed ? (
          <>
            <Check size={17} /> Claimed today — come back tomorrow
          </>
        ) : (
          <>
            <Gift size={17} /> Daily check-in (+{willEarn} pts)
          </>
        )}
      </button>
    </section>
  );
}
