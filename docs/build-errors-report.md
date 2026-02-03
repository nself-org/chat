# Build Errors Report - nself-chat

**Generated:** 2026-01-30  
**Build Command:** `pnpm build`  
**TypeCheck Command:** `pnpm type-check`

---

## Executive Summary

**Total Errors:** 98 TypeScript compilation errors  
**Build Status:** ❌ FAILED  
**Blocking Issues:** 3 critical missing dependencies

The build fails immediately due to missing `next-auth` dependency. TypeScript checking reveals 98 additional type errors across 30+ files.

---

## 1. Critical Errors (MUST FIX)

### 1.1 Missing Dependencies (3 files)

**Impact:** Build fails immediately - blocks all compilation

| File                                 | Error                          | Line |
| ------------------------------------ | ------------------------------ | ---- |
| `src/app/api/calls/accept/route.ts`  | Cannot find module 'next-auth' | 8    |
| `src/app/api/calls/decline/route.ts` | Cannot find module 'next-auth' | 8    |
| `src/app/api/calls/end/route.ts`     | Cannot find module 'next-auth' | 8    |

**Root Cause:** `next-auth` is imported but not listed in `package.json` dependencies.

**Solution:**

```bash
pnpm add next-auth
# OR remove these API routes if not using NextAuth
```

### 1.2 Missing Platform Dependencies (2 files)

**Impact:** Blocks mobile/native builds

| File                                        | Error                                                          |
| ------------------------------------------- | -------------------------------------------------------------- |
| `src/hooks/use-mobile-call-optimization.ts` | Cannot find module '@/platforms/capacitor/src/native/call-kit' |
| `src/lib/voip-push.ts`                      | Cannot find module '@capacitor/push-notifications'             |

**Root Cause:** Mobile platform code exists but Capacitor dependencies not installed.

**Solution:**

```bash
pnpm add @capacitor/push-notifications
# OR add conditional imports with type guards
```

### 1.3 Missing mediasoup-client Types (1 file)

**Impact:** Group call functionality broken

| File                                  | Error                                           |
| ------------------------------------- | ----------------------------------------------- |
| `src/lib/calls/group-call-manager.ts` | Cannot find module 'mediasoup-client/lib/types' |

**Root Cause:** Missing or incorrect mediasoup-client installation.

**Solution:**

```bash
pnpm add mediasoup-client @types/mediasoup-client
```

---

## 2. Next.js 15 Breaking Changes (13 errors)

### 2.1 Async Route Params (13 errors in .next/types/)

**Impact:** High - Affects all dynamic API routes with `[id]` parameters

Next.js 15 changed route params from synchronous to async (Promise-based).

**Affected Routes:**

- `/api/streams/[id]/chat/route.ts` (GET, POST)
- `/api/streams/[id]/end/route.ts` (POST)
- `/api/streams/[id]/reactions/route.ts` (POST)
- `/api/streams/[id]/route.ts` (GET, DELETE, PATCH)
- `/api/streams/[id]/start/route.ts` (POST)

**Example Error:**

```
Type '{ params: { id: string; }; }' is not assignable to type '{ params: Promise<{ id: string; }>; }'.
```

**Current Pattern (v14):**

```typescript
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
}
```

**Required Pattern (v15):**

```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

**Files to Update:**

1. `src/app/api/streams/[id]/chat/route.ts`
2. `src/app/api/streams/[id]/end/route.ts`
3. `src/app/api/streams/[id]/reactions/route.ts`
4. `src/app/api/streams/[id]/route.ts`
5. `src/app/api/streams/[id]/start/route.ts`

---

## 3. Type Errors by Category

### 3.1 Signal Protocol / E2EE Issues (23 errors)

**Files:**

- `src/lib/e2ee/crypto.ts` (8 errors)
- `src/lib/e2ee/session-manager.ts` (9 errors)
- `src/lib/e2ee/signal-client.ts` (6 errors)

**Common Issues:**

1. **ArrayBuffer type incompatibility** (8 occurrences)
   - `Uint8Array<ArrayBufferLike>` vs `BufferSource`
   - `ArrayBufferLike` vs `ArrayBuffer`
   - SharedArrayBuffer compatibility

2. **Missing Signal Protocol methods** (7 occurrences)
   - `IdentityKeyPair.new` doesn't exist
   - `IdentityKeyStore.getIdentityKey()` returns wrong type
   - Expected `PrivateKey` but got `IdentityKeyPair`

3. **Buffer vs Uint8Array confusion** (8 occurrences)
   - Signal library expects `Buffer` but code provides `Uint8Array`

**Example:**

```typescript
// Error: Argument of type 'Uint8Array<ArrayBufferLike>' is not assignable to parameter of type 'Buffer<ArrayBufferLike>'
PreKeyBundle.new(
  registrationId,
  deviceId,
  preKeyId,
  preKeyPublic, // <-- Uint8Array
  signedPreKeyId,
  signedPreKeyPublic, // <-- Uint8Array
  signedPreKeySignature // <-- Uint8Array
)
```

**Root Cause:** Signal Protocol library version mismatch or incorrect type definitions.

### 3.2 WebRTC/Media Issues (11 errors)

**Files:**

- `src/lib/calls/group-call-manager.ts` (11 errors)
- `src/lib/calls/background-blur.ts` (1 error)
- `src/lib/calls/virtual-background.ts` (1 error)

**Issues:**

1. **Implicit 'any' types** (8 errors)
   - `dtlsParameters`, `rtpParameters`, `kind`, `callback`, `errback`, `layers`
   - Missing type annotations for mediasoup callbacks

2. **GpuBuffer type errors** (2 errors)
   - Cannot assign `GpuBuffer` to `HTMLCanvasElement | ImageBitmap`

**Example:**

```typescript
// Error: Parameter 'callback' implicitly has an 'any' type
transportSend.on('connect', ({ dtlsParameters }, callback, errback) => {
  // Need explicit types
})
```

### 3.3 React Component Props (4 errors)

| File                                               | Issue                                                           | Line |
| -------------------------------------------------- | --------------------------------------------------------------- | ---- |
| `src/app/chat/layout.tsx`                          | Unknown props `userId`, `userName`, `userAvatarUrl`             | 198  |
| `src/components/calls/VideoCallModal.tsx`          | `RefObject<HTMLDivElement \| null>` vs `RefObject<HTMLElement>` | 75   |
| `src/components/calls/mobile/MobilePiPOverlay.tsx` | Unknown prop `onDoubleTap`                                      | 171  |
| `src/components/calls/mobile/MobileCallScreen.tsx` | Expected 1 argument, got 0                                      | 122  |

### 3.4 Hook/State Management Issues (8 errors)

| File                                        | Issue                                                      |
| ------------------------------------------- | ---------------------------------------------------------- |
| `src/hooks/use-call-invitation.ts`          | `duration` property doesn't exist on `Toast` type          |
| `src/hooks/use-camera.ts`                   | Type `false` incompatible with `AudioConstraints`          |
| `src/hooks/use-e2ee.ts`                     | `duration` property doesn't exist on `Toast` type          |
| `src/hooks/use-mobile-call-optimization.ts` | `"warning"` not assignable to toast variant                |
| `src/hooks/use-pin-lock.ts`                 | Cannot pass `null` for lock reason (should be `undefined`) |
| `src/hooks/use-search.ts`                   | `SearchFilters` missing index signature                    |
| `src/hooks/use-sticker-packs.ts`            | `useQueryClient` doesn't exist in Apollo Client            |
| `src/hooks/use-stickers.ts`                 | `useQueryClient` doesn't exist in Apollo Client            |

**Toast API Inconsistency:**

```typescript
// Current code
toast({
  duration: 3000, // ERROR: duration doesn't exist
  title: 'Message',
})

// Check actual Toast interface in src/hooks/use-toast.tsx
```

### 3.5 Library API Issues (13 errors)

**Apollo Client:**

- `useQueryClient` doesn't exist (use `useApolloClient` instead)

**Framer Motion:**

- `onDoubleTap` prop doesn't exist (removed in recent versions)

**Web APIs:**

- `ScreenOrientation.lock()` doesn't exist (check browser support)

**Security:**

- PIN lock passing `null` instead of `undefined`
- Crypto operations with `Uint8Array<ArrayBufferLike>` vs `BufferSource`

### 3.6 Code Quality Issues (15 errors)

| Type                   | Count | Examples                                                |
| ---------------------- | ----- | ------------------------------------------------------- |
| Undefined variables    | 3     | `success`, `getMinutesSinceActivity`, `handleUploadAll` |
| Wrong type assignments | 5     | `number` to `undefined`, `boolean` to `number`          |
| Null vs undefined      | 3     | Lock reasons, settings updates                          |
| Duplicate properties   | 1     | `account_id` specified twice                            |
| Unreachable code       | 2     | Nullish coalescing with non-null values                 |
| Type comparisons       | 3     | Comparing incompatible string literals                  |

**Examples:**

```typescript
// Line 111: Cannot find name 'success'
src / lib / bots / webhooks.ts

// Line 153: Cannot find name 'getMinutesSinceActivity'
src / hooks / use - session - timeout.ts

// Line 181: Cannot find name 'handleUploadAll'
src / components / chat / StickerUpload.tsx

// Line 381: Duplicate key 'account_id'
src / lib / social / poller.ts

// Line 381: Type '"eraser"' not in union
src / lib / webrtc / screen - annotator.ts
```

---

## 4. Files with Most Errors

| Rank | File                                  | Errors | Category     |
| ---- | ------------------------------------- | ------ | ------------ |
| 1    | `src/lib/e2ee/signal-client.ts`       | 14     | E2EE/Crypto  |
| 2    | `src/lib/e2ee/session-manager.ts`     | 11     | E2EE/Crypto  |
| 3    | `src/lib/calls/group-call-manager.ts` | 11     | WebRTC       |
| 4    | `src/lib/e2ee/crypto.ts`              | 8      | E2EE/Crypto  |
| 5    | `.next/types/validator.ts`            | 5      | Next.js 15   |
| 6    | `src/lib/social/poller.ts`            | 3      | Social Media |
| 7    | `src/lib/webrtc/screen-annotator.ts`  | 2      | WebRTC       |

**High-Risk Modules:**

1. **E2EE Implementation** (33 errors) - Encryption likely broken
2. **WebRTC/Calls** (13 errors) - Video calls likely broken
3. **Next.js Routes** (13 errors) - API routes broken

---

## 5. Error Breakdown by Type

```
Category                    | Count | %
----------------------------|-------|------
E2EE/Signal Protocol        |  33   | 34%
Next.js 15 Params           |  13   | 13%
WebRTC/Media                |  13   | 13%
Code Quality                |  15   | 15%
Missing Dependencies        |   6   |  6%
Hook/State Issues           |   8   |  8%
Component Props             |   4   |  4%
Library API Misuse          |   6   |  6%
----------------------------|-------|------
TOTAL                       |  98   | 100%
```

---

## 6. Recommended Fix Priority

### Priority 1: Critical Path (Blocks Build)

1. ✅ **Install next-auth** or remove 3 API route files
2. ✅ **Fix Next.js 15 async params** in 5 route files

### Priority 2: Core Features (Breaks Functionality)

3. Fix E2EE Signal Protocol integration (33 errors)
4. Fix WebRTC group call manager (11 errors)
5. Fix missing mobile dependencies or add type guards

### Priority 3: Quality (Warnings/Minor Issues)

6. Fix undefined variables (3 instances)
7. Fix toast API usage (2 instances)
8. Fix Apollo Client `useQueryClient` → `useApolloClient`
9. Remove framer-motion `onDoubleTap` usage
10. Fix null/undefined inconsistencies

### Priority 4: Nice to Have

11. Fix unreachable code (2 instances)
12. Fix duplicate object keys
13. Add proper type guards for platform-specific code

---

## 7. Ignored Warnings

- Webpack cache failures (non-breaking)
- Next.js experimental features notice

---

## 8. Quick Wins (Easy Fixes)

These can be fixed with simple find/replace or one-line changes:

1. **Async params** (13 files):

   ```typescript
   - { params }: { params: { id: string } }
   + { params }: { params: Promise<{ id: string }> }

   - const { id } = params
   + const { id } = await params
   ```

2. **useQueryClient** (2 files):

   ```typescript
   - import { useQueryClient } from '@apollo/client'
   + import { useApolloClient } from '@apollo/client'

   - const queryClient = useQueryClient()
   + const client = useApolloClient()
   ```

3. **Null to undefined** (2 files):

   ```typescript
   ;-handleLock(null) + handleLock(undefined)
   ```

4. **Remove duration from toast** (2 files):
   ```typescript
   ;-toast({ duration: 3000, title: '...' }) + toast({ title: '...' })
   ```

---

## 9. Testing Recommendations

After fixes, run in this order:

```bash
# 1. Type checking only
pnpm type-check

# 2. Build (includes type checking + bundling)
pnpm build

# 3. Linting
pnpm lint

# 4. Unit tests
pnpm test

# 5. E2E tests (after backend is running)
pnpm test:e2e
```

---

## 10. Next Steps

1. **Immediate:** Fix critical path (install next-auth, fix async params)
2. **Short-term:** Decide E2EE strategy (fix Signal integration or remove?)
3. **Medium-term:** Fix WebRTC issues or disable group calls
4. **Long-term:** Add proper CI type checking to prevent regressions

---

## Appendix: Full Error Log

Complete output saved to:

- `/Users/admin/Sites/nself-chat/build-output.txt`
- `/Users/admin/Sites/nself-chat/typecheck-output.txt`

**Build Command Output:**

```
Failed to compile.

./src/app/api/calls/accept/route.ts
Module not found: Can't resolve 'next-auth'

./src/app/api/calls/decline/route.ts
Module not found: Can't resolve 'next-auth'

./src/app/api/calls/end/route.ts
Module not found: Can't resolve 'next-auth'

> Build failed because of webpack errors
```

**Total TypeScript Errors:** 98  
**Blocking Errors:** 6 (missing dependencies)  
**Fixable Errors:** 92

---

_Report generated by analyzing `pnpm build` and `pnpm type-check` output._
