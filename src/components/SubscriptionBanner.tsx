import React from 'react';
import type { SubscriptionState } from '../lib/auth';

export default function SubscriptionBanner({ 
  state, 
  periodEnd,
  onManage
}: { 
  state: SubscriptionState; 
  periodEnd: string | null;
  onManage: () => void;
}) {
  if (state === 'anonymous' || state === 'pro_active') return null;

  const dateStr = periodEnd ? new Date(periodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

  if (state === 'pro_canceled_pending') {
    return (
      <div style={{ width: '100%', background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '10px 24px', textAlign: 'center', fontSize: '0.85rem', color: '#92400e', zIndex: 11, position: 'relative' }}>
        Pro ends on {dateStr}. You'll keep access until then. 
        <button onClick={onManage} style={{ background: 'none', border: 'none', padding: 0, marginLeft: '12px', color: '#b45309', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
          Resume Pro
        </button>
      </div>
    );
  }

  if (state === 'pro_expired') {
    return (
      <div style={{ width: '100%', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '10px 24px', textAlign: 'center', fontSize: '0.85rem', color: '#475569', zIndex: 11, position: 'relative' }}>
        Your Pro plan ended{dateStr ? ` on ${dateStr}` : ''}. Your past reports are still available to view.
        <button onClick={onManage} style={{ background: 'none', border: 'none', padding: 0, marginLeft: '12px', color: '#0f172a', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
          Reactivate Pro
        </button>
      </div>
    );
  }

  return null;
}
