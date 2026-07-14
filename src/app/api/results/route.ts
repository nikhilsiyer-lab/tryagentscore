import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Scan ID parameter is required' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith('http')) {
      return NextResponse.json({ error: 'Supabase integration is not configured with a valid URL.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failed to fetch scan from Supabase:', error);
      return NextResponse.json({ error: 'Scan results not found' }, { status: 404 });
    }

    const gridCheck = data.technical_checks?.find((c: any) => c.id === '__grid_data');
    const queryDetails = gridCheck ? JSON.parse(gridCheck.description) : null;
    const profileCheck = data.technical_checks?.find((c: any) => c.id === '__profile_data');
    const profile = profileCheck ? JSON.parse(profileCheck.description) : null;
    const cleanChecks = data.technical_checks?.filter((c: any) => c.id !== '__grid_data' && c.id !== '__profile_data') || [];

    // Map DB fields back to the frontend ScanReport interface format
    const report = {
      id: data.id,
      url: data.url,
      domain: data.domain,
      timestamp: data.created_at,
      compositeScore: data.composite_score,
      citationRate: data.citation_rate,
      citedCount: data.cited_count,
      totalCount: data.total_count,
      technicalChecks: cleanChecks,
      topFixes: data.top_fixes,
      competitors: data.competitors,
      queryDetails: queryDetails,
      profile: profile,
      top10Result: data.top_10_result || {
        query: `Give me the top 10 services related to ${data.domain}`,
        cited: data.citation_rate > 30,
        coMentioned: (data.competitors || []).slice(0, 3).map((c: any) => c.domain || c)
      }
    };

    return NextResponse.json(report);
  } catch (err: any) {
    console.error('Error fetching results:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
