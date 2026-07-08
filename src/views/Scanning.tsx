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

    eventSource.addEventListener('top10_complete', () => {
      setProgress(75);
    });

    eventSource.addEventListener('scan_complete', (e) => {
      try {
        const data = JSON.parse(e.data);
        setProgress(100);
        setCurrentStepIdx(STEPS.length - 1);
        clearInterval(timer);
        setTimeout(() => onScanComplete(data), 500); // short delay so user sees 100%
        eventSource.close();
      } catch (err) {
        setError('Failed to parse scan data');
      }
    });

    eventSource.addEventListener('error', (e: any) => {
      console.error('SSE Error', e);
      // Check if this is a custom server-sent error with data
      if (e.data) {
        try {
          const data = JSON.parse(e.data);
          setError(data.message || 'An error occurred on the server.');
          eventSource.close();
          clearInterval(timer);
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
    // Update step text based on progress
    const matchedStep = [...STEPS].reverse().find(s => progress >= s.pct);
    if (matchedStep) {
      setCurrentStepIdx(STEPS.indexOf(matchedStep));
    }
  }, [progress]);

  if (error) {
    return (
      <div className="scanning-container animate-fade-in">
        <div className="scanning-card glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ color: '#ef4444' }}>Scan Failed</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#0f172a', color: 'white', cursor: 'pointer' }}>Try Again</button>
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
            <p className="step-text">{STEPS[currentStepIdx]?.text || 'Processing...'}</p>
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
