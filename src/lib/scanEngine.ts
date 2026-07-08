export interface CheckResult {
  id: string;
  name: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
}

export interface IntentCategory {
  name: string;
  cited: number;
  total: number;
}

export interface CompetitorGap {
  domain: string;
  appearances: number;
}

export interface FixItem {
  id: string;
  title: string;
  description: string;
  impact: 'Critical' | 'High' | 'Medium';
  timeEstimate: string;
  fixAction: 'llms' | 'robots' | 'schema' | 'link';
}

export interface Top10Result {
  query: string;
  cited: boolean;
  /** Names/domains of other businesses the AI listed alongside (Pro-only, may be empty) */
  coMentioned: string[];
}

export interface ScanReport {
  url: string;
  domain: string;
  timestamp: string;
  track: 'Service / local business' | 'Product or shop';
  technicalScore: number;
  citationRate: number;
  compositeScore: number;
  technicalChecks: CheckResult[];
  intentCategories: IntentCategory[];
  competitors: CompetitorGap[];
  topFixes: FixItem[];
  /** Binary Top-10-list result — present after live scan, Pro-only to display */ 
  top10Result?: Top10Result;
  options?: {
    businessType?: string;
    honeypot?: string;
    isBot?: boolean;
    description?: string;
  };
}

export function detectTrack(url: string): 'Service / local business' | 'Product or shop' {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('shop') || urlLower.includes('store') || urlLower.includes('product') || urlLower.includes('buy')) {
    return 'Product or shop';
  }
  return 'Service / local business';
}

export function generateReport(url: string, options?: { description?: string; businessType?: string; honeypot?: string; isBot?: boolean }): ScanReport {
  let domain = url.replace(/^(https?:\/\/)?(www\.)?/, '');
  domain = domain.split('/')[0];
  
  const track = detectTrack(url);

  // 14 Audit Factors
  const technicalChecks: CheckResult[] = [
    { id: 'schema', name: 'Schema markup detected', status: 'pass', description: 'JSON-LD schema gives AI tools explicit definitions.' },
    { id: 'ssr', name: 'Page renders without JavaScript', status: 'pass', description: 'Ensures bots without JS engines can read content.' },
    { id: 'llms', name: 'No llms.txt file found', status: 'warning', description: 'Missing standard LLMs directory data.' },
    { id: 'robots', name: 'robots.txt blocks some AI crawlers', status: 'warning', description: 'Blocking prevents indexation by some AI tools.' },
    { id: 'contact', name: 'No structured contact information', status: 'fail', description: 'AI struggles to find businesses without clear address/phone.' },
    { id: 'freshness', name: 'Fresh content (updated within 90 days)', status: 'pass', description: 'Recent updates prioritize your relevance.' },
    { id: 'h1', name: 'Single H1 Header Tag', status: 'pass', description: 'Clear topic declaration.' },
    { id: 'hierarchy', name: 'Logical Heading Hierarchy', status: 'pass', description: 'Easy parsing for scrapers.' },
    { id: 'meta-title', name: 'Meta Title Length & Relevance', status: 'pass', description: 'Contextual understanding.' },
    { id: 'meta-desc', name: 'Meta Description Length', status: 'warning', description: 'Summary snippet.' },
    { id: 'alt-text', name: 'Alt Text Coverage', status: 'pass', description: 'Multimodal image understanding.' },
    { id: 'faq', name: 'No FAQ schema implemented', status: 'warning', description: 'Limits direct question answering.' },
    { id: 'speed', name: 'Page Speed (LCP) acceptable', status: 'pass', description: 'Prevents crawler timeouts.' },
    { id: 'https', name: 'HTTPS Enforced', status: 'pass', description: 'Secure connections allowed.' }
  ];

  // Calculate technical score (mock)
  let passCount = technicalChecks.filter(c => c.status === 'pass').length;
  let technicalScore = Math.round((passCount / 14) * 100);

  // Intent Categories (20 prompts total)
  const intentCategories: IntentCategory[] = [
    { name: 'Informational queries', cited: 2, total: 5 },
    { name: 'Local intent queries', cited: 1, total: 5 },
    { name: 'Comparison queries', cited: 1, total: 5 },
    { name: 'Direct queries', cited: 0, total: 5 }
  ];

  const totalCited = intentCategories.reduce((sum, cat) => sum + cat.cited, 0);
  const citationRate = totalCited / 20;

  // Composite Score
  const compositeScore = Math.round((technicalScore * 0.3) + ((citationRate * 100) * 0.7));

  const competitors: CompetitorGap[] = [
    { domain: 'physioberlinmitte.de', appearances: 11 },
    { domain: 'berlinsportsklinik.com', appearances: 8 },
    { domain: 'praxisschmidt-berlin.de', appearances: 6 }
  ];

  const topFixes: FixItem[] = [
    {
      id: 'fix-llms',
      title: 'Add an llms.txt file to your website',
      description: 'Tells AI tools exactly what your business does and where you are located.',
      impact: 'High',
      timeEstimate: 'Takes 5 minutes',
      fixAction: 'llms'
    },
    {
      id: 'fix-robots',
      title: 'Fix your robots.txt file',
      description: 'Two AI crawlers are currently being blocked.',
      impact: 'Critical',
      timeEstimate: 'Takes 2 minutes',
      fixAction: 'robots'
    },
    {
      id: 'fix-schema',
      title: 'Add structured contact information',
      description: 'AI tools struggle to find businesses without a clearly marked address and phone number.',
      impact: 'Medium',
      timeEstimate: 'Takes 10 minutes',
      fixAction: 'schema'
    }
  ];

  return {
    url,
    domain,
    timestamp: new Date().toISOString(),
    track,
    technicalScore,
    citationRate,
    compositeScore,
    technicalChecks,
    intentCategories,
    competitors,
    topFixes,
    options
  };
}
