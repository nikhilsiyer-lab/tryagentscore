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
function getGroq() {
  if (!groqInstance) {
    groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build' });
  }
  return groqInstance;
}

export const runtime = 'edge';
export const maxDuration = 60; // Allow function to run up to 60s for Hobby tier
export const dynamic = 'force-dynamic';

// 14 Technical Factors
const TECHNICAL_CHECKS_LIST = [
  { id: 'schema', name: 'Schema markup detected', description: 'JSON-LD schema gives AI tools explicit definitions.' },
  { id: 'ssr', name: 'Page renders without JavaScript', description: 'Ensures bots without JS engines can read content.' },
  { id: 'llms', name: 'No llms.txt file found', description: 'Missing standard LLMs directory data.' },
  { id: 'robots', name: 'robots.txt blocks some AI crawlers', description: 'Blocking prevents indexation by some AI tools.' },
  { id: 'contact', name: 'No structured contact information', description: 'AI struggles to find businesses without clear address/phone.' },
  { id: 'freshness', name: 'Fresh content (updated within 90 days)', description: 'Recent updates prioritize your relevance.' },
  { id: 'h1', name: 'Single H1 Header Tag', description: 'Clear topic declaration.' },
  { id: 'hierarchy', name: 'Logical Heading Hierarchy', description: 'Easy parsing for scrapers.' },
  { id: 'meta-title', name: 'Meta Title Length & Relevance', description: 'Contextual understanding.' },
  { id: 'meta-desc', name: 'Meta Description Length', description: 'Summary snippet.' },
  { id: 'alt-text', name: 'Alt Text Coverage', description: 'Multimodal image understanding.' },
  { id: 'faq', name: 'No FAQ schema implemented', description: 'Limits direct question answering.' },
  { id: 'speed', name: 'Page Speed (LCP) acceptable', description: 'Prevents crawler timeouts.' },
  { id: 'https', name: 'HTTPS Enforced', description: 'Secure connections allowed.' }
];

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

async function analyzeBusinessProfile(domain: string, targetUrl: string, descriptionOverride?: string, htmlSnippet?: string) {
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

async function generateModeQueries(profile: any) {
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

async function generateTop10Query(profile: any): Promise<string> {
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
function checkTop10Citation(responseText: string, domain: string, businessName: string): { cited: boolean; coMentioned: string[] } {
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
      return n.length > 2 && !n.includes(domainRoot) && !n.includes(nameNorm);
    })
    .slice(0, 5);

  return { cited, coMentioned };
}

async function generateFixSuggestions(htmlContent: string) {
  try {
    const cleanText = cleanHtmlText(htmlContent).substring(0, 3000);
    const response = await Promise.race([
      getGroq().chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO and AI-visibility expert. Based on the website text, generate exactly 3 concrete, customized fix recommendations to improve the site\'s visibility in AI search. For each fix, assign a "tier": "quick_win" (owner can do it themselves in under 1 hour), "this_week" (owner-level task taking a few days), or "hire_dev" (requires a developer or agency). Return ONLY a JSON object with a key "fixes" containing an array of 3 objects, each with "title" (string), "description" (string), "impact" ("Critical" | "High" | "Medium"), "timeEstimate" (string), and "tier" ("quick_win" | "this_week" | "hire_dev"). Order them from highest to lowest impact.'
          },
          {
            role: 'user',
            content: cleanText
          }
        ],
        response_format: { type: 'json_object' }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 6000))
    ]) as any;
    
    const data = JSON.parse(response.choices[0]?.message?.content || '{}');
    const fixes = data.fixes || [];
    return fixes.slice(0, 3);
  } catch (e) {
    console.error('Failed to generate fix suggestions:', e);
    return [
      {
        title: 'Add an llms.txt file',
        description: 'Publish an llms.txt file to the root of your domain to directly feed AI tools with context about your business.',
        impact: 'High',
        timeEstimate: '10 minutes',
        fixAction: 'llms',
        tier: 'quick_win'
      }
    ];
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const targetUrl = searchParams.get('url');
  const description = searchParams.get('description') || '';
  const businessType = searchParams.get('businessType') || '';
  const entityType = searchParams.get('entityType') || '';
  const basedIn = searchParams.get('basedIn') || '';
  const servesMarket = searchParams.get('servesMarket') || 'local'; // 'local' | 'national' | 'international'
  const targetClient = searchParams.get('targetClient') || '';
  const honeypot = searchParams.get('honeypot') || '';
  const isBotParam = searchParams.get('isBot') === 'true';

  // 1. Guardrails: Bot Rejection
  if (honeypot || isBotParam) {
    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  }

  const user = await getCurrentUser();
  const isPro = user?.isPro || false;

  // 2. Guardrails: Tiered Throttle Skeleton (Bypassed for Pro users)
  if (!isPro) {
    // In a real app, read from Redis/DB: const budgetConsumed = await getDailyBudgetPercent();
    const budgetConsumed = 0.5; // Mock 50% consumed
    if (budgetConsumed > 0.9) {
      // If we're at 90%+, reject real-time scan and route to batch queue
      return NextResponse.json({ 
        error: 'viral_spike',
        message: 'We are experiencing a viral spike. Your scan has been queued for batch processing and results will be ready soon.'
      }, { status: 429 });
    }
  }

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let domain = targetUrl.replace(/^(https?:\/\/)?(www\.)?/, '');
  domain = domain.split('/')[0];

  const ip = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1';

  // Quick Supabase check for Cache and IP Rate Limit
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  let cachedScan: any = null;

  if (supabaseUrl && supabaseKey) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!isPro) {
      // 1. IP Rate Limiting (max 3 per day for anonymous)
      const { count } = await supabase
        .from('scans')
        .select('*', { count: 'exact', head: true })
        .eq('anonymous_session_id', ip)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      if (count && count >= 3) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please create a free account to continue scanning.' }, { status: 429 });
      }

      // 2. Domain Caching (72h)
      // We skip caching if user is Pro (they get fresh scans)
      const { data: cacheHit } = await supabase
        .from('scans')
        .select('*')
        .eq('domain', domain)
        .gte('created_at', new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (cacheHit) {
        cachedScan = cacheHit;
      }
    }
  }

  // Check key requirements immediately
  if (!process.env.GEMINI_API_KEY || !process.env.GROQ_API_KEY) {
    return new Response(JSON.stringify({ 
      error: 'API Keys missing. Please configure GEMINI_API_KEY and GROQ_API_KEY in your environment.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }



  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

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
                return n.length > 2 && !n.includes(domainRoot) && (!businessNameLower || !n.includes(businessNameLower));
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
              const blockedDomains = ['google.com', 'youtube.com', 'vertexaisearch.cloud.google.com', 'googleapis.com', 'gstatic.com', 'wikipedia.org', 'reddit.com', 'twitter.com', 'facebook.com', 'instagram.com', 'linkedin.com'];
              if (dirDomain !== domain && !blockedDomains.some(b => dirDomain.includes(b))) {
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
        const classifyDomainsPromise = Promise.resolve({
          finalCompetitors: Array.from(competitorsMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([compName, appearances]) => ({
              domain: competitorFullTextMap.get(compName) || compName, // Send the full text response to the UI
              appearances,
              sourceQuery: competitorQueryMap.get(compName) || ''
            })),
          finalDirectories: Array.from(directoriesMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([dirDomain, appearances]) => ({
              domain: dirDomain,
              appearances,
              sourceQuery: directoryQueryMap.get(dirDomain) || ''
            }))
        });

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
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
          if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            const { data, error } = await supabase.from('scans').insert({
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

            if (error) {
              console.error('Supabase scans insert error:', error);
            } else if (data) {
              scanId = data.id;

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
      } catch (err: any) {
        console.error('Scan routing error:', err);
        sendEvent('error', { message: err.message || 'Internal server error during scan' });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
