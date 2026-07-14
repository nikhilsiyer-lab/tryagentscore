import { NextResponse } from 'next/server'
import Stripe from 'stripe'

let stripeInstance: Stripe | null = null;
function getStripe() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-06-20',
    });
  }
  return stripeInstance;
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ hasSubscription: false })
    }

    const stripe = getStripe()
    
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('Stripe secret key missing, defaulting to true for local testing.')
      return NextResponse.json({ hasSubscription: true })
    }

    const customers = await stripe.customers.list({ email, limit: 10 })
    
    if (customers.data.length === 0) {
      return NextResponse.json({ hasSubscription: false })
    }

    // Any user with a subscription object (even expired) is allowed to login
    // because expired users can view their history
    let hasSub = false
    for (const customer of customers.data) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 10
      })
      
      if (subscriptions.data.length > 0) {
        hasSub = true
        break
      }
    }

    return NextResponse.json({ hasSubscription: hasSub })

  } catch (err: any) {
    console.error('Error checking email:', err)
    // On error, let them try to login to not block users
    return NextResponse.json({ hasSubscription: true })
  }
}
