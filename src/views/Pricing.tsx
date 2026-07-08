import { useState } from 'react';
import './Pricing.css';
import WaitlistForm from '../components/WaitlistForm';

interface PricingProps {
  user: { email: string; isPro: boolean } | null;
  onBack: () => void;
  onUpgrade: () => void;
}

export default function Pricing({ user, onBack }: PricingProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      window.location.href = '/login?redirect=pricing';
      return;
    }
    
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

  return (
    <div className="pricing-container animate-fade-in">
      <div className="pricing-header">
        <h1>Pro - Your AI Trust & Visibility Analyst</h1>
        <p>Know exactly what AI says about your business when potential clients check. Cancel anytime.</p>
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
          <span className="popular-badge">Recommended</span>
          <div className="col-header">
            <h2>Pro - Early Access Price</h2>
            <div className="price-title">
              <span style={{ textDecoration: 'line-through', fontSize: '0.6em', color: '#94a3b8', marginRight: '8px' }}>€19</span>
              €14.99 <span className="price-period">/ month</span>
            </div>
            <div className="cancel-text">Founding member pricing. Locked in for as long as you stay subscribed.</div>
          </div>
          
          <ul className="feature-list">
            <li>Monthly report - see exactly what AI says when clients check you</li>
            <li>Reliable, multi-sample scoring across multiple AI tools - not just one answer</li>
            <li>See which competitors appear instead of you, and on which exact query</li>
            <li>Top 10 list check - does AI name you when asked to list the best in your category?</li>
            <li>AI-drafted fixes: llms.txt, FAQ content, schema markup - ready to paste in</li>
          </ul>
          
          <div className="col-footer">
            {user?.isPro ? (
              <button 
                onClick={handlePortal} 
                disabled={loading}
                className="btn-pricing btn-pricing-primary"
              >
                {loading ? 'Loading...' : 'Manage Subscription'}
              </button>
            ) : (
              <WaitlistForm />
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
