import { useState } from 'react';
import './Pricing.css';
import WaitlistForm from '../components/WaitlistForm';

interface PricingProps {
  onBack: () => void;
  onUpgrade: () => void;
}

export default function Pricing({ onBack }: PricingProps) {
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);

  return (
    <div className="pricing-container animate-fade-in">
      <div className="pricing-header">
        <h1>Simple, transparent pricing.</h1>
        <p>Start optimizing your visibility across AI search engines today. Cancel anytime.</p>
      </div>
      
      <div className="pricing-grid">
        {/* Free Plan Card */}
        <div className="pricing-col">
          <div className="col-header">
            <h2>Free</h2>
            <div className="price-title">
              €0 <span className="price-period">/ check</span>
            </div>
            <div className="cancel-text">No account or credit card required</div>
          </div>
          
          <ul className="feature-list">
            <li>One-time visibility score check</li>
            <li>Basic search pattern analysis</li>
            <li>Instant recommendations preview</li>
          </ul>
          
          <div className="col-footer">
            <button onClick={onBack} className="btn-pricing btn-pricing-outline">
              Check my score
            </button>
          </div>
        </div>

        {/* Pro Plan Card */}
        <div className="pricing-col growth-col">
          <span className="popular-badge" style={{ background: '#64748b' }}>Coming Soon</span>
          <div className="col-header">
            <h2>Pro</h2>
            <div className="price-title">
              Waitlist
            </div>
            <div className="cancel-text">Join early to lock in pioneer pricing</div>
          </div>
          
          <ul className="feature-list">
            <li style={{ color: 'var(--text-muted)' }}>🔒 Full visibility audit report</li>
            <li style={{ color: 'var(--text-muted)' }}>🔒 Detailed fix action checklist</li>
            <li style={{ color: 'var(--text-muted)' }}>🔒 Automated weekly rank re-checks</li>
            <li style={{ color: 'var(--text-muted)' }}>🔒 Competitor recommendation tracking</li>
            <li style={{ color: 'var(--text-muted)' }}>🔒 Priority support</li>
          </ul>
          
          <div className="col-footer">
            {!showWaitlistForm ? (
              <button 
                onClick={() => setShowWaitlistForm(true)} 
                className="btn-pricing btn-pricing-primary" 
                style={{ background: '#64748b', borderColor: '#64748b', boxShadow: 'none' }}
              >
                Join waitlist →
              </button>
            ) : (
              <WaitlistForm />
            )}
          </div>
        </div>
      </div>

      <p className="pricing-contact">
        Need a customized volume plan? <a href="mailto:hello@tryagentscore.com">Contact us</a>
      </p>
    </div>
  );
}
