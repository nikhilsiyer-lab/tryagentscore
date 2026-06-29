import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// We only initialize if keys are present to avoid crash on build
const supabase = supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      console.warn('Supabase credentials not configured');
      setStatus('error');
      return;
    }
    
    setStatus('loading');

    const { error } = await supabase.from('waitlist').insert({ email });

    if (!error) {
      setStatus('success');
    } else if (error.code === '23505') {
      setStatus('duplicate');
    } else {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '1.05rem', margin: 0 }}>You're on the list! ✓</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>We'll email you when Pro launches.</p>
      </div>
    );
  }

  if (status === 'duplicate') {
    return (
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0', margin: 0 }}>
        You're already on the list — we've got you. ✓
      </p>
    );
  }

  if (status === 'error') {
    return (
      <p style={{ textAlign: 'center', color: 'var(--danger)', padding: '16px 0', margin: 0 }}>
        Something went wrong. Please try again.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '16px' }}>
      <input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{
          border: '1px solid rgba(15, 23, 42, 0.15)',
          borderRadius: '8px',
          padding: '10px 14px',
          flex: 1,
          outline: 'none',
          fontSize: '0.95rem',
          fontFamily: 'var(--font-sans)',
          background: 'var(--bg-input, #ffffff)',
          color: 'var(--text-primary)',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)'
        }}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          background: 'var(--primary)',
          color: '#ffffff',
          padding: '10px 16px',
          borderRadius: '8px',
          border: 'none',
          fontWeight: 600,
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          opacity: status === 'loading' ? 0.6 : 1,
          transition: 'all 0.2s',
          fontFamily: 'var(--font-display)',
          whiteSpace: 'nowrap'
        }}
      >
        {status === 'loading' ? 'Joining...' : 'Join waitlist'}
      </button>
    </form>
  );
}
