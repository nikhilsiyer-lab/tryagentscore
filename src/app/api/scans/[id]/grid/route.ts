import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Automatically detect and correct swapped Supabase environment variables on Vercel
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
if (envUrl.startsWith('ey') && envKey.startsWith('http')) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = envKey;
  process.env.SUPABASE_URL = envKey;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = envUrl;
  process.env.SUPABASE_ANON_KEY = envUrl;
}

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = params.id;

    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('ey') && supabaseKey.startsWith('http')) {
      const temp = supabaseUrl;
      supabaseUrl = supabaseKey;
      supabaseKey = temp;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('scans').select('technical_checks').eq('id', id).single();
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const gridCheck = data.technical_checks?.find((c: any) => c.id === '__grid_data');
    const queryDetails = gridCheck ? JSON.parse(gridCheck.description) : [];
    
    const grid = queryDetails.map((c: any) => ({
      prompt_type: c.prompt_type,
      model: c.model,
      cited: c.cited
    }));
    
    return NextResponse.json(grid);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
