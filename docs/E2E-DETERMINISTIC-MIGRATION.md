# E2E Test Deterministic Migration Guide

**Purpose**: Migrate existing E2E tests from non-deterministic patterns to deterministic patterns.

**Goal**: Eliminate flaky tests by removing wall-clock dependencies and arbitrary timeouts.

---

## Migration Checklist

### Phase 1: Replace Date.now() with generateTestId()

**Files to Update**: 69 instances across 15 files

**Pattern to Find**:
```typescript
const testMessage = `Test message ${Date.now()}`
```

**Replace With**:
```typescript
import { generateTestId } from './fixtures/test-helpers'

const testMessage = `Test message ${generateTestId('message')}`
```

**Files Affected**:
- `e2e/chat.spec.ts` (4 instances)
- `e2e/offline.spec.ts` (8 instances)
- `e2e/message-sending.spec.ts` (6 instances)
- `e2e/channel-management.spec.ts` (2 instances)
- `e2e/settings.spec.ts` (1 instance)
- `e2e/mobile/auth.spec.ts` (1 instance)
- `e2e/mobile/messaging.spec.ts` (14 instances)
- `e2e/mobile/offline.spec.ts` (21 instances)
- `e2e/mobile/channels.spec.ts` (3 instances)
- `e2e/mobile/network.spec.ts` (6 instances)
- `e2e/mobile/performance.spec.ts` (3 instances)

### Phase 2: Replace waitForTimeout() with Proper Waits

**Files to Update**: 29 instances in `e2e/i18n.spec.ts`, others

**Pattern to Find**:
```typescript
await page.waitForTimeout(1000)
```

**Replace With**:
```typescript
await page.waitForSelector('[data-testid="expected-element"]', {
  state: 'visible',
  timeout: 5000
})
// OR
await page.waitForLoadState('networkidle')
```

**Files Affected**:
- `e2e/i18n.spec.ts` (23 instances)
- `e2e/offline.spec.ts` (6+ instances)

### Phase 3: Add Test Context to Tests

**Pattern**:
```typescript
import { TestContext } from './fixtures/test-helpers'

test.describe('My Feature', () => {
  let testContext: TestContext

  test.beforeEach(async ({ page }) => {
    testContext = new TestContext('my-feature')
    // ... setup
  })

  test.afterEach(async () => {
    testContext.cleanup()
  })

  test('should do something', async ({ page }) => {
    const uniqueId = testContext.uniqueId('item')
    // Use uniqueId in test
  })
})
```

### Phase 4: Replace setTimeout() in Visual Regression

**File**: `e2e/visual-regression.spec.ts`

**Pattern to Find**:
```typescript
await new Promise((resolve) => setTimeout(resolve, 2000))
```

**Replace With**:
```typescript
import { waitForCondition } from './fixtures/test-helpers'

await waitForCondition(
  async () => await page.locator('[data-testid="animation-complete"]').isVisible(),
  { timeout: 5000, description: 'animation to complete' }
)
```

---

## Automated Migration Script

**Location**: `scripts/migrate-e2e-tests.ts`

```typescript
#!/usr/bin/env tsx

import { readFile, writeFile } from 'fs/promises'
import { glob } from 'glob'

async function migrateTests() {
  const files = await glob('e2e/**/*.spec.ts')

  for (const file of files) {
    let content = await readFile(file, 'utf-8')
    let modified = false

    // Replace Date.now() patterns
    if (content.includes('Date.now()')) {
      // Add import if not present
      if (!content.includes('from \'./fixtures/test-helpers\'')) {
        const importIndex = content.indexOf('import')
        const firstImport = content.substring(0, content.indexOf('\n', importIndex))
        content = content.replace(
          firstImport,
          `${firstImport}\nimport { generateTestId } from './fixtures/test-helpers'`
        )
      }

      // Replace Date.now() with generateTestId()
      content = content.replace(
        /`([^`]*)\$\{Date\.now\(\)\}([^`]*)`/g,
        (match, prefix, suffix) => {
          // Extract a meaningful prefix for the ID
          const idPrefix = prefix.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
          return `\`${prefix}\${generateTestId('${idPrefix || 'test'}')}\${suffix}\``
        }
      )

      modified = true
    }

    // Replace waitForTimeout with TODO comment
    if (content.includes('waitForTimeout')) {
      content = content.replace(
        /await page\.waitForTimeout\((\d+)\)/g,
        '// TODO: Replace with proper wait condition\n      await page.waitForTimeout($1)'
      )
      modified = true
    }

    if (modified) {
      await writeFile(file, content, 'utf-8')
      console.log(`✅ Migrated: ${file}`)
    }
  }

  console.log('✅ Migration complete!')
}

migrateTests().catch(console.error)
```

**Run**:
```bash
pnpm tsx scripts/migrate-e2e-tests.ts
```

---

## Manual Migration Steps

### Step 1: Update Imports

For each test file, add:

```typescript
import {
  generateTestId,
  waitForCondition,
  TestContext,
  SeededRandom,
} from './fixtures/test-helpers'
```

Or for mobile tests:

```typescript
import {
  generateTestId,
  waitForCondition,
  TestContext,
  SeededRandom,
} from '../fixtures/test-helpers'
```

### Step 2: Add Test Context

```typescript
test.describe('My Feature', () => {
  let testContext: TestContext

  test.beforeEach(async () => {
    testContext = new TestContext(test.info().title)
  })

  test.afterEach(async () => {
    testContext.cleanup()
  })
})
```

### Step 3: Replace Patterns

#### Pattern 1: Message with Timestamp
```typescript
// Before
const msg = `Test ${Date.now()}`

// After
const msg = `Test ${generateTestId('message')}`
```

#### Pattern 2: Channel with Timestamp
```typescript
// Before
const channel = `channel-${Date.now()}`

// After
const channel = testContext.uniqueId('channel')
```

#### Pattern 3: Wait for Animation
```typescript
// Before
await page.waitForTimeout(1000)

// After
await waitForCondition(
  async () => await page.locator('[data-testid="loaded"]').isVisible(),
  { timeout: 5000 }
)
```

#### Pattern 4: Random Values
```typescript
// Before
const random = Math.random()

// After
const rng = new SeededRandom('my-test')
const random = rng.next()
```

---

## Testing Migration Success

After migration, run tests multiple times to verify determinism:

```bash
# Run tests 10 times
for i in {1..10}; do
  echo "Run $i..."
  pnpm test:e2e e2e/chat.spec.ts || break
done
```

All runs should pass identically.

---

## Verification Checklist

- [ ] No `Date.now()` in test files
- [ ] No `Math.random()` in test files
- [ ] Minimal `waitForTimeout()` (only where absolutely necessary)
- [ ] All timeouts have proper wait conditions as alternative
- [ ] Test context used for unique IDs
- [ ] Tests pass 100% of the time (run 10+ times)
- [ ] No CI-specific test failures

---

## Files Already Updated

- ✅ `/e2e/fixtures/test-helpers.ts` - Created with all helpers
- ✅ `/docs/E2E-TEST-MATRIX.md` - Complete platform matrix
- ✅ `/e2e/desktop-only/window-management.spec.ts` - Desktop tests
- ✅ `/e2e/mobile-only/biometric-auth.spec.ts` - Mobile biometric tests

---

## Files Requiring Migration

### High Priority (Most Flaky)

1. `e2e/chat.spec.ts` - 4 Date.now() instances
2. `e2e/offline.spec.ts` - 8 Date.now(), 6 waitForTimeout()
3. `e2e/mobile/offline.spec.ts` - 21 Date.now() instances
4. `e2e/mobile/messaging.spec.ts` - 14 Date.now() instances

### Medium Priority

5. `e2e/i18n.spec.ts` - 23 waitForTimeout() instances
6. `e2e/message-sending.spec.ts` - 6 Date.now() instances
7. `e2e/mobile/network.spec.ts` - 6 Date.now() instances

### Low Priority (Fewer Instances)

8. `e2e/channel-management.spec.ts` - 2 instances
9. `e2e/settings.spec.ts` - 1 instance
10. `e2e/mobile/auth.spec.ts` - 1 instance

---

## Timeline

**Phase 1** (Day 1): Replace all Date.now() - ~69 instances
**Phase 2** (Day 2): Replace waitForTimeout() - ~35 instances
**Phase 3** (Day 3): Add test contexts - All test files
**Phase 4** (Day 4): Verification and testing

**Total Estimated Time**: 3-4 days

---

## Success Criteria

1. ✅ All E2E tests pass 100 times in a row locally
2. ✅ All E2E tests pass 10 times in a row in CI
3. ✅ No Date.now() or Math.random() in any test file
4. ✅ waitForTimeout() only used where absolutely necessary (< 5 instances total)
5. ✅ All new tests use deterministic patterns from the start

---

## Resources

- [Test Helpers Documentation](../e2e/fixtures/test-helpers.ts)
- [E2E Test Matrix](./E2E-TEST-MATRIX.md)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Detox Best Practices](https://wix.github.io/Detox/docs/guide/test-id)

---

**Maintained by**: nself-chat Team
**Last Updated**: 2026-02-09
