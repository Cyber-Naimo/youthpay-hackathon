import { healthLabel } from "@/lib/insights";

// Circular SVG gauge. variant: "teen" (purple/pink) | "parent" (blue).
export default function HealthScore({ score = 0, variant = "teen", size = 132 }) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  const { label } = healthLabel(s);

  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (s / 100) * c;
  const gradId = `hs-${variant}`;

  const colors =
    variant === "parent"
      ? ["#3b82f6", "#1d4ed8"]
      : ["#a855f7", "#ec4899"];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors[0]} />
              <stop offset="100%" stopColor={colors[1]} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#eef2f7"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-slate-900 tnum font-[family-name:var(--font-jakarta)]">
            {s}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            / 100
          </span>
        </div>
      </div>
      <span
        className="mt-2 text-sm font-bold"
        style={{ color: variant === "parent" ? "#1d4ed8" : "#a21caf" }}
      >
        {label}
      </span>
    </div>
  );
}
