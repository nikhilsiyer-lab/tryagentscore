import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getCurrentUser } from '../../../../lib/auth'
import { createClient } from '../../../../lib/supabase/server'

let stripeInstance: Stripe | null = null;
function getStripe() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy-key-for-build', {
      apiVersion: '2024-06-20',
    });
  }
  return stripeInstance;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId = sub?.stripe_customer_id

    // Fallback: If no customer ID exists in local DB, search Stripe by email or create one
    if (!customerId && user.email) {
      try {
        const stripe = getStripe()
        const existingCustomers = await stripe.customers.list({
          email: user.email,
          limit: 1
        })
        
        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id
        } else {
          const newCustomer = await stripe.customers.create({
            email: user.email,
            metadata: { user_id: user.id }
          })
          customerId = newCustomer.id
        }

        // Cache stripe_customer_id in Supabase subscriptions table
        await supabase.from('subscriptions').upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          status: 'active',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      } catch (err) {
        console.error('Failed to create/resolve Stripe customer:', err)
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: 'No subscription or customer found' }, { status: 404 })
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${new URL(request.url).origin}/?view=dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe Portal Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
