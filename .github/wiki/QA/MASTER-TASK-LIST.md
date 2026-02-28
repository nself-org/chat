# Master Task List - Path to 100% Completion

## ɳChat v0.9.1 - Zero Gaps Initiative

**Created**: February 5, 2026
**Status**: IN PROGRESS
**Goal**: Fix every single issue identified in comprehensive QA

---

## Critical Issues (Must Fix - Blocking)

### Task 1: Fix Build Failure ⚠️ CRITICAL

**Priority**: P0 (BLOCKING)
**Issue**: `TypeError: e.createContext is not a function` in `/api/calls/[id]/join/route.ts`
**Impact**: Production build cannot complete
**Steps**:

- [ ] Read `/src/app/api/calls/[id]/join/route.ts`
- [ ] Identify the context usage issue
- [ ] Fix the React context import/usage
- [ ] Test build completes successfully
- [ ] Verify route works at runtime
      **QA**: Run `pnpm build` and verify success
      **Status**: NOT STARTED

### Task 2: Fix TypeScript Type Errors (~20 errors)

**Priority**: P0 (BLOCKING)
**Issue**: Type mismatches in API routes and services
**Errors**:

1. `src/app/api/attachments/[id]/access/route.ts:133` - Array filter type mismatch
2. `src/app/api/attachments/[id]/access/route.ts:249` - AuditAction type
3. `src/app/api/attachments/[id]/access/route.ts:251` - AuditCategory type
4. `src/app/api/attachments/[id]/access/route.ts:252` - ResourceType type
5. `src/app/api/attachments/upload/route.ts:21` - Missing export 'getValidationService'
6. `src/app/api/attachments/upload/route.ts:262` - Unknown property 'buffer'
7. `src/app/api/attachments/upload/route.ts:269` - Missing property 'success'
8. `src/app/api/attachments/upload/route.ts:270` - Missing property 'error'
9. `src/app/api/attachments/upload/route.ts:275` - Missing property 'error'
10. `src/app/api/attachments/upload/route.ts:281` - Missing property 'data'
11. `src/app/api/attachments/upload/route.ts:318` - Missing method 'deleteFile'
12. `src/app/api/channels/categories/route.ts:25` - Implicit 'any[]' type
13. `src/app/api/channels/categories/route.ts:27` - Implicit 'any[]' type
14. `src/app/api/jobs/process-scheduled-messages/route.ts:319` - AuditAction type
15. `src/app/api/jobs/process-scheduled-messages/route.ts:322` - ResourceType type
16. `src/app/api/jobs/process-scheduled-messages/route.ts:396` - Unknown property 'isSent'
17. `src/app/api/messages/[id]/forward/route.ts:254` - AuditAction type
18. `src/app/api/messages/[id]/link-preview/route.ts:285` - Unknown property 'validateSsl'
19. `src/app/api/messages/[id]/link-preview/route.ts:309` - Missing property 'message'
20. `src/app/api/messages/[id]/link-preview/route.ts:313` - Missing property 'message'

**Steps**:

- [ ] Create type definitions for missing types
- [ ] Fix each error systematically
- [ ] Run `pnpm type-check` after each fix
- [ ] Ensure no new errors introduced
      **QA**: Run `pnpm type-check` with zero errors
      **Status**: NOT STARTED

### Task 3: Fix Export Errors in Services

**Priority**: P0 (BLOCKING)
**Issue**: Missing exports causing build warnings
**Errors**:

1. `src/services/files/validation.service.ts` - Missing export 'getValidationService'
2. `src/services/channels/category.service.ts` - Missing exports 'createCategoryService', 'getCategoryService'

**Steps**:

- [ ] Add missing exports to validation.service.ts
- [ ] Add missing exports to category.service.ts
- [ ] Verify imports work correctly
- [ ] Test build completes without warnings
      **QA**: Run `pnpm build` with no export errors
      **Status**: NOT STARTED

---

## High Priority Issues (Should Fix Soon)

### Task 4: Fix 21 Failing Tests

**Priority**: P1 (HIGH)
**Issue**: 2% test failure rate (21/1014 tests)
**Breakdown**:

- LiveKit integration tests (6 failures) - Jest environment issue
- File upload tests (4 failures) - Mock service issues
- Scheduled messages (3 failures) - Timer-based flakiness
- E2EE session tests (2 failures) - Async setup issues
- Auth flow tests (6 failures) - Nhost mock issues

**Steps**:

- [ ] Fix LiveKit Jest environment config
- [ ] Fix file upload mock services
- [ ] Stabilize timer-based tests (use fake timers)
- [ ] Fix async E2EE session setup
- [ ] Fix Nhost auth mocks
- [ ] Run tests until 100% pass rate
      **QA**: Run `pnpm test` with 1014/1014 passing
      **Status**: NOT STARTED

### Task 5: Complete Stripe Client Implementation

**Priority**: P1 (HIGH)
**Issue**: Stripe client returns mock payment intents (not real API calls)
**Current**: Server integration is real, client is mocked
**Steps**:

- [ ] Read current Stripe client implementation
- [ ] Implement real Stripe.js integration
- [ ] Replace mock payment intent IDs with real API calls
- [ ] Add proper error handling
- [ ] Add webhook verification
- [ ] Test with Stripe test mode
- [ ] Document API keys setup
      **QA**: Create test payment and verify real Stripe API is called
      **Status**: NOT STARTED

### Task 6: Update Misleading Documentation

**Priority**: P1 (HIGH)
**Issue**: Documentation claims don't match reality
**Misleading Claims**:

1. "100% complete" → Actually 70-75%
2. "Signal Protocol library" → Actually Web Crypto API
3. "Stripe integrated" → Client is mocked
4. "Production ready" → Build fails
5. "Video processing" → Only images work

**Steps**:

- [ ] Update `.claude/CLAUDE.md` with accurate completion %
- [ ] Update `README.md` to reflect actual status
- [ ] Update `docs/Features-Complete.md` with reality
- [ ] Add "MVP Features" vs "Complete Features" section
- [ ] Document what's mocked vs real
- [ ] Update version to 0.9.1-beta (not production)
      **QA**: Review all docs for accuracy
      **Status**: NOT STARTED

### Task 7: Enable Test Coverage Reporting

**Priority**: P1 (HIGH)
**Issue**: Coverage claimed (>80%) but not measured
**Steps**:

- [ ] Verify jest.config.js has coverage settings
- [ ] Run `pnpm test --coverage`
- [ ] Generate coverage report
- [ ] Measure actual coverage %
- [ ] Identify uncovered code
- [ ] Add tests to reach 80% threshold
      **QA**: Coverage report shows >80% actual coverage
      **Status**: NOT STARTED

---

## Medium Priority Issues (Should Fix)

### Task 8: Implement Video Processing (FFmpeg)

**Priority**: P2 (MEDIUM)
**Issue**: Video transcoding throws "not implemented in MVP"
**Current**: Image processing works (Sharp.js), video stubbed
**Steps**:

- [ ] Install FFmpeg dependency
- [ ] Create video transcoding service
- [ ] Implement format conversion
- [ ] Add thumbnail extraction from video
- [ ] Add progress reporting
- [ ] Test with sample videos
- [ ] Update documentation
      **QA**: Upload video file and verify transcoding works
      **Status**: NOT STARTED
      **Estimated Time**: 16-24 hours

### Task 9: Create Desktop Application Icons

**Priority**: P2 (MEDIUM)
**Issue**: Electron/Tauri builds need icon assets
**Steps**:

- [ ] Design icon in multiple sizes (16x16 to 512x512)
- [ ] Create .icns file (macOS)
- [ ] Create .ico file (Windows)
- [ ] Create .png files (Linux)
- [ ] Update Electron build config
- [ ] Update Tauri build config
- [ ] Test desktop builds with icons
      **QA**: Build desktop app and verify icon appears
      **Status**: NOT STARTED
      **Estimated Time**: 4 hours (with designer)

### Task 10: Fix Next.js 15 Param Type Errors

**Priority**: P2 (MEDIUM)
**Issue**: ~30 errors in `.next/types/` about async params
**Cause**: Next.js 15 changed params to be async
**Steps**:

- [ ] Read Next.js 15 migration guide
- [ ] Update route handlers to await params
- [ ] Change `params: { id: string }` to `params: Promise<{ id: string }>`
- [ ] Add async/await to all route handlers
- [ ] Test all affected routes
      **QA**: Run `pnpm type-check` with no .next/types errors
      **Status**: NOT STARTED

---

## Low Priority Issues (Nice to Have)

### Task 11: Resolve Peer Dependency Warnings

**Priority**: P3 (LOW)
**Issue**: ~10 peer dependency warnings from pnpm
**Steps**:

- [ ] List all peer dependency warnings
- [ ] Update packages to compatible versions
- [ ] Test that app still works
- [ ] Document any breaking changes
      **QA**: Run `pnpm install` with no warnings
      **Status**: NOT STARTED

### Task 12: Update Deprecated Dependencies

**Priority**: P3 (LOW)
**Issue**: ~30 deprecated subdependencies
**Steps**:

- [ ] List all deprecated packages
- [ ] Check for updated versions
- [ ] Update dependencies one by one
- [ ] Test after each update
- [ ] Document migration steps
      **QA**: Run `pnpm outdated` and verify critical deps updated
      **Status**: NOT STARTED

### Task 13: Test Mobile Apps on Devices

**Priority**: P3 (LOW)
**Issue**: Capacitor iOS/Android builds untested on real devices
**Steps**:

- [ ] Build iOS app for simulator
- [ ] Build Android app for emulator
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Test push notifications
- [ ] Test native features (camera, etc.)
- [ ] Document device-specific issues
      **QA**: App runs successfully on iOS and Android devices
      **Status**: NOT STARTED
      **Estimated Time**: 8 hours

### Task 14: Complete Workflow Builder UI

**Priority**: P3 (LOW)
**Issue**: Workflow engine exists but UI is minimal
**Steps**:

- [ ] Design workflow builder interface
- [ ] Implement drag-and-drop
- [ ] Add trigger configuration UI
- [ ] Add action configuration UI
- [ ] Add condition builder
- [ ] Add workflow testing/debugging
- [ ] Document workflow capabilities
      **QA**: Create a workflow using the UI and verify it executes
      **Status**: NOT STARTED
      **Estimated Time**: 12 hours

---

## Verification Tasks (After All Fixes)

### Task 15: Full Build Verification

**Priority**: P0 (REQUIRED)
**Steps**:

- [ ] Clean build directory (`rm -rf .next`)
- [ ] Run `pnpm type-check` (zero errors)
- [ ] Run `pnpm lint` (zero errors)
- [ ] Run `pnpm build` (successful)
- [ ] Test production build locally
- [ ] Check bundle size
- [ ] Verify all routes accessible
      **QA**: Production build works without errors
      **Status**: NOT STARTED

### Task 16: Full Test Suite Verification

**Priority**: P0 (REQUIRED)
**Steps**:

- [ ] Run `pnpm test` (all tests pass)
- [ ] Run `pnpm test --coverage` (>80% coverage)
- [ ] Review coverage report
- [ ] Add tests for uncovered code
- [ ] Run tests again
- [ ] Document test results
      **QA**: 100% test pass rate with >80% coverage
      **Status**: NOT STARTED

### Task 17: Backend Services Health Check

**Priority**: P0 (REQUIRED)
**Steps**:

- [ ] Start backend: `cd .backend && nself start`
- [ ] Verify PostgreSQL running
- [ ] Verify Hasura GraphQL endpoint
- [ ] Verify Auth service
- [ ] Verify MeiliSearch
- [ ] Verify LiveKit
- [ ] Verify RTMP
- [ ] Test all 5 plugin services
- [ ] Run health check script
      **QA**: All 11 backend services healthy
      **Status**: NOT STARTED

### Task 18: End-to-End Functional Testing

**Priority**: P1 (REQUIRED)
**Steps**:

- [ ] Test user registration/login
- [ ] Test channel creation
- [ ] Test message sending
- [ ] Test file upload
- [ ] Test voice/video call
- [ ] Test search functionality
- [ ] Test admin dashboard
- [ ] Test all plugin features
- [ ] Document any issues found
      **QA**: All critical user flows work end-to-end
      **Status**: NOT STARTED

---

## Summary

**Total Tasks**: 18
**Critical (P0)**: 3 (Tasks 1-3)
**High (P1)**: 4 (Tasks 4-7)
**Medium (P2)**: 3 (Tasks 8-10)
**Low (P3)**: 4 (Tasks 11-14)
**Verification (Required)**: 4 (Tasks 15-18)

**Estimated Total Time**: 60-80 hours to complete everything

**Critical Path** (blocking deployment):

1. Fix build failure (Task 1) - 2 hours
2. Fix TypeScript errors (Task 2) - 4 hours
3. Fix export errors (Task 3) - 1 hour
4. Fix failing tests (Task 4) - 6 hours
5. Update documentation (Task 6) - 2 hours
6. Full verification (Tasks 15-18) - 4 hours

**Minimum to Ship**: Complete Tasks 1-7, 15-18 (20-25 hours)
**Full 100% Completion**: Complete all 18 tasks (60-80 hours)

---

**Next Action**: Start with Task 1 (Fix build failure)
