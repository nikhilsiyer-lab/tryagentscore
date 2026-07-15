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

    if (domain === 'acmeaccounting.com') {
      const mockScans = [
        { id: 'scan-1', composite_score: 30, citation_rate: 30, created_at: '2026-02-01T00:00:00Z', technical_checks: [{ id: '__grid_data', description: JSON.stringify([
          { prompt_type: 'transactional', cited: false }, { prompt_type: 'local_intent', cited: false }, { prompt_type: 'comparison', cited: false }, { prompt_type: 'brand', cited: true }, { prompt_type: 'top10', cited: false }
        ]) }] },
        { id: 'scan-2', composite_score: 35, citation_rate: 35, created_at: '2026-03-01T00:00:00Z', technical_checks: [{ id: '__grid_data', description: JSON.stringify([
          { prompt_type: 'transactional', cited: false }, { prompt_type: 'local_intent', cited: false }, { prompt_type: 'comparison', cited: true }, { prompt_type: 'brand', cited: true }, { prompt_type: 'top10', cited: false }
        ]) }] },
        { id: 'scan-3', composite_score: 44, citation_rate: 44, created_at: '2026-04-01T00:00:00Z', technical_checks: [{ id: '__grid_data', description: JSON.stringify([
          { prompt_type: 'transactional', cited: false }, { prompt_type: 'local_intent', cited: false }, { prompt_type: 'comparison', cited: true }, { prompt_type: 'brand', cited: true }, { prompt_type: 'top10', cited: true }
        ]) }] },
        { id: 'scan-4', composite_score: 44, citation_rate: 44, created_at: '2026-05-01T00:00:00Z', technical_checks: [{ id: '__grid_data', description: JSON.stringify([
          { prompt_type: 'transactional', cited: false }, { prompt_type: 'local_intent', cited: false }, { prompt_type: 'comparison', cited: true }, { prompt_type: 'brand', cited: true }, { prompt_type: 'top10', cited: true }
        ]) }] },
        { id: 'scan-5', composite_score: 55, citation_rate: 55, created_at: '2026-06-01T00:00:00Z', technical_checks: [{ id: '__grid_data', description: JSON.stringify([
          { prompt_type: 'transactional', cited: true }, { prompt_type: 'local_intent', cited: false }, { prompt_type: 'comparison', cited: true }, { prompt_type: 'brand', cited: true }, { prompt_type: 'top10', cited: true }
        ]) }] },
        { id: 'scan-6', composite_score: 55, citation_rate: 55, created_at: '2026-07-01T00:00:00Z', technical_checks: [{ id: '__grid_data', description: JSON.stringify([
          { prompt_type: 'transactional', cited: true }, { prompt_type: 'local_intent', cited: false }, { prompt_type: 'comparison', cited: true }, { prompt_type: 'brand', cited: true }, { prompt_type: 'top10', cited: true }
        ]) }] }
      ];
      return NextResponse.json(mockScans);
    }

    const enableFeatures = process.env.NEXT_PUBLIC_ENABLE_FEATURES === 'true'

    let user = null
    if (!enableFeatures) {
      user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const supabase = await createClient()

    // Fetch trend data. If in free features mode, fetch all scans for this domain.
    // Otherwise, filter strictly by the logged-in user.
    let query = supabase
      .from('scans')
      .select('id, composite_score, citation_rate, created_at')
      .eq('domain', domain)

    if (!enableFeatures && user) {
      query = query.eq('user_id', user.id)
    }

    const { data: scans, error } = await query.order('created_at', { ascending: true })

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
