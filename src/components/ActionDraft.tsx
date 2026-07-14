'use client';
import { useState } from 'react';
import './ActionDraft.css';

export type DraftType = 'llms' | 'schema' | 'robots' | 'meta' | 'faq';
type DraftStatus = 'idle' | 'loading' | 'ready' | 'done';

export interface BusinessProfile {
  businessName: string;
  primaryCategory: string;
  topServices: string[];
  location: string;
  queryLanguage: string;
  businessMode?: string;
  areaScope?: string;
}

interface ActionDraftProps {
  type: DraftType;
  profile: BusinessProfile;
  domain: string;
  detected?: boolean;
}

/* ─── Card metadata ─── */
const CARD_META: Record<DraftType, {
  icon: string;
  title: string;
  benefit: string;
  effort: string;
  generateLabel: string;
  downloadExt?: string;
}> = {
  llms: {
    icon: '📄',
    title: 'llms.txt file',
    benefit: 'Experimental / Low-risk. Tells AI tools exactly what your business does.',
    effort: '10 min · Unproven impact',
    generateLabel: 'Generate file',
    downloadExt: 'txt',
  },
  schema: {
    icon: '🏷️',
    title: 'Schema markup (JSON-LD)',
    benefit: 'Evidence-backed. Gives AI tools structured facts about your business type, location, and services.',
    effort: '20 min · Proven to lift citations',
    generateLabel: 'Generate schema',
  },
  robots: {
    icon: '🤖',
    title: 'AI crawler access (robots.txt)',
    benefit: 'Confirms AI bots like GPTBot and ClaudeBot can safely read your site.',
    effort: '5 min · High importance',
    generateLabel: 'Show fix snippet',
  },
  meta: {
    icon: '✏️',
    title: 'Page title & description',
    benefit: 'Location-specific titles help AI tools map your page to local searches.',
    effort: '15 min · Baseline SEO',
    generateLabel: 'Generate suggestions',
  },
  faq: {
    icon: '💬',
    title: 'FAQ content & schema',
    benefit: 'Q&A format is one of the most frequently cited content types in AI search.',
    effort: '30 min · High visibility',
    generateLabel: 'Generate FAQ draft',
  },
};

/* ─── Template generators (client-side, instant) ─── */
function buildLlms(profile: BusinessProfile, domain: string): string {
  const { businessName, primaryCategory, topServices, location } = profile;
  const services = topServices.length > 0
    ? topServices.map(s => `- ${s}`).join('\n')
    : `- ${primaryCategory}`;
  return `# ${businessName}
> ${primaryCategory} in ${location}.

## What we do
${services}

## Location
${location}

## Website
https://${domain}

## Contact
https://${domain}/contact`;
}

function buildSchema(profile: BusinessProfile, domain: string): string {
  const { businessName, primaryCategory, topServices, location } = profile;
  const cat = primaryCategory.toLowerCase();
  const TYPE_MAP: Record<string, string> = {
    dentist: 'Dentist', dental: 'Dentist', zahnarzt: 'Dentist',
    'law firm': 'LegalService', lawyer: 'LegalService', attorney: 'LegalService', rechtsanwalt: 'LegalService',
    doctor: 'Physician', physician: 'Physician', arzt: 'Physician',
    restaurant: 'Restaurant', café: 'CafeOrCoffeeShop', cafe: 'CafeOrCoffeeShop',
    hotel: 'Hotel', gym: 'ExerciseGym', fitness: 'ExerciseGym',
    salon: 'HairSalon', physiotherapist: 'Physiotherapy', physiotherapy: 'Physiotherapy',
  };
  const schemaType = Object.entries(TYPE_MAP).find(([k]) => cat.includes(k))?.[1] ?? 'LocalBusiness';
  const schema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: businessName,
    description: `${primaryCategory} in ${location}`,
    url: `https://${domain}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: location,
    },
    ...(topServices.length > 0 && {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Services',
        itemListElement: topServices.map((s, i) => ({
          '@type': 'Offer',
          position: i + 1,
          itemOffered: { '@type': 'Service', name: s },
        })),
      },
    }),
  };
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

function buildRobots(): string {
  return `# Allow AI crawlers to read your site
# Add these lines to your existing robots.txt file

User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

# If you have a sitemap, add it too:
# Sitemap: https://yourdomain.com/sitemap.xml`;
}

function buildFaqJsonLd(faqs: Array<{ question: string; answer: string }>): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
  return JSON.stringify(schema, null, 2);
}

/* ─── Main component ─── */
export default function ActionDraft({ type, profile, domain, detected }: ActionDraftProps) {
  const [status, setStatus] = useState<DraftStatus>('idle');
  const [draftText, setDraftText] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([]);
  const [copied, setCopied] = useState<string | null>(null); // which field was copied
  const [error, setError] = useState<string | null>(null);
  
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ verified: boolean; message: string } | null>(null);

  const meta = CARD_META[type];

  function trackEvent(eventType: string, eventData: any) {
    if (process.env.NEXT_PUBLIC_ENABLE_FEATURES === 'true') {
      console.log(`[Analytics] ${eventType}`, eventData);
    }
    fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType, event_data: eventData })
    }).catch(() => {});
  }

  async function verifyFix() {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await fetch('/api/verify-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, fixType: type }),
      });
      if (res.ok) {
        const data = await res.json();
        setVerificationResult({ verified: data.verified, message: data.message });
        trackEvent('fix_verified', { fix_type: type, domain, verified: data.verified });
        // Don't auto-collapse — let the user see the result and manually mark as done
      } else {
        setVerificationResult({ verified: false, message: 'Verification error. Please try again.' });
        trackEvent('fix_verified', { fix_type: type, domain, verified: false, error: 'api_error' });
      }
    } catch (e) {
      setVerificationResult({ verified: false, message: 'Failed to connect to verification service.' });
      trackEvent('fix_verified', { fix_type: type, domain, verified: false, error: 'network_error' });
    } finally {
      setVerifying(false);
    }
  }

  async function generate() {
    trackEvent('fix_draft_generated', { fix_type: type, domain });
    setStatus('loading');
    setError(null);
    try {
      if (type === 'llms') {
        setDraftText(buildLlms(profile, domain));
        setStatus('ready');
      } else if (type === 'schema') {
        setDraftText(buildSchema(profile, domain));
        setStatus('ready');
      } else if (type === 'robots') {
        setDraftText(buildRobots());
        setStatus('ready');
      } else if (type === 'meta') {
        const res = await fetch('/api/generate-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actionType: 'meta', profile: { ...profile, domain } }),
        });
        const data = await res.json();
        setMetaTitle(data.title || '');
        setMetaDesc(data.description || '');
        setStatus('ready');
      } else if (type === 'faq') {
        const res = await fetch('/api/generate-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actionType: 'faq', profile: { ...profile, domain } }),
        });
        const data = await res.json();
        setFaqs(data.faqs || []);
        setDraftText(buildFaqJsonLd(data.faqs || []));
        setStatus('ready');
      }
    } catch (e) {
      setError('Generation failed. Please try again.');
      setStatus('idle');
    }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
      trackEvent('fix_draft_copied', { fix_type: type, domain, copy_key: key });
    });
  }

  function downloadFile(text: string, filename: string) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div id={`action-draft-${type}`} className={`draft-card ${detected ? 'draft-card--detected' : ''} ${status === 'done' ? 'draft-card--done' : ''}`}>
      {/* Card header */}
      <div className="draft-card-header">
        <div className="draft-card-header-left">
          <span className="draft-card-icon">{meta.icon}</span>
          <div className="draft-card-titles">
            <span className="draft-card-title">{meta.title}</span>
            <span className="draft-card-effort">{meta.effort}</span>
          </div>
        </div>
        {detected && status !== 'done' && (
          <span className="draft-detected-badge">Issue detected</span>
        )}
        {status === 'done' && (
          <span className="draft-done-badge">✓ Ready to implement</span>
        )}
      </div>

      {/* Body when idle or loading */}
      {(status === 'idle' || status === 'loading') && (
        <div className="draft-card-body">
          <p className="draft-card-benefit">{meta.benefit}</p>
          {error && <p className="draft-error">{error}</p>}
          <button
            className="draft-generate-btn"
            onClick={generate}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? (
              <><span className="draft-spinner" />Generating…</>
            ) : (
              <>{meta.generateLabel} →</>
            )}
          </button>
        </div>
      )}

      {/* Body when ready — meta type (two separate fields) */}
      {status === 'ready' && type === 'meta' && (
        <div className="draft-card-body">
          <div className="draft-meta-field">
            <div className="draft-meta-label-row">
              <label className="draft-meta-label">Page Title</label>
              <span className={`draft-char-count ${metaTitle.length > 60 ? 'over' : ''}`}>{metaTitle.length}/60</span>
            </div>
            <textarea
              className="draft-textarea"
              value={metaTitle}
              onChange={e => setMetaTitle(e.target.value)}
              rows={2}
            />
            <button className="draft-copy-btn" onClick={() => copyText(metaTitle, 'title')}>
              {copied === 'title' ? '✓ Copied!' : '📋 Copy title'}
            </button>
          </div>
          <div className="draft-meta-field" style={{ marginTop: '12px' }}>
            <div className="draft-meta-label-row">
              <label className="draft-meta-label">Meta Description</label>
              <span className={`draft-char-count ${metaDesc.length > 155 ? 'over' : ''}`}>{metaDesc.length}/155</span>
            </div>
            <textarea
              className="draft-textarea"
              value={metaDesc}
              onChange={e => setMetaDesc(e.target.value)}
              rows={3}
            />
            <button className="draft-copy-btn" onClick={() => copyText(metaDesc, 'desc')}>
              {copied === 'desc' ? '✓ Copied!' : '📋 Copy description'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button className="draft-done-btn" onClick={() => { trackEvent('fix_marked_done', { fix_type: type, domain }); setStatus('done'); }} style={{ flex: 1 }}>Mark as done ✓</button>
          </div>
        </div>
      )}

      {/* Body when ready — faq type (Q&A list + JSON-LD) */}
      {status === 'ready' && type === 'faq' && (
        <div className="draft-card-body">
          <div className="draft-faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className="draft-faq-item">
                <div className="draft-faq-q">
                  <span className="draft-faq-label">Q</span>
                  <textarea
                    className="draft-textarea draft-textarea--inline"
                    value={faq.question}
                    onChange={e => {
                      const updated = [...faqs];
                      updated[i] = { ...updated[i], question: e.target.value };
                      setFaqs(updated);
                    }}
                    rows={2}
                  />
                </div>
                <div className="draft-faq-a">
                  <span className="draft-faq-label draft-faq-label--a">A</span>
                  <textarea
                    className="draft-textarea draft-textarea--inline"
                    value={faq.answer}
                    onChange={e => {
                      const updated = [...faqs];
                      updated[i] = { ...updated[i], answer: e.target.value };
                      setFaqs(updated);
                    }}
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="draft-action-row">
            <button className="draft-copy-btn" onClick={() => {
              const jsonLd = buildFaqJsonLd(faqs);
              setDraftText(jsonLd);
              copyText(jsonLd, 'faq-schema');
            }}>
              {copied === 'faq-schema' ? '✓ Copied!' : '📋 Copy as JSON-LD schema'}
            </button>
            <button className="draft-copy-btn" onClick={() => {
              const text = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
              copyText(text, 'faq-text');
            }}>
              {copied === 'faq-text' ? '✓ Copied!' : '📋 Copy as plain text'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button className="draft-done-btn" onClick={() => { trackEvent('fix_marked_done', { fix_type: type, domain }); setStatus('done'); }} style={{ flex: 1 }}>Mark as done ✓</button>
          </div>
        </div>
      )}

      {/* Body when ready — all other types (single textarea) */}
      {status === 'ready' && type !== 'meta' && type !== 'faq' && (
        <div className="draft-card-body">
          <textarea
            className="draft-textarea"
            value={draftText}
            onChange={e => setDraftText(e.target.value)}
            rows={type === 'schema' ? 24 : type === 'robots' ? 14 : 12}
          />
          <div className="draft-action-row">
            <button className="draft-copy-btn" onClick={() => copyText(draftText, 'main')}>
              {copied === 'main' ? '✓ Copied!' : '📋 Copy text'}
            </button>
            {meta.downloadExt && (
              <button className="draft-copy-btn" onClick={() => downloadFile(draftText, `llms.${meta.downloadExt}`)}>
                ⬇ Download file
              </button>
            )}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="draft-done-btn" 
                onClick={verifyFix} 
                disabled={verifying}
                style={{ flex: 1, backgroundColor: 'var(--primary)', color: 'white' }}
              >
                {verifying ? 'Verifying live fix...' : 'Verify Live Fix 🔍'}
              </button>
              <button className="draft-done-btn" onClick={() => { trackEvent('fix_marked_done', { fix_type: type, domain }); setStatus('done'); }} style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                Mark as done ✓
              </button>
            </div>
            {verificationResult && (
              <div 
                className={verificationResult.verified ? "highlight-pulse" : ""}
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  background: verificationResult.verified ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  border: `2px solid ${verificationResult.verified ? 'var(--success)' : 'var(--warning)'}`,
                  color: verificationResult.verified ? 'var(--success)' : 'var(--warning)',
                  boxShadow: verificationResult.verified ? '0 10px 20px -10px rgba(16, 185, 129, 0.3)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: verificationResult.verified ? '6px' : '0' }}>
                  <span>{verificationResult.verified ? '🎉 CONGRATULATIONS!' : '⚠️ VERIFICATION WARNING'}</span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
                  {verificationResult.message}
                </p>
                {verificationResult.verified && (
                  <>
                    <p style={{ margin: '6px 0 0 0', fontSize: '12px', opacity: 0.8, fontStyle: 'italic' }}>
                      Fix confirmed live on domain! Run a new scan to update your footprint.
                    </p>
                    <button
                      onClick={() => { trackEvent('fix_marked_done', { fix_type: type, domain, via: 'verification_banner' }); setStatus('done'); }}
                      style={{ marginTop: '10px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, borderRadius: '8px', border: 'none', background: 'var(--success)', color: 'white', cursor: 'pointer' }}
                    >
                      Mark as done ✓
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Done state */}
      {status === 'done' && (
        <div className="draft-card-body">
          <p className="draft-done-msg">
            This draft is ready. Copy it and implement it on your site, then re-scan to see if your citation score improves.
          </p>
          <button className="draft-reset-btn" onClick={() => setStatus('ready')}>
            View draft again
          </button>
        </div>
      )}
    </div>
  );
}
