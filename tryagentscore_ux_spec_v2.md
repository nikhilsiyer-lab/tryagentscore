# tryagentscore.com — UX Specification
Version: 2.0 | Last Updated: June 2026
Status: Homepage complete. Results page complete (bot tracking replaced with
competitive report teaser). Pricing page complete. Post-purchase complete.
Still pending: digest delta variants, mobile layout, error/empty states.

CHANGELOG v2.0
- Zone 5 updated: bot tracking install card -> competitive report teaser
- Zero citation hero line updated — diagnosis framing
- Score label updated: "AI visibility baseline"
- "What this means" block added for zero-score results
- Growth feature list updated: bot tracking -> competitive report
- Upgrade trigger 1 updated: competitive report gate (was: bot tracking)

---

DESIGN PRINCIPLES (apply to every screen)

1. Whitespace is mental space — generous padding, never crowded
2. Progressive disclosure — most important finding first, detail below
3. One action per zone — never two CTAs competing in the same visual space
4. No anxiety — amber not red for low scores, no fear copy, no urgency tactics
5. Plain language — no jargon. "LLM" never appears in user-facing copy.
6. Calm defaults — no pop-ups, no animations, no confetti
7. Zero citations = a starting line, not a failure

Voice: A knowledgeable friend explaining over coffee. Warm, plain, calm, confident.

---

PAGE 1 — HOMEPAGE

HERO (full screen, above the fold)
One headline. One subline. One input. Nothing else.

Headline:
  Find out if AI search is recommending your business

Subline:
  Paste your URL — get your score in 30 seconds. Free.

Input:
  Placeholder: yourbusiness.com
  Button: Check my score

Below button:
  247,931 businesses checked so far  (live counter from DB)

Trust bar:
  No sign-up required   ·   Privacy-first   ·   No data sold

Visual: White background. No gradient. Accent colour on button only.

---

ZONE 2 — THE PROBLEM

  When someone searches for a physio, a restaurant for dinner, or the best
  skincare product — they're increasingly asking ChatGPT or Google AI
  instead of typing into a search bar.

  Those tools pick a handful of businesses to recommend. Many websites —
  even good ones — don't make the cut.

  tryagentscore shows you where you stand, and what to fix.

---

ZONE 3 — HOW IT WORKS

  1 Paste your URL       2 See your score        3 Fix what matters
    Takes 5 seconds        Ready in 30 seconds     Plain-English list

---

ZONE 4 — TRUST

  One quote. First name, city, profession.
  "I had no idea ChatGPT wasn't finding my clinic. Fixed it in a week."
  — Anna, Berlin, Physiotherapist

  Privacy line: "No account needed. We never share your data."

FOOTER: About · Pricing · Privacy · Terms · Contact

---

PAGE 2 — RESULTS PAGE

ZONE 0 — SCORE HEADER

Non-zero hero line:
  "In our test, AI search tools mentioned your business in X out of
  20 searches. Here is your full report."

Zero hero line:
  "AI search tools did not mention your business in any of our
  20 test searches. That is common for new sites — and it is fixable."

Score label: "AI visibility baseline"  (NOT "Citation Readiness Score")

Score colours:
  0-39:   Amber  (room to grow — not failure, not red)
  40-69:  Blue   (solid foundation)
  70-100: Green  (strong visibility)
  Red: reserved for critical technical blocks in audit ONLY

Benchmark line: only when 10+ scans exist per category. Omitted before that.

"What this means" block (zero scores only):
  "Your page is technically live, but AI tools are not yet choosing it
  in test searches. This usually improves after clearer page text,
  crawler access, and more mentions across the web."

---

ZONE 1 — AI READINESS AUDIT

14 factors. Pass/warn/fail. No scores or percentages.

Language rules:
  tick  = "Schema markup detected"
  warn  = "No llms.txt file found"
  cross = "No structured contact information"  (not "Missing contact info")

---

EMAIL CAPTURE (inline card after Zone 1 — NOT a pop-up)

  Want to know when your score improves?
  We'll re-run this scan weekly and email you when something changes. Free.
  [your@email.com]  [Notify me]
  No spam. Unsubscribe anytime. Privacy policy.

---

ZONE 2 — CITATION SCAN (streams live)

Each prompt streams in one by one. After complete:

  Results: cited in 4 of 20 searches

  Informational queries    ████████░░  2/5  cited
  Local intent queries     ██░░░░░░░░  1/5  cited
  Comparison queries       ██░░░░░░░░  1/5  cited
  Direct queries           ░░░░░░░░░░  0/5  cited

Zero state: "AI tools did not cite your business in any of the 20 test
searches. The most common reason is insufficient crawlable content —
see your action plan below."

---

ZONE 3 — COMPETITOR GAP

  "These businesses appeared in searches where you were not cited:"

  physioberlinmitte.de        appeared in 11 of 20 searches
  berlinsportsklinik.com      appeared in 8 of 20 searches
  praxisschmidt-berlin.de     appeared in 6 of 20 searches

  + Add a competitor to track  [enter URL]  (up to 3, free)

Tone: purely informational. No competitive anxiety language. No blur.

---

ZONE 4 — FIX LIST + ASSETS

  "These three changes will have the most impact:"

  1  Add an llms.txt file       [Download your llms.txt]   Takes 5 minutes
  2  Fix your robots.txt        [Download updated robots]  Takes 2 minutes
  3  Add structured contact     [See how to add this]      Takes 10 minutes

  [+ 6 more items]

Top 3 by impact. Time estimate per fix. Download buttons prominent.

---

ZONE 5 — COMPETITIVE REPORT TEASER (replaces bot tracking)

  "See how you compare across AI tools"

  These businesses are being cited in searches where you are not:

  competitor1.com     ████████████░░░░  12/20  ← visible
  competitor2.com     ████████░░░░░░░░   8/20  ← visible
  competitor3.com     █████░░░░░░░░░░░   5/20  ← visible
  [+ 7 more]          ░░░░░░░░░░░░░░░░  ████   ← blurred

  See the full breakdown across ChatGPT, Perplexity, Gemini and Claude —
  which prompts trigger citations for your competitors, and what
  their pages do differently.

  [Unlock competitive report →]    19 EUR/month · Cancel anytime
  [Maybe later]

DESIGN NOTE: The raw citation count (e.g. 12/20) is visible to all users.
Only the cross-LLM breakdown, prompt detail, and gap analysis are gated.
This is the only place in the product where data is partially withheld.
"Maybe later" is always present.

---

PERSISTENT URL BAR

  tryagentscore.com/results/a3f9b2c1   [Copy link]

Always visible. Share mechanic.

---

EXPORT ROW

  [Export PDF]  [Export CSV]   Free and paid.

---

PAGE 3 — PRICING (/pricing)

  tryagentscore is free for one website. Always.

  Free                          Growth  19 EUR/month, cancel anytime
  ---                           ---
  1 website                     Unlimited websites
  Full scan                     Full scan on all
  All fix files (download once) Daily scanning
  Competitor data (3 sites)     12-week score history
  PDF + CSV export              Weekly email digest
  Latest scan only              Competitive report (10 sites, 4 AI tools)
                                Auto-regenerated fix files

  [Check my score]              [Start with Growth]

---

UPGRADE TRIGGER SCREENS

Trigger A — Competitive report gate (Zone 5)
  "See how 10 competitors are being cited across ChatGPT, Perplexity,
  Gemini and Claude. 19 EUR/month, cancel anytime."
  [Start with Growth]  [Maybe later]

Trigger B — Second domain attempt
  "You have already scanned yourbusiness.com.
  Growth gives you unlimited websites.
  19 EUR/month, cancel anytime."
  [Start with Growth]  [Scan yourbusiness.com again]

Trigger C — Scan rate limit
  "Your next free scan is available in 4 days.
  Growth includes daily scanning and 12 weeks of score history."
  [Start with Growth]  [I'll wait]

---

POST-PURCHASE FLOW

WELCOME SCREEN (/welcome)

  Welcome to Growth

  Here is what is now available to you.

  Unlimited websites — scan any URL
  Daily scanning — your sites update themselves
  12-week score history
  Weekly digest
  Competitive report — see how you compare across 4 AI tools
  Auto-regenerated fix files

  [Scan a new website]   [Back to my results]

  Receipt sent to name@email.com · Manage billing

---

WELCOME EMAIL (within 60 seconds)

Subject: You're on Growth — here is what to do first

Hi [first name],

You're now on Growth. Here is what has changed:

  Unlimited websites
  Daily auto-scanning
  12-week score history
  Weekly digest
  Competitive report — 10 competitors across 4 AI tools
  Auto-regenerated fix files

One thing worth doing now: scan any other websites you want to track.
Your first competitive report arrives in 7 days.

[Scan a new website]

Reply to this email — I read everything.
Nikhil · tryagentscore.com

---

DAY 7 — FIRST WEEKLY DIGEST + COMPETITIVE REPORT

Digest subject: "Your weekly AI visibility report — yourbusiness.com"

Score section:
  This week    34/100
  Last week     —     (first scan — this is your baseline)

  "In our test, AI search tools mentioned your business
  in 4 of 20 searches this week."

  Top action: [single highest-impact fix + download button]

Competitive section (new — Growth only):
  "How you compare this week"

  You               ████░░░░░░░░░░░░   4/20
  competitor1.com   ████████████░░░░  12/20
  competitor2.com   ████████░░░░░░░░   8/20

  "competitor1.com is cited 3x more often than you.
  Their main advantage: an llms.txt file and structured
  schema on every page. Both are in your action plan."

  [See full competitive report →]

---

STILL TO DESIGN

[ ] Weekly digest — delta variants (score improved, score dropped, no change)
[ ] Mobile layout — all screens
[ ] Product Hunt landing page variant
[ ] Error states — failed scan, timeout, unsupported URL
[ ] Empty states — no benchmark data yet, no competitors found, zero citations
[ ] Bot tracking dashboard — Phase 2
