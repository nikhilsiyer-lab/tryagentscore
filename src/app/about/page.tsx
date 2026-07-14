import React from 'react';

export default function About() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0f172a', lineHeight: '1.7' }}>
      <header style={{ marginBottom: '40px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
        <a href="/" style={{ textDecoration: 'none', color: '#6366f1', fontWeight: 600, fontSize: '0.95rem' }}>← Back to Home</a>
        <h1 style={{ marginTop: '20px', fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>What is AgentScore?</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', margin: '8px 0 0 0' }}>A simple tool designed to help businesses navigate the age of AI search engines.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.06)', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.02)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔍</span> The Problem
          </h2>
          <p style={{ margin: 0, color: '#334155' }}>
            When someone asks an AI assistant (like ChatGPT, Claude, or Google Gemini) for a local service, restaurant, or software solution - the AI recommends just a handful of options. Most businesses are completely blind to whether they are being recommended or left out.
          </p>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.06)', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.02)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🚀</span> The Solution
          </h2>
          <p style={{ margin: 0, color: '#334155' }}>
            AgentScore instantly scans your URL, evaluates your digital footprint against AI recommender patterns, and gives you a clear readability and visibility score. We tell you if you are recommended, why, and exactly what updates you need to make to improve your ranking.
          </p>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.06)', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.02)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💡</span> Our Philosophy
          </h2>
          <p style={{ margin: 0, color: '#334155' }}>
            We believe optimization tools for the AI era should be fast, transparent, and highly accessible. We build AgentScore to eliminate unnecessary corporate overhead and agency markups, delivering direct, actionable insights straight to business owners.
          </p>
        </div>
      </div>
    </div>
  );
}
