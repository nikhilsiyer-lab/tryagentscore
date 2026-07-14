import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

let stripeInstance: Stripe | null = null;
function getStripe() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy-key-for-build', {
      apiVersion: '2024-06-20',
    });
  }
  return stripeInstance;
}

let supabaseInstance: any = null;
function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-url.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key'
    );
  }
  return supabaseInstance;
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-url.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key'
  );
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || 'dummy-webhook-secret'
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        let userId = session.client_reference_id
        const customerEmail = session.customer_details?.email

        const adminAuth = getSupabaseAdmin()

        if (!userId && customerEmail) {
          // Check if user exists
          const { data: { users }, error: searchError } = await adminAuth.auth.admin.listUsers()
          
          let existingUser = null
          if (!searchError && users) {
            existingUser = users.find((u: any) => u.email === customerEmail)
          }

          if (existingUser) {
            userId = existingUser.id
          } else {
            // Create user
            const { data: newUser, error: createError } = await adminAuth.auth.admin.createUser({
              email: customerEmail,
              email_confirm: true,
            })
            if (!createError && newUser?.user) {
              userId = newUser.user.id
            }
          }
        }

        if (!userId) {
          throw new Error('No user id found and failed to create one from email')
        }

        const subscription = await getStripe().subscriptions.retrieve(session.subscription as string)

        await adminAuth.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: session.customer as string,
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'stripe_subscription_id' })

        break
      }
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const adminAuth = getSupabaseAdmin()
        await adminAuth.from('subscriptions').update({
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }).eq('stripe_subscription_id', subscription.id)

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook handler failed:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
