'use client';

import { useEffect, useState } from 'react';
import Results from '../../views/Results';
import type { ScanReport } from '../../lib/scanEngine';

// Fictional Acme Accounting Services Mock Report
const MOCK_DEMO_REPORT: ScanReport = {
  id: 'demo-scan-id',
  domain: 'acmeaccounting.com',
  createdAt: new Date().toISOString(),
  track: 'Service / local business',
  technicalScore: 85,
  citationRate: 60,
  compositeScore: 60,
  technicalChecks: [
    { id: 'schema', name: 'Schema Markup', status: 'pass', description: 'JSON-LD local business schema detected.' },
    { id: 'robots', name: 'AI Crawler Access', status: 'pass', description: 'robots.txt permits GPTBot and Google-Extended.' },
    { id: 'llms', name: 'LLM Flat Summary', status: 'warning', description: 'No llms.txt found at root.' }
  ],
  intentCategories: [
    { name: 'Ready to buy', cited: 0, total: 3 },
    { name: 'Near me', cited: 0, total: 3 },
    { name: 'Versus competitors', cited: 3, total: 3 },
    { name: 'Brand check', cited: 3, total: 3 },
    { name: 'Best in category', cited: 1, total: 3 }
  ],
  competitors: [
    { domain: 'apexadvisors.com', appearances: 3 },
    { domain: 'summitcpas.com', appearances: 2 }
  ],
  topFixes: [
    {
      id: 'local_intent',
      title: 'Strengthen location proof',
      reason: 'You have 0% visibility in Near me searches. AI engines cited apexadvisors.com instead because of their Google Business Profile listings and localized testimonials.',
      evidence: 'Missing localized keywords on contact page',
      impact: 'High',
      actionLabel: 'Apply this fix'
    },
    {
      id: 'transactional',
      title: 'Add ready-to-buy schema',
      reason: 'Your homepage lacks transactional structure and booking intent signals.',
      evidence: 'No JSON-LD Product or Service booking schema found',
      impact: 'Medium',
      actionLabel: 'Apply this fix'
    }
  ],
  profile: {
    businessName: 'Acme Accounting',
    domain: 'acmeaccounting.com'
  }
};

export default function DemoPage() {
  const [report, setReport] = useState<ScanReport | null>(null);
  const [cellsClicked, setCellsClicked] = useState(0);
  const [showSoftModal, setShowSoftModal] = useState(false);
  const [timeInDemo, setTimeInDemo] = useState(0);

  const trackEvent = (eventType: string, eventData: any) => {
    fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType, event_data: eventData })
    }).catch(err => console.error('Failed to log event:', err));
  };

  useEffect(() => {
    // Force light theme
    document.documentElement.classList.add('light-theme');
    setReport(MOCK_DEMO_REPORT);

    // Track event: demo_viewed
    trackEvent('demo_viewed', { source: 'demo_page_load' });

    // Listener for cell clicks inside Results component
    const handleCellClickEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { promptType, model } = customEvent.detail || {};
      
      setCellsClicked(prev => {
        const next = prev + 1;
        if (next >= 2) {
          setShowSoftModal(true);
        }
        return next;
      });
    };

    window.addEventListener('demo-cell-clicked', handleCellClickEvent);

    // Behavior trigger: after 60 seconds
    const timer = setInterval(() => {
      setTimeInDemo(prev => {
        const next = prev + 1;
        if (next === 60) {
          setShowSoftModal(true);
        }
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('demo-cell-clicked', handleCellClickEvent);
      document.documentElement.classList.remove('light-theme');
    };
  }, []);

  const handleGoToSignup = (sourceCta: string) => {
    trackEvent('demo_cta_clicked', { cta: sourceCta });
    trackEvent('demo_to_signup_converted', { 
      time_in_demo: timeInDemo, 
      cells_clicked: cellsClicked,
      source_cta: sourceCta 
    });
    if (sourceCta === 'demo_navbar_login') {
      window.location.href = '/login';
    } else {
      window.location.href = '/';
    }
  };

  if (!report) return null;

  // Mock user config so that Trends & Competitor list are unlocked in Demo Sandbox
  const mockUser = {
    email: 'sandbox@tryagentscore.com',
    isPro: true
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '90px' }}>
      {/* Top Warning Banner */}
      <div style={{
        background: 'var(--primary-glow)',
        borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
        padding: '12px 24px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        zIndex: 50,
        position: 'sticky',
        top: 0
      }}>
        <span>⚠️ You are viewing Acme Accounting sample data</span>
        <button 
          onClick={() => handleGoToSignup('demo_top_banner')} 
          className="btn btn-primary btn-sm"
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          Scan your own business free
        </button>
      </div>

      <header className="global-navbar" style={{ width: '100%', background: '#ffffff', zIndex: 10, borderBottom: '1px solid rgba(15, 23, 42, 0.04)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <div 
            style={{ fontWeight: '800', fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            onClick={() => window.location.href = '/'}
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
            <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px', fontWeight: 600 }}>Sandbox</span>
          </div>
          <nav style={{ display: 'flex', gap: '32px', alignItems: 'center', fontSize: '0.95rem', fontWeight: 500, color: '#475569' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); handleGoToSignup('demo_navbar_pricing'); }} style={{ textDecoration: 'none', color: 'inherit' }}>Pricing</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleGoToSignup('demo_navbar_login'); }} style={{ textDecoration: 'none', color: 'inherit' }}>Log in</a>
          </nav>
        </div>
      </header>

      <div className="app-container">
        {/* Pass custom handleCellClick override if needed, or simply log details */}
        <Results 
          user={mockUser} 
          report={report} 
          onRescan={() => handleGoToSignup('demo_results_rescan')} 
          onNavigateToPricing={() => handleGoToSignup('demo_results_pricing')} 
        />
      </div>

      {/* Persistent Bottom Sticky Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#0f172a',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        borderTop: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '14.5px' }}>Ready to test your own business?</span>
          <span style={{ color: '#94a3b8', fontSize: '12.5px' }}>Check your citation footprint on ChatGPT, Gemini, and Perplexity.</span>
        </div>
        <button 
          onClick={() => handleGoToSignup('demo_bottom_sticky_bar')} 
          className="btn btn-primary"
          style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 700 }}
        >
          Scan my business free →
        </button>
      </div>

      {/* Soft Signup Modal Trigger */}
      {showSoftModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
        }}>
          <div className="results-card" style={{
            maxWidth: '440px',
            margin: '20px',
            textAlign: 'center',
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--glass-shadow)',
            padding: '32px',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '32px' }}>⚡</span>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Scan Your Own Business
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Like what you see? Run a real scan on your business in under a minute and find your visibility gaps.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              <button 
                onClick={() => handleGoToSignup('demo_soft_modal_scan')} 
                className="btn btn-primary"
                style={{ width: '100%', height: '44px', fontWeight: 700 }}
              >
                Scan my business now
              </button>
              <button 
                onClick={() => setShowSoftModal(false)} 
                className="btn btn-secondary"
                style={{ width: '100%', height: '44px', background: 'none', border: 'none', color: 'var(--text-muted)' }}
              >
                Keep exploring demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
