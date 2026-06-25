# tryagentscore.com — UX Specification
Version: 1.0 | Last Updated: June 2026
Status: Homepage and results page complete. Email digest delta variants, mobile layout, error/empty states pending.

---

## DESIGN PRINCIPLES (apply to every screen)

1. **Whitespace is mental space** — generous padding, never crowded
2. **Progressive disclosure** — most important finding first, detail below
3. **One action per zone** — never two CTAs competing in the same visual space
4. **No anxiety** — amber not red for low scores, no fear copy, no urgency tactics
5. **Plain language** — no jargon. "LLM" never appears in user-facing copy.
6. **Calm defaults** — no pop-ups, no animations for their own sake, no confetti

**Voice:** A knowledgeable friend explaining over coffee. Not a SaaS company. Warm, plain, calm, confident.

---

## PAGE 1 — HOMEPAGE

### HERO (full screen, above the fold)
One headline. One subline. One input. Nothing else.

#### Headline:
Find out if AI search is recommending your business

#### Subline:
Paste your website URL — get your score in 30 seconds. Free.

#### Input:
- Single URL field, wide, centred
- Placeholder: `yourbusiness.com`
- Button: `Check my score` (Not "Scan", "Analyse", or "Get Started")

#### Below button — social proof:
"14,823 businesses checked so far" (live counter from DB)

#### Visual treatment:
- White or very light warm grey background
- No hero image, illustration, or animation
- Generous vertical padding
- Accent colour on button only

---

### ZONE 2 — THE PROBLEM (3 short paragraphs, no section header)

When someone searches for a physio in Berlin, a restaurant for dinner, or the best skincare serum — they're increasingly asking ChatGPT or Google AI instead of typing into a search bar.

Those tools pick a handful of businesses to recommend. Many websites — even good ones — don't make the cut.

tryagentscore shows you where you stand, and what to fix.

No bullet points. No jargon. Reads in 15 seconds.

---

### ZONE 3 — HOW IT WORKS (3 steps)

1. **Paste your URL** — Takes 5 seconds
2. **See your score** — Ready in 30 seconds
3. **Fix what matters** — Plain-English list

One sentence per step. No technical terms.

---

### ZONE 4 — TRUST

One quote only (not a testimonials wall). First name, city, profession.
*Example:* "I had no idea ChatGPT wasn't finding my clinic. Fixed it in a week." — Anna, Berlin, Physiotherapist

No placeholder logos — empty trust bars signal insecurity.

#### Privacy line (small, below input or in this zone):
"No account needed. We never share your data."

---

### FOOTER

About · Pricing · Privacy · Terms · Contact  
No social media icons at launch.

---

### HOMEPAGE — WHAT IS DELIBERATELY ABSENT

- Feature breakdown / pillars — overwhelming for non-tech user
- Pricing section — introduces money decision before value
- How-it-works video — adds friction; scan sells itself
- Multiple CTAs — competing CTAs cause paralysis
- Technical language — wrong register for this audience
- Anxiety-inducing copy — against product philosophy

---

## PAGE 2 — RESULTS PAGE

### CONFIRMED HERO LINE:
"In our test, AI search tools mentioned your business in X out of 20 searches. Here is your full report."

**Why this framing:**
- "In our test" — honest about scope, not claiming all real-world queries
- "X out of 20" — concrete, immediate, visceral
- "Here is your full report" — professional, not a grade

---

### ZONE 0 — SCORE HEADER (~1.5s)

```
yourbusiness.com                         [Share]  [Export]

In our test, AI search tools mentioned your business
in 4 out of 20 searches. Here is your full report.

            Citation Readiness Score
                    34/100
      ████████░░░░░░░░░░░░░░░░░░░░░░░░

  The average for service businesses is 31/100.
```

#### Colour logic:
- **0-39:**   Amber (room to grow — not failure, not red)
- **40-69:**  Blue (solid foundation)
- **70-100:** Green (strong visibility)
- **Red:** reserved for critical technical blocks in audit ONLY

Benchmark line: only appears once 10+ scans exist per category. Omitted entirely before that — no placeholder, no "coming soon".

---

### ZONE 1 — AI READINESS AUDIT (~1.5s, parallel with Zone 0)

```
-- Technical Readiness --

[tick]   Schema markup detected
[tick]   Page renders without JavaScript
[warn]   No llms.txt file found
[warn]   robots.txt blocks some AI crawlers
[cross]  No structured contact information
[tick]   Fresh content (updated within 90 days)
```

#### Language rules:
- `tick` = state what was found, positively ("Schema markup detected")
- `warn` = state what is missing, neutrally ("No llms.txt file found")
- `cross` = state the issue without blame ("No structured contact information", NOT "Missing contact info")

No scores or percentages. Pass/warn/fail only.

---

### ZONE 2 — CITATION SCAN (streams live, 5-60s)

```
-- AI Citation Test --

Checking how AI search tools respond to queries
about your business...

"Best physiotherapist in Mitte, Berlin"       cited
"Where should I go for back pain in Berlin?"  not cited
"Recommended physio near Alexanderplatz"      cited
...                               scanning 5 of 20
```

Each prompt appears one by one as SSE results arrive.

After scan completes:

```
Results: cited in 4 of 20 searches

Informational queries    ████████░░  2/5  cited
Local intent queries     ██░░░░░░░░  1/5  cited
Comparison queries       ██░░░░░░░░  1/5  cited
Direct queries           ░░░░░░░░░░  0/5  cited
```

Four intent categories. Plain English labels only.

---

### ZONE 3 — COMPETITOR GAP (appears with first citation result)

```
-- Who AI is recommending instead --

These businesses appeared in searches where
you were not cited:

physioberlinmitte.de        appeared in 11 of 20 searches
berlinsportsklinik.com      appeared in 8 of 20 searches
praxisschmidt-berlin.de     appeared in 6 of 20 searches

+ Add a competitor to track  [enter URL]
```

**Tone:** purely informational. No competitive anxiety language. Fully visible to all users. No blur.

---

### ZONE 4 — FIX LIST + ASSETS

```
-- Your action plan --

These three changes will have the most impact:

1  Add an llms.txt file to your website
   Tells AI tools exactly what your business does
   and where you are located.
   [Download your llms.txt]          Takes 5 minutes

2  Fix your robots.txt file
   Two AI crawlers are currently being blocked.
   [Download updated robots.txt]     Takes 2 minutes

3  Add structured contact information
   AI tools struggle to find businesses without
   a clearly marked address and phone number.
   [See how to add this]             Takes 10 minutes

[+ 6 more items]
```

Top 3 visible by default. Each has a time estimate. Download buttons prominent. Remaining fixes collapsed.

---

### ZONE 5 — BOT TRACKING

```
-- Know when AI tools visit your site --

See exactly when ChatGPT, Perplexity and Google AI
crawl your website.

[WordPress]  [Cloudflare]  [HTML snippet]

This feature is included in Growth — 19 EUR/month.
[Start with Growth]    [Maybe later]
```

"Maybe later" always present. Never a dead end.

---

### EMAIL CAPTURE (inline card after Zone 1 — NOT a pop-up)

```
Want to know when your score improves?

We'll re-run this scan weekly and email you
when something changes. Free.

[your@email.com              ]  [Notify me]

No spam. Unsubscribe anytime. Privacy policy.
```

Inline only. User can scroll past without friction.

---

### PERSISTENT URL BAR

```
tryagentscore.com/results/a3f9b2c1   [Copy link]
```

Always visible. Share mechanic — forwarding to a developer is free distribution.

---

### RESULTS PAGE — WHAT IS DELIBERATELY ABSENT

- Red for low scores — triggers anxiety, not motivation
- "Your competitors are winning" — against product philosophy
- Score as a grade (F, D+) — infantilising for professionals
- Upgrade gate on any data — against founding philosophy
- Multiple CTAs per zone — causes paralysis
- Technical terms in fix copy — wrong register for this persona

---

## PAGE 3 — PRICING (/pricing)

Linked from footer only. No pricing on homepage.

```
tryagentscore is free for one website. Always.

Free                     Growth  19 EUR/month
                         Cancel anytime
---                      ---
1 website                Unlimited websites
Full scan                Full scan on all
All fix files            Daily scanning
Competitor data          12-week score history
PDF + CSV export         Weekly email digest
Latest scan only         AI bot tracking
                         Auto-regenerated fix files
---                      ---
[Check my score]         [Start with Growth]
```

No annual/monthly toggle at launch. No "most popular" badge (only one paid tier).  
Questions? `hello@tryagentscore.com`

---

## UPGRADE TRIGGER SCREENS

### Trigger A — Second domain attempt

```
You have already scanned yourbusiness.com

Growth gives you unlimited websites — scan every page,
every location, every competitor.
19 EUR/month, cancel anytime.

[Start with Growth]  [Scan yourbusiness.com again]
```

### Trigger B — Scan rate limit

```
Your next free scan is available in 4 days

Growth includes daily scanning and 12 weeks of
score history.

[Start with Growth]  [I'll wait]
```

### Trigger C — Bot tracking gate (Zone 5, results page)

```
This feature is included in Growth — 19 EUR/month.
[Start with Growth]    [Maybe later]
```

---

## POST-PURCHASE FLOW

### WELCOME SCREEN (/welcome)

```
Welcome to Growth

Here is what is now available to you.

Unlimited websites — scan any URL
Daily scanning — your sites update themselves
12-week score history
Weekly email digest
AI bot tracking

What would you like to do first?

[Scan a new website]   [Back to my results]

Receipt sent to name@email.com · Manage billing
```

No confetti. No celebration animation. Clean and professional. "Manage billing" links to Stripe Customer Portal.

---

### WELCOME EMAIL (within 60 seconds of purchase)

**Subject:** You're on Growth — here is what to do first

Hi [first name],

You're now on Growth. Here is what has changed:

- Unlimited websites — scan any URL
- Daily auto-scanning
- 12-week score history
- Weekly digest
- AI bot tracking

One thing worth doing now: scan any other websites you want to track. Growth will pick them up for daily monitoring automatically.

[Scan a new website]

Receipt on its way from Stripe separately.  
Questions? Reply to this email — I read everything.

Nikhil  
tryagentscore.com  

Manage your subscription · Unsubscribe

**Key decisions:**
- Signed by founder first name — not "The tryagentscore Team"
- "Reply to this email — I read everything" — surfaces real problems early
- One CTA only — most natural next action after paying
- No upsell, no referral ask, no survey
- No drip sequence beyond this email

---

### DAY 7 — FIRST WEEKLY DIGEST

**Subject:** Your weekly AI visibility report — yourbusiness.com

yourbusiness.com · Week 1

```
Citation Readiness Score
This week    34/100   ████████░░░░░░░░░░░░░░░░
Last week     —       (first scan)

In our test, AI search tools mentioned your
business in 4 of 20 searches this week.

Top action for this week:

Your robots.txt is blocking PerplexityBot.
This is the single most impactful fix available.

[Download updated robots.txt]

[See your full report]
```

Unsubscribe · Manage subscription

One action only. "In our test" framing maintained throughout.

---

## STILL TO DESIGN

- [ ] Weekly digest — delta variants (score improved, score dropped, no change)
- [ ] Mobile layout — all screens
- [ ] Product Hunt landing page variant
- [ ] Error states — failed scan, timeout, unsupported URL
- [ ] Empty states — no benchmark data yet, no competitors found
