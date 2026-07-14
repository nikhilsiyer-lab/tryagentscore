import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '../lib/supabase/client'
import './Dashboard.css'

interface DashboardProps {
  user: { email: string; isPro: boolean } | null
  onStartScan: (domain?: string) => void
  onViewResults: (scanId: string) => void
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
  latestScanId: string
  latestScore: number
  latestCitationRate: number
  latestScanAt: string
  latestFixes: FixItem[]
  scanCount: number
  history: { date: string; score: number; citationRate: number }[]
}

export default function Dashboard({ user, onStartScan, onViewResults }: DashboardProps) {
  const [domains, setDomains] = useState<UserDomain[]>([])
  const [loadingDomains, setLoadingDomains] = useState(true)
  const [selectedDomainIndex, setSelectedDomainIndex] = useState(0)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [domainToDelete, setDomainToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  const confirmDeleteDomain = async () => {
    if (!domainToDelete) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/domains?domain=${encodeURIComponent(domainToDelete)}`, { method: 'DELETE' })
      if (res.ok) {
        setDomains(prev => prev.filter(d => d.domain !== domainToDelete))
        if (domains[selectedDomainIndex]?.domain === domainToDelete) {
          setSelectedDomainIndex(0)
        }
        setDomainToDelete(null)
      } else {
        alert('Failed to delete domain')
      }
    } catch (err) {
      console.error(err)
      alert('Error deleting domain')
    } finally {
      setIsDeleting(false)
    }
  }

  // Fetch unique domains scanned by user
  useEffect(() => {
    async function fetchDomains() {
      try {
        const res = await fetch('/api/domains')
        if (res.ok) {
          const data = await res.json()
          setDomains(data)
        }
      } catch (err) {
        console.error('Failed to fetch domains', err)
      } finally {
        setLoadingDomains(false)
      }
    }
    fetchDomains()
  }, [])

  if (loadingDomains) {
    return (
      <div className="dashboard-root animate-fade-in" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading your dashboard...</p>
      </div>
    )
  }

  const latestScanId = domains.length > 0 ? domains[0].latestScanId : null;

  return (
    <div className="dashboard-root animate-fade-in">
      <div className="dashboard-container">
        
        {/* Hero */}
        <div className="dashboard-hero">
          <h1>Your Dashboard</h1>
          <p className="hero-subtitle">Measure better. Compare better. Fix faster.</p>
          <div className="hero-actions">
            <button onClick={onStartScan} className="btn btn-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Run scan now
            </button>
            {latestScanId && (
              <button onClick={() => onViewResults(latestScanId)} className="btn btn-secondary">
                View latest results
              </button>
            )}
          </div>
        </div>

        {/* Domain summary & Trend Chart */}
        {domains.length > 0 && (
          <div className="dashboard-insights">
            <div className="dashboard-summary">
              <div className="summary-card">
                <span className="summary-label">Total domains analyzed</span>
                <span className="summary-value">{domains.length}</span>
              </div>
            </div>
            
            {domains[selectedDomainIndex]?.history && domains[selectedDomainIndex].history.length > 1 && (
              <div className="dashboard-trend-card">
                <div className="trend-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3>Visibility Trend</h3>
                    <p>Tracking your AI score and citation rate over time</p>
                  </div>
                  {domains.length > 1 && (
                    <select 
                      className="form-select" 
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', fontSize: '13px' }}
                      value={selectedDomainIndex}
                      onChange={(e) => setSelectedDomainIndex(Number(e.target.value))}
                    >
                      {domains.map((d, idx) => (
                        <option key={d.domain} value={idx}>{d.domain}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="trend-chart-container" style={{ height: '200px', marginTop: '16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={domains[selectedDomainIndex].history.map(h => ({
                      ...h,
                      shortDate: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                      <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                      <YAxis yAxisId="left" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        formatter={(value: number, name: string) => [`${value}%`, name === 'score' ? 'Visibility Score' : 'Citation Rate']}
                      />
                      <Line yAxisId="left" type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-primary)' }} activeDot={{ r: 6 }} name="score" />
                      <Line yAxisId="left" type="monotone" dataKey="citationRate" stroke="var(--secondary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-primary)' }} activeDot={{ r: 6 }} name="citationRate" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Domain Cards / Empty State */}
        {domains.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="empty-icon">📊</div>
            <h3>No monthly scans yet</h3>
            <p>Run your first scan to start monthly updates automatically.</p>
            <button onClick={onStartScan} className="btn btn-primary" style={{ marginTop: '16px' }}>
              Run scan now
            </button>
          </div>
        ) : (
          <div className="domain-grid">
            {domains.map((d) => (
              <div key={d.domain} className={`domain-card ${d.latestScore < 30 ? 'low-score-warning' : ''}`}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="card-header-left" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3>{d.domain}</h3>
                    <div className="card-metadata" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start', marginTop: '8px' }}>
                      <span className="meta-tag" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', fontWeight: 600, border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>✓ Monthly scans active</span>
                      <span className="meta-tag" style={{ background: 'transparent', padding: 0, border: 'none', color: 'var(--text-secondary)', fontSize: '12px' }}>Last scan: {new Date(d.latestScanAt).toLocaleDateString()}</span>
                      <span className="meta-tag" style={{ background: 'transparent', padding: 0, border: 'none', color: 'var(--text-secondary)', fontSize: '12px' }}>Next scan: {new Date(new Date(d.latestScanAt).setMonth(new Date(d.latestScanAt).getMonth() + 1)).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="card-header-actions" style={{ position: 'relative' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === d.domain ? null : d.domain); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', fontSize: '20px', lineHeight: '1', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                      title="More actions"
                    >
                      ⋮
                    </button>
                    
                    {openDropdown === d.domain && (
                      <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '160px', overflow: 'hidden' }}>
                        <button 
                          onClick={(e) => { setOpenDropdown(null); setDomainToDelete(d.domain); }}
                          style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                          Remove Domain
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-stats">
                  <div className="stat-box">
                    <span className="stat-label">Visibility Score</span>
                    <span className="stat-value">{d.latestScore}%</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Citation Rate</span>
                    <span className="stat-value">{d.latestCitationRate}%</span>
                  </div>
                </div>

                <div className="card-hint" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', padding: '10px 12px', background: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <strong>Top competitor:</strong> {d.history[d.history.length - 1]?.competitors?.[0]?.domain || 'Not identified'}
                </div>

                <div className="card-footer" style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => onViewResults(d.latestScanId)} className="btn btn-secondary btn-sm" style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    View results
                  </button>
                  <button onClick={() => onStartScan(d.domain)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    Run again
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {domainToDelete && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, animation: 'fadeIn 0.2s ease-out' }}>
          <div className="modal-content" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', transform: 'translateY(0)', animation: 'slideUp 0.3s ease-out' }}>
            
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', margin: '0 auto' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>

            <h3 style={{ textAlign: 'center', fontSize: '20px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-main)' }}>Remove Domain?</h3>
            <p style={{ textAlign: 'center', fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.5' }}>
              Are you sure you want to remove <strong>{domainToDelete}</strong>? This will permanently delete all scan history and metrics.
            </p>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button 
                onClick={() => setDomainToDelete(null)} 
                disabled={isDeleting}
                style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteDomain}
                disabled={isDeleting}
                style={{ flex: 1, padding: '12px', background: '#EF4444', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                {isDeleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
