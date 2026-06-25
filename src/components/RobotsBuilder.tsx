import { useState, useEffect } from 'react';
import './RobotsBuilder.css';

interface BotConfig {
  name: string;
  userAgent: string;
  description: string;
  status: 'allow' | 'disallow';
  delay: string;
}

const INITIAL_BOTS: BotConfig[] = [
  { name: 'GPTBot (OpenAI)', userAgent: 'GPTBot', description: 'Powers ChatGPT web search and training indexes.', status: 'allow', delay: '' },
  { name: 'ClaudeBot (Anthropic)', userAgent: 'ClaudeBot', description: 'Used by Claude for factual web citation extraction.', status: 'allow', delay: '' },
  { name: 'PerplexityBot', userAgent: 'PerplexityBot', description: 'Enables Perplexity real-time citations and summarizations.', status: 'allow', delay: '' },
  { name: 'Google-Extended', userAgent: 'Google-Extended', description: 'Allows Google Gemini & AI Search to leverage page content.', status: 'allow', delay: '' },
  { name: 'Amazonbot', userAgent: 'Amazonbot', description: 'Crawls pages to power Alexa and Amazon LLM queries.', status: 'allow', delay: '' },
  { name: 'Applebot-Extended', userAgent: 'Applebot-Extended', description: 'Enables Apple Intelligence features & Siri citations.', status: 'allow', delay: '' },
  { name: 'Meta-ExternalAgent', userAgent: 'Meta-ExternalAgent', description: 'Indexes data for Meta AI applications (Instagram, WhatsApp).', status: 'allow', delay: '' },
  { name: 'ByteSpider (ByteDance)', userAgent: 'ByteSpider', description: 'Powers search indices for TikTok and ByteDance platforms.', status: 'allow', delay: '' },
];

export default function RobotsBuilder() {
  const [bots, setBots] = useState<BotConfig[]>(INITIAL_BOTS);
  const [outputText, setOutputText] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    generateDirectives();
  }, [bots]);

  const generateDirectives = () => {
    let output = `# tryagentscore robots.txt Configuration Builder\n# Optimize visibility for AI crawlers\n\n`;
    bots.forEach(bot => {
      output += `# ${bot.name} - ${bot.description}\n`;
      output += `User-agent: ${bot.userAgent}\n`;
      output += bot.status === 'allow' ? `Allow: /\n` : `Disallow: /\n`;
      if (bot.delay) {
        output += `Crawl-delay: ${bot.delay}\n`;
      }
      output += '\n';
    });
    output += `# General Search Crawlers\nUser-agent: *\nAllow: /\nSitemap: https://yourdomain.com/sitemap.xml\n`;
    setOutputText(output);
  };

  const handleToggle = (index: number, status: 'allow' | 'disallow') => {
    const updated = [...bots];
    updated[index].status = status;
    setBots(updated);
  };

  const handleDelayChange = (index: number, val: string) => {
    const updated = [...bots];
    updated[index].delay = val;
    setBots(updated);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([outputText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'robots.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleValidate = () => {
    const errors: string[] = [];
    const lowerText = pasteText.toLowerCase();

    // Look for Disallows affecting bots
    bots.forEach(bot => {
      const regex = new RegExp(`user-agent:\\s*${bot.userAgent.toLowerCase()}[\\s\\S]*?disallow:\\s*\\/`, 'i');
      if (regex.test(lowerText)) {
        errors.push(`⚠️ WARNING: "${bot.name}" is explicitly BLOCKED in your current robots.txt. This stops AI indexing.`);
      }
    });

    // Check general blocks
    const generalBlock = /user-agent:\s*\*\s*[\s\S]*?disallow:\s*\//i.exec(lowerText);
    if (generalBlock) {
      errors.push(`🚨 CRITICAL: General user-agent block "User-agent: * Disallow: /" detected! This blocks all crawlers unless explicitly overridden.`);
    }

    if (errors.length === 0 && pasteText.trim()) {
      errors.push(`✅ Your robots.txt has no explicit blocks against the key AI search agents checked.`);
    }

    setValidationErrors(errors);
  };

  return (
    <div className="robots-builder glass-panel animate-slide-up">
      <div className="builder-header">
        <h2>robots.txt AI Crawler Builder</h2>
        <p>Ensure LLMs can discover and read your pages while avoiding crawler overload.</p>
      </div>

      <div className="builder-layout">
        <div className="builder-controls">
          <h3>Crawler Agents Settings</h3>
          <div className="bot-list">
            {bots.map((bot, idx) => (
              <div className="bot-item" key={bot.userAgent}>
                <div className="bot-info">
                  <span className="bot-name">{bot.name}</span>
                  <span className="bot-desc">{bot.description}</span>
                </div>
                <div className="bot-actions">
                  <div className="toggle-group">
                    <button 
                      className={`toggle-btn ${bot.status === 'allow' ? 'active-allow' : ''}`}
                      onClick={() => handleToggle(idx, 'allow')}
                    >
                      Allow
                    </button>
                    <button 
                      className={`toggle-btn ${bot.status === 'disallow' ? 'active-disallow' : ''}`}
                      onClick={() => handleToggle(idx, 'disallow')}
                    >
                      Block
                    </button>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    placeholder="Delay (s)"
                    className="delay-input"
                    value={bot.delay}
                    onChange={(e) => handleDelayChange(idx, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="builder-preview">
          <div className="preview-header">
            <h3>Live Preview</h3>
            <div className="preview-buttons">
              <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleDownload}>
                Download
              </button>
            </div>
          </div>
          <pre className="output-code"><code>{outputText}</code></pre>
        </div>
      </div>

      <div className="builder-validator">
        <h3>Validate Existing robots.txt</h3>
        <p className="validator-sub">Paste the content of your website's robots.txt below to identify AI blockages:</p>
        <textarea
          className="paste-textarea"
          placeholder="User-agent: *&#10;Disallow: /admin&#10;..."
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
        />
        <button className="btn btn-secondary btn-validate" onClick={handleValidate}>
          Analyze Directive Gaps
        </button>

        {validationErrors.length > 0 && (
          <div className="validation-results">
            {validationErrors.map((err, i) => (
              <div key={i} className={`validation-message ${err.includes('✅') ? 'msg-success' : 'msg-danger'}`}>
                {err}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
