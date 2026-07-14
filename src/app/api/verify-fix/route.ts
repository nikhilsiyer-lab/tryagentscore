import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { domain, fixType } = await req.json();
    if (!domain) {
      return NextResponse.json({ error: 'Missing domain' }, { status: 400 });
    }

    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    
    // Simulate or perform active checks
    if (fixType === 'llms') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`https://${cleanDomain}/llms.txt`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.status === 200) {
          return NextResponse.json({ verified: true, message: 'llms.txt detected and verified successfully on your domain root!' });
        }
      } catch (e) {
        // Fallback mockup validation for staging test
      }
      return NextResponse.json({ verified: false, message: 'Could not detect llms.txt on your domain. Make sure it is uploaded to the root directory.' });
    }

    if (fixType === 'robots') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`https://${cleanDomain}/robots.txt`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.status === 200) {
          const text = await res.text();
          if (text.toLowerCase().includes('gptbot') || text.toLowerCase().includes('user-agent: *')) {
            return NextResponse.json({ verified: true, message: 'robots.txt verified! AI crawler rules found.' });
          }
        }
      } catch (e) {
        // Fallback mockup validation for staging test
      }
      return NextResponse.json({ verified: false, message: 'robots.txt check failed or no AI crawler rules detected. Ensure it allows GPTBot/PerplexityBot.' });
    }

    if (fixType === 'schema') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`https://${cleanDomain}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.status === 200) {
          const html = await res.text();
          if (html.includes('application/ld+json') || html.includes('schema.org')) {
            return NextResponse.json({ verified: true, message: 'Structured data detected! JSON-LD Schema markup found on page.' });
          }
        }
      } catch (e) {
        // Fallback mockup validation for staging test
      }
      return NextResponse.json({ verified: false, message: 'Could not detect any JSON-LD Schema markup on your page root.' });
    }

    return NextResponse.json({ verified: false, message: 'Unknown fix verification type.' });
  } catch (e: any) {
    console.error('Fix verification error:', e);
    return NextResponse.json({ verified: false, message: 'Verification timed out or failed. Please try again.' });
  }
}
