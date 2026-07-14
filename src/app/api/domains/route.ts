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

    // Get the latest scan for each unique domain, and build a history array
    const uniqueDomainsMap = new Map()
    for (const scan of scans || []) {
      const historyItem = {
        date: scan.created_at,
        score: scan.composite_score,
        citationRate: scan.citation_rate
      }

      if (!uniqueDomainsMap.has(scan.domain)) {
        uniqueDomainsMap.set(scan.domain, {
          domain: scan.domain,
          latestScanId: scan.id,
          latestScore: scan.composite_score,
          latestCitationRate: scan.citation_rate,
          latestScanAt: scan.created_at,
          latestFixes: scan.top_fixes,
          scanCount: 1,
          history: [historyItem]
        })
      } else {
        const existing = uniqueDomainsMap.get(scan.domain)
        existing.scanCount += 1
        existing.history.push(historyItem)
      }
    }

    // Sort history chronologically (oldest to newest) for charts
    const result = Array.from(uniqueDomainsMap.values()).map((domainData: any) => {
      domainData.history.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      return domainData
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Domains API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Fetch scan ids for this domain
    const { data: scans, error: fetchError } = await supabase
      .from('scans')
      .select('id')
      .eq('user_id', user.id)
      .eq('domain', domain)

    if (fetchError) {
      console.error('Error fetching domain scans for deletion:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const scanIds = scans?.map(s => s.id) || []

    if (scanIds.length > 0) {
      // 2. Delete competitor snapshots explicitly to avoid foreign key violations
      const { error: snapError } = await supabase
        .from('competitor_snapshots')
        .delete()
        .in('scan_id', scanIds)

      if (snapError) {
        console.error('Error deleting competitor snapshots:', snapError)
        return NextResponse.json({ error: snapError.message }, { status: 500 })
      }
    }

    // 3. Delete all scans for this domain and user
    const { error, count } = await supabase
      .from('scans')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .eq('domain', domain)

    if (error) {
      console.error('Error deleting domain scans:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (count === 0) {
       console.error('Zero scans deleted. Possible RLS issue or domain not found.')
       // We still return success if there's nothing to delete, but log it.
    }

    return NextResponse.json({ success: true, deletedScans: count })
  } catch (error: any) {
    console.error('Delete Domain API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
