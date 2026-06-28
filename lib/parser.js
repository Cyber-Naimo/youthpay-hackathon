// Regex-based parser for Pakistani bank / wallet transaction emails.
// Each bank has a dedicated matcher. We try to detect the bank first, then
// run its matcher. If nothing matches confidently we return a low-confidence
// result so the caller can fall back to the Gemini parser.

import { categorize } from "./categorizer";
import { cryptoToPKR } from "./crypto";

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function toNumber(raw) {
  if (raw == null) return null;
  const n = parseFloat(String(raw).replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

function cleanMerchant(raw) {
  if (!raw) return null;
  return raw
    .replace(/\s+/g, " ")
    .replace(/[.,]+$/, "")
    .trim()
    .toUpperCase();
}

// Grab a merchant name after a preposition (at/for/to/from), stopping at the
// next field keyword. Tolerant of both verbose emails and terse SMS.
function grabMerchant(body, preps) {
  const re = new RegExp(
    `\\b(?:${preps})\\s+(.+?)(?=\\s+(?:on|via|using|in your|in|dated|Avbl|Avail|Bal|Ref|TID|TXN|Trx|account|a/c|\\d{1,2}[-/][\\dA-Za-z]|\\d{1,2}\\s+[A-Za-z]{3}\\b|\\.|,)|$)`,
    "i"
  );
  const m = body.match(re);
  return m ? m[1] : null;
}

// Currency-agnostic amount fragment: matches "Rs. 1,250.00", "Rs1250",
// "PKR 850" etc. Banks/SMS use Rs and PKR interchangeably.
const AMT = "(?:Rs\\.?|PKR\\.?)\\s*([\\d,]+(?:\\.\\d+)?)";

// Find any supported date token anywhere in the text (SMS rarely says "on").
function extractDate(body) {
  let m = body.match(/(\d{1,2}[-\s][A-Za-z]{3,}[-\s]\d{2,4})(?:\s+(\d{1,2}:\d{2}))?/);
  if (m) return parseDate(m[1], m[2]);
  m = body.match(/(\d{4}-\d{2}-\d{2})(?:[ T](\d{1,2}:\d{2}))?/);
  if (m) return parseDate(m[1], m[2]);
  m = body.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  if (m) return parseDate(m[1]);
  return new Date().toISOString();
}

// Handles "12-Jun-2026 14:32", "12-Jun-2026", "2026-06-11 09:15".
// Falls back to now if it cannot parse, so a transaction is never dropped.
function parseDate(dateStr, timeStr) {
  if (!dateStr) return new Date().toISOString();

  // DD-Mon-YY or DD-Mon-YYYY
  let m = dateStr.match(/(\d{1,2})[-\s]([A-Za-z]{3})[A-Za-z]*[-\s](\d{2,4})/);
  if (m) {
    const day = parseInt(m[1], 10);
    const mon = MONTHS[m[2].toLowerCase()];
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    if (mon != null) {
      const [h, min] = (timeStr || "00:00").split(":").map((x) => parseInt(x, 10));
      return new Date(year, mon, day, h || 0, min || 0).toISOString();
    }
  }

  // YYYY-MM-DD
  m = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const [h, min] = (timeStr || "00:00").split(":").map((x) => parseInt(x, 10));
    return new Date(
      parseInt(m[1], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[3], 10),
      h || 0,
      min || 0
    ).toISOString();
  }

  // DD/MM/YY or DD/MM/YYYY (common in Standard Chartered alerts)
  m = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    const [h, min] = (timeStr || "00:00").split(":").map((x) => parseInt(x, 10));
    return new Date(year, parseInt(m[2], 10) - 1, parseInt(m[1], 10), h || 0, min || 0).toISOString();
  }

  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// ---- Per-bank matchers -------------------------------------------------
// Each returns a partial result or null.

function matchHBL(body) {
  const m = body.match(new RegExp(`${AMT}\\s+(?:has been\\s+)?(debited|credited)\\b`, "i"));
  if (!m) return null;
  const type = /credit/i.test(m[2]) ? "credit" : "debit";
  const mer =
    type === "debit"
      ? grabMerchant(body, "at|for")
      : grabMerchant(body, "from");
  return {
    bank_name: "HBL",
    payment_method: /debit card/i.test(body) ? "Debit Card" : "Bank Account",
    amount: toNumber(m[1]),
    type,
    merchant_name: cleanMerchant(mer),
    date: extractDate(body),
  };
}

function matchUBL(body) {
  // Format A: amount-first — "PKR X debited/credited/spent/received/sent ..."
  const a = body.match(
    new RegExp(`${AMT}\\s+(?:has been\\s+)?(debited|credited|spent|received|sent)\\b`, "i")
  );
  if (a) {
    const verb = a[2].toLowerCase();
    const type = /credit|received/.test(verb) ? "credit" : "debit";
    const mer = grabMerchant(body, type === "credit" ? "from" : "at|for|to");
    return {
      bank_name: "UBL",
      payment_method: /raast/i.test(body) ? "Raast" : "Bank Account",
      amount: toNumber(a[1]),
      type,
      merchant_name: cleanMerchant(mer),
      date: extractDate(body),
    };
  }

  // Format D: verb-first — "credited with PKR X from ...", "debited PKR X at ..."
  const d = body.match(
    new RegExp(`(debited|credited)\\s+(?:with\\s+)?${AMT}`, "i")
  );
  if (d) {
    const type = /credit/i.test(d[1]) ? "credit" : "debit";
    const mer = grabMerchant(body, type === "credit" ? "from" : "at|for|to");
    return {
      bank_name: "UBL",
      payment_method: /raast/i.test(body) ? "Raast" : "Bank Account",
      amount: toNumber(d[2]),
      type,
      merchant_name: cleanMerchant(mer),
      date: extractDate(body),
    };
  }

  // Format B: netbanking funds transfer — "You paid PKR/Rs X to MERCHANT via Raast"
  const b = body.match(
    new RegExp(
      `You\\s+(paid|sent|transferred|received)\\s+${AMT}\\s+(?:to|from)\\s+(.+?)(?:\\s*\\(|\\s+via\\b|\\.\\s|\\n|$)`,
      "i"
    )
  );
  if (b) {
    const type = /received/i.test(b[1]) ? "credit" : "debit";
    const dm =
      body.match(/Date:\s*(\d{1,2}-[A-Za-z]{3}-\d{4})/i) ||
      body.match(/Date:\s*(\d{4}-\d{2}-\d{2})/i) ||
      body.match(/on\s+(\d{1,2}-[A-Za-z]{3}-\d{4})/i);
    const tm = body.match(/Time:\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i);
    const isRaast = /raast/i.test(body);
    return {
      bank_name: "UBL",
      payment_method: isRaast ? "Raast Transfer" : "Netbanking",
      amount: toNumber(b[2]),
      type,
      merchant_name: cleanMerchant(b[3]),
      date: parseDate(dm && dm[1], to24h(tm && tm[1])),
    };
  }

  // Format E: "A credit/debit transaction of PKR X was made in your Account"
  const e = body.match(
    new RegExp(`\\b(credit|debit)\\s+transaction of\\s+${AMT}`, "i")
  );
  if (e) {
    const type = /credit/i.test(e[1]) ? "credit" : "debit";
    // Credit notifications rarely name a clean payer (and "from" can match
    // disclaimer text) — use a safe label. Debits keep their payee.
    const mer = type === "credit" ? "Bank Credit" : grabMerchant(body, "to") || "UBL Transfer";
    return {
      bank_name: "UBL",
      payment_method: /raast/i.test(body) ? "Raast" : "Netbanking",
      amount: toNumber(e[2]),
      type,
      merchant_name: cleanMerchant(mer),
      date: extractDate(body),
    };
  }

  return null;
}

function matchMeezan(body) {
  const m = body.match(
    new RegExp(`(debited|credited)\\s+by\\s+${AMT}`, "i")
  );
  if (!m) return null;
  const type = /credit/i.test(m[1]) ? "credit" : "debit";
  const mer = grabMerchant(body, type === "credit" ? "from" : "at|for");
  return {
    bank_name: "Meezan Bank",
    payment_method: "Bank Account",
    amount: toNumber(m[2]),
    type,
    merchant_name: cleanMerchant(mer),
    date: extractDate(body),
  };
}

function matchEasypaisa(body) {
  const m = body.match(new RegExp(`${AMT}\\s+(sent to|received from)\\s+`, "i"));
  if (m) {
    const type = /received/i.test(m[2]) ? "credit" : "debit";
    const mer = grabMerchant(body, type === "credit" ? "received from" : "sent to");
    return {
      bank_name: "Easypaisa",
      payment_method: "Mobile Wallet",
      amount: toNumber(m[1]),
      type,
      merchant_name: cleanMerchant(mer),
      date: extractDate(body),
    };
  }

  // Money Transfer receipt: "Money Transfer of Rs X ... to Y" (+ Receiver Name)
  const mt = body.match(new RegExp(`Money Transfer of\\s+${AMT}`, "i"));
  if (mt) {
    const recv = body.match(/Receiver Name\s+(.+?)(?:\s*\n|Receiver Number|$)/i);
    const toM = body.match(/\bto\s+(.+?)\s+(?:was|on)\b/i);
    const type = /money received|received from/i.test(body) ? "credit" : "debit";
    return {
      bank_name: "Easypaisa",
      payment_method: "Mobile Wallet",
      amount: toNumber(mt[1]),
      type,
      // Person-to-person money transfer — fixed category (avoid the "Fee" line
      // tricking the keyword categorizer into Education).
      category: "Transfer",
      merchant_name: cleanMerchant((recv && recv[1]) || (toM && toM[1]) || "Easypaisa Transfer"),
      date: extractDate(body),
    };
  }
  return null;
}

function matchJazzCash(body) {
  const paid = body.match(new RegExp(`(?:You have paid|paid)\\s+${AMT}\\s+to\\s+`, "i"));
  if (paid) {
    return {
      bank_name: "JazzCash",
      payment_method: "Mobile Wallet",
      amount: toNumber(paid[1]),
      type: "debit",
      merchant_name: cleanMerchant(grabMerchant(body, "to")),
      date: extractDate(body),
    };
  }
  const r = body.match(new RegExp(`received\\s+${AMT}\\s+from\\s+`, "i"));
  if (!r) return null;
  return {
    bank_name: "JazzCash",
    payment_method: "Mobile Wallet",
    amount: toNumber(r[1]),
    type: "credit",
    merchant_name: cleanMerchant(grabMerchant(body, "from")),
    date: extractDate(body),
  };
}

function matchSadapay(body) {
  const m = body.match(new RegExp(`spent\\s+${AMT}\\s+at\\s+`, "i"));
  if (!m) return null;
  const mer = grabMerchant(body, "at");
  return {
    bank_name: "SadaPay",
    payment_method: "Prepaid Card",
    amount: toNumber(m[1]),
    type: "debit",
    merchant_name: cleanMerchant(mer),
    date: extractDate(body),
  };
}

function matchNayapay(body) {
  const m = body.match(new RegExp(`Payment of\\s+${AMT}\\s+made to\\s+`, "i"));
  if (!m) return null;
  return {
    bank_name: "NayaPay",
    payment_method: "Prepaid Card",
    amount: toNumber(m[1]),
    type: "debit",
    merchant_name: cleanMerchant(grabMerchant(body, "made to|to")),
    date: extractDate(body),
  };
}

// Convert "02:50 PM" -> "14:50" for parseDate.
function to24h(timeStr) {
  if (!timeStr) return null;
  // Handles "02:50 PM", "10:19:27 AM", and 24h "14:50".
  const m = timeStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = m[3] && m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

function matchSC(body) {
  // Format B: "Your account ... has been credited/debited with amount PKR X from/to account Y"
  const cd = body.match(
    new RegExp(`has been\\s+(credited|debited)\\s+with amount\\s+${AMT}`, "i")
  );
  if (cd) {
    const type = /credit/i.test(cd[1]) ? "credit" : "debit";
    const acct = body.match(/\b(?:from|to)\s+account\s+(\*+\d+|\S+)/i);
    const dm = body.match(/on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
    const tm = body.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    return {
      bank_name: "Standard Chartered",
      payment_method: /raast/i.test(body) ? "Raast" : "Online Banking",
      amount: toNumber(cd[2]),
      type,
      merchant_name: cleanMerchant(
        type === "credit"
          ? `From ${acct && acct[1] ? acct[1] : "account"}`
          : `Transfer ${acct && acct[1] ? acct[1] : ""}`
      ),
      date: parseDate(dm && dm[1], to24h(tm && tm[1])),
    };
  }

  // Format A: "A transaction of PKR X has been completed ... to/from ****Y"
  const m = body.match(
    new RegExp(`transaction of\\s+${AMT}\\s+has been completed`, "i")
  );
  if (!m) return null;
  // "to ****6769" => money out (debit); "from ..." => credit
  const toMatch = body.match(/\bto\s+(\*+\d+|[A-Z0-9 ]+?)\s+on\b/i);
  const fromMatch = body.match(/\bfrom\s+(\*+\d+|[A-Z0-9 ]+?)\s+on\b/i);
  const type = fromMatch && !toMatch ? "credit" : "debit";
  const recipient = (toMatch && toMatch[1]) || (fromMatch && fromMatch[1]);
  const channel = body.match(/through\s+(.+?)[.!]/i);
  const dm = body.match(/on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  const tm = body.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
  const merchant =
    recipient && recipient.trim()
      ? `Transfer ${recipient.trim()}`
      : "SC Transfer";
  return {
    bank_name: "Standard Chartered",
    payment_method: channel ? channel[1].trim() : "Online Banking",
    amount: toNumber(m[1]),
    type,
    merchant_name: cleanMerchant(merchant),
    date: parseDate(dm && dm[1], to24h(tm && tm[1])),
  };
}

// Binance / crypto exchange. Amounts in crypto are converted to PKR for
// totals; original amount + currency kept for display. Category "Crypto".
function matchBinance(body) {
  const CUR = "(USDT|USDC|BUSD|DAI|BNB|ETH|BTC|SOL|XRP|TRX)";

  // Withdrawal: "withdrawn 50.01 USDT from your account"
  let m = body.match(new RegExp(`withdrawn\\s+([\\d,]+(?:\\.\\d+)?)\\s+${CUR}`, "i"));
  let type, orig, currency, merchant;
  if (m) {
    type = "debit";
    orig = toNumber(m[1]);
    currency = m[2].toUpperCase();
    merchant = "Crypto Withdrawal";
  } else {
    // Deposit / received: "incoming transfer ... Amount: 10 USDT ... From: X"
    m =
      body.match(new RegExp(`Amount:?\\s*([\\d,]+(?:\\.\\d+)?)\\s*${CUR}`, "i")) ||
      body.match(new RegExp(`([\\d,]+(?:\\.\\d+)?)\\s*${CUR}\\b`, "i"));
    if (!m) return null;
    orig = toNumber(m[1]);
    currency = m[2].toUpperCase();
    const incoming = /received|incoming|deposit/i.test(body);
    type = incoming ? "credit" : "debit";
    // The transfer sender appears after "incoming transfer", not the email's
    // forwarded "From:" header.
    const from =
      body.match(/incoming transfer[\s\S]*?From:\s*([^\s<\n]+)/i) ||
      body.match(/From:\s*([^\s<\n]+)\s*(?:Amount|Time)/i);
    merchant = incoming ? (from && from[1] ? from[1] : "Crypto Deposit") : "Crypto Transfer";
  }

  if (orig == null) return null;
  return {
    bank_name: "Binance",
    payment_method: "Crypto",
    amount: Math.round(cryptoToPKR(orig, currency)),
    type,
    category: "Crypto",
    currency,
    original_amount: orig,
    is_crypto: true,
    merchant_name: cleanMerchant(merchant),
    date: extractDate(body),
  };
}

// Detect bank from sender/subject/body then run the right matcher first,
// but also try all matchers as a fallback (robust to weird senders).
function detectBank(text) {
  const t = text.toLowerCase();
  if (t.includes("hbl") || t.includes("habib bank")) return "hbl";
  if (t.includes("ubl") || t.includes("united bank")) return "ubl";
  if (t.includes("meezan")) return "meezan";
  if (t.includes("easypaisa")) return "easypaisa";
  if (t.includes("jazzcash") || t.includes("jazz cash")) return "jazzcash";
  if (t.includes("sadapay") || t.includes("sada pay")) return "sadapay";
  if (t.includes("nayapay") || t.includes("naya pay")) return "nayapay";
  if (t.includes("standard chartered") || t.includes("sc.com") || t.includes("@sc.com"))
    return "sc";
  if (t.includes("binance") || t.includes("usdt") || t.includes("crypto")) return "binance";
  return null;
}

const MATCHERS = {
  hbl: matchHBL,
  ubl: matchUBL,
  meezan: matchMeezan,
  easypaisa: matchEasypaisa,
  jazzcash: matchJazzCash,
  sadapay: matchSadapay,
  nayapay: matchNayapay,
  sc: matchSC,
  binance: matchBinance,
};

function scoreConfidence(r) {
  if (!r) return 0;
  let c = 0.4;
  if (r.amount != null && r.amount > 0) c += 0.3;
  if (r.merchant_name) c += 0.2;
  if (r.date) c += 0.05;
  if (r.type) c += 0.05;
  return Math.min(1, parseFloat(c.toFixed(2)));
}

// Parse a single email. `email` = { subject, sender, body }.
// Returns a transaction-shaped object (without id/email_id) + confidence.
export function parseEmail(email) {
  const body = email.body || email.raw_body || "";
  const haystack = `${email.sender || ""} ${email.subject || ""} ${body}`;
  const detected = detectBank(haystack);

  let result = null;
  if (detected && MATCHERS[detected]) {
    result = MATCHERS[detected](body);
  }
  // Fallback: try every matcher, keep the highest-confidence hit.
  if (!result || result.amount == null) {
    let best = result;
    let bestScore = scoreConfidence(result);
    for (const fn of Object.values(MATCHERS)) {
      const r = fn(body);
      const s = scoreConfidence(r);
      if (s > bestScore) {
        best = r;
        bestScore = s;
      }
    }
    result = best;
  }

  if (!result || result.amount == null) {
    return {
      merchant_name: null,
      amount: null,
      type: null,
      date: null,
      payment_method: null,
      bank_name: detected ? detected.toUpperCase() : null,
      category: "Other",
      confidence: 0,
      raw_text: body,
      parsed_by: "regex",
    };
  }

  const confidence = scoreConfidence(result);
  return {
    ...result,
    // Honor a category the matcher set explicitly (e.g. money transfers);
    // otherwise fall back to keyword categorization.
    category: result.category || categorize(result.merchant_name, body),
    confidence,
    raw_text: body,
    parsed_by: "regex",
  };
}

// Duplicate detection: same merchant + same amount within 2 minutes.
// Mutates a copy and sets is_duplicate on later occurrences.
export function markDuplicates(transactions) {
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const TWO_MIN = 2 * 60 * 1000;
  for (let i = 0; i < sorted.length; i++) {
    sorted[i].is_duplicate = sorted[i].is_duplicate || false;
    for (let j = 0; j < i; j++) {
      if (sorted[j].is_duplicate) continue;
      const sameMerchant =
        (sorted[i].merchant_name || "") === (sorted[j].merchant_name || "");
      const sameAmount = Number(sorted[i].amount) === Number(sorted[j].amount);
      const within =
        Math.abs(
          new Date(sorted[i].date).getTime() - new Date(sorted[j].date).getTime()
        ) <= TWO_MIN;
      if (sameMerchant && sameAmount && within && sorted[i].amount != null) {
        sorted[i].is_duplicate = true;
        break;
      }
    }
  }
  return sorted;
}

export const CONFIDENCE_THRESHOLD = 0.7;
