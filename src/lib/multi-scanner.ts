import { searchTavily } from './tavily';
import { askChatGPT, askPerplexity, askGemini } from './multi-llm';

import {
  analyzeBusinessProfile,
  generateModeQueries,
  generateTop10Query,
  checkTop10Citation,
  generateFixSuggestions,
  filterCompetitors,
  TECHNICAL_CHECKS_LIST,
  ScanParams,
  getGroq
} from './scanner';

const isBlockedPage = (html: string) => {
  const signals = [
    'cloudflare', 'please verify you are a human', 'access denied',
    'security check', 'captcha', 'unusual traffic', 'automated requests'
  ];
  return signals.some(s => html.toLowerCase().includes(s));
}

const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([
    promise.then(res => { clearTimeout(timeoutId); return res; }),
    timeoutPromise
  ]);
};

function determineReasonTag(cited: boolean, promptType: string, checks: any[]) {
  if (cited) {
    const hasSchema = checks.find(c => c.id === 'schema' && c.status === 'pass');
    return hasSchema ? 'strong_faq' : 'other';
  } else {
    const noSchema = checks.find(c => c.id === 'schema' && c.status === 'fail');
    if (noSchema) return 'missing_schema';
    if (promptType === 'comparison') return 'no_comparison_page';
    if (promptType === 'local_intent') return 'no_reviews_content';
    return 'thin_content';
  }
}

export async function executeMultiLLMScanLogic(params: ScanParams) {
  const { targetUrl, domain, description, entityType, basedIn, servesMarket, targetClient, knownCompetitors, userId, ip, cachedScan } = params;
  const sendEvent = params.sendEvent || ((e: string, d: any) => {});
  const user = userId ? { id: userId } : null;

  try {
    sendEvent('crawl_start', { domain });

    const fetchUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
    const fetchRes = await fetch(fetchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 0 } }).catch(() => null);
    const html = fetchRes ? await fetchRes.text() : '';
    const isBlocked = !html || (fetchRes && fetchRes.status === 403) || isBlockedPage(html);

    let technicalChecks = TECHNICAL_CHECKS_LIST.map(check => ({ ...check, status: 'pass' as 'pass' | 'warning' | 'fail' }));
    if (isBlocked) {
      technicalChecks = technicalChecks.map(check => ({ ...check, status: 'warning' as 'pass' | 'warning' | 'fail' }));
    } else {
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
        if (check.id === 'llms') status = 'warning';
        if (check.id === 'contact' && !html.includes('tel') && !html.includes('address')) status = 'fail';
        return { ...check, status };
      });
    }

    sendEvent('audit_complete', { technicalChecks, isBlocked });

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';
    const htmlSnippet = `Title: ${title}\nDescription: ${metaDesc}`;

    sendEvent('profile_start', { domain });
    const rawProfile = await analyzeBusinessProfile(domain, fetchUrl, description, htmlSnippet);
    const profile = {
      ...rawProfile,
      ...(entityType ? { primaryCategory: entityType } : {}),
      ...(basedIn ? { location: basedIn } : {}),
      ...(servesMarket === 'local' ? { businessMode: 'local' } : {}),
      ...(servesMarket === 'national' ? { businessMode: 'national' } : {}),
      ...(servesMarket === 'international' ? { businessMode: 'global' } : {}),
      targetClient: targetClient || rawProfile.targetClient || '',
      knownCompetitors: knownCompetitors || '',
    };
    sendEvent('profile_complete', profile);

    const [allQueries, top10Query] = await Promise.all([
      generateModeQueries(profile),
      generateTop10Query(profile)
    ]);

    // Top 10 Query logic across 3 LLMs using Tavily
    const top10Promise = (async () => {
      try {
        const tavilyRes = await withTimeout(searchTavily(top10Query, domain), 15000, { results: [], contextText: '', cited: false });
        const [gptRes, perplexityRes, geminiRes] = await Promise.all([
          withTimeout(askChatGPT(top10Query, tavilyRes.contextText), 20000, '').catch(() => ''),
          withTimeout(askPerplexity(top10Query), 20000, '').catch(() => ''),
          withTimeout(askGemini(top10Query), 20000, '').catch(() => '')
        ]);
        
        const gptCitation = checkTop10Citation(gptRes, domain, profile.businessName);
        const perplexityCitation = checkTop10Citation(perplexityRes, domain, profile.businessName);
        const geminiCitation = checkTop10Citation(geminiRes, domain, profile.businessName);

        return {
          query: top10Query,
          chatgpt: { ...gptCitation, responseText: gptRes },
          perplexity: { ...perplexityCitation, responseText: perplexityRes },
          gemini: { ...geminiCitation, responseText: geminiRes }
        };
      } catch (e) {
        return { query: top10Query, chatgpt: { cited: false }, perplexity: { cited: false }, gemini: { cited: false } };
      }
    })();

    sendEvent('top10_start', { query: top10Query });

    let geminiCitedCount = 0;
    let chatgptCitedCount = 0;
    let perplexityCitedCount = 0;
    
    // Competitor tracking per LLM
    const chatgptMentions: string[] = [];
    const perplexityMentions: string[] = [];
    const geminiMentions: string[] = [];

    // Run parallel queries
    const queryPromises = allQueries.map(async (queryText, i) => {
      try {
        const tavilyRes = await withTimeout(searchTavily(queryText, domain), 15000, { results: [], contextText: '', cited: false });
        
        const [gptRes, perplexityRes, geminiRes] = await Promise.all([
          withTimeout(askChatGPT(queryText, tavilyRes.contextText), 20000, '').catch(() => ''),
          withTimeout(askPerplexity(queryText), 20000, '').catch(() => ''),
          withTimeout(askGemini(queryText), 20000, '').catch(() => '')
        ]);

        const extractBusinessesWithGroq = async (text: string) => {
          if (!text || text.length < 10) return [];
          let extracted: string[] = [];
          try {
            const prompt = `Extract all actual competing business names, companies, agencies, or firms mentioned in the following text. 

CRITICAL RULES:
1. Do NOT extract the user's own business: "${profile.businessName}" (or any similar spelling variations like "${domain}").
2. Do NOT extract aggregator sites, review directories, or social networks (e.g., Tripadvisor, Yelp, Facebook, Instagram, Google, Just Eat, Delivery Hero, Uber Eats, Foursquare).
3. Do NOT extract services, headings, informational concepts, or generic phrases.
4. EXTREMELY IMPORTANT: Do NOT extract professions/roles (e.g., "Chartered Accountant", "Consultant", "Auditor") or locations/cities (e.g., "Bangalore", "London", "New York"). Only extract actual specific company names or brand names.
5. EXTREMELY IMPORTANT: Do NOT extract government bodies, regulatory authorities, or software tools (e.g., "Registrar of Companies", "ROC", "IRS", "QuickBooks", "Xero", "GST Portal").

Text:
${text}

Return ONLY a JSON object with a "businesses" array of strings.`;
            const res = await withTimeout(getGroq().chat.completions.create({
              model: 'llama-3.1-8b-instant',
              messages: [{ role: 'user', content: prompt }],
              response_format: { type: 'json_object' }
            }), 10000, null);
            if (res) {
              const data = JSON.parse(res.choices[0]?.message?.content || '{}');
              extracted = data.businesses || [];
            }
          } catch (e) {
            console.error('Groq competitor extraction failed, using regex fallback:', e);
          }

          // Regex fallback if Groq call failed or returned empty results
          if (extracted.length === 0) {
            const boldRegex = /\*\*(.*?)\*\*/g;
            let match;
            const seen = new Set<string>();
            const blacklist = [
              'taxation', 'financial consulting', 'accounting', 'auditing', 'tax services', 
              'chartered accountant', 'consultant', 'auditor', 'bangalore', 'india', 
              'best ca firm', 'gst', 'income tax', 'vat', 'tds', 'registrar of companies', 'roc'
            ];
            
            while ((match = boldRegex.exec(text)) !== null) {
              const name = match[1].trim();
              const lower = name.toLowerCase();
              
              const hasCapital = /[A-Z]/.test(name);
              const isGeneric = blacklist.some(term => lower.includes(term)) || lower.length < 3;
              const isOwnBrand = (profile.businessName && lower.includes(profile.businessName.toLowerCase())) || 
                                 lower.includes(domain.replace(/\.[^.]+$/, '').toLowerCase());
              
              if (hasCapital && !isGeneric && !isOwnBrand && !seen.has(lower)) {
                seen.add(lower);
                extracted.push(name);
              }
            }
          }
          return extracted;
        };

        const [gptMentions, pxMentions, gmMentions] = (i < 3) ? await Promise.all([
          extractBusinessesWithGroq(gptRes),
          extractBusinessesWithGroq(perplexityRes),
          extractBusinessesWithGroq(geminiRes)
        ]) : [[], [], []];

        if (i < 3) {
          chatgptMentions.push(...gptMentions);
          perplexityMentions.push(...pxMentions);
          geminiMentions.push(...gmMentions);
        }

        const isCited = (text: string) => {
          if (!text) return false;
          const t = text.toLowerCase();
          const NEGATIVE_PATTERNS = [
            'no widely recognized',
            'no record of',
            'cannot identify',
            'not find any information',
            'no information available',
            'does not seem to exist',
            'does not exist',
            'unable to find',
            'is not a recognized',
            'not a known tool',
            'no widely known',
            'no such tool',
            'referred to as',
            'might be referred to',
            'referred to',
            'did you mean',
            'misspelling of'
          ];
          if (NEGATIVE_PATTERNS.some(pat => t.includes(pat))) {
            return false;
          }
          if (profile.businessName && t.includes(profile.businessName.toLowerCase())) return true;
          
          const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, '').toLowerCase();
          const normText = normalize(text);
          const normDomain = normalize(domain.replace(/\.[^.]+$/, ''));
          const normName = profile.businessName ? normalize(profile.businessName) : '';
          
          if (normDomain.length > 4 && normText.includes(normDomain)) return true;
          if (normName.length > 4 && normText.includes(normName)) return true;
          
          if (profile.businessName) {
            const words = profile.businessName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
            if (words.length >= 2) {
              const matchCount = words.filter(w => t.includes(w)).length;
              if (matchCount >= 2) return true;
            }
          }
          return false;
        };

        const gptCited = tavilyRes.cited || isCited(gptRes);
        const perplexityCited = tavilyRes.cited || isCited(perplexityRes);
        const geminiCited = tavilyRes.cited || isCited(geminiRes);

        if (gptCited) chatgptCitedCount++;
        if (perplexityCited) perplexityCitedCount++;
        if (geminiCited) geminiCitedCount++;

        sendEvent('query_result', {
          index: i + 1,
          total: allQueries.length,
          query: queryText,
          cited: geminiCited // Default to gemini for progress bar
        });

        return { 
          index: i + 1, 
          query: queryText, 
          tavilyCited: tavilyRes.cited,
          webSources: (tavilyRes.results || []).slice(0, 5).map((r: any) => ({ url: r.url, title: r.title })),
          gptCited, perplexityCited, geminiCited,
          responses: {
            chatgpt: gptRes,
            perplexity: perplexityRes,
            gemini: geminiRes
          },
          gptMentions, pxMentions, gmMentions
        };
      } catch (e) {
        return { index: i + 1, query: queryText, gptCited: false, perplexityCited: false, geminiCited: false };
      }
    });

    const queryResults = await Promise.all(queryPromises);

    const filterAllCompetitors = async () => {
      const isDirectory = (c: string) => {
        const lower = c.toLowerCase();
        return lower.includes('tripadvisor') || lower.includes('yelp') || lower.includes('facebook') || 
               lower.includes('instagram') || lower.includes('google') || lower.includes('just eat') || 
               lower.includes('delivery hero') || lower.includes('lieferando') || lower.includes('wolt') ||
               lower.includes('uber eats') || lower.includes('foursquare') || lower.includes('restaurant');
      };

      const isGlobalEnterprise = (c: string) => {
        const lower = c.toLowerCase();
        const enterprises = [
          'deloitte', 'pwc', 'pricewaterhouse', 'ey', 'ernst', 'young', 'kpmg', 
          'grant thornton', 'bdo', 'accenture', 'mckinsey', 'boston consulting', 'bcg', 'bain'
        ];
        return enterprises.some(ent => lower.includes(ent));
      };

      // Ensure we don't list the user's own business, directories, or global conglomerates (unless target is global)
      const cleanComps = (mentions: string[]) => {
        const targetIsGlobal = (profile.businessMode === 'global') || isGlobalEnterprise(profile.businessName || cleanDomain);
        
        const isGenericTaxOrConcept = (c: string) => {
          const lower = c.toLowerCase().trim();
          const blacklist = [
            'goods and services tax',
            'goods & services tax',
            'income tax',
            'value added tax',
            'professional tax',
            'corporate tax',
            'service tax',
            'customs duty',
            'provident fund',
            'llp registration',
            'company registration'
          ];
          return blacklist.some(term => lower === term || lower.startsWith(term) || lower.endsWith(term));
        };

        return Array.from(new Set(mentions)).filter(c => {
          if (c.length < 4) return false;
          if (isDirectory(c)) return false;
          if (isGenericTaxOrConcept(c)) return false;
          if (!targetIsGlobal && isGlobalEnterprise(c)) return false;
          
          // Fuzzy match against user's business
          const t = c.toLowerCase();
          const normName = profile.businessName ? profile.businessName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, '').toLowerCase() : '';
          const normC = c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, '').toLowerCase();
          
          if (normName.length > 4 && normC.includes(normName)) return false;
          if (normName.length > 4 && normName.includes(normC)) return false;
          
          // If the competitor string contains 2+ words of the business name, block it
          if (profile.businessName) {
            const words = profile.businessName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
            if (words.length >= 2) {
              const matchCount = words.filter(w => t.includes(w)).length;
              if (matchCount >= 2) return false;
            }
          }
          return true;
        });
      };

      const formatComps = (valid: string[], source: string) => valid.slice(0, 4).map(c => ({
        domain: c,
        appearances: 1,
        sourceQuery: 'Local Search Intent',
        llm_source: source
      }));

      const rawList = [
        ...formatComps(cleanComps(chatgptMentions), 'chatgpt'),
        ...formatComps(cleanComps(perplexityMentions), 'perplexity'),
        ...formatComps(cleanComps(geminiMentions), 'gemini')
      ];

      const mergedMap = new Map<string, any>();
      rawList.forEach(item => {
        const key = item.domain.toLowerCase().trim();
        if (mergedMap.has(key)) {
          const existing = mergedMap.get(key);
          existing.appearances += 1;
          if (!existing.sources.includes(item.llm_source)) {
            existing.sources.push(item.llm_source);
          }
        } else {
          mergedMap.set(key, {
            domain: item.domain,
            appearances: 1,
            sourceQuery: item.sourceQuery,
            sources: [item.llm_source]
          });
        }
      });

      return Array.from(mergedMap.values())
        .sort((a, b) => b.appearances - a.appearances)
        .map(item => ({
          domain: item.domain,
          appearances: item.appearances,
          sourceQuery: item.sourceQuery,
          llm_source: item.sources.join(', ')
        }));
    };

    const top10Result = await top10Promise;

    if (top10Result.chatgpt?.coMentioned) {
      chatgptMentions.push(...top10Result.chatgpt.coMentioned);
    }
    if (top10Result.perplexity?.coMentioned) {
      perplexityMentions.push(...top10Result.perplexity.coMentioned);
    }
    if (top10Result.gemini?.coMentioned) {
      geminiMentions.push(...top10Result.gemini.coMentioned);
    }

    const [generatedFixes, competitors] = await Promise.all([
      generateFixSuggestions(html, queryResults),
      filterAllCompetitors()
    ]);

    const gridCells: any[] = [];
    const promptTypes = ['transactional', 'local_intent', 'comparison', 'brand'];
    
    queryResults.forEach((item: any, i: number) => {
      const type = promptTypes[i];
      
      gridCells.push({
        prompt_type: type,
        model: 'chatgpt',
        cited: item.gptCited,
        query: item.query,
        web_sources: item.webSources || [],
        position: item.gptCited ? 1 : null,
        reason_tag: determineReasonTag(item.gptCited, type, technicalChecks),
        competitor_displaced: item.gptCited ? null : (item.gptMentions?.[0] || null),
        response_text: (item.responses?.chatgpt || '').substring(0, 1500)
      });
      
      gridCells.push({
        prompt_type: type,
        model: 'perplexity',
        cited: item.perplexityCited,
        query: item.query,
        web_sources: item.webSources || [],
        position: item.perplexityCited ? 1 : null,
        reason_tag: determineReasonTag(item.perplexityCited, type, technicalChecks),
        competitor_displaced: item.perplexityCited ? null : (item.pxMentions?.[0] || null),
        response_text: (item.responses?.perplexity || '').substring(0, 1500)
      });
      
      gridCells.push({
        prompt_type: type,
        model: 'gemini',
        cited: item.geminiCited,
        query: item.query,
        web_sources: item.webSources || [],
        position: item.geminiCited ? 1 : null,
        reason_tag: determineReasonTag(item.geminiCited, type, technicalChecks),
        competitor_displaced: item.geminiCited ? null : (item.gmMentions?.[0] || null),
        response_text: (item.responses?.gemini || '').substring(0, 1500)
      });
    });

    // Add top10 cells
    gridCells.push({
      prompt_type: 'top10',
      model: 'chatgpt',
      cited: top10Result.chatgpt.cited,
      position: top10Result.chatgpt.cited ? 1 : null,
      reason_tag: determineReasonTag(top10Result.chatgpt.cited, 'top10', technicalChecks),
      competitor_displaced: top10Result.chatgpt.cited ? null : (top10Result.chatgpt.coMentioned?.[0] || null),
      response_text: (top10Result.chatgpt.responseText || '').substring(0, 1500)
    });
    
    gridCells.push({
      prompt_type: 'top10',
      model: 'perplexity',
      cited: top10Result.perplexity.cited,
      position: top10Result.perplexity.cited ? 1 : null,
      reason_tag: determineReasonTag(top10Result.perplexity.cited, 'top10', technicalChecks),
      competitor_displaced: top10Result.perplexity.cited ? null : (top10Result.perplexity.coMentioned?.[0] || null),
      response_text: (top10Result.perplexity.responseText || '').substring(0, 1500)
    });
    
    gridCells.push({
      prompt_type: 'top10',
      model: 'gemini',
      cited: top10Result.gemini.cited,
      position: top10Result.gemini.cited ? 1 : null,
      reason_tag: determineReasonTag(top10Result.gemini.cited, 'top10', technicalChecks),
      competitor_displaced: top10Result.gemini.cited ? null : (top10Result.gemini.coMentioned?.[0] || null),
      response_text: (top10Result.gemini.responseText || '').substring(0, 1500)
    });

    // Push __grid_data check
    technicalChecks.push({
      id: '__grid_data',
      name: 'Grid Data',
      status: 'pass',
      description: JSON.stringify(gridCells)
    });

    // Push __profile_data check
    technicalChecks.push({
      id: '__profile_data',
      name: 'Profile Data',
      status: 'pass',
      description: JSON.stringify({
        businessName: profile.businessName,
        primaryCategory: profile.primaryCategory,
        topServices: profile.topServices || [],
        location: profile.location,
      })
    });

    sendEvent('top10_complete', top10Result);

    const topFixes = generatedFixes.map((fix: any, idx: number) => ({
      id: `fix-gen-${idx}`,
      title: fix.title,
      description: fix.description,
      impact: fix.impact,
      timeEstimate: fix.timeEstimate,
      category: fix.category || 'schema_markup',
      fixAction: 'link'
    }));

    // Aggregate score based on AVERAGE citation rate across all 3 models
    const passCount = technicalChecks.filter(c => c.status === 'pass').length;
    const technicalScore = Math.round((passCount / 14) * 100);
    const avgCitedCount = (geminiCitedCount + chatgptCitedCount + perplexityCitedCount) / 3;
    const citationRate = avgCitedCount / allQueries.length;
    const compositeScore = Math.round(citationRate * 100);

    let scanId = null;
    try {
      let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('ey') && supabaseKey.startsWith('http')) {
        const temp = supabaseUrl;
        supabaseUrl = supabaseKey;
        supabaseKey = temp;
      }
      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        let insertResult = await supabase.from('scans').insert({
          url: targetUrl,
          domain,
          user_id: user?.id || null,
          anonymous_session_id: user?.id ? null : ip,
          composite_score: compositeScore,
          citation_rate: Math.round(citationRate * 100),
          cited_count: Math.round(avgCitedCount),
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
            cited_count: Math.round(avgCitedCount),
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
              appearances: c.appearances,
              llm_source: c.llm_source
            }));
            await supabase.from('competitor_snapshots').insert(snapshots);
          }
        }
      }
    } catch (e) {
      console.error('Supabase save error', e);
    }

    const intentCategories = [
      { name: 'Informational queries', cited: queryResults[0]?.geminiCited ? 1 : 0, total: 1 },
      { name: 'Local intent queries', cited: queryResults[1]?.geminiCited ? 1 : 0, total: 1 },
      { name: 'Comparison queries', cited: queryResults[2]?.geminiCited ? 1 : 0, total: 1 },
      { name: 'Brand recognition', cited: queryResults[3]?.geminiCited ? 1 : 0, total: 1 }
    ];

    const modelPerformance = {
      chatgpt: { appeared: chatgptCitedCount > 0, top10: top10Result.chatgpt?.cited || false },
      gemini: { appeared: geminiCitedCount > 0, top10: top10Result.gemini?.cited || false },
      perplexity: { appeared: perplexityCitedCount > 0, top10: top10Result.perplexity?.cited || false }
    };

    const report = {
      id: scanId,
      domain,
      url: targetUrl,
      compositeScore,
      citationRate: Math.round(citationRate * 100),
      citedCount: Math.round(avgCitedCount),
      totalCount: allQueries.length,
      competitors,
      topFixes,
      intentCategories,
      top10Result,
      modelPerformance, // Pass the new performance object
      queryDetails: gridCells,
      confidence: profile.confidence,
      isBlocked,
      profile: {
        businessName: profile.businessName,
        primaryCategory: profile.primaryCategory,
        topServices: profile.topServices || [],
        location: profile.location,
      }
    };

    sendEvent('scan_complete', report);
  } catch (e) {
    console.error(e);
    throw e;
  }
}
