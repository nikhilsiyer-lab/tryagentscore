import { createClient } from '../../lib/supabase/server';
import { getCurrentUser } from '../../lib/auth';
import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function AdminDashboard({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  
  if (!user || user.email !== 'nikhilsiyer@gmail.com') {
    if (!user) {
      redirect('/login');
    }
  }

  const supabase = await createClient();

  // Date Filtering Setup
  const startDateStr = params.start || '';
  const endDateStr = params.end || '';

  // 1. Volume & Usage: Total Scans with optional date range filter
  let totalScansQuery = supabase.from('scans').select('*', { count: 'exact' });
  let scansListQuery = supabase.from('scans').select('*').order('created_at', { ascending: false });

  if (startDateStr) {
    totalScansQuery = totalScansQuery.gte('created_at', `${startDateStr}T00:00:00Z`);
    scansListQuery = scansListQuery.gte('created_at', `${startDateStr}T00:00:00Z`);
  }
  if (endDateStr) {
    totalScansQuery = totalScansQuery.lte('created_at', `${endDateStr}T23:59:59Z`);
    scansListQuery = scansListQuery.lte('created_at', `${endDateStr}T23:59:59Z`);
  }

  const { count: totalScans, data: scansData } = await totalScansQuery;
  const { data: scansList } = await scansListQuery.limit(50); // limit to last 50 for display

  // Scans by user type (Anonymous vs Logged In)
  let anonQuery = supabase.from('scans').select('*', { count: 'exact', head: true }).is('user_id', null);
  let loggedQuery = supabase.from('scans').select('*', { count: 'exact', head: true }).not('user_id', 'is', null);

  if (startDateStr) {
    anonQuery = anonQuery.gte('created_at', `${startDateStr}T00:00:00Z`);
    loggedQuery = loggedQuery.gte('created_at', `${startDateStr}T00:00:00Z`);
  }
  if (endDateStr) {
    anonQuery = anonQuery.lte('created_at', `${endDateStr}T23:59:59Z`);
    loggedQuery = loggedQuery.lte('created_at', `${endDateStr}T23:59:59Z`);
  }

  const { count: anonScans } = await anonQuery;
  const { count: userScans } = await loggedQuery;

  // 2. Conversion: Scans claimed
  let claimedQuery = supabase.from('scans').select('*', { count: 'exact', head: true }).eq('is_claimed', true);
  if (startDateStr) claimedQuery = claimedQuery.gte('created_at', `${startDateStr}T00:00:00Z`);
  if (endDateStr) claimedQuery = claimedQuery.lte('created_at', `${endDateStr}T23:59:59Z`);
  const { count: claimedScans } = await claimedQuery;

  // 3. Subscriptions (Pro Users)
  const { count: proUsers } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active');

  // 4. Engagement: Recommendation Events
  let eventsQuery = supabase.from('user_events').select('event_type');
  if (startDateStr) eventsQuery = eventsQuery.gte('created_at', `${startDateStr}T00:00:00Z`);
  if (endDateStr) eventsQuery = eventsQuery.lte('created_at', `${endDateStr}T23:59:59Z`);
  const { data: events } = await eventsQuery;
  
  const eventCounts = {
    shown: 0,
    copied: 0,
    applied: 0,
    dismissed: 0
  };

  events?.forEach(e => {
    if (e.event_type === 'recommendation_shown') eventCounts.shown++;
    if (e.event_type === 'recommendation_copied') eventCounts.copied++;
    if (e.event_type === 'recommendation_applied') eventCounts.applied++;
    if (e.event_type === 'recommendation_dismissed') eventCounts.dismissed++;
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif', color: '#0f172a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Internal Analytics</h1>
        <span style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600 }}>Admin View</span>
      </div>

      {/* Date Filter Panel */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', marginBottom: '32px' }}>
        <form method="GET" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Start Date</label>
            <input 
              type="date" 
              name="start" 
              defaultValue={startDateStr}
              style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#334155' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>End Date</label>
            <input 
              type="date" 
              name="end" 
              defaultValue={endDateStr}
              style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#334155' }}
            />
          </div>
          <button 
            type="submit" 
            style={{ padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Apply Filters
          </button>
          {(startDateStr || endDateStr) && (
            <a 
              href="/admin" 
              style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}
            >
              Clear
            </a>
          )}
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Scans</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a' }}>{totalScans || 0}</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px' }}>
            <span style={{ color: '#0ea5e9', fontWeight: 600 }}>{userScans || 0}</span> Logged In<br/>
            <span style={{ color: '#94a3b8' }}>{anonScans || 0}</span> Anonymous
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Pro Subscriptions</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981' }}>{proUsers || 0}</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px' }}>
            €14.99/mo Early Access Cohort
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Claimed Scans</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#8b5cf6' }}>{claimedScans || 0}</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px' }}>
            Anonymous scans converted to accounts
          </div>
        </div>

      </div>

      {/* Scanned Domains Table */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '24px' }}>Scanned Domains</h2>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>Date/Time</th>
              <th style={{ padding: '16px', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>Domain</th>
              <th style={{ padding: '16px', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>Location</th>
              <th style={{ padding: '16px', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>Score</th>
              <th style={{ padding: '16px', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>User Identifier</th>
            </tr>
          </thead>
          <tbody>
            {!scansList || scansList.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  No scans found in this date range.
                </td>
              </tr>
            ) : (
              scansList.map((scan) => {
                // Find location parameter from description stored inside technical_checks meta or fallback to Global
                let locationName = 'Global';
                if (scan.technical_checks && Array.isArray(scan.technical_checks)) {
                  // Scrape metadata parameters out if any
                  // Or fallback if there's no custom location field saved in older schema rows
                }
                return (
                  <tr key={scan.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', color: '#475569', fontSize: '0.9rem' }}>
                      {new Date(scan.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 500, color: '#0ea5e9' }}>
                      <a href={`/results/${scan.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                        {scan.domain} ↗
                      </a>
                    </td>
                    <td style={{ padding: '16px', color: '#475569', fontSize: '0.9rem' }}>
                      {locationName}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '0.85rem', 
                        fontWeight: 600,
                        background: scan.composite_score >= 70 ? '#ecfdf5' : scan.composite_score >= 35 ? '#fffbeb' : '#fef2f2',
                        color: scan.composite_score >= 70 ? '#047857' : scan.composite_score >= 35 ? '#b45309' : '#b91c1c'
                      }}>
                        {scan.composite_score}/100
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#64748b', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                      {scan.user_id ? `User: ${scan.user_id.slice(0, 8)}...` : `Anon (IP/ID): ${scan.anonymous_session_id ? scan.anonymous_session_id.slice(0, 12) + '...' : 'Unknown'}`}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '24px' }}>Recommendation Card Funnel</h2>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>Action</th>
              <th style={{ padding: '16px', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>Count</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '16px', color: '#334155' }}>Copied to Clipboard</td>
              <td style={{ padding: '16px', fontWeight: 600 }}>{eventCounts.copied}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '16px', color: '#065f46', fontWeight: 500 }}>Marked as Applied</td>
              <td style={{ padding: '16px', fontWeight: 600, color: '#10b981' }}>{eventCounts.applied}</td>
            </tr>
            <tr>
              <td style={{ padding: '16px', color: '#94a3b8' }}>Dismissed</td>
              <td style={{ padding: '16px', color: '#94a3b8' }}>{eventCounts.dismissed}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '16px', textAlign: 'center' }}>
        *Recommendation views are inferred by Pro dashboard loads. Only explicit user actions are logged above.
      </p>

    </div>
  );
}
