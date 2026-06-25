import './StaticPages.css';

export default function Terms() {
  return (
    <div className="static-page-container animate-fade-in">
      <div className="static-header">
        <span className="static-badge">Terms of Service</span>
        <h1>Terms of Use</h1>
        <p>Simple, fair, and easy to understand rules for using tryagentscore.</p>
      </div>

      <div className="tldr-box">
        <h3>Quick Summary</h3>
        <p>This tool is provided as-is for informational purposes. Please do not abuse or scrape the service, and enjoy checking your scores!</p>
      </div>

      <div className="static-card-grid" style={{ marginTop: '0' }}>
        <div className="static-card">
          <h2>Service Availability</h2>
          <p>
            This tool is provided on an "as-is" and "as-available" basis. While we strive to model AI recommendations accurately, AI engine responses fluctuate, and our scores represent best-effort analysis that may not reflect every AI search experience.
          </p>
        </div>

        <div className="static-card">
          <h2>Acceptable Use</h2>
          <p>
            You agree to use this tool for standard scanning of websites you own, manage, or are interested in. Do not use automated scripts, scrapers, or bots to overload or abuse our testing infrastructure.
          </p>
        </div>

        <div className="static-card">
          <h2>Modifications to Service</h2>
          <p>
            We reserve the right to modify, suspend, or discontinue the service (or any part thereof) at any time with or without notice to ensure quality, performance, and security.
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '48px', color: 'var(--text-muted)' }}>
        <p>Last updated: June 2026</p>
      </div>
    </div>
  );
}
