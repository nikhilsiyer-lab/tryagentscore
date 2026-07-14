import { useState } from 'react';
import './Pricing.css';

interface PricingProps {
  user: { email: string; isPro: boolean; periodEnd?: string | null; subscriptionState?: string } | null;
  isBillingView?: boolean;
  onBack: () => void;
  onUpgrade: () => void;
  onNavigateToBilling?: () => void;
}

export default function Pricing({ user, isBillingView, onBack, onNavigateToBilling }: PricingProps) {
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to start checkout. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to open billing portal.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (isBillingView && user?.isPro) {
    return (
      <div className="billing-page animate-fade-in">
        <div className="billing-header">
          <h1>Billing</h1>
          <p>Manage your Pro plan and payment details.</p>
        </div>

        <div className="billing-card current-plan-card">
          <div className="card-left">
            <h2>Current plan</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div className="plan-badge">Pro</div>
              <span className="status-line active">Active</span>
            </div>
            <span className="secondary-line">Billing managed by Stripe</span>
          </div>
          <div className="card-right">
            <button onClick={handlePortal} disabled={loading} className="btn btn-primary">
              {loading ? 'Loading...' : 'Open billing management'}
            </button>
          </div>
        </div>

        <div className="billing-card details-card">
          <div className="detail-row">
            <span className="detail-label">Next renewal date</span>
            <span className="detail-value">
              {user.periodEnd ? new Date(user.periodEnd).toLocaleDateString() : 'Managed in Stripe'}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Billing email</span>
            <span className="detail-value">{user.email || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Payment method</span>
            <span className="detail-value">—</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Subscription status</span>
            <span className="detail-value" style={{ textTransform: 'capitalize' }}>
              {user.subscriptionState ? user.subscriptionState.replace('pro_', '') : 'Active'}
            </span>
          </div>
        </div>
        
        <div className="billing-note">
          Subscription changes and cancellations are handled securely in Stripe.
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-page animate-fade-in">
      <div className="pricing-header">
        <h1>Pricing</h1>
        <p>Choose the plan that fits how you monitor AI visibility.</p>
      </div>

      <div className="pricing-grid">
        {/* Free Plan Card */}
        <div className="pricing-card">
          <h2>Free</h2>
          <div className="price-line">
            <span className="price">€0</span> <span className="period">/ check</span>
          </div>
          <p className="plan-desc">Basic search pattern analysis.</p>
          <ul className="feature-list">
            <li><span style={{color: '#10B981', marginRight: '8px'}}>✓</span>One-time visibility check</li>
            <li><span style={{color: '#10B981', marginRight: '8px'}}>✓</span>Basic search pattern analysis</li>
            <li><span style={{color: '#10B981', marginRight: '8px'}}>✓</span>Instant recommendations preview</li>
          </ul>
          <button onClick={onBack} className="btn btn-secondary">Start free</button>
        </div>

        {/* Pro Plan Card */}
        <div className="pricing-card featured-card">
          <div className="featured-badge">Most popular</div>
          <h2>Pro</h2>
          <div className="price-line">
            <span className="price">€14.99</span> <span className="period">/ month</span>
          </div>
          <p className="plan-desc">Advanced tracking and AI-drafted fixes.</p>
          <ul className="feature-list">
            <li><span style={{color: '#10B981', marginRight: '8px'}}>✓</span>Everything in Free, plus:</li>
            <li><span style={{color: '#10B981', marginRight: '8px'}}>✓</span>50 real-time scans per month</li>
            <li><span style={{color: '#10B981', marginRight: '8px'}}>✓</span>Monthly visibility report</li>
            <li><span style={{color: '#10B981', marginRight: '8px'}}>✓</span>Multi-sample scoring (Gemini, ChatGPT, Perplexity)</li>
            <li><span style={{color: '#10B981', marginRight: '8px'}}>✓</span>Competitor comparisons & Top 10 list</li>
            <li><span style={{color: '#10B981', marginRight: '8px'}}>✓</span>AI-drafted fixes ready to use</li>
          </ul>
          <button 
            onClick={user?.isPro ? onNavigateToBilling : handleCheckout} 
            disabled={loading} 
            className="btn btn-primary"
          >
            {loading ? 'Loading...' : (user?.isPro ? 'Current plan' : 'Upgrade to Pro')}
          </button>
          
          {user?.isPro && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); onNavigateToBilling?.(); }}
                style={{ fontSize: '14px', color: '#64748B', textDecoration: 'underline' }}
              >
                Manage billing
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="trust-strip">
        <span>🔒 Secure payment via Stripe</span>
        <span>⚡ Cancel anytime</span>
        <span>✨ No hidden fees</span>
      </div>

      <div className="faq-section">
        <h3>Frequently Asked Questions</h3>
        
        {[
          { q: "What happens when I upgrade?", a: "You instantly unlock historical tracking and deep analysis." },
          { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time through the billing portal." },
          { q: "Do I keep my scan history?", a: "Yes, your scan history is retained as long as your account is active." },
          { q: "How does billing work?", a: "You are billed monthly via Stripe. There are no hidden fees or contracts." }
        ].map((faq, i) => (
          <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              {faq.q}
              <span className="faq-icon">{openFaq === i ? '−' : '+'}</span>
            </button>
            {openFaq === i && <div className="faq-a">{faq.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
