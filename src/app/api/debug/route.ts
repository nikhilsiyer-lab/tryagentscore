import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {};
  const key = process.env.GEMINI_API_KEY || '';

  // 1. Check env vars exist
  results.env = {
    GEMINI_API_KEY: key ? `set (${key.length} chars, starts: ${key.substring(0, 8)})` : 'MISSING',
    GROQ_API_KEY: process.env.GROQ_API_KEY ? `set (${process.env.GROQ_API_KEY.length} chars, starts: ${process.env.GROQ_API_KEY.substring(0, 5)})` : 'MISSING',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? `set (${process.env.NEXT_PUBLIC_SUPABASE_URL.length} chars, starts: ${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 10)})` : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `set (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length} chars)` : 'MISSING',
    SUPABASE_URL: process.env.SUPABASE_URL ? `set (${process.env.SUPABASE_URL.length} chars)` : 'MISSING',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? `set (${process.env.SUPABASE_ANON_KEY.length} chars)` : 'MISSING',
  };

  // 2. Test RAW FETCH — bypass the SDK entirely
  try {
    const rawRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with just the word: WORKING' }] }] })
      }
    );
    const rawJson = await rawRes.json();
    if (rawJson.candidates) {
      results.gemini_raw_fetch = 'OK: ' + rawJson.candidates[0]?.content?.parts[0]?.text;
    } else {
      results.gemini_raw_fetch = 'FAIL: ' + JSON.stringify(rawJson).substring(0, 300);
    }
  } catch(e: any) {
    results.gemini_raw_fetch = 'FAIL: ' + e.message;
  }

  // 3. Test RAW FETCH with grounding
  try {
    const rawRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'What is booking.com? One sentence.' }] }],
          tools: [{ googleSearch: {} }]
        })
      }
    );
    const rawJson = await rawRes.json();
    if (rawJson.candidates) {
      const text = rawJson.candidates[0]?.content?.parts[0]?.text || '';
      const chunks = rawJson.candidates[0]?.groundingMetadata?.groundingChunks || [];
      results.gemini_grounded_raw = `OK: text_len=${text.length}, chunks=${chunks.length}, sample="${text.substring(0, 100)}"`;
    } else {
      results.gemini_grounded_raw = 'FAIL: ' + JSON.stringify(rawJson).substring(0, 300);
    }
  } catch(e: any) {
    results.gemini_grounded_raw = 'FAIL: ' + e.message;
  }

  // 4. Test Gemini SDK (for comparison)
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await Promise.race([
      model.generateContent('Reply with just the word: WORKING'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 8s')), 8000))
    ]) as any;
    results.gemini_sdk = 'OK: ' + result.response.text().trim();
  } catch (e: any) {
    results.gemini_sdk = 'FAIL: ' + e.message;
  }

  // 5. Test Groq
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
    const response = await Promise.race([
      groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
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
