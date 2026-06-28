# Bachat — Submission Pack

## Links
- **Live app:** https://youthpay-hackathon.vercel.app
- **GitHub repo:** https://github.com/Cyber-Naimo/youthpay-hackathon
- **Demo video (Loom):** https://www.loom.com/share/22e295fab6e44d8bb5039efb555f1206
- **Architecture / write-up:** [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
- **Slide deck:** [docs/presentation.html](./presentation.html)

## Required deliverables — checklist
- [x] Deployed & publicly accessible (Vercel)
- [x] GitHub repository
- [x] README explaining the solution
- [x] Demo video (Loom)
- [x] Presentation deck (5–10 slides) — `docs/presentation.html`
- [ ] **Upload presentation to a Google Drive folder** (see below) and share the folder link
- [x] Technical write-up + architecture diagram (`docs/ARCHITECTURE.md`)

## Make the Google Drive presentation (2 min)
The deck is a self-contained HTML file → export to PDF, upload to Drive:
1. Open `docs/presentation.html` in Chrome (double-click, or via the live repo).
2. `Cmd/Ctrl + P` → **Destination: Save as PDF** → Layout **Landscape** → Save.
   (Each slide is set to print as one page.)
3. Upload the PDF (and optionally the live link + Loom) to a Google Drive folder,
   set sharing to **Anyone with the link**, and submit that folder link.

> Tip: present it live by opening the HTML and using ← / → arrow keys.

## The presentation covers (as required)
- **Who you are** — slide 1
- **What you built** — slides 3–4, 7
- **Why this challenge** — slide 2
- **Technical architecture** — slide 5 (+ ARCHITECTURE.md)
- **Product decisions** — slide 6
- **What you'd improve with another week** — slide 10

## Self-assessment vs evaluation criteria
| Criterion (weight) | Evidence |
|---|---|
| Product thinking (25%) | Parses what teens already receive → understanding + habits; needs-vs-wants, budgets, recommendations, parent visibility — not chart-dumping |
| Technical execution (20%) | Layered ingest→parse→categorize→dedupe→insights pipeline; reactive pub/sub store; dependency-free MIME parser; regex+AI hybrid; idempotent sync; clean build |
| Full-stack (15%) | Next.js frontend, API routes + Gmail OAuth backend, Gemini AI, Supabase (optional), Vercel deploy |
| UX (15%) | Distinct teen/parent products, bilingual EN/Urdu, loaders, PIN gate, PDF report, mobile-first |
| Speed & prioritization (10%) | Shipped pipeline + 2 dashboards first; localStorage to skip auth; AI as enhancement |
| Founder mindset (10%) | Beyond brief: crypto/Web3, investment detection, gamification, auto-sync, scam-awareness |
| Presentation (5%) | Deck + Loom + README + architecture doc |

## Run locally
```bash
npm install && npm run dev   # http://localhost:3000 → "Load Sample Data"
```
No keys needed for the sample-data demo. See `.env.example` for Gmail/Gemini/Supabase.
