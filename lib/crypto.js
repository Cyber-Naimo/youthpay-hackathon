// Web3 / crypto support. Amounts arrive in crypto (USDT, BTC, ...) but the
// whole app works in PKR — so we convert to PKR for totals/charts while
// keeping the original amount + currency for display.
// Rates are approximate, fixed for the demo (a real app would fetch live).
export const CRYPTO_RATES_PKR = {
  USDT: 278,
  USDC: 278,
  BUSD: 278,
  DAI: 278,
  BNB: 175000,
  ETH: 1050000,
  BTC: 18500000,
  SOL: 48000,
  XRP: 165,
  TRX: 35,
};

export function isCryptoCurrency(c) {
  return !!c && CRYPTO_RATES_PKR[String(c).toUpperCase()] != null;
}

export function cryptoToPKR(amount, currency) {
  const rate = CRYPTO_RATES_PKR[String(currency).toUpperCase()];
  return rate ? Number(amount) * rate : Number(amount);
}

// "10 USDT" / "0.0042 BTC" formatting for display.
export function formatCrypto(amount, currency) {
  const n = Number(amount);
  const s = Number.isInteger(n) ? String(n) : n.toFixed(n < 1 ? 6 : 2);
  return `${s} ${String(currency).toUpperCase()}`;
}
