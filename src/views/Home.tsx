import { useState, useEffect } from 'react';
import './Home.css';

interface HomeProps {
  onStartScan: (url: string, options: { description?: string; businessType?: string; honeypot?: string; isBot?: boolean; entityType?: string; basedIn?: string; servesMarket?: string; targetClient?: string }) => void;
}

export default function Home({ onStartScan }: HomeProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [entityType, setEntityType] = useState('');
  const [basedIn, setBasedIn] = useState('');
  const [servesMarket, setServesMarket] = useState<'local' | 'national' | 'international'>('local');
  const [targetClient, setTargetClient] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [mountTime, setMountTime] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMountTime(Date.now());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      setError('Please enter a valid website URL.');
      return;
    }
    if (!entityType.trim()) {
      setError('Please tell us what type of business this is.');
      return;
    }

    let targetUrl = inputUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    try {
      new URL(targetUrl);
      setError('');
      setIsLoading(true);

      const timeToSubmit = Date.now() - mountTime;
      const isBot = timeToSubmit < 1500;

      // Build a structured description from the explicit fields
      const parts = [entityType.trim()];
      if (basedIn.trim()) parts.push(`based in ${basedIn.trim()}`);
      if (servesMarket === 'international' && targetClient.trim()) {
        parts.push(`serving ${targetClient.trim()}`);
      } else if (servesMarket === 'national') {
        parts.push('serving clients nationally');
      }
      const structuredDescription = parts.join(', ');

      onStartScan(targetUrl, {
        description: structuredDescription,
        businessType: entityType.trim(),
        entityType: entityType.trim(),
        basedIn: basedIn.trim(),
        servesMarket,
        targetClient: servesMarket === 'international' ? targetClient.trim() : '',
        honeypot,
        isBot,
      });
    } catch (_) {
      setError('Invalid URL format. Example: yourbusiness.com');
    }
  };

  return (
    <div className="home-layout">

      {/* ZONE 1 — HERO */}
      <section className="zone-hero">
        <div className="hero-content">

          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Free · No sign-up · Results in 30 seconds
          </div>

          <h1 className="hero-title">
            When someone checks your<br className="desktop-br" /> business on ChatGPT, what do they find?
          </h1>
          <p className="hero-subtitle">
            Even referral-based clients verify online now. AI tools like ChatGPT and Gemini are the new word-of-mouth check.
            We show you exactly what they see — and what to fix.
          </p>

          <div className="search-box-container">
            <form onSubmit={handleSubmit}>
              {/* Step 1 — URL */}
              <div className="scan-step">
                <div className="scan-step-label">Your website</div>
                <div className="search-form-layout">
                  <input
                    type="text"
                    className="url-search-input"
                    placeholder="yourbusiness.com"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    autoFocus
                    aria-label="Your website URL"
                  />
                </div>
              </div>

              {/* Step 2 — Entity type (required) */}
              <div className="scan-step" style={{ marginTop: '14px' }}>
                <div className="scan-step-label">
                  What type of business?
                  <span className="scan-step-required">Required</span>
                </div>
                <input
                  type="text"
                  className="description-input"
                  placeholder="e.g. Chartered Accountant firm, Physiotherapy clinic, SaaS tool"
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  aria-label="Business entity type"
                />
              </div>

              {/* Step 3 — Location (soft required) */}
              <div className="scan-step" style={{ marginTop: '14px' }}>
                <div className="scan-step-label">
                  Based in
                  <span className="scan-step-optional">Optional — improves accuracy</span>
                </div>
                <input
                  type="text"
                  className="description-input"
                  placeholder="e.g. Bangalore, India"
                  value={basedIn}
                  onChange={(e) => setBasedIn(e.target.value)}
                  aria-label="Business location"
                />
              </div>

              {/* Step 4 — Serves market (one-click toggle) */}
              <div className="scan-step" style={{ marginTop: '14px' }}>
                <div className="scan-step-label">Who do you serve?</div>
                <div className="serves-toggle">
                  {([
                    { value: 'local', label: 'Just my city / region' },
                    { value: 'national', label: 'My country' },
                    { value: 'international', label: 'Internationally' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`serves-option${servesMarket === opt.value ? ' serves-option--active' : ''}`}
                      onClick={() => setServesMarket(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* 3B — optional target client, only if international */}
                {servesMarket === 'international' && (
                  <input
                    type="text"
                    className="description-input"
                    style={{ marginTop: '10px' }}
                    placeholder="Optional — who is your typical client? e.g. NRI clients, US-based startups"
                    value={targetClient}
                    onChange={(e) => setTargetClient(e.target.value)}
                    aria-label="Target client type"
                  />
                )}
              </div>

              {/* Honeypot field - visually hidden */}
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
                <label htmlFor="website-url-optional">Leave this field blank if you are human</label>
                <input
                  id="website-url-optional"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <button type="submit" className="url-submit-btn" disabled={isLoading} style={{ width: '100%', marginTop: '18px', borderRadius: '12px', height: '52px' }}>
                {isLoading ? (
                  <span className="btn-loading">
                    <span className="btn-spinner"></span>
                    Checking…
                  </span>
                ) : (
                  'Check my score →'
                )}
              </button>
            </form>
            {error && <p className="url-error-msg">{error}</p>}
          </div>

          <div className="hero-trust-bar">
            <span className="trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              No sign-up required
            </span>
            <span className="bullet">·</span>
            <span className="trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Privacy-first
            </span>
            <span className="bullet">·</span>
            <span className="trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              No data sold
            </span>
          </div>
        </div>
      </section>

      {/* ZONE 2 — THE PROBLEM */}
      <section className="zone-problem">
        <div className="problem-content-wrapper">
          <p>
            Word of mouth still matters — but the verification step has changed. Before calling, potential clients now ask ChatGPT or Google AI: <em>"Is [Business Name] any good?"</em> or <em>"Who's the best [service] near me?"</em>
          </p>
          <p>
            Those tools pick a handful of businesses to recommend. Many good businesses — even well-reviewed ones — don't appear at all.
          </p>
          <p className="problem-highlight">
            tryagentscore shows you what AI says about your business — and exactly what to fix.
          </p>
        </div>
      </section>

      {/* ZONE 3 — HOW IT WORKS */}
      <section className="zone-how">
        <p className="how-section-label">How it works</p>
        <div className="how-grid">
          <div className="how-step">
            <div className="step-num-icon">1</div>
            <h3>Tell us about your business</h3>
            <p>Enter your URL and a few quick details — your business type and location — so we test the right queries.</p>
          </div>
          <div className="how-step">
            <div className="step-num-icon">2</div>
            <h3>We run real AI searches</h3>
            <p>We query ChatGPT and Gemini with realistic customer questions and check if your business gets recommended.</p>
          </div>
          <div className="how-step">
            <div className="step-num-icon">3</div>
            <h3>Get one clear next step</h3>
            <p>We surface your biggest visibility gap with a plain-English fix — not a wall of technical tasks.</p>
          </div>
        </div>
      </section>

      {/* ZONE 4 — BOTTOM CTA */}
      <section className="zone-bottom-cta">
        <div className="bottom-cta-content">
          <h2 className="bottom-cta-title">Ready to see your score?</h2>
          <p className="bottom-cta-sub">It takes 30 seconds and it's completely free.</p>
          <button
            className="url-submit-btn bottom-cta-btn"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setTimeout(() => document.querySelector<HTMLInputElement>('.url-search-input')?.focus(), 400);
            }}
          >
            Check my score →
          </button>
        </div>
      </section>

    </div>
  );
}
