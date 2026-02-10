# Phase 2 QA: Action Plan

## Immediate Steps to Fix Critical Issues

**Date**: February 5, 2026
**Priority**: HIGH
**Time to Fix**: 2-4 hours

---

## 🔥 CRITICAL: Fix Broken Build (15 minutes)

### Issue

```
Failed to compile.
Module not found: Can't resolve 'next-auth'
```

### Solution

```bash
# Install missing dependency
npm install next-auth@latest

# Verify build
npm run build
```

### Files Affected

- `src/app/api/channels/categories/route.ts`

---

## 🔥 CRITICAL: Fix TypeScript Errors (15 minutes)

### Issue

```
src/lib/security/secret-scanner.ts(42,61): error TS1005: ',' expected.
src/lib/security/secret-scanner.ts(77,57): error TS1005: ',' expected.
```

### Solution

```bash
# Edit the file and fix syntax errors on lines 42 and 77
code src/lib/security/secret-scanner.ts
```

### Verification

```bash
npm run type-check
```

---

## ⚠️ HIGH PRIORITY: Update Documentation (1 hour)

### Issue

Documentation claims features are "implemented" when they're MVP mocks.

### Files to Update

#### 1. `.claude/CLAUDE.md`

Add implementation status section:

```markdown
## Implementation Status (v0.9.1)

### Production-Ready ✅

- WebRTC/LiveKit integration
- End-to-end encryption (Web Crypto API)
- Backend microservices (5 services)
- Database layer (44 migrations, 222 tables)
- Chat core functionality

### MVP/Partial ⚠️

- **Stripe Payments**: Client is mock, server integration exists
- **Media Pipeline**: Images ✅, Video ❌ (FFmpeg required)
- **Signal Protocol**: Custom implementation, not using @signalapp/libsignal-client

### Planned 🚧

- Video transcoding (requires FFmpeg)
- Real Stripe.js integration
- Advanced analytics (real-time)
```

#### 2. `README.md`

Add feature status badges:

```markdown
## Features

### Communication

- [x] **Text Chat** - ✅ Production Ready
- [x] **Voice/Video Calls** - ✅ LiveKit Integration
- [x] **Screen Sharing** - ✅ WebRTC Implementation
- [x] **End-to-End Encryption** - ✅ Signal Protocol Algorithms

### Monetization

- [x] **Stripe Integration** - ⚠️ MVP (Client mock, server ready)
- [ ] **Subscription Management** - 🚧 Planned
- [ ] **Payment Processing** - 🚧 Needs Stripe.js integration

### Media

- [x] **Image Upload/Processing** - ✅ Sharp.js
- [ ] **Video Transcoding** - 🚧 Requires FFmpeg
- [ ] **Text Extraction (OCR)** - 🚧 Planned
```

#### 3. `docs/Features-Complete.md`

Add "Implementation Details" column:

```markdown
| Feature      | Status | Implementation | Notes                              |
| ------------ | ------ | -------------- | ---------------------------------- |
| WebRTC Calls | ✅     | Production     | Real RTCPeerConnection API         |
| E2EE         | ✅     | Production     | Web Crypto API, not libsignal      |
| Stripe       | ⚠️     | MVP            | Mock client, real server endpoints |
| Media        | ⚠️     | Partial        | Images ✅, Video ❌                |
```

---

## ⚠️ HIGH PRIORITY: Fix Failing Tests (2 hours)

### 1. Screen Capture Infinite Loop

**File**: `src/lib/webrtc/__tests__/screen-capture.test.ts`

**Issue**: Mock causes infinite recursion

```
RangeError: Maximum call stack size exceeded
at ScreenCaptureManager.handleTrackEnded
```

**Solution**: Fix mock track event listeners

```typescript
// Before (line 71)
stop: jest.fn(() => {
  callbacks.forEach((cb) => cb(new Event('ended'))) // ❌ Causes recursion
})

// After
stop: jest.fn(function () {
  const track = this
  track.readyState = 'ended'
  // Don't trigger callbacks during cleanup
})
```

### 2. LiveKit Service Jest Config

**File**: `jest.config.js`

**Issue**: ESM module not transformed

```
SyntaxError: Unexpected token 'export'
at jose@5.10.0/dist/browser/index.js
```

**Solution**: Add to `transformIgnorePatterns`

```javascript
// jest.config.js
module.exports = {
  transformIgnorePatterns: ['node_modules/(?!(jose|livekit-server-sdk|livekit-client)/)'],
}
```

### 3. Plugin Integration Test Environment

**File**: `src/services/__tests__/plugin-integration.test.ts`

**Issue**: Tests timeout waiting for services

```
thrown: "Exceeded timeout of 10000 ms for a hook"
```

**Solution**: Skip integration tests in CI until services are running

```typescript
// Use environment variable
const PLUGINS_ENABLED = process.env.PLUGINS_ENABLED === 'true'

describe.skip('Plugin Integration Tests', () => {
  // Tests will be skipped unless explicitly enabled
})
```

**Long-term**: Set up docker-compose for test environment

---

## 📋 MEDIUM PRIORITY: Signal Protocol Decision (30 minutes)

### Issue

Installed `@signalapp/libsignal-client` but using Web Crypto API instead.

### Option 1: Use Official Library (Recommended)

```bash
# Update encryption implementation to use libsignal
# This will take ~1 week of development
```

**Pros**:

- Official Signal implementation
- Better compatibility
- Standard X25519/Ed25519

**Cons**:

- Significant refactoring required
- May break existing encrypted data

### Option 2: Document Web Crypto Approach

```markdown
# In .claude/CLAUDE.md

## Encryption Implementation Note

ɳChat uses a custom Signal Protocol implementation built on Web Crypto API
instead of `@signalapp/libsignal-client`. This provides:

- **Compatibility**: Works in all modern browsers without WASM
- **Performance**: Native browser crypto
- **Security**: Uses ECDH P-256, AES-256-GCM, HKDF (cryptographically sound)

The implementation follows the Signal Protocol specification but uses
standard Web Crypto APIs (P-256 instead of X25519, ECDSA instead of Ed25519).

If official Signal library support is required, the package is already
installed and can be integrated.
```

**Pros**:

- Transparent about implementation
- No code changes needed
- Current implementation is secure

**Cons**:

- May confuse users expecting official Signal library

### Recommendation

**Option 2** for now, **Option 1** for future release.

---

## 📋 MEDIUM PRIORITY: Stripe Integration Plan (4-8 hours)

### Current State

- ✅ Server-side Stripe SDK installed and used
- ✅ Webhook handling implemented
- ✅ Well-structured client interface
- ❌ Client returns mock data

### Implementation Steps

#### Step 1: Load Stripe.js (1 hour)

```typescript
// src/lib/payments/stripe-client.ts

import { loadStripe, Stripe } from '@stripe/stripe-js'

export class StripeClient {
  private stripe: Stripe | null = null

  async initialize(): Promise<boolean> {
    try {
      // ✅ Real Stripe.js loading
      this.stripe = await loadStripe(this.config.publishableKey)
      this.initialized = this.stripe !== null
      return this.initialized
    } catch (error) {
      console.error('Failed to load Stripe:', error)
      return false
    }
  }
}
```

#### Step 2: Real Payment Intent (2 hours)

```typescript
async createPaymentIntent(params: PaymentIntentParams): Promise<StripeClientResult<PaymentIntent>> {
  if (!this.stripe) {
    return { success: false, error: { code: 'not_initialized', ... } }
  }

  try {
    // ✅ Real API call to backend
    const response = await fetch('/api/billing/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    const { clientSecret, ...data } = await response.json()

    return {
      success: true,
      data: {
        ...data,
        clientSecret,
      }
    }
  } catch (error) {
    return { success: false, error: this.handleError(error) }
  }
}
```

#### Step 3: Payment Confirmation (2 hours)

```typescript
async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string): Promise<StripeClientResult<PaymentIntent>> {
  if (!this.stripe) {
    return { success: false, error: { code: 'not_initialized', ... } }
  }

  try {
    // ✅ Real Stripe.js confirmation
    const result = await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethodId,
    })

    if (result.error) {
      return { success: false, error: this.handleError(result.error) }
    }

    return {
      success: true,
      data: this.mapPaymentIntent(result.paymentIntent)
    }
  } catch (error) {
    return { success: false, error: this.handleError(error) }
  }
}
```

#### Step 4: Testing (2 hours)

```bash
# Use Stripe test mode
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx

# Test cards
4242 4242 4242 4242  # Success
4000 0000 0000 0002  # Decline
```

#### Step 5: Update Dependencies (15 minutes)

```bash
npm install @stripe/stripe-js@latest
```

### Time Estimate

- **Quick Fix** (mock → backend proxy): 2 hours
- **Full Integration** (real Stripe.js): 8 hours
- **Testing & Polish**: 4 hours
- **Total**: ~12-14 hours for production-ready

---

## 🔍 VERIFICATION CHECKLIST

After completing fixes, verify:

### Build

```bash
✅ npm run build                    # Should succeed
✅ npm run type-check               # No errors
✅ npm run lint                     # All files pass
```

### Tests

```bash
✅ npm run test                     # >95% pass rate
✅ npm run test -- --coverage       # Measure actual coverage
✅ npm run test:e2e                 # E2E tests pass
```

### Documentation

```bash
✅ .claude/CLAUDE.md updated        # Implementation status added
✅ README.md updated                # Feature status badges
✅ docs/Features-Complete.md       # Implementation details
```

### Code Quality

```bash
✅ No "TODO" in critical paths
✅ No misleading comments
✅ Mock implementations clearly marked
```

---

## Timeline

### Day 1 (2 hours)

- [x] Fix build (next-auth)
- [x] Fix TypeScript errors
- [x] Update documentation

### Day 2 (4 hours)

- [ ] Fix screen capture test
- [ ] Configure Jest for ESM
- [ ] Document Signal Protocol approach

### Week 2 (8-12 hours)

- [ ] Implement real Stripe integration
- [ ] Add integration test environment
- [ ] Measure test coverage

---

## Success Criteria

### Must Have (before claiming "production-ready")

- ✅ Build succeeds without errors
- ✅ Documentation accurately reflects implementation
- ✅ Test pass rate >95%
- ✅ TypeScript errors = 0

### Should Have (for v1.0 release)

- 📋 Stripe integration is real (not mock)
- 📋 Test coverage measured and >80%
- 📋 All integration tests passing

### Nice to Have (future releases)

- 🚧 Official Signal Protocol library
- 🚧 Video transcoding (FFmpeg)
- 🚧 Advanced analytics features

---

**Prepared By**: Phase 2 QA Verification
**Date**: February 5, 2026
**Status**: READY FOR IMPLEMENTATION
