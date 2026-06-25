import './StaticPages.css';

export default function Contact() {
  return (
    <div className="static-page-container animate-fade-in" style={{ maxWidth: '680px' }}>
      <div className="static-header">
        <span className="static-badge">Get In Touch</span>
        <h1>Contact Us</h1>
        <p>Have questions, feedback, or need help? We are just an email away.</p>
      </div>

      <div className="static-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>✉️</div>
        <h2 style={{ justifyContent: 'center', marginBottom: '12px' }}>Drop us a message</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '1.05rem' }}>
          We love hearing from our users! Whether you found a bug, want to suggest a feature, or need custom enterprise scans, get in touch.
        </p>

        <a 
          href="mailto:hello@tryagentscore.com" 
          className="contact-email-btn"
          style={{ textDecoration: 'none', margin: '0 auto' }}
        >
          hello@tryagentscore.com
        </a>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '24px' }}>
          Response time is typically within 1–2 business days.
        </p>
      </div>
    </div>
  );
}
