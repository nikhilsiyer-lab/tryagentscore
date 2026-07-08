import { useState, useEffect } from 'react';
import type { ScanReport, CheckResult } from '../lib/scanEngine';
import ActionDraft, { type BusinessProfile } from '../components/ActionDraft';
import { createClient } from '../lib/supabase/client';
import './Results.css';

interface ResultsProps {
  user: { email: string; isPro: boolean } | null;
  report: ScanReport;
  description?: string;
  onRescan: () => void;
  onNavigateToPricing?: () => void;
}

interface StreamedQuery {
  text: string;
  cited: boolean;
}

export default function Results({ user, report, description, onRescan, onNavigateToPricing }: ResultsProps) {
  const [prompts, setPrompts] = useState<StreamedQuery[]>([]);
  const [technicalChecks, setTechnicalChecks] = useState<CheckResult[]>(report.technicalChecks || []);
  const [compositeScore, setCompositeScore] = useState<number>(report.compositeScore || 0);
  const [citationRate, setCitationRate] = useState<number>(report.citationRate || 0);
  const [citedCount, setCitedCount] = useState<number>(report.citedCount || 0);
  const [totalCount, setTotalCount] = useState<number>(report.totalCount || 4);
  const [competitors, setCompetitors] = useState<CompetitorGap[]>(report.competitors || []);
  const [directories, setDirectories] = useState<CompetitorGap[]>((report as any).directories || []);
  const [topFixes, setTopFixes] = useState<FixItem[]>(report.topFixes || []);
  const [confidence, setConfidence] = useState<string>(report.confidence || 'high');
  const [intentCategories, setIntentCategories] = useState<any[]>(report.intentCategories || []);
  const [top10Result, setTop10Result] = useState<{ query: string; cited: boolean; coMentioned: string[] } | null>((report as any).top10Result || null);
  const [top10Loading, setTop10Loading] = useState(false);
  const [showAllFixes, setShowAllFixes] = useState(false);
  const [isBlocked, setIsBlocked] = useState<boolean>(report.isBlocked || (report.technicalChecks?.length > 0 && report.technicalChecks.every(c => c.status === 'warning')));
  const [isScanning, setIsScanning] = useState(!report.id);
  const [scanId, setScanId] = useState<string | null>(report.id || null);
  const [email, setEmail] = useState('');
  const [expandedFixes, setExpandedFixes] = useState(false);
  const [showPassingChecks, setShowPassingChecks] = useState(false);
  const [showCitationDetails, setShowCitationDetails] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null>((report as any).profile || null);
  const [origin, setOrigin] = useState<string>('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [claimEmail, setClaimEmail] = useState('');
  const [claimSent, setClaimSent] = useState(false);
  const supabase = createClient();

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

    const opts = report.options || {};
    let queryParams = `?url=${encodeURIComponent(report.url)}`;
    if (description || opts.description) queryParams += `&description=${encodeURIComponent(description || opts.description || '')}`;
    if (opts.businessType) queryParams += `&businessType=${encodeURIComponent(opts.businessType)}`;
    if (opts.entityType) queryParams += `&entityType=${encodeURIComponent(opts.entityType)}`;
    if (opts.basedIn) queryParams += `&basedIn=${encodeURIComponent(opts.basedIn)}`;
    if (opts.servesMarket) queryParams += `&servesMarket=${encodeURIComponent(opts.servesMarket)}`;
    if (opts.targetClient) queryParams += `&targetClient=${encodeURIComponent(opts.targetClient)}`;
    if (opts.honeypot) queryParams += `&honeypot=${encodeURIComponent(opts.honeypot)}`;
    if (opts.isBot !== undefined) queryParams += `&isBot=${opts.isBot}`;

    const eventSourceUrl = `/api/scan${queryParams}`;
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

    eventSource.addEventListener('top10_start', () => {
      setTop10Loading(true);
    });

    eventSource.addEventListener('top10_complete', (e: any) => {
      const data = JSON.parse(e.data);
      setTop10Result(data);
      setTop10Loading(false);
    });

    eventSource.addEventListener('scan_complete', (e: any) => {
      const data = JSON.parse(e.data);
      setCompositeScore(data.compositeScore);
      setCitationRate(data.citationRate);
      setCitedCount(data.citedCount);
      setTotalCount(data.totalCount || 14);
      setCompetitors(data.competitors || []);
      setDirectories(data.directories || []);
      setTopFixes(data.topFixes || []);
      if (data.intentCategories) setIntentCategories(data.intentCategories);
      if (data.confidence) setConfidence(data.confidence);
      if (data.isBlocked !== undefined) setIsBlocked(data.isBlocked);
      if (data.profile) setProfile(data.profile);
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

        {/* SECTION 2 — HOW AI SEES YOU (citation scan) */}
        <section className="zone-2">
          <p className="section-header-uppercase">How AI sees you</p>

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
                  <p className="citation-summary">Mentioned in {citedCount} of {totalCount} searches</p>
                  <ul className="intent-list">
                    {(intentCategories || []).map(cat => {
                      const isCited = cat.cited >= 1;
                      const isBrandFailure = !isCited && cat.name === 'Brand recognition';

                      if (isBrandFailure) {
                        return (
                          <li key={cat.name} className="intent-item brand-failure-callout" style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', marginTop: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span className="intent-name" style={{ fontWeight: 600, color: '#991b1b' }}>{cat.name}</span>
                              <span className="badge badge-hard" style={{ textTransform: 'none', padding: '4px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none', fontWeight: 700 }}>
                                ⚠ Not recognized by name
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#991b1b', lineHeight: '1.4' }}>
                              AI does not recognize your business when searched directly — this is more fundamental than not ranking for a topic.
                            </p>
                          </li>
                        );
                      }

                      return (
                        <li key={cat.name} className="intent-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <span className="intent-name" style={{ fontWeight: 500, color: '#334155' }}>{cat.name}</span>
                          <span className={`badge ${isCited ? 'badge-easy' : 'badge-hard'}`} style={{ textTransform: 'none', padding: '4px 12px' }}>
                            {isCited ? '✓ Cited' : '✗ Not Cited'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Collapsible individual query breakdown */}
                  {prompts.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <button
                        onClick={() => setShowCitationDetails(p => !p)}
                        className="tech-passing-toggle"
                      >
                        {showCitationDetails ? '▲ Hide' : '▼ Show'} individual search queries ({prompts.length})
                      </button>
                      {showCitationDetails && (
                        <div className="stream-list" style={{ marginTop: '10px' }}>
                          {prompts.map((q, idx) => (
                            <div key={idx} className="stream-item">
                              <span className="stream-text">"{q.text}"</span>
                              <span className={`stream-status ${q.cited ? 'pass' : 'cross'}`}>
                                {q.cited ? '✓ cited' : '✗ not cited'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        {/* TOP 10 LIST CHECK — part of "How AI sees you" */}
        {(top10Result || top10Loading || isScanning) && (
          <section className="zone-2 animate-slide-up" style={{ marginTop: '8px' }}>
            <p className="section-header-uppercase">
              On the AI shortlist?
            </p>

            {!user?.isPro ? (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
              }}>
                <div>
                  <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>
                    🔒 Does AI include you in a top 10 list?
                  </p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem', lineHeight: 1.5, maxWidth: '460px' }}>
                    AI models sometimes list businesses when asked for a "top 10" style recommendation — separately from normal questions. Pro checks this and tells you whether you are included.
                  </p>
                </div>
                <button
                  onClick={onNavigateToPricing}
                  style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Unlock with Pro →
                </button>
              </div>
            ) : top10Loading || (isScanning && !top10Result) ? (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.9rem' }}>
                  <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                  Checking whether AI lists your business when asked for a top 10…
                </div>
              </div>
            ) : top10Result ? (
              <div style={{
                background: top10Result.cited ? '#f0fdf4' : '#fef9f0',
                border: `1px solid ${top10Result.cited ? '#86efac' : '#fcd34d'}`,
                borderRadius: '10px',
                padding: '20px 24px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: top10Result.cited ? '14px' : '10px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 700, fontSize: '1rem', color: top10Result.cited ? '#15803d' : '#92400e' }}>
                      {top10Result.cited
                        ? '✓ Cited in a top 10 list'
                        : '✗ Not cited in a top 10 list'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
                      Query we tested: "{top10Result.query}"
                    </p>
                  </div>
                  <span style={{
                    background: top10Result.cited ? '#dcfce7' : '#fef3c7',
                    color: top10Result.cited ? '#166534' : '#92400e',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap',
                  }}>
                    {top10Result.cited ? 'Present' : 'Not present'}
                  </span>
                </div>

                {top10Result.cited ? (
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#166534', lineHeight: 1.5 }}>
                    When we asked the AI to list the top 10 in your category, your business appeared. A meaningful signal even if you're not the default recommendation in everyday questions.
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#78350f', lineHeight: 1.5 }}>
                    Even when we explicitly asked the AI to list the top 10 in your category, your business did not appear. Fixing this typically requires building more online citations and structured content.
                  </p>
                )}

                {top10Result.coMentioned.length > 0 && (
                  <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${top10Result.cited ? '#bbf7d0' : '#fde68a'}` }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.82rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Also in that list
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {top10Result.coMentioned.map((name, i) => (
                        <span key={i} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '6px', fontSize: '0.83rem', color: '#334155' }}>
                          {name}
                        </span>
                      ))}
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      These names appeared in the AI's response. This is not a ranking — the order AI models give is not stable or reliable.
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </section>
        )}

        {/* SECTION 3 — WHAT TO IMPROVE (technical readiness) */}
        <section className="zone-1">
          <p className="section-header-uppercase">What to improve</p>

          {isBlocked ? (
            <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '6px', color: '#b45309', marginBottom: '16px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              <strong>Technical checks unavailable</strong> — this site uses bot protection (e.g. Cloudflare, Datadome). AI crawlers may face the same restrictions, which can reduce citation rates. Adding an <code>llms.txt</code> file gives AI tools a direct summary without needing to crawl.
            </div>
          ) : (
            <div className="tech-checks-wrapper">
              {technicalChecks.length > 0 ? (() => {
                const problems = technicalChecks.filter(c => c.status !== 'pass');
                const passing = technicalChecks.filter(c => c.status === 'pass');

                const inlineHints: Record<string, { label: string; hint: string }> = {
                  schema: { label: '⚡ Quick win', hint: 'Add JSON-LD schema to your homepage — copy a template and paste it into your site\'s <head>. Takes ~20 min.' },
                  llms: { label: '⚡ Quick win', hint: 'Create an llms.txt file at yoursite.com/llms.txt listing your business name, services, and location. Takes ~10 min.' },
                  robots: { label: '📋 This week', hint: 'Review your robots.txt — make sure you\'re not blocking AI crawlers like GPTBot or Google-Extended.' },
                  h1: { label: '⚡ Quick win', hint: 'Your page is missing an H1 tag. Add one that clearly states what you do and where — e.g. "Dentist in Berlin-Charlottenburg".' },
                  contact: { label: '⚡ Quick win', hint: 'Add a phone number and address directly on the page in plain text — not just in an image or contact form.' },
                  https: { label: '👷 Needs a developer', hint: 'Your site isn\'t on HTTPS. Ask your hosting provider to enable SSL — most offer this free.' },
                  faq: { label: '📋 This week', hint: 'Add a FAQ section answering common questions about your services. AI tools love structured Q&A content.' },
                };

                return (
                  <>
                    {problems.length === 0 ? (
                      <div className="tech-all-pass-banner">
                        <span className="tech-all-pass-icon">✓</span>
                        <span>All {passing.length} technical checks passed — no issues found.</span>
                      </div>
                    ) : (
                      <div className="tech-problems-list">
                        {/* Show only the first issue expanded, rest collapsed */}
                        {problems.map((check, idx) => {
                          const hint = inlineHints[check.id];
                          const isFirst = idx === 0;
                          return (
                            <div key={check.id} className={`tech-problem-card ${check.status}`} style={!isFirst ? { opacity: 0.85 } : {}}>
                              <div className="tech-problem-header">
                                <span className={`tech-problem-icon ${check.status}`}>
                                  {check.status === 'warning' ? '⚠' : '✗'}
                                </span>
                                <div className="tech-problem-meta">
                                  <span className="tech-problem-name">{check.name}</span>
                                  <span className="tech-problem-desc">{check.description}</span>
                                </div>
                              </div>
                              {/* Show inline fix hint only for first (most important) issue */}
                              {hint && isFirst && (
                                <div className="tech-inline-hint">
                                  <span className="tech-hint-tier">{hint.label}</span>
                                  <span className="tech-hint-text">{hint.hint}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {passing.length > 0 && (
                      <div className="tech-passing-toggle-wrapper">
                        <button
                          className="tech-passing-toggle"
                          onClick={() => setShowPassingChecks(p => !p)}
                        >
                          {showPassingChecks ? '▲ Hide' : '▼ Show'} {passing.length} passing checks
                        </button>
                        {showPassingChecks && (
                          <ul className="tech-passing-list">
                            {passing.map(check => (
                              <li key={check.id} className="tech-passing-item">
                                <span className="status-icon pass">✓</span>
                                <span className="audit-name">{check.name}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </>
                );
              })() : (
                <div className="audit-item" style={{ fontFamily: 'var(--font-mono)' }}>Loading technical checks...</div>
              )}
            </div>
          )}
        </section>

        {/* SECTION 4 — COMPETITIVE LANDSCAPE */}
        {!isScanning && (

          <section className="zone-3 animate-slide-up">
            <p className="section-header-uppercase">
              Who AI is recommending instead
            </p>
            
            {citedCount === totalCount && citedCount > 0 ? (
              <div style={{
                background: '#f0fdfa',
                border: '1px solid #ccfbf1',
                padding: '16px 20px',
                borderRadius: '8px',
                color: '#0f766e',
                fontSize: '0.95rem',
                lineHeight: '1.5',
                marginTop: '12px',
                fontFamily: 'var(--font-sans)'
              }}>
                🎉 Great news — you appeared in every AI search we tested. No competitors displaced you in these queries.
              </div>
            ) : competitors.length > 0 || directories.length > 0 ? (
              <>
                {competitors.length > 0 && (
                  <>
                    <p className="section-desc">These businesses appeared in searches where<br/>you were not cited:</p>
                    <div className="competitors-container">
                      {competitors.map((comp, i) => {
                        // Trim the source query to a concise one-liner (max 60 chars)
                        const rawQuery: string = (comp as any).sourceQuery || '';
                        const shortQuery = rawQuery
                          .replace(/^(what is the |who is the |which is the |tell me the )/i, '')
                          .trim()
                          .slice(0, 60) + (rawQuery.length > 60 ? '…' : '');

                        return (
                          <div key={i} className="competitor-row">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                              <span className="competitor-domain-text">{comp.domain}</span>
                              {shortQuery && (
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  Appeared when asked: "{shortQuery}"
                                </span>
                              )}
                            </div>
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
                        );
                      })}
                    </div>
                  </>
                )}

                {directories.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <p className="section-header-uppercase" style={{ color: '#64748b', fontSize: '0.75rem' }}>Directories & Platforms</p>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px', lineHeight: '1.4' }}>
                      AI frequently cites these directories — getting listed there may help.
                    </p>
                    <div className="competitors-container" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                      {directories.map((dir, i) => (
                        <div key={i} className="competitor-row" style={{ borderBottomColor: '#e2e8f0' }}>
                          <span className="competitor-domain-text" style={{ color: '#475569' }}>{dir.domain}</span>
                          <div className="competitor-stat-wrapper">
                            <span className="competitor-count-text" style={{ background: '#e2e8f0', color: '#334155' }}>
                              {dir.appearances}/{totalCount}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '16px 20px',
                borderRadius: '8px',
                color: '#64748b',
                fontSize: '0.95rem',
                lineHeight: '1.5',
                marginTop: '12px',
                fontFamily: 'var(--font-sans)'
              }}>
                No competitor information was returned for these queries.
              </div>
            )}
          </section>
        )}

        {/* ZONE 4 - ACTION PLAN */}
        {!isScanning && (
          <section className="zone-4 animate-slide-up">
            <p className="section-header-uppercase">Your action plan</p>

            {topFixes.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>Generating recommendations...</div>
            ) : (() => {
              // Collect all fixes flattened across tiers
              const tierOrder = ['quick_win', 'this_week', 'hire_dev'] as const;
              const allFixes: any[] = [];
              tierOrder.forEach(tier => {
                topFixes.filter((f: any) => f.tier === tier).forEach(f => allFixes.push({ ...f, _tier: tier }));
              });
              // Fallback: if no tier set, treat all as ordered list
              const fixList = allFixes.length > 0 ? allFixes : topFixes.map((f: any) => ({ ...f, _tier: 'quick_win' }));
              const primaryFix = fixList[0];
              const secondaryFixes = fixList.slice(1);

              const tierMeta: Record<string, { icon: string; label: string; sublabel: string; color: string; bg: string; border: string }> = {
                quick_win: { icon: '⚡', label: 'Do it now', sublabel: 'Under 1 hour — you can do this yourself today', color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0' },
                this_week: { icon: '📋', label: 'This week', sublabel: 'A few hours — no developer needed', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
                hire_dev: { icon: '👷', label: 'Needs a developer', sublabel: 'Hand this to your web developer', color: '#6b21a8', bg: '#faf5ff', border: '#e9d5ff' },
              };

              // Plain-language outcome labels for known fix types
              const outcomeLabels: Record<string, { headline: string; plain: string }> = {
                'llms': { headline: 'Help AI understand your business', plain: 'A simple text file on your website tells AI tools exactly what you do and where you are.' },
                'schema': { headline: 'Make your details machine-readable', plain: 'Adds structured code so AI tools can reliably extract your name, address, and services.' },
                'robots': { headline: 'Stop accidentally blocking AI crawlers', plain: 'Your settings file may be preventing AI tools from reading your site.' },
                'faq': { headline: 'Answer the questions AI gets asked', plain: 'Adding FAQ content makes it more likely AI repeats your answers verbatim to users.' },
                'meta-title': { headline: 'Improve how AI summarises your page', plain: 'Your page title and description are what AI tools use to describe you to users.' },
              };

              const getOutcome = (fix: any) => {
                const key = Object.keys(outcomeLabels).find(k => fix.id?.includes(k) || fix.title?.toLowerCase().includes(k));
                return key ? outcomeLabels[key] : null;
              };

              const renderFixCard = (fix: any, isPrimary: boolean) => {
                const meta = tierMeta[fix._tier] || tierMeta.quick_win;
                const outcome = getOutcome(fix);
                return (
                  <div
                    key={fix.id}
                    style={{
                      border: `1px solid ${isPrimary ? '#6366f1' : meta.border}`,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: isPrimary ? 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)' : meta.bg,
                      boxShadow: isPrimary ? '0 4px 20px rgba(99,102,241,0.1)' : 'none',
                    }}
                  >
                    <div style={{ padding: isPrimary ? '20px 24px' : '14px 20px' }}>
                      {isPrimary && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6366f1', background: '#e0e7ff', padding: '2px 8px', borderRadius: '4px' }}>Start here</span>
                          <span style={{ fontSize: '0.8rem', color: '#6366f1' }}>{meta.icon} {meta.label}</span>
                        </div>
                      )}
                      {/* Plain-language headline */}
                      <p style={{ margin: '0 0 4px 0', fontWeight: isPrimary ? 700 : 600, fontSize: isPrimary ? '1.05rem' : '0.95rem', color: '#0f172a' }}>
                        {outcome ? outcome.headline : fix.title}
                      </p>
                      {/* One-liner plain explanation */}
                      {outcome && (
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                          {outcome.plain}
                        </p>
                      )}
                      {/* Technical detail secondary */}
                      {outcome && (
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                          Technical detail: {fix.title}
                        </p>
                      )}
                      {!outcome && (
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>{fix.description}</p>
                      )}
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>⏱ {fix.timeEstimate}</span>
                        {fix.impact && <span style={{ fontSize: '0.8rem', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>{fix.impact} impact</span>}
                        {!isPrimary && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{meta.icon} {meta.label}</span>}
                      </div>
                    </div>
                  </div>
                );
              };

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Primary fix — prominent */}
                  {primaryFix && renderFixCard(primaryFix, true)}

                  {/* Secondary fixes — collapsed by default */}
                  {secondaryFixes.length > 0 && (
                    <>
                      {!showAllFixes ? (
                        <button
                          onClick={() => setShowAllFixes(true)}
                          style={{ background: 'none', border: '1.5px dashed #e2e8f0', borderRadius: '10px', padding: '12px', color: '#64748b', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.15s', width: '100%' }}
                        >
                          + {secondaryFixes.length} more issue{secondaryFixes.length > 1 ? 's' : ''} found — show all
                        </button>
                      ) : (
                        secondaryFixes.map(fix => renderFixCard(fix, false))
                      )}
                    </>
                  )}

                  {/* Expectation-setting footer note */}
                  <div className="action-plan-expectation">
                    <span className="action-plan-expectation-icon">ℹ️</span>
                    <p>AI citation rates typically take <strong>4–8 weeks</strong> to reflect changes. The fix above is the fastest path to being picked up in new AI searches.</p>
                  </div>
                </div>
              );
            })()}
          </section>
        )}
        {/* ZONE 4.5 — AI FIX GENERATORS */}
        {!isScanning && profile && (
          <section className="zone-4 animate-slide-up">
            <div className="generators-section-header">
              <p className="section-header-uppercase">Generate the fix content</p>
              <p className="generators-section-subtitle">
                Select any issue below — we'll generate a ready-to-use draft in seconds.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(['llms', 'schema', 'robots', 'meta', 'faq'] as const).map(type => {
                // Map generator type to the corresponding technical check id
                const checkIdMap: Record<string, string> = {
                  llms: 'llms',
                  schema: 'schema',
                  robots: 'robots',
                  meta: 'meta-title',
                  faq: 'faq',
                };
                const checkId = checkIdMap[type];
                const check = technicalChecks.find(c => c.id === checkId);
                const detected = check ? check.status !== 'pass' : false;

                return (
                  <ActionDraft
                    key={type}
                    type={type}
                    profile={profile}
                    domain={report.domain}
                    detected={detected}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* PRO WAITLIST CTA — bottom of page */}

        {!isScanning && (
          <section className="zone-5 animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {user && (
              <div className="inline-email-capture" style={{ textAlign: 'center', padding: '32px 24px', background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <div className="email-capture-inner">
                  {user?.isPro ? (
                    <>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px', color: '#0f172a' }}>Scan complete!</h4>
                      <p style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '0', lineHeight: '1.6' }}>
                        This scan has been saved to your dashboard. You can view trends and manage all tracked domains in your dashboard.
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px', color: '#0f172a' }}>Unlock Continuous AI Tracking</h4>
                      <p style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '24px', lineHeight: '1.6' }}>
                        Upgrade to Pro to unlock unlimited scans, historical trend graphs, and priority processing.
                      </p>
                      <button
                        onClick={onNavigateToPricing}
                        style={{
                          background: '#0f172a',
                          color: '#fff',
                          border: 'none',
                          padding: '10px 24px',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          marginBottom: '0'
                        }}
                      >
                        Upgrade to Pro →
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            
            <div style={{ textAlign: 'center', marginTop: user ? '0' : '32px' }}>
              <button
                onClick={onRescan}
                style={{ background: 'none', border: 'none', fontSize: '0.95rem', color: '#64748b', cursor: 'pointer', padding: '12px 24px', borderRadius: '8px', backgroundColor: '#f1f5f9', fontWeight: 500, transition: 'all 0.2s ease' }}
                onMouseOver={e => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
                onMouseOut={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
              >
                Scan another site
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
