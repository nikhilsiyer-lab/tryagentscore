# tryagentscore.com — Product Requirements Document
**Version:** 0.3 — Handover Draft
**Last Updated:** June 2026
**Launch Target:** September 1, 2026
**Status:** Pre-build — all decisions resolved

---

## 1. Executive Summary

tryagentscore.com is an AI search visibility tool that tells website and product page owners whether AI models (ChatGPT, Perplexity, Gemini) are citing their pages — and exactly what to fix. The product delivers a Citation Readiness Score combining a live prompt-based citability test and an on-page technical audit.

**North star positioning:** AI search has new rules. tryagentscore shows you where you stand — and what to do next.

**Tone:** Empowering, not anxiety-inducing. The user has built something real. The product is a compass, not a report card.

**Full launch September 1, 2026** — all five pillars active.

---

## 2. Problem Statement

AI answer engines (ChatGPT, Perplexity, Google AI Mode, Gemini) now handle a growing share of discovery queries, returning a synthesised answer citing 2–5 sources. Businesses not in those sources get zero traffic, zero awareness — with no visibility that this is happening.

**Gap in market:** Enterprise GEO tools (Semrush, Ahrefs, Rankscale) are $100–500/month, built for agencies. Lightweight auditors (SEOptimer, Rankweave) only do technical checks — no live citation testing. No tool exists for the SMB owner or DTC founder at an accessible price point with the depth of an enterprise tool.

---

## 3. Target Users

### Track A — SMB Service Business
- Owner-operators: physios, dentists, lawyers, coaches, restaurants, boutique hotels
- Tech level: Low–moderate (WordPress/Squarespace)
- Pain: "I have a website but AI doesn't recommend me"
- Distribution: r/SEO, local business communities, WordPress plugin directory

### Track B — DTC Ecommerce Brand
- Founder or head of growth, 1–50 employees, primarily Shopify
- Tech level: Moderate
- Pain: "ChatGPT recommends my competitor's product, not mine"
- Distribution: r/ecommerce, r/shopify, DTC Daily, The Operators newsletter

### Secondary — SEO Freelancers / Agencies (V2)
- 5–20 client sites, want API access and bulk scanning
- Higher ARPU, deferred to V2

---

## 4. Product Pillars

Never presented as "5 pillars" — surface progressively as a single result narrative.

### Pillar 1 — AI Readiness Audit
Technical + semantic analysis of 14 factors: schema markup, HTML structure, SSR, robots.txt bot permissions, content structure, entity clarity, freshness. Zero API cost — pure crawl.
- **Output:** Technical Score (0–100)
- **Available:** Instantly (~1.5s)
- **Gate:** Free

### Pillar 2 — Live Citation Test
20 prompts (15 from curated category library + 5 LLM-generated) fired at Perplexity sonar-pro, 3 runs each (60 total). Results stream via SSE. Composite Score = (Technical × 0.30) + (Citation Rate × 0.70).
- **Output:** Citation Rate, Intent Coverage (5 categories), Competitor Gap
- **Gate:** 3 prompts free / Full 20-prompt weekly scan on Growth

### Pillar 3 — AI Bot Tracking
Server-side monitoring of GPTBot, ClaudeBot, Google-Extended, PerplexityBot, Anthropic-AI. Requires install: WordPress plugin / Cloudflare Worker / HTML snippet. Standard analytics cannot capture this.
- **Gate:** Growth (install required)

### Pillar 4 — One-click Fix Files
Auto-generate: robots.txt update, llms.txt, JSON-LD schema (Organization / FAQPage / Product), alt text suggestions.
- **Gate:** Growth

### Pillar 5 — Competitor Analytics
Auto-identified from citability scan (domains appearing where user doesn't) + up to 3 user-added URLs. Same full audit run against each.
- **Gate:** Growth (teaser with 2 blurred in free)

---

## 5. UX Architecture

### Core Principles
1. One question per screen — one primary action per view
2. Show before asking — no login or email required to see results
3. Progressive disclosure — pillars surface as a narrative, never as a list
4. Empowerment first — compass not report card; forward-looking not accusatory
5. Speed through parallelism — audit + scans run simultaneously; stream as they arrive

### Track Detection
Auto-detected from crawl. User sees a confirmation with one-click override.
- Price / Add to Cart / SKU / product images → **Product or shop** track
- Address / services list / contact form / hours → **Service / local business** track
- Ambiguous → default to Service track with visible toggle

### User Flows

**Flow 1 — Guest (no account)**
```
Landing → [Enter URL] → auto-detect track → confirm/override
→ Results page (streaming)
  Zone 1: Technical audit (~1.5s)
  Zone 2: Citation scan streams (5–60s)
  Zone 3: Top 3 fixes (~2s)
  Zone 4: Competitor gap (first prompt result)
  Zone 5: Email capture (after Zone 1)
→ Persistent results URL generated: /results/{scan_id}
→ URL emailed if email captured
```

**Flow 2 — Email subscriber**
```
Weekly digest email → "Your score this week"
→ Click → /results/{scan_id} (no login)
→ Latest scan + two-point trend
→ CTA: Upgrade to Growth
```

**Flow 3 — Paid user (from Nov 1)**
```
Magic link login → /dashboard
  Score history (12 weeks) · Citation Rate trend
  Intent Coverage · Competitor Gap (weekly delta)
  Bot Tracking · Fix File downloads
```

### Results Page Zone Layout

**Header — Score + empowerment frame**
> Your AI Citation Score is 23/100.
> Your technical foundation is solid — here are the specific changes that will move your score.

**Zone 1 — Technical Audit** (instant)
14 factors: schema, robots.txt, SSR, HTML structure, content chunking, entity clarity, llms.txt, alt text

**Zone 2 — Citation Scan** (streaming)
Intent categories: Discovery · Validation · Comparison · Problem-first · Specific service
Each fills in as prompts return. Live streaming badge visible.

**Zone 3 — Top Fixes** (instant, appears at ~2s)
Ordered by impact tier: Critical (red) / High (amber) / Medium (teal)

**Zone 4 — Competitor Gap** (appears on first prompt result)
Auto-identified domains + user-added. Third competitor blurred in free tier.

**Zone 5 — Email Capture**
Title: "Know when your score improves — free"
Sub: "We'll re-run your scan every week and email you when your score changes."

### Screen States
| State | Response |
|-------|----------|
| Invalid/unreachable URL | Inline error, no navigation |
| JS-rendered page | Warning: "Limited scan — page may be JS-rendered" |
| Brand not in training data | Explain pre-training gap; focus on technical fixes |
| Rate limit (>3 scans/domain/7 days) | "Sign up for weekly automated scans" |
| Scan in progress | Zone 1 + Zone 3 visible; Zone 2 streaming |

---

## 6. Copy — Approved Decisions

### Voice & Tone
- **Empowering, not anxiety-inducing.** Never "you're invisible" — always "here's your next step"
- **Plain language.** No jargon: never "LLM", "GEO", "schema" without explanation
- **Personal pronoun.** "cite you" not "cite your page". "you" not "your site"
- **Specificity over vagueness.** "30 seconds" not "fast". "14 factors" not "comprehensive"

### Approved Hero Copy
- **Headline:** "Find out how AI search sees your website — and where to go next."
- **Subhead:** "Paste your URL. In 30 seconds, get a clear picture of your AI search visibility — what's working, what to improve, and exactly where to focus first."
- **CTA:** "Get my score →"
- **Eyebrow:** "Free scan · No account needed"
- **Trust line:** "No account required · Free to start · Results in ~30 seconds"

### Track Toggle Labels
- "Service / local business"
- "Product or shop"

### Section Titles (approved)
- How it works: "From URL to action plan in 30 seconds"
- Pillars: "Five signals. One score."
- Demo: "What you'll see in 30 seconds"
- Pricing: "Free to start. Upgrade when you're ready."

### Pillar Names (approved)
- Pillar 1: "AI Readiness Audit"
- Pillar 2: "Live Citation Test"
- Pillar 3: "AI Bot Tracking"
- Pillar 4: "One-click Fix Files"
- Pillar 5: "Competitor Gap"

### Score Alert (results page — empowerment frame)
> "Your AI Citation Score is 23/100. Your technical foundation is solid — here are the specific changes that will move your score."

### Copy to Never Write
- ❌ "You're invisible to AI"
- ❌ "ChatGPT is ignoring you"
- ❌ "You didn't appear once"
- ❌ "LLM", "GEO", "schema" without plain-language explanation
- ❌ "AI visibility" as a standalone phrase (jargon to SMBs)
- ❌ "Free forever" (cannot guarantee)
- ❌ "Start free trial" (unless trial is explicitly confirmed)

---

## 7. Technical Architecture

### Scan Pipeline
```
1. URL submission
2. Playwright crawl (SSR detection, full DOM)
   → Extract: business type, location, keywords, brand name, schema, headings
3. Track auto-detection (Business / Product)
4. Technical audit (~1.5s) — 14 factors
5. Prompt generation: 15 library + 5 GPT-4o-mini generated = 20 prompts
6. Prompt execution: Perplexity sonar-pro, 3 runs × 20 prompts = 60 calls
   → Stream results via SSE
   → Parse citations[], brand mentions, competitor domains
7. Score calculation:
   → Technical Score (weighted rubric)
   → Citation Rate (% of 60 runs with domain in citations[])
   → Composite = (Technical × 0.30) + (Citation Rate × 0.70)
   → Intent Coverage per category
   → Competitor Gap
8. Persist scan → generate /results/{scan_id}
9. Email if captured → schedule weekly rescan
```

### API Costs Per Scan
| Service | Purpose | Cost |
|---------|---------|------|
| Perplexity sonar-pro | 60 prompt calls | ~$0.18 |
| GPT-4o-mini | Prompt generation | ~$0.001 |
| Playwright | Crawl (self-hosted) | Infrastructure |

Monthly cost per paid user (weekly scans): ~$0.72
Monthly cost per free user (3 prompts, once): ~$0.009
Gross margin at €19/month: ~96%

### Identity & Auth Phasing
| Phase | Method | Date |
|-------|--------|------|
| Launch | Anonymous session ID (UUID, first-party cookie) | Sep 1 |
| Week 2–3 | Email capture → scan history stored | Sep 14 |
| Month 2 | Stripe + magic link = paid account (Auth.js/Lucia) | Nov 1 |
| Month 3+ | Multi-URL dashboard, teams | Dec 2026 |

### Bot Tracking Integration
Three paths — all write to same pipeline:
- WordPress plugin (hooks into request lifecycle)
- Cloudflare Worker (edge, zero origin load)
- HTML snippet (beacon, requires server-side rendering)

Stored: timestamp, bot name, page URL, response code
Aggregated: crawl frequency, pages crawled, last crawl per bot

### Persistent Results URL
Every scan → `/results/{scan_id}` — public, permanent, shows latest scan for domain.
Acts as Day 1 dashboard substitute. Emailed to subscribers after each weekly scan.

---

## 8. Analytics & Instrumentation

### Stack
| Tool | Purpose | Cost |
|------|---------|------|
| PostHog | Product analytics, funnels, session replay, feature flags | Free <1M events |
| Plausible | Traffic sources, referrers, geo | €9/month |
| /admin page | API costs, scan counts (DB queries) | Free |
| Sentry | Error tracking | Free tier |

### Key PostHog Events
All events include: session_id, user_id (null for guests), url, track, timestamp, source

| Event | Key Properties |
|-------|---------------|
| scan_initiated | url, track, source |
| scan_completed | url, technical_score, citation_rate, composite_score, duration_ms, api_cost_usd |
| result_viewed | scroll_depth, time_on_page, zones_visible |
| fix_clicked | fix_id, fix_type, impact_level, position |
| competitor_revealed | competitor_domain, trigger |
| competitor_added | competitor_url |
| email_captured | source_screen, score_at_capture |
| integration_initiated | type (wordpress/cloudflare/html) |
| integration_completed | type, time_to_complete |
| asset_generated | asset_type |
| upgrade_clicked | trigger_point, current_score |
| scan_rate_limited | url, scans_in_window |
| api_waitlist_signup | source |

### Scan Data Schema (DB)
```
scan_id           UUID PK
session_id        UUID
user_id           UUID nullable
url               TEXT
domain            TEXT
track             ENUM(business, product)
timestamp         TIMESTAMPTZ
technical_score   INTEGER
citation_rate     FLOAT
composite_score   INTEGER
intent_breakdown  JSONB
top_competitors   JSONB
top_fixes         JSONB
prompts_run       INTEGER
api_cost_usd      FLOAT
source            TEXT
results_url       TEXT
```

### Conversion Funnel
scan_initiated → scan_completed → result_viewed (>30s) → scrolled_to_competitor_gap → email_captured → upgrade_clicked → payment_completed → return_visit_7d

---

## 9. Pricing

*Hypothesis — validate in weeks 1–4 before building paid infrastructure.*

### Free
- 3-prompt citability snapshot (one-time)
- Full technical audit
- Top 3 fixes
- Competitor teaser (2 blurred)
- Rate limit: 3 scans/domain/7 days
- Persistent results URL

### Growth — €19/month
- Full 20-prompt weekly scan
- Score trend (12 weeks)
- Full Intent Coverage breakdown
- Competitor gap: 5 auto + 3 user-added URLs
- One-click Fix Files (llms.txt, schema, robots.txt)
- Weekly score email digest
- Magic link dashboard (from Nov 1)

### Pro — €49/month (V2)
- Everything in Growth
- AI bot tracking (WordPress/Cloudflare install)
- Up to 10 URLs
- Full competitor audit
- PDF/CSV exports

### API Access (V2)
- Credit-based: Starter €49 (100 credits) → Scale €399 (1,500 credits)
- Waitlist in footer from Day 1
- Build triggered when 10 qualified waitlist signups received
- Pre-build: conduct 5 customer interviews from waitlist

---

## 10. Distribution Roadmap

### V1 — Sep 1, 2026
- Direct web (tryagentscore.com)
- Product Hunt launch (Tuesday of launch week)
- r/SEO, r/ecommerce, r/shopify community posts
- Personal network (20 direct outreach)

### V2 — Nov 2026
- WordPress plugin directory (Pillars 3+4 bundle)
- DTC newsletter placements (DTC Daily, The Operators)
- SEO content: "GEO audit", "ChatGPT citation check", "AI search visibility"
- API waitlist → API launch (post 10 qualified signups)

### V3 — Feb 2027
- Shopify App Store (validated if DTC track converts in V1)
- Built to Polaris design system for "Built for Shopify" badge
- Shopify-native billing via Shopify Billing API
- Multi-product scanning (all product pages ranked by AI score)
- Trigger: 20+ DTC ecommerce paying users on web tool

---

## 11. Go-to-Market Milestones

| Date | Milestone |
|------|-----------|
| Sep 1 | Full launch — Pillars 1–5, streaming results, email capture |
| Sep 14 | Weekly email digest live |
| Oct 1 | Competitor analytics refined from usage data |
| Nov 1 | Paid tier — Stripe + magic link + dashboard |
| Dec 1 | WordPress plugin in directory |
| Jan 2027 | V2 scoping from usage + revenue signal |
| Feb 2027 | Shopify app (if DTC track validated) |

### Revenue Targets
| Month | Scans | Subscribers | MRR |
|-------|-------|-------------|-----|
| Sep | 500 | 50 | €0 |
| Oct | 1,500 | 150 | €200 |
| Nov | 3,000 | 400 | €500 |
| Dec | 5,000 | 800 | €1,000 |
| Mar 2027 | — | 2,000 | €2,000 |

---

## 12. Success Metrics

### Acquisition
- Week 1 scans: 200
- Email capture rate: >15%
- Return visit within 7 days: >20%

### Engagement
- Time on results page: >90 seconds
- Scroll to competitor gap: >60%
- Bot tracking installs: >10% of email subscribers

### Revenue
- Free → paid conversion: >5% of email subscribers
- MRR month 3: €500
- Monthly churn: <10%

### Product Health
- Scan completion rate: >85%
- Time to Zone 1 result: <2 seconds
- API error rate: <2%

---

## 13. Risks & Constraints

| Risk | Severity | Mitigation |
|------|---------|-----------|
| API cost overrun if viral | High | Rate limit 3 scans/domain/7 days + 24h cache |
| LLM API pricing changes | Medium | Multi-provider: Perplexity primary, OpenAI fallback |
| Competitors copy features | Medium | Speed + two-track UX + bot tracking are hard to fast-follow |
| IP conflict (employment) | High | Zero code before Sep 1, 2026 — design/planning only |
| Low free→paid conversion | Medium | Validate weeks 1–4 before paid infrastructure investment |
| Perplexity citation variance | Medium | 3-run majority voting per prompt |
| Scan feels slow | Medium | Zone 1 + Zone 3 visible in <2s regardless |

---

## 14. Out of Scope — V1

- Shopify app (V3, Feb 2027)
- Chrome extension
- Agency white-label
- Google Search Console integration
- Social proof / review platform monitoring
- YouTube transcript analysis
- User accounts at launch (magic link auth from Nov 1 only)
- API access (V2 — waitlist in footer from Day 1)
- Multi-URL dashboard (Nov 1 with paid tier)

---

## 15. Open Decisions for AI Agent

The following require no further founder input — implement per spec:

1. **Score weighting:** 30% technical / 70% citation rate — confirmed
2. **Track detection:** Auto-detect from crawl, user can override — confirmed
3. **Competitor identification:** Auto from scan + user adds up to 3 URLs — confirmed
4. **Prompt seeding:** 15 curated library prompts + 5 GPT-4o-mini generated — confirmed
5. **Auth at launch:** Anonymous session ID (UUID, first-party cookie) — confirmed
6. **No coming-soon page:** Full product live September 1 — confirmed
7. **Internal analytics:** PostHog + Plausible + /admin page + Sentry — confirmed
8. **API waitlist:** Footer link → email capture modal, tag as api_waitlist in PostHog — confirmed
