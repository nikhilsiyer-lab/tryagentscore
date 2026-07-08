import './StaticPages.css';

export default function Terms() {
  return (
    <div className="static-page-container animate-fade-in" style={{ paddingBottom: '60px' }}>
      <div className="static-header">
        <span className="static-badge">Terms of Service</span>
        <h1>Terms of Use</h1>
        <p>Simple, fair, and easy to understand rules for using AgentScore.</p>
      </div>

      <div className="tldr-box">
        <h3>Quick Summary</h3>
        <p>This tool is provided as-is for informational purposes. Please do not abuse or scrape the service, and enjoy checking your scores!</p>
      </div>

      <div className="static-card-grid" style={{ marginTop: '0' }}>
        <div className="static-card">
          <h2>1. Service Scope & Reliability</h2>
          <p>
            This tool is provided on an "as-is" and "as-available" basis. While we strive to model AI recommendations accurately, AI engine responses fluctuate and change, and our scores represent a best-effort analysis that is not stable over time.
          </p>
        </div>

        <div className="static-card">
          <h2>2. Subscription Billing & Refund Policy</h2>
          <p>
            We offer recurring subscription billing at €14.99/month. You can cancel at any time via the Stripe Customer Portal in your Dashboard Settings. Cancellations take effect at the end of the current billing cycle.
          </p>
        </div>

        <div className="static-card">
          <h2>3. Fair Use & Abuse Prevention</h2>
          <p>
            You agree to use this tool for standard scanning of websites you own or manage. Do not use automated scripts, scrapers, or bot farms to bypass the 3 free scans per day rate limit or reverse engineer our internal API endpoints.
          </p>
        </div>

        <div className="static-card">
          <h2>4. Data Opt-In & deletion</h2>
          <p>
            By using the tool, you agree that scanned domain performance metrics may be cached. You can request deletion of all metrics associated with your account or request domain opt-outs at any time.
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '48px', color: 'var(--text-muted)' }}>
        <p>Last updated: October 2026</p>
      </div>
    </div>
  );
}
