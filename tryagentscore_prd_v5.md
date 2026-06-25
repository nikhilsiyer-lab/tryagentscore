# tryagentscore.com — Product Requirements Document
Version: 0.5 | Last Updated: June 2026 | Launch Target: September 1 2026

CHANGELOG v0.5
- Bot tracking (Pillar 3) removed from MVP — moved to Phase 2
- Competitive Report added as Growth-only feature (Nov 1 launch)
- Zone 5 updated from bot tracking to competitive report teaser
- Zero citation copy updated — diagnosis framing, not failure framing
- Score card label updated to "AI visibility baseline"

WARNING: The author is employed at Zalando SE until August 31 2026 under a
contract (§8) that assigns IP broadly for work connected to business activities
during employment. Track B (DTC product pages) overlaps directly with the
author's role. NO Track B features may be designed or built before September 1
2026. All Track B content is planning documentation only. Get legal advice
before proceeding.

---

0. FOUNDING PHILOSOPHY

Full value first. Free users get 100% of the product for one domain forever.
Paid users pay for breadth, continuity, and competitive intelligence — never depth.
Horizontal gating only — never vertical.
Ad-free forever. One customer, one interest.

Economics:
- API cost per standard scan: ~0.18 EUR
- API cost per competitive report: ~2.40 EUR (20 prompts x 4 LLMs x 10 competitors)
- Free user cost/month: ~0.72 EUR
- Gross margin at 19 EUR/month (with weekly competitive report): ~87%
- Free users funded per paid user: ~26
- 1000 EUR MRR requires: 53 paying users

---

1. PRODUCT SUMMARY

AI search visibility tool. Paste URL -> 30 seconds -> Citation Readiness Score.
Shows whether ChatGPT/Perplexity/Gemini cite the page, which competitors appear
instead, exactly what to fix. Every user free or paid receives the complete scan.

---

2. TARGET USERS

Track A — SMB Service Business (MVP, Sep 1)
Local service owners: physios, dentists, lawyers, restaurants. One domain.
Expected to stay free.

Track B — DTC Ecommerce Brand (V2, from Sep 1 — NO WORK BEFORE SEP 1)
DTC founders on Shopify. Multiple product pages = natural multi-domain paid need.

V2 — SEO Agencies / Freelancers
5-20 client domains. Q2 2027.

---

3. TARGET PERSONA

Busy non-technical professional. Limited time and resources. No LLM knowledge.
Would not pay for Amplitude or Adobe. Needs simple, calm, clutter-free experience.
Plain language only.

---

4. UX PHILOSOPHY

1. Show everything before asking for anything
2. Never blur or hide data to create upgrade pressure
3. Upgrade moments at natural need points only
4. Tone: empowerment not anxiety. Knowledgeable friend, not SaaS company.
5. Ad-free is a product decision, not a marketing claim
6. "LLM" never appears in user-facing copy
7. Zero citations = diagnosis not failure. Always show a path forward.

---

5. FOUR PRODUCT PILLARS (Bot tracking deferred to Phase 2)

Pillar 1 — AI Readiness Audit
14 technical factors. Zero API cost. ~1.5s. Pass/warn/fail only.

Pillar 2 — Live Citation Test
20 prompts x 3 runs = 60 Perplexity sonar-pro calls. Streams in real time.
Free: once/domain/7 days. Paid: daily + weekly auto-rescan.

Citation framing (non-zero):
  "In our test, AI search tools mentioned your business in X of 20 searches."

Citation framing (zero):
  "AI search tools did not mention your business in any of our 20 test searches.
  That is common for new sites — and it is fixable."

Score card label: "AI visibility baseline" (not "Citation Readiness Score")

Pillar 3 — One-click Fix Files
llms.txt, JSON-LD schema, robots.txt, alt text.
Free: download once. Paid: auto-regenerate weekly.

Pillar 4 — Competitor Analytics
Auto-identified + up to 3 user-added URLs (free).
Full competitive report across 4 LLMs — Growth only (see Section 6b).

---

6. PRICING

Free — forever
1 domain. Full scan. 1 scan/domain/7 days. Latest scan only.
No digest. No competitive report. Up to 3 competitors shown (citation count only).

Growth — 19 EUR/month, cancel anytime
Unlimited domains. Full scan on all. Daily scanning. 12-week history.
Weekly digest. Auto-regenerated fix files.
Full competitive report: 10 competitors x 20 prompts x 4 LLMs.

Pricing page: /pricing (linked from footer only — no pricing on homepage)
No annual/monthly toggle at launch.

Upgrade triggers (three only):
1. Competitive report gate — Zone 5 on results page
2. Second domain attempt
3. Scan rate limit hit
Each trigger has an escape route. Always present.

---

6b. COMPETITIVE REPORT SPEC

What it is:
  20 prompts x 4 LLMs (ChatGPT, Perplexity, Gemini, Claude) x up to 10 competitors
  = up to 800 data points per report.

Output per report:
  - Citation count per competitor per LLM
  - Which prompts triggered citations for competitors but not for user
  - Which LLM is most/least favourable to the category
  - Gap analysis: what top-cited competitors do differently (technical audit comparison)

Framing:
  "See how you compare" — not "Market Research Report"
  Language: relative, not absolute. "3 of your competitors are cited more than you."

Timing:
  - Runs weekly alongside weekly digest (Growth users only)
  - First report generated 7 days after sign-up
  - Cached for 7 days — not re-run on every page load

API cost per report: ~2.40 EUR
  Perplexity sonar-pro: 20 prompts x 4 LLMs x 10 competitors x ~0.003 EUR = ~2.40 EUR
  Still 87%+ gross margin at 19 EUR/month assuming one report/week/user.

Zone 5 free teaser (results page):
  Show 3 competitors with citation bars — blurred after count visible.
  "See the full breakdown across 4 AI tools" -> upgrade CTA.
  Blur is the only place in the product where data is partially withheld.
  Justified because: user can already see WHO is beating them. Upgrade reveals WHY.

Launch: November 1 2026 (with paid tier).

---

7. RESULTS PAGE — ZONE STRUCTURE

Zone 0 — Score header (~1.5s)
Hero line (non-zero): "In our test, AI search tools mentioned your business
  in X out of 20 searches. Here is your full report."
Hero line (zero): "AI search tools did not mention your business in any of
  our 20 test searches. That is common for new sites — and it is fixable."
Score label: "AI visibility baseline"
Progress bar. Benchmark line (only when 10+ scans exist per category).
"What this means" block for zero scores:
  "Your page is technically live, but AI tools are not yet choosing it in
  test searches. This usually improves after clearer page text, crawler
  access, and more mentions across the web."
Share + Export top right.

Zone 1 — AI Readiness Audit (~1.5s, parallel)
14 factors. Pass/warn/fail. No scores or percentages.

Zone 2 — Citation scan (streams 5-60s)
Each prompt appears live. After complete: 4 intent categories.

Zone 3 — Competitor gap (with first citation result)
"These businesses appeared in searches where you were not cited."
Fully visible, no blur. Add competitor URL field (up to 3 free).

Zone 4 — Fix list + assets
Top 3 by impact shown by default. Time estimate per fix.
Download buttons prominent. +N more collapsed.

Zone 5 — Competitive report teaser (Growth gate)
Show 3 competitors with citation bars — blurred after raw count.
"See the full breakdown across ChatGPT, Perplexity, Gemini and Claude."
[Unlock competitive report] [Maybe later]
"Maybe later" always present.

Email capture — inline card after Zone 1 (NOT a pop-up)
"Want to know when your score improves?"

Persistent URL: tryagentscore.com/results/{scan_id}
Export: PDF + CSV. Free and paid.

---

8. TECHNICAL ARCHITECTURE

Scan Pipeline:
1. URL submission
2. Playwright crawl -> extract page data, detect track
3. AI Readiness Audit (~1.5s) -> SSE stream Zone 1 [parallel with 4]
4. Prompt generation: 15 library + 5 GPT-4o-mini = 20 prompts
5. 60 Perplexity sonar-pro calls (async parallel) -> SSE stream Zones 2-5
6. Score calculation
7. Persist scan -> scan_id -> results URL
8. Email URL if captured -> schedule weekly rescan
9. Log bot visits to DB (no UI — Phase 2 dashboard)

API costs:
- Standard scan: ~0.18 EUR
- Competitive report: ~2.40 EUR (Growth users, weekly)

Stack:
- Framework:  Next.js 14+ (App Router)
- Database:   PostgreSQL via Supabase
- Auth:       Lucia or Auth.js — magic link only, no passwords
- Payments:   Stripe Checkout
- Crawling:   Playwright (self-hosted)
- Email:      Resend
- Analytics:  PostHog + Plausible
- Errors:     Sentry
- Hosting:    Vercel

Identity:
- Guest:             anonymous UUID session
- Email subscriber:  email + session ID, magic link to results
- Paid:              email + Stripe customer ID, magic link auth

---

9. DATA MODEL — DAY 1 REQUIREMENTS

Standard competitor snapshots (needed from day 1 for V2 reports):
CREATE TABLE competitor_snapshots (
  id                SERIAL PRIMARY KEY,
  scan_id           INTEGER REFERENCES scans(id),
  competitor_domain TEXT NOT NULL,
  composite_score   NUMERIC(5,2),
  citation_rate     NUMERIC(5,2),
  captured_at       TIMESTAMPTZ DEFAULT NOW()
);

Bot visit log (log from day 1, no UI until Phase 2):
CREATE TABLE bot_visits (
  id          SERIAL PRIMARY KEY,
  domain      TEXT NOT NULL,
  bot_name    TEXT NOT NULL,
  visited_at  TIMESTAMPTZ DEFAULT NOW(),
  user_agent  TEXT
);

Competitive report results:
CREATE TABLE competitive_reports (
  id                SERIAL PRIMARY KEY,
  scan_id           INTEGER REFERENCES scans(id),
  competitor_domain TEXT NOT NULL,
  llm_name          TEXT NOT NULL,
  prompt_text       TEXT NOT NULL,
  was_cited         BOOLEAN NOT NULL,
  captured_at       TIMESTAMPTZ DEFAULT NOW()
);

---

10. ANALYTICS

Stack: PostHog (persistence: memory) + Plausible (9 EUR/month)

Key events:
- scan_initiated, scan_completed, result_viewed
- asset_downloaded, email_captured
- upgrade_cta_seen (trigger_point), upgrade_clicked (trigger_point)
- second_domain_attempted        [PRIMARY upgrade signal]
- scan_rate_limited              [PRIMARY upgrade signal]
- competitive_report_blurred_seen [PRIMARY upgrade signal — new]
- competitor_gap_scrolled (track) [V2 signal]

---

11. POST-PURCHASE EXPERIENCE

Welcome screen (/welcome) — clean slate:
  Unlimited websites — scan any URL
  Daily scanning
  12-week score history
  Weekly digest
  Competitive report — see how you compare across 4 AI tools  <- updated
  Auto-regenerated fix files

Welcome email (within 60 seconds):
Subject: "You're on Growth — here is what to do first"
One CTA: scan a new website. Signed by founder. No drip.

Day 7 — first weekly digest:
Score delta (or baseline). One action. "In our test" framing.

Day 7 — first competitive report (alongside digest):
"Here is how your competitors are being cited — and what they are doing differently."

---

12. SECURITY
- Stripe Checkout only
- Magic link auth — no password database
- Session tokens: httpOnly, Secure, SameSite=Strict
- Stripe secret key: env vars only

---

13. GDPR
- Plausible: cookieless, no banner
- PostHog: persistence memory, no banner
- No Google Analytics
- Full checklist: /privacy, /terms, DPAs, consent timestamps, one-click unsubscribe

---

14. BUILD PHASING

This weekend  — Soft launch: Track A, 4 pillars, free tier, beta test
Sep 1         — Full launch: SSE, persistent URL, email, PDF+CSV,
                trust signals, competitor_snapshots, bot_visit log,
                consent checkbox, /pricing page, post-purchase flow  | Track A
Sep 1         — Track B design begins
Sep 14        — Weekly email digest
Sep-Oct       — PostHog analysis: upgrade triggers
Oct           — pSEO guide pages
Nov 1         — Paid tier: Stripe + magic link + competitive report
Nov-Dec       — Track B DTC prompt library
Q1 2027       — Shopify app
Q2 2027       — Agency tier
Phase 2       — Bot tracking dashboard (data already logging from Sep 1)
2027-2028     — llms.txt verified index, trust score API

---

15. OUT OF SCOPE (MVP)

- Bot tracking dashboard (Phase 2 — data logs from day 1, no UI)
- All Track B features (post Sep 1 — IP risk before that date)
- Shopify app (Q1 2027)
- API access (V2)
- User dashboard (V2)
- Agency white-label (Q2 2027)
- pSEO pages (trigger: 500 scans)
- Any advertising (never)

---

16. MONETISATION ARCHITECTURE

Free scan           | 0 EUR/month        | Sep 2026
Growth              | 19 EUR/month       | Nov 2026
Shopify app         | 9-19 EUR/month     | Q1 2027
Agency tier         | 99-199 EUR/month   | Q2 2027
Competitive report  | Included in Growth | Nov 2026
Bot tracking        | Included in Growth | Phase 2
llms.txt index      | Licensing TBD      | 2027-2028

No advertising. Ever.

---

17. RISKS

IP conflict — Zalando §8    | Critical | No Track B before Sep 1
API cost — competitive rpt  | Medium   | Capped at weekly, 10 competitors
Low free->paid conversion   | Medium   | Validate upgrade triggers weeks 1-6
                            |          | Competitive report teaser is primary trigger
LLM API pricing changes     | Medium   | Perplexity primary, OpenAI fallback
GDPR enforcement            | Low      | Full checklist in Section 13
