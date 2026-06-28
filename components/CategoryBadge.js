import {
  Utensils,
  Car,
  ShoppingBag,
  Film,
  GraduationCap,
  HeartPulse,
  Zap,
  ArrowLeftRight,
  Banknote,
  Bitcoin,
  CircleDashed,
} from "lucide-react";

// One source of truth for category visuals (icon + colour) used everywhere.
export const CATEGORY_META = {
  "Food & Dining": { icon: Utensils, fg: "#c2410c", bg: "#ffedd5", dot: "#f97316" },
  Transport: { icon: Car, fg: "#1d4ed8", bg: "#dbeafe", dot: "#3b82f6" },
  Shopping: { icon: ShoppingBag, fg: "#a21caf", bg: "#fae8ff", dot: "#d946ef" },
  Entertainment: { icon: Film, fg: "#be123c", bg: "#ffe4e6", dot: "#f43f5e" },
  Education: { icon: GraduationCap, fg: "#0f766e", bg: "#ccfbf1", dot: "#14b8a6" },
  Health: { icon: HeartPulse, fg: "#15803d", bg: "#dcfce7", dot: "#22c55e" },
  Utilities: { icon: Zap, fg: "#a16207", bg: "#fef9c3", dot: "#eab308" },
  Transfer: { icon: ArrowLeftRight, fg: "#4338ca", bg: "#e0e7ff", dot: "#6366f1" },
  Income: { icon: Banknote, fg: "#15803d", bg: "#dcfce7", dot: "#16a34a" },
  Crypto: { icon: Bitcoin, fg: "#b45309", bg: "#fef3c7", dot: "#f59e0b" },
  Other: { icon: CircleDashed, fg: "#475569", bg: "#f1f5f9", dot: "#94a3b8" },
};

export function categoryColor(category) {
  return (CATEGORY_META[category] || CATEGORY_META.Other).dot;
}

export default function CategoryBadge({ category, size = "md" }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Other;
  const Icon = meta.icon;
  const pad = size === "sm" ? "px-2 py-0.5 text-xs gap-1" : "px-2.5 py-1 text-xs gap-1.5";
  const ic = size === "sm" ? 12 : 14;
  return (
    <span
      className={`inline-flex items-center ${pad} rounded-full font-semibold whitespace-nowrap`}
      style={{ color: meta.fg, backgroundColor: meta.bg }}
    >
      <Icon size={ic} strokeWidth={2.4} aria-hidden="true" />
      {category}
    </span>
  );
}
