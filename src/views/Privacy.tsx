import './StaticPages.css';

export default function Privacy() {
  return (
    <div className="static-page-container animate-fade-in" style={{ paddingBottom: '60px' }}>
      <div className="static-header">
        <span className="static-badge">GDPR & Data Privacy</span>
        <h1>Privacy Policy</h1>
        <p>We respect your privacy and are fully committed to protecting your personal data in accordance with the General Data Protection Regulation (GDPR).</p>
      </div>

      <div className="tldr-box">
        <h3>GDPR TL;DR Summary</h3>
        <p>
          We only collect email addresses for authentication (via magic links), enforce a strict data minimization protocol, store data securely, and never sell your details. You have the right to request deletion of all associated scan data and account information at any time.
        </p>
      </div>

      <div className="static-card-grid" style={{ marginTop: '0' }}>
        <div className="static-card">
          <h2>1. Data Minimization</h2>
          <p>
            We limit data collection to the absolute minimum required: email address for account authentication, domains and business names scanned, and temporary IP/fingerprint signatures to prevent bot abuse (3 free scans per day).
          </p>
        </div>

        <div className="static-card">
          <h2>2. Your Rights (Access, Portability & Deletion)</h2>
          <p>
            You have the right to access your data or download it. Furthermore, you can invoke your "Right to Erasure" (to be forgotten) directly from the Settings tab inside your Dashboard to permanently delete your account, scans, and logged events.
          </p>
        </div>

        <div className="static-card">
          <h2>3. Trusted Sub-processors</h2>
          <p>
            We work with select providers under standard Data Processing Agreements (DPAs):
            <br />• <strong>Supabase</strong> (Database & Auth)
            <br />• <strong>Stripe</strong> (Subscription Billing)
            <br />• <strong>Google / Groq</strong> (AI processing APIs - no PII passed)
          </p>
        </div>

        <div className="static-card">
          <h2>4. Cookies & Consents</h2>
          <p>
            We do not use tracking or advertising cookies. We only set strictly necessary cookies to keep you signed in securely and store session states.
          </p>
        </div>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginTop: '32px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.05rem', fontWeight: 600 }}>Third-Party Business Data & Opt-Out</h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
          We scan public websites to compile AI visibility metrics. If you are a business owner who wishes to request removal of your domain metrics from our cached scans, please contact us at <a href="mailto:privacy@tryagentscore.com">privacy@tryagentscore.com</a>.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '48px', color: 'var(--text-muted)' }}>
        <p>
          Questions about your GDPR rights? Contact the data controller at{' '}
          <a href="mailto:privacy@tryagentscore.com" style={{ fontWeight: 600 }}>
            privacy@tryagentscore.com
          </a>
        </p>
        <p style={{ fontSize: '0.8rem', marginTop: '12px' }}>Last updated: October 2026</p>
      </div>
    </div>
  );
}
