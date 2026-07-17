'use client';

import { useState, useEffect } from 'react';
import Home from './views/Home';
import Scanning from './views/Scanning';
import Results from './views/Results';
import Pricing from './views/Pricing';
import Welcome from './views/Welcome';
import About from './views/About';
import Privacy from './views/Privacy';
import Terms from './views/Terms';
import Contact from './views/Contact';
import LogoPreviews from './views/LogoPreviews';
import type { ScanReport } from './lib/scanEngine';
import type { SubscriptionState } from './lib/auth';
import SubscriptionBanner from './components/SubscriptionBanner';

import { createClient } from './lib/supabase/client';
import Dashboard from './views/Dashboard';

type ViewState = 'home' | 'scanning' | 'results' | 'pricing' | 'billing' | 'welcome' | 'about' | 'privacy' | 'terms' | 'contact' | 'logopreviews' | 'dashboard';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [targetUrl, setTargetUrl] = useState('');
  const [description, setDescription] = useState('');
  const [scanOptions, setScanOptions] = useState<any>(null);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [user, setUser] = useState<{ email: string; isPro: boolean; subscriptionState: SubscriptionState; periodEnd: string | null } | null>(null);
  const [prefillData, setPrefillData] = useState<any>(null);
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status, current_period_end, cancel_at_period_end')
          .eq('user_id', user.id)
          .maybeSingle();

        let state: SubscriptionState = 'anonymous';
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

        // DEV OVERRIDE for local testing
        if (user.email === 'nikhilsiyer@gmail.com') {
          state = 'pro_active';
          isPro = true;
        }

        setUser({ 
          email: user.email!, 
          isPro, 
          subscriptionState: state, 
          periodEnd: sub?.current_period_end || null 
        });
      }
    }
    checkAuth();
  }, []);

  // Always apply light theme
  useEffect(() => {
    document.documentElement.classList.add('light-theme');
  }, []);

  // Handle URL scanning params and navigation redirects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('url');
    const desc = params.get('desc');
    if (sharedUrl) {
      setTargetUrl(sharedUrl);
      if (desc) setDescription(desc);
      setView('scanning');
    }
    const go = params.get('go');
    if (go === 'pricing') {
      setView('pricing');
    }
    const paramView = params.get('view');
    if (paramView === 'dashboard') {
      setView('dashboard');
    }
  }, []);

  const handleStartScan = (url: string, options?: { description?: string; businessType?: string; honeypot?: string; isBot?: boolean }) => {
    setTargetUrl(url);
    if (options?.description) setDescription(options.description);
    if (options) setScanOptions(options);
    
    // Track scan initiation
    fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'scan_started',
        event_data: {
          domain: url.replace(/^https?:\/\//, '').replace(/\/$/, ''),
          has_description: !!(options?.description),
        }
      })
    }).catch(() => {});
    if (process.env.NEXT_PUBLIC_ENABLE_FEATURES === 'true') {
      console.log('[Analytics] scan_started', { url });
    }
    
    setView('scanning');
    
    const newUrl = `${window.location.origin}${window.location.pathname}?url=${encodeURIComponent(url)}${options?.description ? `&desc=${encodeURIComponent(options.description)}` : ''}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleScanComplete = (finalReport: ScanReport) => {
    setReport(finalReport);
    setView('results');
  };

  const handleRescan = () => {
    if (report?.domain) {
      setTargetUrl(report.domain);
      setView('scanning');
    } else {
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.pushState({ path: cleanUrl }, '', cleanUrl);
      setTargetUrl('');
      setReport(null);
      setView('home');
    }
  };

  const handleUpgradeSimulate = () => {
    setView('welcome');
  };

  return (
    <>
      {user && user.subscriptionState !== 'anonymous' && user.subscriptionState !== 'pro_active' && (
        <SubscriptionBanner 
          state={user.subscriptionState} 
          periodEnd={user.periodEnd} 
          onManage={() => {
            fetch('/api/stripe/portal', { method: 'POST' })
              .then(res => res.json())
              .then(data => { if (data.url) window.location.href = data.url; });
          }} 
        />
      )}
      {/* GLOBAL HEADER (Now visible on all pages and full width) */}
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
          
          <nav className="topbar-center">
            {user ? (
              <>
                <a href="#" onClick={(e) => { e.preventDefault(); setView('dashboard'); }} className={view === 'dashboard' ? 'active' : ''}>Dashboard</a>
                {user.isPro ? (
                  <a href="#" onClick={(e) => { 
                    e.preventDefault(); 
                    setView('billing');
                  }} className={view === 'billing' ? 'active' : ''}>Billing</a>
                ) : (
                  <a href="#" onClick={(e) => { 
                    e.preventDefault(); 
                    setView('pricing'); 
                  }} className={view === 'pricing' ? 'active' : ''}>Pricing</a>
                )}
              </>
            ) : null}
          </nav>
          
          <div className="topbar-right">
            {!user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                {process.env.NEXT_PUBLIC_ENABLE_FEATURES !== 'true' && (
                  <>
                    <a href="#" onClick={(e) => { e.preventDefault(); setView('pricing'); }} className={view === 'pricing' ? 'active' : ''} style={{ textDecoration: 'none', color: '#475569', fontSize: '14px', fontWeight: 500 }}>Pricing</a>
                    <a href="/login" style={{ textDecoration: 'none', color: '#475569', fontSize: '14px', fontWeight: 500 }}>Log in</a>
                  </>
                )}
              </div>
            ) : (
              <>
                <button className="btn-scan" onClick={() => { setView('home'); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Run scan now
                </button>
                <div className="pro-chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Pro Member
                </div>
                <a 
                  href="#" 
                  onClick={async (e) => {
                    e.preventDefault();
                    await supabase.auth.signOut();
                    setUser(null);
                    setReport(null);
                    setView('home');
                  }}
                  style={{ textDecoration: 'none', color: '#475569', fontSize: '14px', fontWeight: 500 }}
                >
                  Log out
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="app-container">

      {/* VIEWS */}
      {view === 'home' && <Home user={user} initialData={prefillData} onStartScan={handleStartScan} />}
      {view === 'scanning' && <Scanning url={targetUrl} options={scanOptions} onScanComplete={handleScanComplete} />}
      {view === 'results' && report && <Results user={user} report={report} description={description} onRescan={handleRescan} onNavigateToPricing={() => setView('pricing')} />}
      {view === 'pricing' && <Pricing user={user} isBillingView={false} onBack={() => setView(report ? 'results' : 'home')} onUpgrade={handleUpgradeSimulate} onNavigateToBilling={() => setView('billing')} />}
      {view === 'billing' && <Pricing user={user} isBillingView={true} onBack={() => setView('dashboard')} onUpgrade={handleUpgradeSimulate} onNavigateToBilling={() => setView('billing')} />}
      {view === 'welcome' && <Welcome onNewScan={handleRescan} onBackToResults={() => setView('results')} />}
      {view === 'about' && <About />}
      {view === 'privacy' && <Privacy />}
      {view === 'terms' && <Terms />}
      {view === 'contact' && <Contact />}
      {view === 'logopreviews' && <LogoPreviews onBack={() => setView('home')} />}
      {view === 'dashboard' && (
        <Dashboard 
          user={user} 
          onStartScan={(domain) => { if(domain) setPrefillData({url: domain}); else setPrefillData(null); setView('home'); }} 
          onViewResults={async (scanId) => {
            try {
              const res = await fetch(`/api/results?id=${scanId}`);
              if (res.ok) {
                const data = await res.json();
                setReport(data);
                setView('results');
              } else {
                alert('Failed to load report details.');
              }
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}
      
      {/* GLOBAL FOOTER */}
      <footer style={{ 
        textAlign: 'center', 
        padding: '30px 0 40px', 
        fontSize: '0.9rem', 
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-color)',
        marginTop: 'auto',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        <a href="/about" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '13.5px' }}>About</a>
        {process.env.NEXT_PUBLIC_ENABLE_FEATURES !== 'true' && (
          <button onClick={() => setView('pricing')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>Pricing</button>
        )}
        <a href="/privacy" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '13.5px' }}>Privacy</a>
        <a href="/terms" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '13.5px' }}>Terms</a>
        <button onClick={() => setView('contact')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>Contact</button>
      </footer>
    </div>
    </>
  );
}
