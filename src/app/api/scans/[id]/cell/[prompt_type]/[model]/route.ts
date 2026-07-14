import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string; prompt_type: string; model: string }> }
) {
  try {
    const params = await props.params;
    const { id, prompt_type, model } = params;

    if (id === 'demo' || id === 'demo-scan-id') {
      const DEMO_CELLS: Record<string, any> = {
        'transactional_chatgpt': { verdict: 'Missing', reason_tag: 'thin_content', competitor_displaced: 'apexadvisors.com', response_text: 'I recommend looking at local directories for accountants. Apex Advisors is highly rated.' },
        'transactional_gemini': { verdict: 'Missing', reason_tag: 'thin_content', competitor_displaced: 'apexadvisors.com', response_text: 'For CA firms, Apex Advisors and Summit CPAs are available. I did not find Acme Accounting.' },
        'transactional_perplexity': { verdict: 'Missing', reason_tag: 'thin_content', competitor_displaced: 'summitcpas.com', response_text: 'Searching for local CPAs... I found Summit CPAs and Apex Advisors. Acme is not listed.' },
        'local_intent_chatgpt': { verdict: 'Missing', reason_tag: 'no_reviews_content', competitor_displaced: 'apexadvisors.com', response_text: 'Top accountants near you include Apex Advisors. They have great reviews.' },
        'local_intent_gemini': { verdict: 'Missing', reason_tag: 'thin_content', competitor_displaced: 'apexadvisors.com', response_text: 'I suggest checking out Apex Advisors or Summit CPAs on local maps.' },
        'local_intent_perplexity': { verdict: 'Missing', reason_tag: 'no_reviews_content', competitor_displaced: 'apexadvisors.com', response_text: 'Here are the local services available: Apex Advisors and Summit CPAs.' },
        'comparison_chatgpt': { verdict: 'Appeared', reason_tag: 'strong_faq', response_text: 'Acme Accounting has competitive rates, but Summit CPAs has more certified staff.' },
        'comparison_gemini': { verdict: 'Appeared', reason_tag: 'strong_faq', response_text: 'Comparing Acme Accounting and Apex Advisors: Acme offers personalized tax consulting.' },
        'comparison_perplexity': { verdict: 'Appeared', reason_tag: 'strong_faq', response_text: 'Acme Accounting has solid reviews, similar to Summit CPAs.' },
        'brand_chatgpt': { verdict: 'Appeared', reason_tag: 'strong_faq', response_text: 'Acme Accounting is a professional accounting firm specializing in SMB tax filings.' },
        'brand_gemini': { verdict: 'Appeared', reason_tag: 'strong_faq', response_text: 'Yes, Acme Accounting is located in the downtown area and provides business consulting.' },
        'brand_perplexity': { verdict: 'Appeared', reason_tag: 'strong_faq', response_text: 'Acme Accounting Services has been operating for 5 years with a focus on local businesses.' },
        'top10_chatgpt': { verdict: 'Missing', reason_tag: 'no_comparison_page', competitor_displaced: 'apexadvisors.com', response_text: 'Top 10 firms: 1. Apex Advisors, 2. Summit CPAs, 3. Vanguard. Acme did not make the list.' },
        'top10_gemini': { verdict: 'Appeared', reason_tag: 'strong_faq', response_text: 'Here are the recommended firms: Apex Advisors, Summit CPAs, and Acme Accounting.' },
        'top10_perplexity': { verdict: 'Missing', reason_tag: 'no_comparison_page', competitor_displaced: 'summitcpas.com', response_text: 'Highly rated local firms: 1. Summit CPAs, 2. Apex Advisors. I could not verify Acme.' }
      };

      const cellKey = `${prompt_type}_${model}`;
      const cell = DEMO_CELLS[cellKey];
      if (!cell) return NextResponse.json({ error: 'Cell not found' }, { status: 404 });
      return NextResponse.json(cell);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('scans').select('technical_checks').eq('id', id).single();
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const gridCheck = data.technical_checks?.find((c: any) => c.id === '__grid_data');
    const queryDetails = gridCheck ? JSON.parse(gridCheck.description) : [];
    
    const cell = queryDetails.find((c: any) => c.prompt_type === prompt_type && c.model === model);
    if (!cell) return NextResponse.json({ error: 'Cell not found' }, { status: 404 });
    
    return NextResponse.json({
      verdict: cell.cited ? 'Appeared' : 'Not Appeared',
      reason_tag: cell.reason_tag,
      competitor_displaced: cell.competitor_displaced,
      response_text: cell.response_text
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
