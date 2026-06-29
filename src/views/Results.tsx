import { useState, useEffect } from 'react';
import type { ScanReport, CheckResult } from '../lib/scanEngine';
import './Results.css';

interface ResultsProps {
  report: ScanReport;
  description?: string;
  onRescan: () => void;
  onNavigateToPricing?: () => void;
}

interface StreamedQuery {
  text: string;
  cited: boolean;
}

export default function Results({ report, description, onRescan, onNavigateToPricing }: ResultsProps) {
  const [prompts, setPrompts] = useState<StreamedQuery[]>([]);
  const [technicalChecks, setTechnicalChecks] = useState<CheckResult[]>(report.technicalChecks || []);
  const [compositeScore, setCompositeScore] = useState<number>(report.compositeScore || 0);
  const [citationRate, setCitationRate] = useState<number>(report.citationRate || 0);
  const [citedCount, setCitedCount] = useState<number>(report.citedCount || 0);
  const [competitors, setCompetitors] = useState<CompetitorGap[]>(report.competitors || []);
  const [topFixes, setTopFixes] = useState<FixItem[]>(report.topFixes || []);
  const [confidence, setConfidence] = useState<string>(report.confidence || 'high');
  const [isBlocked, setIsBlocked] = useState<boolean>(report.isBlocked || (report.technicalChecks?.length > 0 && report.technicalChecks.every(c => c.status === 'warning')));
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

    const eventSourceUrl = `/api/scan?url=${encodeURIComponent(report.url)}${description ? `&description=${encodeURIComponent(description)}` : ''}`;
    const eventSource = new EventSource(eventSourceUrl);

    eventSource.addEventListener('audit_complete', (e: any) => {
      const data = JSON.parse(e.data);
      setTechnicalChecks(data.technicalChecks);
      if (data.isBlocked !== undefined) {
        setIsBlocked(data.isBlocked);
      }
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
      if (data.confidence) setConfidence(data.confidence);
      if (data.isBlocked !== undefined) setIsBlocked(data.isBlocked);
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
              {report.totalCount || 20} test searches. That is common for new sites — and it is fixable.
            </p>
          ) : (
            <p className="hero-statement">
              In our test, AI search tools mentioned your business<br />
              in {isScanning ? '...' : citedCount} out of {report.totalCount || 20} searches. Here is your full report.
            </p>
          )}

          <div className="score-box-wrapper">
            <div className={`score-box-border ${scoreClass}`}>
              <div className="score-box-title">AI visibility baseline</div>
              <div className={`score-box-value ${scoreClass}`}>
                {isScanning ? '...' : `${compositeScore}/100`}
              </div>
              <div className="score-bar-bg">
                <div className={`score-bar-fill ${scoreClass}`} style={{ width: `${isScanning ? (prompts.length/(report.totalCount || 20))*100 : compositeScore}%` }}></div>
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

        {confidence === 'low' && !description && (
          <div style={{ padding: '16px 24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#334155' }}>We couldn't fully identify your business</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Add a description to improve accuracy for future scans.</p>
            </div>
            <button onClick={onRescan} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#334155' }}>
              Describe Business
            </button>
          </div>
        )}

        {/* ZONE 1 - AI READINESS AUDIT */}
        <section className="zone-1">
          <p className="section-header-uppercase">
            Technical Readiness
          </p>

          {isBlocked ? (
            <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '6px', color: '#b45309', marginBottom: '16px', fontSize: '0.95rem' }}>
              <strong>Technical checks unavailable</strong> — this site uses bot protection (e.g. Cloudflare, Datadome).
            </div>
          ) : (
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
          )}
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
          <p className="section-header-uppercase">
            AI Citation Test
          </p>

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
                <span>scanning {prompts.length} of {report.totalCount || 20} ▌</span>
              </div>
            </div>
          ) : (
            <div className="citation-results animate-slide-up">
              {citedCount === 0 ? (
                <div className="citation-callout-card">
                  <p className="citation-callout-title">
                    Not cited in any of {report.totalCount || 20} AI searches
                  </p>
                  <p className="citation-callout-desc">
                    The most common cause is insufficient crawlable content. 
                    Your action plan below addresses this directly.
                  </p>
                </div>
              ) : (
                <>
                  <p className="citation-summary">Results: cited in {citedCount} of {report.totalCount || 20} searches</p>
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
            <p className="section-header-uppercase">
              Who AI is recommending instead
            </p>
            
            <p className="section-desc">These businesses appeared in searches where<br/>you were not cited:</p>
            
            <div className="competitors-container">
              {competitors.map((comp, i) => (
                <div key={i} className="competitor-row">
                  <span className="competitor-domain-text">{comp.domain}</span>
                  <div className="competitor-stat-wrapper">
                    <div className="competitor-progress-bg">
                      <div 
                        className="competitor-progress-fill" 
                        style={{ width: `${(comp.appearances / (report.totalCount || 20)) * 100}%` }}
                      />
                    </div>
                    <span className="competitor-count-text">{comp.appearances}/{report.totalCount || 20}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="add-competitor">
              <span className="add-icon">+</span>
              <input type="text" placeholder="Add a competitor to track [enter URL]" />
            </div>
          </section>
        )}

        {/* ZONE 4 - FIX LIST */}
        {!isScanning && (
          <section className="zone-4 animate-slide-up">
            <p className="section-header-uppercase">
              Your action plan
            </p>
            
            <p className="section-desc" style={{ marginBottom: '20px' }}>These three changes will have the most impact:</p>

            <div className="fix-list">
              {(topFixes || []).slice(0, 3).map((fix, idx) => (
                <div key={fix.id} className="action-plan-item">
                  <span className="action-plan-step-num">
                    {idx + 1}
                  </span>
                  <div className="action-plan-content">
                    <h4>{fix.title}</h4>
                    <p>{fix.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          alert('Action details and downloads coming soon with Pro monitoring!');
                        }}
                        className="action-plan-download-btn"
                      >
                        {fix.fixAction === 'llms' && 'Download llms.txt →'}
                        {fix.fixAction === 'robots' && 'Download updated robots.txt →'}
                        {fix.fixAction === 'schema' && 'See how to add this →'}
                        {fix.fixAction === 'link' && 'Read guide →'}
                      </a>
                      <span className="action-plan-time-label">
                        Takes {fix.timeEstimate.replace('Takes ', '')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {topFixes.length > 3 && (
              <>
                <p className="section-header-uppercase" style={{ marginTop: '32px' }}>
                  Further improvements
                </p>
                
                <button className="expand-fixes-teal-link" onClick={() => setExpandedFixes(!expandedFixes)}>
                  + {topFixes.length - 3} more
                </button>
              </>
            )}
          </section>
        )}

        {/* ZONE 5 - COMPETITIVE REPORT TEASER (GROWTH UPGRADE) */}
        {!isScanning && (
          <section className="zone-5 animate-slide-up">
            <p className="section-header-uppercase">
              See how you compare across AI tools
            </p>
            
            <p className="section-desc">
              These businesses are being cited in searches where you are not:
            </p>
            
            <ul className="competitive-teaser-list" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginBottom: '24px', padding: 0, listStyle: 'none' }}>
              {(competitors || []).slice(0, 3).map((comp, idx) => {
                const filledBlocks = Math.round((comp.appearances / (report.totalCount || 20)) * 16);
                const emptyBlocks = Math.max(0, 16 - filledBlocks);
                const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
                return (
                  <li key={comp.domain || idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ flex: 1 }}>{comp.domain}</span>
                    <span style={{ color: 'var(--primary)', letterSpacing: '2px', flex: 1 }}>{progressBar}</span>
                    <span style={{ width: '40px', textAlign: 'right' }}>{comp.appearances}/{report.totalCount || 20}</span>
                  </li>
                );
              })}
              {competitors.length > 3 && (
                <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', opacity: 0.5 }}>
                  <span style={{ flex: 1 }}>
                    <button className="expand-fixes-teal-link" style={{ marginTop: 0 }} onClick={() => alert('Unlock competitive report to see more!')}>
                      + {competitors.length - 3} more
                    </button>
                  </span>
                  <span style={{ color: 'var(--primary)', letterSpacing: '2px', flex: 1 }}>░░░░░░░░░░░░░░░░</span>
                  <span style={{ width: '40px', textAlign: 'right', filter: 'blur(4px)' }}>████</span>
                </li>
              )}
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
              <button className="maybe-later-btn" onClick={onRescan}>
                Maybe later
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
