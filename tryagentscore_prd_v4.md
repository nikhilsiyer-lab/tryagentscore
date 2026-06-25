# tryagentscore.com — Product Requirements Document
Version: 0.4 | Last Updated: June 2026 | Launch Target: September 1 2026

WARNING: The author is employed at Zalando SE until August 31 2026 under a
contract (§8) that assigns IP broadly for work connected to business activities
during employment. Track B (DTC product pages) overlaps directly with the
author's role. NO Track B features may be designed or built before September 1
2026. All Track B content is planning documentation only. Get legal advice
before proceeding.

---

## 0. FOUNDING PHILOSOPHY

Full value first. Free users get 100% of the product for one domain forever.
Paid users pay for breadth and continuity, never depth.
Horizontal gating only — never vertical.
Ad-free forever. One customer, one interest.

Economics:
- API cost per scan: ~0.18 EUR
- Free user cost/month: ~0.72 EUR
- Gross margin at 19 EUR/month: ~96%
- Free users funded per paid user: ~26
- 1000 EUR MRR requires: 53 paying users

---

## 1. PRODUCT SUMMARY

AI search visibility tool. Paste URL -> 30 seconds -> Citation Readiness Score.
Shows whether ChatGPT/Perplexity/Gemini cite the page, which competitors appear
instead, exactly what to fix. Every user free or paid receives the complete scan.

---

## 2. TARGET USERS

### Track A — SMB Service Business (MVP, Sep 1)
Local service owners: physios, dentists, lawyers, restaurants. One domain.
Expected to stay free.

### Track B — DTC Ecommerce Brand (V2, from Sep 1 — NO WORK BEFORE SEP 1)
DTC founders on Shopify. Multiple product pages = natural multi-domain paid need.

### V2 — SEO Agencies / Freelancers
5-20 client domains. Q2 2027.

---

## 3. TARGET PERSONA

Busy non-technical professional. Limited time and resources. No LLM knowledge.
Would not pay for Amplitude or Adobe. Needs simple, calm, clutter-free experience.
Plain language only.

---

## 4. UX PHILOSOPHY

1. Show everything before asking for anything
2. Never blur or hide data to create upgrade pressure
3. Upgrade moments at natural need points only
4. Tone: empowerment not anxiety. Knowledgeable friend, not SaaS company.
5. Ad-free is a product decision, not a marketing claim
6. "LLM" never appears in user-facing copy

---

## 5. FIVE PRODUCT PILLARS

- **Pillar 1 — AI Readiness Audit**
  14 technical factors. Zero API cost. ~1.5s. Pass/warn/fail only.
- **Pillar 2 — Live Citation Test**
  20 prompts x 3 runs = 60 Perplexity sonar-pro calls. Streams in real time.
  Free: once/domain/7 days. Paid: daily + weekly auto-rescan.
  Citation framing: "In our test, AI search tools mentioned your business in X of 20 searches."
- **Pillar 3 — AI Bot Tracking**
  GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Anthropic-AI, Meta-ExternalAgent. Paid only.
- **Pillar 4 — One-click Fix Files**
  llms.txt, JSON-LD schema, robots.txt, alt text.
  Free: download once. Paid: auto-regenerate weekly.
- **Pillar 5 — Competitor Analytics**
  Auto-identified + up to 3 user-added URLs. Fully visible to all users. No blur.

**Score Formula:** Composite = (Technical x 0.30) + (Citation Rate x 0.70)

**Score Colours:**
- 0-39:   Amber (room to grow — NOT red, not failure)
- 40-69:  Blue  (solid foundation)
- 70-100: Green (strong visibility)
- Red: reserved for critical technical blocks in audit only

---

## 6. PRICING

### Free — forever
1 domain. Full scan. 1 scan/domain/7 days. Latest scan only.
No digest. No bot tracking.

### Growth — 19 EUR/month, cancel anytime
Unlimited domains. Full scan on all. Daily scanning. 12-week history.
Weekly digest. Bot tracking. Auto-regenerated fix files.

Pricing page: `/pricing` (linked from footer only — no pricing on homepage)
No annual/monthly toggle at launch.

Upgrade triggers (three only):
1. Bot tracking gate — Zone 5 on results page
2. Second domain attempt
3. Scan rate limit hit
Each trigger has an escape route. "I'll wait" / "Scan [domain] again" always present.

---

## 7. RESULTS PAGE — ZONE STRUCTURE

### Zone 0 — Score header (~1.5s)
Hero line: "In our test, AI search tools mentioned your business in X out of 20 searches. Here is your full report."
Citation Readiness Score. Progress bar. Benchmark line (only when 10+ scans exist per category). Share + Export top right.

### Zone 1 — AI Readiness Audit (~1.5s, parallel)
14 factors. Pass/warn/fail. No scores or percentages.
Language:
  - tick  = "Schema markup detected"
  - warn  = "No llms.txt file found"
  - cross = "No structured contact information"

### Zone 2 — Citation scan (streams 5-60s)
Each prompt appears live as SSE results arrive.
After complete: 4 intent categories shown.
Categories: Informational / Local intent / Comparison / Direct queries.

### Zone 3 — Competitor gap (with first citation result)
"These businesses appeared in searches where you were not cited."
Fully visible, no blur. Add competitor URL field.

### Zone 4 — Fix list + assets
Top 3 by impact shown by default. Each has time estimate ("Takes 5 minutes").
Download buttons prominent. +N more collapsed.

### Zone 5 — Bot tracking
Install prompt: WordPress / Cloudflare / HTML snippet.
"This feature is included in Growth — 19 EUR/month."
[Start with Growth] [Maybe later] — "Maybe later" always present.

### Email capture — inline card after Zone 1 (NOT a pop-up)
"Want to know when your score improves? We'll re-run this scan weekly and email you when something changes. Free."
No spam. Unsubscribe anytime. Privacy policy link.

**Persistent URL:** `tryagentscore.com/results/{scan_id}`
Always shows latest scan. Publicly accessible. Day 1 dashboard substitute.

**Export:** PDF + CSV below Zone 4. Free and paid.

---

## 8. TECHNICAL ARCHITECTURE

### Scan Pipeline:
1. URL submission
2. Playwright crawl -> extract page data, detect track
3. AI Readiness Audit (~1.5s) -> SSE stream Zone 1 [parallel with 4]
4. Prompt generation: 15 library + 5 GPT-4o-mini = 20 prompts
5. 60 Perplexity sonar-pro calls (async parallel) -> SSE stream Zones 2-5
6. Score calculation
7. Persist scan -> scan_id -> results URL
8. Email URL if captured -> schedule weekly rescan

### API costs:
- Perplexity sonar-pro (60 calls): ~0.17 EUR
- GPT-4o-mini (prompt generation): ~0.001 EUR
- Total per scan: ~0.18 EUR

### Stack:
- Framework:  Next.js 14+ (App Router)
- Database:   PostgreSQL via Supabase
- Auth:       Lucia or Auth.js — magic link only, no passwords
- Payments:   Stripe Checkout
- Crawling:   Playwright (self-hosted)
- Email:      Resend
- Analytics:  PostHog + Plausible
- Errors:     Sentry
- Hosting:    Vercel

### Identity:
- Guest:             anonymous UUID session
- Email subscriber:  email + session ID, magic link to results
- Paid:              email + Stripe customer ID, magic link auth

---

## 9. DATA MODEL — DAY 1 REQUIREMENT

```sql
CREATE TABLE competitor_snapshots (
  id                SERIAL PRIMARY KEY,
  scan_id           INTEGER REFERENCES scans(id),
  competitor_domain TEXT NOT NULL,
  composite_score   NUMERIC(5,2),
  citation_rate     NUMERIC(5,2),
  captured_at       TIMESTAMPTZ DEFAULT NOW()
);
```

No user-facing impact. Required for V2 competitor report. Do not skip.
Without this, V2 reports launch with no historical data.

---

## 10. ANALYTICS

### Stack:
PostHog (persistence: memory — no cookie, no banner) + Plausible (9 EUR/month, cookieless)

### Key events:
- `scan_initiated`           (url, track, source)
- `scan_completed`           (composite_score, citation_rate, api_cost_usd)
- `result_viewed`            (scroll_depth, time_on_page)
- `asset_downloaded`         (type)
- `email_captured`           (score_at_capture)
- `upgrade_cta_seen`         (trigger_point)
- `upgrade_clicked`          (trigger_point)
- `second_domain_attempted`  [PRIMARY upgrade signal]
- `scan_rate_limited`        [PRIMARY upgrade signal]
- `competitor_gap_scrolled`  (track) [V2 competitor report signal]

---

## 11. POST-PURCHASE EXPERIENCE

### Welcome screen (/welcome) — clean slate:
- Full Growth feature list (5 items)
- Two equal CTAs: "Scan a new website" + "Back to my results"
- Receipt confirmation + Manage billing (Stripe Customer Portal)
- No confetti, no celebration animation

### Welcome email (within 60 seconds of purchase):
- Subject: "You're on Growth — here is what to do first"
- Full feature list
- One CTA: scan a new website
- Signed by founder first name
- "Reply to this email — I read everything"
- No drip sequence beyond this email

### Day 7 — first weekly digest:
- Score delta (or "first scan" baseline if week 1)
- One action only: highest-impact fix
- "In our test" framing maintained

---

## 12. SECURITY

- Stripe Checkout only — card data never touches our servers
- Magic link auth — no password database
- Session tokens: httpOnly, Secure, SameSite=Strict
- Stripe secret key: env vars only, never in code or Git
- Data stored: stripe_customer_id, subscription_status, email only

---

## 13. GDPR

- Plausible: cookieless, no banner required
- PostHog: persistence memory, no cookie, no banner required
- No Google Analytics
- Email consent: explicit opt-in, timestamp stored, one-click unsubscribe
- Data retention: scans 12 months, email until unsubscribe +30 days

### Pre-launch checklist:
- [ ] Privacy Policy at /privacy
- [ ] Terms of Service at /terms
- [ ] DPAs signed: Supabase, Vercel, PostHog, Resend
- [ ] Email consent language + privacy policy link
- [ ] One-click unsubscribe in every email
- [ ] Consent timestamp stored per capture
- [ ] PostHog auto-deletion at 12 months
- [ ] Data deletion email: privacy@tryagentscore.com
- [ ] No Google Analytics

---

## 14. BUILD PHASING

- **Sep 1**      Full launch: all 5 pillars, SSE, persistent URL, email, PDF+CSV, trust signals, competitor_snapshots, consent checkbox, /pricing page, post-purchase flow | Track A
- **Sep 1**      Track B design begins (first day post-employment) | Track B
- **Sep 14**     Weekly email digest | Track A
- **Sep-Oct**    PostHog analysis: upgrade triggers, competitor gap by track
- **Oct**        pSEO guide pages | Track A
- **Nov 1**      Paid tier: Stripe + magic link + upgrade flows
- **Nov-Dec**    Track B DTC-specific prompt library + fixes | Track B
- **Q1 2027**    Shopify app (trigger: 50+ DTC users validated) | Track B
- **Q2 2027**    Agency tier
- **2027-2028**  llms.txt verified index, trust score API

---

## 15. OUT OF SCOPE (MVP)

- All Track B DTC-specific features (post Sep 1 — IP risk before that date)
- Shopify app (Q1 2027)
- API access (V2)
- User dashboard (V2 — persistent URL substitutes)
- Agency white-label (Q2 2027)
- Dynamic pSEO pages (trigger: 500 scans)
- Monthly competitor report (V2)
- llms.txt verified index (2027-2028)
- Trust score API / browser extension (2027-2028)
- Any advertising (never)

---

## 16. MONETISATION ARCHITECTURE

- **Free scan**           | 0 EUR/month        | Sep 2026
- **Growth**              | 19 EUR/month       | Nov 2026
- **Shopify app**         | 9-19 EUR/month     | Q1 2027
- **Agency tier**         | 99-199 EUR/month   | Q2 2027
- **Competitor report**   | Included in Growth | V2
- **llms.txt index**      | Licensing TBD      | 2027-2028
- **Trust score API**     | API pricing        | 2027-2028

No advertising. Ever.

---

## 17. RISKS

- **IP conflict — Zalando §8**  | Critical | No Track B before Sep 1. Legal advice obtained.
- **API cost overrun**          | High     | Rate limiting + 24h cache
- **Low free->paid conversion** | Medium   | Validate upgrade triggers weeks 1-6
- **LLM API pricing changes**   | Medium   | Perplexity primary, OpenAI fallback
- **GDPR enforcement**          | Low      | Full checklist in Section 13
