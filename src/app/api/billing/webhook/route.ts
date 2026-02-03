/**
 * POST /api/billing/webhook
 *
 * Stripe webhook endpoint for subscription events.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStripeBillingService } from '@/lib/billing/stripe-service'
import Stripe from 'stripe'

import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 })
    }

    // Get raw body
    const rawBody = await request.text()

    // Parse Stripe event
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    })

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    // Process webhook event
    const billingService = getStripeBillingService()
    await billingService.processWebhookEvent(event, signature, rawBody)

    return NextResponse.json({ received: true })
  } catch (error: any) {
    logger.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 400 }
    )
  }
}
