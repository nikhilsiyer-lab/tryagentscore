import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {};

  // 1. Check env vars exist (don't expose values)
  results.env = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? `set (${process.env.GEMINI_API_KEY.length} chars, starts: ${process.env.GEMINI_API_KEY.substring(0, 5)})` : 'MISSING',
    GROQ_API_KEY: process.env.GROQ_API_KEY ? `set (${process.env.GROQ_API_KEY.length} chars, starts: ${process.env.GROQ_API_KEY.substring(0, 5)})` : 'MISSING',
  };

  // 2. Test Gemini basic (no grounding)
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await Promise.race([
      model.generateContent('Reply with just the word: WORKING'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 8s')), 8000))
    ]) as any;
    results.gemini_basic = 'OK: ' + result.response.text().trim();
  } catch (e: any) {
    results.gemini_basic = 'FAIL: ' + e.message;
  }

  // 3. Test Gemini with Google Search grounding
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const searchModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      tools: [{ googleSearch: {} }]
    });
    const res = await Promise.race([
      searchModel.generateContent('What is booking.com? One sentence.'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 15s')), 15000))
    ]) as any;
    const text = res.response.text();
    const chunks = res.response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    results.gemini_grounded_search = `OK: text_len=${text.length}, grounding_chunks=${chunks.length}`;
    results.gemini_grounded_sample = text.substring(0, 200);
    results.gemini_grounded_chunks = chunks.slice(0, 2).map((c: any) => c.web?.uri);
  } catch (e: any) {
    results.gemini_grounded_search = 'FAIL: ' + e.message;
  }

  // 4. Test Groq
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
    const response = await Promise.race([
      groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: 'What is booking.com? One sentence.' }]
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 8s')), 8000))
    ]) as any;
    results.groq = 'OK: ' + (response.choices[0]?.message?.content || '').substring(0, 150);
  } catch (e: any) {
    results.groq = 'FAIL: ' + e.message;
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}
