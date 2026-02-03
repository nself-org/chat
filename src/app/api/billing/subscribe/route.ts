/**
 * POST /api/billing/subscribe
 *
 * Create a new subscription or upgrade existing subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStripeBillingService } from '@/lib/billing/stripe-service'
import { getPlanEnforcementService } from '@/lib/billing/plan-enforcement.service'
import { z } from 'zod'

import { logger } from '@/lib/logger'

const subscribeSchema = z.object({
  workspaceId: z.string(),
  planTier: z.enum(['starter', 'professional', 'enterprise']),
  interval: z.enum(['monthly', 'yearly']),
  paymentMethodId: z.string().optional(),
  returnUrl: z.string().url(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = subscribeSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { workspaceId, planTier, interval, returnUrl } = validationResult.data

    const workspace = null // await getWorkspace(workspaceId)

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Create or update subscription via Stripe
    const billingService = getStripeBillingService()
    const session = await billingService.createCheckoutSession(
      workspace as any,
      planTier as any,
      interval,
      `${returnUrl}?success=true`,
      `${returnUrl}?canceled=true`
    )

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    logger.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription', details: error.message },
      { status: 500 }
    )
  }
}
