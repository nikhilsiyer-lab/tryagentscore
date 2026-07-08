import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { getCurrentUser } from '../../../lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Fetch all scans for this user ordered by created_at desc
    const { data: scans, error } = await supabase
      .from('scans')
      .select('id, domain, composite_score, citation_rate, created_at, top_fixes')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user scans:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get the latest scan for each unique domain
    const uniqueDomainsMap = new Map()
    for (const scan of scans || []) {
      if (!uniqueDomainsMap.has(scan.domain)) {
        uniqueDomainsMap.set(scan.domain, {
          domain: scan.domain,
          latestScore: scan.composite_score,
          latestCitationRate: scan.citation_rate,
          latestScanAt: scan.created_at,
          latestFixes: scan.top_fixes,
          scanCount: 1,
        })
      } else {
        const existing = uniqueDomainsMap.get(scan.domain)
        existing.scanCount += 1
      }
    }

    return NextResponse.json(Array.from(uniqueDomainsMap.values()))
  } catch (error: any) {
    console.error('Domains API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
