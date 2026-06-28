import {
  Trophy,
  Calendar,
  Moon,
  PiggyBank,
  Store,
  Flame,
  TrendingUp,
  Lightbulb,
} from "lucide-react";

const ICONS = {
  trophy: Trophy,
  calendar: Calendar,
  moon: Moon,
  piggy: PiggyBank,
  store: Store,
  flame: Flame,
  trend: TrendingUp,
};

const TONES = {
  good: { fg: "#16a34a", bg: "#f0fdf4" },
  warn: { fg: "#d97706", bg: "#fffbeb" },
  bad: { fg: "#dc2626", bg: "#fef2f2" },
  info: { fg: "#4f46e5", bg: "#eef2ff" },
};

// Clean, professional insight tile: white card, subtle icon chip, no heavy
// color bars or full tinted backgrounds.
export default function InsightCard({ insight }) {
  const Icon = ICONS[insight.icon] || Lightbulb;
  const tone = TONES[insight.tone] || TONES.info;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: tone.bg, color: tone.fg }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={2.3} />
      </span>
      <div className="min-w-0">
        <h4 className="text-sm font-bold text-slate-900">{insight.title}</h4>
        <p className="mt-1 text-sm leading-snug text-slate-500">{insight.text}</p>
      </div>
    </div>
  );
}
