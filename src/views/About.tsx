import './StaticPages.css';

export default function About() {
  return (
    <div className="static-page-container animate-fade-in">
      <div className="static-header">
        <span className="static-badge">About Us</span>
        <h1>What is tryagentscore?</h1>
        <p>A simple tool designed to help businesses navigate the age of AI search engines.</p>
      </div>

      <div className="static-card-grid">
        <div className="static-card">
          <h2>
            <span style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>🔍</span>
            The Problem
          </h2>
          <p>
            When someone asks an AI assistant (like ChatGPT, Claude, or Google Gemini) for a local service, restaurant, or software solution — the AI recommends just a handful of options. Most businesses are completely blind to whether they are being recommended or left out.
          </p>
        </div>

        <div className="static-card">
          <h2>
            <span style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>🚀</span>
            The Solution
          </h2>
          <p>
            tryagentscore instantly scans your URL, evaluates your digital footprint against AI recommender patterns, and gives you a clear readability and visibility score. We tell you if you are recommended, why, and exactly what updates you need to make to improve your ranking.
          </p>
        </div>

        <div className="static-card">
          <h2>
            <span style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>💡</span>
            Our Philosophy
          </h2>
          <p>
            We believe optimization tools for the AI era should be fast, transparent, and highly accessible. We build tryagentscore to eliminate unnecessary corporate overhead and agency markups, delivering direct, actionable insights straight to business owners.
          </p>
        </div>
      </div>
    </div>
  );
}
