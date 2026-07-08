# Developer Agent Brief — Home Page, Pro Offering, Pricing, Analytics & Subscription Management (Updated)

## CHANGELOG (latest updates at top)
- NEW: "Top 10 list" added as a distinct query TYPE (not a ranking/scoring system) alongside existing query types (direct, intentional, etc.). This directly asks the LLM "give me your top 10 [category] in [location]" and checks whether the business is cited in that specific list-style response. Explicitly NOT framed as an algorithmic ranking or position (no "#4 of 10" claims) - framed only as "cited when explicitly asked for a top 10 list: yes/no."
- Rationale: a business may not be cited in a normal/direct customer query ("best plumber near me") but IS cited when the LLM is asked to enumerate a top 10 list - these are genuinely different signals requiring different user action, so tracked and reported separately rather than merged into one score.
- Query taxonomy now includes (non-exhaustive, extensible): Direct query, Intentional/commercial-intent query, Top 10 list query. Each type reported as its own citation result, not blended into a single number.
- Previous update retained: monthly report cadence (Phase 1), Phase 2 defers monitoring/alerts, Pro feature list finalized, EUR 14.99 pricing, no-dark-pattern positioning rules, billing hygiene, analytics.

---

## 1. Home Page Experience (3 Scenarios)
(unchanged from previous version — anonymous scan flow, free dashboard with DIY-first insight cards, Pro dashboard with monthly report + on-demand generation. See prior sections for full detail; retained as-is.)

---

## 2. Query Taxonomy (NEW SECTION — clarifies scan methodology)

Scans should test multiple distinct query types per business, each reported separately rather than averaged into one blended score, since each type implies a different user action:

### 2.1 Direct query
Example: "best plumber in Rotterdam"
Tests natural, realistic customer phrasing. This is the primary/default query type and drives the main citation rate metric.

### 2.2 Intentional / commercial-intent query
Example: "who should I hire to fix a leaking pipe in Rotterdam tonight"
Tests higher-intent, more specific phrasing closer to an actual buying moment. Reported as its own citation result.

### 2.3 Top 10 list query (NEW)
Example: "give me the top 10 plumbers in Rotterdam"
- Explicitly asks the LLM to enumerate a list, then checks whether the business appears anywhere in that list.
- Reported strictly as a binary/citation result: "Cited when asked for a top 10 list: Yes/No" — NOT as a ranking or ordinal position (do not report "#4 of 10" or similar; LLM list ordering is not reliable or stable enough to support a ranking claim, and this must not be misrepresented to the user).
- Valuable specifically because it can diverge from the Direct query result: a business might not appear in a natural single-recommendation answer but does appear when the model is asked to be exhaustive (or vice versa) — this divergence itself is useful, actionable information.
- Different user action depending on outcome:
  - Cited in Direct AND Top 10 list -> strong position, maintain.
  - NOT cited in Direct BUT cited in Top 10 list -> business exists in the model's "awareness" but isn't the default recommendation - suggests differentiation/positioning gap (e.g., needs stronger unique-selling-point content).
  - Cited in neither -> visibility gap, foundational issue (e.g., missing llms.txt, thin content, no citations elsewhere online).

### 2.4 Reporting format
Each query type shown separately in the report, e.g.:
- "Direct customer questions: Cited in 4 of 10 checks"
- "High-intent questions: Cited in 6 of 10 checks"
- "When asked for a top 10 list: Cited — Yes" (binary, no position claimed)

Free tier: shows Direct query result only (diagnosis), consistent with existing Free/Pro split principle.
Pro tier: shows all query types (Direct, Intentional, Top 10 list) plus competitor names appearing alongside in Top 10 list results.

---

## 3. Pro Offering — Finalized Feature List (Phase 1 Launch Scope)

1. **Reliable, multi-sample, multi-model scoring** across multiple query types (Direct, Intentional, Top 10 list — see Section 2), each run multiple times across Gemini/ChatGPT/Claude, reported per query type as a citation rate — not blended into one number, not framed as an ordinal ranking.
2. **Monthly report** — bundles the above, competitor comparison, and generated fixes into one delivered artifact per month. ~50 scans/month bundled allowance.
3. **Competitor benchmarking** — top 3-5 competitors tracked; for Top 10 list queries, shows which competitors were also cited (not a ranked order, just co-citation visibility).
4. **Historical trend chart** — tracks citation rate per query type over successive monthly reports.
5. **Auto-generated fixes/files wherever possible** — llms.txt, schema snippets, FAQ copy — available on demand.
6. **Downloadable PDF report** — shareable monthly artifact.

### Explicitly deferred to Phase 2 (roadmap only)
- Continuous/automatic backend monitoring, exception-based real-time alerts.
- Future "Autonomous Agent" tier (auto-publish/CMS integration).

### Free vs Pro insight pattern (unchanged)
- FREE: diagnosis (Direct query result only) + genuinely usable DIY instructions.
- PRO: full query-type breakdown (Direct, Intentional, Top 10 list), competitor co-citation, generated fixes.

---

## 4. Pricing Strategy
- EUR 14.99/month, flat fee, ~50 scans/month bundled, early access / founding price.
- Grandfathered pricing for early adopters.
- Future "Autonomous Agent" tier: EUR 50-150+/month, roadmap only.

---

## 5. Subscription Management (unchanged)
Self-service cancellation, resume, upgrade/downgrade, Stripe Billing Portal for payment/billing history, failed-payment grace period, persistent plan status visibility.

---

## 6. Pro Communication & Positioning Rules (unchanged, extended to new query type)

Insight/report copy must be precise about what the Top 10 list result means, to avoid misrepresenting it as a ranking:
- Correct: "You were cited when we asked the AI for a top 10 list of plumbers in Rotterdam."
- Incorrect/must avoid: "You ranked #4 out of 10 plumbers." (implies precision/ordering the method does not support)

Free tier still gets a genuinely usable DIY explanation of what the Top 10 list check means, even though the actual Top 10 list result itself is Pro-only:
"Free tier copy: 'AI models sometimes list businesses when asked for a "top 10" style recommendation, separately from normal search-style questions. Pro checks this for you and tells you whether you're included.'"

All previous positioning rules (what-you-get clarity, no dark patterns, DIY path always shown) remain unchanged and apply to this new insight type as well.

---

## 7. Analytics (unchanged, extended)
Add tracking per query type (Direct, Intentional, Top 10 list) to the existing scan/insight event logging — citation rate and engagement should be trackable independently per type, not just in aggregate, since they may perform very differently and drive different upgrade/retention behavior.

---

## 8. Subscription Management, Pricing, Communication Rules, Analytics Details
(See Sections 3-7 above and prior versions of this document for full unchanged detail on billing hygiene, pricing page structure, and analytics implementation notes - retained as-is from previous update.)


---

## 9. Recommendation Learning Loop (NEW SECTION)

### 9.1 Problem statement
At launch, we do not actually know which suggested fixes (llms.txt, schema markup, FAQ content, homepage copy changes, etc.) causally improve LLM citation rates. Recommendations are initially based on best-guess GEO practice, not validated outcomes. Over time, cross-user outcome data should be used to learn which fixes actually move the needle, and refine what gets suggested going forward.

### 9.2 Core mechanism
Because the product already tracks (a) which fix was suggested, (b) whether the user marked it "Applied," and (c) the next monthly citation-rate result, this creates a natural before/after dataset per fix per user, per query type. Aggregating this across all Pro users over time enables a feedback loop:

1. **Log every suggestion-to-outcome pair**: fix type (e.g., "generated llms.txt"), date applied, business's citation rate in the month before vs. the month after, per query type (Direct, Intentional, Top 10 list).
2. **Aggregate across users**: for each fix type, compute average citation-rate change across all users who applied it vs. a baseline of users who had the same diagnosed gap but did NOT apply the fix (control-like comparison, even if informal/observational rather than a true randomized experiment).
3. **Surface fix effectiveness internally**: an internal (not customer-facing initially) view showing, e.g., "llms.txt generation: users who applied it saw citation rate improve by X percentage points on average over Y users" vs. "FAQ content drafts: no significant average change observed yet."
4. **Feed learnings back into recommendation logic**: prioritize suggesting fixes with demonstrated higher average impact first; deprioritize or stop suggesting fixes that show no measurable effect after sufficient sample size; refine the generated content itself (e.g., if short llms.txt files underperform long ones, adjust the generation template).

### 9.3 Important caveats (to avoid false confidence)
- This is observational, not a controlled experiment — users who apply fixes may differ systematically from those who don't (more engaged, more established businesses, etc.), so correlation should not be oversold as proven causation internally or externally.
- Sample size will be small initially (early users, monthly cadence = slow data accumulation — roughly one data point per user per fix per month). Do not act on a fix's apparent effectiveness until a reasonable minimum sample is reached (define a threshold, e.g., 30+ before/after pairs, before treating a signal as meaningful).
- LLM outputs and provider models change independently over time (model updates, retraining) — a fix that "worked" in one month may not hold as models evolve, so effectiveness data should be treated as a rolling/decaying signal, not a permanent truth, and periodically re-validated.
- Never expose unvalidated "this fix improves visibility by X%" claims to customers until the internal sample size and consistency genuinely support it — this connects to the no-dark-patterns/honesty principle already established in Section 6.

### 9.4 Data requirements (build implications)
- Every fix generation and "Mark as Applied" action must be timestamped and linked to the specific business/domain and specific query-type citation-rate history (already logged per Section 7/Analytics).
- Store fix effectiveness data at the fix-type level (not just per-user), aggregated in a way that supports internal analysis (e.g., a simple internal query/dashboard, not necessarily ML infrastructure at this stage — this is a measurement problem before it is a machine-learning problem).
- Phase 1: manual/internal analysis of this data (e.g., a monthly internal review: "which fixes are showing signal") is sufficient — do not over-invest in automated ML-driven recommendation ranking until there is enough data to make it meaningful. Revisit automating this once sample sizes and consistency justify it.
- Longer-term (Phase 2+): once sufficient data exists, recommendation prioritization logic can be automated to surface the fixes with the strongest observed track record first, and this becomes a genuine, defensible product moat (proprietary data on "what actually improves LLM citation," which competitors without a comparable user base and outcome-tracking loop cannot easily replicate).

### 9.5 Why this matters strategically
This is a long-term differentiator beyond the current feature set — most GEO tools recommend fixes based on generic best practice; almost none can say "based on data from N businesses, this specific fix has shown a measurable average improvement." Building the tracking infrastructure now (even without automating the learning yet) means the data asset compounds from day one, and becomes harder for competitors to replicate the longer the product runs.


---

## 10. Distribution & pSEO — Technical Requirements (NEW SECTION)

### 10.1 Strategic rationale
Every completed scan produces a real, unique data point (citation rate, competitor mentions, top-10-list status) for a specific business/location/category. This is genuine raw material for programmatic SEO (pSEO) — publicly indexable pages generated from real product data, not thin templated fluff. This is a distinct engineering workstream, not just a marketing/content task, and should be scoped with its own technical requirements and launch blockers.

### 10.2 Page types to build
| Page type | URL pattern example | Content source |
|---|---|---|
| Business visibility snapshot | /reports/[business-slug]-ai-visibility | Auto-generated from a completed scan (opt-in required) |
| Category x location pages | /best-ai-visibility/[category]-[city] | Aggregated results across scanned businesses in that niche+city |
| "Is [Business] mentioned by ChatGPT" pages | /is/[business-slug]-mentioned-by-chatgpt | Single query-type result, direct-answer framed |
| Competitor comparison pages | /compare/[business-a]-vs-[business-b]-ai-visibility | Auto-generated when 2+ businesses in same category/location are scanned |
| Educational pillar/cluster content | /learn/llms-txt-guide, /learn/what-is-geo | Manually written, not data-driven; can launch immediately |

Sequencing: start with business snapshot pages (available from day one of scans), add category/location and comparison pages once scan volume in a niche justifies it, write educational pillar content in parallel.

### 10.3 Core technical requirements
1. **Rendering approach:** pSEO pages must be server-side rendered or statically generated (e.g., Next.js SSR/ISR), not client-rendered SPA — crawlers (Googlebot, GPTBot, ClaudeBot, PerplexityBot) need fully-rendered HTML on first load.
2. **Dynamic page generation pipeline:** a job/queue that generates or updates a page whenever a triggering event occurs (scan completes + opt-in, or category+location hits a minimum scan-volume threshold). Templating layer for public pages should be separate from the authenticated dashboard UI.
3. **URL structure and routing:** clean, stable, human-readable slugs with collision handling (duplicate business names), added as routes alongside existing app routes.
4. **Sitemap generation:** auto-updating XML sitemap(s), segmented to stay under 50,000 URLs per file, regenerated as pages are added — not a static file once volume grows.
5. **Indexing controls (critical, avoids thin-content penalties):**
   - noindex any page below a data-sufficiency threshold (e.g., category+location page with only 1-2 scanned businesses).
   - Canonical tags to prevent duplicate-content conflicts (e.g., a business appearing in both its own report and a comparison page).
   - Data-driven robots/meta-robots logic, not manually maintained.
6. **Structured data (schema markup):** each page type needs appropriate schema (LocalBusiness, Organization, FAQPage, Article, etc.) auto-generated from the same data/engine already being built for the customer-facing llms.txt/schema Pro feature (Section 2/3), repointed at the company's own public pages.
7. **Own llms.txt file:** the company's own domain should have its own llms.txt listing these public pages — practicing the product's own value proposition and aiding LLM citation of the company's own content.
8. **Performance/caching:** use ISR or a CDN caching layer rather than regenerating every page per request, since page count could reach into the thousands.
9. **Data opt-in and privacy handling:** publishing a business's scan result publicly requires explicit opt-in (e.g., at scan-claim time) plus a removal/opt-out mechanism, since this involves a third party's business data being made public.
10. **Database schema additions:** scans table needs `public_page_status` (draft/published/removed), `slug`, `last_regenerated_at` fields; category+location aggregation needs a tracked threshold check for publish eligibility.

### 10.4 Launch blockers (not nice-to-haves)
- Consent/opt-in logic must exist before any scan-derived page is published publicly.
- Thin-content indexing controls (noindex below threshold) must exist before category/location and comparison pages go live, to avoid harming overall domain SEO trust.

### 10.5 Distribution (non-technical, complements pSEO)
- Shareable free-scan results (auto-generated shareable image/link) — lowest-cost distribution lever, ties directly into the existing free scan flow.
- Repurpose report/learning-loop insights (Section 9) into social content (carousels, LinkedIn/Instagram posts, newsletter) — one article can become 3-4 distributable assets.
- Original aggregated benchmark data ("State of AI Visibility for Local Businesses") as a PR/backlink asset once sufficient scan volume exists.
- Partnerships with local marketing agencies/web developers serving small businesses as a trusted referral channel.


---

## 11. GDPR / EU Compliance Requirements (NEW SECTION)

### 11.1 Applicability
GDPR applies to any processing of EU residents' personal data, regardless of where the company is headquartered. This applies to: user account data (email, signup info), scan history tied to an account, AND third-party business data published via pSEO (Section 10) if it identifies an individual (e.g., a sole proprietor's name, a business owner mentioned on a scanned page).

### 11.2 Core requirements

**Lawful basis & consent:**
- User account data: consent/contract basis via signup (magic link) is generally sufficient, but privacy policy must clearly state what is collected and why.
- pSEO public pages (Section 10.3.9): explicit opt-in required before publishing any scan-derived page publicly. This is a hard launch blocker, not optional — publishing third-party business data (and any personal names within it) without consent is a distinct legal exposure beyond SEO risk.
- Cookie/analytics consent: standard CMP (consent management platform) banner required before any non-essential tracking script loads, site-wide, including on public pSEO pages.

**Right to erasure & data portability:**
- Users must be able to request full account deletion (already scoped in Section 4 - Delete Account). Deletion must cascade to: account record, scan history, any published pSEO page tied to their business, and remove them from analytics where feasible.
- Non-account third parties (e.g., a business that was scanned and has a public page but never signed up) must have a straightforward way to request removal/opt-out - a visible "Request removal" link/contact on every public pSEO page is required.
- Deletion confirmations should be logged (audit trail) in case of regulator inquiry.

**Data residency & storage:**
- Evaluate hosting/database provider for EU-region availability (e.g., AWS/GCP/Azure EU region, or Supabase/Postgres EU hosting) - EU data residency is increasingly the safer default given ongoing legal scrutiny of EU-US data transfers.
- If any data is processed in the US (e.g., through certain LLM APIs), document the transfer mechanism (Standard Contractual Clauses) in the privacy policy.

**Sub-processor management:**
- Maintain an internal list of all third-party services touching personal data: Stripe (payments), LLM API providers (Gemini/ChatGPT/Claude - to the extent prompts include user-identifiable data), hosting provider, analytics tool (PostHog/Mixpanel), email/magic-link provider.
- Each should have a Data Processing Agreement (DPA) in place before processing real user data - most established providers (Stripe, major cloud hosts) offer standard DPAs; confirm before going live.
- Publish a sub-processor list in the privacy policy (standard practice, builds trust and is often expected).

**Data minimization:**
- Only collect what's needed: email for account/magic-link, domain/business name for scanning. Avoid collecting unnecessary fields "just in case."
- Applies to pSEO content generation too: generic, aggregated content preferred over exposing unnecessary personal specifics.

**Security baseline:**
- Encryption in transit (TLS) and at rest (standard on most managed DB/hosting providers - confirm enabled).
- Access controls limiting who/what can query personal data internally (relevant given the internal analytics admin view in Section 6).
- Breach notification process: GDPR requires notifying relevant authority within 72 hours of a known breach - even a lean startup needs a basic documented process for this (who to contact, how to assess scope), not full infrastructure.

**Legal pages required before real customer data is processed:**
- Privacy Policy (data collected, purpose, retention, third parties/sub-processors, user rights, contact for data requests).
- Terms of Service.
- Cookie Policy / consent banner copy.
- If targeting Germany/other markets with additional requirements: Impressum equivalent where applicable.

### 11.3 Launch blockers (must exist before processing real EU user/customer data)
- Privacy policy and cookie consent banner live on the site.
- Explicit opt-in mechanism for pSEO public page publishing (ties to Section 10.4).
- Account deletion cascades correctly across account data, scans, and published pages (ties to Section 4).
- DPAs confirmed in place with Stripe, hosting provider, and any LLM API providers processing identifiable data.
- "Request removal" mechanism visible on all public pSEO pages for non-account third parties.

### 11.4 Lower priority / can follow shortly after launch
- Formal sub-processor list published in privacy policy (should exist, but can be finalized in first weeks post-launch as vendor list stabilizes).
- Full breach-notification runbook (basic awareness of the 72-hour requirement is a launch blocker; a polished internal runbook can be refined post-launch).
- ISO 27001 / SOC 2 certification - not required for an early-stage product, but worth flagging as a future trust signal once selling to larger customers or agencies (Section 10.5 partnerships).


---

## 12. Bot Abuse & Security (NEW SECTION)

### 12.1 Risk categories
Two distinct attack surfaces, each with different urgency:

**Risk 1 - API cost abuse (highest priority, directly hits unit economics):**
- Automated repeat scanning of the free/anonymous scan endpoint to run up LLM API costs, or to mass-scrape competitor data.
- Fake account farming (disposable emails) to bypass free-tier scan limits.
- Any exposed API endpoint being hit directly by scripts, bypassing the UI.

**Risk 2 - Content scraping of public pSEO pages (lower urgency, relevant once Section 10 pages are live):**
- Competitors or low-quality aggregator sites scraping generated report/comparison pages and republishing elsewhere, potentially diluting SEO value via duplicate content.

### 12.2 Phasing decision (FOUNDER DECISION)
Baseline anti-abuse measures already scoped as pre-launch blockers in Section 1 (IP/fingerprint rate limiting, Turnstile CAPTCHA on repeat anonymous scans, 24h domain-level scan caching) remain in place for initial launch.

Additional/escalated bot abuse defenses below are explicitly deferred to **Phase 1.5**, to be scoped and prioritized based on actual abuse patterns observed in week 1-2 post-launch, rather than pre-built speculatively. Rationale: real abuse patterns are hard to predict pre-launch, and over-building bot defense before seeing real traffic risks wasted engineering effort or defenses tuned to the wrong threat.

### 12.3 Phase 1.5 candidate defenses (prioritize based on week 1-2 data)
| Defense | Risk addressed |
|---|---|
| Email verification / disposable-email domain blocking on signup | Fake account farming |
| robots.txt + rate-limiting at CDN/WAF level (e.g., Cloudflare) | Content scraping, generic bot traffic |
| Canonical tags + timestamping on pSEO pages | Scraper content diluting SEO position |
| Behavioral bot detection (traffic spike monitoring, WAF rules) | Both risk categories, at scale |
| Allow-listing legitimate AI crawlers (GPTBot, ClaudeBot, PerplexityBot) while blocking scrapers | Balances GEO/citation goals against scraping risk - must not blanket-block bots, since being crawled by legitimate AI bots is core to the product's own value proposition |

### 12.4 Trigger criteria for escalating to Phase 1.5
Monitor from week 1 (ties into Section 6 analytics - scan volume, cost-per-scan, signup patterns) for signals such as:
- Abnormal spike in scans from a single IP range/fingerprint cluster despite existing rate limits.
- Signup volume from disposable/throwaway email domains.
- LLM API cost per day growing disproportionately to genuine signup/usage growth.
- (Once pSEO pages are live) duplicate/near-duplicate content appearing elsewhere shortly after a page is published, or unexplained traffic patterns to specific pSEO URLs.

If none of these signals appear in week 1-2, Phase 1.5 defenses can be delayed further; if they do appear, prioritize the matching defense from Section 12.3 immediately rather than building the full checklist at once.

### 12.5 Explicitly NOT needed pre-launch or in Phase 1.5
Full enterprise-grade bot management (dedicated bot-mitigation vendor, e.g., specialized WAF/bot products) - not justified until real traffic volume exists worth attacking at scale. Revisit only if Phase 1.5 measures prove insufficient.
