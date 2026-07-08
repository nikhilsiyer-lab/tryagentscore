'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const supabase = createClient()

  useEffect(() => {
    document.documentElement.classList.add('light-theme');
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

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
  }

  return (
    <div className="login-page">
      <div className="login-header">
        <a href="/" className="login-logo">
          <span style={{ color: 'var(--primary)' }}>✦</span> AgentScore
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
        ) : (
          <div className="login-card animate-slide-up">
            <h2>Log in to AgentScore</h2>
            <p className="login-subtitle">
              We'll send you a magic link — no password needed.
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
                {status === 'loading' ? 'Sending link...' : 'Send magic link →'}
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
