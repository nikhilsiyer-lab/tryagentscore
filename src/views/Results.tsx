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
  const [totalCount, setTotalCount] = useState<number>(report.totalCount || 16);
  const [competitors, setCompetitors] = useState<CompetitorGap[]>(report.competitors || []);
  const [topFixes, setTopFixes] = useState<FixItem[]>(report.topFixes || []);
  const [confidence, setConfidence] = useState<string>(report.confidence || 'high');
  const [intentCategories, setIntentCategories] = useState<any[]>(report.intentCategories || []);
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
      setTotalCount(data.totalCount || 14);
      setCompetitors(data.competitors || []);
      setTopFixes(data.topFixes || []);
      if (data.intentCategories) setIntentCategories(data.intentCategories);
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
              <button className="action-link" onClick={() => {
                const url = scanId ? `${origin || window.location.origin}/results/${scanId}` : window.location.href;
                navigator.clipboard.writeText(url).then(() => {
                  const btn = document.getElementById('share-btn');
                  if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Share'; }, 2000); }
                });
              }} id="share-btn">Share</button>
            </div>
          </div>

          {citedCount === 0 && !isScanning ? (
            <p className="hero-statement">
              AI search tools did not mention your business in any of our<br />
              {totalCount} test searches. That is common for new sites — and it is fixable.
            </p>
          ) : citedCount >= Math.floor(totalCount * 0.7) && !isScanning ? (
            <p className="hero-statement">
              Strong result — AI tools cited your business in {citedCount} of {totalCount} searches.
            </p>
          ) : (
            <p className="hero-statement">
              AI tools mentioned your business in {isScanning ? '...' : citedCount} of {totalCount} searches.
              Here is your full report.
            </p>
          )}

          <div className="score-box-wrapper">
            <div className={`score-box-border ${scoreClass}`}>
              <div className="score-box-title">AI visibility baseline</div>
              <div className={`score-box-value ${scoreClass}`}>
                {isScanning ? '...' : `${compositeScore}/100`}
              </div>
              <div className="score-bar-bg">
                <div className={`score-bar-fill ${scoreClass}`} style={{ width: `${isScanning ? (prompts.length/totalCount)*100 : compositeScore}%` }}></div>
              </div>
            </div>
            {!isScanning && (
              <>
                {citedCount === 0 ? (
                  <div className="benchmark-text">
                    Your page is technically live, but AI tools are not yet choosing it in test searches.
                    This usually improves after clearer page text, crawler access, and more mentions across the web.
                  </div>
                ) : compositeScore > 31 ? (
                  <div className="benchmark-text">
                    Industry average: <strong>31/100</strong> — you are above average.
                  </div>
                ) : (
                  <div className="benchmark-text">
                    Industry average: <strong>31/100</strong> — there is room to improve.
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
            <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '6px', color: '#b45309', marginBottom: '16px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              <strong>Technical checks unavailable</strong> — this site uses bot protection (e.g. Cloudflare, Datadome).
              <br />
              <span style={{ fontSize: '0.875rem', opacity: 0.85 }}>Bot protection blocks AI crawlers from reading your pages, which likely reduces your citation rate. Consider adding an <code>llms.txt</code> file to give AI tools a direct summary of your business.</span>
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

        {/* spacer — Pro CTA moved to bottom */}

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
                <span>scanning {prompts.length} of {totalCount} ▌</span>
              </div>
            </div>
          ) : (
            <div className="citation-results animate-slide-up">
              {citedCount === 0 ? (
                <div className="citation-callout-card">
                  <p className="citation-callout-title">
                    Not cited in any of {totalCount} AI searches
                  </p>
                  <p className="citation-callout-desc">
                    The most common cause is insufficient crawlable content. 
                    Your action plan below addresses this directly.
                  </p>
                </div>
              ) : (
                <>
                  <p className="citation-summary">Results: cited in {citedCount} of {totalCount} searches</p>
                  <ul className="intent-list">
                    {(intentCategories || []).map(cat => (
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
                        style={{ width: `${(comp.appearances / totalCount) * 100}%` }}
                      />
                    </div>
                    <span className="competitor-count-text">{comp.appearances}/{totalCount}</span>
                  </div>
                </div>
              ))}
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
                        {fix.timeEstimate.replace(/^takes\s+/i, 'Takes ')}
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

        {/* PRO MONITORING CTA — bottom of page */}
        {!isScanning && (
          <section className="zone-5 animate-slide-up">
            <div className="inline-email-capture" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div className="email-capture-inner">
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>Monitor your score weekly</h4>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
                  Get notified when your AI citation rate improves — or drops.<br />
                  Weekly monitoring, competitor tracking, and fix recommendations.
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
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#1e293b'}
                  onMouseOut={e => e.currentTarget.style.background = '#0f172a'}
                >
                  Join the Pro waitlist →
                </button>
                <div style={{ marginTop: '12px' }}>
                  <button
                    onClick={onRescan}
                    style={{ background: 'none', border: 'none', fontSize: '0.875rem', color: '#9ca3af', cursor: 'pointer' }}
                    onMouseOver={e => e.currentTarget.style.color = '#6b7280'}
                    onMouseOut={e => e.currentTarget.style.color = '#9ca3af'}
                  >
                    Scan another site
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
