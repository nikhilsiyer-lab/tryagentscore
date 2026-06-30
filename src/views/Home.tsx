import { useState } from 'react';
import './Home.css';

interface HomeProps {
  onStartScan: (url: string, description?: string) => void;
}

export default function Home({ onStartScan }: HomeProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      setError('Please enter a valid website URL.');
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
      onStartScan(targetUrl, description.trim());
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
            Is AI search recommending<br className="desktop-br" /> your business?
          </h1>
          <p className="hero-subtitle">
            ChatGPT, Gemini, and Perplexity are replacing Google for local recommendations.
            See if your business makes the cut — and exactly what to fix.
          </p>
          
          <div className="search-box-container">
            <form onSubmit={handleSubmit}>
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
                <button type="submit" className="url-submit-btn" disabled={isLoading}>
                  {isLoading ? (
                    <span className="btn-loading">
                      <span className="btn-spinner"></span>
                      Checking…
                    </span>
                  ) : (
                    'Check my score'
                  )}
                </button>
              </div>

              <div className="description-field-wrapper">
                <label htmlFor="biz-description" className="description-label">
                  What does your business do?
                  <span className="description-optional">Optional — improves accuracy</span>
                </label>
                <input
                  id="biz-description"
                  type="text"
                  className="description-input"
                  placeholder="e.g. We're a physiotherapy clinic in Berlin specialising in sports injuries"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
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
            When someone searches for a local service, a restaurant, or a product recommendation — they are increasingly asking ChatGPT or Google AI instead of typing into a search bar.
          </p>
          <p>
            Those tools pick a handful of businesses to recommend. Many websites — even good ones — don't make the cut.
          </p>
          <p className="problem-highlight">
            tryagentscore shows you where you stand, and what to fix.
          </p>
        </div>
      </section>

      {/* ZONE 3 — HOW IT WORKS */}
      <section className="zone-how">
        <p className="how-section-label">How it works</p>
        <div className="how-grid">
          <div className="how-step">
            <div className="step-num-icon">1</div>
            <h3>Paste your URL</h3>
            <p>We scan your website and identify your business automatically — no setup required.</p>
          </div>
          <div className="how-step">
            <div className="step-num-icon">2</div>
            <h3>We run 14 AI searches</h3>
            <p>We query Gemini with real customer questions and check if your business gets cited.</p>
          </div>
          <div className="how-step">
            <div className="step-num-icon">3</div>
            <h3>Get your action plan</h3>
            <p>Receive a plain-English fix list ranked by impact — so you know exactly what to do next.</p>
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
