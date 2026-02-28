# Billing System Examples

Real-world examples of using the billing system.

## Table of Contents

1. [Basic Plan Upgrade Flow](#basic-plan-upgrade-flow)
2. [Feature-Gated Component](#feature-gated-component)
3. [Usage Monitoring](#usage-monitoring)
4. [Crypto Payment Integration](#crypto-payment-integration)
5. [Token-Gated Channel](#token-gated-channel)
6. [Admin Billing Dashboard](#admin-billing-dashboard)
7. [Custom Plan Restrictions](#custom-plan-restrictions)
8. [Multi-Step Checkout](#multi-step-checkout)

---

## Basic Plan Upgrade Flow

### Simple Upgrade Button

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function UpgradeButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleUpgrade = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'pro',
          interval: 'month',
          userId: 'user-123',
          userEmail: 'user@example.com',
        }),
      })

      const { url } = await response.json()
      window.location.href = url // Redirect to Stripe
    } catch (error) {
      console.error('Upgrade failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleUpgrade} disabled={loading}>
      {loading ? 'Processing...' : 'Upgrade to Pro'}
    </Button>
  )
}
```

### Full Pricing Page with Checkout

```tsx
'use client'

import { useState } from 'react'
import { PricingTable } from '@/components/billing/PricingTable'
import type { PlanTier, BillingInterval } from '@/types/billing'

export default function PricingPage() {
  const currentPlan: PlanTier = 'free' // Get from user context

  const handleSelectPlan = async (planId: PlanTier, interval: BillingInterval) => {
    if (planId === 'free') {
      // Downgrade to free
      alert('Downgrade not implemented in this example')
      return
    }

    if (planId === 'enterprise') {
      // Redirect to contact sales
      window.location.href = '/contact-sales'
      return
    }

    // Create checkout session
    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId,
        interval,
        userId: 'user-123',
        userEmail: 'user@example.com',
        userName: 'John Doe',
      }),
    })

    const { url, error } = await response.json()

    if (error) {
      alert(error)
      return
    }

    // Redirect to Stripe Checkout
    window.location.href = url
  }

  return (
    <div className="container py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground">Select the perfect plan for your team</p>
      </div>

      <PricingTable
        currentPlan={currentPlan}
        onSelectPlan={handleSelectPlan}
        showAnnualSavings={true}
      />
    </div>
  )
}
```

---

## Feature-Gated Component

### Conditional Feature Rendering

```tsx
'use client'

import { PlanGate } from '@/middleware/plan-restrictions'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock } from 'lucide-react'

interface CustomBrandingProps {
  userPlan: PlanTier
}

export function CustomBranding({ userPlan }: CustomBrandingProps) {
  const canUseFeature = PlanGate.canUseFeature(userPlan, 'customBranding')
  const upgradeTo = PlanGate.getUpgradePath(userPlan, 'customBranding')

  if (!canUseFeature) {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Custom branding is available on the {upgradeTo} plan and higher.
          <Button className="ml-4" asChild>
            <a href="/billing">Upgrade Now</a>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div>
      <h2>Custom Branding</h2>
      <BrandingForm />
    </div>
  )
}
```

### API Route with Feature Check

```typescript
// app/api/branding/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { applyPlanRestrictions, requireFeature } from '@/middleware/plan-restrictions'

export async function POST(request: NextRequest) {
  // Check if user's plan has custom branding
  const restriction = await applyPlanRestrictions(request, requireFeature('customBranding'))

  if (restriction) {
    return restriction // Returns 403 with upgrade info
  }

  // Continue with branding update
  const body = await request.json()

  // Update branding...

  return NextResponse.json({ success: true })
}
```

---

## Usage Monitoring

### Usage Dashboard Component

```tsx
'use client'

import { useEffect, useState } from 'react'
import { UsageTracker } from '@/components/billing/UsageTracker'
import { UsageTracker as UsageLib } from '@/lib/usage-tracker'
import type { UsageLimits, UsageMetrics } from '@/types/billing'
import { useRouter } from 'next/navigation'

export function UsageDashboard() {
  const [usage, setUsage] = useState<UsageLimits | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadUsage()
  }, [])

  const loadUsage = async () => {
    // Fetch current usage from API
    const response = await fetch('/api/usage/current')
    const data = await response.json()

    const limits = UsageLib.getUsageLimits(data.plan, data.metrics)
    setUsage(limits)
  }

  const handleUpgrade = () => {
    router.push('/billing#pricing')
  }

  if (!usage) {
    return <div>Loading...</div>
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Usage & Limits</h1>
      <UsageTracker limits={usage} onUpgrade={handleUpgrade} />
    </div>
  )
}
```

### Usage Warning Hook

```typescript
'use client'

import { useEffect, useState } from 'react'
import { UsageTracker } from '@/lib/usage-tracker'
import type { UsageWarning, PlanTier, UsageMetrics } from '@/types/billing'

export function useUsageWarnings(plan: PlanTier, usage: UsageMetrics) {
  const [warnings, setWarnings] = useState<UsageWarning[]>([])

  useEffect(() => {
    const newWarnings = UsageTracker.calculateWarnings(plan, usage)
    setWarnings(newWarnings)

    // Show notification for critical warnings
    const criticalWarnings = newWarnings.filter((w) => w.severity === 'critical')
    if (criticalWarnings.length > 0) {
      // Show toast notification
      console.warn('Critical usage warnings:', criticalWarnings)
    }
  }, [plan, usage])

  return warnings
}

// Usage in component
function MyComponent() {
  const warnings = useUsageWarnings(userPlan, currentUsage)

  return (
    <div>
      {warnings.length > 0 && (
        <Alert variant="destructive">
          You have {warnings.length} usage warning(s)
        </Alert>
      )}
    </div>
  )
}
```

---

## Crypto Payment Integration

### Complete Crypto Checkout

```tsx
'use client'

import { useState } from 'react'
import { CryptoPayment } from '@/components/billing/CryptoPayment'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { PlanTier } from '@/types/billing'

export function CryptoCheckoutPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('pro')
  const [paymentComplete, setPaymentComplete] = useState(false)

  const handlePaymentComplete = async (txHash: string) => {
    console.log('Payment transaction:', txHash)

    // Verify payment on backend
    const response = await fetch('/api/billing/crypto/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txHash }),
    })

    const { verified, subscriptionId } = await response.json()

    if (verified) {
      setPaymentComplete(true)
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 3000)
    }
  }

  if (paymentComplete) {
    return (
      <Card className="p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold">Payment Confirmed!</h2>
        <p>Your subscription has been activated.</p>
        <p className="text-muted-foreground">Redirecting to dashboard...</p>
      </Card>
    )
  }

  return (
    <div className="container max-w-2xl py-12">
      <h1 className="mb-8 text-3xl font-bold">Pay with Crypto</h1>

      <CryptoPayment
        planId={selectedPlan}
        interval="month"
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  )
}
```

### Wallet Balance Check

```tsx
'use client'

import { useState, useEffect } from 'react'
import { getBalance } from '@/lib/crypto/wallet-connector'
import { Card } from '@/components/ui/card'

export function WalletBalance({ address }: { address: string }) {
  const [balance, setBalance] = useState<string>('0')

  useEffect(() => {
    loadBalance()
  }, [address])

  const loadBalance = async () => {
    const bal = await getBalance(address)
    setBalance(bal)
  }

  return (
    <Card className="p-4">
      <div className="text-sm text-muted-foreground">Wallet Balance</div>
      <div className="text-2xl font-bold">{balance} ETH</div>
    </Card>
  )
}
```

---

## Token-Gated Channel

### Premium Channel with NFT Access

```tsx
'use client'

import { useState } from 'react'
import { TokenGatedChannel } from '@/components/billing/TokenGatedChannel'
import { useRouter } from 'next/navigation'
import type { TokenRequirement } from '@/types/billing'

const requirements: TokenRequirement[] = [
  {
    id: 'req-1',
    channelId: 'premium-lounge',
    tokenType: 'erc721',
    contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', // BAYC
    network: 'ethereum',
    minTokenCount: 1,
    name: 'Bored Ape Yacht Club',
    description: 'Must own at least 1 BAYC NFT',
    enabled: true,
    createdAt: new Date(),
  },
]

export function PremiumChannelGate() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState(false)

  const handleAccessGranted = async () => {
    setHasAccess(true)

    // Record access in database
    await fetch('/api/channels/premium-lounge/access', {
      method: 'POST',
    })

    // Navigate to channel
    router.push('/channels/premium-lounge')
  }

  return (
    <div className="container max-w-3xl py-12">
      <TokenGatedChannel
        channelId="premium-lounge"
        channelName="VIP Lounge"
        requirements={requirements}
        onAccessGranted={handleAccessGranted}
      />

      {hasAccess && (
        <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-green-800">Access granted! Redirecting to channel...</p>
        </div>
      )}
    </div>
  )
}
```

### Multi-Token Requirement

```tsx
const multiTokenRequirements: TokenRequirement[] = [
  {
    id: 'req-1',
    channelId: 'elite-channel',
    tokenType: 'erc721',
    contractAddress: '0x...', // NFT Collection 1
    network: 'ethereum',
    minTokenCount: 1,
    name: 'Premium NFT',
    enabled: true,
    createdAt: new Date(),
  },
  {
    id: 'req-2',
    channelId: 'elite-channel',
    tokenType: 'erc20',
    contractAddress: '0x...', // Token Contract
    network: 'ethereum',
    minBalance: 1000, // Must hold 1000 tokens
    name: 'Governance Token',
    enabled: true,
    createdAt: new Date(),
  },
]

// User must meet BOTH requirements
<TokenGatedChannel
  channelId="elite-channel"
  channelName="Elite Member Channel"
  requirements={multiTokenRequirements}
  onAccessGranted={handleAccess}
/>
```

---

## Admin Billing Dashboard

### Complete Admin Page

```tsx
// app/admin/billing/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { BillingDashboard } from '@/components/billing/BillingDashboard'
import type { BillingStats } from '@/types/billing'

export default function AdminBillingPage() {
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/billing/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to load billing stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!stats) {
    return <div>Failed to load billing statistics</div>
  }

  return (
    <div className="container max-w-7xl py-8">
      <BillingDashboard stats={stats} />
    </div>
  )
}
```

---

## Custom Plan Restrictions

### File Upload Size Check

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { applyPlanRestrictions, checkFileUploadSize } from '@/middleware/plan-restrictions'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  // Check file size against plan limit
  const restriction = await applyPlanRestrictions(request, checkFileUploadSize(file.size))

  if (restriction) {
    return restriction // 413 Payload Too Large
  }

  // Continue with upload...
  return NextResponse.json({ success: true })
}
```

### Rate Limiting by Plan

```typescript
import { applyPlanRestrictions, checkPlanRateLimit } from '@/middleware/plan-restrictions'

export async function POST(request: NextRequest) {
  // Get request count from cache/database
  const requestCount = await getRequestCount(userId)

  // Check rate limit based on plan
  const restriction = await applyPlanRestrictions(request, checkPlanRateLimit(requestCount))

  if (restriction) {
    return restriction // 429 Too Many Requests
  }

  // Continue with request...
}
```

---

## Multi-Step Checkout

### Checkout Flow with Plan Selection

```tsx
'use client'

import { useState } from 'react'
import { PricingTable } from '@/components/billing/PricingTable'
import { CryptoPayment } from '@/components/billing/CryptoPayment'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PlanTier, BillingInterval } from '@/types/billing'

export function CheckoutFlow() {
  const [step, setStep] = useState<'plan' | 'payment'>('plan')
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null)
  const [interval, setInterval] = useState<BillingInterval>('month')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card')

  const handleSelectPlan = (planId: PlanTier, billingInterval: BillingInterval) => {
    setSelectedPlan(planId)
    setInterval(billingInterval)
    setStep('payment')
  }

  const handlePaymentComplete = (txHash: string) => {
    console.log('Payment complete:', txHash)
    // Redirect to success page
    window.location.href = '/billing/success'
  }

  if (step === 'plan') {
    return (
      <div>
        <h1>Choose Your Plan</h1>
        <PricingTable currentPlan="free" onSelectPlan={handleSelectPlan} />
      </div>
    )
  }

  if (step === 'payment' && selectedPlan) {
    return (
      <div>
        <h1>Complete Payment</h1>

        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="card">Credit Card</TabsTrigger>
            <TabsTrigger value="crypto">Cryptocurrency</TabsTrigger>
          </TabsList>

          <TabsContent value="card">
            <Button
              onClick={async () => {
                const response = await fetch('/api/billing/checkout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    planId: selectedPlan,
                    interval,
                    userId: 'user-123',
                    userEmail: 'user@example.com',
                  }),
                })
                const { url } = await response.json()
                window.location.href = url
              }}
            >
              Continue to Stripe
            </Button>
          </TabsContent>

          <TabsContent value="crypto">
            <CryptoPayment
              planId={selectedPlan}
              interval={interval}
              onPaymentComplete={handlePaymentComplete}
            />
          </TabsContent>
        </Tabs>

        <Button variant="outline" onClick={() => setStep('plan')}>
          Back to Plans
        </Button>
      </div>
    )
  }

  return null
}
```

---

## Summary

These examples demonstrate:

✅ Basic Stripe checkout integration
✅ Feature-gated components and API routes
✅ Usage monitoring and warnings
✅ Crypto payment flows
✅ NFT token gating
✅ Admin billing dashboard
✅ Custom plan restrictions
✅ Multi-step checkout process

For more examples, see:

- `/docs/billing/BILLING-SYSTEM.md` - Complete documentation
- `/docs/billing/QUICK-START.md` - Quick start guide
- `/src/components/billing/` - Component source code
