// Short money-literacy tips for teenagers. One shows per day (rotates), with a
// couple swapped in contextually based on the user's own data.

export const LESSONS = [
  { title: "The 50/30/20 rule", text: "Split money into 50% needs, 30% wants, 20% savings. A simple way to stay balanced." },
  { title: "Pay yourself first", text: "Set aside savings the moment money comes in, before you start spending it." },
  { title: "Beware small leaks", text: "Daily Rs 200 snacks add up to Rs 6,000 a month. Tiny habits make a big dent." },
  { title: "Wants can wait", text: "Before buying a want, wait 24 hours. Often the urge passes and you keep the cash." },
  { title: "Compound interest", text: "Money saved early grows on itself. Rs 1,000 saved at 15 beats Rs 2,000 saved at 25." },
  { title: "Spot the subscriptions", text: "Streaming and apps quietly bill every month. Cancel the ones you don't use." },
  { title: "Avoid online scams", text: "Banks never ask for your PIN or OTP by message. If someone does, it's a scam." },
  { title: "Needs vs wants", text: "A need keeps you going (food, transport). A want is nice-to-have. Know the difference." },
  { title: "Track every rupee", text: "You can't improve what you don't measure. Logging spends is half the battle." },
  { title: "Set a goal", text: "Saving is easier with a target. Name your goal and watch the progress bar fill." },
  { title: "Invest, don't just save", text: "Once you have a cushion, investing (like a mutual fund) helps money grow faster than a drawer." },
  { title: "Round up to save", text: "Round each spend up to the nearest 100 and stash the difference. Painless saving." },
];

// Pick a lesson: contextual ones win, else a stable daily rotation.
export function dailyLesson(stats) {
  if (stats) {
    const wantsHeavy = stats.weekendRatio > 0.6;
    if (stats.impulseCount > 0) return LESSONS[3]; // wants can wait
    if (wantsHeavy) return LESSONS[0]; // 50/30/20
    const net = stats.totalReceived - stats.totalSpent;
    if (net < 0) return LESSONS[1]; // pay yourself first
  }
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  return LESSONS[dayOfYear % LESSONS.length];
}
