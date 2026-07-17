import React from 'react';

export default function LogoPreviews({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ maxWidth: '800px', margin: '80px auto', padding: '0 24px', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      <button onClick={onBack} style={{ marginBottom: '40px', background: 'none', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
        ← Back to App
      </button>
      
      <h1 style={{ fontSize: '2rem', marginBottom: '40px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Logo & Branding Explorations</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        
        {/* Option 1: Current (Baseline) */}
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px', background: 'var(--bg-card)' }}>
          <h3 style={{ marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Baseline (Current)</h3>
          <div style={{ fontWeight: '800', fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '50%' }}></span>
            AgentScore
          </div>
        </div>

        {/* Option 2: Live Pulse */}
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px', background: 'var(--bg-card)' }}>
          <h3 style={{ marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Option 1: The "Live AI" Pulse</h3>
          <div style={{ fontWeight: '800', fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', width: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ position: 'absolute', width: '100%', height: '100%', background: 'var(--primary)', borderRadius: '50%', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite', opacity: 0.75 }}></span>
              <span style={{ position: 'relative', width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '50%' }}></span>
            </div>
            AgentScore
          </div>
          <style>{`
            @keyframes ping {
              75%, 100% { transform: scale(2.5); opacity: 0; }
            }
          `}</style>
        </div>

        {/* Option 3: Typographic Polish */}
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px', background: 'var(--bg-card)' }}>
          <h3 style={{ marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Option 2: Typographic Polish</h3>
          <div style={{ fontWeight: '800', fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '50%' }}></span>
            <span>Agent<span style={{ color: 'var(--primary)' }}>Score</span></span>
          </div>
        </div>

        {/* Option 4: AI Spark SVG + Typographic */}
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px', background: 'var(--bg-card)' }}>
          <h3 style={{ marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Option 3: AI Spark + Typography</h3>
          <div style={{ fontWeight: '800', fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="url(#spark-grad)" />
              <defs>
                <linearGradient id="spark-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--primary)" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <span>Agent<span style={{ color: 'var(--primary)' }}>Score</span></span>
          </div>
        </div>

        {/* Option 5: Premium Abstract Radar */}
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px', background: 'var(--bg-card)' }}>
          <h3 style={{ marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Option 4: Premium Radar + Pulse</h3>
          <div style={{ fontWeight: '800', fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <span style={{ position: 'absolute', width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
            </div>
            <span>Agent<span style={{ color: 'var(--primary)' }}>Score</span></span>
          </div>
        </div>

      </div>
    </div>
  );
}
