import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata = {
  title: "Bachat — Saving made simple | YouthPay",
  description:
    "Bachat by YouthPay — Pakistan's financial intelligence app for teenagers. Turn bank, wallet and crypto alerts into clear spending insights, budgets and savings goals.",
};

export const viewport = {
  themeColor: "#9333ea",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-dvh antialiased">
        <LanguageProvider>
          <LanguageToggle />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
