import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

let groqInstance: Groq | null = null;
function getGroq() {
  if (!groqInstance) {
    groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build' });
  }
  return groqInstance;
}

interface Profile {
  businessName: string;
  primaryCategory: string;
  topServices: string[];
  location: string;
  queryLanguage: string;
  domain: string;
}

interface RequestBody {
  actionType: 'meta' | 'faq';
  profile: Profile;
}

const TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms),
  );
  return Promise.race([promise, timeout]);
}

async function generateMeta(profile: Profile): Promise<{ type: 'meta'; title: string; description: string }> {
  const { businessName, primaryCategory, topServices, location, queryLanguage } = profile;

  const prompt = `You are an SEO expert. Generate a page title and meta description for a local business.

Business: ${businessName}
Primary Category: ${primaryCategory}
Top Services: ${topServices.join(', ')}
Location: ${location}

Requirements:
- Write ONLY in the language with ISO code: "${queryLanguage}" (e.g. "de" → German, "fr" → French, "es" → Spanish, "en" → English)
- Title: max 60 characters, must include location and primary service/category
- Meta Description: max 155 characters, must include location and primary service/category
- Be compelling, specific, and natural-sounding

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{"title": "...", "description": "..."}`;

  const completion = await getGroq().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 256,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '';

  // Strip markdown code fences if present
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  const parsed = JSON.parse(jsonStr) as { title: string; description: string };

  return {
    type: 'meta',
    title: String(parsed.title ?? '').slice(0, 60),
    description: String(parsed.description ?? '').slice(0, 155),
  };
}

async function generateFaq(
  profile: Profile,
): Promise<{ type: 'faq'; faqs: Array<{ question: string; answer: string }> }> {
  const { businessName, primaryCategory, topServices, location, queryLanguage } = profile;

  const prompt = `You are a content writer. Generate 4 realistic customer FAQ questions and answers for a local business.

Business: ${businessName}
Primary Category: ${primaryCategory}
Top Services: ${topServices.join(', ')}
Location: ${location}

Requirements:
- Write ONLY in the language with ISO code: "${queryLanguage}" (e.g. "de" → German, "fr" → French, "es" → Spanish, "en" → English)
- 4 questions a real customer would ask
- Each answer must be under 50 words
- Be helpful, natural, and specific to the business

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{"faqs": [{"question": "...", "answer": "..."}, {"question": "...", "answer": "..."}, {"question": "...", "answer": "..."}, {"question": "...", "answer": "..."}]}`;

  const completion = await getGroq().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 512,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '';

  // Strip markdown code fences if present
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  const parsed = JSON.parse(jsonStr) as { faqs: Array<{ question: string; answer: string }> };

  return {
    type: 'faq',
    faqs: (parsed.faqs ?? []).map((faq) => ({
      question: String(faq.question ?? ''),
      answer: String(faq.answer ?? ''),
    })),
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as RequestBody;
    const { actionType, profile } = body;

    if (!actionType || !profile) {
      return NextResponse.json({ error: 'Missing required fields: actionType and profile' }, { status: 400 });
    }

    if (actionType === 'meta') {
      const result = await withTimeout(generateMeta(profile), TIMEOUT_MS);
      return NextResponse.json(result);
    }

    if (actionType === 'faq') {
      const result = await withTimeout(generateFaq(profile), TIMEOUT_MS);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown action type' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const isTimeout = message.includes('timed out');
    return NextResponse.json({ error: message }, { status: isTimeout ? 504 : 500 });
  }
}
