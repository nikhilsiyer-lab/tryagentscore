import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { getCurrentUser } from '../../../lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')

    if (!domain) {
      return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Fetch trend data for this domain and user
    const { data: scans, error } = await supabase
      .from('scans')
      .select('id, composite_score, citation_rate, created_at')
      .eq('user_id', user.id)
      .eq('domain', domain)
      .order('created_at', { ascending: true }) // Ascending for chronological order on charts

    if (error) {
      console.error('Error fetching trend scans:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(scans)
  } catch (error: any) {
    console.error('Trends API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
