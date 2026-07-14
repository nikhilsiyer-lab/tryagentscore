import OpenAI from 'openai';

import { GoogleGenerativeAI } from '@google/generative-ai';

export async function askChatGPT(query: string, searchContext: string) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an AI assistant answering a user query based on the following real-time web search results. Cite your sources if possible. Provide a direct, helpful answer.' },
      { role: 'user', content: `Web Search Context:\n${searchContext}\n\nUser Query: ${query}` }
    ]
  });
  return res.choices[0]?.message?.content || '';
}

export async function askPerplexity(query: string) {
  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: 'You are a helpful search assistant. Answer the query comprehensively based on web search results. Cite your sources.' },
          { role: 'user', content: query }
        ]
      })
    });
    const data = await res.json();
    return data.choices[0]?.message?.content || '';
  } catch (e) {
    console.error('Perplexity failed:', e);
    return '';
  }
}

export async function askGemini(query: string) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    tools: [{ googleSearch: {} }]
  });
  
  const res = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: query }] }]
  });
  return res.response.text();
}
