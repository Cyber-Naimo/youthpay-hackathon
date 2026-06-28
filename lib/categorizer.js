// Maps a merchant name / raw text to one of the YouthPay spending categories.
// Pure keyword heuristics — fast, deterministic, no network needed.

export const CATEGORIES = [
  "Food & Dining",
  "Transport",
  "Shopping",
  "Entertainment",
  "Education",
  "Health",
  "Utilities",
  "Transfer",
  "Income",
  "Crypto",
  "Other",
];

const RULES = [
  {
    category: "Food & Dining",
    keywords: [
      "foodpanda", "food panda", "kfc", "mcdonald", "mcdonalds", "hardees",
      "hardee", "pizza", "burger", "cheezious", "optp", "subway", "dominos",
      "domino", "broadway", "johnny", "rovr", "cafe", "coffee", "tea",
      "chai", "restaurant", "dhaba", "bbq", "biryani", "khana", "khaana",
      "nashta", "dewan", "bakery", "sweets", "halwa", "juice", "shake",
    ],
  },
  {
    category: "Transport",
    keywords: [
      "careem", "uber", "indrive", "bykea", "yango", "rickshaw", "ride",
      "fuel", "petrol", "pso", "shell", "total parco", "metro bus",
      "daewoo", "bus", "fare", "taxi",
    ],
  },
  {
    category: "Shopping",
    keywords: [
      "khaadi", "chenone", "chen one", "gul ahmed", "sapphire", "outfitters",
      "breakout", "j.", "junaid jamshed", "daraz", " chenone", "markaz",
      "store", "mart", "imtiaz", "carrefour", "metro cash", "alkaram",
      "bata", "servis", "ndure", "stylo", "mall", "shop", "clothing",
      "garments", "electronics",
    ],
  },
  {
    category: "Entertainment",
    keywords: [
      "netflix", "spotify", "youtube", "cinepax", "atrium", "cinema",
      "nueplex", "game", "gaming", "playstation", "psn", "steam", "xbox",
      "arena", "bowling", "fun", "joyland", "sindbad", "concert", "ticket",
      "movie", "pubg", "uc ", "freefire", "free fire",
    ],
  },
  {
    category: "Education",
    keywords: [
      "school", "college", "university", "academy", "tuition", "course",
      "udemy", "coursera", "books", "book shop", "stationery", "library",
      "fee", "exam", "lms", "skillswap",
    ],
  },
  {
    category: "Health",
    keywords: [
      "pharmacy", "dvago", "sehat", "clinic", "hospital", "doctor", "medical",
      "medicine", "labs", "chughtai", "agha khan", "shaukat khanum", "dawai",
      "gym", "fitness",
    ],
  },
  {
    category: "Utilities",
    keywords: [
      "k-electric", "kelectric", "lesco", "sui gas", "ssgc", "sngpl",
      "ptcl", "jazz", "zong", "ufone", "telenor", "warid", "mobile load",
      "easyload", "load", "bill", "wifi", "internet", "nayatel", "stormfiber",
      "recharge", "topup", "top up", "scratch card",
    ],
  },
  {
    category: "Transfer",
    keywords: [
      "transfer", "sent to", "received from", "ibft", "raast", "fund",
      "to account", "from account", "money sent", "p2p", "remittance",
      "deposit", "withdraw", "atm",
    ],
  },
];

// Precompile word-boundary regexes so short keywords like "tea" don't match
// inside unrelated words ("steam"), and "fee" doesn't match "coffee".
const COMPILED = RULES.map((rule) => ({
  category: rule.category,
  regexes: rule.keywords.map((kw) => {
    const esc = kw.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, "i");
  }),
}));

export function categorize(merchant, rawText = "") {
  const haystack = `${merchant || ""} ${rawText || ""}`.toLowerCase();
  for (const rule of COMPILED) {
    if (rule.regexes.some((re) => re.test(haystack))) {
      return rule.category;
    }
  }
  return "Other";
}
