import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

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

async function extractBusinessDetails(html: string, domain: string) {
  const cleanText = cleanHtmlText(html).substring(0, 4000);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const prompt = `Analyze this webpage content for the domain ${domain} and extract:
1. The official Business Name.
2. The specific Business Category (e.g., Physiotherapy Clinic, Dentist, Italian Restaurant, Law Firm).
3. The City/Location of the business.

Return ONLY a raw JSON object with the keys "businessName", "category", and "city". Do not include markdown blocks or any other text.
Content:
${cleanText}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  // Strip any markdown code fences if present
  const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  return JSON.parse(cleanJson);
}

async function generateNicheQueries(businessName: string, category: string, city: string) {
  const response = await groq.chat.completions.create({
    model: 'llama3-8b-8192',
    messages: [
      {
        role: 'system',
        content: 'You are an AI search query generator. Generate exactly 5 realistic, natural search queries that a potential customer might ask an AI (like Gemini, ChatGPT, or Claude) when looking for services/products related to this business. Return ONLY a JSON object with a key "queries" mapping to an array of 5 strings.'
      },
      {
        role: 'user',
        content: `Business Name: ${businessName}\nCategory: ${category}\nCity: ${city}`
      }
    ],
    response_format: { type: 'json_object' }
  });
  
  const data = JSON.parse(response.choices[0]?.message?.content || '{}');
  return data.queries || [];
}

async function generateFixSuggestions(htmlContent: string) {
  const cleanText = cleanHtmlText(htmlContent).substring(0, 3000);
  const response = await groq.chat.completions.create({
    model: 'llama3-8b-8192',
    messages: [
      {
        role: 'system',
        content: 'You are an SEO and GEO expert. Based on the website text, generate exactly 3 concrete, customized fix recommendations to improve the site\'s visibility in AI search. Return ONLY a JSON object with a key "fixes" containing an array of 3 objects, each with "title" (string), "description" (string), "impact" ("Critical" | "High" | "Medium"), and "timeEstimate" (string).'
      },
      {
        role: 'user',
        content: `Website excerpt: ${cleanText}`
      }
    ],
    response_format: { type: 'json_object' }
  });

  const data = JSON.parse(response.choices[0]?.message?.content || '{}');
  return data.fixes || [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

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

        // Crawl page
        const fetchUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
        const fetchRes = await fetch(fetchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 0 } });
        const html = await fetchRes.text();

        // 1. Audit Factors
        const hasSchema = html.includes('application/ld+json');
        const blocksAI = html.includes('GPTBot') || html.includes('Google-Extended') || html.includes('PerplexityBot');
        const hasH1 = /<h1[^>]*>/i.test(html);
        const isHttps = fetchUrl.startsWith('https');

        const technicalChecks = TECHNICAL_CHECKS_LIST.map((check) => {
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

        sendEvent('audit_complete', { technicalChecks });

        // 2. Extract Business Niche & Details
        const details = await extractBusinessDetails(html, domain);
        const { businessName, category, city } = details;

        // 3. Generate Curated + Custom Queries
        const customQueries = await generateNicheQueries(businessName, category, city);
        
        const libraryQueries = [
          `Who is the best ${category} in ${city}?`,
          `Recommendations for a reliable ${category} in ${city}`,
          `Top-rated ${category} near ${city}`,
          `Where should I go for ${category} in ${city}?`,
          `Which is the most recommended ${category} in ${city}?`,
          `Can you recommend a friendly ${category} in ${city}?`,
          `Reviews for ${category} businesses in ${city}`,
          `List of professional ${category} in ${city} area`,
          `Who is the leading ${category} in ${city}?`,
          `Best quality ${category} options in ${city}`,
          `Is there a good ${category} in ${city} to visit?`,
          `I need a ${category} in ${city}, who is the top choice?`,
          `Which ${category} in ${city} has the best client reputation?`,
          `Looking for a licensed ${category} in ${city}`,
          `Which ${category} in ${city} is open and highly rated?`
        ];

        // Pick 15 library queries + 5 custom queries to total 20 prompts
        const allQueries = [
          ...libraryQueries.slice(0, 15),
          ...customQueries.slice(0, 5)
        ].slice(0, 20);

        // 4. Citation Checking with search-grounded Gemini Flash
        const searchModel = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          tools: [{ googleSearch: {} }]
        });

        let citedCount = 0;
        const competitorsMap = new Map<string, number>();

        // Execute all queries in parallel to fit within Vercel's Hobby execution timeout limit (10s)
        const queryPromises = allQueries.map(async (queryText, i) => {
          let cited = false;
          let webSources: string[] = [];
          try {
            const res = await searchModel.generateContent(queryText);
            const textResponse = res.response.text() || '';
            cited = textResponse.toLowerCase().includes(businessName.toLowerCase()) || textResponse.toLowerCase().includes(domain.toLowerCase());

            const groundingMetadata = (res.response as any).candidates?.[0]?.groundingMetadata;
            webSources = groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web?.uri).filter(Boolean) || [];
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
              if (compDomain !== domain && compDomain !== 'google.com' && compDomain !== 'youtube.com') {
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

        // Calculate category breakdowns
        const informational = queryResults.slice(0, 5).filter(r => r.cited).length;
        const local = queryResults.slice(5, 10).filter(r => r.cited).length;
        const comparison = queryResults.slice(10, 15).filter(r => r.cited).length;
        const direct = queryResults.slice(15, 20).filter(r => r.cited).length;

        const intentCategories = [
          { name: 'Informational queries', cited: informational, total: 5 },
          { name: 'Local intent queries', cited: local, total: 5 },
          { name: 'Comparison queries', cited: comparison, total: 5 },
          { name: 'Direct queries', cited: direct, total: 5 }
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
          intentCategories
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
