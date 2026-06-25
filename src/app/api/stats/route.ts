import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Return 0 if database is not configured yet
    return NextResponse.json({ count: 0 });
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/scans?select=id`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'count=exact'
      }
    });

    const countHeader = res.headers.get('content-range');
    const totalCount = countHeader ? parseInt(countHeader.split('/')[1], 10) : 0;

    return NextResponse.json({ count: totalCount });
  } catch (error) {
    return NextResponse.json({ count: 0 });
  }
}
