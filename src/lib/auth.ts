import { createClient } from './supabase/server'

export type UserProfile = {
  id: string
  email: string
  isPro: boolean
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  // Check Pro status from subscriptions table
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  return {
    id: user.id,
    email: user.email!,
    isPro: !!sub,
  }
}
