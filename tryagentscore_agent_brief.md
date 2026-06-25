# tryagentscore — Agent Brief
**Version:** 1.0 | **Last Updated:** June 2026
**For:** Any agent, developer, or collaborator picking up this project

---

## What This Product Is

tryagentscore.com is an AI search visibility tool for SMB owners and DTC ecommerce founders. A user pastes a URL and receives a Citation Readiness Score in 30 seconds — showing whether ChatGPT, Perplexity, and Gemini cite their page, which competitors appear instead, and exactly what to fix.

---

## Who Is Building It

**Nikhil Suresh Iyer** — Product Manager, currently employed at Zalando SE until August 31, 2026.

⚠️ IP CONSTRAINT: Nikhil's Zalando employment contract (§8) assigns IP broadly to Zalando for work connected to business activities during employment. His role at Zalando is in Digital Foundation Management (product pages). As a result:
- **Track A (SMB service businesses):** Safe to design and build now
- **Track B (DTC product pages, Shopify app):** No design or build before September 1, 2026
- All Track B content in project documents is planning documentation only
- Independent legal advice has been recommended before proceeding with Track B

---

## The Three Non-Negotiables

1. **Full value for free users** — free users get 100% of the product for one domain. Paid users pay for breadth and continuity, never depth.
2. **Horizontal gating only** — the product never withholds data or features to create upgrade pressure.
3. **Ad-free forever** — one customer, one interest. No exceptions.

---

## Two User Tracks

| Track | User | Status |
|-------|------|--------|
| Track A | SMB service business owners (physios, dentists, lawyers, restaurants) | MVP — build from Sep 1 |
| Track B | DTC ecommerce founders, Shopify merchants | V2 — design and build from Sep 1 only |

---

## Launch Timeline

| Date | Milestone |
|------|-----------|
| Sep 1, 2026 | Full launch — Track A, all 5 pillars, free tier |
| Nov 1, 2026 | Paid Growth tier (€19/month) via Stripe |
| Q1 2027 | Shopify app — Track B (if validated) |
| Q2 2027 | Agency tier |
| 2027–2028 | llms.txt verified index, trust score API |

---

## Key Documents

| Document | Contents |
|----------|---------|
| tryagentscore_prd_v4.md | Full product requirements — all decisions, technical specs, pricing, phasing |
| tryagentscore_ux_spec.md | Homepage, results page, pricing page, post-purchase experience — copy, layout, UX flows |
| tryagentscore_agent_brief.md | This document — orientation for any new agent |

---

## Tone and Voice

The product voice is a knowledgeable friend explaining something over coffee — not a SaaS company, not a consultant. Warm, plain, calm, confident. The target user is a busy non-technical professional with limited resources. No jargon. No anxiety-inducing copy. No urgency tactics.

---

## What Has Been Decided (do not reopen)

- Pricing: Free (1 domain) + Growth €19/month. No other tiers at launch.
- Gating: Horizontal only. Free = full product, 1 domain.
- Score formula: (Technical × 0.30) + (Citation Rate × 0.70)
- Auth: Magic link only. No passwords.
- Payments: Stripe Checkout only. Card data never touches our servers.
- Analytics: PostHog (persistence: memory) + Plausible. No Google Analytics.
- Citation framing: "In our test, AI search tools mentioned your business in X of 20 searches."
- Post-purchase: Clean slate welcome screen + immediate welcome email. No drip sequence.
- Track B: Planning documentation only until Sep 1, 2026.

---

## What Is Still Open

- Beta user recruitment (5–8 users needed pre-launch for benchmark seeding and testimonials)
- GTM doc — to be written as standalone document
- Weekly email digest — full design not yet completed
- Mobile layout — not yet specced
- Dev handover — not yet packaged
