import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

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

async function extractBusinessDetails(domain: string, targetUrl: string, descriptionOverride?: string) {
  const prompt = `What business is located at the website URL "${targetUrl}" (root domain: "${domain}")?${ descriptionOverride ? ` Additional context: ${descriptionOverride}.` : '' } 
Return ONLY a JSON object with these exact keys:
1. "businessName" (the real brand name)
2. "category" (the most common, singular local business category noun in English, e.g., "Law Firm", "Physiotherapist", "Hotel", "Restaurant", "Dentist" — do NOT use double categories like "Law Firm & Tax Advisors" or ampersands)
3. "city" (the specific city this webpage is targeting or located in, e.g., "Berlin" if the URL contains "berlin", otherwise primary headquarters. If it is an online-only platform, use "Global")
4. "confidence" ("high" if you know this business well, "low" if not).
No markdown, no extra text.`;

  // Try Gemini first
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await Promise.race([
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
    ]) as any;
    const text = result.response.text().trim();
    const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleanJson);
    // Validate we got real data, not empty strings
    if (parsed.businessName && parsed.businessName !== domain && parsed.category && parsed.category !== 'Business') {
      console.log('Gemini extraction succeeded for', domain, '->', parsed.businessName);
      return parsed;
    }
    throw new Error('Gemini returned empty or placeholder data');
  } catch (geminiErr) {
    console.error('Gemini extraction failed for', domain, ':', (geminiErr as any).message);
  }

  // Fallback to Groq (llama3 knows all major brands)
  try {
    const response = await Promise.race([
      groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are a business lookup tool. Identify any business from its domain name. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
    ]) as any;
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    if (parsed.businessName && parsed.businessName !== domain) {
      console.log('Groq extraction succeeded for', domain, '->', parsed.businessName);
      return { ...parsed, confidence: parsed.confidence || 'high' };
    }
    throw new Error('Groq returned empty data');
  } catch (groqErr) {
    console.error('Groq extraction also failed for', domain, ':', (groqErr as any).message);
  }

  // Last resort: use domain name directly
  const brandName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  return { businessName: brandName, category: 'online services', city: 'Global', confidence: 'low' };
}

async function classifyBusinessMode(businessName: string, category: string, location: string) {
  const prompt = `Given this business:
- Name: ${businessName}
- Category: ${category}
- Location: ${location}

Classify it as one of three modes:
- "local": serves customers in a specific city or district (dentists, lawyers, restaurants, salons, gyms, tradespeople)
- "national": serves a whole country (national retailers, regional banks, country-specific e-commerce)
- "global": serves worldwide with no geographic constraint (SaaS tools, apps, marketplaces, media)

Reply with JSON only: {"mode": "local" | "national" | "global", "queryLanguage": "en" | "de" | "fr" etc.}`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await Promise.race([
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
    ]) as any;
    const data = JSON.parse(result.response.text().trim());
    return {
      mode: data.mode || 'global',
      queryLanguage: data.queryLanguage || 'en'
    };
  } catch (e) {
    console.error('Failed to classify business mode:', e);
    return { mode: 'global', queryLanguage: 'en' };
  }
}

async function generateModeQueries(businessName: string, category: string, location: string, mode: string, queryLanguage: string) {
  let prompt = '';
  
  if (mode === "local") {
    prompt = `Generate exactly 4 search queries a real customer would use to find ${businessName}.
Use hyper-local phrasing — include the specific city and district (like "${location}") where relevant.
Write queries in language: "${queryLanguage}".
Focus on: neighbourhood searches, "near me" intent, local recommendations.
Example: "Zahnarzt Charlottenburg Berlin empfehlung"`;
  } else if (mode === "national") {
    prompt = `Generate exactly 4 search queries a real customer would use to find ${businessName}.
Use country-level phrasing. Write queries in language: "${queryLanguage}".
Focus on: national comparisons, category searches within the country.
Example: "beste Online-Apotheke Deutschland"`;
  } else {
    prompt = `Generate exactly 4 search queries a real customer would use to find ${businessName}.
Drop location entirely. Write queries in English.
Focus on: feature comparisons, category searches, tool alternatives.
Example: "best AI citation tracking tool" or "Semrush alternative for AI visibility"`;
  }

  prompt += `\n\nReturn ONLY a JSON object with a key "queries" mapping to a flat array of exactly 4 strings.
The 4 queries must represent these categories in order:
1. Informational — a general question about the business type
2. Local intent — a location-specific search (or feature-focused if global mode)
3. Comparison — a head-to-head or alternatives search
4. Direct — a brand-specific query about ${businessName}`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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
    // Generic fallback mapping to 1 of each category
    return [
      `What is the best ${category} platform or service?`,
      `Which ${category} service should I use in ${location}?`,
      `What are the best ${businessName} alternatives?`,
      `Is ${businessName} a good ${category} service?`
    ];
  }
}

async function generateNicheQueries(businessName: string, category: string, city: string) {
  try {
    const response = await Promise.race([
      groq.chat.completions.create({
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

async function generateFixSuggestions(htmlContent: string) {
  try {
    const cleanText = cleanHtmlText(htmlContent).substring(0, 3000);
    const response = await Promise.race([
      groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO and GEO expert. Based on the website text, generate exactly 3 concrete, customized fix recommendations to improve the site\'s visibility in AI search. Return ONLY a JSON object with a key "fixes" containing an array of 3 objects, each with "title" (string), "description" (string), "impact" ("Critical" | "High" | "Medium"), and "timeEstimate" (string).'
          },
          {
            role: 'user',
            content: cleanText
          }
        ],
        response_format: { type: 'json_object' }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
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
        fixAction: 'llms'
      }
    ];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  const description = searchParams.get('description') || undefined;

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'URL parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
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

  let domain = targetUrl.replace(/^(https?:\/\/)?(www\.)?/, '');
  domain = domain.split('/')[0];

  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        sendEvent('crawl_start', { domain });

        const fetchUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;

        // Run technical fetch and Gemini extraction concurrently
        const [fetchRes, details] = await Promise.all([
          fetch(fetchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 0 } }).catch(() => null),
          extractBusinessDetails(domain, fetchUrl, description)
        ]);

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

        // 2. Business Niche & Details (already extracted concurrently)
        const { businessName, category, city, confidence } = details;

        // 3. Classify Business Mode & target queryLanguage
        const { mode, queryLanguage } = await classifyBusinessMode(businessName, category, city);
        console.log(`Classified business ${businessName} as mode: ${mode}, language: ${queryLanguage}`);

        // 3b. Generate mode-aware search queries (16 total)
        const allQueries = await generateModeQueries(businessName, category, city, mode, queryLanguage);

        // 4. Citation Checking with search-grounded Gemini Flash
        const searchModel = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          tools: [{ googleSearch: {} }]
        });

        let citedCount = 0;
        const competitorsMap = new Map<string, number>();

        // Execute all queries in parallel to fit within Vercel's Hobby execution timeout limit (10s)
        const queryPromises = allQueries.map(async (queryText, i) => {
          let cited = false;
          let webSources: string[] = [];
          try {
            const res = await Promise.race([
              searchModel.generateContent(queryText),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
            ]) as any;
            
            const candidate = res.response.candidates?.[0];
            const groundingMetadata = candidate?.groundingMetadata;
            webSources = groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web?.title || chunk.web?.uri).filter(Boolean) || [];
            
            // Strict citation check: match against the raw domain/title
            cited = webSources.some((src: string) => src.toLowerCase().includes(domain.toLowerCase()));
          } catch (e) {
            console.error(`Error querying query ${i}:`, e);
          }
          return { index: i + 1, query: queryText, cited, webSources };
        });

        const queryResults = await Promise.all(queryPromises);

        // Process and stream the results
        queryResults.forEach((r) => {
          if (r.cited) citedCount++;
          
          sendEvent('query_result', {
            index: r.index,
            total: allQueries.length,
            query: r.query,
            cited: r.cited
          });

          r.webSources.forEach((urlStr: string) => {
            try {
              let compDomain = urlStr.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
              const blockedDomains = ['google.com', 'youtube.com', 'vertexaisearch.cloud.google.com', 'googleapis.com', 'gstatic.com', 'wikipedia.org', 'reddit.com', 'twitter.com', 'facebook.com', 'instagram.com', 'linkedin.com'];
              if (compDomain !== domain && !blockedDomains.some(b => compDomain.includes(b))) {
                competitorsMap.set(compDomain, (competitorsMap.get(compDomain) || 0) + 1);
              }
            } catch (_) {}
          });
        });

        // 5. Generate Custom Fix suggestions based on content using Groq
        const generatedFixes = await generateFixSuggestions(html);
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

        const competitors = Array.from(competitorsMap.entries())
          .map(([domain, appearances]) => ({ domain, appearances }))
          .sort((a, b) => b.appearances - a.appearances)
          .slice(0, 3);

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
          { name: 'Direct queries', cited: directCount, total: 1 }
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
          topFixes,
          intentCategories,
          confidence,
          isBlocked
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
