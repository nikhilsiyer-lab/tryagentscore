interface WelcomeProps {
  onNewScan: () => void;
  onBackToResults: () => void;
}

export default function Welcome({ onNewScan, onBackToResults }: WelcomeProps) {
  return (
    <div className="welcome-container animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '100px 20px', width: '100%', fontFamily: 'var(--font-mono)' }}>
      <h1 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '12px', fontWeight: 600 }}>
        Welcome to Pro.
      </h1>
      <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
        Monitoring is now active. You're on our early access price of €14.99/month — thanks for being one of our first members.
      </p>
      
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 48px 0', display: 'flex', flexDirection: 'column', gap: '12px', color: '#475569', fontSize: '0.95rem' }}>
        <li>→ Automatic weekly monitoring</li>
        <li>→ Reliable, multi-sample scoring</li>
        <li>→ See which competitors are being recommended instead of you</li>
        <li>→ Get alerted the moment your AI visibility changes</li>
        <li>→ Specific, ongoing AI-drafted recommendations</li>
      </ul>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
        <button 
          onClick={onNewScan}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 500 }}
        >
          [Go to your dashboard →]
        </button>
        <button 
          onClick={onBackToResults}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: '0.95rem' }}
        >
          [Scan another website →]
        </button>
      </div>

    </div>
  );
}
