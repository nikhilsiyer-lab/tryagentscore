'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'not_pro'>('idle')
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    setSupabase(createClient())
    document.documentElement.classList.add('light-theme');
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      setIsCheckoutSuccess(true);
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    try {
      // Pre-check email eligibility
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()

      // "admin" override to let me test logging in freely
      if (!data.hasSubscription && email !== 'nikhilsiyer@gmail.com') {
        setStatus('not_pro')
        return
      }

      if (!supabase) {
        throw new Error('Supabase client has not initialized yet. Please try again.')
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setStatus('error')
      } else {
        setStatus('success')
      }
    } catch (err) {
      console.error('Login error:', err)
      setStatus('error')
    }
  }

  return (
    <div className="login-page">
      <div className="login-header">
        <a href="/" className="login-logo">
          <span style={{ color: 'var(--primary)' }}>✦</span> Agent<span style={{ color: 'var(--primary)' }}>Score</span>
        </a>
      </div>

      <div className="login-container">
        {status === 'success' ? (
          <div className="login-card animate-slide-up" style={{ textAlign: 'center' }}>
            <div className="success-icon">✓</div>
            <h2>Check your email</h2>
            <p>
              We sent a magic link to <br/>
              <strong>{email}</strong>
            </p>
            <p className="login-footer-text" style={{ marginTop: '24px' }}>
              Click the link to log in. No password required.<br/>
              Didn't get it? Check spam or <button onClick={() => setStatus('idle')} className="text-btn">try again</button>.
            </p>
          </div>
        ) : status === 'not_pro' ? (
          <div className="login-card animate-slide-up" style={{ textAlign: 'center' }}>
            <div className="success-icon" style={{ background: '#f8fafc', color: '#64748b' }}>ℹ️</div>
            <h2>Unlock Account Features</h2>
            <p style={{ margin: '16px 0', lineHeight: 1.5, color: '#475569' }}>
              To access history and saved reports, please upgrade to Pro.
            </p>
            <a href="/?go=pricing" className="btn-login-submit" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '16px' }}>
              Upgrade to Pro →
            </a>
            <div style={{ marginTop: '24px' }}>
              <button onClick={() => setStatus('idle')} className="text-btn">Use a different email</button>
            </div>
          </div>
        ) : (
          <div className="login-card animate-slide-up">
            {isCheckoutSuccess && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '16px',
                borderRadius: '12px',
                color: '#15803d',
                fontWeight: 600,
                fontSize: '13.5px',
                marginBottom: '20px',
                textAlign: 'left',
                lineHeight: '1.4'
              }}>
                🎉 <strong>Thank you for subscribing!</strong> Your Pro account has been created successfully. Log in below to access your dashboard.
              </div>
            )}
            <h2>Already a Pro user? Log in</h2>
            <p className="login-subtitle">
              Use the email linked to your subscription. We'll send you a magic link - no password needed.
            </p>

            <form onSubmit={handleLogin} className="login-form">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                disabled={status === 'loading'}
              />
              <button 
                type="submit" 
                className="btn-login-submit"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Checking...' : 'Send magic link →'}
              </button>
            </form>

            {status === 'error' && (
              <p className="login-error">Something went wrong. Please try again.</p>
            )}

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <a href="/" className="back-link">← Back to free scan</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
