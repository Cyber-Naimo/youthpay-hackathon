"use client";

import { Trophy, Flame, Gift, Check } from "lucide-react";
import { useRewards } from "@/lib/useTransactions";
import { dailyCheckIn } from "@/lib/store";

const LEVELS = ["Seedling", "Sprout", "Sapling", "Young Tree", "Strong Tree", "Money Tree"];
const PER_LEVEL = 100;

// A money tree that grows as points/level rise — a daily reason to return.
export default function RewardsCard() {
  const r = useRewards();
  const today = new Date().toISOString().slice(0, 10);
  const claimed = r.lastCheckIn === today;

  const levelIdx = Math.min(LEVELS.length - 1, Math.floor(r.points / PER_LEVEL));
  const level = LEVELS[levelIdx];
  const intoLevel = r.points % PER_LEVEL;
  const pct = Math.round((intoLevel / PER_LEVEL) * 100);
  const willEarn = 10 + Math.min(20, (claimed ? 0 : r.streak) * 2);

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 card-shadow">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <Trophy size={16} className="text-indigo-600" /> Rewards
        </h3>
        {r.streak > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600">
            <Flame size={12} /> {r.streak}-day streak
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4">
        <GrowthTree level={levelIdx} />
        <div className="min-w-0 flex-1">
          <p className="tnum text-3xl font-extrabold leading-none text-slate-900 font-[family-name:var(--font-jakarta)]">
            {r.points}
          </p>
          <p className="text-xs font-semibold text-slate-500">
            points · <span className="text-indigo-600">{level}</span>
          </p>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{PER_LEVEL - intoLevel} pts to grow</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => !claimed && dailyCheckIn()}
        disabled={claimed}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition active:scale-[0.98] ${
          claimed
            ? "bg-slate-100 text-slate-400"
            : "bg-gradient-to-r from-indigo-600 to-fuchsia-500 text-white shadow-sm shadow-indigo-200 hover:opacity-95"
        }`}
      >
        {claimed ? (
          <>
            <Check size={17} /> Claimed today, back tomorrow
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

// SVG money-tree that fills out with level (0–5).
const LEAVES = [
  { cx: 50, cy: 58, r: 17 },
  { cx: 36, cy: 50, r: 13 },
  { cx: 64, cy: 50, r: 13 },
  { cx: 50, cy: 40, r: 16 },
  { cx: 39, cy: 31, r: 12 },
  { cx: 61, cy: 31, r: 12 },
  { cx: 50, cy: 23, r: 13 },
];

function GrowthTree({ level = 0 }) {
  const count = Math.min(LEAVES.length, level + 2);
  const leaves = LEAVES.slice(0, count);
  return (
    <svg width="80" height="92" viewBox="0 0 100 120" className="shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id="leafg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      {/* pot */}
      <path d="M34 100 h32 l-4 16 h-24 z" fill="#c084fc" />
      <rect x="32" y="95" width="36" height="7" rx="2" fill="#a855f7" />
      {/* trunk */}
      <rect x="47" y="62" width="6" height="38" rx="3" fill="#92400e" />
      {/* canopy (grows with level) */}
      {leaves.map((l, i) => (
        <circle key={i} cx={l.cx} cy={l.cy} r={l.r} fill="url(#leafg)" opacity={0.95} />
      ))}
      {/* coins on a fuller tree */}
      {level >= 3 && <circle cx="42" cy="46" r="3.2" fill="#fbbf24" />}
      {level >= 4 && <circle cx="60" cy="38" r="3.2" fill="#fbbf24" />}
      {level >= 5 && <circle cx="50" cy="30" r="3.2" fill="#fbbf24" />}
    </svg>
  );
}
