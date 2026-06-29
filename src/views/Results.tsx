import { useState, useEffect } from 'react';
import type { ScanReport, CheckResult } from '../lib/scanEngine';
import './Results.css';

interface ResultsProps {
  report: ScanReport;
  onRescan: () => void;
  onNavigateToPricing?: () => void;
}

interface StreamedQuery {
  text: string;
  cited: boolean;
}

export default function Results({ report, onRescan, onNavigateToPricing }: ResultsProps) {
  const [prompts, setPrompts] = useState<StreamedQuery[]>([]);
  const [technicalChecks, setTechnicalChecks] = useState<CheckResult[]>(report.technicalChecks || []);
  const [compositeScore, setCompositeScore] = useState<number>(report.compositeScore || 0);
  const [citationRate, setCitationRate] = useState<number>(report.citationRate || 0);
  const [citedCount, setCitedCount] = useState<number>(report.citedCount || 0);
  const [competitors, setCompetitors] = useState<CompetitorGap[]>(report.competitors || []);
  const [topFixes, setTopFixes] = useState<FixItem[]>(report.topFixes || []);
  const [isScanning, setIsScanning] = useState(!report.id);
  const [scanId, setScanId] = useState<string | null>(report.id || null);
  const [email, setEmail] = useState('');
  const [expandedFixes, setExpandedFixes] = useState(false);
  const [origin, setOrigin] = useState<string>('');
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Hook up SSE scan pipeline
  useEffect(() => {
    if (report.id) {
      setIsScanning(false);
      return;
    }

    setPrompts([]);
    setIsScanning(true);
    setScanError(null);

    const eventSource = new EventSource(`/api/scan?url=${encodeURIComponent(report.url)}`);

    eventSource.addEventListener('audit_complete', (e: any) => {
      const data = JSON.parse(e.data);
      setTechnicalChecks(data.technicalChecks);
    });

    eventSource.addEventListener('query_result', (e: any) => {
      const data = JSON.parse(e.data);
      setPrompts(prev => [...prev, { text: data.query, cited: data.cited }]);
    });

    eventSource.addEventListener('scan_complete', (e: any) => {
      const data = JSON.parse(e.data);
      setCompositeScore(data.compositeScore);
      setCitationRate(data.citationRate);
      setCitedCount(data.citedCount);
      setCompetitors(data.competitors || []);
      setTopFixes(data.topFixes || []);
      setScanId(data.id || null);
      setIsScanning(false);
      eventSource.close();
    });

    // Custom error event from backend
    eventSource.addEventListener('error', (e: any) => {
      let errMsg = 'The scan was interrupted or rate-limited. Please try again.';
      try {
        if (e.data) {
          const data = JSON.parse(e.data);
          errMsg = data.message || errMsg;
        }
      } catch (_) {}
      setScanError(errMsg);
      setIsScanning(false);
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [report.url]);

  const getScoreColorClass = (score: number) => {
    if (score <= 39) return 'score-amber';
    if (score <= 69) return 'score-blue';
    return 'score-green';
  };

  const scoreClass = getScoreColorClass(isScanning ? 0 : compositeScore);

  const getStatusIcon = (status: string) => {
    if (status === 'pass') return <span className="status-icon pass">✓</span>;
    if (status === 'warning') return <span className="status-icon warn">⚠</span>;
    return <span className="status-icon cross">✗</span>;
  };

  return (
    <div className="results-container animate-fade-in">
      
      {/* PERSISTENT URL BAR */}
      <div className="persistent-url-bar">
        <span className="url-string">
          {scanId 
            ? `${origin || 'https://tryagentscore.com'}/results/${scanId}` 
            : `${origin || 'https://tryagentscore.com'}/results/saving...`}
        </span>
        <button 
          className="copy-link-btn" 
          onClick={() => {
            if (scanId) {
              navigator.clipboard.writeText(`${origin || window.location.origin}/results/${scanId}`);
              alert('Link copied to clipboard!');
            } else {
              alert('Wait a moment for the scan report to finish saving...');
            }
          }}
        >
          Copy link
        </button>
      </div>

      <div className="results-content-wrapper">
        {scanError && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '0.95rem',
            lineHeight: '1.5',
            fontFamily: 'var(--font-sans)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>⚠</span>
            <span>{scanError}</span>
          </div>
        )}

        {/* ZONE 0 - HERO SCORE HEADER */}
        <section className="zone-0">
          <div className="zone-0-top">
            <span className="domain-label">{report.domain}</span>
            <div className="header-actions">
              <button className="action-link" onClick={() => alert('Share link copied!')}>Share</button>
              <button className="action-link" onClick={() => alert('Exporting PDF/CSV...')}>Export ↓</button>
            </div>
          </div>

          {citedCount === 0 && !isScanning ? (
            <p className="hero-statement">
              AI search tools did not mention your business in any of our<br />
              20 test searches. That is common for new sites — and it is fixable.
            </p>
          ) : (
            <p className="hero-statement">
              In our test, AI search tools mentioned your business<br />
              in {isScanning ? '...' : citedCount} out of 20 searches. Here is your full report.
            </p>
          )}

          <div className="score-box-wrapper">
            <div className={`score-box-border ${scoreClass}`}>
              <div className="score-box-title">AI visibility baseline</div>
              <div className={`score-box-value ${scoreClass}`}>
                {isScanning ? '...' : `${compositeScore}/100`}
              </div>
              <div className="score-bar-bg">
                <div className={`score-bar-fill ${scoreClass}`} style={{ width: `${isScanning ? (prompts.length/20)*100 : compositeScore}%` }}></div>
              </div>
            </div>
            {!isScanning && (
              <>
                {citedCount === 0 ? (
                  <div className="benchmark-text">
                    Your page is technically live, but AI tools are not yet choosing it in test searches. This usually improves after clearer page text, crawler access, and more mentions across the web.
                  </div>
                ) : (
                  <div className="benchmark-text">
                    The average for service businesses is 31/100.<br/>
                    You are in the top half of businesses we have tested.
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ZONE 1 - AI READINESS AUDIT */}
        <section className="zone-1">
          <div className="section-divider">
            <span className="line-prefix">──</span>
            <span className="line-text">Technical Readiness</span>
            <span className="line-suffix"></span>
          </div>

          <ul className="audit-list">
            {technicalChecks.length > 0 ? (
              technicalChecks.map((check) => (
                <li key={check.id} className="audit-item">
                  {getStatusIcon(check.status)}
                  <span className="audit-name">{check.name}</span>
                </li>
              ))
            ) : (
              <li className="audit-item" style={{ fontFamily: 'var(--font-mono)' }}>Loading technical checks...</li>
            )}
          </ul>
        </section>

        {/* PRO MONITORING WAITLIST (Inline) */}
        {!isScanning && (
          <div className="inline-email-capture animate-slide-up" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div className="email-capture-inner">
              <h4 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>Want to know when your score improves?</h4>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Weekly monitoring — coming with Pro.
              </p>
              <button 
                onClick={onNavigateToPricing} 
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 28px', 
                  background: '#0f172a', 
                  color: '#ffffff', 
                  border: 'none', 
                  borderRadius: '6px', 
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s, transform 0.1s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#1e293b'}
                onMouseOut={e => e.currentTarget.style.background = '#0f172a'}
              >
                Join the Pro waitlist →
              </button>
            </div>
          </div>
        )}

        {/* ZONE 2 - CITATION SCAN */}
        <section className="zone-2">
          <div className="section-divider">
            <span className="line-prefix">──</span>
            <span className="line-text">AI Citation Test</span>
            <span className="line-suffix"></span>
          </div>

          {isScanning ? (
            <div className="streaming-container">
              <p className="streaming-header">Checking how AI search tools respond to queries<br/>about your business...</p>
              <div className="stream-list">
                {prompts.map((q, idx) => (
                  <div key={idx} className="stream-item">
                    <span className="stream-text">"{q.text}"</span>
                    <span className={`stream-status ${q.cited ? 'pass' : 'cross'}`}>
                      {q.cited ? '✓ cited' : '✗ not cited'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="streaming-footer">
                <span>scanning {prompts.length} of 20 ▌</span>
              </div>
            </div>
          ) : (
            <div className="citation-results animate-slide-up">
              {citedCount === 0 ? (
                <p className="citation-summary" style={{ fontWeight: 'normal', lineHeight: '1.6' }}>
                  AI tools did not cite your business in any of the 20 test searches. The most common reason is insufficient crawlable content — see your action plan below.
                </p>
              ) : (
                <>
                  <p className="citation-summary">Results: cited in {citedCount} of 20 searches</p>
                  <ul className="intent-list">
                    {(report.intentCategories || []).map(cat => (
                      <li key={cat.name} className="intent-item">
                        <span className="intent-name">{cat.name}</span>
                        <div className="intent-bars">
                          {Array.from({length: cat.total}).map((_, i) => (
                            <span key={i} className={`intent-bar ${i < (cat.cited) ? 'filled' : ''}`}></span>
                          ))}
                        </div>
                        <span className="intent-stats">{cat.cited}/{cat.total} cited</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </section>

        {/* ZONE 3 - COMPETITOR GAP */}
        {!isScanning && (
          <section className="zone-3 animate-slide-up">
            <div className="section-divider">
              <span className="line-prefix">──</span>
              <span className="line-text">Who AI is recommending instead</span>
              <span className="line-suffix"></span>
            </div>
            
            <p className="section-desc">These businesses appeared in searches where<br/>you were not cited:</p>
            
            <ul className="competitor-list">
              {(competitors || []).map(comp => (
                <li key={comp.domain} className="competitor-item">
                  <span className="comp-domain">{comp.domain}</span>
                  <span className="comp-stats">appeared in {comp.appearances} of 20 searches</span>
                </li>
              ))}
            </ul>
            <div className="add-competitor">
              <span className="add-icon">+</span>
              <input type="text" placeholder="Add a competitor to track [enter URL]" />
            </div>
          </section>
        )}

        {/* ZONE 4 - FIX LIST */}
        {!isScanning && (
          <section className="zone-4 animate-slide-up">
            <div className="section-divider">
              <span className="line-prefix">──</span>
              <span className="line-text">Your action plan</span>
              <span className="line-suffix"></span>
            </div>
            
            <p className="section-desc">These three changes will have the most impact:</p>

            <div className="fix-list">
              {(topFixes || []).slice(0, 3).map((fix, idx) => (
                <div key={fix.id} className="fix-card">
                  <div className="fix-num">{idx + 1}</div>
                  <div className="fix-content">
                    <h4>{fix.title}</h4>
                    <p>{fix.description}</p>
                    <div className="fix-footer">
                      <button className="fix-action-link">
                        [{fix.fixAction === 'llms' && 'Download your llms.txt →'}
                        {fix.fixAction === 'robots' && 'Download updated robots.txt →'}
                        {fix.fixAction === 'schema' && 'See how to add this →'}
                        {fix.fixAction === 'link' && 'Read guide →'}]
                      </button>
                      <span className="fix-time">Takes {fix.timeEstimate.replace('Takes ', '')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="section-divider subtle-divider">
              <span className="line-prefix">──</span>
              <span className="line-text">Further improvements</span>
              <span className="line-suffix"></span>
            </div>
            
            <button className="expand-fixes-link" onClick={() => setExpandedFixes(!expandedFixes)}>
              [+ {topFixes.length - 3} more items] (click to expand)
            </button>
          </section>
        )}

        {/* ZONE 5 - COMPETITIVE REPORT TEASER (GROWTH UPGRADE) */}
        {!isScanning && (
          <section className="zone-5 animate-slide-up">
            <div className="section-divider">
              <span className="line-prefix">──</span>
              <span className="line-text">See how you compare across AI tools</span>
              <span className="line-suffix"></span>
            </div>
            
            <p className="section-desc">
              These businesses are being cited in searches where you are not:
            </p>
            
            <ul className="competitive-teaser-list" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginBottom: '24px', padding: 0, listStyle: 'none' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ flex: 1 }}>competitor1.com</span>
                <span style={{ color: 'var(--primary)', letterSpacing: '2px', flex: 1 }}>████████████░░░░</span>
                <span style={{ width: '40px', textAlign: 'right' }}>12/20</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ flex: 1 }}>competitor2.com</span>
                <span style={{ color: 'var(--primary)', letterSpacing: '2px', flex: 1 }}>████████░░░░░░░░</span>
                <span style={{ width: '40px', textAlign: 'right' }}>8/20</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ flex: 1 }}>competitor3.com</span>
                <span style={{ color: 'var(--primary)', letterSpacing: '2px', flex: 1 }}>█████░░░░░░░░░░░</span>
                <span style={{ width: '40px', textAlign: 'right' }}>5/20</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', opacity: 0.5 }}>
                <span style={{ flex: 1 }}>[+ 7 more]</span>
                <span style={{ color: 'var(--primary)', letterSpacing: '2px', flex: 1 }}>░░░░░░░░░░░░░░░░</span>
                <span style={{ width: '40px', textAlign: 'right', filter: 'blur(4px)' }}>████</span>
              </li>
            </ul>
            
            <p className="section-desc" style={{ marginBottom: '24px' }}>
              See the full breakdown across ChatGPT, Perplexity, Gemini and Claude —<br/>
              which prompts trigger citations for your competitors, and what<br/>
              their pages do differently.
            </p>

            <div className="growth-gate">
              <div className="gate-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button className="btn-growth" onClick={() => alert('Redirect to Stripe checkout...')}>
                  [Unlock competitive report →]
                </button>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>19 EUR/month · Cancel anytime</span>
              </div>
              <button className="btn-maybe-later" onClick={onRescan} style={{ marginTop: '16px' }}>
                [Maybe later]
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
