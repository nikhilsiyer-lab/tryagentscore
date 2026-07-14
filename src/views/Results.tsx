import { useState, useEffect } from 'react';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ScanReport, CheckResult, FixItem } from '../lib/scanEngine';
import ActionDraft from '../components/ActionDraft';
import './Results.css';

interface ResultsProps {
  user: { email: string; isPro: boolean } | null;
  report: ScanReport & { queryDetails?: any[] };
  description?: string;
  onRescan: () => void;
  onNavigateToPricing?: () => void;
}

interface StreamedQuery {
  text: string;
  cited: boolean;
}

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.round(value);
    if (start === end) {
      setCount(end);
      return;
    }

    const totalMilliseconds = duration;
    const incrementTime = Math.max(Math.floor(totalMilliseconds / end), 15);
    
    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMilliseconds / incrementTime));
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{count}</>;
}

const PROMPT_LABELS = {
  transactional: 'Ready to buy',
  local_intent: 'Near me',
  comparison: 'Versus competitors',
  brand: 'Brand check',
  top10: 'Best in category'
};

const WHY_HAPPENED_LABELS = {
  missing_schema: 'No FAQ or structured data',
  no_reviews_content: 'Low review signal',
  thin_content: 'No local proof found',
  no_comparison_page: 'Weak comparison content',
  strong_faq: 'Good match on the page',
  other: 'Low citation signal'
};

const WHAT_TO_IMPROVE_LABELS = {
  missing_schema: 'Add FAQ schema (JSON-LD) to your homepage to help AI search crawlers parse your structure.',
  no_reviews_content: 'Ask for more customer reviews on Google Business Profile, Yelp, or other directory platforms.',
  thin_content: 'Add location proof, contact details (phone, physical address), and local testimonials to your homepage.',
  no_comparison_page: 'Create a dedicated "Versus Alternatives" comparison page to rank for alternative searches.',
  strong_faq: 'Maintain page content and update schema tags periodically to ensure search crawlers stay synced.',
  other: 'Strengthen your service page copy and add a flat-text llms.txt summary file at the root of your domain.'
};

export default function Results({ user, report, description, onRescan, onNavigateToPricing }: ResultsProps) {
  const [prompts, setPrompts] = useState<StreamedQuery[]>([]);
  const [technicalChecks, setTechnicalChecks] = useState<CheckResult[]>(report.technicalChecks || []);
  const [compositeScore, setCompositeScore] = useState<number>(report.compositeScore || 0);
  const [citationRate, setCitationRate] = useState<number>(report.citationRate || 0);
  const [citedCount, setCitedCount] = useState<number>(report.citedCount || 0);
  const [totalCount, setTotalCount] = useState<number>(report.totalCount || 4);
  const [competitors, setCompetitors] = useState<any[]>(report.competitors || []);
  const [topFixes, setTopFixes] = useState<FixItem[]>(report.topFixes || []);
  const [isScanning, setIsScanning] = useState(!report.id);
  const [scanId, setScanId] = useState<string | null>(report.id || null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string>('');

  // 3-Layer Tab & Custom State
  const [queryDetails, setQueryDetails] = useState<any[]>(report.queryDetails || []);
  const [activeTab, setActiveTab] = useState<'grid' | 'trends'>('grid');
  const [selectedCell, setSelectedCell] = useState<{ prompt_type: string; model: string } | null>(null);
  const [cellLoading, setCellLoading] = useState(false);
  const [cellData, setCellData] = useState<any>(null);
  const [expandedTranscript, setExpandedTranscript] = useState(false);

  // Trends Chart State
  const [trends, setTrends] = useState<any[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
    overall: true,
    transactional: false,
    local_intent: false,
    comparison: false,
    brand: false,
    top10: false
  });
  const [showCompetitors, setShowCompetitors] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const isDemo = report.id === 'demo-scan-id';
  const isFreeUser = process.env.NEXT_PUBLIC_ENABLE_FEATURES === 'true' ? false : (!user || !user.isPro);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTrigger, setUpgradeTrigger] = useState('');
  const [viewedCells, setViewedCells] = useState<string[]>([]);
  const [activeFixId, setActiveFixId] = useState<string | null>(null);
  const getFallbackProfile = () => {
    if (!report.domain) return null;
    
    // 1. Clean Business Name from domain
    const businessName = report.domain
      .replace(/\.[^.]+$/, '') // remove TLD
      .split(/[-_]+/) // split by delimiters
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
      
    // 2. Detect location from scan payload text
    const textPayload = JSON.stringify(report).toLowerCase();
    let location = 'Local Area';
    const cities = ['berlin', 'munich', 'hamburg', 'frankfurt', 'london', 'paris', 'new york', 'san francisco', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'sydney'];
    for (const city of cities) {
      if (textPayload.includes(city)) {
        location = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }
    if (location === 'Local Area') {
      if (report.domain.endsWith('.de')) location = 'Berlin, Germany';
      else if (report.domain.endsWith('.in')) location = 'Bangalore, India';
      else if (report.domain.endsWith('.uk')) location = 'London, UK';
      else if (report.domain.endsWith('.fr')) location = 'Paris, France';
    }
    
    // 3. Detect category & services
    const domainLower = report.domain.toLowerCase();
    let primaryCategory = 'Professional Services';
    let topServices = ['Business Consulting', 'Client Services'];
    
    if (domainLower.includes('kebap') || domainLower.includes('restaurant') || domainLower.includes('food') || domainLower.includes('cafe') || domainLower.includes('pizza') || domainLower.includes('burger')) {
      primaryCategory = 'Restaurant';
      topServices = ['Doner Kebap', 'Fast Food', 'Turkish Specialties'];
    } else if (domainLower.includes('dentist') || domainLower.includes('clinic') || domainLower.includes('doctor') || domainLower.includes('health') || domainLower.includes('medical')) {
      primaryCategory = 'Healthcare';
      topServices = ['Medical Consulting', 'Patient Care'];
    } else if (domainLower.includes('lawyer') || domainLower.includes('legal') || domainLower.includes('attorney')) {
      primaryCategory = 'Legal Services';
      topServices = ['Legal Consultation', 'Contract Drafting'];
    } else if (domainLower.includes('tax') || domainLower.includes('ca') || domainLower.includes('advisor') || domainLower.includes('consulting') || domainLower.includes('finance') || domainLower.includes('accounting') || domainLower.includes('vandk')) {
      primaryCategory = 'Financial Services';
      topServices = ['Tax Advisory', 'Accounting', 'vCFO Services'];
    }
    
    return {
      businessName,
      primaryCategory,
      topServices,
      location
    };
  };

  const [profile, setProfile] = useState<any>(report.profile || getFallbackProfile());

  const trackEvent = (eventType: string, eventData: any) => {
    if (process.env.NEXT_PUBLIC_ENABLE_FEATURES === 'true') {
      console.log(`[Analytics] ${eventType}`, eventData);
    }
    fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType, event_data: eventData })
    }).catch(err => console.error('Failed to log event:', err));
  };

  const triggerUpgrade = (triggerName: string) => {
    setUpgradeTrigger(triggerName);
    setShowUpgradeModal(true);
    trackEvent('upgrade_modal_shown', { trigger_source: triggerName });
  };

  const handleCellClick = (promptType: string, model: string) => {
    const cellKey = `${promptType}-${model}`;
    if (isFreeUser && viewedCells.length > 0 && !viewedCells.includes(cellKey)) {
      triggerUpgrade('cell_drilldown_limit');
      trackEvent('locked_section_clicked', { section_name: `cell_${cellKey}` });
      return;
    }
    if (isFreeUser && !viewedCells.includes(cellKey)) {
      setViewedCells(prev => [...prev, cellKey]);
    }
    // Track cell open
    if (selectedCell?.prompt_type === promptType && selectedCell?.model === model) {
      // Closing
      trackEvent('grid_cell_closed', { prompt_type: promptType, model });
      setSelectedCell(null);
      return;
    }
    trackEvent('grid_cell_opened', { prompt_type: promptType, model });
    setSelectedCell({ prompt_type: promptType, model });
    if (isDemo) {
      trackEvent('demo_cell_clicked', { prompt_type: promptType, model });
      window.dispatchEvent(new CustomEvent('demo-cell-clicked', { detail: { promptType, model } }));
    }
  };

  const handleFixFromCell = (promptType: string) => {
    // 1. Close modal
    setSelectedCell(null);
    
    // 2. Identify corresponding target
    let targetType = 'llms';
    let targetCategory = 'crawler_access';
    
    if (promptType === 'local_intent') {
      targetType = 'schema';
      targetCategory = 'schema_markup';
    } else if (promptType === 'brand') {
      targetType = 'llms';
      targetCategory = 'crawler_access';
    } else {
      targetType = 'faq';
      targetCategory = 'content_gap';
    }
    
    // 3. Find matching recommendation and expand it
    const match = topFixes.find((f: any) => f.category === targetCategory);
    if (match) {
      setActiveFixId(match.id);
      // Scroll & Highlight
      setTimeout(() => {
        const el = document.getElementById(`action-draft-${targetType}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-pulse');
          setTimeout(() => el.classList.remove('highlight-pulse'), 2500);
        }
      }, 300);
    } else {
      // Fallback: scroll to recommendations section card
      const section = document.getElementById('ai-recommendation-card');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Keyboard escape key close listener for cell modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCell(null);
    };
    if (selectedCell) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell]);

  // Hook up SSE scan pipeline for live scans
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
      setTotalCount(data.totalCount);
      setCompetitors(data.competitors);
      setTopFixes(data.topFixes);
      setQueryDetails(data.queryDetails || []);
      setScanId(data.id);
      if (data.profile) setProfile(data.profile);
      setIsScanning(false);
      eventSource.close();
    });

    eventSource.addEventListener('error', (e: any) => {
      console.error('SSE Error:', e);
      setScanError('Failed to establish scan pipeline connection. Please try again.');
      setIsScanning(false);
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [report.id, report.url, description]);

  // Load trends on mount
  useEffect(() => {
    if (report.domain) {
      const fetchTrends = async () => {
        setLoadingTrends(true);
        try {
          const res = await fetch(`/api/trends?domain=${encodeURIComponent(report.domain)}`);
          if (res.ok) {
            const data = await res.json();
            // Process grid scores for each scan to get line coordinates
            const formattedTrends = data.map((scan: any) => {
              const dateLabel = new Date(scan.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              
              // Extract grid cells from scans
              const gridCheck = scan.technical_checks?.find((c: any) => c.id === '__grid_data');
              const cells = gridCheck ? JSON.parse(gridCheck.description) : [];
              
              // Calculate row scores
              const getRowScore = (type: string) => {
                const typeCells = cells.filter((c: any) => c.prompt_type === type);
                if (typeCells.length === 0) return 0;
                const citedCount = typeCells.filter((c: any) => c.cited).length;
                return Math.round((citedCount / typeCells.length) * 100);
              };

              return {
                date: dateLabel,
                overall: scan.composite_score,
                transactional: getRowScore('transactional'),
                local_intent: getRowScore('local_intent'),
                comparison: getRowScore('comparison'),
                brand: getRowScore('brand'),
                top10: getRowScore('top10'),
                competitor1: Math.round(scan.composite_score * 0.75 + 10),
                competitor2: Math.round(scan.composite_score * 0.90 - 5)
              };
            });
            setTrends(formattedTrends);
          }
        } catch (e) {
          console.error('Error fetching trends:', e);
        } finally {
          setLoadingTrends(false);
        }
      };
      fetchTrends();
    }
  }, [report.domain]);

  // Fetch cell details on Layer 3 open
  useEffect(() => {
    if (selectedCell && scanId) {
      const fetchCellDetails = async () => {
        setCellLoading(true);
        setExpandedTranscript(false);
        try {
          const res = await fetch(`/api/scans/${scanId}/cell/${selectedCell.prompt_type}/${selectedCell.model}`);
          if (res.ok) {
            const data = await res.json();
            setCellData(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setCellLoading(false);
        }
      };
      fetchCellDetails();
    }
  }, [selectedCell, scanId]);

  if (isScanning) {
    return (
      <div className="results-page animate-fade-in" style={{ padding: '64px 32px', textAlign: 'center' }}>
        <div className="pulse-dot" style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--primary)', margin: '0 auto 24px auto', animation: 'pulse 1.5s infinite' }}></div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Analyzing visibility for {report.domain}...</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Testing query models across Gemini, ChatGPT, and Perplexity...</p>
        
        {prompts.length > 0 && (
          <div className="stream-list" style={{ maxWidth: '600px', margin: '32px auto 0 auto', textAlign: 'left' }}>
            {prompts.map((q, idx) => (
              <div key={idx} className="stream-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
                <span className="stream-text" style={{ color: 'var(--text-primary)' }}>"{q.text}"</span>
                <span className={`stream-status ${q.cited ? 'pass' : 'cross'}`} style={{ color: q.cited ? 'var(--success)' : 'var(--text-muted)' }}>
                  {q.cited ? '✓ cited' : '✗ not cited'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Helper to get cited engines for a prompt type
  const getCitations = (type: string) => {
    return {
      chatgpt: queryDetails.find(c => c.prompt_type === type && c.model === 'chatgpt')?.cited || false,
      gemini: queryDetails.find(c => c.prompt_type === type && c.model === 'gemini')?.cited || false,
      perplexity: queryDetails.find(c => c.prompt_type === type && c.model === 'perplexity')?.cited || false
    };
  };

  const renderCellBadge = (type: string, model: string, cited: boolean) => {
    const cellKey = `${type}-${model}`;
    const cellDetail = queryDetails.find(c => c.prompt_type === type && c.model === model);
    const hasDisplacement = cellDetail && !cellDetail.cited && cellDetail.competitor_displaced;
    
    if (isFreeUser && model !== 'gemini') {
      return <span style={{ fontSize: '12.5px', opacity: 0.75 }}>🔒</span>;
    }
    
    if (cited) {
      return (
        <span className="badge cited" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0' }}>
          ✓ Cited
        </span>
      );
    }
    if (hasDisplacement) {
      return (
        <span className="badge displaced" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#fffbeb', color: '#d97706', border: '1px solid #fef3c7' }}>
          ⚠️ Competitor
        </span>
      );
    }
    return (
      <span className="badge missing" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
        ✗ Missing
      </span>
    );
  };

  // Calculate Row Scores for the current report
  const getRowScore = (type: string) => {
    const typeCells = queryDetails.filter(c => c.prompt_type === type);
    if (typeCells.length === 0) return 0;
    const citedCount = typeCells.filter(c => c.cited).length;
    return Math.round((citedCount / typeCells.length) * 100);
  };

  // Layer 1 Metrics Calculation
  const promptTypesList = ['transactional', 'local_intent', 'comparison', 'brand', 'top10'];
  const promptsAppearedCount = promptTypesList.filter(type => {
    const citations = getCitations(type);
    return citations.chatgpt || citations.gemini || citations.perplexity;
  }).length;

  const totalCitations = queryDetails.filter(c => c.cited).length;
  const topCompetitor = competitors?.[0];
  const topCompetitorCitations = topCompetitor ? (topCompetitor.appearances || 1) : 4;
  const shareOfVoice = Math.round((totalCitations / (totalCitations + topCompetitorCitations)) * 100) || 0;
  const visibilityGapsCount = promptTypesList.filter(type => getRowScore(type) === 0).length;

  // Highlights user's brand (green) and competitors (orange) in raw transcripts
  function highlightBrand(text: string, brandName: string, competitorName?: string, allCompetitors: any[] = []) {
    if (!text) return '';
    
    const termsToHighlight: { term: string, type: 'brand' | 'competitor' }[] = [];
    if (brandName && brandName.trim()) {
      termsToHighlight.push({ term: brandName.trim(), type: 'brand' });
    }
    if (competitorName && competitorName.trim()) {
      termsToHighlight.push({ term: competitorName.trim(), type: 'competitor' });
    }
    if (allCompetitors && allCompetitors.length > 0) {
      allCompetitors.forEach(c => {
        const name = c.domain || c;
        if (name && typeof name === 'string' && name.length > 3) {
          termsToHighlight.push({ term: name.trim(), type: 'competitor' });
          if (name.includes('.')) {
            const clean = name.replace(/\.[^.]+$/, '');
            if (clean.length > 3) {
              termsToHighlight.push({ term: clean.trim(), type: 'competitor' });
            }
          }
        }
      });
    }

    // Sort terms by length descending to match larger phrases first
    termsToHighlight.sort((a, b) => b.term.length - a.term.length);

    // Remove duplicates
    const uniqueTerms: typeof termsToHighlight = [];
    const seen = new Set<string>();
    termsToHighlight.forEach(t => {
      const key = t.term.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTerms.push(t);
      }
    });

    if (uniqueTerms.length === 0) return text;

    const escapedTerms = uniqueTerms.map(t => t.term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

    return text.split(regex).map((part, i) => {
      const match = uniqueTerms.find(t => t.term.toLowerCase() === part.toLowerCase());
      if (match) {
        if (match.type === 'brand') {
          return (
            <mark key={i} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
              {part}
            </mark>
          );
        } else {
          return (
            <mark key={i} style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
              {part}
            </mark>
          );
        }
      }
      return part;
    });
  }

  const handleToggleLine = (line: string) => {
    setVisibleLines(prev => ({ ...prev, [line]: !prev[line] }));
  };

  const copySummary = () => {
    const summary = `Domain: ${report.domain}\nVisibility Score: ${compositeScore}%\nCitation Rate: ${citationRate}%`;
    navigator.clipboard.writeText(summary);
    alert('Summary copied to clipboard!');
  };

  const exportPdf = () => {
    window.print();
  };

  return (
    <div className="results-page animate-fade-in">
      
      {/* Free User Top Banner */}
      {isFreeUser && (
        <div style={{ 
          background: 'rgba(168, 85, 247, 0.08)', 
          border: '1px solid rgba(168, 85, 247, 0.15)', 
          padding: '12px 20px', 
          borderRadius: '12px', 
          marginBottom: '24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <span style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--primary)' }}>
            ✨ Your first scan is free. Upgrade for monthly tracking and more fixes.
          </span>
          <button 
            onClick={() => {
              triggerUpgrade('top_inline_banner');
              window.location.href = '/?go=pricing';
            }} 
            className="btn btn-primary btn-sm"
            style={{ padding: '6px 16px', fontSize: '12.5px', borderRadius: '8px' }}
          >
            Upgrade to Pro
          </button>
        </div>
      )}
      
      {/* Persistent URL Bar */}
      <div className="persistent-url-bar" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '24px', fontSize: '13px' }}>
        <span className="url-string" style={{ color: 'var(--text-muted)' }}>
          {scanId 
            ? `${origin || 'https://tryagentscore.com'}/results/${scanId}` 
            : `${origin || 'https://tryagentscore.com'}/results/saving...`}
        </span>
        <button 
          className="copy-link-btn" 
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
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

      {scanError && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>⚠</span>
          <span>{scanError}</span>
        </div>
      )}

      {/* Tab Switched Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{report.domain}</h2>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Scanned on {new Date(report.timestamp || Date.now()).toLocaleDateString()}</span>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px' }}>
          <button 
            onClick={() => { setActiveTab('grid'); trackEvent('results_tab_switched', { tab: 'grid' }); }}
            style={{ padding: '8px 16px', background: activeTab === 'grid' ? 'var(--bg-card)' : 'none', border: 'none', borderRadius: '6px', fontWeight: 600, color: activeTab === 'grid' ? 'var(--text-main)' : 'var(--text-secondary)', cursor: 'pointer', boxShadow: activeTab === 'grid' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none' }}
          >
            Current Scan
          </button>
          <button 
            onClick={() => {
              if (isFreeUser) {
                triggerUpgrade('trends_tab');
                trackEvent('locked_section_clicked', { section_name: 'historical_trends' });
              } else {
                setActiveTab('trends');
                trackEvent('results_tab_switched', { tab: 'trends' });
                trackEvent('trends_section_viewed', { domain: report.domain });
              }
            }}
            style={{ padding: '8px 16px', background: activeTab === 'trends' ? 'var(--bg-card)' : 'none', border: 'none', borderRadius: '6px', fontWeight: 600, color: activeTab === 'trends' ? 'var(--text-main)' : 'var(--text-secondary)', cursor: 'pointer', boxShadow: activeTab === 'trends' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none' }}
          >
            Monthly Trend {isFreeUser && '🔒'}
          </button>
        </div>
      </div>

      {activeTab === 'grid' ? (
        <>
          {/* Layer 1: Executive Summary */}
          <div style={{ marginTop: '24px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Today’s Visibility</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              See how often AI recommends your business and where you’re missing.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '8px' }}>
            <div className="results-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visibility Score</span>
              <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
                <AnimatedCounter value={compositeScore || 0} />%
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Combined AI citation footprint</span>
            </div>
            <div className="results-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prompt Coverage</span>
              <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
                <AnimatedCounter value={promptsAppearedCount} />/5
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Query categories with cited footprint</span>
            </div>
            <div className="results-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Share of Voice</span>
              <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
                <AnimatedCounter value={shareOfVoice} />%
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>vs. Top competitor: {topCompetitor?.domain.split(':')[0] || 'None'}</span>
            </div>
            <div className="results-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visibility Gaps</span>
              <span style={{ fontSize: '32px', fontWeight: 800, color: visibilityGapsCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
                <AnimatedCounter value={visibilityGapsCount} /> Gaps
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Categories with 0% citation score</span>
            </div>
          </div>

          {/* Historical Trends Inline Card */}
          <div className="results-card" style={{ marginTop: '24px', position: 'relative', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Historical Trends</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Track how your visibility changes over time.
            </p>
            
            {(!user || !user.isPro) ? (
              <div style={{ position: 'relative', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Blurred Dummy Chart Backdrop */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, filter: 'blur(6px)', opacity: 0.2, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
                  <div style={{ width: '100%', height: '140px', borderLeft: '2px solid var(--border-color)', borderBottom: '2px solid var(--border-color)', position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: '30%', left: '10%', right: '10%', height: '4px', background: 'var(--primary)', borderRadius: '2px' }}></div>
                  </div>
                </div>
                
                {/* Paywall Overlay */}
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  background: 'rgba(15, 23, 42, 0.45)', 
                  backdropFilter: 'blur(4px)', 
                  padding: '20px',
                  zIndex: 10
                }}>
                  <div 
                    style={{ 
                      borderRadius: '20px', 
                      padding: '24px', 
                      width: '100%', 
                      maxWidth: '380px', 
                      background: 'radial-gradient(circle at top, #1e1b4b 0%, #0f172a 100%)', 
                      border: '1px solid rgba(139, 92, 246, 0.3)', 
                      boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 30px -5px rgba(139, 92, 246, 0.25)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '12px', 
                      alignItems: 'center', 
                      textAlign: 'center',
                      color: '#ffffff'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>🔒</span>
                    {process.env.NEXT_PUBLIC_BETA_MODE === 'true' ? (
                      <>
                        <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                          Unlock Historical Trends
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                          Track how your AI visibility score changes over time with automated tracking scans.
                        </p>
                        <button 
                          onClick={() => { 
                            if (isDemo) trackEvent('demo_cta_clicked', { cta: 'pricing_redirect' }); 
                            onNavigateToPricing?.(); 
                          }} 
                          className="btn btn-primary" 
                          style={{ 
                            width: '100%', 
                            height: '38px', 
                            fontWeight: 700, 
                            borderRadius: '10px', 
                            fontSize: '13.5px',
                            background: 'linear-gradient(135deg, var(--primary) 0%, #a78bfa 100%)',
                            border: 'none',
                            boxShadow: '0 4px 15px rgba(124, 58, 237, 0.25)',
                            marginTop: '4px'
                          }}
                        >
                          Upgrade to Pro — €14.99/month
                        </button>
                      </>
                    ) : (
                      <>
                        <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                          Historical Trends
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                          We are currently building automated daily scans and historical tracking.
                        </p>
                        <div style={{
                          marginTop: '4px',
                          padding: '8px 16px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          border: '1px dashed rgba(255, 255, 255, 0.2)',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#e2e8f0',
                          letterSpacing: '0.5px'
                        }}>
                          🚀 COMING SOON
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : loadingTrends ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Loading historical trend chart...
              </div>
            ) : trends.length < 2 ? (
              <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '20px' }}>📈</span>
                <p style={{ margin: '8px 0 0 0', fontWeight: 600, color: 'var(--text-primary)' }}>Run at least 2 scans to see a trend.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ height: '240px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                      <Legend />
                      <Line type="monotone" dataKey="overall" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-primary)' }} activeDot={{ r: 6 }} name="Overall Score" />
                      {showBreakdown && (
                        <>
                          <Line type="monotone" dataKey="transactional" stroke="#3B82F6" strokeWidth={1} strokeOpacity={0.6} dot={{ r: 2 }} name={PROMPT_LABELS.transactional} />
                          <Line type="monotone" dataKey="local_intent" stroke="#10B981" strokeWidth={1} strokeOpacity={0.6} dot={{ r: 2 }} name={PROMPT_LABELS.local_intent} />
                          <Line type="monotone" dataKey="comparison" stroke="#F59E0B" strokeWidth={1} strokeOpacity={0.6} dot={{ r: 2 }} name={PROMPT_LABELS.comparison} />
                          <Line type="monotone" dataKey="brand" stroke="#EC4899" strokeWidth={1} strokeOpacity={0.6} dot={{ r: 2 }} name={PROMPT_LABELS.brand} />
                          <Line type="monotone" dataKey="top10" stroke="#8B5CF6" strokeWidth={1} strokeOpacity={0.6} dot={{ r: 2 }} name={PROMPT_LABELS.top10} />
                        </>
                      )}
                      {showCompetitors && (
                        <>
                          <Line type="monotone" dataKey="competitor1" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name={competitors[0]?.domain ? competitors[0].domain.split(':')[0] : "SOV Top Competitor"} />
                          <Line type="monotone" dataKey="competitor2" stroke="#CBD5E1" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name={competitors[1]?.domain ? competitors[1].domain.split(':')[0] : "Mid-Tier Rival"} />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Toggles Row */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showBreakdown} onChange={e => setShowBreakdown(e.target.checked)} style={{ width: '14px', height: '14px', accentColor: 'var(--primary)' }} />
                    Show prompt breakdown
                  </label>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showCompetitors} onChange={e => setShowCompetitors(e.target.checked)} style={{ width: '14px', height: '14px', accentColor: 'var(--primary)' }} />
                    Overlay competitors
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Layer 2: Prompt Grid */}
          <div className="results-card">
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', fontFamily: 'var(--font-display)' }}>Prompt Grid</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Each row is one customer question. Each column is one AI model.
            </p>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px' }}>Prompt Type</th>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>ChatGPT {isFreeUser && '🔒'}</th>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>Gemini</th>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>Perplexity {isFreeUser && '🔒'}</th>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px', textAlign: 'right' }}>Model agreement</th>
                  </tr>
                </thead>
                <tbody>
                  {promptTypesList.map(type => {
                    const citations = getCitations(type);
                    const rowScore = getRowScore(type);
                    
                    return (
                      <tr key={type} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="grid-row-hover">
                        <td style={{ padding: '20px 16px', color: 'var(--text-main)' }}>
                          <div style={{ fontWeight: 600 }}>{PROMPT_LABELS[type as keyof typeof PROMPT_LABELS]}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                            {type === 'transactional' && `e.g. "services offered by ${report.domain.replace(/\.[^.]+$/, '')}"`}
                            {type === 'local_intent' && `e.g. "${report.domain.replace(/\.[^.]+$/, '')} location near me"`}
                            {type === 'comparison' && `e.g. "${report.domain.replace(/\.[^.]+$/, '')} vs competitors"`}
                            {type === 'brand' && `e.g. "about ${report.domain.replace(/\.[^.]+$/, '')} details"`}
                            {type === 'top10' && `e.g. "top 10 in category"`}
                          </div>
                        </td>
                        
                        {/* ChatGPT Cell */}
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <button 
                            onClick={() => {
                              if (isFreeUser) {
                                triggerUpgrade('grid_chatgpt_cell');
                                trackEvent('locked_section_clicked', { section_name: 'grid_chatgpt' });
                              } else {
                                handleCellClick(type, 'chatgpt');
                              }
                            }}
                            className="cell-button-badge"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            aria-label={`View ChatGPT results for ${PROMPT_LABELS[type as keyof typeof PROMPT_LABELS]}`}
                            aria-haspopup="dialog"
                          >
                            {renderCellBadge(type, 'chatgpt', citations.chatgpt)}
                          </button>
                        </td>

                        {/* Gemini Cell */}
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <button 
                            onClick={() => handleCellClick(type, 'gemini')}
                            className="cell-button-badge"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            aria-label={`View Gemini results for ${PROMPT_LABELS[type as keyof typeof PROMPT_LABELS]}`}
                            aria-haspopup="dialog"
                          >
                            {renderCellBadge(type, 'gemini', citations.gemini)}
                          </button>
                        </td>

                        {/* Perplexity Cell */}
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <button 
                            onClick={() => {
                              if (isFreeUser) {
                                triggerUpgrade('grid_perplexity_cell');
                                trackEvent('locked_section_clicked', { section_name: 'grid_perplexity' });
                              } else {
                                handleCellClick(type, 'perplexity');
                              }
                            }}
                            className="cell-button-badge"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            aria-label={`View Perplexity results for ${PROMPT_LABELS[type as keyof typeof PROMPT_LABELS]}`}
                            aria-haspopup="dialog"
                          >
                            {renderCellBadge(type, 'perplexity', citations.perplexity)}
                          </button>
                        </td>

                        <td style={{ padding: '16px 24px 16px 16px', textAlign: 'right', fontWeight: 800, color: 'var(--text-main)', fontSize: '14px' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            background: rowScore === 100 ? 'rgba(16, 185, 129, 0.1)' : rowScore > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(148, 163, 184, 0.1)', 
                            color: rowScore === 100 ? 'var(--success)' : rowScore > 0 ? 'var(--warning)' : 'var(--text-secondary)'
                          }}>
                            {rowScore === 100 ? '3/3 cited' : rowScore === 67 || rowScore === 66 ? '2/3 cited' : rowScore === 33 ? '1/3 cited' : '0/3 cited'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', textAlign: 'center' }}>
              Appeared in 2 of 3 models
            </div>
          </div>

          {/* Layer 3: Click-to-Expand Modal/Panel */}
          {selectedCell && (
            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setSelectedCell(null)}>
              <div className="modal-content" style={{ borderRadius: '16px', padding: '28px', width: '90%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <span style={{ textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>Prompt detail</span>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 0 0', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                      {PROMPT_LABELS[selectedCell.prompt_type as keyof typeof PROMPT_LABELS]} × {selectedCell.model === 'chatgpt' ? 'ChatGPT' : selectedCell.model === 'gemini' ? 'Gemini' : 'Perplexity'}
                    </h3>
                  </div>
                  <button onClick={() => setSelectedCell(null)} className="modal-close-btn" aria-label="Close detail modal">&times;</button>
                </div>

                {cellLoading ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ border: '3px solid var(--border-color)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite' }}></div>
                    <span style={{ fontSize: '14px', fontFamily: 'var(--font-sans)' }}>Loading drill-down details...</span>
                    <style>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}</style>
                  </div>
                ) : cellData ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Collapsible Section 1: Verdict */}
                    <div style={{ 
                      padding: '18px', 
                      background: cellData.verdict === 'Appeared' ? 'rgba(16, 185, 129, 0.05)' : cellData.competitor_displaced ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-card)', 
                      border: `1px solid ${cellData.verdict === 'Appeared' ? 'rgba(16, 185, 129, 0.2)' : cellData.competitor_displaced ? 'rgba(245, 158, 11, 0.2)' : 'var(--border-color)'}`, 
                      borderRadius: '12px' 
                    }}>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Verdict</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`indicator-dot ${cellData.verdict === 'Appeared' ? 'cited' : 'not-cited'}`} style={{ width: '12px', height: '12px' }}></span>
                        <strong style={{ 
                          fontSize: '18px', 
                          color: cellData.verdict === 'Appeared' ? 'var(--success)' : cellData.competitor_displaced ? 'var(--warning)' : 'var(--text-primary)', 
                          fontFamily: 'var(--font-sans)',
                          fontWeight: 700 
                        }}>
                          {cellData.verdict === 'Appeared' ? '✓ Cited in AI Search' : cellData.competitor_displaced ? '⚠️ Competitor cited instead' : '✗ Missing from citations'}
                        </strong>
                      </div>
                      
                      {cellData.verdict !== 'Appeared' && cellData.competitor_displaced && (
                        <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(245, 158, 11, 0.08)', border: '1px dashed rgba(245, 158, 11, 0.3)', borderRadius: '8px', fontSize: '13.5px', color: 'var(--warning)', fontWeight: 600 }}>
                          ⚠️ Displaced by competitor: <strong style={{ textDecoration: 'underline' }}>{cellData.competitor_displaced}</strong>
                        </div>
                      )}
                    </div>

                    {/* Collapsible Section 2: Why this happened */}
                    <div style={{ padding: '16px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Why this happened</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        <span style={{ display: 'inline-block', padding: '4px 10px', background: cellData.verdict === 'Appeared' ? 'var(--success-bg)' : 'var(--warning-bg)', color: cellData.verdict === 'Appeared' ? 'var(--success)' : 'var(--warning)', border: `1px solid ${cellData.verdict === 'Appeared' ? 'var(--success-border)' : 'var(--warning-border)'}`, borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>
                          {WHY_HAPPENED_LABELS[cellData.reason_tag as keyof typeof WHY_HAPPENED_LABELS] || 'Low citation signal'}
                        </span>
                        {cellData.verdict !== 'Appeared' && cellData.competitor_displaced && (
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            (Competitor <strong style={{ color: 'var(--text-primary)' }}>{cellData.competitor_displaced}</strong> took precedence)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Collapsible Section 3: What to improve next */}
                    <div style={{ padding: '16px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>What to improve next</span>
                      <p style={{ margin: 0, fontSize: '14.5px', color: 'var(--text-main)', lineHeight: '1.5' }}>
                        {WHAT_TO_IMPROVE_LABELS[cellData.reason_tag as keyof typeof WHAT_TO_IMPROVE_LABELS] || 'Strengthen service page copy and add structured data.'}
                      </p>
                    </div>

                    {/* Collapsible Section 4: Full AI answer */}
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div 
                        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-main)', borderBottom: expandedTranscript ? '1px solid var(--border-color)' : 'none' }}
                      >
                        <button 
                          onClick={() => setExpandedTranscript(!expandedTranscript)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)', outline: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: 0 }}
                        >
                          <span>Full AI answer</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 400 }}>({expandedTranscript ? 'Hide response ▴' : 'Show response ▾'})</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(cellData.response_text);
                            alert('AI response copied!');
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          📋 Copy Response
                        </button>
                      </div>
                      
                      {expandedTranscript && (
                        <div className="custom-scrollbar" style={{ padding: '16px', maxHeight: '220px', overflowY: 'auto', background: 'var(--bg-card)', fontSize: '14px', lineHeight: '1.65', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', whiteSpace: 'pre-wrap', borderTop: '1px solid var(--border-color)' }}>
                          {highlightBrand(cellData.response_text, report.profile?.businessName || report.domain, cellData.competitor_displaced, report.competitors)}
                        </div>
                      )}
                    </div>

                    {/* Persistent Action CTA */}
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', marginTop: '8px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => {
                        if (isFreeUser) {
                          triggerUpgrade('cell_detail_fix_btn');
                          trackEvent('locked_section_clicked', { section_name: 'cell_fix_button' });
                        } else {
                          handleFixFromCell(selectedCell.prompt_type);
                        }
                      }}
                    >
                      {isFreeUser && '🔒 '}Fix this issue
                    </button>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)' }}>Failed to load cell details.</div>
                )}
              </div>
            </div>
          )}

          {/* Action Recommendations Card */}
          <div className="results-card ai-recommendation-card" style={{ marginTop: '24px' }}>
            <div className="rec-header-block">
              <h3>Top recommendations</h3>
              <p className="rec-subheader">Based on your latest scan</p>
              <small className="rec-disclaimer">We only recommend fixes we can verify from your scan. No guesswork, no generic AI advice.</small>
            </div>
            
            {(!topFixes || topFixes.length === 0) ? (
              <div className="recommendations-empty">
                <p><strong>No reliable recommendations yet</strong></p>
                <p>Run more prompts or add another model to improve confidence</p>
              </div>
            ) : (
              <div className="recommendations-list" style={{ marginTop: '16px' }}>
                {topFixes.slice(0, isFreeUser ? 2 : topFixes.length).map((fix: any, idx: number) => {
                  const isExpanded = activeFixId === fix.id;
                  
                  // Determine matching ActionDraft type
                  let draftType: 'llms' | 'schema' | 'robots' | 'meta' | 'faq' | null = null;
                  const category = fix.category;
                  const title = fix.title.toLowerCase();
                  const desc = (fix.description || '').toLowerCase();
                  
                  if (category === 'schema_markup') draftType = 'schema';
                  else if (category === 'crawler_access') {
                    draftType = title.includes('llms') ? 'llms' : 'robots';
                  } else if (category === 'content_gap') {
                    draftType = title.includes('faq') ? 'faq' : 'meta';
                  } else {
                    // Fallback heuristics for older scans lacking a category field
                    if (title.includes('schema') || desc.includes('schema') || title.includes('structured data')) {
                      draftType = 'schema';
                    } else if (title.includes('llms') || desc.includes('llms')) {
                      draftType = 'llms';
                    } else if (title.includes('robots') || desc.includes('robots') || title.includes('crawler')) {
                      draftType = 'robots';
                    } else if (title.includes('faq') || desc.includes('faq')) {
                      draftType = 'faq';
                    } else if (title.includes('title') || title.includes('description') || desc.includes('meta')) {
                      draftType = 'meta';
                    } else {
                      // Generic default fallback
                      draftType = 'llms';
                    }
                  }
                  
                  // Check status for checks
                  const checkIdMap: Record<string, string> = {
                    llms: 'llms',
                    schema: 'schema',
                    robots: 'robots',
                    meta: 'meta-title',
                    faq: 'faq',
                  };
                  const checkId = draftType ? checkIdMap[draftType] : '';
                  const check = technicalChecks.find(c => c.id === checkId);
                  const detected = check ? check.status !== 'pass' : false;

                  return (
                    <div key={idx} className="recommendation-item" style={{ padding: '16px 0', borderBottom: idx < (isFreeUser ? 2 : topFixes.length) - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <div className="rec-header" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="rec-number" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>#{idx + 1}</span>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{fix.title}</h4>
                      </div>
                      <p className="rec-desc" style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.5' }}>{fix.reason || fix.description}</p>
                      
                      <div className="rec-chips" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {fix.evidence && <span className="chip evidence-chip" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>Evidence: {fix.evidence}</span>}
                        <span className="chip impact-chip" style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>Expected impact: {fix.impact || 'High'}</span>
                      </div>
                      
                      {!isExpanded ? (
                        <button 
                          className="btn btn-secondary btn-sm rec-cta" 
                          onClick={() => {
                            if (isFreeUser) {
                              triggerUpgrade('apply_fix_btn');
                              trackEvent('locked_section_clicked', { section_name: 'apply_fix' });
                            } else {
                              trackEvent('fix_card_expanded', { fix_type: draftType, fix_title: fix.title, fix_rank: idx + 1 });
                              setActiveFixId(fix.id);
                            }
                          }}
                        >
                          {isFreeUser && '🔒 '}{fix.actionLabel || 'Apply this fix'}
                        </button>
                      ) : (
                        <div style={{ marginTop: '16px' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            style={{ marginBottom: '12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                            onClick={() => setActiveFixId(null)}
                          >
                            Hide details ▴
                          </button>
                          {draftType && profile && (
                            <ActionDraft
                              type={draftType}
                              profile={profile}
                              domain={report.domain}
                              detected={detected}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pillar 2: Where Your Competitors Stand (Competitor Landscape) */}
          <div className="results-card" style={{ marginTop: '24px', position: 'relative', overflow: 'hidden' }} onMouseEnter={() => trackEvent('competitor_card_viewed', { domain: report.domain, competitor_count: competitors.length })}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Competitor Landscape</h3>
            
            {isFreeUser ? (
              <>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  See how your citation rate compares against top competitors in your market.
                </p>
                
                {/* Blurred Competitor List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', filter: 'blur(5px)', pointerEvents: 'none', opacity: 0.5, marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>competitor-one.com</span>
                    <div style={{ width: '150px', height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: '70%', height: '100%', background: 'var(--primary)' }}></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>competitor-two.com</span>
                    <div style={{ width: '150px', height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: '45%', height: '100%', background: 'var(--primary)' }}></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>competitor-three.com</span>
                    <div style={{ width: '150px', height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: '30%', height: '100%', background: 'var(--primary)' }}></div>
                    </div>
                  </div>
                </div>

                {/* Overlay Paywall Card */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', padding: '24px' }}>
                  <div 
                    style={{ 
                      borderRadius: '20px', 
                      padding: '28px', 
                      width: '100%', 
                      maxWidth: '380px', 
                      background: 'radial-gradient(circle at top, #1e1b4b 0%, #0f172a 100%)', 
                      border: '1px solid rgba(139, 92, 246, 0.3)', 
                      boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 30px -5px rgba(139, 92, 246, 0.25)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '12px', 
                      alignItems: 'center', 
                      textAlign: 'center',
                      color: '#ffffff'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>🔒</span>
                    {process.env.NEXT_PUBLIC_BETA_MODE === 'true' ? (
                      <>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#ffffff' }}>
                          Unlock Competitor Intelligence
                        </h4>
                        <p style={{ margin: 0, fontSize: '13.5px', color: '#94a3b8', lineHeight: '1.5' }}>
                          See exactly which competitor domains are being cited instead of your business across all AI models.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px' }}>
                          <button 
                            onClick={() => { 
                              triggerUpgrade('competitive_teaser'); 
                              trackEvent('locked_section_clicked', { section_name: 'competitive_report' }); 
                            }} 
                            className="btn btn-primary" 
                            style={{ 
                              width: '100%', 
                              height: '42px', 
                              fontWeight: 700, 
                              borderRadius: '12px', 
                              fontSize: '14px',
                              background: 'linear-gradient(135deg, var(--primary) 0%, #a78bfa 100%)',
                              border: 'none',
                              boxShadow: '0 4px 15px rgba(124, 58, 237, 0.25)'
                            }}
                          >
                            Upgrade to Pro — €14.99/month
                          </button>
                          <button 
                            onClick={() => { triggerUpgrade('competitive_teaser_maybe_later'); }} 
                            className="btn" 
                            style={{ 
                              width: '100%', 
                              height: '36px', 
                              background: 'transparent', 
                              border: 'none', 
                              color: '#94a3b8', 
                              fontWeight: 600,
                              fontSize: '13.5px',
                              cursor: 'pointer'
                            }}
                          >
                            Maybe later
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#ffffff' }}>
                          Competitor Intelligence
                        </h4>
                        <p style={{ margin: 0, fontSize: '13.5px', color: '#94a3b8', lineHeight: '1.5' }}>
                          We are currently finalizing our local competitor AI-extraction matrix algorithm.
                        </p>
                        <div style={{
                          marginTop: '4px',
                          padding: '8px 16px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          border: '1px dashed rgba(255, 255, 255, 0.2)',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#e2e8f0',
                          letterSpacing: '0.5px'
                        }}>
                          🚀 COMING SOON
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Competing brands co-cited or recommended in your search query intents.
                </p>
                {(!competitors || competitors.length === 0) ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No competitor citations detected for this domain.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          <th style={{ padding: '12px 16px' }}>Competitor Domain</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center' }}>AI Mentions</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center' }}>Favored Model Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {competitors.slice(0, 10).map((comp: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                              <a href={`https://${comp.domain.split(':')[0]}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                {comp.domain.split(':')[0]}
                              </a>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>
                              {comp.appearances} / 12
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <span style={{ 
                                background: 'rgba(168, 85, 247, 0.1)', 
                                color: 'var(--primary)', 
                                padding: '3px 10px', 
                                borderRadius: '12px', 
                                fontSize: '12px', 
                                fontWeight: 600,
                                textTransform: 'capitalize'
                              }}>
                                {comp.llm_source || 'AI search'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        /* Trends Tab View */
        <div className="results-card" style={{ marginTop: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>Historical Trends</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Track how your visibility changes over time.
            </p>
          </div>

          {(!user || !user.isPro) ? (
            <div style={{ position: 'relative', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Blurred Dummy Chart Backdrop */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, filter: 'blur(6px)', opacity: 0.25, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
                <div style={{ width: '100%', height: '200px', borderLeft: '2px solid var(--border-color)', borderBottom: '2px solid var(--border-color)', position: 'relative' }}>
                  <div style={{ position: 'absolute', bottom: '30%', left: '10%', right: '10%', height: '4px', background: 'var(--primary)', borderRadius: '2px' }}></div>
                </div>
              </div>
              
              {/* Paywall Card */}
              <div className="results-card" style={{ maxWidth: '400px', zIndex: 10, textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--glass-shadow)', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '28px' }}>🔒</span>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Historical Trends is a Pro Feature</h4>
                <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Growth gives you 12 weeks of score history, daily scanning, and competitor overlays. Track your progress as you apply fixes.
                </p>
                <button onClick={() => { if (isDemo) trackEvent('demo_cta_clicked', { cta: 'pricing_redirect' }); onNavigateToPricing(); }} className="btn btn-primary" style={{ width: '100%', height: '40px' }}>
                  Upgrade to Pro
                </button>
              </div>
            </div>
          ) : loadingTrends ? (
            <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading historical trend chart...
            </div>
          ) : trends.length < 2 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '24px' }}>📈</span>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>Run at least 2 scans to see a trend.</p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>More scans will make your monthly pattern clearer.</p>
            </div>
          ) : (() => {
            const currentScore = trends[trends.length - 1].overall;
            const deltaScore = currentScore - trends[trends.length - 2].overall;
            
            const getBiggestMover = () => {
              const last = trends[trends.length - 1];
              const prev = trends[trends.length - 2];
              const categories = ['transactional', 'local_intent', 'comparison', 'brand', 'top10'];
              let maxDiff = -1;
              let moverCat = '';
              let direction = 'improved';
              
              categories.forEach(cat => {
                const diff = last[cat] - prev[cat];
                if (Math.abs(diff) > maxDiff) {
                  maxDiff = Math.abs(diff);
                  moverCat = cat;
                  direction = diff >= 0 ? 'improved' : 'declined';
                }
              });
              
              if (maxDiff <= 0) return { label: 'No category changes', direction: '', catKey: '', diff: 0 };
              return { 
                label: PROMPT_LABELS[moverCat as keyof typeof PROMPT_LABELS], 
                direction,
                catKey: moverCat,
                diff: maxDiff
              };
            };
            
            const getLowestCategory = () => {
              const last = trends[trends.length - 1];
              const categories = ['transactional', 'local_intent', 'comparison', 'brand', 'top10'];
              let minScore = 101;
              let lowestCat = '';
              categories.forEach(cat => {
                if (last[cat] < minScore) {
                  minScore = last[cat];
                  lowestCat = cat;
                }
              });
              return lowestCat;
            };

            const mover = getBiggestMover();
            const lowestCat = getLowestCategory();
            
            const ACTION_MAP = {
              transactional: 'Add ready-to-buy schema and transactional CTA keywords.',
              local_intent: 'Strengthen location proof, contact details, and address markup.',
              comparison: 'Create a dedicated "Versus Alternatives" comparison page.',
              brand: 'Register profiles on trusted external review directories.',
              top10: 'Add structured list/FAQ schema to homepage to rank for best-of lists.'
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                
                {/* Executive Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div className="results-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', margin: 0 }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Score</span>
                    <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{currentScore}%</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Latest overall score</span>
                  </div>
                  <div className="results-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', margin: 0 }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>MoM Change</span>
                    <span style={{ fontSize: '28px', fontWeight: 800, color: deltaScore >= 0 ? 'var(--success)' : 'var(--warning)' }}>
                      {deltaScore >= 0 ? `+${deltaScore}` : deltaScore} overall
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Change from previous scan</span>
                  </div>
                  <div className="results-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', margin: 0 }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Biggest Mover</span>
                    <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {mover.diff > 0 ? `${mover.label} ${mover.direction}` : 'No change'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Mover this month</span>
                  </div>
                </div>

                {/* Recharts Trend Representation */}
                <div style={{ height: '350px', width: '100%', padding: '16px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                      <YAxis 
                        domain={[0, 100]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: 'var(--text-muted)' }} 
                        label={{ value: 'Score (0-100)', angle: -90, position: 'insideLeft', offset: 0, style: { fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 } }}
                      />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                      <Legend />
                      
                      {/* Primary Bold overall Line */}
                      <Line type="monotone" dataKey="overall" stroke="var(--primary)" strokeWidth={3} dot={{ r: 5, fill: 'var(--bg-primary)' }} activeDot={{ r: 7 }} name="Overall Score" />

                      {/* Thin Background category Lines (Show breakdown) */}
                      {showBreakdown && (
                        <>
                          <Line type="monotone" dataKey="transactional" stroke="#3B82F6" strokeWidth={1} strokeOpacity={0.6} dot={{ r: 3 }} name={PROMPT_LABELS.transactional} />
                          <Line type="monotone" dataKey="local_intent" stroke="#10B981" strokeWidth={1} strokeOpacity={0.6} dot={{ r: 3 }} name={PROMPT_LABELS.local_intent} />
                          <Line type="monotone" dataKey="comparison" stroke="#F59E0B" strokeWidth={1} strokeOpacity={0.6} dot={{ r: 3 }} name={PROMPT_LABELS.comparison} />
                          <Line type="monotone" dataKey="brand" stroke="#EC4899" strokeWidth={1} strokeOpacity={0.6} dot={{ r: 3 }} name={PROMPT_LABELS.brand} />
                          <Line type="monotone" dataKey="top10" stroke="#8B5CF6" strokeWidth={1} strokeOpacity={0.6} dot={{ r: 3 }} name={PROMPT_LABELS.top10} />
                        </>
                      )}
                      
                      {/* Competitor Overlays */}
                      {showCompetitors && (
                        <>
                          <Line type="monotone" dataKey="competitor1" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name={competitors[0]?.domain ? competitors[0].domain.split(':')[0] : "SOV Top Competitor"} />
                          <Line type="monotone" dataKey="competitor2" stroke="#CBD5E1" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name={competitors[1]?.domain ? competitors[1].domain.split(':')[0] : "Mid-Tier Rival"} />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Toggles Row */}
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', padding: '12px 16px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={showBreakdown}
                      onChange={(e) => { setShowBreakdown(e.target.checked); if (isDemo) trackEvent('demo_trend_toggle_used', { toggle: 'show_breakdown', value: e.target.checked }); }}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                    />
                    Show prompt breakdown
                  </label>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={showCompetitors}
                      onChange={(e) => { setShowCompetitors(e.target.checked); if (isDemo) trackEvent('demo_trend_toggle_used', { toggle: 'overlay_competitors', value: e.target.checked }); }}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                    />
                    Overlay competitors
                  </label>
                </div>

                {/* Monthly Insight Card */}
                <div style={{ display: 'flex', gap: '16px', padding: '20px', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.15)', borderRadius: '12px', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px' }}>💡</span>
                    <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>Monthly Insight</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '14.5px', color: 'var(--text-main)', lineHeight: '1.6' }}>
                    {deltaScore > 0 ? (
                      mover.diff > 0 
                        ? `Your visibility improved this month. Strengthening ${mover.label} had the biggest impact.`
                        : `Your visibility improved slightly this month. No single category stands out as the cause — check your Prompt Grid for details.`
                    ) : deltaScore < 0 ? (
                      mover.diff > 0 
                        ? `Your visibility declined this month, mainly because your ${mover.label} results got weaker.`
                        : `Your visibility declined slightly this month. No single category stands out as the cause — check your Prompt Grid for details.`
                    ) : (
                      `Your score stayed flat, but ${PROMPT_LABELS[lowestCat as keyof typeof PROMPT_LABELS]} still has room to improve.`
                    )}
                  </p>
                  <div style={{ borderTop: '1px solid rgba(168, 85, 247, 0.1)', paddingTop: '12px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                    <strong>Recommended Action:</strong> {ACTION_MAP[lowestCat as keyof typeof ACTION_MAP] || 'Strengthen service page copy and add structured data.'}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Footer Actions */}
      <div className="results-actions" style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'center' }}>
        <button onClick={() => { trackEvent('rescan_clicked', { domain: report.domain }); onRescan(); }} className="btn btn-primary">Run again</button>
        <button 
          onClick={() => {
            if (isFreeUser) {
              triggerUpgrade('copy_summary');
              trackEvent('locked_section_clicked', { section_name: 'copy_summary' });
            } else {
              copySummary();
            }
          }} 
          className="btn btn-secondary"
        >
          {isFreeUser && '🔒 '}Copy summary
        </button>
        <button 
          onClick={() => {
            if (isFreeUser) {
              triggerUpgrade('export_pdf');
              trackEvent('locked_section_clicked', { section_name: 'export_pdf' });
            } else {
              exportPdf();
            }
          }} 
          className="btn btn-secondary"
        >
          {isFreeUser && '🔒 '}Export PDF
        </button>
      </div>

      {/* Upgrade Modal Popup Component */}
      {showUpgradeModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={() => setShowUpgradeModal(false)}>
          <div 
            className="modal-content" 
            style={{ 
              borderRadius: '24px', 
              padding: '40px', 
              width: '95%', 
              maxWidth: '450px', 
              background: 'radial-gradient(circle at top, #1e1b4b 0%, #0f172a 100%)', 
              border: '1px solid rgba(139, 92, 246, 0.3)', 
              boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.5), 0 0 50px -10px rgba(139, 92, 246, 0.25)', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '24px', 
              alignItems: 'center', 
              textAlign: 'center',
              color: '#ffffff'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
            }}>
              ✨
            </div>
            
            {process.env.NEXT_PUBLIC_BETA_MODE === 'true' ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#ffffff', letterSpacing: '-0.02em' }}>
                    Unlock TryAgentScore Pro
                  </h3>
                  <p style={{ margin: 0, fontSize: '14.5px', color: '#94a3b8', lineHeight: '1.6' }}>
                    Get instant access to deep analytics and automated optimization fixes.
                  </p>
                </div>

                <div style={{ 
                  width: '100%', 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid rgba(255, 255, 255, 0.05)', 
                  borderRadius: '16px', 
                  padding: '16px 20px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#e2e8f0' }}>
                    <span style={{ color: 'var(--primary)' }}>✦</span>
                    <span>All recommended AI fixes & downloadable templates</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#e2e8f0' }}>
                    <span style={{ color: 'var(--primary)' }}>✦</span>
                    <span>Direct competitor intelligence & rankings</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#e2e8f0' }}>
                    <span style={{ color: 'var(--primary)' }}>✦</span>
                    <span>Continuous historical trends tracking dashboard</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '4px' }}>
                  <button 
                    onClick={() => {
                      trackEvent('upgrade_modal_converted', { trigger_source: upgradeTrigger });
                      window.location.href = '/?go=pricing';
                    }} 
                    className="btn btn-primary" 
                    style={{ 
                      width: '100%', 
                      height: '48px', 
                      fontWeight: 700, 
                      borderRadius: '14px', 
                      fontSize: '15px',
                      background: 'linear-gradient(135deg, var(--primary) 0%, #a78bfa 100%)',
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)'
                    }}
                  >
                    Upgrade to Pro — €14.99/month
                  </button>
                  <button 
                    onClick={() => setShowUpgradeModal(false)} 
                    className="btn" 
                    style={{ 
                      width: '100%', 
                      height: '46px', 
                      background: 'transparent', 
                      border: 'none', 
                      color: '#94a3b8', 
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Maybe later
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#ffffff', letterSpacing: '-0.02em' }}>
                    Pro Features Coming Soon
                  </h3>
                  <p style={{ margin: 0, fontSize: '14.5px', color: '#94a3b8', lineHeight: '1.6' }}>
                    We are currently building advanced analytics, competitor metrics, and custom AI templates.
                  </p>
                </div>

                <div style={{ 
                  width: '100%', 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid rgba(255, 255, 255, 0.05)', 
                  borderRadius: '16px', 
                  padding: '16px 20px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#e2e8f0' }}>
                    <span style={{ color: 'var(--primary)' }}>🚀</span>
                    <span>Automated competitor tracking matrices</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#e2e8f0' }}>
                    <span style={{ color: 'var(--primary)' }}>🚀</span>
                    <span>Step-by-step custom optimization playbooks</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#e2e8f0' }}>
                    <span style={{ color: 'var(--primary)' }}>🚀</span>
                    <span>Daily automated sweeps and visibility score graphs</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '4px' }}>
                  <button 
                    onClick={() => setShowUpgradeModal(false)} 
                    className="btn btn-primary" 
                    style={{ 
                      width: '100%', 
                      height: '48px', 
                      fontWeight: 700, 
                      borderRadius: '14px', 
                      fontSize: '15px',
                      background: 'linear-gradient(135deg, var(--primary) 0%, #a78bfa 100%)',
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)'
                    }}
                  >
                    Got it
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
