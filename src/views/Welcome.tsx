interface WelcomeProps {
  onNewScan: () => void;
  onBackToResults: () => void;
}

export default function Welcome({ onNewScan, onBackToResults }: WelcomeProps) {
  return (
    <div className="welcome-container animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '100px 20px', width: '100%', fontFamily: 'var(--font-mono)' }}>
      <h1 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '24px', fontWeight: 600 }}>
        You're on Growth. Here's what's unlocked.
      </h1>
      
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 48px 0', display: 'flex', flexDirection: 'column', gap: '12px', color: '#475569', fontSize: '0.95rem' }}>
        <li>→ Unlimited websites and daily scanning.</li>
        <li>→ 12-week score history and email digests.</li>
        <li>→ Competitive report — see how you compare across 4 AI tools.</li>
        <li>→ Auto-regenerated fix files.</li>
      </ul>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
        <button 
          onClick={onNewScan}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 500 }}
        >
          [Scan another website →]
        </button>
        <button 
          onClick={onBackToResults}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: '0.95rem' }}
        >
          [Back to your results →]
        </button>
      </div>

    </div>
  );
}
