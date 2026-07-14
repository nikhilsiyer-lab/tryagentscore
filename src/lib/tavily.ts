export async function searchTavily(query: string, domain: string) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error('TAVILY_API_KEY is missing');

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        max_results: 10
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Tavily search failed:', errText);
      return { results: [], contextText: '', cited: false };
    }

    const data = await response.json();
    const results = data.results || [];
    
    // Check if the domain is cited in the raw search results
    const cited = results.some((r: any) => r.url && r.url.toLowerCase().includes(domain.toLowerCase()));
    
    const contextText = results.map((r: any, i: number) => `Source [${i+1}]: ${r.url}\n${r.content}`).join('\n\n');
    
    return { results, contextText, cited };
  } catch (error) {
    console.error('Error fetching from Tavily:', error);
    return { results: [], contextText: '', cited: false };
  }
}
