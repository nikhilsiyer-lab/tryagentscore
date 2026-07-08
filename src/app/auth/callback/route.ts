import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const claimScan = searchParams.get('claim_scan')
  
  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      if (claimScan) {
        // Attach the anonymous scan to this user
        await supabase
          .from('scans')
          .update({ user_id: data.user.id, is_claimed: true })
          .eq('id', claimScan);
      }
      return NextResponse.redirect(`${origin}/?view=dashboard`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/?error=auth`)
}
