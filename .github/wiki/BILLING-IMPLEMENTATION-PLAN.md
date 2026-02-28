# Billing and Subscriptions Implementation Plan

**Version:** 0.9.1
**Date:** February 3, 2026
**Status:** Planning
**Tasks:** TODO.md #96-100 (Phase 12)

---

## Executive Summary

This document outlines the comprehensive implementation plan for billing, subscriptions, crypto payments, and token-gated access in nChat. The implementation leverages the existing nself Stripe plugin and builds upon the existing billing infrastructure already in place.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Plan Tiers and Feature Limits](#2-plan-tiers-and-feature-limits)
3. [Stripe Integration (Task #96)](#3-stripe-integration-task-96)
4. [Plan Restrictions - Server-Side (Task #97)](#4-plan-restrictions---server-side-task-97)
5. [Crypto Payments (Task #98)](#5-crypto-payments-task-98)
6. [Token-Gated Access (Task #99)](#6-token-gated-access-task-99)
7. [Paid Channel Restrictions (Task #100)](#7-paid-channel-restrictions-task-100)
8. [Database Schema](#8-database-schema)
9. [API Endpoints](#9-api-endpoints)
10. [UI Components](#10-ui-components)
11. [Implementation Timeline](#11-implementation-timeline)
12. [Testing Strategy](#12-testing-strategy)
13. [Security Considerations](#13-security-considerations)

---

## 1. Current State Analysis

### 1.1 Existing nself Stripe Plugin

**Location:** `/Users/admin/Sites/nself-plugins/plugins/stripe`

The Stripe plugin provides a solid foundation with:

#### Tables Already Available

| Table                    | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `stripe_customers`       | Customer profiles with metadata, balance, addresses |
| `stripe_products`        | Product catalog with attributes                     |
| `stripe_prices`          | Pricing tiers (one-time and recurring)              |
| `stripe_subscriptions`   | Subscription details, status, trial info            |
| `stripe_invoices`        | Invoice history with line items                     |
| `stripe_payment_intents` | Payment attempts and status                         |
| `stripe_payment_methods` | Saved payment methods                               |
| `stripe_webhook_events`  | Webhook event log for audit                         |

#### Plugin Features

- Full data sync service (`StripeSyncService`)
- 24+ webhook event handlers
- REST API for querying synced data
- Analytics views (MRR, active subscriptions, failed payments)
- Incremental sync support

#### Webhook Events Handled

- `customer.*` (created, updated, deleted)
- `subscription.*` (created, updated, deleted, trial_will_end)
- `invoice.*` (created, paid, payment_failed)
- `payment_intent.*` (succeeded, failed, canceled)
- `payment_method.*` (attached, detached, updated)

### 1.2 Existing nChat Billing Code

**Location:** `/Users/admin/Sites/nself-chat/src/lib/billing/`

Current implementation includes:

#### StripeBillingService (`stripe-service.ts`)

- Customer creation
- Subscription management (create, update, cancel, resume)
- Checkout session creation
- Billing portal integration
- Webhook processing
- Usage-based billing support

#### SubscriptionManager (`subscription-manager.ts`)

- Plan tier management (free, pro, enterprise)
- Feature access control
- Usage tracking and limits
- Billing cycle management
- Upgrade/downgrade preview

#### Existing API Routes

- `POST /api/billing/checkout` - Create checkout session
- `POST /api/billing/portal` - Create billing portal session
- `POST /api/billing/webhook` - Stripe webhook endpoint

### 1.3 Existing Wallet/Crypto Infrastructure

**Location:** `/Users/admin/Sites/nself-chat/src/lib/wallet/`

- `WalletConnector` - MetaMask, Coinbase Wallet, WalletConnect support
- `TokenGate` component - NFT/token ownership verification
- Multi-chain support (Ethereum, Polygon, Arbitrum, Optimism, Base, BSC)
- Transaction management

### 1.4 Gaps to Address

1. **Stripe plugin not installed** in nChat backend
2. **Server-side plan enforcement** not implemented
3. **Crypto payment processing** not connected to subscriptions
4. **Token-gated channels** not implemented
5. **Usage tracking** not persisted to database
6. **Plan restriction middleware** missing

---

## 2. Plan Tiers and Feature Limits

### 2.1 Plan Definition

| Feature               | Free   | Pro ($15/mo) | Enterprise ($99/mo) | Custom    |
| --------------------- | ------ | ------------ | ------------------- | --------- |
| **Users**             | 10     | 100          | Unlimited           | Unlimited |
| **Channels**          | 5      | 50           | Unlimited           | Unlimited |
| **Storage**           | 1 GB   | 100 GB       | Unlimited           | Unlimited |
| **API Calls/Month**   | 1,000  | 50,000       | Unlimited           | Unlimited |
| **File Upload Size**  | 10 MB  | 100 MB       | 500 MB              | 1 GB      |
| **Call Participants** | 4      | 25           | 100                 | 500       |
| **Stream Duration**   | 60 min | 240 min      | Unlimited           | Unlimited |
| **Direct Messages**   | Yes    | Yes          | Yes                 | Yes       |
| **Threads**           | Yes    | Yes          | Yes                 | Yes       |
| **Voice Messages**    | No     | Yes          | Yes                 | Yes       |
| **Video Calls**       | No     | Yes          | Yes                 | Yes       |
| **Screen Sharing**    | No     | Yes          | Yes                 | Yes       |
| **E2EE**              | No     | Yes          | Yes                 | Yes       |
| **Integrations**      | No     | Yes          | Yes                 | Yes       |
| **SSO**               | No     | No           | Yes                 | Yes       |
| **Audit Logs**        | No     | Yes          | Yes                 | Yes       |
| **White Label**       | No     | No           | Yes                 | Yes       |
| **Priority Support**  | No     | No           | Yes                 | Yes       |

### 2.2 Stripe Product/Price Configuration

```typescript
// Products to create in Stripe Dashboard
const STRIPE_PRODUCTS = {
  free: {
    name: 'nChat Free',
    description: 'For small teams getting started',
    prices: {
      monthly: { amount: 0, priceId: 'price_free' },
      yearly: { amount: 0, priceId: 'price_free_yearly' },
    },
  },
  pro: {
    name: 'nChat Pro',
    description: 'For growing teams that need more',
    prices: {
      monthly: { amount: 1500, priceId: 'price_pro_monthly' }, // $15.00
      yearly: { amount: 15000, priceId: 'price_pro_yearly' }, // $150.00
    },
  },
  enterprise: {
    name: 'nChat Enterprise',
    description: 'For large organizations',
    prices: {
      monthly: { amount: 9900, priceId: 'price_enterprise_monthly' }, // $99.00
      yearly: { amount: 99000, priceId: 'price_enterprise_yearly' }, // $990.00
    },
  },
}
```

---

## 3. Stripe Integration (Task #96)

### 3.1 Install and Configure Stripe Plugin

```bash
# In backend directory
cd backend
nself plugin install stripe
nself plugin init stripe

# Configure environment
cat >> .env << EOF
STRIPE_API_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_SYNC_INTERVAL=3600
EOF

# Apply schema and start sync
nself db migrate
nself plugin stripe sync
```

### 3.2 Customer Lifecycle

```typescript
// src/lib/billing/customer-service.ts

export class CustomerService {
  /**
   * Create or retrieve Stripe customer for a user
   */
  async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    // Check if customer exists in local DB
    const existing = await this.db.query(
      'SELECT stripe_customer_id FROM nchat_users WHERE id = $1',
      [userId]
    )

    if (existing?.stripe_customer_id) {
      return existing.stripe_customer_id
    }

    // Create new Stripe customer
    const customer = await this.stripe.customers.create({
      email,
      metadata: {
        user_id: userId,
        created_by: 'nchat',
      },
    })

    // Store reference
    await this.db.query('UPDATE nchat_users SET stripe_customer_id = $1 WHERE id = $2', [
      customer.id,
      userId,
    ])

    return customer.id
  }

  /**
   * Link tenant to Stripe customer
   */
  async linkTenantToCustomer(tenantId: string, customerId: string): Promise<void> {
    await this.db.query(
      `UPDATE nchat_tenants
       SET billing_stripe_customer_id = $1, updated_at = NOW()
       WHERE id = $2`,
      [customerId, tenantId]
    )
  }
}
```

### 3.3 Subscription Management

```typescript
// src/lib/billing/subscription-service.ts

export class SubscriptionService {
  /**
   * Create subscription with optional trial
   */
  async createSubscription(params: {
    customerId: string
    priceId: string
    tenantId: string
    trialDays?: number
    couponId?: string
  }): Promise<Stripe.Subscription> {
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: params.customerId,
      items: [{ price: params.priceId }],
      metadata: {
        tenant_id: params.tenantId,
      },
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    }

    if (params.trialDays) {
      subscriptionParams.trial_period_days = params.trialDays
    }

    if (params.couponId) {
      subscriptionParams.coupon = params.couponId
    }

    return await this.stripe.subscriptions.create(subscriptionParams)
  }

  /**
   * Change subscription plan (upgrade/downgrade)
   */
  async changePlan(
    subscriptionId: string,
    newPriceId: string,
    options: {
      prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
      billingCycleAnchor?: 'now' | 'unchanged'
    } = {}
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)

    return await this.stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: options.prorationBehavior ?? 'create_prorations',
      billing_cycle_anchor: options.billingCycleAnchor ?? 'unchanged',
    })
  }

  /**
   * Cancel subscription (immediate or at period end)
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<Stripe.Subscription> {
    if (immediately) {
      return await this.stripe.subscriptions.cancel(subscriptionId)
    }

    return await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
  }

  /**
   * Resume cancelled subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })
  }
}
```

### 3.4 Webhook Processing

```typescript
// src/app/api/billing/webhook/route.ts (enhanced)

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSubscriptionService } from '@/lib/billing/subscription-service'
import { getPlanEnforcementService } from '@/lib/billing/plan-enforcement'
import { getNotificationService } from '@/lib/notifications'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')!
  const body = await request.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const subscriptionService = getSubscriptionService()
  const planEnforcement = getPlanEnforcementService()
  const notifications = getNotificationService()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const tenantId = subscription.metadata.tenant_id

        if (tenantId) {
          // Update tenant plan based on subscription
          const priceId = subscription.items.data[0].price.id
          const plan = await subscriptionService.getPlanFromPriceId(priceId)

          await planEnforcement.updateTenantPlan(tenantId, plan, {
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const tenantId = subscription.metadata.tenant_id

        if (tenantId) {
          // Downgrade to free plan
          await planEnforcement.updateTenantPlan(tenantId, 'free', {
            stripeSubscriptionId: null,
            status: 'canceled',
          })

          // Notify owner
          await notifications.sendSubscriptionCanceled(tenantId)
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId =
          typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id

        if (subscriptionId) {
          await subscriptionService.recordPayment({
            invoiceId: invoice.id,
            subscriptionId,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            paidAt: new Date(),
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId =
          typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const tenantId = subscription.metadata.tenant_id

          if (tenantId) {
            // Mark subscription as past_due
            await planEnforcement.markPastDue(tenantId)

            // Notify owner
            await notifications.sendPaymentFailed(tenantId, {
              invoiceId: invoice.id,
              amount: invoice.amount_due,
              attemptCount: invoice.attempt_count ?? 0,
              nextAttempt: invoice.next_payment_attempt
                ? new Date(invoice.next_payment_attempt * 1000)
                : null,
            })
          }
        }
        break
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription
        const tenantId = subscription.metadata.tenant_id

        if (tenantId) {
          await notifications.sendTrialEnding(tenantId, {
            trialEnd: new Date(subscription.trial_end! * 1000),
            daysRemaining: 3,
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
```

### 3.5 Invoice Management

```typescript
// src/lib/billing/invoice-service.ts

export class InvoiceService {
  /**
   * Get invoices for a customer
   */
  async getInvoices(
    customerId: string,
    options: { limit?: number; status?: Stripe.Invoice.Status } = {}
  ): Promise<Stripe.Invoice[]> {
    const params: Stripe.InvoiceListParams = {
      customer: customerId,
      limit: options.limit ?? 10,
    }

    if (options.status) {
      params.status = options.status
    }

    const invoices = await this.stripe.invoices.list(params)
    return invoices.data
  }

  /**
   * Get invoice PDF URL
   */
  async getInvoicePdf(invoiceId: string): Promise<string | null> {
    const invoice = await this.stripe.invoices.retrieve(invoiceId)
    return invoice.invoice_pdf ?? null
  }

  /**
   * Create one-time invoice for add-ons
   */
  async createOneTimeInvoice(
    customerId: string,
    items: Array<{ description: string; amount: number }>
  ): Promise<Stripe.Invoice> {
    // Create invoice items
    for (const item of items) {
      await this.stripe.invoiceItems.create({
        customer: customerId,
        amount: item.amount,
        currency: 'usd',
        description: item.description,
      })
    }

    // Create and finalize invoice
    const invoice = await this.stripe.invoices.create({
      customer: customerId,
      auto_advance: true,
    })

    return await this.stripe.invoices.finalizeInvoice(invoice.id)
  }
}
```

---

## 4. Plan Restrictions - Server-Side (Task #97)

### 4.1 Plan Enforcement Middleware

```typescript
// src/middleware/plan-enforcement.ts

import { NextRequest, NextResponse } from 'next/server'
import { getTenantFromRequest } from '@/lib/tenants/tenant-middleware'
import { getPlanEnforcementService } from '@/lib/billing/plan-enforcement'

interface PlanRestriction {
  feature: string
  limit?: number
  action: 'block' | 'warn' | 'upgrade_prompt'
}

export async function planEnforcementMiddleware(
  request: NextRequest,
  restrictions: PlanRestriction[]
): Promise<NextResponse | null> {
  const tenant = await getTenantFromRequest(request)

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const enforcement = getPlanEnforcementService()

  for (const restriction of restrictions) {
    const access = await enforcement.checkFeatureAccess(
      tenant.id,
      restriction.feature,
      restriction.limit
    )

    if (!access.allowed) {
      if (restriction.action === 'block') {
        return NextResponse.json(
          {
            error: 'Plan limit reached',
            feature: restriction.feature,
            currentUsage: access.currentUsage,
            limit: access.limit,
            upgradeRequired: access.upgradeRequired,
          },
          { status: 403 }
        )
      }

      // For 'warn' action, add header but continue
      const response = NextResponse.next()
      response.headers.set(
        'X-Plan-Warning',
        JSON.stringify({
          feature: restriction.feature,
          message: access.message,
        })
      )
      return response
    }
  }

  return null // Continue processing
}
```

### 4.2 Plan Enforcement Service

```typescript
// src/lib/billing/plan-enforcement.ts

import { DEFAULT_PLANS, TenantFeatures, TenantLimits } from '@/lib/tenants/types'

export interface FeatureAccessResult {
  allowed: boolean
  currentUsage?: number
  limit?: number
  message?: string
  upgradeRequired?: string
}

export class PlanEnforcementService {
  /**
   * Check if a tenant has access to a feature
   */
  async checkFeatureAccess(
    tenantId: string,
    feature: keyof TenantFeatures,
    additionalUsage: number = 0
  ): Promise<FeatureAccessResult> {
    const tenant = await this.getTenant(tenantId)
    const plan = DEFAULT_PLANS[tenant.billing.plan]

    // Check if feature is enabled for plan
    if (!plan.features[feature]) {
      return {
        allowed: false,
        message: `${feature} is not available on your current plan`,
        upgradeRequired: this.getUpgradePlan(tenant.billing.plan),
      }
    }

    return { allowed: true }
  }

  /**
   * Check if a tenant is within usage limits
   */
  async checkUsageLimit(
    tenantId: string,
    limitType: keyof TenantLimits,
    additionalUsage: number = 1
  ): Promise<FeatureAccessResult> {
    const tenant = await this.getTenant(tenantId)
    const plan = DEFAULT_PLANS[tenant.billing.plan]
    const limit = plan.limits[limitType]

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true }
    }

    const currentUsage = await this.getCurrentUsage(tenantId, limitType)
    const newUsage = currentUsage + additionalUsage

    if (newUsage > limit) {
      return {
        allowed: false,
        currentUsage,
        limit,
        message: `You've reached your ${limitType} limit (${currentUsage}/${limit})`,
        upgradeRequired: this.getUpgradePlan(tenant.billing.plan),
      }
    }

    return { allowed: true, currentUsage, limit }
  }

  /**
   * Get current usage for a limit type
   */
  private async getCurrentUsage(tenantId: string, limitType: keyof TenantLimits): Promise<number> {
    const usageQueries: Record<string, string> = {
      maxUsers: `SELECT COUNT(*) FROM nchat_users WHERE tenant_id = $1 AND deleted_at IS NULL`,
      maxChannels: `SELECT COUNT(*) FROM nchat_channels WHERE tenant_id = $1 AND deleted_at IS NULL`,
      maxStorageGB: `SELECT COALESCE(SUM(size_bytes), 0) / 1073741824 FROM nchat_files WHERE tenant_id = $1`,
      maxApiCallsPerMonth: `
        SELECT COUNT(*) FROM nchat_api_logs
        WHERE tenant_id = $1
        AND created_at >= date_trunc('month', NOW())
      `,
    }

    const query = usageQueries[limitType]
    if (!query) return 0

    const result = await this.db.query(query, [tenantId])
    return parseInt(result.rows[0].count || '0', 10)
  }

  /**
   * Enforce message limit (track and check)
   */
  async checkMessageLimit(tenantId: string): Promise<FeatureAccessResult> {
    const tenant = await this.getTenant(tenantId)
    const plan = DEFAULT_PLANS[tenant.billing.plan]

    // Pro and Enterprise have unlimited messages
    if (plan.limits.maxApiCallsPerMonth === -1) {
      return { allowed: true }
    }

    // For Free tier, check monthly message count
    const messageCount = await this.db.query(
      `
      SELECT COUNT(*) FROM nchat_messages
      WHERE tenant_id = $1
      AND created_at >= date_trunc('month', NOW())
    `,
      [tenantId]
    )

    const count = parseInt(messageCount.rows[0].count, 10)
    const limit = 10000 // Free tier message limit

    if (count >= limit) {
      return {
        allowed: false,
        currentUsage: count,
        limit,
        message: 'Monthly message limit reached',
        upgradeRequired: 'pro',
      }
    }

    return { allowed: true, currentUsage: count, limit }
  }

  /**
   * Enforce file storage limit
   */
  async checkStorageLimit(tenantId: string, fileSizeBytes: number): Promise<FeatureAccessResult> {
    const tenant = await this.getTenant(tenantId)
    const plan = DEFAULT_PLANS[tenant.billing.plan]

    if (plan.limits.maxStorageGB === -1) {
      return { allowed: true }
    }

    const currentStorage = await this.db.query(
      `
      SELECT COALESCE(SUM(size_bytes), 0) as total_bytes
      FROM nchat_files
      WHERE tenant_id = $1 AND deleted_at IS NULL
    `,
      [tenantId]
    )

    const currentBytes = parseInt(currentStorage.rows[0].total_bytes, 10)
    const limitBytes = plan.limits.maxStorageGB * 1073741824 // Convert GB to bytes
    const newTotal = currentBytes + fileSizeBytes

    if (newTotal > limitBytes) {
      return {
        allowed: false,
        currentUsage: currentBytes,
        limit: limitBytes,
        message: `Storage limit reached (${this.formatBytes(currentBytes)}/${plan.limits.maxStorageGB} GB)`,
        upgradeRequired: this.getUpgradePlan(tenant.billing.plan),
      }
    }

    return { allowed: true, currentUsage: currentBytes, limit: limitBytes }
  }

  /**
   * Enforce file upload size limit
   */
  checkFileUploadSize(plan: string, fileSizeBytes: number): FeatureAccessResult {
    const planConfig = DEFAULT_PLANS[plan as keyof typeof DEFAULT_PLANS]
    const limitMB = planConfig.limits.maxFileUploadSizeMB
    const limitBytes = limitMB * 1048576

    if (fileSizeBytes > limitBytes) {
      return {
        allowed: false,
        currentUsage: fileSizeBytes,
        limit: limitBytes,
        message: `File size exceeds limit (${this.formatBytes(fileSizeBytes)}/${limitMB} MB)`,
        upgradeRequired: this.getUpgradePlan(plan),
      }
    }

    return { allowed: true }
  }

  /**
   * Record usage for tracking
   */
  async recordUsage(tenantId: string, metric: string, value: number): Promise<void> {
    await this.db.query(
      `
      INSERT INTO nchat_usage_tracking (tenant_id, metric, value, recorded_at)
      VALUES ($1, $2, $3, NOW())
    `,
      [tenantId, metric, value]
    )
  }

  /**
   * Update tenant plan after subscription change
   */
  async updateTenantPlan(
    tenantId: string,
    plan: string,
    subscriptionDetails: {
      stripeSubscriptionId: string | null
      status: string
      currentPeriodStart?: Date
      currentPeriodEnd?: Date
      cancelAtPeriodEnd?: boolean
    }
  ): Promise<void> {
    const planConfig = DEFAULT_PLANS[plan as keyof typeof DEFAULT_PLANS]

    await this.db.query(
      `
      UPDATE nchat_tenants SET
        billing_plan = $1,
        billing_stripe_subscription_id = $2,
        billing_status = $3,
        billing_current_period_start = $4,
        billing_current_period_end = $5,
        billing_cancel_at_period_end = $6,
        limits = $7,
        features = $8,
        updated_at = NOW()
      WHERE id = $9
    `,
      [
        plan,
        subscriptionDetails.stripeSubscriptionId,
        subscriptionDetails.status,
        subscriptionDetails.currentPeriodStart,
        subscriptionDetails.currentPeriodEnd,
        subscriptionDetails.cancelAtPeriodEnd ?? false,
        JSON.stringify(planConfig.limits),
        JSON.stringify(planConfig.features),
        tenantId,
      ]
    )
  }

  private getUpgradePlan(currentPlan: string): string {
    const upgradeMap: Record<string, string> = {
      free: 'pro',
      pro: 'enterprise',
      enterprise: 'custom',
    }
    return upgradeMap[currentPlan] ?? 'enterprise'
  }

  private formatBytes(bytes: number): string {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${bytes} B`
  }
}

let instance: PlanEnforcementService | null = null

export function getPlanEnforcementService(): PlanEnforcementService {
  if (!instance) {
    instance = new PlanEnforcementService()
  }
  return instance
}
```

### 4.3 API Route Protection

```typescript
// src/app/api/messages/route.ts (example with enforcement)

import { NextRequest, NextResponse } from 'next/server'
import { planEnforcementMiddleware } from '@/middleware/plan-enforcement'
import { getPlanEnforcementService } from '@/lib/billing/plan-enforcement'

export async function POST(request: NextRequest) {
  // Check plan restrictions
  const enforcementResult = await planEnforcementMiddleware(request, [
    { feature: 'publicChannels', action: 'block' },
  ])

  if (enforcementResult) return enforcementResult

  // Check message limit
  const tenantId = request.headers.get('x-tenant-id')!
  const enforcement = getPlanEnforcementService()
  const messageCheck = await enforcement.checkMessageLimit(tenantId)

  if (!messageCheck.allowed) {
    return NextResponse.json(
      {
        error: 'Message limit reached',
        ...messageCheck,
      },
      { status: 403 }
    )
  }

  // Process message creation...
  // Record usage
  await enforcement.recordUsage(tenantId, 'messages_sent', 1)

  return NextResponse.json({ success: true, message: createdMessage })
}
```

---

## 5. Crypto Payments (Task #98)

### 5.1 Crypto Payment Options Analysis

| Provider              | Pros                                          | Cons                           | Recommendation       |
| --------------------- | --------------------------------------------- | ------------------------------ | -------------------- |
| **Coinbase Commerce** | Easy setup, major currencies, hosted checkout | Limited tokens, 1% fee         | **Primary choice**   |
| **BTCPay Server**     | Self-hosted, no fees, privacy                 | Complex setup, Bitcoin-focused | For BTC purists      |
| **Request Network**   | Multi-chain, invoicing, crypto-native         | Smaller ecosystem              | Future consideration |
| **USDC on Base**      | Stablecoin, low fees, fast                    | Technical complexity           | Direct integration   |

### 5.2 Coinbase Commerce Integration

```typescript
// src/lib/payments/coinbase-commerce.ts

interface CoinbaseChargeParams {
  name: string
  description: string
  pricing_type: 'fixed_price' | 'no_price'
  local_price?: {
    amount: string
    currency: string
  }
  metadata?: Record<string, string>
  redirect_url?: string
  cancel_url?: string
}

interface CoinbaseCharge {
  id: string
  code: string
  hosted_url: string
  pricing: {
    local: { amount: string; currency: string }
    bitcoin: { amount: string; currency: string }
    ethereum: { amount: string; currency: string }
    usdc: { amount: string; currency: string }
  }
  payments: Array<{
    network: string
    transaction_id: string
    status: string
    value: { local: { amount: string; currency: string } }
  }>
  timeline: Array<{
    time: string
    status: string
  }>
}

export class CoinbaseCommerceService {
  private apiKey: string
  private apiUrl = 'https://api.commerce.coinbase.com'

  constructor() {
    this.apiKey = process.env.COINBASE_COMMERCE_API_KEY!
  }

  /**
   * Create a charge for subscription payment
   */
  async createSubscriptionCharge(params: {
    tenantId: string
    planId: string
    amount: number
    currency: string
    billingInterval: 'monthly' | 'yearly'
  }): Promise<CoinbaseCharge> {
    const charge = await this.createCharge({
      name: `nChat ${params.planId} Subscription`,
      description: `${params.billingInterval} subscription to nChat ${params.planId} plan`,
      pricing_type: 'fixed_price',
      local_price: {
        amount: (params.amount / 100).toFixed(2),
        currency: params.currency.toUpperCase(),
      },
      metadata: {
        tenant_id: params.tenantId,
        plan_id: params.planId,
        billing_interval: params.billingInterval,
        type: 'subscription',
      },
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
    })

    // Store pending charge
    await this.storePendingCharge(params.tenantId, charge)

    return charge
  }

  /**
   * Create a charge via Coinbase Commerce API
   */
  private async createCharge(params: CoinbaseChargeParams): Promise<CoinbaseCharge> {
    const response = await fetch(`${this.apiUrl}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': this.apiKey,
        'X-CC-Version': '2018-03-22',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Coinbase Commerce error: ${error.message}`)
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: string, signature: string): boolean {
    const crypto = require('crypto')
    const secret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET!

    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  }

  /**
   * Process webhook event
   */
  async processWebhook(event: { type: string; data: CoinbaseCharge }): Promise<void> {
    const charge = event.data
    const tenantId = charge.metadata?.tenant_id
    const planId = charge.metadata?.plan_id

    if (!tenantId || !planId) {
      console.error('Missing metadata in Coinbase webhook')
      return
    }

    switch (event.type) {
      case 'charge:confirmed':
        // Payment confirmed - activate subscription
        await this.activateCryptoSubscription(tenantId, planId, charge)
        break

      case 'charge:failed':
        // Payment failed - notify user
        await this.handleFailedPayment(tenantId, charge)
        break

      case 'charge:delayed':
        // Payment pending - multiple confirmations needed
        await this.handleDelayedPayment(tenantId, charge)
        break

      case 'charge:pending':
        // Payment detected but not confirmed
        await this.handlePendingPayment(tenantId, charge)
        break

      case 'charge:resolved':
        // Underpayment resolved
        await this.activateCryptoSubscription(tenantId, planId, charge)
        break
    }
  }

  /**
   * Activate subscription after successful crypto payment
   */
  private async activateCryptoSubscription(
    tenantId: string,
    planId: string,
    charge: CoinbaseCharge
  ): Promise<void> {
    const billingInterval = charge.metadata?.billing_interval as 'monthly' | 'yearly'
    const periodDays = billingInterval === 'yearly' ? 365 : 30

    await this.db.query(
      `
      UPDATE nchat_tenants SET
        billing_plan = $1,
        billing_status = 'active',
        billing_current_period_start = NOW(),
        billing_current_period_end = NOW() + INTERVAL '${periodDays} days',
        billing_payment_method = 'crypto',
        billing_last_payment_date = NOW(),
        billing_last_payment_amount = $2,
        billing_last_payment_currency = $3,
        billing_last_payment_tx = $4,
        updated_at = NOW()
      WHERE id = $5
    `,
      [
        planId,
        charge.pricing.local.amount,
        charge.pricing.local.currency,
        charge.payments[0]?.transaction_id,
        tenantId,
      ]
    )

    // Record payment
    await this.recordCryptoPayment(tenantId, charge)

    // Send confirmation
    await this.notifyPaymentSuccess(tenantId, charge)
  }

  private async storePendingCharge(tenantId: string, charge: CoinbaseCharge): Promise<void> {
    await this.db.query(
      `
      INSERT INTO nchat_crypto_charges (
        id, tenant_id, charge_code, hosted_url,
        amount, currency, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `,
      [
        charge.id,
        tenantId,
        charge.code,
        charge.hosted_url,
        charge.pricing.local.amount,
        charge.pricing.local.currency,
        'pending',
      ]
    )
  }

  private async recordCryptoPayment(tenantId: string, charge: CoinbaseCharge): Promise<void> {
    const payment = charge.payments[0]

    await this.db.query(
      `
      INSERT INTO nchat_crypto_payments (
        id, tenant_id, charge_id, network,
        transaction_id, amount, currency, status, confirmed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `,
      [
        crypto.randomUUID(),
        tenantId,
        charge.id,
        payment.network,
        payment.transaction_id,
        payment.value.local.amount,
        payment.value.local.currency,
        'confirmed',
      ]
    )
  }
}
```

### 5.3 Crypto Payment Webhook Endpoint

```typescript
// src/app/api/billing/crypto/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getCoinbaseCommerceService } from '@/lib/payments/coinbase-commerce'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-cc-webhook-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const body = await request.text()
  const coinbase = getCoinbaseCommerceService()

  if (!coinbase.verifyWebhook(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    const event = JSON.parse(body).event
    await coinbase.processWebhook(event)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Crypto webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
```

### 5.4 Direct Stablecoin (USDC) Payment

```typescript
// src/lib/payments/stablecoin-payment.ts

import { getWalletConnector } from '@/lib/wallet/wallet-connector'

interface StablecoinPaymentParams {
  tenantId: string
  planId: string
  amount: number // In cents
  chainId: string
}

export class StablecoinPaymentService {
  // USDC contract addresses by chain
  private readonly USDC_CONTRACTS: Record<string, string> = {
    '0x1': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum
    '0x89': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon
    '0xa4b1': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum
    '0xa': '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Optimism
    '0x2105': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  }

  // Treasury wallet address (receives payments)
  private readonly TREASURY_ADDRESS = process.env.TREASURY_WALLET_ADDRESS!

  /**
   * Initiate USDC payment via connected wallet
   */
  async initiatePayment(params: StablecoinPaymentParams): Promise<{
    txHash: string
    amount: string
    chainId: string
  }> {
    const wallet = getWalletConnector()

    if (!wallet.isConnected()) {
      throw new Error('Wallet not connected')
    }

    const usdcContract = this.USDC_CONTRACTS[params.chainId]
    if (!usdcContract) {
      throw new Error(`USDC not supported on chain ${params.chainId}`)
    }

    // USDC has 6 decimals
    const amountInUnits = (params.amount / 100) * 1000000
    const amountHex = '0x' + BigInt(Math.floor(amountInUnits)).toString(16)

    // ERC-20 transfer function signature
    const transferFunctionSignature = '0xa9059cbb'
    const paddedAddress = this.TREASURY_ADDRESS.slice(2).padStart(64, '0')
    const paddedAmount = amountHex.slice(2).padStart(64, '0')
    const data = transferFunctionSignature + paddedAddress + paddedAmount

    const ethereum = wallet.getEthereumProvider()
    if (!ethereum) {
      throw new Error('Ethereum provider not available')
    }

    // Send transaction
    const txHash = (await ethereum.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: wallet.getAddress(),
          to: usdcContract,
          data,
          chainId: params.chainId,
        },
      ],
    })) as string

    // Store pending payment
    await this.storePendingPayment({
      tenantId: params.tenantId,
      planId: params.planId,
      txHash,
      amount: params.amount,
      chainId: params.chainId,
      walletAddress: wallet.getAddress()!,
    })

    return {
      txHash,
      amount: (params.amount / 100).toFixed(2),
      chainId: params.chainId,
    }
  }

  /**
   * Verify payment transaction on-chain
   */
  async verifyPayment(
    txHash: string,
    chainId: string
  ): Promise<{
    confirmed: boolean
    blockNumber?: number
    amount?: string
  }> {
    const rpcUrl = this.getRpcUrl(chainId)

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      }),
    })

    const { result } = await response.json()

    if (!result) {
      return { confirmed: false }
    }

    // Check if transaction was successful
    if (result.status !== '0x1') {
      return { confirmed: false }
    }

    // Parse transfer amount from logs
    const transferLog = result.logs.find(
      (log: { topics: string[] }) =>
        log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    )

    if (!transferLog) {
      return { confirmed: false }
    }

    const amount = parseInt(transferLog.data, 16) / 1000000 // USDC has 6 decimals

    return {
      confirmed: true,
      blockNumber: parseInt(result.blockNumber, 16),
      amount: amount.toFixed(2),
    }
  }

  private getRpcUrl(chainId: string): string {
    const rpcUrls: Record<string, string> = {
      '0x1': `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      '0x89': 'https://polygon-rpc.com',
      '0xa4b1': 'https://arb1.arbitrum.io/rpc',
      '0xa': 'https://mainnet.optimism.io',
      '0x2105': 'https://mainnet.base.org',
    }
    return rpcUrls[chainId] ?? rpcUrls['0x1']
  }
}
```

---

## 6. Token-Gated Access (Task #99)

### 6.1 Token Gate Configuration

```typescript
// src/lib/token-gate/types.ts

export interface TokenGateRule {
  id: string
  name: string
  description?: string
  type: 'erc20' | 'erc721' | 'erc1155'
  contractAddress: string
  chainId: string
  condition: TokenGateCondition
  action: TokenGateAction
  createdAt: Date
  updatedAt: Date
}

export interface TokenGateCondition {
  type: 'minimum_balance' | 'specific_token' | 'trait_match'
  minimumBalance?: string
  tokenId?: string
  traitName?: string
  traitValue?: string
}

export interface TokenGateAction {
  type: 'grant_role' | 'grant_access' | 'unlock_feature' | 'unlock_channel'
  roleId?: string
  channelId?: string
  featureId?: string
}

export interface TokenGateVerificationResult {
  eligible: boolean
  rules: Array<{
    ruleId: string
    passed: boolean
    reason?: string
  }>
  balance?: string
  tokenIds?: string[]
}
```

### 6.2 Token Gate Verification Service

```typescript
// src/lib/token-gate/verification-service.ts

import { getWalletConnector } from '@/lib/wallet/wallet-connector'
import type { TokenGateRule, TokenGateVerificationResult } from './types'

// ERC-20 balanceOf ABI
const ERC20_BALANCE_OF_ABI = '0x70a08231'
// ERC-721 balanceOf ABI
const ERC721_BALANCE_OF_ABI = '0x70a08231'
// ERC-1155 balanceOf ABI
const ERC1155_BALANCE_OF_ABI = '0x00fdd58e'

export class TokenGateVerificationService {
  /**
   * Verify wallet eligibility against token gate rules
   */
  async verifyEligibility(
    walletAddress: string,
    rules: TokenGateRule[]
  ): Promise<TokenGateVerificationResult> {
    const results: TokenGateVerificationResult['rules'] = []
    let overallEligible = true

    for (const rule of rules) {
      const ruleResult = await this.verifyRule(walletAddress, rule)
      results.push({
        ruleId: rule.id,
        passed: ruleResult.passed,
        reason: ruleResult.reason,
      })

      if (!ruleResult.passed) {
        overallEligible = false
      }
    }

    return {
      eligible: overallEligible,
      rules: results,
    }
  }

  /**
   * Verify a single token gate rule
   */
  private async verifyRule(
    walletAddress: string,
    rule: TokenGateRule
  ): Promise<{ passed: boolean; reason?: string }> {
    try {
      switch (rule.type) {
        case 'erc20':
          return await this.verifyERC20(walletAddress, rule)
        case 'erc721':
          return await this.verifyERC721(walletAddress, rule)
        case 'erc1155':
          return await this.verifyERC1155(walletAddress, rule)
        default:
          return { passed: false, reason: 'Unknown token type' }
      }
    } catch (error) {
      console.error('Token verification error:', error)
      return { passed: false, reason: 'Verification failed' }
    }
  }

  /**
   * Verify ERC-20 token balance
   */
  private async verifyERC20(
    walletAddress: string,
    rule: TokenGateRule
  ): Promise<{ passed: boolean; reason?: string }> {
    const balance = await this.getERC20Balance(rule.contractAddress, walletAddress, rule.chainId)

    const minimumBalance = BigInt(rule.condition.minimumBalance ?? '0')
    const hasMinimum = BigInt(balance) >= minimumBalance

    return {
      passed: hasMinimum,
      reason: hasMinimum
        ? undefined
        : `Insufficient balance: ${balance} < ${rule.condition.minimumBalance}`,
    }
  }

  /**
   * Verify ERC-721 NFT ownership
   */
  private async verifyERC721(
    walletAddress: string,
    rule: TokenGateRule
  ): Promise<{ passed: boolean; reason?: string }> {
    if (rule.condition.type === 'specific_token' && rule.condition.tokenId) {
      // Check ownership of specific token
      const owner = await this.getERC721Owner(
        rule.contractAddress,
        rule.condition.tokenId,
        rule.chainId
      )

      const isOwner = owner.toLowerCase() === walletAddress.toLowerCase()
      return {
        passed: isOwner,
        reason: isOwner ? undefined : 'Not owner of specified NFT',
      }
    }

    // Check balance (owns any NFT from collection)
    const balance = await this.getERC721Balance(rule.contractAddress, walletAddress, rule.chainId)

    const minimumBalance = parseInt(rule.condition.minimumBalance ?? '1', 10)
    const hasMinimum = parseInt(balance, 10) >= minimumBalance

    return {
      passed: hasMinimum,
      reason: hasMinimum ? undefined : `Insufficient NFT balance: ${balance} < ${minimumBalance}`,
    }
  }

  /**
   * Verify ERC-1155 token balance
   */
  private async verifyERC1155(
    walletAddress: string,
    rule: TokenGateRule
  ): Promise<{ passed: boolean; reason?: string }> {
    const tokenId = rule.condition.tokenId ?? '0'
    const balance = await this.getERC1155Balance(
      rule.contractAddress,
      walletAddress,
      tokenId,
      rule.chainId
    )

    const minimumBalance = BigInt(rule.condition.minimumBalance ?? '1')
    const hasMinimum = BigInt(balance) >= minimumBalance

    return {
      passed: hasMinimum,
      reason: hasMinimum
        ? undefined
        : `Insufficient token balance: ${balance} < ${rule.condition.minimumBalance}`,
    }
  }

  // RPC call helpers
  private async getERC20Balance(
    contract: string,
    wallet: string,
    chainId: string
  ): Promise<string> {
    const data = ERC20_BALANCE_OF_ABI + wallet.slice(2).padStart(64, '0')
    return await this.ethCall(contract, data, chainId)
  }

  private async getERC721Balance(
    contract: string,
    wallet: string,
    chainId: string
  ): Promise<string> {
    const data = ERC721_BALANCE_OF_ABI + wallet.slice(2).padStart(64, '0')
    const result = await this.ethCall(contract, data, chainId)
    return parseInt(result, 16).toString()
  }

  private async getERC721Owner(
    contract: string,
    tokenId: string,
    chainId: string
  ): Promise<string> {
    const ownerOfAbi = '0x6352211e'
    const data = ownerOfAbi + BigInt(tokenId).toString(16).padStart(64, '0')
    const result = await this.ethCall(contract, data, chainId)
    return '0x' + result.slice(-40)
  }

  private async getERC1155Balance(
    contract: string,
    wallet: string,
    tokenId: string,
    chainId: string
  ): Promise<string> {
    const data =
      ERC1155_BALANCE_OF_ABI +
      wallet.slice(2).padStart(64, '0') +
      BigInt(tokenId).toString(16).padStart(64, '0')
    return await this.ethCall(contract, data, chainId)
  }

  private async ethCall(to: string, data: string, chainId: string): Promise<string> {
    const rpcUrl = this.getRpcUrl(chainId)

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to, data }, 'latest'],
        id: 1,
      }),
    })

    const { result, error } = await response.json()
    if (error) throw new Error(error.message)
    return result
  }

  private getRpcUrl(chainId: string): string {
    // Same as StablecoinPaymentService
    const rpcUrls: Record<string, string> = {
      '0x1': `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      '0x89': 'https://polygon-rpc.com',
      '0xa4b1': 'https://arb1.arbitrum.io/rpc',
      '0xa': 'https://mainnet.optimism.io',
      '0x2105': 'https://mainnet.base.org',
    }
    return rpcUrls[chainId] ?? rpcUrls['0x1']
  }
}
```

### 6.3 Token Gate Management API

```typescript
// src/app/api/token-gates/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTokenGateService } from '@/lib/token-gate/token-gate-service'
import { getTenantId } from '@/lib/tenants/tenant-middleware'

const createTokenGateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['erc20', 'erc721', 'erc1155']),
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: z.string(),
  condition: z.object({
    type: z.enum(['minimum_balance', 'specific_token', 'trait_match']),
    minimumBalance: z.string().optional(),
    tokenId: z.string().optional(),
    traitName: z.string().optional(),
    traitValue: z.string().optional(),
  }),
  action: z.object({
    type: z.enum(['grant_role', 'grant_access', 'unlock_feature', 'unlock_channel']),
    roleId: z.string().optional(),
    channelId: z.string().optional(),
    featureId: z.string().optional(),
  }),
})

export async function GET(request: NextRequest) {
  const tenantId = getTenantId(request)
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
  }

  const service = getTokenGateService()
  const gates = await service.getTokenGates(tenantId)

  return NextResponse.json({ gates })
}

export async function POST(request: NextRequest) {
  const tenantId = getTenantId(request)
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
  }

  const body = await request.json()
  const validation = createTokenGateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.errors },
      { status: 400 }
    )
  }

  const service = getTokenGateService()
  const gate = await service.createTokenGate(tenantId, validation.data)

  return NextResponse.json({ gate }, { status: 201 })
}
```

### 6.4 Token Gate Middleware for Channels

```typescript
// src/middleware/token-gate-middleware.ts

import { NextRequest, NextResponse } from 'next/server'
import { getTokenGateVerificationService } from '@/lib/token-gate/verification-service'
import { getTokenGateService } from '@/lib/token-gate/token-gate-service'

export async function tokenGateMiddleware(
  request: NextRequest,
  channelId: string
): Promise<NextResponse | null> {
  const walletAddress = request.headers.get('x-wallet-address')

  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet connection required', code: 'WALLET_REQUIRED' },
      { status: 401 }
    )
  }

  const tokenGateService = getTokenGateService()
  const rules = await tokenGateService.getChannelTokenGates(channelId)

  if (rules.length === 0) {
    return null // No token gates, allow access
  }

  const verificationService = getTokenGateVerificationService()
  const result = await verificationService.verifyEligibility(walletAddress, rules)

  if (!result.eligible) {
    return NextResponse.json(
      {
        error: 'Token gate verification failed',
        code: 'TOKEN_GATE_FAILED',
        rules: result.rules.filter((r) => !r.passed),
      },
      { status: 403 }
    )
  }

  return null // Access granted
}
```

---

## 7. Paid Channel Restrictions (Task #100)

### 7.1 Paid Channel Configuration

```typescript
// src/lib/channels/paid-channel-types.ts

export interface PaidChannelConfig {
  channelId: string
  monetizationType: 'subscription' | 'one_time' | 'tip_only' | 'token_gated'
  pricing?: {
    amount: number // In cents
    currency: string
    interval?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  }
  tokenGateConfig?: {
    rules: TokenGateRule[]
  }
  features: {
    allowPreview: boolean
    previewMessageCount?: number
    allowTips: boolean
    minimumTip?: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface ChannelSubscription {
  id: string
  channelId: string
  userId: string
  status: 'active' | 'cancelled' | 'expired' | 'past_due'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  stripeSubscriptionId?: string
  paymentMethod: 'stripe' | 'crypto'
  createdAt: Date
}
```

### 7.2 Paid Channel Service

```typescript
// src/lib/channels/paid-channel-service.ts

import Stripe from 'stripe'
import { getTokenGateVerificationService } from '@/lib/token-gate/verification-service'

export class PaidChannelService {
  private stripe: Stripe

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    })
  }

  /**
   * Configure a channel as paid
   */
  async configurePaidChannel(
    channelId: string,
    config: Omit<PaidChannelConfig, 'channelId' | 'createdAt' | 'updatedAt'>
  ): Promise<PaidChannelConfig> {
    // Create Stripe product and price if subscription-based
    if (config.monetizationType === 'subscription' && config.pricing) {
      const product = await this.stripe.products.create({
        name: `Channel Access: ${channelId}`,
        metadata: { channel_id: channelId },
      })

      const price = await this.stripe.prices.create({
        product: product.id,
        unit_amount: config.pricing.amount,
        currency: config.pricing.currency,
        recurring: {
          interval: this.mapInterval(config.pricing.interval ?? 'monthly'),
        },
        metadata: { channel_id: channelId },
      })

      await this.db.query(
        `
        UPDATE nchat_channels SET
          paid_config = $1,
          stripe_product_id = $2,
          stripe_price_id = $3,
          updated_at = NOW()
        WHERE id = $4
      `,
        [JSON.stringify(config), product.id, price.id, channelId]
      )
    } else {
      await this.db.query(
        `
        UPDATE nchat_channels SET
          paid_config = $1,
          updated_at = NOW()
        WHERE id = $2
      `,
        [JSON.stringify(config), channelId]
      )
    }

    return {
      channelId,
      ...config,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  /**
   * Check if user has access to paid channel
   */
  async checkChannelAccess(
    channelId: string,
    userId: string,
    walletAddress?: string
  ): Promise<{
    hasAccess: boolean
    reason?: string
    subscriptionRequired?: boolean
    tokenGateRequired?: boolean
    previewAllowed?: boolean
  }> {
    const channel = await this.getChannel(channelId)

    if (!channel.paidConfig) {
      return { hasAccess: true }
    }

    const config = channel.paidConfig as PaidChannelConfig

    // Check for active subscription
    if (config.monetizationType === 'subscription' || config.monetizationType === 'one_time') {
      const subscription = await this.getActiveSubscription(channelId, userId)

      if (subscription) {
        return { hasAccess: true }
      }

      return {
        hasAccess: false,
        subscriptionRequired: true,
        previewAllowed: config.features.allowPreview,
        reason: 'Subscription required for full access',
      }
    }

    // Check token gate
    if (config.monetizationType === 'token_gated' && config.tokenGateConfig) {
      if (!walletAddress) {
        return {
          hasAccess: false,
          tokenGateRequired: true,
          reason: 'Wallet connection required',
        }
      }

      const verificationService = getTokenGateVerificationService()
      const result = await verificationService.verifyEligibility(
        walletAddress,
        config.tokenGateConfig.rules
      )

      if (!result.eligible) {
        return {
          hasAccess: false,
          tokenGateRequired: true,
          previewAllowed: config.features.allowPreview,
          reason: 'Token requirements not met',
        }
      }

      return { hasAccess: true }
    }

    // Tip-only channels are always accessible
    if (config.monetizationType === 'tip_only') {
      return { hasAccess: true }
    }

    return { hasAccess: true }
  }

  /**
   * Subscribe user to paid channel
   */
  async subscribeToChannel(
    channelId: string,
    userId: string,
    paymentMethodId?: string
  ): Promise<ChannelSubscription> {
    const channel = await this.getChannel(channelId)
    const config = channel.paidConfig as PaidChannelConfig

    if (!channel.stripePriceId) {
      throw new Error('Channel not configured for subscriptions')
    }

    // Get or create customer
    const user = await this.getUser(userId)
    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: { user_id: userId },
      })
      customerId = customer.id
      await this.updateUserStripeCustomerId(userId, customerId)
    }

    // Create subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: channel.stripePriceId }],
      default_payment_method: paymentMethodId,
      metadata: {
        channel_id: channelId,
        user_id: userId,
      },
    })

    // Store subscription
    const channelSub: ChannelSubscription = {
      id: crypto.randomUUID(),
      channelId,
      userId,
      status: 'active',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      stripeSubscriptionId: subscription.id,
      paymentMethod: 'stripe',
      createdAt: new Date(),
    }

    await this.db.query(
      `
      INSERT INTO nchat_channel_subscriptions (
        id, channel_id, user_id, status,
        current_period_start, current_period_end,
        stripe_subscription_id, payment_method, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
      [
        channelSub.id,
        channelSub.channelId,
        channelSub.userId,
        channelSub.status,
        channelSub.currentPeriodStart,
        channelSub.currentPeriodEnd,
        channelSub.stripeSubscriptionId,
        channelSub.paymentMethod,
        channelSub.createdAt,
      ]
    )

    return channelSub
  }

  /**
   * Process tip to channel/creator
   */
  async processTip(params: {
    channelId: string
    fromUserId: string
    amount: number
    currency: string
    message?: string
    paymentMethodId: string
  }): Promise<{ success: boolean; paymentIntentId: string }> {
    const channel = await this.getChannel(params.channelId)
    const creator = await this.getUser(channel.creatorId)

    if (!creator.stripeAccountId) {
      throw new Error('Creator has not set up payments')
    }

    // Create payment intent with transfer to creator
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      payment_method: params.paymentMethodId,
      confirm: true,
      transfer_data: {
        destination: creator.stripeAccountId,
      },
      metadata: {
        type: 'tip',
        channel_id: params.channelId,
        from_user_id: params.fromUserId,
        message: params.message ?? '',
      },
    })

    // Record tip
    await this.db.query(
      `
      INSERT INTO nchat_channel_tips (
        id, channel_id, from_user_id, amount, currency,
        message, stripe_payment_intent_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `,
      [
        crypto.randomUUID(),
        params.channelId,
        params.fromUserId,
        params.amount,
        params.currency,
        params.message,
        paymentIntent.id,
      ]
    )

    return {
      success: paymentIntent.status === 'succeeded',
      paymentIntentId: paymentIntent.id,
    }
  }

  private mapInterval(interval: string): Stripe.Price.Recurring.Interval {
    const map: Record<string, Stripe.Price.Recurring.Interval> = {
      daily: 'day',
      weekly: 'week',
      monthly: 'month',
      yearly: 'year',
    }
    return map[interval] ?? 'month'
  }
}
```

### 7.3 Channel Access Middleware

```typescript
// src/app/api/channels/[channelId]/messages/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getPaidChannelService } from '@/lib/channels/paid-channel-service'

export async function GET(request: NextRequest, { params }: { params: { channelId: string } }) {
  const userId = request.headers.get('x-user-id')!
  const walletAddress = request.headers.get('x-wallet-address')

  const paidChannelService = getPaidChannelService()
  const access = await paidChannelService.checkChannelAccess(
    params.channelId,
    userId,
    walletAddress ?? undefined
  )

  if (!access.hasAccess) {
    if (access.previewAllowed) {
      // Return limited preview
      const previewMessages = await getChannelMessages(params.channelId, {
        limit: access.previewMessageCount ?? 5,
        preview: true,
      })

      return NextResponse.json({
        messages: previewMessages,
        isPreview: true,
        accessRequired: {
          subscription: access.subscriptionRequired,
          tokenGate: access.tokenGateRequired,
        },
      })
    }

    return NextResponse.json(
      {
        error: 'Access denied',
        reason: access.reason,
        accessRequired: {
          subscription: access.subscriptionRequired,
          tokenGate: access.tokenGateRequired,
        },
      },
      { status: 403 }
    )
  }

  // Full access
  const messages = await getChannelMessages(params.channelId)
  return NextResponse.json({ messages })
}
```

---

## 8. Database Schema

### 8.1 New Tables

```sql
-- ============================================================================
-- Usage Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS nchat_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES nchat_tenants(id),
    metric VARCHAR(100) NOT NULL,
    value BIGINT NOT NULL DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_usage_tenant_metric (tenant_id, metric),
    INDEX idx_usage_recorded (recorded_at)
);

-- Monthly aggregated usage
CREATE TABLE IF NOT EXISTS nchat_usage_monthly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES nchat_tenants(id),
    period VARCHAR(7) NOT NULL, -- YYYY-MM
    messages_sent BIGINT DEFAULT 0,
    files_uploaded BIGINT DEFAULT 0,
    storage_bytes BIGINT DEFAULT 0,
    api_calls BIGINT DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE (tenant_id, period)
);

-- ============================================================================
-- Crypto Payments
-- ============================================================================

CREATE TABLE IF NOT EXISTS nchat_crypto_charges (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES nchat_tenants(id),
    charge_code VARCHAR(50) NOT NULL,
    hosted_url TEXT NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    plan_id VARCHAR(50),
    billing_interval VARCHAR(20),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_crypto_charges_tenant (tenant_id),
    INDEX idx_crypto_charges_status (status)
);

CREATE TABLE IF NOT EXISTS nchat_crypto_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES nchat_tenants(id),
    charge_id VARCHAR(255) REFERENCES nchat_crypto_charges(id),
    network VARCHAR(50) NOT NULL, -- ethereum, bitcoin, polygon, etc.
    transaction_id VARCHAR(255) NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_crypto_payments_tenant (tenant_id),
    INDEX idx_crypto_payments_tx (transaction_id)
);

-- ============================================================================
-- Token Gates
-- ============================================================================

CREATE TABLE IF NOT EXISTS nchat_token_gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES nchat_tenants(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL, -- erc20, erc721, erc1155
    contract_address VARCHAR(42) NOT NULL,
    chain_id VARCHAR(20) NOT NULL,
    condition JSONB NOT NULL,
    action JSONB NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_token_gates_tenant (tenant_id),
    INDEX idx_token_gates_contract (contract_address)
);

-- Link token gates to channels
CREATE TABLE IF NOT EXISTS nchat_channel_token_gates (
    channel_id UUID NOT NULL REFERENCES nchat_channels(id),
    token_gate_id UUID NOT NULL REFERENCES nchat_token_gates(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    PRIMARY KEY (channel_id, token_gate_id)
);

-- Token gate verification cache
CREATE TABLE IF NOT EXISTS nchat_token_gate_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_gate_id UUID NOT NULL REFERENCES nchat_token_gates(id),
    wallet_address VARCHAR(42) NOT NULL,
    eligible BOOLEAN NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    INDEX idx_token_verifications_gate (token_gate_id),
    INDEX idx_token_verifications_wallet (wallet_address),
    UNIQUE (token_gate_id, wallet_address)
);

-- ============================================================================
-- Paid Channels
-- ============================================================================

CREATE TABLE IF NOT EXISTS nchat_paid_channel_configs (
    channel_id UUID PRIMARY KEY REFERENCES nchat_channels(id),
    monetization_type VARCHAR(20) NOT NULL, -- subscription, one_time, tip_only, token_gated
    pricing JSONB,
    token_gate_config JSONB,
    features JSONB NOT NULL DEFAULT '{}',
    stripe_product_id VARCHAR(255),
    stripe_price_id VARCHAR(255),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nchat_channel_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES nchat_channels(id),
    user_id UUID NOT NULL REFERENCES nchat_users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    stripe_subscription_id VARCHAR(255),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'stripe',
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_channel_subs_channel (channel_id),
    INDEX idx_channel_subs_user (user_id),
    INDEX idx_channel_subs_status (status),
    UNIQUE (channel_id, user_id)
);

CREATE TABLE IF NOT EXISTS nchat_channel_tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES nchat_channels(id),
    from_user_id UUID NOT NULL REFERENCES nchat_users(id),
    amount INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'usd',
    message TEXT,
    stripe_payment_intent_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_channel_tips_channel (channel_id),
    INDEX idx_channel_tips_from (from_user_id)
);

-- ============================================================================
-- Billing Extensions to Tenants
-- ============================================================================

ALTER TABLE nchat_tenants ADD COLUMN IF NOT EXISTS billing_stripe_customer_id VARCHAR(255);
ALTER TABLE nchat_tenants ADD COLUMN IF NOT EXISTS billing_stripe_subscription_id VARCHAR(255);
ALTER TABLE nchat_tenants ADD COLUMN IF NOT EXISTS billing_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE nchat_tenants ADD COLUMN IF NOT EXISTS billing_current_period_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE nchat_tenants ADD COLUMN IF NOT EXISTS billing_current_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE nchat_tenants ADD COLUMN IF NOT EXISTS billing_cancel_at_period_end BOOLEAN DEFAULT FALSE;
ALTER TABLE nchat_tenants ADD COLUMN IF NOT EXISTS billing_payment_method VARCHAR(20) DEFAULT 'stripe';
ALTER TABLE nchat_tenants ADD COLUMN IF NOT EXISTS billing_last_payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE nchat_tenants ADD COLUMN IF NOT EXISTS billing_last_payment_amount INTEGER;
ALTER TABLE nchat_tenants ADD COLUMN IF NOT EXISTS billing_last_payment_tx VARCHAR(255);

-- User wallet linking
ALTER TABLE nchat_users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE nchat_users ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255); -- For creators
ALTER TABLE nchat_users ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42);
ALTER TABLE nchat_users ADD COLUMN IF NOT EXISTS wallet_chain_id VARCHAR(20);
```

---

## 9. API Endpoints

### 9.1 Complete API Reference

| Method              | Endpoint                                   | Description               | Auth   |
| ------------------- | ------------------------------------------ | ------------------------- | ------ |
| **Plans**           |
| GET                 | `/api/billing/plans`                       | List available plans      | Public |
| GET                 | `/api/billing/plans/:id`                   | Get plan details          | Public |
| **Subscriptions**   |
| GET                 | `/api/billing/subscription`                | Get current subscription  | User   |
| POST                | `/api/billing/subscribe`                   | Create subscription       | User   |
| PUT                 | `/api/billing/subscription`                | Change plan               | User   |
| DELETE              | `/api/billing/subscription`                | Cancel subscription       | User   |
| POST                | `/api/billing/subscription/resume`         | Resume cancelled          | User   |
| **Checkout**        |
| POST                | `/api/billing/checkout`                    | Create checkout session   | User   |
| POST                | `/api/billing/portal`                      | Create billing portal     | User   |
| **Invoices**        |
| GET                 | `/api/billing/invoices`                    | List invoices             | User   |
| GET                 | `/api/billing/invoices/:id`                | Get invoice               | User   |
| GET                 | `/api/billing/invoices/:id/pdf`            | Get invoice PDF           | User   |
| **Payment Methods** |
| GET                 | `/api/billing/payment-methods`             | List payment methods      | User   |
| POST                | `/api/billing/payment-methods`             | Add payment method        | User   |
| DELETE              | `/api/billing/payment-methods/:id`         | Remove payment method     | User   |
| PUT                 | `/api/billing/payment-methods/:id/default` | Set default               | User   |
| **Usage**           |
| GET                 | `/api/billing/usage`                       | Get current usage         | User   |
| GET                 | `/api/billing/usage/history`               | Get usage history         | User   |
| **Crypto**          |
| POST                | `/api/billing/crypto/charge`               | Create crypto charge      | User   |
| GET                 | `/api/billing/crypto/charge/:id`           | Get charge status         | User   |
| POST                | `/api/billing/crypto/webhook`              | Coinbase webhook          | Public |
| POST                | `/api/billing/crypto/stablecoin`           | Initiate USDC payment     | User   |
| GET                 | `/api/billing/crypto/verify/:txHash`       | Verify transaction        | User   |
| **Token Gates**     |
| GET                 | `/api/token-gates`                         | List token gates          | Admin  |
| POST                | `/api/token-gates`                         | Create token gate         | Admin  |
| PUT                 | `/api/token-gates/:id`                     | Update token gate         | Admin  |
| DELETE              | `/api/token-gates/:id`                     | Delete token gate         | Admin  |
| POST                | `/api/token-gates/verify`                  | Verify wallet eligibility | User   |
| **Paid Channels**   |
| GET                 | `/api/channels/:id/monetization`           | Get monetization config   | Owner  |
| PUT                 | `/api/channels/:id/monetization`           | Configure monetization    | Owner  |
| POST                | `/api/channels/:id/subscribe`              | Subscribe to channel      | User   |
| DELETE              | `/api/channels/:id/subscribe`              | Unsubscribe               | User   |
| POST                | `/api/channels/:id/tip`                    | Send tip                  | User   |
| GET                 | `/api/channels/:id/subscribers`            | List subscribers          | Owner  |
| GET                 | `/api/channels/:id/tips`                   | List tips                 | Owner  |
| **Webhooks**        |
| POST                | `/api/billing/webhook`                     | Stripe webhook            | Public |

---

## 10. UI Components

### 10.1 Component List

```
src/components/billing/
├── PricingTable.tsx           # Plan comparison table
├── PlanCard.tsx               # Individual plan card
├── SubscriptionStatus.tsx     # Current subscription status
├── SubscriptionManager.tsx    # Manage subscription
├── BillingDashboard.tsx       # Full billing dashboard
├── UsageMeter.tsx             # Usage visualization
├── UsageChart.tsx             # Usage over time
├── InvoiceList.tsx            # Invoice history
├── InvoiceDetail.tsx          # Single invoice view
├── PaymentMethodList.tsx      # Saved payment methods
├── AddPaymentMethod.tsx       # Add card form
├── CheckoutModal.tsx          # Checkout flow
├── UpgradePrompt.tsx          # Upgrade CTA
├── LimitWarning.tsx           # Plan limit warning
├── CryptoPayment.tsx          # Crypto payment flow
├── CryptoPaymentStatus.tsx    # Payment confirmation
├── WalletConnect.tsx          # Wallet connection
├── TokenGateConfig.tsx        # Token gate setup
├── TokenGateStatus.tsx        # Token gate verification
├── PaidChannelConfig.tsx      # Channel monetization
├── ChannelSubscribeButton.tsx # Subscribe to channel
├── TipButton.tsx              # Send tip
├── CreatorEarnings.tsx        # Creator earnings dashboard
└── PayoutSettings.tsx         # Creator payout config
```

### 10.2 Key Component Examples

```tsx
// src/components/billing/SubscriptionStatus.tsx

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CreditCard, Calendar, AlertTriangle } from 'lucide-react'

interface SubscriptionStatusProps {
  onUpgrade?: () => void
  onManage?: () => void
}

export function SubscriptionStatus({ onUpgrade, onManage }: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [subRes, usageRes] = await Promise.all([
        fetch('/api/billing/subscription'),
        fetch('/api/billing/usage'),
      ])

      setSubscription(await subRes.json())
      setUsage(await usageRes.json())
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <div>Loading...</div>

  const daysRemaining = subscription?.currentPeriodEnd
    ? Math.ceil(
        (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Subscription</CardTitle>
        <Badge variant={subscription?.status === 'active' ? 'default' : 'destructive'}>
          {subscription?.status ?? 'free'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium capitalize">{subscription?.plan ?? 'Free'} Plan</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ${(subscription?.price ?? 0) / 100}/mo
          </span>
        </div>

        {subscription?.currentPeriodEnd && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {subscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} in {daysRemaining} days
            </span>
          </div>
        )}

        {subscription?.cancelAtPeriodEnd && (
          <div className="flex items-center gap-2 text-sm text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            <span>Subscription will not renew</span>
          </div>
        )}

        {/* Usage meters */}
        {usage?.metrics?.map((metric: any) => (
          <div key={metric.id} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{metric.name}</span>
              <span className="text-muted-foreground">
                {metric.current.toLocaleString()} /{' '}
                {metric.limit === -1 ? 'Unlimited' : metric.limit.toLocaleString()}
              </span>
            </div>
            {metric.limit !== -1 && <Progress value={(metric.current / metric.limit) * 100} />}
          </div>
        ))}

        <div className="flex gap-2 pt-2">
          {subscription?.plan !== 'enterprise' && (
            <Button onClick={onUpgrade} className="flex-1">
              Upgrade
            </Button>
          )}
          <Button variant="outline" onClick={onManage} className="flex-1">
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

```tsx
// src/components/billing/CryptoPayment.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ExternalLink, Wallet } from 'lucide-react'
import { useWallet } from '@/hooks/use-wallet'

interface CryptoPaymentProps {
  planId: string
  amount: number
  interval: 'monthly' | 'yearly'
  onSuccess: () => void
  onCancel: () => void
}

export function CryptoPayment({
  planId,
  amount,
  interval,
  onSuccess,
  onCancel,
}: CryptoPaymentProps) {
  const { isConnected, connect, address, chainId } = useWallet()
  const [method, setMethod] = useState<'coinbase' | 'direct'>('coinbase')
  const [loading, setLoading] = useState(false)
  const [chargeUrl, setChargeUrl] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const handleCoinbasePayment = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/billing/crypto/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, amount, interval }),
      })

      const { charge } = await response.json()
      setChargeUrl(charge.hosted_url)
      window.open(charge.hosted_url, '_blank')
    } catch (error) {
      console.error('Failed to create charge:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDirectPayment = async () => {
    if (!isConnected) {
      await connect()
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/billing/crypto/stablecoin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          amount,
          chainId,
          walletAddress: address,
        }),
      })

      const { txHash } = await response.json()
      setTxHash(txHash)

      // Poll for confirmation
      pollForConfirmation(txHash)
    } catch (error) {
      console.error('Payment failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const pollForConfirmation = async (hash: string) => {
    const maxAttempts = 60
    let attempts = 0

    const check = async () => {
      const response = await fetch(`/api/billing/crypto/verify/${hash}`)
      const { confirmed } = await response.json()

      if (confirmed) {
        onSuccess()
      } else if (attempts < maxAttempts) {
        attempts++
        setTimeout(check, 5000)
      }
    }

    check()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pay with Crypto</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={method} onValueChange={(v) => setMethod(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="coinbase">Coinbase Commerce</TabsTrigger>
            <TabsTrigger value="direct">Direct USDC</TabsTrigger>
          </TabsList>

          <TabsContent value="coinbase" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pay with BTC, ETH, USDC, or other cryptocurrencies via Coinbase Commerce.
            </p>

            {chargeUrl ? (
              <div className="space-y-2 text-center">
                <p>Payment window opened. Complete payment there.</p>
                <Button variant="link" asChild>
                  <a href={chargeUrl} target="_blank" rel="noopener">
                    Open payment page <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            ) : (
              <Button onClick={handleCoinbasePayment} disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Pay ${(amount / 100).toFixed(2)} with Crypto
              </Button>
            )}
          </TabsContent>

          <TabsContent value="direct" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pay directly with USDC from your connected wallet. Lower fees, instant confirmation.
            </p>

            {!isConnected ? (
              <Button onClick={() => connect()} className="w-full">
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            ) : txHash ? (
              <div className="space-y-2 text-center">
                <p className="text-sm">Transaction submitted. Waiting for confirmation...</p>
                <code className="text-xs">
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </code>
              </div>
            ) : (
              <Button onClick={handleDirectPayment} disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Pay ${(amount / 100).toFixed(2)} USDC
              </Button>
            )}
          </TabsContent>
        </Tabs>

        <Button variant="ghost" onClick={onCancel} className="mt-4 w-full">
          Cancel
        </Button>
      </CardContent>
    </Card>
  )
}
```

---

## 11. Implementation Timeline

### Phase 1: Core Stripe Integration (Week 1-2)

- [ ] Install and configure Stripe plugin in backend
- [ ] Implement enhanced webhook processing
- [ ] Add plan enforcement service
- [ ] Create billing API endpoints
- [ ] Build subscription management UI

### Phase 2: Plan Restrictions (Week 2-3)

- [ ] Implement plan enforcement middleware
- [ ] Add usage tracking to all relevant endpoints
- [ ] Create usage analytics dashboard
- [ ] Build upgrade prompts and limit warnings
- [ ] Test all plan limits

### Phase 3: Crypto Payments (Week 3-4)

- [ ] Integrate Coinbase Commerce
- [ ] Implement direct USDC payments
- [ ] Build crypto payment UI components
- [ ] Add transaction verification
- [ ] Test payment flows

### Phase 4: Token Gates (Week 4-5)

- [ ] Implement token verification service
- [ ] Build token gate management API
- [ ] Create token gate configuration UI
- [ ] Integrate with channel access
- [ ] Test across multiple chains

### Phase 5: Paid Channels (Week 5-6)

- [ ] Implement paid channel service
- [ ] Build channel monetization UI
- [ ] Add tip functionality
- [ ] Create creator earnings dashboard
- [ ] Test subscription and tip flows

### Phase 6: Testing and Documentation (Week 6-7)

- [ ] Write unit tests for all services
- [ ] Write integration tests for payment flows
- [ ] Write E2E tests for user journeys
- [ ] Update documentation
- [ ] Security audit

---

## 12. Testing Strategy

### 12.1 Unit Tests

```typescript
// src/lib/billing/__tests__/plan-enforcement.test.ts

describe('PlanEnforcementService', () => {
  describe('checkUsageLimit', () => {
    it('should allow usage within limits', async () => {
      const result = await service.checkUsageLimit('tenant-1', 'maxUsers', 1)
      expect(result.allowed).toBe(true)
    })

    it('should block usage exceeding limits', async () => {
      // Mock tenant at limit
      const result = await service.checkUsageLimit('tenant-1', 'maxUsers', 1)
      expect(result.allowed).toBe(false)
      expect(result.upgradeRequired).toBe('pro')
    })

    it('should allow unlimited for enterprise', async () => {
      // Mock enterprise tenant
      const result = await service.checkUsageLimit('enterprise-tenant', 'maxUsers', 1000)
      expect(result.allowed).toBe(true)
    })
  })
})
```

### 12.2 Integration Tests

```typescript
// src/__tests__/integration/billing-flow.test.ts

describe('Billing Flow', () => {
  it('should complete subscription upgrade', async () => {
    // Create checkout session
    const checkoutResponse = await fetch('/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'pro', interval: 'monthly' }),
    })
    expect(checkoutResponse.ok).toBe(true)

    // Simulate Stripe webhook
    await simulateStripeWebhook('customer.subscription.created', {
      metadata: { tenant_id: 'test-tenant' },
    })

    // Verify plan updated
    const subscription = await fetch('/api/billing/subscription')
    const data = await subscription.json()
    expect(data.plan).toBe('pro')
  })

  it('should enforce plan limits after downgrade', async () => {
    // Downgrade to free
    await fetch('/api/billing/subscription', { method: 'DELETE' })

    // Try to create channel beyond limit
    const response = await fetch('/api/channels', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Channel 6' }),
    })

    expect(response.status).toBe(403)
    const error = await response.json()
    expect(error.upgradeRequired).toBe('pro')
  })
})
```

### 12.3 E2E Tests

```typescript
// e2e/billing.spec.ts

test('user can upgrade subscription via Stripe', async ({ page }) => {
  await page.goto('/billing')

  // Click upgrade button
  await page.click('button:has-text("Upgrade to Pro")')

  // Fill Stripe checkout (in iframe)
  const stripeFrame = page.frameLocator('iframe[name^="stripe"]')
  await stripeFrame.locator('[name="cardnumber"]').fill('4242424242424242')
  await stripeFrame.locator('[name="exp-date"]').fill('12/30')
  await stripeFrame.locator('[name="cvc"]').fill('123')

  // Submit
  await page.click('button:has-text("Subscribe")')

  // Verify success
  await expect(page.locator('text=Welcome to Pro!')).toBeVisible()
})

test('user can pay with crypto', async ({ page }) => {
  await page.goto('/billing')

  await page.click('button:has-text("Pay with Crypto")')
  await page.click('tab:has-text("Coinbase Commerce")')
  await page.click('button:has-text("Pay")')

  // New window opens - we can't test Coinbase directly
  // But we can verify the charge was created
  const chargeId = await page.evaluate(() => localStorage.getItem('pendingChargeId'))
  expect(chargeId).toBeTruthy()
})
```

---

## 13. Security Considerations

### 13.1 Stripe Security

1. **Webhook Verification**: Always verify Stripe webhook signatures
2. **API Keys**: Store in environment variables, never commit
3. **PCI Compliance**: Use Stripe Elements/Checkout to avoid handling card data
4. **Idempotency**: Use idempotency keys for critical operations

### 13.2 Crypto Security

1. **Signature Verification**: Verify all webhook signatures from Coinbase
2. **Transaction Verification**: Always verify transactions on-chain
3. **Address Validation**: Validate wallet addresses before accepting payments
4. **Double-Spend Prevention**: Wait for sufficient confirmations

### 13.3 Token Gate Security

1. **Server-Side Verification**: Never trust client-side token ownership claims
2. **Caching with Expiry**: Cache verification results but expire them
3. **Rate Limiting**: Limit verification requests to prevent abuse
4. **Contract Verification**: Verify contract addresses are legitimate

### 13.4 Plan Enforcement

1. **Server-Side Only**: All plan enforcement must happen server-side
2. **Atomic Operations**: Use transactions for usage updates
3. **Grace Periods**: Allow brief grace periods for failed payments
4. **Audit Logging**: Log all plan changes and enforcement actions

---

## Appendix A: Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Coinbase Commerce
COINBASE_COMMERCE_API_KEY=xxx
COINBASE_COMMERCE_WEBHOOK_SECRET=xxx

# Crypto/Web3
INFURA_API_KEY=xxx
TREASURY_WALLET_ADDRESS=0x...

# Feature Flags
ENABLE_CRYPTO_PAYMENTS=true
ENABLE_TOKEN_GATES=true
ENABLE_PAID_CHANNELS=true
```

---

## Appendix B: Related Files

### Existing Code Locations

- `/Users/admin/Sites/nself-plugins/plugins/stripe/` - nself Stripe plugin
- `/Users/admin/Sites/nself-chat/src/lib/billing/` - Billing services
- `/Users/admin/Sites/nself-chat/src/lib/payments/` - Payment client
- `/Users/admin/Sites/nself-chat/src/lib/wallet/` - Wallet connector
- `/Users/admin/Sites/nself-chat/src/components/wallet/` - Wallet UI
- `/Users/admin/Sites/nself-chat/src/lib/tenants/types.ts` - Plan definitions

### Documentation

- `/Users/admin/Sites/nself-chat/TODO.md` - Tasks #96-100
- `/Users/admin/Sites/nself-plugins/plugins/stripe/README.md` - Plugin docs

---

**Document Version:** 1.0
**Last Updated:** February 3, 2026
**Author:** Claude Code
**Review Status:** Pending
