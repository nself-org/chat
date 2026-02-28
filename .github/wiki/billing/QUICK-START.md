# Billing System Quick Start

Get up and running with the billing system in 5 minutes.

## 1. Setup Stripe

### Create Stripe Account

1. Go to https://stripe.com and create an account
2. Get your API keys from the Dashboard
3. Add to `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### Create Products and Prices

1. Go to Stripe Dashboard → Products
2. Create products for each plan:
   - Starter ($8/month, $80/year)
   - Pro ($25/month, $250/year)
   - Business ($75/month, $750/year)

3. Copy the price IDs and add to `.env.local`:

```bash
STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
STRIPE_STARTER_YEARLY_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_...
STRIPE_BUSINESS_YEARLY_PRICE_ID=price_...
```

### Setup Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/billing/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

4. Copy webhook secret:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 2. Display Pricing Table

```tsx
import { PricingTable } from '@/components/billing/PricingTable'

export default function PricingPage() {
  return (
    <PricingTable
      currentPlan="free"
      onSelectPlan={(planId, interval) => {
        // Handle plan selection
        console.log('Selected:', planId, interval)
      }}
    />
  )
}
```

## 3. Implement Checkout

```typescript
// Create checkout session
const handleCheckout = async (planId: string, interval: string) => {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planId,
      interval,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
    }),
  })

  const { url } = await response.json()
  window.location.href = url // Redirect to Stripe
}
```

## 4. Enforce Plan Restrictions

### Server-Side (API Route)

```typescript
import { applyPlanRestrictions, requireFeature } from '@/middleware/plan-restrictions'

export async function POST(request: NextRequest) {
  // Check if user's plan has the feature
  const restriction = await applyPlanRestrictions(request, requireFeature('customBranding'))

  if (restriction) return restriction // 403 error

  // Continue with the request...
}
```

### Client-Side (React)

```tsx
import { PlanGate } from '@/middleware/plan-restrictions'

function CustomBrandingSettings() {
  const userPlan = useUserPlan() // Your hook

  if (!PlanGate.canUseFeature(userPlan, 'customBranding')) {
    return (
      <div>
        <p>This feature requires the Starter plan or higher</p>
        <Button onClick={handleUpgrade}>Upgrade Now</Button>
      </div>
    )
  }

  return <BrandingForm />
}
```

## 5. Track Usage

```typescript
import { UsageTracker } from '@/lib/usage-tracker'

// Get current usage
const usage = await getCurrentUsage(userId)

// Get limits and warnings
const limits = UsageTracker.getUsageLimits(userPlan, usage)

// Check if exceeded
if (limits.exceeded) {
  console.log('Usage limits exceeded!')
  console.log('Warnings:', limits.warnings)
}

// Display usage
<UsageTracker limits={limits} onUpgrade={handleUpgrade} />
```

## 6. Enable Crypto Payments

```tsx
import { CryptoPayment } from '@/components/billing/CryptoPayment'
;<CryptoPayment
  planId="pro"
  interval="month"
  onPaymentComplete={(txHash) => {
    console.log('Payment completed:', txHash)
    // Verify and activate subscription
  }}
/>
```

## 7. Setup Token Gating

### Create Token Requirement

```typescript
const requirement = {
  id: 'req-1',
  channelId: 'premium-channel',
  tokenType: 'erc721',
  contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', // BAYC
  network: 'ethereum',
  minTokenCount: 1,
  name: 'Bored Ape Yacht Club',
  enabled: true,
}
```

### Use Token Gated Channel

```tsx
<TokenGatedChannel
  channelId="premium-channel"
  channelName="VIP Lounge"
  requirements={[requirement]}
  onAccessGranted={() => {
    router.push('/channels/premium-channel')
  }}
/>
```

## 8. Admin Dashboard

```tsx
import { BillingDashboard } from '@/components/billing/BillingDashboard'

export default function AdminBillingPage() {
  return <BillingDashboard />
}
```

## Common Patterns

### Check Feature Availability

```typescript
const canUseAPI = UsageTracker.isFeatureAllowed(userPlan, 'apiAccess')
const canUseWebhooks = UsageTracker.isFeatureAllowed(userPlan, 'webhooks')
```

### Check Usage Limit

```typescript
const { allowed, limit, percentage } = UsageTracker.checkLimit(
  userPlan,
  'maxUsers',
  currentUserCount
)

if (!allowed) {
  // Show upgrade prompt
}
```

### Suggest Upgrade

```typescript
const suggestedPlan = UsageTracker.suggestUpgrade(currentPlan, usage)

if (suggestedPlan) {
  console.log(`Upgrade to ${suggestedPlan} recommended`)
}
```

### Connect Wallet

```tsx
import { WalletConnector } from '@/components/billing/WalletConnector'
;<WalletConnector
  onConnect={(info) => {
    console.log('Connected:', info.address)
  }}
  onDisconnect={() => {
    console.log('Disconnected')
  }}
/>
```

## Testing

### Test Card Numbers

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
```

### Test Webhook Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/billing/webhook
```

## Production Deployment

1. Switch to live Stripe keys
2. Create live products and prices
3. Update webhook endpoint to production URL
4. Test all flows with live (small amount) transactions
5. Monitor webhook logs in Stripe Dashboard

## Next Steps

- Read full documentation: `/docs/billing/BILLING-SYSTEM.md`
- Customize plan features in `/src/config/billing-plans.ts`
- Add custom billing logic in `/src/lib/billing/`
- Set up usage tracking cron jobs
- Configure email notifications

## Support

Questions? Issues?

- Email: billing@nself.org
- Docs: /docs/billing
- GitHub Issues: https://github.com/nself-chat/issues
