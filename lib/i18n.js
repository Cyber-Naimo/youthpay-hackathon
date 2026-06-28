"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

// English + Roman-Urdu strings. t(key) falls back to English, then the key
// itself, so partial coverage never breaks the UI.
const DICT = {
  en: {
    tagline: "Pakistan's first teen finance platform",
    badge: "Financial Intelligence Engine",
    hero1: "Understand Your Teen's",
    hero2: "Financial Life",
    heroSub:
      "YouthPay turns Pakistani bank and wallet alerts (HBL, Easypaisa, JazzCash, SadaPay and more) into clear spending insights for teens aged 13 to 17 and their parents.",
    fAi: "AI-powered parsing",
    fDup: "Duplicate detection",
    fViews: "Teen + Parent views",
    fWeb3: "Web3 + investing for Gen-Z",
    getStarted: "Get started",
    getStartedSub: "Upload bank email exports, or try it instantly with sample data.",
    teenView: "Teen view",
    parentView: "Parent view",
    teenDash: "Teen Dashboard",
    teenDashSub: "Playful spending view",
    parentDash: "Parent Dashboard",
    parentDashSub: "PIN-protected · weekly summary",
    footer: "Built for Pakistani teens • Amounts in PKR (Rs.)",
    // dashboard
    spentWeek: "Spent this week",
    mostlyOn: "Mostly on",
    healthScore: "Health Score",
    dailyAvg: "Daily average",
    received: "Money received",
    whereWent: "Where it went",
    last14: "Your last 14 days",
    smartInsights: "Smart insights",
    recent: "Recent activity",
    parent: "Parent",
    // SMS
    pasteSms: "Paste a bank SMS",
    pasteSmsSub: "Most Pakistani banks alert by SMS. Paste one (or many) below.",
    pasteHint: "Paste SMS text here. Separate multiple with a blank line.",
    parseSms: "Parse SMS",
    // goals
    savingsGoal: "Savings Goal",
    setGoal: "Set a goal",
    goalName: "Goal name",
    targetAmount: "Target (Rs.)",
    saved: "Saved",
    toGo: "to go",
    goalReached: "Goal reached",
    onTrackStreak: "on-track day streak",
    save: "Save",
    edit: "Edit",
    coach: "AI Money Coach",
    coachSub: "Ask about your spending, savings or whether you can afford something.",
    coachPlaceholder: "Ask your coach anything",
    coachGreeting: "Hi, I'm your money coach. Ask me anything about your spending.",
    sug1: "How am I doing?",
    sug2: "Where can I save?",
    sug3: "Can I afford Rs 3000?",
    overview: "Overview",
    addData: "Add data",
    greeting: "Welcome back",
    tillaTag: "by YouthPay",
    spent: "Spent",
    pWeek: "This week",
    pMonth: "This month",
    pAll: "All time",
    activity: "Activity",
  },
  ur: {
    tagline: "Pakistan ka pehla teen finance platform",
    badge: "Maali Maloomat Engine",
    hero1: "Apne Teenager ki",
    hero2: "Financial Life Samjhein",
    heroSub:
      "YouthPay Pakistani bank aur wallet alerts (HBL, Easypaisa, JazzCash, SadaPay waghaira) ko aasaan kharch insights mein badalta hai, 13 se 17 saal ke teens aur unke walidain ke liye.",
    fAi: "AI se parsing",
    fDup: "Duplicate ki pehchaan",
    fViews: "Teen + Walidain views",
    fWeb3: "Web3 + investing Gen-Z ke liye",
    getStarted: "Shuru karein",
    getStartedSub: "Bank email upload karein, ya sample data se foran try karein.",
    teenView: "Teen view",
    parentView: "Walidain view",
    teenDash: "Teen Dashboard",
    teenDashSub: "Mazedaar kharch view",
    parentDash: "Walidain Dashboard",
    parentDashSub: "PIN se mehfooz · haftawaar khulasa",
    footer: "Pakistani teens ke liye banaya gaya • Raqam PKR (Rs.) mein",
    spentWeek: "Is hafte kharch",
    mostlyOn: "Zyada tar",
    healthScore: "Sehat Score",
    dailyAvg: "Rozana average",
    received: "Paise mile",
    whereWent: "Paise kahan gaye",
    last14: "Pichle 14 din",
    smartInsights: "Aqalmand insights",
    recent: "Haali sargarmi",
    parent: "Walidain",
    pasteSms: "Bank SMS paste karein",
    pasteSmsSub: "Ziyada Pakistani bank SMS bhejte hain. Aik ya ziyada neeche paste karein.",
    pasteHint: "SMS yahan paste karein. Ek se ziyada ke darmiyan khaali line chhorein.",
    parseSms: "SMS parse karein",
    savingsGoal: "Bachat ka Goal",
    setGoal: "Goal set karein",
    goalName: "Goal ka naam",
    targetAmount: "Target (Rs.)",
    saved: "Bachaya",
    toGo: "baaqi",
    goalReached: "Goal pura ho gaya",
    onTrackStreak: "din lagataar track par",
    save: "Mehfooz karein",
    edit: "Tabdeel karein",
    coach: "AI Money Coach",
    coachSub: "Apne kharch, bachat ya kisi cheez ke baare mein poochein.",
    coachPlaceholder: "Coach se kuch bhi poochein",
    coachGreeting: "Salam, main aap ka money coach hoon. Apne kharch ke baare mein poochein.",
    sug1: "Main kaisa kar raha hoon?",
    sug2: "Kahan bachat karoon?",
    sug3: "Kya main Rs 3000 afford kar sakta hoon?",
    overview: "Jaiza",
    addData: "Data shamil karein",
    greeting: "Khush aamdeed",
    tillaTag: "by YouthPay",
    spent: "Kharch",
    pWeek: "Is hafte",
    pMonth: "Is maheene",
    pAll: "Kul",
    activity: "Sargarmi",
  },
};

const LangContext = createContext({ lang: "en", setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("yp_lang");
    if (saved === "ur" || saved === "en") setLangState(saved);
  }, []);

  const setLang = useCallback((l) => {
    setLangState(l);
    try {
      window.localStorage.setItem("yp_lang", l);
    } catch {}
  }, []);

  const t = useCallback(
    (key) => DICT[lang]?.[key] ?? DICT.en[key] ?? key,
    [lang]
  );

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
