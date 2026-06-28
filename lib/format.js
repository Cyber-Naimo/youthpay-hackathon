// Pakistani Rupee + date formatting helpers used across the app.

export function formatPKR(amount) {
  const n = Number(amount);
  if (!isFinite(n)) return "Rs. 0";
  return "Rs. " + Math.round(n).toLocaleString("en-PK");
}

export function formatPKRPrecise(amount) {
  const n = Number(amount);
  if (!isFinite(n)) return "Rs. 0.00";
  return (
    "Rs. " +
    n.toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatCompactPKR(amount) {
  const n = Number(amount) || 0;
  if (n >= 1000) return "Rs. " + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
  return "Rs. " + Math.round(n);
}
