import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0f172a', lineHeight: '1.7' }}>
      <header style={{ marginBottom: '40px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
        <a href="/" style={{ textDecoration: 'none', color: '#6366f1', fontWeight: 600, fontSize: '0.95rem' }}>← Back to Home</a>
        <h1 style={{ marginTop: '20px', fontSize: '2.25rem', fontWeight: 800, color: '#0f172a' }}>Privacy Policy</h1>
        <p style={{ color: '#64748b', margin: '8px 0 0 0' }}>Last updated: October 2026</p>
      </header>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>1. Introduction</h2>
        <p>
          We respect your privacy and are committed to protecting your personal data in accordance with the General Data Protection Regulation (GDPR) and other applicable privacy laws. This Privacy Policy explains how we collect, use, store, and share your personal data when you use our website and AI-visibility scanner.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>2. Data Controller</h2>
        <p>
          For the purpose of GDPR compliance, we act as the data controller of the personal data collected from users of our platform. If you have any questions or data requests, you can contact us directly.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>3. Information We Collect</h2>
        <p>We limit data collection to only what is necessary to perform our services:</p>
        <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
          <li><strong>User Account Details:</strong> Email addresses collected during magic link sign-in to authenticate your access to the dashboard.</li>
          <li><strong>Scan Details:</strong> Domains and business names scanned, along with LLM citation results, overall visibility scores, and generated fixes.</li>
          <li><strong>Technical Data:</strong> IP addresses and browser fingerprints used to enforce anti-abuse rate limits (restricted to 3 free scans per day).</li>
          <li><strong>Stripe Billing Info:</strong> Subscription status and transaction details (payment details are handled securely by Stripe directly and never stored on our servers).</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>4. Sub-processors</h2>
        <p>To provide our services, we share necessary data with these trusted sub-processors under Data Processing Agreements (DPAs):</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px', fontSize: '0.95rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Provider</th>
              <th style={{ padding: '12px' }}>Purpose</th>
              <th style={{ padding: '12px' }}>Location</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px', fontWeight: 600 }}>Supabase</td>
              <td style={{ padding: '12px' }}>Database Hosting & Auth</td>
              <td style={{ padding: '12px' }}>EU / US</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px', fontWeight: 600 }}>Stripe</td>
              <td style={{ padding: '12px' }}>Payment Processing & Subscriptions</td>
              <td style={{ padding: '12px' }}>US</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px', fontWeight: 600 }}>Google (Gemini API)</td>
              <td style={{ padding: '12px' }}>AI Citation & Scanning Analysis</td>
              <td style={{ padding: '12px' }}>Global</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px', fontWeight: 600 }}>Groq</td>
              <td style={{ padding: '12px' }}>SEO Audit Fix Generation</td>
              <td style={{ padding: '12px' }}>US</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>5. Your GDPR Rights</h2>
        <p>Under GDPR, you have the following rights regarding your personal data:</p>
        <ul style={{ paddingLeft: '20px', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong>Right to Erasure (Delete Account):</strong> You can completely delete your account and delete all associated scans and analytics instantly from the Settings tab in your dashboard.</li>
          <li><strong>Right of Access & Portability:</strong> You can request a copy of the data we hold about you.</li>
          <li><strong>Right to Rectification:</strong> You can request that we update any inaccurate details.</li>
        </ul>
      </section>

      <section style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '40px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 600 }}>Data Deletion Support</h3>
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569' }}>
          If you are a visitor or business owner who does not have an account but wishes to request removal of domain information from cached scans or programmatic pages, please email support or use our site contact channels.
        </p>
      </section>
    </div>
  );
}
