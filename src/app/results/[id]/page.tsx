'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Results from '../../../views/Results';
import type { ScanReport } from '../../../lib/scanEngine';
import { createClient } from '../../../lib/supabase/client';

export default function SharedResultsPage() {
  const params = useParams();
  const id = params.id as string;

  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; isPro: boolean; subscriptionState: string; periodEnd: string | null } | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status, current_period_end, cancel_at_period_end')
          .eq('user_id', authUser.id)
          .maybeSingle();

        let state = 'anonymous';
        let isPro = false;

        if (sub) {
          const isPastEnd = sub.current_period_end ? new Date(sub.current_period_end) < new Date() : false;
          if (sub.status === 'active' || sub.status === 'trialing') {
            if (sub.cancel_at_period_end && !isPastEnd) {
              state = 'pro_canceled_pending';
              isPro = true;
            } else if (sub.cancel_at_period_end && isPastEnd) {
              state = 'pro_expired';
              isPro = false;
            } else {
              state = 'pro_active';
              isPro = true;
            }
          } else {
            state = 'pro_expired';
            isPro = false;
          }
        }

        // DEV OVERRIDE
        if (authUser.email === 'nikhilsiyer@gmail.com') {
          state = 'pro_active';
          isPro = true;
        }

        setUser({
          email: authUser.email!,
          isPro,
          subscriptionState: state,
          periodEnd: sub?.current_period_end || null
        });
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    // Force light theme on the HTML element for visibility matching
    document.documentElement.classList.add('light-theme');
    
    if (!id) return;

    fetch(`/api/results?id=${id}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to find scan report');
        }
        return res.json();
      })
      .then(data => {
        setReport(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'An error occurred');
        setLoading(false);
      });

    return () => {
      // Clean up on unmount
      document.documentElement.classList.remove('light-theme');
    };
  }, [id]);

  const handleRescan = () => {
    if (report?.domain) {
      window.location.href = `/?url=${encodeURIComponent(report.domain)}`;
    } else {
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'var(--font-sans)', color: '#475569' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p>Loading citation report...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'var(--font-sans)', color: '#ef4444', textAlign: 'center', padding: '24px' }}>
        <div>
          <h2>Report Not Found</h2>
          <p style={{ color: '#64748b', marginTop: '8px', marginBottom: '24px' }}>The requested scan ID does not exist or may have expired.</p>
          <button onClick={handleRescan} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
            Run a new scan
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="global-navbar" style={{ width: '100%', background: '#ffffff', zIndex: 10, borderBottom: '1px solid rgba(15, 23, 42, 0.04)', position: 'sticky', top: 0 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <div 
            style={{ fontWeight: '800', fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            onClick={handleRescan}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="url(#spark-grad-header)" />
              <defs>
                <linearGradient id="spark-grad-header" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--primary)" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <span>Agent<span style={{ color: 'var(--primary)' }}>Score</span></span>
          </div>
          <nav style={{ display: 'flex', gap: '32px', alignItems: 'center', fontSize: '0.95rem', fontWeight: 500, color: '#475569' }}>
            {process.env.NEXT_PUBLIC_ENABLE_FEATURES !== 'true' && (
              <a href="#" onClick={(e) => { e.preventDefault(); window.location.href = '/?go=pricing'; }} style={{ textDecoration: 'none', color: 'inherit' }}>Pricing</a>
            )}
          </nav>
        </div>
      </header>

      <div className="app-container">
        <Results user={user} report={report} onRescan={handleRescan} onNavigateToPricing={() => window.location.href = '/?go=pricing'} />
      </div>
    </>
  );
}
