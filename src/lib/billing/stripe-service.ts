/**
 * Stripe Billing Service
 *
 * Handles Stripe integration for subscription billing.
 * Manages customers, subscriptions, and webhook processing.
 */

import Stripe from 'stripe'
import { DEFAULT_PLANS } from '../tenants/types'
import type { Tenant, BillingPlan, BillingInterval, SubscriptionPlan } from '../tenants/types'
import { getTenantService } from '../tenants/tenant-service'

import { logger } from '@/lib/logger'

/**
 * Initialize Stripe client
 */
function getStripeClient(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY

  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  return new Stripe(apiKey, {
    apiVersion: '2025-08-27.basil',
    typescript: true,
  })
}

/**
 * Stripe Billing Service Class
 */
export class StripeBillingService {
  private stripe: Stripe
  private tenantService = getTenantService()

  constructor() {
    this.stripe = getStripeClient()
  }

  /**
   * Create a Stripe customer for a tenant
   */
  async createCustomer(tenant: Tenant): Promise<string> {
    const customer = await this.stripe.customers.create({
      email: tenant.ownerEmail,
      name: tenant.ownerName,
      metadata: {
        tenant_id: tenant.id,
        tenant_slug: tenant.slug,
        tenant_name: tenant.name,
      },
    })

    return customer.id
  }

  /**
   * Create a subscription for a tenant
   */
  async createSubscription(
    tenant: Tenant,
    plan: BillingPlan,
    interval: BillingInterval
  ): Promise<Stripe.Subscription> {
    // Get or create Stripe customer
    let customerId = tenant.billing.stripeCustomerId

    if (!customerId) {
      customerId = await this.createCustomer(tenant)

      // Update tenant with customer ID
      await this.tenantService.updateTenant(tenant.id, {
        metadata: {
          ...tenant.metadata,
          stripeCustomerId: customerId,
        },
      })
    }

    // Get price ID from plan configuration
    const planConfig: SubscriptionPlan = (DEFAULT_PLANS as any)[plan]
    const priceId =
      interval === 'monthly' ? planConfig.stripePriceIdMonthly : planConfig.stripePriceIdYearly

    if (!priceId) {
      throw new Error(`Price ID not configured for plan: ${plan}/${interval}`)
    }

    // Create subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        tenant_id: tenant.id,
        tenant_slug: tenant.slug,
        plan,
        interval,
      },
    })

    return subscription
  }

  /**
   * Update subscription (change plan or interval)
   */
  async updateSubscription(
    tenant: Tenant,
    newPlan: BillingPlan,
    newInterval: BillingInterval
  ): Promise<Stripe.Subscription> {
    if (!tenant.billing.stripeSubscriptionId) {
      throw new Error('No active subscription found')
    }

    // Get current subscription
    const subscription = await this.stripe.subscriptions.retrieve(
      tenant.billing.stripeSubscriptionId
    )

    // Get new price ID
    const planConfig: SubscriptionPlan = (DEFAULT_PLANS as any)[newPlan]
    const newPriceId =
      newInterval === 'monthly' ? planConfig.stripePriceIdMonthly : planConfig.stripePriceIdYearly

    if (!newPriceId) {
      throw new Error(`Price ID not configured for plan: ${newPlan}/${newInterval}`)
    }

    // Update subscription
    const updatedSubscription = await this.stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
      metadata: {
        ...subscription.metadata,
        plan: newPlan,
        interval: newInterval,
      },
    })

    return updatedSubscription
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    tenant: Tenant,
    immediately: boolean = false
  ): Promise<Stripe.Subscription> {
    if (!tenant.billing.stripeSubscriptionId) {
      throw new Error('No active subscription found')
    }

    if (immediately) {
      // Cancel immediately
      return await this.stripe.subscriptions.cancel(tenant.billing.stripeSubscriptionId)
    } else {
      // Cancel at period end
      return await this.stripe.subscriptions.update(tenant.billing.stripeSubscriptionId, {
        cancel_at_period_end: true,
      })
    }
  }

  /**
   * Resume cancelled subscription
   */
  async resumeSubscription(tenant: Tenant): Promise<Stripe.Subscription> {
    if (!tenant.billing.stripeSubscriptionId) {
      throw new Error('No subscription found')
    }

    return await this.stripe.subscriptions.update(tenant.billing.stripeSubscriptionId, {
      cancel_at_period_end: false,
    })
  }

  /**
   * Create a checkout session for initial subscription
   */
  async createCheckoutSession(
    tenant: Tenant,
    plan: BillingPlan,
    interval: BillingInterval,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    // Get or create customer
    let customerId = tenant.billing.stripeCustomerId

    if (!customerId) {
      customerId = await this.createCustomer(tenant)
    }

    // Get price ID
    const planConfig: SubscriptionPlan = (DEFAULT_PLANS as any)[plan]
    const priceId =
      interval === 'monthly' ? planConfig.stripePriceIdMonthly : planConfig.stripePriceIdYearly

    if (!priceId) {
      throw new Error(`Price ID not configured for plan: ${plan}/${interval}`)
    }

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tenant_id: tenant.id,
        tenant_slug: tenant.slug,
        plan,
        interval,
      },
    })

    return session
  }

  /**
   * Create a billing portal session
   */
  async createPortalSession(
    tenant: Tenant,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    if (!tenant.billing.stripeCustomerId) {
      throw new Error('No Stripe customer found')
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: tenant.billing.stripeCustomerId,
      return_url: returnUrl,
    })

    return session
  }

  /**
   * Process Stripe webhook event
   */
  async processWebhookEvent(
    event: Stripe.Event,
    signature: string,
    rawBody: string
  ): Promise<void> {
    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
    }

    try {
      this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err}`)
    }

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.trial_will_end':
        await this.handleTrialWillEnd(event.data.object as Stripe.Subscription)
        break

      default:
      // REMOVED: console.log(`Unhandled event type: ${event.type}`)
    }
  }

  /**
   * Get subscription usage for metered billing
   */
  async recordUsage(
    tenant: Tenant,
    quantity: number,
    action: 'increment' | 'set' = 'increment'
  ): Promise<void> {
    if (!tenant.billing.stripeSubscriptionId) {
      throw new Error('No active subscription found')
    }

    // Get subscription items
    const subscription = await this.stripe.subscriptions.retrieve(
      tenant.billing.stripeSubscriptionId,
      { expand: ['items'] }
    )

    // Find metered item (if any)
    const meteredItem = subscription.items.data.find((item) => {
      return (item.price as Stripe.Price & { usage_type?: string }).usage_type === 'metered'
    })

    if (!meteredItem) {
      return // No metered billing configured
    }

    // Record usage using the billing meter events API
    await this.stripe.billing.meterEvents.create({
      event_name: 'usage_record',
      payload: {
        stripe_customer_id: subscription.customer as string,
        value: String(quantity),
      },
    })
  }

  // Private webhook handlers

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const tenantId = subscription.metadata.tenant_id

    if (!tenantId) {
      logger.error('No tenant_id in subscription metadata')
      return
    }

    await this.tenantService.updateTenant(tenantId, {
      metadata: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0]?.price.id,
      },
    })
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const tenantId = subscription.metadata.tenant_id

    if (!tenantId) {
      return
    }

    const tenant = await this.tenantService.getTenantById(tenantId)

    if (!tenant) {
      return
    }

    // Update tenant billing status
    const status = subscription.status === 'active' ? 'active' : 'suspended'

    await this.tenantService.updateTenant(tenantId, {
      metadata: {
        ...tenant.metadata,
        stripeSubscriptionStatus: subscription.status,
      },
    })
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const tenantId = subscription.metadata.tenant_id

    if (!tenantId) {
      return
    }

    // Mark tenant as cancelled
    await this.tenantService.deleteTenant(tenantId)
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const invoiceWithSub = invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null
    }
    const subscriptionId =
      typeof invoiceWithSub.subscription === 'string'
        ? invoiceWithSub.subscription
        : invoiceWithSub.subscription?.id

    if (!subscriptionId) {
      return
    }

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
    const tenantId = subscription.metadata.tenant_id

    if (!tenantId) {
      return
    }

    // Update payment history
    await this.tenantService.updateTenant(tenantId, {
      metadata: {
        lastPaymentDate: new Date(invoice.created * 1000).toISOString(),
        lastPaymentAmount: invoice.amount_paid,
        lastPaymentStatus: 'succeeded',
      },
    })
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const invoiceWithSub = invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null
    }
    const subscriptionId =
      typeof invoiceWithSub.subscription === 'string'
        ? invoiceWithSub.subscription
        : invoiceWithSub.subscription?.id

    if (!subscriptionId) {
      return
    }

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
    const tenantId = subscription.metadata.tenant_id

    if (!tenantId) {
      return
    }

    // Update payment status and potentially suspend tenant
    await this.tenantService.updateTenant(tenantId, {
      metadata: {
        lastPaymentStatus: 'failed',
      },
    })
  }

  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    const tenantId = subscription.metadata.tenant_id

    if (!tenantId) {
      return
    }

    // REMOVED: console.log(`Trial ending soon for tenant: ${tenantId}`)
  }
}

// Singleton instance
let stripeBillingService: StripeBillingService | null = null

export function getStripeBillingService(): StripeBillingService {
  if (!stripeBillingService) {
    stripeBillingService = new StripeBillingService()
  }
  return stripeBillingService
}
