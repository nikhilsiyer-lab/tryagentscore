import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';
import { getCurrentUser } from '../../../lib/auth';
import { executeMultiLLMScanLogic } from '../../../lib/multi-scanner';
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const targetUrl = searchParams.get('url');
  const description = searchParams.get('description') || '';
  const businessType = searchParams.get('businessType') || '';
  const entityType = searchParams.get('entityType') || '';
  const basedIn = searchParams.get('basedIn') || '';
  const servesMarket = searchParams.get('servesMarket') || 'local'; // 'local' | 'national' | 'international'
  const targetClient = searchParams.get('targetClient') || '';
  const knownCompetitors = searchParams.get('knownCompetitors') || '';
  const honeypot = searchParams.get('honeypot') || '';
  const isBotParam = searchParams.get('isBot') === 'true';

  const sendStreamError = (msg: string) => {
    const encoder = new TextEncoder();
    return new Response(
      encoder.encode(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      }
    );
  };

  // 1. Guardrails: Bot Rejection
  if (honeypot || isBotParam) {
    return sendStreamError('Invalid request parameters');
  }

  const user = await getCurrentUser();
  const isPro = user?.isPro || false;

  // 2. Guardrails: Tiered Throttle Skeleton (Bypassed for Pro users)
  if (!isPro) {
    const budgetConsumed = 0.5; // Mock 50% consumed
    if (budgetConsumed > 0.9) {
      return sendStreamError('We are experiencing a viral spike. Your scan has been queued for batch processing and results will be ready soon.');
    }
  }

  if (!targetUrl) {
    return sendStreamError('Missing url parameter');
  }

  let domain = targetUrl.replace(/^(https?:\/\/)?(www\.)?/, '');
  domain = domain.split('/')[0];

  const ip = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  let cachedScan: any = null;

  if (supabaseUrl && supabaseKey) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Global daily cap — protect against cost spikes regardless of user tier
    const { count: globalDailyCount } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!isPro && globalDailyCount && globalDailyCount >= 50) {
      return sendStreamError("We're experiencing high demand right now and have reached today's scan limit. Please check back in a few hours — we reset daily. Thank you for your patience!");
    }

    if (!isPro) {
      // Serve cached result if available (within 72h) to save cost
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

  if (!process.env.GEMINI_API_KEY || !process.env.GROQ_API_KEY) {
    return sendStreamError('API Keys missing. Please configure GEMINI_API_KEY and GROQ_API_KEY in your environment.');
  }

  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        await executeMultiLLMScanLogic({
          targetUrl,
          domain,
          description,
          entityType,
          basedIn,
          servesMarket,
          targetClient,
          knownCompetitors,
          userId: user?.id || null,
          ip,
          cachedScan,
          sendEvent
        });
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
