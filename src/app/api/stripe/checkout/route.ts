import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getCurrentUser } from '../../../../lib/auth'

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

    const checkoutOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${new URL(request.url).origin}/login?checkout=success`,
      cancel_url: `${new URL(request.url).origin}/?view=pricing`,
    }

    if (user) {
      checkoutOptions.customer_email = user.email
      checkoutOptions.client_reference_id = user.id
    }

    const session = await getStripe().checkout.sessions.create(checkoutOptions)

    if (!session.url) {
      throw new Error('Failed to create checkout session URL')
    }

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
