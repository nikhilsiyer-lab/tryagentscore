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

import { createClient } from './lib/supabase/client';
import Dashboard from './views/Dashboard';

type ViewState = 'home' | 'scanning' | 'results' | 'pricing' | 'welcome' | 'about' | 'privacy' | 'terms' | 'contact' | 'logopreviews' | 'dashboard';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [targetUrl, setTargetUrl] = useState('');
  const [description, setDescription] = useState('');
  const [scanOptions, setScanOptions] = useState<any>(null);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [user, setUser] = useState<{ email: string; isPro: boolean } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        setUser({ email: user.email!, isPro: !!sub });
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
      const generatedReport = generateReport(sharedUrl);
      setReport(generatedReport);
      setView('results');
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
    
    setView('scanning');
    
    const newUrl = `${window.location.origin}${window.location.pathname}?url=${encodeURIComponent(url)}${options?.description ? `&desc=${encodeURIComponent(options.description)}` : ''}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleScanComplete = (finalReport: ScanReport) => {
    setReport(finalReport);
    setView('results');
  };

  const handleRescan = () => {
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.pushState({ path: cleanUrl }, '', cleanUrl);
    
    setTargetUrl('');
    setReport(null);
    setView('home');
  };

  const handleUpgradeSimulate = () => {
    setView('welcome');
  };

  return (
    <>
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
            <span>tryagent<span style={{ color: 'var(--primary)' }}>score</span></span>
          </div>
          
          <nav style={{ display: 'flex', gap: '32px', alignItems: 'center', fontSize: '0.95rem', fontWeight: 500, color: '#475569' }}>
            {user ? (
              <a href="#" onClick={(e) => { e.preventDefault(); setView('dashboard'); }} style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#0f172a'} onMouseOut={e => e.currentTarget.style.color = '#475569'}>Dashboard</a>
            ) : null}
            <a href="#" onClick={(e) => { e.preventDefault(); setView('pricing'); }} style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#0f172a'} onMouseOut={e => e.currentTarget.style.color = '#475569'}>Pricing</a>
            {!user && (
              <a href="/login" style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#0f172a'} onMouseOut={e => e.currentTarget.style.color = '#475569'}>Log in</a>
            )}
          </nav>
          
        </div>
      </header>

      <div className="app-container">

      {/* VIEWS */}
      {view === 'home' && <Home onStartScan={handleStartScan} />}
      {view === 'scanning' && <Scanning url={targetUrl} options={scanOptions} onScanComplete={handleScanComplete} />}
      {view === 'results' && report && <Results user={user} report={report} description={description} onRescan={handleRescan} onNavigateToPricing={() => setView('pricing')} />}
      {view === 'pricing' && <Pricing user={user} onBack={() => setView(report ? 'results' : 'home')} onUpgrade={handleUpgradeSimulate} />}
      {view === 'welcome' && <Welcome onNewScan={handleRescan} onBackToResults={() => setView('results')} />}
      {view === 'about' && <About />}
      {view === 'privacy' && <Privacy />}
      {view === 'terms' && <Terms />}
      {view === 'contact' && <Contact />}
      {view === 'logopreviews' && <LogoPreviews onBack={() => setView('home')} />}
      {view === 'dashboard' && <Dashboard user={user} onStartScan={() => setView('home')} />}
      
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
        <button onClick={() => setView('about')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>About</button>
        <button onClick={() => setView('pricing')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Pricing</button>
        <button onClick={() => setView('privacy')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Privacy</button>
        <button onClick={() => setView('terms')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Terms</button>
        <button onClick={() => setView('contact')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Contact</button>
      </footer>
    </div>
    </>
  );
}
