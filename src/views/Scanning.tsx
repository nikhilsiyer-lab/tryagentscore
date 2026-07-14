import { useState, useEffect } from 'react';
import './Scanning.css';
import type { ScanReport } from '../lib/scanEngine';

interface ScanningProps {
  url: string;
  options?: Record<string, any>;
  onScanComplete: (report: ScanReport) => void;
}

const STEPS = [
  { text: 'Starting connection to your website...', pct: 5, category: 'crawlability' },
  { text: 'Checking if AI crawlers are allowed in robots.txt...', pct: 15, category: 'crawlability' },
  { text: 'Checking if an llms.txt description file is present...', pct: 25, category: 'crawlability' },
  { text: 'Verifying secure HTTPS connection setup...', pct: 40, category: 'crawlability' },
  { text: 'Testing how AI models read your pages...', pct: 55, category: 'structure' },
  { text: 'Running parallel AI queries...', pct: 70, category: 'structure' },
  { text: 'Evaluating visibility against top competitors...', pct: 85, category: 'citability' },
  { text: 'Calculating final visibility benchmark scores...', pct: 95, category: 'citability' },
  { text: 'Complete', pct: 100, category: 'citability' },
];

export default function Scanning({ url, options, onScanComplete }: ScanningProps) {
  const [progress, setProgress] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [lastQueryText, setLastQueryText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Extract domain for display
  let domain = url.replace(/^(https?:\/\/)?(www\.)?/, '');
  domain = domain.split('/')[0];

  useEffect(() => {
    // Start an interval that increments progress slowly, but never reaches 100% until the API returns
    const timer = setInterval(() => {
      setProgress(p => (p < 85 ? p + 1 : p));
    }, 400);

    const query = new URLSearchParams({ url, ...(options || {}) }).toString();
    const eventSource = new EventSource(`/api/scan?${query}`);

    eventSource.addEventListener('crawl_start', () => {
      setProgress(10);
    });

    eventSource.addEventListener('audit_complete', () => {
      setProgress(40);
    });

    eventSource.addEventListener('top10_start', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        if (data.query) setLastQueryText(data.query);
      } catch (_) {}
    });

    eventSource.addEventListener('query_result', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        if (data.query) setLastQueryText(data.query);
      } catch (_) {}
    });

    eventSource.addEventListener('top10_complete', () => {
      setProgress(75);
    });

    eventSource.addEventListener('scan_complete', (e) => {
      try {
        const data = JSON.parse(e.data);
        setProgress(100);
        setCurrentStepIdx(STEPS.length - 1);
        clearInterval(timer);
        // Track completion
        fetch('/api/admin/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'scan_completed',
            event_data: {
              domain: data.domain,
              composite_score: data.compositeScore,
              citation_rate: data.citationRate,
              competitor_count: (data.competitors || []).length,
            }
          })
        }).catch(() => {});
        if (process.env.NEXT_PUBLIC_ENABLE_FEATURES === 'true') {
          console.log('[Analytics] scan_completed', { domain: data.domain, score: data.compositeScore });
        }
        setTimeout(() => onScanComplete(data), 500); // short delay so user sees 100%
        eventSource.close();
      } catch (err) {
        setError('Failed to parse scan data');
      }
    });

    eventSource.addEventListener('error', (e: any) => {
      console.error('SSE Error', e);
      let errorMsg = 'An unknown error occurred.';
      if (e.data) {
        try {
          const data = JSON.parse(e.data);
          errorMsg = data.message || 'An error occurred on the server.';
          setError(errorMsg);
          eventSource.close();
          clearInterval(timer);
          // Track failure
          fetch('/api/admin/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_type: 'scan_failed',
              event_data: { domain: url, error_reason: errorMsg }
            })
          }).catch(() => {});
          return;
        } catch (_) {}
      }
      
      if (eventSource.readyState === EventSource.CLOSED) {
        setError('Connection closed unexpectedly.');
      }
    });

    return () => {
      clearInterval(timer);
      eventSource.close();
    };
  }, [url, options, onScanComplete]);

  useEffect(() => {
    const matchedStep = [...STEPS].reverse().find(s => progress >= s.pct);
    if (matchedStep) {
      setCurrentStepIdx(STEPS.indexOf(matchedStep));
    }
  }, [progress]);

  if (error) {
    const isRateLimit = error.toLowerCase().includes('rate limit') || error.toLowerCase().includes('log in') || error.toLowerCase().includes('account');

    return (
      <div className="scanning-container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '24px' }}>
        <div className="scanning-card glass-panel" style={{
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          padding: '40px 32px',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}>
          {/* Pulsing Warning Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            fontSize: '28px',
            animation: 'pulse 2s infinite ease-in-out'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V14M12 17.01L12.01 16.998M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-display)' }}>
              {isRateLimit ? 'Daily Limit Reached' : 'Scan Paused'}
            </h2>
            <p style={{ margin: 0, fontSize: '15px', color: '#475569', lineHeight: 1.6 }}>
              {isRateLimit 
                ? "You've used all 3 free scans for today. Please wait 24 hours for your daily limit to reset, or upgrade to a Pro plan for unlimited real-time scans and continuous tracking."
                : error}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '8px' }}>
            {isRateLimit ? (
              <>
                <button 
                  onClick={() => window.location.href = '/?go=pricing'} 
                  className="btn btn-primary"
                  style={{ width: '100%', height: '46px', fontWeight: 700, borderRadius: '12px', fontSize: '14.5px' }}
                >
                  Upgrade to Pro →
                </button>
                <button 
                  onClick={() => window.location.href = '/demo'} 
                  className="btn btn-secondary"
                  style={{ width: '100%', height: '46px', background: 'transparent', border: '1px solid var(--border-color)', color: '#475569', fontWeight: 600, borderRadius: '12px', fontSize: '14.5px' }}
                >
                  Preview Pro Features
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => window.location.reload()} 
                  className="btn btn-primary"
                  style={{ width: '100%', height: '46px', fontWeight: 700, borderRadius: '12px', fontSize: '14.5px' }}
                >
                  Try Again
                </button>
                <button 
                  onClick={() => window.location.href = '/'} 
                  className="btn btn-secondary"
                  style={{ width: '100%', height: '46px', background: 'transparent', border: '1px solid var(--border-color)', color: '#475569', fontWeight: 600, borderRadius: '12px', fontSize: '14.5px' }}
                >
                  Back to Home
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scanning-container animate-fade-in">
      <div className="scanning-card glass-panel">
        <div className="radial-progress-wrapper">
          <svg className="progress-ring" viewBox="0 0 120 120">
            <circle className="progress-ring-bg" cx="60" cy="60" r="54" />
            <circle 
              className="progress-ring-bar" 
              cx="60" 
              cy="60" 
              r="54"
              strokeDasharray="339.29"
              strokeDashoffset={339.29 - (339.29 * progress) / 100}
            />
          </svg>
          <div className="progress-text">
            <span className="percent-val">{progress}%</span>
            <span className="percent-lbl">SCANNED</span>
          </div>
        </div>

        <div className="scanning-status">
          <h2>Analyzing {domain}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '8px' }}>Usually takes 15–25 seconds</p>
          <div className="active-step">
            <span className="spinner"></span>
            <p className="step-text">
              {lastQueryText ? (
                <span>Testing AI query: <strong style={{ color: 'var(--primary)', fontStyle: 'italic' }}>"{lastQueryText}"</strong></span>
              ) : (
                STEPS[currentStepIdx]?.text || 'Processing...'
              )}
            </p>
          </div>
        </div>

        <div className="phase-indicators">
          <div className={`phase-item ${progress >= 45 ? 'completed' : 'active'}`}>
            <span className="phase-dot-indicator"></span>
            <div className="phase-details">
              <h4>Crawlability</h4>
              <p>robots.txt & direct maps</p>
            </div>
          </div>
          <div className={`phase-item ${progress >= 85 ? 'completed' : progress >= 45 ? 'active' : 'pending'}`}>
            <span className="phase-dot-indicator"></span>
            <div className="phase-details">
              <h4>Structure</h4>
              <p>Headings & semantic schemas</p>
            </div>
          </div>
          <div className={`phase-item ${progress >= 100 ? 'completed' : progress >= 85 ? 'active' : 'pending'}`}>
            <span className="phase-dot-indicator"></span>
            <div className="phase-details">
              <h4>Citability</h4>
              <p>Content & authorship</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
