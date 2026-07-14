import { createClient } from './supabase/server'

export type SubscriptionState = 
  | 'anonymous'
  | 'pro_active'
  | 'pro_canceled_pending'
  | 'pro_expired'

export type UserProfile = {
  id: string
  email: string
  isPro: boolean
  subscriptionState: SubscriptionState
  periodEnd: string | null
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    // Check Pro status from subscriptions table
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, current_period_end, cancel_at_period_end')
      .eq('user_id', user.id)
      .single()

    let state: SubscriptionState = 'anonymous'
    let isPro = false

    if (sub) {
      const isPastEnd = sub.current_period_end ? new Date(sub.current_period_end) < new Date() : false
      
      if (sub.status === 'active' || sub.status === 'trialing') {
        if (sub.cancel_at_period_end && !isPastEnd) {
          state = 'pro_canceled_pending'
          isPro = true
        } else if (sub.cancel_at_period_end && isPastEnd) {
          state = 'pro_expired'
          isPro = false
        } else {
          state = 'pro_active'
          isPro = true
        }
      } else {
        state = 'pro_expired'
        isPro = false
      }
    }
    
    // DEV OVERRIDE for local testing
    if (user.email === 'nikhilsiyer@gmail.com') {
      state = 'pro_active'
      isPro = true
    }

    return {
      id: user.id,
      email: user.email,
      isPro,
      subscriptionState: state,
      periodEnd: sub?.current_period_end || null
    }
  } catch (e) {
    console.error('getCurrentUser encountered error, returning null:', e)
    return null
  }
}
