import './StaticPages.css';

export default function Privacy() {
  return (
    <div className="static-page-container animate-fade-in">
      <div className="static-header">
        <span className="static-badge">Data Privacy</span>
        <h1>Privacy Policy</h1>
        <p>We believe in absolute transparency and putting you in control of your data.</p>
      </div>

      <div className="tldr-box">
        <h3>TL;DR Summary</h3>
        <p>We do not sell your data, we do not use trackers or third-party cookies, and you can test any URL without creating an account.</p>
      </div>

      <div className="static-card-grid" style={{ marginTop: '0' }}>
        <div className="static-card">
          <h2>Ownership</h2>
          <p>
            Your data stays yours. We do not sell, rent, or monetize your search queries, URLs, or generated scores to anyone, ever.
          </p>
        </div>

        <div className="static-card">
          <h2>No Accounts Required</h2>
          <p>
            Entering a URL to get your score is completely anonymous and does not require you to sign up, input an email address, or provide a credit card.
          </p>
        </div>

        <div className="static-card">
          <h2>Data Collection</h2>
          <p>
            We collect minimal, aggregated usage metrics (like total page visits) solely to understand general traffic trends and optimize server performance. No personally identifiable information (PII) is stored.
          </p>
        </div>

        <div className="static-card">
          <h2>Cookies</h2>
          <p>
            We do not use marketing or tracking cookies. We only set strictly necessary functional cookies required to keep the web application operating securely and smoothly.
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '48px', color: 'var(--text-muted)' }}>
        <p>
          Questions about your privacy? Email us at{' '}
          <a href="mailto:privacy@tryagentscore.com" style={{ fontWeight: 600 }}>
            privacy@tryagentscore.com
          </a>
        </p>
      </div>
    </div>
  );
}
