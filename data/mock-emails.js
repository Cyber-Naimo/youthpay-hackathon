// 25 realistic Pakistani bank/wallet transaction emails for a teenager.
// Emails are rendered from specs so dates stay within the last 30 days on
// every run, and so the regex parser is exercised on real-looking text
// (we do NOT pre-fill parsed fields — parsing happens for real).

function pad(n) {
  return String(n).padStart(2, "0");
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// date `daysAgo` days back at hh:mm
function dateAgo(daysAgo, hh = 12, mm = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hh, mm, 0, 0);
  return d;
}

function fmtDMY(d) {
  return `${pad(d.getDate())}-${MON[d.getMonth()]}-${d.getFullYear()}`;
}
function fmtDMYT(d) {
  return `${fmtDMY(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fmtYMD(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const renderers = {
  HBL: (s) => {
    const d = s.date;
    if (s.type === "credit") {
      return {
        subject: "HBL Transaction Alert",
        sender: "alerts@hbl.com",
        body: `Dear Customer, Rs. ${s.amount.toLocaleString("en-US")}.00 has been credited to your account ****4471 from ${s.merchant} on ${fmtDMYT(d)} via Bank Transfer. Available balance: Rs. 24,300.00. ${s.urdu || ""}`.trim(),
      };
    }
    return {
      subject: "HBL Transaction Alert",
      sender: "alerts@hbl.com",
      body: `Dear Customer, Rs. ${s.amount.toLocaleString("en-US")}.00 has been debited from your account ****4471 at ${s.merchant} on ${fmtDMYT(d)} via Debit Card. Available balance: Rs. 18,950.00. ${s.urdu || ""}`.trim(),
    };
  },
  UBL: (s) => ({
    subject: "UBL Transaction Alert",
    sender: "noreply@ubldigital.com",
    body: `UBL Transaction Alert: PKR ${s.amount.toLocaleString("en-US")} debited for purchase at ${s.merchant} on ${fmtYMD(s.date)} at ${pad(s.date.getHours())}:${pad(s.date.getMinutes())}. Card ****8820. ${s.urdu || ""}`.trim(),
  }),
  "Meezan Bank": (s) => ({
    subject: "Meezan Bank Alert",
    sender: "ealerts@meezanbank.com",
    body:
      s.type === "credit"
        ? `Your Meezan account has been credited by Rs. ${s.amount.toLocaleString("en-US")} from ${s.merchant} on ${fmtDMY(s.date)}. JazakAllah for banking with Meezan. ${s.urdu || ""}`.trim()
        : `Your Meezan account has been debited by Rs. ${s.amount.toLocaleString("en-US")} at ${s.merchant} on ${fmtDMY(s.date)}. JazakAllah for banking with Meezan. ${s.urdu || ""}`.trim(),
  }),
  Easypaisa: (s) => ({
    subject: "Easypaisa Transaction",
    sender: "noreply@easypaisa.com.pk",
    body:
      s.type === "credit"
        ? `Easypaisa: PKR ${s.amount.toLocaleString("en-US")} received from ${s.merchant} on ${fmtDMYT(s.date)}. Trx ID ${s.tid}. Available Balance PKR 3,420. ${s.urdu || ""}`.trim()
        : `Easypaisa: PKR ${s.amount.toLocaleString("en-US")} sent to ${s.merchant} on ${fmtDMYT(s.date)}. Trx ID ${s.tid}. Available Balance PKR 1,180. ${s.urdu || ""}`.trim(),
  }),
  JazzCash: (s) => ({
    subject: "JazzCash Payment Confirmation",
    sender: "alerts@jazzcash.com.pk",
    body: `JazzCash: You have paid PKR ${s.amount.toLocaleString("en-US")} to ${s.merchant} on ${fmtDMYT(s.date)}. TID ${s.tid}. ${s.urdu || ""}`.trim(),
  }),
  SadaPay: (s) => ({
    subject: "SadaPay Card Transaction",
    sender: "hello@sadapay.pk",
    body: `SadaPay: You spent Rs ${s.amount.toLocaleString("en-US")} at ${s.merchant} on ${fmtDMYT(s.date)} using your SadaPay card. ${s.urdu || ""}`.trim(),
  }),
  NayaPay: (s) => ({
    subject: "NayaPay Payment",
    sender: "noreply@nayapay.com",
    body: `NayaPay: Payment of Rs. ${s.amount.toLocaleString("en-US")} made to ${s.merchant} on ${fmtDMYT(s.date)}. Ref ${s.tid}. ${s.urdu || ""}`.trim(),
  }),
};

// Transaction specs (bank, merchant, amount, type, date, optional Roman Urdu).
const specs = [
  { bank: "HBL", merchant: "FOODPANDA", amount: 1250, type: "debit", date: dateAgo(1, 13, 20) },
  { bank: "HBL", merchant: "CAREEM", amount: 480, type: "debit", date: dateAgo(1, 9, 5) },
  { bank: "SadaPay", merchant: "OPTP", amount: 640, type: "debit", date: dateAgo(2, 23, 15), tid: "SP90021" },
  { bank: "JazzCash", merchant: "DARAZ", amount: 2100, type: "debit", date: dateAgo(2, 16, 40), tid: "JC55219" },
  { bank: "HBL", merchant: "KHAADI", amount: 3450, type: "debit", date: dateAgo(3, 17, 10) },
  { bank: "Easypaisa", merchant: "AHMED ALI", amount: 500, type: "debit", date: dateAgo(3, 18, 45), tid: "EP88291", urdu: "Shukriya Easypaisa istemaal karne ka." },
  { bank: "Meezan Bank", merchant: "CHENONE", amount: 2800, type: "debit", date: dateAgo(4, 15, 30) },
  { bank: "NayaPay", merchant: "NETFLIX", amount: 1100, type: "debit", date: dateAgo(4, 22, 30), tid: "NP10293" },
  { bank: "HBL", merchant: "CHEEZIOUS", amount: 420, type: "debit", date: dateAgo(5, 23, 50) },
  { bank: "UBL", merchant: "CAREEM", amount: 350, type: "debit", date: dateAgo(5, 8, 15) },
  { bank: "JazzCash", merchant: "MOBILE LOAD JAZZ", amount: 300, type: "debit", date: dateAgo(6, 11, 0), tid: "JC55870" },
  { bank: "SadaPay", merchant: "CINEPAX", amount: 1600, type: "debit", date: dateAgo(7, 19, 0), tid: "SP90455" },
  { bank: "Easypaisa", merchant: "POCKET MONEY ABBU", amount: 5000, type: "credit", date: dateAgo(7, 10, 0), tid: "EP88300", urdu: "Paise wasool ho gaye." },
  { bank: "HBL", merchant: "FOODPANDA", amount: 760, type: "debit", date: dateAgo(8, 20, 25) },
  { bank: "Meezan Bank", merchant: "DVAGO PHARMACY", amount: 540, type: "debit", date: dateAgo(9, 14, 0) },
  { bank: "UBL", merchant: "SAPPHIRE", amount: 2300, type: "debit", date: dateAgo(10, 16, 5) },
  { bank: "NayaPay", merchant: "SPOTIFY", amount: 299, type: "debit", date: dateAgo(11, 21, 10), tid: "NP10410" },
  { bank: "JazzCash", merchant: "BYKEA", amount: 220, type: "debit", date: dateAgo(12, 8, 50), tid: "JC56001" },
  { bank: "HBL", merchant: "BROADWAY PIZZA", amount: 1850, type: "debit", date: dateAgo(13, 21, 30) },
  { bank: "SadaPay", merchant: "OUTFITTERS", amount: 3200, type: "debit", date: dateAgo(15, 17, 45), tid: "SP90600" },
  { bank: "Easypaisa", merchant: "UTILITY BILL KE", amount: 1400, type: "debit", date: dateAgo(18, 12, 0), tid: "EP88512" },
  { bank: "Meezan Bank", merchant: "POCKET MONEY AMMI", amount: 3000, type: "credit", date: dateAgo(20, 9, 30) },
  { bank: "HBL", merchant: "STEAM GAMES", amount: 2400, type: "debit", date: dateAgo(22, 23, 40) },
  { bank: "UBL", merchant: "KFC", amount: 1320, type: "debit", date: dateAgo(25, 19, 20) },

  // Recurring subscriptions (same merchant + amount, different dates → detected)
  { bank: "NayaPay", merchant: "NETFLIX", amount: 1100, type: "debit", date: dateAgo(27, 22, 30), tid: "NP10980" },
  { bank: "NayaPay", merchant: "SPOTIFY", amount: 299, type: "debit", date: dateAgo(28, 21, 0), tid: "NP10999" },

  // Investment — payment to a broker (good behaviour → Investment category)
  { bank: "UBL", merchant: "AKD SECURITIES", amount: 20000, type: "debit", date: dateAgo(16, 11, 30) },

  // Duplicate of #1 (same merchant + amount within 2 minutes) to test dedup
  { bank: "HBL", merchant: "FOODPANDA", amount: 1250, type: "debit", date: dateAgo(1, 13, 21) },
];

// Raw bank SMS samples (most Pakistani alerts are SMS). Tagged source "sms".
const smsSpecs = [
  { body: `HBL: Rs 950 debited at CAREEM on ${fmtDMY(dateAgo(2, 9, 0))}. Avbl Bal Rs 9,200`, date: dateAgo(2, 9, 0) },
  { body: `JazzCash: You have paid Rs 450 to FOODPANDA on ${fmtDMY(dateAgo(3, 20, 0))}. TID 99102`, date: dateAgo(3, 20, 0) },
  { body: `Easypaisa: Rs 2000 received from POCKET MONEY on ${fmtDMY(dateAgo(6, 10, 0))}. Bal Rs 5,000`, date: dateAgo(6, 10, 0) },
];

// Crypto / Web3 samples (Binance). USDT auto-converts to PKR. Tagged "gmail".
const cryptoSpecs = [
  {
    body: `Binance: Payment Receive Successful. You received an incoming transfer Time: ${fmtDMY(dateAgo(8, 14, 0))} From: kamran727 Amount: 25 USDT`,
    date: dateAgo(8, 14, 0),
  },
  {
    body: `Binance: USDT Withdrawal Successful. You have successfully withdrawn 40 USDT from your account on ${fmtDMY(dateAgo(5, 16, 0))}.`,
    date: dateAgo(5, 16, 0),
  },
];

function build() {
  const emails = specs.map((s, i) => {
    const r = renderers[s.bank](s);
    return {
      id: `mock-${i + 1}`,
      subject: r.subject,
      sender: r.sender,
      raw_body: r.body,
      received_at: s.date.toISOString(),
      source: "sample",
      processed: false,
    };
  });
  const sms = smsSpecs.map((s, i) => ({
    id: `sms-${i + 1}`,
    subject: "SMS",
    sender: "sms",
    raw_body: s.body,
    received_at: s.date.toISOString(),
    source: "sms",
    processed: false,
  }));
  const crypto = cryptoSpecs.map((s, i) => ({
    id: `crypto-${i + 1}`,
    subject: "Binance",
    sender: "do-not-reply@ses.binance.com",
    raw_body: s.body,
    received_at: s.date.toISOString(),
    source: "gmail",
    processed: false,
  }));
  return [...emails, ...sms, ...crypto];
}

// Rebuild on each access so dates stay relative to "today".
export function getMockEmails() {
  return build();
}

export const MOCK_EMAIL_COUNT = specs.length;
