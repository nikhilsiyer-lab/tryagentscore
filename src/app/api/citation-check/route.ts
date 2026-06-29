import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Rate limit: 1 citation check per IP per hour
const rateLimitMap = new Map<string, number>();

async function queryGemini(businessName: string, category: string, city: string) {
  // If API key is missing, throw an error
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not defined. Please set it in your environment.');
  }

  // Use Gemini 2.0 Flash with search grounding
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    tools: [{ googleSearch: {} }] 
  });
  
  const query = `What are the best ${category} in ${city}? Give me specific recommendations.`;

  // Run 3x for reliability — report confidence score
  const runs = await Promise.all([1, 2, 3].map(async () => {
    try {
      const result = await model.generateContent(query);
      const text = result.response.text() || '';
      
      // Extract search grounding metadata if available
      const groundingMetadata = (result.response as any).candidates?.[0]?.groundingMetadata;
      const webSources = groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web?.uri).filter(Boolean) || [];

      // Check if businessName is mentioned in the generated text (case-insensitive)
      const isCited = text.toLowerCase().includes(businessName.toLowerCase());

      return { text, isCited, webSources };
    } catch (error) {
      console.error('Gemini query execution error:', error);
      return { text: '', isCited: false, webSources: [] };
    }
  }));

  const citedCount = runs.filter(r => r.isCited).length;
  const confidenceScore = Math.round((citedCount / 3) * 100);
  
  // Aggregate all unique web sources found
  const allWebSources = Array.from(new Set(runs.flatMap(r => r.webSources)));

  return {
    citedCount,
    totalCount: 3,
    confidenceScore,
    isCited: citedCount > 0,
    sources: allWebSources,
    sampleResponse: runs.find(r => r.text)?.text || ''
  };
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'anonymous';
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Rate limit check
    if (rateLimitMap.has(ip)) {
      const lastScan = rateLimitMap.get(ip) || 0;
      if (now - lastScan < oneHour) {
        const remainingMinutes = Math.ceil((oneHour - (now - lastScan)) / 60000);
        return NextResponse.json(
          { error: `Rate limit exceeded. Please try again in ${remainingMinutes} minutes.` },
          { status: 429 }
        );
      }
    }

    const { businessName, category, city } = await request.json();

    if (!businessName || !category || !city) {
      return NextResponse.json(
        { error: 'Missing required parameters: businessName, category, city' },
        { status: 400 }
      );
    }

    // Set rate limit timestamp
    rateLimitMap.set(ip, now);

    const result = await queryGemini(businessName, category, city);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Citation check API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during citation check' },
      { status: 500 }
    );
  }
}
