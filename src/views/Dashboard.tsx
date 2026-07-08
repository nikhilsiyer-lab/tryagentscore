import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase/client'
import './Dashboard.css'

interface DashboardProps {
  user: { email: string; isPro: boolean } | null
  onStartScan: () => void
}

interface FixItem {
  id: string
  title: string
  description: string
  impact: string
  timeEstimate: string
  tier: string
}

interface UserDomain {
  domain: string
  latestScore: number
  latestCitationRate: number
  latestScanAt: string
  latestFixes: FixItem[]
  scanCount: number
}

interface TrendPoint {
  id: number
  composite_score: number
  citation_rate: number
  created_at: string
}

export default function Dashboard({ user, onStartScan }: DashboardProps) {
  const [domains, setDomains] = useState<UserDomain[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [trendData, setTrendData] = useState<TrendPoint[]>([])
  const [loadingDomains, setLoadingDomains] = useState(true)
  const [loadingTrend, setLoadingTrend] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'settings'>(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab')
      if (tab === 'recommendations' || tab === 'settings') return tab
    }
    return 'overview'
  })
  
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null)
  const [chartTooltip, setChartTooltip] = useState<{x: number, y: number, date: string, composite: number, citation: number} | null>(null)

  const supabase = createClient()

  // Sync tab state to URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', activeTab)
      window.history.replaceState({}, '', url)
    }
  }, [activeTab])

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Fix 1: Ensure dark theme is applied (login page sets light-theme, dashboard should always be dark)
  useEffect(() => {
    document.documentElement.classList.remove('light-theme')
  }, [])

  // Fix 2: Client-side logout to prevent blank screen after redirect
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Fetch unique domains scanned by user
  useEffect(() => {
    async function fetchDomains() {
      try {
        const res = await fetch('/api/domains')
        if (res.ok) {
          const data = await res.json()
          setDomains(data)
          if (data.length > 0) {
            setSelectedDomain(data[0].domain)
          }
        }
      } catch (err) {
        console.error('Failed to fetch domains', err)
      } finally {
        setLoadingDomains(false)
      }
    }
    fetchDomains()
  }, [])

  // Fetch trend data whenever selected domain changes
  useEffect(() => {
    if (!selectedDomain) return

    async function fetchTrend() {
      setLoadingTrend(true)
      try {
        const res = await fetch(`/api/trends?domain=${encodeURIComponent(selectedDomain)}`)
        if (res.ok) {
          const data = await res.json()
          setTrendData(data)
        }
      } catch (err) {
        console.error('Failed to fetch trends', err)
      } finally {
        setLoadingTrend(false)
      }
    }
    fetchTrend()
  }, [selectedDomain])

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Failed to redirect to Stripe Billing Portal')
        setPortalLoading(false)
      }
    } catch (err) {
      console.error(err)
      setPortalLoading(false)
    }
  }

  // Handle action tracking
  const trackAction = async (action: string, fixId: string) => {
    try {
      await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: `recommendation_${action}`, event_data: { fixId, domain: selectedDomain } })
      });
      
      // Update local state immediately
      setDomains(prev => prev.map(d => {
        if (d.domain === selectedDomain) {
          return {
            ...d,
            latestFixes: d.latestFixes.filter(f => f.id !== fixId)
          }
        }
        return d
      }))
      
      if (action === 'applied') {
        setToast({ message: 'Marked as applied. We will check this on the next automatic scan.', type: 'success' })
      } else if (action === 'dismissed') {
        setToast({ message: 'Recommendation dismissed.', type: 'success' })
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'An error occurred. Please try again.', type: 'error' })
    }
  }

  // Generate SVG paths for trend data
  const renderChart = () => {
    if (trendData.length === 0) return null

    const width = 600
    const height = 220
    const padding = 30
    
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    const maxVal = 100

    const getCoords = (index: number, val: number) => {
      const x = padding + (index / Math.max(1, trendData.length - 1)) * chartWidth
      const y = padding + chartHeight - (val / maxVal) * chartHeight
      return { x, y }
    }

    let compositePath = ''
    let citationPath = ''
    
    trendData.forEach((pt, idx) => {
      const compCoords = getCoords(idx, pt.composite_score)
      const citCoords = getCoords(idx, pt.citation_rate)

      if (idx === 0) {
        compositePath = `M ${compCoords.x} ${compCoords.y}`
        citationPath = `M ${citCoords.x} ${citCoords.y}`
      } else {
        compositePath += ` L ${compCoords.x} ${compCoords.y}`
        citationPath += ` L ${citCoords.x} ${citCoords.y}`
      }
    })

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="4" />
        <line x1={padding} y1={padding + chartHeight / 2} x2={width - padding} y2={padding + chartHeight / 2} stroke="#e2e8f0" strokeDasharray="4" />
        <line x1={padding} y1={padding + chartHeight} x2={width - padding} y2={padding + chartHeight} stroke="#e2e8f0" />

        <text x={padding - 8} y={padding + 4} textAnchor="end" fontSize="10" fill="#94a3b8">100</text>
        <text x={padding - 8} y={padding + chartHeight / 2 + 4} textAnchor="end" fontSize="10" fill="#94a3b8">50</text>
        <text x={padding - 8} y={padding + chartHeight + 4} textAnchor="end" fontSize="10" fill="#94a3b8">0</text>

        {trendData.length > 1 ? (
          <>
            <path d={compositePath} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
            <path d={citationPath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : null}

        {trendData.map((pt, idx) => {
          const compCoords = getCoords(idx, pt.composite_score)
          const citCoords = getCoords(idx, pt.citation_rate)
          return (
            <g key={pt.id} 
               onMouseEnter={() => setChartTooltip({ x: compCoords.x, y: compCoords.y - 10, date: new Date(pt.created_at).toLocaleDateString(), composite: pt.composite_score, citation: pt.citation_rate })}
               onMouseLeave={() => setChartTooltip(null)}
               style={{ cursor: 'pointer' }}
            >
              {/* Invisible larger hit area for hover */}
              <circle cx={compCoords.x} cy={compCoords.y} r="15" fill="transparent" />
              <circle cx={citCoords.x} cy={citCoords.y} r="15" fill="transparent" />
              
              <circle cx={compCoords.x} cy={compCoords.y} r="5" fill="var(--primary)" stroke="#ffffff" strokeWidth="2" />
              <circle cx={citCoords.x} cy={citCoords.y} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
            </g>
          )
        })}

        {chartTooltip && (
          <g>
            <rect x={chartTooltip.x - 60} y={chartTooltip.y - 55} width="120" height="50" fill="#1e293b" rx="4" />
            <text x={chartTooltip.x} y={chartTooltip.y - 40} fill="#f8fafc" fontSize="10" textAnchor="middle" fontWeight="bold">{chartTooltip.date}</text>
            <text x={chartTooltip.x} y={chartTooltip.y - 25} fill="#cbd5e1" fontSize="10" textAnchor="middle">Score: {chartTooltip.composite}% | Citation: {chartTooltip.citation}%</text>
          </g>
        )}

        {trendData.length > 0 && (
          <text x={padding} y={height - 8} fontSize="10" fill="#94a3b8" textAnchor="start">
            {new Date(trendData[0].created_at).toLocaleDateString()}
          </text>
        )}
        {trendData.length > 1 && (
          <text x={width - padding} y={height - 8} fontSize="10" fill="#94a3b8" textAnchor="end">
            {new Date(trendData[trendData.length - 1].created_at).toLocaleDateString()}
          </text>
        )}
      </svg>
    )
  }

  const selectedDomainData = domains.find(d => d.domain === selectedDomain)
  
  // Calculate Deltas
  let scoreDelta = 0;
  let citationDelta = 0;
  if (trendData.length >= 2) {
    const latest = trendData[trendData.length - 1];
    const previous = trendData[trendData.length - 2];
    scoreDelta = latest.composite_score - previous.composite_score;
    citationDelta = latest.citation_rate - previous.citation_rate;
  }
  
  // Calculate usage limit mock
  const scansUsedThisMonth = domains.reduce((acc, d) => acc + d.scanCount, 0);

  return (
    <div className="dashboard-view animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1>Your Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Track your domains and monitor AI citation improvements.</p>
        </div>
        <div className="dashboard-header-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={onStartScan} className="btn-pricing btn-pricing-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
            {user?.isPro ? 'Run scan now' : '+ New Scan'}
          </button>
          
          <div className="dashboard-user-info">
            <span className={`user-badge ${user?.isPro ? 'pro-badge' : ''}`}>
              {user?.isPro ? 'Pro Member' : 'Free Plan'}
            </span>
            <button onClick={handleLogout} className="text-btn" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Log out
            </button>
          </div>
        </div>
      </div>

      {/* Pricing CTA Banner for Free Users OR Status Banner for Pro Users */}
      {!user?.isPro ? (
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.03) 0%, rgba(99, 102, 241, 0.05) 100%)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '16px', 
          padding: '24px 32px', 
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Unlock continuous trend tracking
            </h4>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px' }}>
              Your visibility score was {domains[0]?.latestScore || '--'} last scan. Upgrade to Pro to get an analyst working on it - not just another score. Lock in €14.99/month as an early member.
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Usage: {scansUsedThisMonth} free scans used
            </p>
          </div>
          <a href="/?go=pricing" className="btn-pricing btn-pricing-primary" style={{ padding: '10px 20px', textDecoration: 'none' }}>
            Upgrade to Pro
          </a>
        </div>
      ) : (
        <div style={{ 
          background: '#ecfdf5', 
          border: '1px solid #10b981', 
          borderRadius: '16px', 
          padding: '20px 32px', 
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🛡️</span>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: '#065f46' }}>
              Pro monitoring active
            </h4>
            <p style={{ margin: 0, color: '#047857', fontSize: '0.9rem' }}>
              Next scheduled automatic check: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Custom Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        {(['overview', 'recommendations', 'settings'] as const).map(tab => {
          if (tab === 'recommendations' && !user?.isPro) return null; // Hide recs tab for free
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 0',
                fontSize: '0.95rem',
                fontWeight: activeTab === tab ? 600 : 500,
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {loadingDomains ? (
        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ height: '32px', width: '200px', background: '#e2e8f0', borderRadius: '4px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          <div style={{ height: '120px', width: '100%', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
        </div>
      ) : domains.length === 0 ? (
        <div className="empty-dashboard card-gradient">
          <div className="empty-icon">📊</div>
          <h2>No scans found</h2>
          <p>You haven't run any scans under this account yet. Perform a scan from the home page to start tracking visibility metrics.</p>
          <button onClick={onStartScan} className="btn-pricing btn-pricing-primary">
            Run your first scan →
          </button>
        </div>
      ) : (
        <div className="dashboard-layout">
          {/* Sidebar */}
          <div className="dashboard-sidebar">
            <h2>Tracked Domains</h2>
            <div className="domain-list">
              {domains.map((d) => (
                <button
                  key={d.domain}
                  onClick={() => setSelectedDomain(d.domain)}
                  className={`domain-item ${selectedDomain === d.domain ? 'active' : ''}`}
                >
                  <span className="domain-item-name">{d.domain}</span>
                  <div className="domain-item-meta">
                    <span>Score: {d.latestScore}</span>
                    <span>{d.scanCount} scan{d.scanCount > 1 ? 's' : ''}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Dashboard Content based on Tab */}
          <div className="dashboard-content">
            
            {activeTab === 'overview' && (
              <>
                {selectedDomainData && (
                  <div className="trend-header">
                    <div className="trend-title">
                      <h3>{selectedDomain}</h3>
                      <p className="trend-subtitle">
                        Last scanned {new Date(selectedDomainData.latestScanAt).toLocaleDateString()} at{' '}
                        {new Date(selectedDomainData.latestScanAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <a href={`/?url=${encodeURIComponent(selectedDomain)}`} className="btn-pricing btn-pricing-outline" style={{ padding: '8px 16px', fontSize: '0.9rem', textDecoration: 'none' }}>
                        View Latest Results
                      </a>
                    </div>
                  </div>
                )}

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">Latest Visibility Score</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <div className="stat-value">{selectedDomainData?.latestScore}%</div>
                      {trendData.length >= 2 && (
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: scoreDelta > 0 ? '#10b981' : scoreDelta < 0 ? '#ef4444' : '#64748b' }}>
                          {scoreDelta > 0 ? '↑' : scoreDelta < 0 ? '↓' : ''} {Math.abs(scoreDelta)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Latest Citation Rate</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <div className="stat-value">{selectedDomainData?.latestCitationRate}%</div>
                      {trendData.length >= 2 && (
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: citationDelta > 0 ? '#10b981' : citationDelta < 0 ? '#ef4444' : '#64748b' }}>
                          {citationDelta > 0 ? '↑' : citationDelta < 0 ? '↓' : ''} {Math.abs(citationDelta)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="chart-container">
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    Historical Progress
                  </h4>
                  {loadingTrend ? (
                    <div style={{ height: '220px', display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px' }}>
                      <div style={{ height: '20px', width: '100px', background: '#e2e8f0', borderRadius: '4px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                      <div style={{ height: '160px', width: '100%', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                    </div>
                  ) : user?.isPro ? (
                    <>
                      {renderChart()}
                      <div className="chart-legend">
                        <div className="legend-item">
                          <div className="legend-color composite"></div>
                          <span>Overall Score</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-color citation"></div>
                          <span>AI Citation Rate</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ 
                      height: '220px', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: 'rgba(241, 245, 249, 0.5)',
                      borderRadius: '8px',
                      border: '1px dashed var(--border-color)',
                      padding: '24px',
                      textAlign: 'center'
                    }}>
                      <span style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔒</span>
                      <h5 style={{ margin: '0 0 4px 0', fontWeight: 600 }}>Trend Chart Locked</h5>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                        Historical trend chart is only available on the Pro plan.
                      </p>
                      <a href="/?go=pricing" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginTop: '8px', textDecoration: 'none' }}>
                        Upgrade now →
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'recommendations' && user?.isPro && (
              <div className="recommendations-tab">
                <h3 style={{ marginBottom: '16px' }}>Suggested fixes for {selectedDomain}</h3>
                {selectedDomainData?.latestFixes && selectedDomainData.latestFixes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedDomainData.latestFixes.map((fix, idx) => (
                      <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>{fix.title}</h4>
                          <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                            {fix.tier.replace('_', ' ')}
                          </span>
                        </div>
                        <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '24px' }}>
                          {fix.description}
                        </p>
                        
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <button onClick={() => trackAction('copied', fix.id)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer', color: '#334155', fontWeight: 500 }}>
                            Copy draft text
                          </button>
                          <button onClick={() => trackAction('applied', fix.id)} style={{ background: '#10b981', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer', color: '#fff', fontWeight: 600 }}>
                            ✓ Mark as Applied
                          </button>
                          <button onClick={() => trackAction('dismissed', fix.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem', marginLeft: 'auto' }}>
                            Dismiss
                          </button>
                        </div>
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', fontSize: '0.8rem', color: '#94a3b8' }}>
                          We will re-check automatically and let you know if this helped.
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', padding: '32px', textAlign: 'center', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    No specific fixes generated yet. Run a new scan or wait for the next automatic check.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="settings-tab">
                <h3 style={{ marginBottom: '24px' }}>Account Settings</h3>
                
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 16px 0' }}>Profile</h4>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Email address (Read-only)</label>
                    <input type="text" value={user?.email} disabled style={{ width: '100%', maxWidth: '300px', padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569' }} />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>Authentication is handled securely via magic links.</p>
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Subscription & Billing</span>
                    <span className={`user-badge ${user?.isPro ? 'pro-badge' : ''}`} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                      {user?.isPro ? 'Pro Plan Active' : 'Free Plan'}
                    </span>
                  </h4>
                  
                  {user?.isPro ? (
                    <>
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#475569', fontSize: '0.9rem' }}>Current Plan</span>
                          <span style={{ fontWeight: 600 }}>AgentScore Pro</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#475569', fontSize: '0.9rem' }}>Price</span>
                          <span style={{ fontWeight: 600 }}>€14.99 / month</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#475569', fontSize: '0.9rem' }}>Usage</span>
                          <span style={{ fontWeight: 600 }}>Unlimited scans</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button 
                          onClick={handlePortal} 
                          disabled={portalLoading} 
                          style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}
                        >
                          {portalLoading ? 'Loading...' : 'Update Payment Method'}
                        </button>
                        <button 
                          onClick={handlePortal} 
                          disabled={portalLoading} 
                          style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 20px', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}
                        >
                          Cancel Subscription
                        </button>
                        <button 
                          onClick={handlePortal} 
                          disabled={portalLoading} 
                          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.9rem', cursor: 'pointer', marginLeft: 'auto' }}
                        >
                          View Invoices ↗
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '16px' }}>
                        You are currently on the Free plan. Upgrade to unlock unlimited scans, historical trends, and priority processing.
                      </p>
                      <a href="/?go=pricing" className="btn-pricing btn-pricing-primary" style={{ padding: '10px 20px', fontSize: '0.9rem', textDecoration: 'none', display: 'inline-block' }}>
                        Upgrade to Pro
                      </a>
                    </>
                  )}
                </div>

                <div style={{ border: '1px solid #fca5a5', borderRadius: '12px', padding: '24px', background: '#fef2f2' }}>
                  <h4 style={{ margin: '0 0 16px 0', color: '#991b1b' }}>Danger Zone</h4>
                  <p style={{ fontSize: '0.95rem', color: '#7f1d1d', marginBottom: '16px' }}>Permanently delete your account and all associated scan data. This will immediately cancel any active subscriptions.</p>
                  <button onClick={async () => {
                    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone and all scan history will be permanently deleted.')) {
                      try {
                        const res = await fetch('/api/auth/delete-account', { method: 'POST' });
                        if (res.ok) {
                          alert('Your account and all associated data have been permanently deleted.');
                          window.location.href = '/';
                        } else {
                          const data = await res.json();
                          alert(`Error: ${data.error || 'Failed to delete account'}`);
                        }
                      } catch (err) {
                        console.error('Failed to delete account:', err);
                        alert('An unexpected error occurred while deleting your account.');
                      }
                    }
                  }} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                    Delete Account
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 9999,
          animation: 'slideUp 0.3s ease-out'
        }}>
          <span style={{ fontSize: '1.2rem' }}>{toast.type === 'success' ? '✓' : '⚠'}</span>
          <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
