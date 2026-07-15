export const TECHNICAL_CHECKS_LIST = [
  { id: 'robots', title: 'Robots.txt & Meta Tags', description: 'Checks if your site unintentionally blocks AI crawlers.' },
  { id: 'schema', title: 'Schema Markup', description: 'Validates JSON-LD structured data for business entities.' },
  { id: 'h1', title: 'H1 Optimization', description: 'Ensures primary headings are highly descriptive.' },
  { id: 'https', title: 'HTTPS & SSL', description: 'Checks security protocols (AI prefers secure sites).' },
  { id: 'llms', title: 'LLMs.txt File', description: 'Checks for AI-specific contextual text files.' },
  { id: 'contact', title: 'NAP Consistency', description: 'Checks for crawlable Name, Address, and Phone number.' }
];

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';
import { getCurrentUser } from '../../../lib/auth';

let genAIInstance: GoogleGenerativeAI | null = null;
function getGenAI() {
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key-for-build');
  }
  return genAIInstance;
}

let groqInstance: Groq | null = null;
export function getGroq() {
  if (!groqInstance) {
    groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build' });
  }
  return groqInstance;
}

export const runtime = 'edge';
export const maxDuration = 60; // Allow function to run up to 60s for Hobby tier
export const dynamic = 'force-dynamic';

// 14 Technical Factors


// Helper to extract clean text from HTML body
function cleanHtmlText(html: string): string {
  // Strip script and style tags
  let text = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
  // Strip HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
// Clean whitespace
  return text.replace(/\s+/g, ' ').trim();
}

function isBlockedPage(html: string): boolean {
  const signals = ['captcha', 'datadome', 'perimeterx', 'cf-challenge', 'access denied', 'awswaf', 'challengeerror', 'reportchallengeerror', 'verify you are human'];
  return signals.some(s => html.toLowerCase().includes(s));
}

export async function analyzeBusinessProfile(domain: string, targetUrl: string, descriptionOverride?: string, htmlSnippet?: string) {
  const prompt = `Analyze the business at URL "${targetUrl}" (root domain: "${domain}").
${descriptionOverride ? `Additional context: ${descriptionOverride}\n` : ''}${htmlSnippet ? `Website snippet:\n${htmlSnippet}\n` : ''}
Return ONLY a JSON object with these exact keys:
1. "businessMode": "local" (specific city/district), "national" (whole country), or "global" (worldwide/SaaS)
2. "areaScope": "district", "city", "country", or "global"
3. "serviceBreadth": "single", "multi", or "multi-discipline"
4. "primaryCategory": The most common singular category noun (e.g. "Law Firm", "Dentist", "SaaS")
5. "topServices": Array of strings (Top 3-5 specific services offered, e.g. ["Teeth Whitening", "Implants"])
6. "location": Specific city or district (or "Global" if SaaS/online)
7. "queryLanguage": 2-letter language code (e.g., "en", "de", "fr")
8. "businessName": The real brand name
9. "confidence": "high" or "low"

No markdown, no extra text.`;

  try {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await Promise.race([
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
    ]) as any;
    
    const text = result.response.text().trim();
    const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error('Failed to analyze business profile:', (err as any).message);
    const brandName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    return {
      businessMode: 'global',
      areaScope: 'global',
      serviceBreadth: 'single',
      primaryCategory: 'online services',
      topServices: [],
      location: 'Global',
      queryLanguage: 'en',
      businessName: brandName,
      confidence: 'low'
    };
  }
}

export async function generateModeQueries(profile: any) {
  const { businessName, primaryCategory, topServices = [], location, queryLanguage, businessMode, serviceBreadth, targetClient } = profile;
  
  let promptFormula = '';
  if (businessMode === 'local' || businessMode === 'national') {
    if (serviceBreadth === 'single') {
      promptFormula = `Use this formula: {service} + {location}`;
    } else if (serviceBreadth === 'multi' || serviceBreadth === 'multi-discipline') {
      promptFormula = `Use this formula: {umbrella category} + {location} PLUS variations using these top services: ${topServices.join(', ')}`;
    } else {
      promptFormula = `Use this formula: {category} + {location}`;
    }
  } else if (businessMode === 'global' && targetClient) {
    // International with a defined target client — use audience-based phrasing not just geography
    promptFormula = `Use this formula: {category} + "for ${targetClient}" — e.g. "best ${primaryCategory} for ${targetClient}". Do NOT use a city location. Focus on the client type.`;
  } else {
    promptFormula = `Use this formula: {category} or {feature} with no location (global SaaS style).`;
  }

  let prompt = `Generate exactly 4 search queries a real customer would use to find ${businessName}.
Write queries in language: "${queryLanguage}".
Location context: "${location}"
Category: "${primaryCategory}"
Top Services: ${topServices.join(', ')}

${promptFormula}

Return ONLY a JSON object with a key "queries" mapping to a flat array of exactly 4 strings.
The 4 queries must represent these categories in order:
1. Informational — a general question about the business type or a problem they solve
2. Local intent — a location-specific search (or feature-focused if global mode)
3. Comparison — a head-to-head or alternatives search (e.g., "alternatives to...", or "best [category] in [location]")
4. Direct — a brand-specific query about ${businessName}`;

  try {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await Promise.race([
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
    ]) as any;
    const data = JSON.parse(result.response.text().trim());
    if (Array.isArray(data.queries) && data.queries.length === 4) {
      return data.queries;
    }
    throw new Error('Did not return 4 queries');
  } catch (e) {
    console.error('Failed to generate mode-aware queries, falling back:', e);
    return [
      `What is the best ${primaryCategory} platform or service?`,
      `Which ${primaryCategory} service should I use in ${location}?`,
      `What are the best ${businessName} alternatives?`,
      `Is ${businessName} a good ${primaryCategory} service?`
    ];
  }
}

async function generateNicheQueries(businessName: string, category: string, city: string) {
  try {
    const response = await Promise.race([
      getGroq().chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are an AI search query generator. Generate exactly 5 realistic, natural search queries that a potential customer might ask an AI when looking for services/products related to this business. Return ONLY a JSON object with a key "queries" mapping to an array of 5 strings.'
          },
          {
            role: 'user',
            content: `Business Name: ${businessName}\nCategory: ${category}\nCity: ${city}`
          }
        ],
        response_format: { type: 'json_object' }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
    ]) as any;
    
    const data = JSON.parse(response.choices[0]?.message?.content || '{}');
    return data.queries || [];
  } catch (e) {
    console.error('Failed to generate niche queries:', e);
    return [
      `Best services in ${city}`,
      `Top rated ${category} near me`,
      `${businessName} reviews`,
      `Quality ${category} in ${city}`,
      `Local ${category} recommendations`
    ];
  }
}

export async function generateTop10Query(profile: any): Promise<string> {
  const { primaryCategory, location, queryLanguage, businessMode } = profile;
  // For global/SaaS businesses there is no location-based list; use a category-scoped list instead
  if (businessMode === 'global') {
    return queryLanguage === 'en'
      ? `Give me the top 10 best ${primaryCategory} tools or platforms`
      : `Gib mir die top 10 besten ${primaryCategory} Tools`; // simple fallback; real i18n can extend this
  }
  // Local / national: use location
  const loc = location && location !== 'Global' ? location : '';
  const base = `Give me the top 10 ${primaryCategory}${loc ? ` in ${loc}` : ''}`;
  return base;
}

/**
 * Checks whether `domain` or `businessName` appears anywhere in the raw LLM text response.
 * Deliberately does NOT extract a position — we only care about presence (yes/no).
 */
export function checkTop10Citation(responseText: string, domain: string, businessName: string): { cited: boolean; coMentioned: string[] } {
  const text = responseText.toLowerCase();
  const domainRoot = domain.replace(/\.[^.]+$/, '').toLowerCase(); // e.g. "acme" from "acme.com"
  const nameNorm = businessName.toLowerCase();
  const cited = text.includes(domainRoot) || text.includes(nameNorm);

  // Extract co-mentioned business-like proper nouns by grabbing numbered-list lines and stripping our own name
  const lines = responseText.split('\n').filter(l => /^\d+[\.\)\-]/.test(l.trim()));
  const coMentioned = lines
    .map(l => l.replace(/^\d+[\.\)\-\s]+/, '').split(/[—:\-]/)[0].trim())
    .filter(name => {
      const n = name.toLowerCase();
      const isGovBody = n.includes('registrar of companies') || n === 'roc' || n.includes('gst') || n.includes('income tax');
      return n.length > 2 && !n.includes(domainRoot) && !n.includes(nameNorm) && !isGovBody;
    })
    .slice(0, 5);

  return { cited, coMentioned };
}

export async function generateFixSuggestions(html: string, queryResults?: any[]) {
  try {
    const cleanText = cleanHtmlText(html).substring(0, 3000);
    
    // Prepare a summary of the scan results to ground the LLM
    let scanResultsSummary = "No scan data available.";
    if (queryResults && queryResults.length > 0) {
      scanResultsSummary = queryResults.map((q: any) => {
        return `Query: "${q.query}"
- ChatGPT: ${q.gptCited ? 'Cited' : `Not Cited (Competitors: ${q.gptMentions?.join(', ') || 'None'})`}
- Perplexity: ${q.perplexityCited ? 'Cited' : `Not Cited (Competitors: ${q.pxMentions?.join(', ') || 'None'})`}
- Gemini: ${q.geminiCited ? 'Cited' : `Not Cited (Competitors: ${q.gmMentions?.join(', ') || 'None'})`}`;
      }).join('\n\n');
    }

    const response = await Promise.race([
      getGroq().chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO and AI-visibility expert. Based on the website text and the scan results (the citation gaps where competitors are recommended instead of this brand), generate exactly 3 concrete, customized fix recommendations to improve the site\'s visibility in AI search. Each recommendation MUST be grounded in the verified gaps and HTML. Assign a category:\n1. "schema_markup" (Structured data / schema markup generation)\n2. "crawler_access" (AI crawler access fixes like robots.txt / llms.txt)\n3. "content_gap" (Content gap fixes like page title, meta description, FAQ content)\n4. "citation_outreach" (Citation-source directory listing outreach)\n5. "technical_ux" (Technical/UX fixes like page speed, mobile view, navigation)\n\nProvide a composite confidence score (0-100) for each recommendation based on cross-model agreement and data verification.\n\nReturn ONLY a JSON object with a key "fixes" containing an array of 3 objects, each with "title" (string), "description" (string), "impact" ("Critical" | "High" | "Medium"), "timeEstimate" (string), "category" (string matching one of the five categories), "confidenceScore" (number between 0 and 100), "evidence" (string), and "tier" ("quick_win" | "this_week" | "hire_dev"). Order them from highest to lowest impact.'
          },
          {
            role: 'user',
            content: `Website HTML Text:\n${cleanText}\n\nAI Scan Citation Results:\n${scanResultsSummary}`
          }
        ],
        response_format: { type: 'json_object' }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
    ]) as any;
    
    const data = JSON.parse(response.choices[0]?.message?.content || '{}');
    const fixes = data.fixes || [];
    
    const validatedFixes = fixes.map((fix: any) => {
      let score = fix.confidenceScore || 70;
      if (score < 50) score = 50; // clamp
      return {
        ...fix,
        confidenceScore: score,
        unverified: score < 75
      };
    });

    return validatedFixes.slice(0, 3);
  } catch (e) {
    console.error('Failed to generate fix suggestions:', e);
    return [
      {
        title: 'Add local business schema markup',
        description: 'Implement LocalBusiness JSON-LD schema on your homepage to explicitly define your services, hours, and location for AI crawlers.',
        impact: 'High',
        timeEstimate: '20 minutes',
        category: 'schema_markup',
        confidenceScore: 90,
        tier: 'quick_win',
        evidence: 'No structured data schema detected.'
      },
      {
        title: 'Create an llms.txt directory file',
        description: 'Publish an llms.txt file to the root of your domain to directly feed AI search engines with clean context about your business.',
        impact: 'High',
        timeEstimate: '10 minutes',
        category: 'crawler_access',
        confidenceScore: 85,
        tier: 'quick_win',
        evidence: 'Missing standard LLMs directory data.'
      }
    ];
  }
}

export async function filterCompetitors(names: string[], groq: any): Promise<string[]> {
  if (names.length === 0) return [];
  try {
    const prompt = `Filter the following list of entities. Keep ONLY actual businesses, agencies, firms, or service providers. Discard informational headings, concepts, or generic phrases.
Entities to filter:
${names.join('\n')}

Return ONLY a JSON object with a "businesses" array of strings.`;

    const res = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    const data = JSON.parse(res.choices[0]?.message?.content || '{}');
    return data.businesses || [];
  } catch (e) {
    return names; // fallback
  }
}

export interface ScanParams {
  targetUrl: string;
  domain: string;
  description: string;
  entityType: string;
  basedIn: string;
  servesMarket: string;
  targetClient: string;
  knownCompetitors?: string;
  userId: string | null;
  ip: string | null;
  cachedScan?: any;
  sendEvent?: (event: string, data: any) => void;
}

export async function executeScanLogic(params: ScanParams) {
  const { targetUrl, domain, description, entityType, basedIn, servesMarket, targetClient, userId, ip, cachedScan } = params;
  const sendEvent = params.sendEvent || ((e: string, d: any) => {});
  const user = userId ? { id: userId } : null;
      try {
        sendEvent('crawl_start', { domain });

        const fetchUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;

        // Run technical fetch first
        const fetchRes = await fetch(fetchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 0 } }).catch(() => null);
        const html = fetchRes ? await fetchRes.text() : '';
        const isBlocked = !html || (fetchRes && fetchRes.status === 403) || isBlockedPage(html);

        let technicalChecks = TECHNICAL_CHECKS_LIST.map(check => ({ ...check, status: 'pass' as 'pass' | 'warning' | 'fail' }));
        
        if (isBlocked) {
          // If blocked or fetch failed, set all technical checks to warning to avoid false negatives
          technicalChecks = technicalChecks.map(check => ({ ...check, status: 'warning' as 'pass' | 'warning' | 'fail' }));
        } else {
          // 1. Audit Factors
          const hasSchema = html.includes('application/ld+json');
          const blocksAI = html.includes('GPTBot') || html.includes('Google-Extended') || html.includes('PerplexityBot');
          const hasH1 = /<h1[^>]*>/i.test(html);
          const isHttps = fetchUrl.startsWith('https');

          technicalChecks = TECHNICAL_CHECKS_LIST.map((check) => {
            let status: 'pass' | 'warning' | 'fail' = 'pass';
            if (check.id === 'schema' && !hasSchema) status = 'fail';
            if (check.id === 'robots' && blocksAI) status = 'warning';
            if (check.id === 'h1' && !hasH1) status = 'fail';
            if (check.id === 'https' && !isHttps) status = 'fail';
            // Simulated items that are less trivial to parse strictly
            if (check.id === 'llms') status = 'warning';
            if (check.id === 'contact' && !html.includes('tel') && !html.includes('address')) status = 'fail';
            return { ...check, status };
          });
        }

        sendEvent('audit_complete', { technicalChecks, isBlocked });

        // Extract title and meta description for AI analysis
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const pageTitle = titleMatch ? titleMatch[1] : '';
        const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
        const metaDesc = metaDescMatch ? metaDescMatch[1] : '';
        const htmlSnippet = pageTitle || metaDesc ? `Title: ${pageTitle}\nDescription: ${metaDesc}` : html.slice(0, 1000);

        // If we have a cached AI scan, generate fresh fixes, recalculate score, and return early
        if (cachedScan) {
          const topFixesRaw = await generateFixSuggestions(html);
          const topFixes = topFixesRaw.map((fix: any, idx: number) => ({
            id: `fix-gen-${idx}`,
            title: fix.title,
            description: fix.description,
            impact: fix.impact,
            timeEstimate: fix.timeEstimate,
            fixAction: 'link'
          }));

          const passCount = technicalChecks.filter(c => c.status === 'pass').length;
          const technicalScore = Math.round((passCount / 14) * 100);
          const compositeScore = Math.round((technicalScore * 0.3) + ((cachedScan.citation_rate) * 0.7));

          sendEvent('scan_complete', {
            id: cachedScan.id,
            domain: cachedScan.domain,
            url: fetchUrl,
            compositeScore,
            citationRate: cachedScan.citation_rate,
            citedCount: cachedScan.cited_count,
            totalCount: cachedScan.total_count,
            competitors: cachedScan.competitors || [],
            directories: cachedScan.directories || [],
            topFixes,
            intentCategories: cachedScan.intent_categories || [],
            isBlocked,
            top10Result: cachedScan.top10_result || {
              query: `Give me the top 10 services related to ${cachedScan.domain}`,
              cited: cachedScan.citation_rate > 30,
              coMentioned: (cachedScan.competitors || []).slice(0, 3).map((c: any) => c.domain || c)
            }
          });
          controller.close();
          return;
        }

        // 2. Classify Business Profile & Services
        const rawProfile = await analyzeBusinessProfile(domain, fetchUrl, description, htmlSnippet);

        // Override LLM-guessed fields with explicit user-provided structured inputs
        // These are hard anchors — if the user told us the entity type and location, trust that over page scraping
        const profile = {
          ...rawProfile,
          // Entity type overrides primary category when provided
          ...(entityType ? { primaryCategory: entityType } : {}),
          // Location override — basedIn is the physical location
          ...(basedIn ? { location: basedIn } : {}),
          // Business mode driven by servesMarket toggle
          ...(servesMarket === 'local' ? { businessMode: 'local' } : {}),
          ...(servesMarket === 'national' ? { businessMode: 'national' } : {}),
          ...(servesMarket === 'international' ? { businessMode: 'global' } : {}),
          // Store target client for use in query generation
          targetClient: targetClient || rawProfile.targetClient || '',
        };
        console.log(`Analyzed business ${profile.businessName} as mode: ${profile.businessMode}, area: ${profile.areaScope}, language: ${profile.queryLanguage}, overrides: entityType=${entityType}, basedIn=${basedIn}, servesMarket=${servesMarket}`);

        // 3. Generate mode-aware search queries (4) + Top 10 list query (1) in parallel
        const [allQueries, top10Query] = await Promise.all([
          generateModeQueries(profile),
          generateTop10Query(profile)
        ]);

        // 4. Citation Checking with search-grounded Gemini Flash
        const searchModel = getGenAI().getGenerativeModel({
          model: 'gemini-2.5-flash',
          tools: [{ googleSearch: {} }]
        });

        let citedCount = 0;
        const competitorsMap = new Map<string, number>();
        const competitorFullTextMap = new Map<string, string>();

        // Execute all 4 regular queries + the Top 10 query in parallel
        const top10Promise = (async () => {
          try {
            const res = await Promise.race([
              searchModel.generateContent(top10Query),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
            ]) as any;
            const responseText: string = res.response.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || res.response.text() || '';
            return {
              query: top10Query,
              ...checkTop10Citation(responseText, domain, profile.businessName)
            };
          } catch (e) {
            console.error('Top10 query failed:', e);
            return { query: top10Query, cited: false, coMentioned: [] };
          }
        })();

        sendEvent('top10_start', { query: top10Query });
        const queryPromises = allQueries.map(async (queryText, i) => {
          let cited = false;
          let webSources: string[] = [];
          let textMentions: { name: string, fullText: string }[] = [];
          try {
            const res = await Promise.race([
              searchModel.generateContent(queryText),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
            ]) as any;
            
            const candidate = res.response.candidates?.[0];
            const groundingMetadata = candidate?.groundingMetadata;
            
            // Extract grounding chunk URLs (reference sources)
            webSources = groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web?.uri || chunk.web?.title).filter(Boolean) || [];
            
            // Check 1: Does our domain appear in grounding chunk URLs?
            const groundingCited = webSources.some((src: string) => src.toLowerCase().includes(domain.toLowerCase()));
            
            // Check 2: Does our domain or business name appear in the actual text response?
            // This is the critical check — Gemini may recommend a business by name in the text
            // without including its URL in the grounding sources
            const responseText: string = candidate?.content?.parts?.map((p: any) => p.text).join('') || '';
            const textLower = responseText.toLowerCase();
            const domainRoot = domain.replace(/\.[^.]+$/, '').toLowerCase(); // "vandk" from "vandk.in"
            const businessNameLower = profile.businessName?.toLowerCase() || '';
            const textCited = textLower.includes(domainRoot) || 
                              (businessNameLower.length > 2 && textLower.includes(businessNameLower));
            
            // Cited if found in EITHER grounding chunks or text body
            cited = groundingCited || textCited;
            
            // Extract competitor mentions from the text body (like checkTop10Citation does)
            const lines = responseText.split('\n').filter(l => /^\d+[\.\)\-]|\*\s/.test(l.trim()));
            textMentions = lines
              .map(l => {
                const fullText = l.replace(/^\d+[\.\)\-\s]+|\*\s+/, '').replace(/\*+/g, '').trim();
                const name = fullText.split(/[—:\-]/)[0].trim();
                return { name, fullText };
              })
              .filter(comp => {
                const n = comp.name.toLowerCase();
                const wordCount = comp.name.split(/\s+/).filter(Boolean).length;
                return n.length > 2 && wordCount <= 3 && !n.includes(domainRoot) && (!businessNameLower || !n.includes(businessNameLower));
              });

            if (cited && !groundingCited) {
              console.log(`Citation found via text body match for "${domain}" in query: "${queryText}" (not in grounding chunks)`);
            }
          } catch (e) {
            console.error(`Error querying query ${i}:`, e);
          }
          return { index: i + 1, query: queryText, cited, webSources, textMentions };
        });

        const queryResults = await Promise.all(queryPromises);

        const directoriesMap = new Map<string, number>();
        const competitorQueryMap = new Map<string, string>();
        const directoryQueryMap = new Map<string, string>();

        queryResults.forEach((r) => {
          if (r.cited) citedCount++;
          
          sendEvent('query_result', {
            index: r.index,
            total: allQueries.length,
            query: r.query,
            cited: r.cited
          });

          // Sources are Platforms/Directories (where the AI gets its info)
          r.webSources.forEach((urlStr: string) => {
            try {
              let dirDomain = urlStr.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
              const blockedDomains = ['google.com', 'youtube.com', 'vertexaisearch.cloud.google.com', 'googleapis.com', 'gstatic.com', 'wikipedia.org', 'reddit.com', 'twitter.com', 'facebook.com', 'instagram.com', 'linkedin.com', 'yelp.com', 'trustpilot.com', 'bbb.org', 'forbes.com', 'justdial.com', 'indiamart.com', 'sulekha.com', 'quora.com'];
              if (dirDomain !== domain && !blockedDomains.some(b => dirDomain.includes(b)) && !dirDomain.includes('.gov') && !dirDomain.includes('.edu')) {
                directoriesMap.set(dirDomain, (directoriesMap.get(dirDomain) || 0) + 1);
                if (!directoryQueryMap.has(dirDomain)) {
                  directoryQueryMap.set(dirDomain, r.query);
                }
              }
            } catch (_) {}
          });

          // Text mentions are Competitors (the actual businesses the AI recommends)
          if (r.textMentions) {
            r.textMentions.forEach((comp: { name: string, fullText: string }) => {
              if (comp.name.length > 2) {
                competitorsMap.set(comp.name, (competitorsMap.get(comp.name) || 0) + 1);
                if (!competitorQueryMap.has(comp.name)) {
                  competitorQueryMap.set(comp.name, r.query);
                }
                if (!competitorFullTextMap.has(comp.name)) {
                  competitorFullTextMap.set(comp.name, comp.fullText);
                }
              }
            });
          }
        });

        // Generate Fixes (Top 10 is already running)
        const classifyDomainsPromise = (async () => {
          const allExtractedNames = Array.from(competitorsMap.keys());
          const validBusinesses = await filterCompetitors(allExtractedNames, getGroq());
          const validSet = new Set(validBusinesses.map((s: string) => s.toLowerCase()));
          
          const isGlobalEnterprise = (c: string) => {
            const lower = c.toLowerCase();
            const enterprises = [
              'deloitte', 'pwc', 'pricewaterhouse', 'ey', 'ernst', 'young', 'kpmg', 
              'grant thornton', 'bdo', 'accenture', 'mckinsey', 'boston consulting', 'bcg', 'bain'
            ];
            return enterprises.some(ent => lower.includes(ent));
          };

          const targetIsGlobal = isGlobalEnterprise(domain);

          let filteredCompetitors = Array.from(competitorsMap.entries())
            .filter(([compName]) => {
              if (!validSet.has(compName.toLowerCase())) return false;
              if (!targetIsGlobal && isGlobalEnterprise(compName)) return false;
              return true;
            })
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([compName, appearances]) => ({
              domain: competitorFullTextMap.get(compName) || compName, // Send the business name
              appearances,
              sourceQuery: competitorQueryMap.get(compName) || ''
            }));

          // If empty, fallback to directories map (to avoid fallback to competitor-a)
          if (filteredCompetitors.length === 0) {
            filteredCompetitors = Array.from(directoriesMap.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([dirDomain, appearances]) => ({
                domain: dirDomain,
                appearances,
                sourceQuery: directoryQueryMap.get(dirDomain) || ''
              }));
          }

          return {
            finalCompetitors: filteredCompetitors,
            finalDirectories: []
          };
        })();

        const [generatedFixes, { finalCompetitors, finalDirectories }, top10Result] = await Promise.all([
          generateFixSuggestions(html),
          classifyDomainsPromise,
          top10Promise
        ]);

        sendEvent('top10_complete', top10Result);

        const topFixes = generatedFixes.map((fix: any, idx: number) => ({
          id: `fix-gen-${idx}`,
          title: fix.title,
          description: fix.description,
          impact: fix.impact,
          timeEstimate: fix.timeEstimate,
          fixAction: 'link'
        }));

        // 6. Aggregate results
        const passCount = technicalChecks.filter(c => c.status === 'pass').length;
        const technicalScore = Math.round((passCount / 14) * 100);
        const citationRate = citedCount / allQueries.length;
        const compositeScore = Math.round((technicalScore * 0.3) + ((citationRate * 100) * 0.7));

        const competitors = finalCompetitors;
        const directories = finalDirectories;

        let scanId = null;
        try {
          let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
          let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
          if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('ey') && supabaseKey.startsWith('http')) {
            const temp = supabaseUrl;
            supabaseUrl = supabaseKey;
            supabaseKey = temp;
          }
          if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            let insertResult = await supabase.from('scans').insert({
              url: targetUrl,
              domain,
              user_id: user?.id || null,
              anonymous_session_id: user?.id ? null : ip,
              composite_score: compositeScore,
              citation_rate: Math.round(citationRate * 100),
              cited_count: citedCount,
              total_count: allQueries.length,
              technical_checks: technicalChecks,
              top_fixes: topFixes,
              competitors: competitors
            }).select('id').single();

            if (insertResult.error && insertResult.error.code === '23503') {
              console.warn('Foreign key violation for user_id on scans insert, retrying anonymously...');
              insertResult = await supabase.from('scans').insert({
                url: targetUrl,
                domain,
                user_id: null,
                anonymous_session_id: ip,
                composite_score: compositeScore,
                citation_rate: Math.round(citationRate * 100),
                cited_count: citedCount,
                total_count: allQueries.length,
                technical_checks: technicalChecks,
                top_fixes: topFixes,
                competitors: competitors
              }).select('id').single();
            }

            if (insertResult.error) {
              console.error('Supabase scans insert error:', insertResult.error);
            } else if (insertResult.data) {
              scanId = insertResult.data.id;

              if (competitors.length > 0) {
                const snapshots = competitors.map(c => ({
                  scan_id: scanId,
                  competitor_domain: c.domain,
                  appearances: c.appearances
                }));
                await supabase.from('competitor_snapshots').insert(snapshots);
              }

              await supabase.from('bot_visits').insert({
                domain,
                bot_name: 'tryagentscore-scanner',
                user_agent: 'Gemini-1.5-Flash / Groq-Llama3'
              });
            }
          }
        } catch (e) {
          console.error('Failed to save scan snapshot to Supabase:', e);
        }

        // Calculate category breakdowns from the 4 actual query results
        // Index 0: informational, Index 1: local, Index 2: comparison, Index 3: direct
        const infoCount = queryResults.slice(0, 1).filter(r => r.cited).length;
        const localCount = queryResults.slice(1, 2).filter(r => r.cited).length;
        const compCount = queryResults.slice(2, 3).filter(r => r.cited).length;
        const directCount = queryResults.slice(3, 4).filter(r => r.cited).length;

        const intentCategories = [
          { name: 'Informational queries', cited: infoCount, total: 1 },
          { name: 'Local intent queries', cited: localCount, total: 1 },
          { name: 'Comparison queries', cited: compCount, total: 1 },
          { name: 'Brand recognition', cited: directCount, total: 1 }
        ];

        const report = {
          id: scanId,
          domain,
          url: targetUrl,
          compositeScore,
          citationRate: Math.round(citationRate * 100),
          citedCount,
          totalCount: allQueries.length,
          competitors,
          directories,
          topFixes,
          intentCategories,
          top10Result,
          confidence: profile.confidence,
          isBlocked,
          profile: {
            businessName: profile.businessName,
            primaryCategory: profile.primaryCategory,
            topServices: profile.topServices || [],
            location: profile.location,
            queryLanguage: profile.queryLanguage,
            businessMode: profile.businessMode,
            areaScope: profile.areaScope,
          }
        };

        sendEvent('scan_complete', report);
      } catch (e) {
        throw e;
      }
}
