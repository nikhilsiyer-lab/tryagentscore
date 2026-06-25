import { useState, useEffect } from 'react';
import './Scanning.css';

interface ScanningProps {
  url: string;
  onScanComplete: () => void;
}

const STEPS = [
  { text: 'Starting connection to your website...', pct: 10, category: 'crawlability' },
  { text: 'Checking if AI crawlers are allowed in robots.txt...', pct: 22, category: 'crawlability' },
  { text: 'Checking if an llms.txt description file is present...', pct: 35, category: 'crawlability' },
  { text: 'Verifying secure HTTPS connection setup...', pct: 45, category: 'crawlability' },
  { text: 'Testing how AI models read your pages...', pct: 55, category: 'structure' },
  { text: 'Checking how your pages are organized...', pct: 68, category: 'structure' },
  { text: 'Checking for schema metadata tags...', pct: 78, category: 'structure' },
  { text: 'Analyzing text readability & paragraph layout...', pct: 88, category: 'citability' },
  { text: 'Checking outbound references & author bylines...', pct: 95, category: 'citability' },
  { text: 'Calculating final visibility benchmark scores...', pct: 100, category: 'citability' },
];

export default function Scanning({ url, onScanComplete }: ScanningProps) {
  const [progress, setProgress] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Extract domain for display
  let domain = url.replace(/^(https?:\/\/)?(www\.)?/, '');
  domain = domain.split('/')[0];

  useEffect(() => {
    // 6-second total scan simulation (6000ms / 100 steps)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        const nextVal = prev + 2;
        
        // Update steps based on percentage
        const matchedStep = STEPS.findIndex(s => nextVal <= s.pct);
        if (matchedStep !== -1) {
          setCurrentStepIdx(matchedStep);
        }

        return nextVal;
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      onScanComplete();
    }
  }, [progress, onScanComplete]);

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
