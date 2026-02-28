# Task 5: Stripe Client Implementation Plan

**Date**: February 5, 2026
**Priority**: P1 (HIGH)
**Estimated Time**: 8-12 hours
**Status**: PLANNING

---

## Current State Analysis

### What Exists ✅

1. **Complete Type Definitions** (lines 1-158)
   - PaymentIntent, Subscription, Invoice, Customer, PaymentMethod
   - All interfaces properly typed
   - Error handling types defined

2. **Full Method Signatures** (lines 163-1331)
   - All CRUD operations stubbed
   - Proper validation logic in place
   - Error handling structure correct

3. **Server-Side Integration** ✅
   - `/src/lib/billing/stripe-service.ts` - Already uses real Stripe API
   - Backend webhooks configured
   - Server-to-server communication working

### What's Missing ❌

1. **Real Stripe.js Loading** (line 190)
   - Currently just sets `initialized = true`
   - Needs to load `@stripe/stripe-js` library

2. **Real API Calls** (all methods)
   - All methods return mock data
   - No actual Stripe API communication
   - Mock IDs generated instead of real ones

3. **Stripe Elements Integration**
   - No payment form components
   - No secure card collection
   - No 3D Secure handling

---

## Implementation Plan

### Phase 1: Setup & Dependencies (30 min)

**1.1: Install Stripe.js**

```bash
pnpm add @stripe/stripe-js
pnpm add -D @types/stripe-js
```

**1.2: Configure Environment**

```bash
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...  # Server-side only
STRIPE_WEBHOOK_SECRET=whsec_...
```

**1.3: Verify Server Integration**

- Check `/src/lib/billing/stripe-service.ts` is using real API
- Ensure webhook endpoints exist
- Confirm database schema for payments

---

### Phase 2: Initialize Real Stripe.js (1 hour)

**2.1: Update `initialize()` Method**

**Current** (line 184-196):

```typescript
async initialize(): Promise<boolean> {
  if (this.initialized) {
    return true
  }
  try {
    // In a real implementation, this would load Stripe.js
    this.initialized = true
    return true
  } catch {
    return false
  }
}
```

**New**:

```typescript
import { loadStripe, Stripe } from '@stripe/stripe-js'

export class StripeClient {
  private config: StripeConfig
  private initialized: boolean = false
  private stripe: Stripe | null = null // Add this

  async initialize(): Promise<boolean> {
    if (this.initialized && this.stripe) {
      return true
    }

    try {
      this.stripe = await loadStripe(this.config.publishableKey)

      if (!this.stripe) {
        throw new Error('Failed to load Stripe.js')
      }

      this.initialized = true
      return true
    } catch (error) {
      console.error('Stripe initialization failed:', error)
      return false
    }
  }

  getStripe(): Stripe {
    if (!this.stripe) {
      throw new Error('Stripe not initialized. Call initialize() first.')
    }
    return this.stripe
  }
}
```

---

### Phase 3: Payment Intent Methods (2 hours)

**3.1: Create Payment Intent**

Replace mock implementation (lines 219-273) with:

```typescript
async createPaymentIntent(
  params: PaymentIntentParams
): Promise<StripeClientResult<PaymentIntent>> {
  if (!this.initialized || !this.stripe) {
    return {
      success: false,
      error: {
        code: 'not_initialized',
        message: 'Stripe client not initialized',
        type: 'api_error',
      },
    }
  }

  // Validation (keep existing)
  if (params.amount <= 0) { /* ... */ }
  if (!params.currency || params.currency.length !== 3) { /* ... */ }

  try {
    // Call server API to create payment intent
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        customerId: params.customerId,
        description: params.description,
        metadata: params.metadata,
        receiptEmail: params.receiptEmail,
        paymentMethodTypes: params.paymentMethodTypes || ['card'],
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: {
          code: error.code || 'api_error',
          message: error.message || 'Failed to create payment intent',
          type: 'api_error',
        },
      }
    }

    const data = await response.json()

    const paymentIntent: PaymentIntent = {
      id: data.id,
      clientSecret: data.client_secret,
      amount: data.amount,
      currency: data.currency,
      status: data.status as PaymentIntentStatus,
      customerId: data.customer,
      metadata: data.metadata,
      createdAt: new Date(data.created * 1000),
    }

    return {
      success: true,
      data: paymentIntent,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'network_error',
        message: error instanceof Error ? error.message : 'Network request failed',
        type: 'api_error',
      },
    }
  }
}
```

**3.2: Confirm Payment Intent**

Replace mock (lines 278-332) with Stripe.js confirmation:

```typescript
async confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId: string
): Promise<StripeClientResult<PaymentIntent>> {
  if (!this.initialized || !this.stripe) {
    return { /* error */ }
  }

  // Validation (keep existing)
  if (!paymentIntentId.startsWith('pi_')) { /* ... */ }
  if (!paymentMethodId.startsWith('pm_')) { /* ... */ }

  try {
    const result = await this.stripe.confirmCardPayment(
      paymentIntentId,
      {
        payment_method: paymentMethodId,
      }
    )

    if (result.error) {
      return {
        success: false,
        error: {
          code: result.error.code || 'payment_error',
          message: result.error.message || 'Payment failed',
          type: 'card_error',
        },
      }
    }

    const intent = result.paymentIntent
    return {
      success: true,
      data: {
        id: intent.id,
        clientSecret: intent.client_secret || '',
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status as PaymentIntentStatus,
        paymentMethodId: intent.payment_method as string,
        createdAt: new Date(intent.created * 1000),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'confirmation_error',
        message: error instanceof Error ? error.message : 'Confirmation failed',
        type: 'api_error',
      },
    }
  }
}
```

**3.3: Cancel & Retrieve Payment Intents**

- Similar pattern: call server API
- Transform response to our types
- Handle errors properly

---

### Phase 4: API Routes (2 hours)

Need to create server-side API routes that use the real Stripe SDK:

**4.1: Create Intent Route**

```typescript
// /src/app/api/payments/create-intent/route.ts
import Stripe from 'stripe'
import { NextRequest } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const paymentIntent = await stripe.paymentIntents.create({
      amount: body.amount,
      currency: body.currency,
      customer: body.customerId,
      description: body.description,
      metadata: body.metadata,
      receipt_email: body.receiptEmail,
      payment_method_types: body.paymentMethodTypes || ['card'],
    })

    return Response.json(paymentIntent)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }
}
```

**4.2: Other Routes Needed**

- `/api/payments/webhooks` - Handle Stripe webhooks
- `/api/payments/customers` - Customer CRUD
- `/api/payments/subscriptions` - Subscription management
- `/api/payments/payment-methods` - Payment method management

---

### Phase 5: Subscriptions (2 hours)

**5.1: Create Subscription**

- Call `/api/payments/subscriptions` POST
- Handle trial periods
- Return properly typed Subscription

**5.2: Update/Cancel Subscription**

- Implement immediate vs. end-of-period cancellation
- Handle proration logic
- Update subscription items

**5.3: List Subscriptions**

- Fetch from Stripe API
- Filter by customer
- Handle pagination

---

### Phase 6: Customers & Payment Methods (1.5 hours)

**6.1: Customer Management**

- Create, retrieve, update, delete
- Link to internal user IDs
- Store in database

**6.2: Payment Methods**

- Attach/detach from customers
- List payment methods
- Set default payment method

---

### Phase 7: Webhooks (1 hour)

**7.1: Verify Webhook Signatures**
Use real Stripe signature verification:

```typescript
import Stripe from 'stripe'

verifyWebhookSignature(
  payload: string,
  signature: string,
  secret?: string
): StripeClientResult<WebhookEvent> {
  const webhookSecret = secret ?? this.config.webhookSecret

  if (!webhookSecret) {
    return { success: false, error: { /* ... */ } }
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-06-20',
    })

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    )

    return {
      success: true,
      data: {
        id: event.id,
        type: event.type,
        data: event.data,
        createdAt: new Date(event.created * 1000),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'signature_verification_failed',
        message: error.message,
        type: 'authentication_error',
      },
    }
  }
}
```

**7.2: Handle Webhook Events**

- Process different event types
- Update database
- Send notifications

---

### Phase 8: Stripe Elements (2 hours)

Create React components for payment forms:

**8.1: Elements Provider**

```typescript
// /src/components/payments/stripe-elements-provider.tsx
import { Elements } from '@stripe/react-stripe-js'
import { getStripeClient } from '@/lib/payments/stripe-client'

export function StripeElementsProvider({
  children,
  clientSecret
}: {
  children: React.ReactNode
  clientSecret: string
}) {
  const stripe = getStripeClient().getStripe()

  return (
    <Elements stripe={stripe} options={{ clientSecret }}>
      {children}
    </Elements>
  )
}
```

**8.2: Payment Form Component**

```typescript
// /src/components/payments/payment-form.tsx
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'

export function PaymentForm() {
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/payments/success',
      },
    })

    if (result.error) {
      // Show error
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>
        Pay
      </button>
    </form>
  )
}
```

---

### Phase 9: Testing (1 hour)

**9.1: Update Tests**

```typescript
// /src/lib/payments/__tests__/stripe-client.test.ts

describe('StripeClient (Real API)', () => {
  it('should load Stripe.js', async () => {
    const client = new StripeClient({
      publishableKey: 'pk_test_123',
    })

    const result = await client.initialize()
    expect(result).toBe(true)
    expect(client.isInitialized()).toBe(true)
  })

  it('should create real payment intent', async () => {
    const client = new StripeClient({
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    })
    await client.initialize()

    const result = await client.createPaymentIntent({
      amount: 1000,
      currency: 'usd',
    })

    expect(result.success).toBe(true)
    expect(result.data?.id).toMatch(/^pi_/)
    expect(result.data?.clientSecret).toMatch(/^pi_.*_secret_.*/)
  })
})
```

**9.2: Integration Tests**

- Test full payment flow
- Test webhook handling
- Test error scenarios

---

### Phase 10: Documentation (30 min)

**10.1: Update README**

- Document Stripe setup
- Add environment variable requirements
- Explain test mode vs. live mode

**10.2: Create Integration Guide**

```markdown
# Stripe Integration Guide

## Setup

1. Create Stripe account
2. Get API keys from dashboard
3. Set environment variables
4. Configure webhooks

## Usage

...
```

---

## File Changes Summary

### Files to Modify

1. `/src/lib/payments/stripe-client.ts` (~1,358 lines)
   - Replace all mock implementations
   - Add real Stripe.js integration
   - Keep types and validation

2. `/src/lib/payments/__tests__/stripe-client.test.ts`
   - Update tests for real API
   - Add integration tests
   - Mock Stripe.js for unit tests

### Files to Create

1. `/src/app/api/payments/create-intent/route.ts`
2. `/src/app/api/payments/webhooks/route.ts`
3. `/src/app/api/payments/customers/route.ts`
4. `/src/app/api/payments/subscriptions/route.ts`
5. `/src/components/payments/stripe-elements-provider.tsx`
6. `/src/components/payments/payment-form.tsx`
7. `/src/components/payments/subscription-form.tsx`
8. `/docs/STRIPE-INTEGRATION.md`

---

## Testing Strategy

### Unit Tests

- Mock Stripe.js for isolated testing
- Test error handling
- Test validation logic

### Integration Tests

- Use Stripe test mode
- Test real API calls
- Verify webhook handling

### E2E Tests

- Complete payment flow
- Subscription creation
- Payment method management

---

## Rollout Plan

### Phase 1: Test Mode (Week 1)

- Deploy with test keys only
- Internal testing
- Fix any issues

### Phase 2: Limited Live (Week 2)

- Enable for beta users
- Monitor closely
- Gather feedback

### Phase 3: Full Production (Week 3)

- Enable for all users
- Full monitoring
- Support documentation

---

## Dependencies

### NPM Packages

- `@stripe/stripe-js` - Client-side Stripe.js
- `stripe` - Server-side Stripe SDK (already installed)

### Environment Variables

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Public key
- `STRIPE_SECRET_KEY` - Secret key (server-only)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret

### Backend Requirements

- Webhook endpoint accessible from internet
- Database tables for payments
- Email service for receipts

---

## Success Criteria

✅ **Complete When**:

1. Real Stripe.js loaded and initialized
2. All payment intent methods call real API
3. Subscription management works end-to-end
4. Webhooks properly verified and handled
5. Payment forms use Stripe Elements
6. Tests updated and passing
7. Documentation complete
8. Successfully process test payment

---

## Risks & Mitigation

### Risk 1: API Key Exposure

**Mitigation**: Use environment variables, never commit keys

### Risk 2: Webhook Verification Failures

**Mitigation**: Comprehensive testing, proper signature validation

### Risk 3: Payment Failures

**Mitigation**: Proper error handling, retry logic, user notifications

### Risk 4: 3D Secure Issues

**Mitigation**: Use Stripe Elements, handle SCA properly

---

## Estimated Timeline

| Phase     | Task                        | Time           |
| --------- | --------------------------- | -------------- |
| 1         | Setup & Dependencies        | 30 min         |
| 2         | Initialize Stripe.js        | 1 hour         |
| 3         | Payment Intent Methods      | 2 hours        |
| 4         | API Routes                  | 2 hours        |
| 5         | Subscriptions               | 2 hours        |
| 6         | Customers & Payment Methods | 1.5 hours      |
| 7         | Webhooks                    | 1 hour         |
| 8         | Stripe Elements             | 2 hours        |
| 9         | Testing                     | 1 hour         |
| 10        | Documentation               | 30 min         |
| **Total** |                             | **13.5 hours** |

**Buffer**: +2-4 hours for debugging and unexpected issues

**Final Estimate**: 15-17 hours

---

**Status**: Ready to implement
**Next Step**: Begin Phase 1 (Setup & Dependencies)
