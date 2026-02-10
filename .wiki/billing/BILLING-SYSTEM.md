# Billing System Documentation

Complete billing system with Stripe subscriptions, crypto payments, and token gating.

## Overview

The nself-chat billing system provides:

1. **Stripe Subscriptions** - Traditional card-based recurring billing
2. **Plan-Based Restrictions** - Feature gating and usage limits
3. **Crypto Payments** - Support for cryptocurrency payments
4. **NFT Token Gating** - Channel access based on NFT ownership
5. **Usage Tracking** - Real-time monitoring of plan limits
6. **Admin Dashboard** - Revenue analytics and subscription management

---

## Plan Tiers

### Free Plan

- **Price**: $0/month
- **Features**:
  - Up to 10 users
  - 5 channels
  - 10,000 messages/month
  - 5GB storage
  - Video calls (4 participants)
  - Basic features only

### Starter Plan

- **Price**: $8/month or $80/year
- **Features**:
  - Up to 50 users
  - 25 channels
  - 100,000 messages/month
  - 50GB storage
  - Custom branding
  - API access
  - Video calls (10 participants)

### Pro Plan (Most Popular)

- **Price**: $25/month or $250/year
- **Features**:
  - Up to 200 users
  - 100 channels
  - 500,000 messages/month
  - 250GB storage
  - Advanced analytics
  - Priority support
  - SSO integration
  - Token gating
  - Crypto payments
  - Video calls (25 participants)

### Business Plan

- **Price**: $75/month or $750/year
- **Features**:
  - Up to 1,000 users
  - 500 channels
  - 2,000,000 messages/month
  - 1TB storage
  - All Pro features
  - SLA guarantee
  - Video calls (100 participants)

### Enterprise Plan

- **Price**: Custom pricing
- **Features**:
  - Unlimited everything
  - Dedicated support
  - Custom integrations
  - On-premise deployment option

---

## Usage Tracking

### Tracked Metrics

```typescript
interface UsageMetrics {
  users: number
  channels: number
  messages: number
  storageGB: number
  integrations: number
  bots: number
  aiMinutes: number
  aiQueries: number
  callMinutes: number
  recordingGB: number
}
```

### Usage Limits

The system automatically tracks and enforces limits:

- **Soft Limits** (75%): Warning notification
- **Hard Limits** (90%): Upgrade prompt
- **Exceeded** (100%): Feature restriction

### Example

```typescript
import { UsageTracker } from '@/lib/usage-tracker'

// Check if feature is allowed
const canUseAPI = UsageTracker.isFeatureAllowed('free', 'apiAccess') // false
const canUseAPI = UsageTracker.isFeatureAllowed('starter', 'apiAccess') // true

// Check usage limit
const { allowed, limit, percentage } = UsageTracker.checkLimit(
  'free',
  'maxUsers',
  8 // current users
)

console.log(allowed) // true (8 < 10)
console.log(percentage) // 80
```

---

## Stripe Integration

### Setup

1. **Install Stripe**:

```bash
npm install stripe
```

2. **Configure Environment Variables**:

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Plan Price IDs
STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
STRIPE_STARTER_YEARLY_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
```

### Creating Checkout Session

```typescript
// Client-side
const handleUpgrade = async () => {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planId: 'pro',
      interval: 'month',
      userId: user.id,
      userEmail: user.email,
    }),
  })

  const { url } = await response.json()
  window.location.href = url // Redirect to Stripe
}
```

### Webhook Handling

The system automatically handles these Stripe events:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Webhook endpoint: `/api/billing/webhook`

---

## Plan Restrictions

### Middleware Usage

```typescript
import {
  requireFeature,
  requireMinimumPlan,
  checkUsageLimit,
  applyPlanRestrictions,
} from '@/middleware/plan-restrictions'

// In API route
export async function POST(request: NextRequest) {
  // Check if user's plan has the feature
  const restriction = await applyPlanRestrictions(request, requireFeature('customBranding'))

  if (restriction) return restriction // 403 Forbidden

  // Feature is allowed, continue...
}

// Check minimum plan tier
const restriction = await applyPlanRestrictions(request, requireMinimumPlan('pro'))

// Check usage limit
const restriction = await applyPlanRestrictions(
  request,
  checkUsageLimit('maxUsers', currentUserCount)
)
```

### Client-Side Feature Gates

```typescript
import { PlanGate } from '@/middleware/plan-restrictions'

// Check if feature is available
const canUse = PlanGate.canUseFeature('free', 'customBranding') // false

// Get upgrade path
const upgradeTo = PlanGate.getUpgradePath('free', 'customBranding') // 'starter'

// In React component
{PlanGate.canUseFeature(userPlan, 'webhooks') && (
  <WebhooksSettings />
)}
```

---

## Crypto Payments

### Supported Currencies

- **ETH** (Ethereum)
- **USDC** (USD Coin)
- **USDT** (Tether)

### Supported Networks

- Ethereum (mainnet)
- Polygon
- Binance Smart Chain
- Arbitrum

### Wallet Connection

```typescript
import { WalletConnector } from '@/components/billing/WalletConnector'

<WalletConnector
  onConnect={(info) => {
    console.log('Connected:', info.address)
    console.log('Network:', info.network)
    console.log('Balance:', info.balance)
  }}
  onDisconnect={() => {
    console.log('Disconnected')
  }}
  requiredNetwork="ethereum"
/>
```

### Payment Flow

1. User connects wallet (MetaMask, Coinbase Wallet)
2. Select network and currency
3. System displays payment address and amount
4. User sends transaction
5. System monitors blockchain for confirmation
6. Subscription activated upon confirmation

### Example Component

```typescript
import { CryptoPayment } from '@/components/billing/CryptoPayment'

<CryptoPayment
  planId="pro"
  interval="month"
  onPaymentComplete={(txHash) => {
    console.log('Payment completed:', txHash)
    // Update subscription status
  }}
/>
```

---

## NFT Token Gating

### Token Requirements

Create access requirements based on:

- **ERC-20 Tokens**: Minimum balance required
- **ERC-721 NFTs**: Ownership of specific NFTs
- **ERC-1155 NFTs**: Ownership of specific token IDs

### Configuration

```typescript
import type { TokenRequirement } from '@/types/billing'

const requirement: TokenRequirement = {
  id: 'req-1',
  channelId: 'channel-123',
  tokenType: 'erc721',
  contractAddress: '0x...',
  network: 'ethereum',
  minTokenCount: 1,
  name: 'Bored Ape Yacht Club',
  description: 'Must own at least 1 BAYC NFT',
  enabled: true,
  createdAt: new Date(),
}
```

### Verification

```typescript
import { verifyTokenRequirement } from '@/lib/crypto/nft-verifier'

const result = await verifyTokenRequirement(requirement, walletAddress)

if (result.verified) {
  console.log('Access granted!')
  console.log('Balance:', result.balance)
} else {
  console.log('Access denied:', result.error)
}
```

### Token Gated Channel Component

```typescript
import { TokenGatedChannel } from '@/components/billing/TokenGatedChannel'

<TokenGatedChannel
  channelId="premium-channel"
  channelName="VIP Lounge"
  requirements={[requirement]}
  onAccessGranted={() => {
    // Grant access to channel
    router.push('/channels/premium-channel')
  }}
/>
```

---

## Admin Dashboard

### Billing Statistics

```typescript
import { BillingDashboard } from '@/components/billing/BillingDashboard'

<BillingDashboard />
```

Displays:

- Total revenue
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Active subscriptions
- Churn rate
- Plan distribution
- Payment method breakdown
- Failed payments
- Upcoming renewals

### Usage Page

```typescript
import { UsageTracker } from '@/components/billing/UsageTracker'

<UsageTracker
  limits={usageLimits}
  onUpgrade={() => {
    // Navigate to pricing page
    router.push('/billing#pricing')
  }}
/>
```

---

## API Endpoints

### Billing

- `POST /api/billing/checkout` - Create Stripe checkout session
- `POST /api/billing/portal` - Access billing portal
- `POST /api/billing/webhook` - Stripe webhook handler
- `GET /api/billing/subscription` - Get current subscription
- `PUT /api/billing/subscription` - Update subscription
- `DELETE /api/billing/subscription` - Cancel subscription

### Crypto

- `POST /api/billing/crypto/payment` - Create crypto payment
- `GET /api/billing/crypto/status/:txHash` - Check payment status
- `POST /api/billing/crypto/verify` - Verify wallet ownership

### Token Gating

- `POST /api/tokens/verify` - Verify token ownership
- `GET /api/tokens/requirements/:channelId` - Get channel requirements
- `POST /api/tokens/requirements` - Create token requirement (admin)

---

## Database Schema

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  interval TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  crypto_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Usage Metrics Table

```sql
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  period TEXT NOT NULL, -- YYYY-MM
  users INTEGER DEFAULT 0,
  channels INTEGER DEFAULT 0,
  messages INTEGER DEFAULT 0,
  storage_gb DECIMAL(10,2) DEFAULT 0,
  integrations INTEGER DEFAULT 0,
  bots INTEGER DEFAULT 0,
  ai_minutes INTEGER DEFAULT 0,
  ai_queries INTEGER DEFAULT 0,
  call_minutes INTEGER DEFAULT 0,
  recording_gb DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period)
);
```

### Token Requirements Table

```sql
CREATE TABLE token_requirements (
  id UUID PRIMARY KEY,
  channel_id UUID REFERENCES channels(id),
  role_id UUID REFERENCES roles(id),
  feature_id TEXT,
  token_type TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  network TEXT NOT NULL,
  min_balance DECIMAL(36,18),
  token_ids JSONB,
  min_token_count INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Environment Variables

Complete list of required environment variables:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Plan Price IDs
STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
STRIPE_STARTER_YEARLY_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_...
STRIPE_BUSINESS_YEARLY_PRICE_ID=price_...

# Optional: Crypto
NEXT_PUBLIC_PAYMENT_WALLET_ADDRESS=0x...
INFURA_API_KEY=...
ALCHEMY_API_KEY=...

# Optional: NFT Verification
MORALIS_API_KEY=...
```

---

## Testing

### Test Stripe Integration

Use Stripe test cards:

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

### Test Crypto Payments

Use testnets:

- Ethereum Sepolia
- Polygon Mumbai
- BSC Testnet

### Test Token Gating

Deploy test NFT contracts on testnets for verification.

---

## Production Checklist

- [ ] Configure production Stripe account
- [ ] Set up Stripe webhook endpoint
- [ ] Create production price IDs
- [ ] Set up crypto payment wallet
- [ ] Configure blockchain monitoring
- [ ] Set up usage tracking cron jobs
- [ ] Test all payment flows
- [ ] Configure email notifications
- [ ] Set up invoice generation
- [ ] Enable SCA compliance (Europe)
- [ ] Test subscription lifecycle
- [ ] Set up analytics tracking
- [ ] Configure tax calculation (if needed)

---

## Support

For issues or questions:

- Email: billing@nself.org
- Docs: /docs/billing
- API Reference: /api-docs/billing

---

## Version History

- **v0.9.0** (2026-02-03): Initial billing system implementation
  - Stripe subscriptions
  - Plan-based restrictions
  - Crypto payments
  - NFT token gating
  - Admin dashboard
