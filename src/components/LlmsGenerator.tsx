import { useState, useEffect } from 'react';
import './LlmsGenerator.css';

export default function LlmsGenerator() {
  const [siteName, setSiteName] = useState('');
  const [description, setDescription] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [linksText, setLinksText] = useState('');
  
  const [outputText, setOutputText] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [validationScore, setValidationScore] = useState<number | null>(null);
  const [validationFeedback, setValidationFeedback] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    generateLlmsTxt();
  }, [siteName, description, focusArea, linksText]);

  const generateLlmsTxt = () => {
    let output = `# ${siteName || 'Site Name'}\n\n`;
    output += `> ${description || 'Brief description of the site for LLM contextual awareness.'}\n\n`;
    
    if (focusArea) {
      output += `## Primary Focus\n${focusArea}\n\n`;
    }

    output += `## Key Resources\n\n`;
    
    if (linksText.trim()) {
      const parsedLinks = linksText.split('\n').filter(l => l.trim());
      parsedLinks.forEach(line => {
        if (line.includes('|')) {
          const parts = line.split('|');
          const title = parts[0].trim();
          const url = parts[1]?.trim() || '';
          output += `- [${title}](${url}): Comprehensive guide on this topic.\n`;
        } else {
          output += `- [${line.trim()}](https://yourdomain.com/${line.trim().toLowerCase().replace(/\s+/g, '-')}): Information about ${line.trim()}.\n`;
        }
      });
    } else {
      output += `- [About](/about): Company biography and team details.\n`;
      output += `- [Documentation](/docs): Developer references and API integrations.\n`;
      output += `- [FAQ](/faq): Common troubleshooting answers.\n`;
    }

    setOutputText(output);
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
    element.download = 'llms.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleValidate = () => {
    const feedback: string[] = [];
    let score = 100;

    if (!pasteText.trim()) {
      setValidationScore(null);
      setValidationFeedback(['Please paste your llms.txt text first.']);
      return;
    }

    // Rule 1: Starts with Title (H1)
    if (!pasteText.startsWith('# ')) {
      feedback.push('❌ Missing primary H1 header at the start (e.g. # Site Name)');
      score -= 25;
    } else {
      feedback.push('✅ Correctly started with a primary # Title.');
    }

    // Rule 2: Has quote description block
    if (!/>\s.+/.test(pasteText)) {
      feedback.push('❌ Missing blockquote markdown description (e.g. > A brief description of the site)');
      score -= 25;
    } else {
      feedback.push('✅ Blockquote summary description detected.');
    }

    // Rule 3: Check for Links / resources
    if (!/\[.+\]\(.+\)/.test(pasteText)) {
      feedback.push('❌ No markdown hyperlinks found. LLMs need lists of page routes to explore deep details.');
      score -= 30;
    } else {
      feedback.push('✅ Content contains markdown linkages.');
    }

    // Rule 4: Check if size is reasonable
    if (pasteText.length > 5000) {
      feedback.push('⚠️ Document is too large. llms.txt is intended for rapid contextual mapping, keep it concise.');
      score -= 10;
    } else {
      feedback.push('✅ Document length is optimal for LLM context tokens.');
    }

    setValidationScore(Math.max(0, score));
    setValidationFeedback(feedback);
  };

  return (
    <div className="llms-generator glass-panel animate-slide-up">
      <div className="generator-header">
        <h2>llms.txt Standard Generator</h2>
        <p>Generate a structured directory file at <code>/llms.txt</code> to guide AI engines to your most critical text resources.</p>
      </div>

      <div className="generator-layout">
        <div className="generator-inputs">
          <h3>Configure llms.txt Parameters</h3>
          <div className="form-group">
            <label>Website Name</label>
            <input 
              type="text" 
              placeholder="e.g. Acme Corp" 
              value={siteName} 
              onChange={e => setSiteName(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label>Brief Site Summary (for AI context)</label>
            <textarea 
              placeholder="e.g. A cloud intelligence dashboard helping marketers optimize organic search listings." 
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Primary Content Focus / Notes</label>
            <input 
              type="text" 
              placeholder="e.g. B2B Analytics, Marketing APIs, SEO Services" 
              value={focusArea}
              onChange={e => setFocusArea(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Add Custom Pages (One per line: "Title | path")</label>
            <textarea 
              placeholder="e.g. API Docs | /docs/api&#10;Pricing Page | /pricing&#10;Case Studies | /case-studies" 
              value={linksText}
              onChange={e => setLinksText(e.target.value)}
            />
          </div>
        </div>

        <div className="generator-preview">
          <div className="preview-header">
            <h3>Markdown Output</h3>
            <div className="preview-buttons">
              <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleDownload}>
                Download llms.txt
              </button>
            </div>
          </div>
          <pre className="output-code"><code>{outputText}</code></pre>
        </div>
      </div>

      <div className="generator-validator">
        <h3>Validate Existing llms.txt</h3>
        <p className="validator-sub">Paste your site\'s existing /llms.txt file to test structure compatibility:</p>
        <textarea
          className="paste-textarea"
          placeholder="# Site Name&#10;&#10;> Brief summary description...&#10;&#10;- [Link Title](/path)"
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
        />
        <button className="btn btn-secondary btn-validate" onClick={handleValidate}>
          Check llms.txt Compatibility
        </button>

        {validationScore !== null && (
          <div className="validation-report">
            <div className="validation-score">
              Compatibility Score: <span style={{ color: validationScore >= 80 ? 'var(--success)' : 'var(--warning)' }}>{validationScore}%</span>
            </div>
            <div className="validation-results">
              {validationFeedback.map((err, i) => (
                <div key={i} className={`validation-message ${err.includes('✅') ? 'msg-success' : 'msg-danger'}`}>
                  {err}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
