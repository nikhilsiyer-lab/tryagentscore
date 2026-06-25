import { useState, useEffect } from 'react';
import './Home.css';

interface HomeProps {
  onStartScan: (url: string) => void;
}

export default function Home({ onStartScan }: HomeProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [error, setError] = useState('');
  const [scanCount, setScanCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.count === 'number') {
          setScanCount(data.count);
        }
      })
      .catch(() => {});
  }, []);

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
      onStartScan(targetUrl);
    } catch (_) {
      setError('Invalid URL format. Example: yourbusiness.com');
    }
  };

  return (
    <div className="home-layout">
      
      {/* ZONE 1 — HERO (Full Screen Viewport) */}
      <section className="zone-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Find out if AI search is recommending<br className="desktop-br" /> your business
          </h1>
          <p className="hero-subtitle">
            Paste your website URL — get your score in 30 seconds. Free.
          </p>
          
          <div className="search-box-container">
            <form onSubmit={handleSubmit} className="search-form-layout">
              <input
                type="text"
                className="url-search-input"
                placeholder="yourbusiness.com"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                autoFocus
              />
              <button type="submit" className="url-submit-btn">
                Check my score
              </button>
            </form>
            {error && <p className="url-error-msg">{error}</p>}
          </div>
          
          {scanCount !== null && scanCount >= 500 && (
            <p className="counter-text" style={{ marginBottom: '16px' }}>{scanCount.toLocaleString()} businesses checked so far</p>
          )}

          <div className="hero-trust-bar">
            <span>No sign-up required</span>
            <span className="bullet">·</span>
            <span>Privacy-first</span>
            <span className="bullet">·</span>
            <span>No data sold</span>
          </div>
        </div>
      </section>

      {/* ZONE 2 — THE PROBLEM */}
      <section className="zone-problem">
        <div className="problem-content-wrapper">
          <p>
            When someone searches for a local service, a restaurant, or a product recommendation - they are increasingly asking ChatGPT or Google AI instead of typing into a search bar.
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
        <div className="how-grid">
          <div className="how-step">
            <div className="step-num-icon">1</div>
            <h3>Paste your URL</h3>
            <p>Takes 5 seconds</p>
          </div>
          <div className="how-step">
            <div className="step-num-icon">2</div>
            <h3>See your score</h3>
            <p>Ready in 30 seconds</p>
          </div>
          <div className="how-step">
            <div className="step-num-icon">3</div>
            <h3>Fix what matters</h3>
            <p>Plain-English list</p>
          </div>
        </div>
      </section>

      {/* ZONE 4 — TRUST (Hidden until real quotes are ready)
      <section className="zone-trust">
        <div className="trust-wrapper">
          <blockquote className="quote-body">
            "I had no idea ChatGPT wasn't finding my clinic. Fixed it in a week."
          </blockquote>
          <cite className="quote-author">— Anna, Berlin, Physiotherapist</cite>
        </div>
      </section>
      */}

    </div>
  );
}
