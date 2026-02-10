# nself-chat Test Policy (Non-Flaky Testing Standards)

**Version**: 1.0.0
**Effective Date**: February 8, 2026
**Last Updated**: February 8, 2026

---

## Purpose

This document establishes mandatory testing standards to eliminate flaky tests from the nself-chat CI/CD pipeline. All unit tests, integration tests, and E2E tests must comply with these policies to ensure deterministic, repeatable results.

**Enforcement**: CI jobs MUST reference this policy document. Failing tests are triaged against policy violations before being considered "flaky."

---

## 1. Deterministic Seeding Requirements

### 1.1 Random Number Generation

**RULE**: Tests MUST NOT rely on `Math.random()` for meaningful assertions.

**Policy**:
- Mock or stub `Math.random()` in any test that uses it
- Use seeded pseudo-random generators (e.g., `seedrandom` npm package) for reproducible sequences
- If randomness is essential to testing logic, seed it with a fixed value (e.g., `0xDEADBEEF`)

**Example (Forbidden)**:
```typescript
// BAD: Non-deterministic
it('generates unique IDs', () => {
  const id1 = generateId() // Uses Math.random()
  const id2 = generateId()
  expect(id1).not.toBe(id2)
})
```

**Example (Compliant)**:
```typescript
// GOOD: Deterministic with stub
it('generates unique IDs', () => {
  let counter = 0
  jest.spyOn(global.Math, 'random').mockImplementation(() => {
    counter += 0.1
    return counter
  })
  const id1 = generateId()
  const id2 = generateId()
  expect(id1).not.toBe(id2)
  jest.restoreAllMocks()
})
```

### 1.2 Date and Time

**RULE**: Tests MUST NOT call `Date.now()`, `new Date()`, or `performance.now()` without mocking.

**Policy**:
- Use `jest.useFakeTimers()` for time-dependent tests
- Manually advance timers with `jest.advanceTimersByTime()`
- Set fixed time values at test start: `jest.setSystemTime(new Date('2026-02-08'))`
- Restore real timers in `afterEach()`

**Example (Forbidden)**:
```typescript
// BAD: Non-deterministic
it('respects timeout', async () => {
  let callback called = false
  setTimeout(() => { callbackCalled = true }, 1000)
  await new Promise(r => setTimeout(r, 1100)) // Wall-clock dependency
  expect(callbackCalled).toBe(true)
})
```

**Example (Compliant)**:
```typescript
// GOOD: Deterministic with fake timers
it('respects timeout', async () => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2026-02-08T12:00:00Z'))

  let callbackCalled = false
  setTimeout(() => { callbackCalled = true }, 1000)
  jest.advanceTimersByTime(1100)

  expect(callbackCalled).toBe(true)
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
})
```

### 1.3 Timestamp Assertions

**RULE**: Tests that check timestamps MUST either:
1. Use fixed fake time, OR
2. Accept timestamp within reasonable delta (±100ms)

**Example (Compliant - Option 1)**:
```typescript
it('records creation timestamp', () => {
  jest.useFakeTimers()
  const now = new Date('2026-02-08T12:00:00Z')
  jest.setSystemTime(now)

  const record = createRecord()
  expect(record.createdAt).toEqual(now)

  jest.useRealTimers()
})
```

**Example (Compliant - Option 2)**:
```typescript
it('records creation timestamp', () => {
  const before = Date.now()
  const record = createRecord()
  const after = Date.now()

  expect(record.createdAt.getTime()).toBeGreaterThanOrEqual(before)
  expect(record.createdAt.getTime()).toBeLessThanOrEqual(after)
})
```

---

## 2. Wall-Clock Race Prevention

### 2.1 No Real Timers in Tests

**RULE**: Tests MUST NOT use `await new Promise(r => setTimeout(r, N))` without `jest.useFakeTimers()`.

**Policy**:
- Any test that uses `setTimeout()`, `setInterval()`, or `setImmediate()` MUST use `jest.useFakeTimers()`
- Advance timers explicitly; never wait for actual time to pass
- Reset timers in `afterEach()` or use `jest.clearAllTimers()`

**Violations to Catch**:
```typescript
// RULE VIOLATION 1: Wall-clock sleep
await new Promise(r => setTimeout(r, 500))

// RULE VIOLATION 2: Implicit race condition
setTimeout(() => setFlag(true), 100)
expect(flag).toBe(true) // May fail on slow CI

// RULE VIOLATION 3: Flaky delay-based assertion
await wait(100) // No fake timers
expect(state).toBe('loaded')
```

**Compliant Alternatives**:
```typescript
// COMPLIANT: Fake timers
jest.useFakeTimers()
setTimeout(() => setFlag(true), 100)
jest.advanceTimersByTime(100)
expect(flag).toBe(true)
jest.useRealTimers()

// COMPLIANT: Mock the async behavior
jest.spyOn(module, 'delayedFetch').mockResolvedValue(data)
await delayedFetch()
expect(state).toBe('loaded')

// COMPLIANT: Use fake timers with Promises
jest.useFakeTimers()
const promise = delayedPromise()
jest.runOnlyPendingTimers()
await promise
expect(result).toBe(expected)
jest.useRealTimers()
```

### 2.2 Test Isolation

**RULE**: Tests MUST NOT depend on execution order or state leakage from other tests.

**Policy**:
- Each test MUST restore all mocks, stubs, and timers in `afterEach()` or `afterAll()`
- Use `beforeEach()` to initialize fresh test state
- Test suites must be runnable in any order without failures

**Example**:
```typescript
describe('Feature', () => {
  let mockFn: jest.Mock

  beforeEach(() => {
    mockFn = jest.fn()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
    jest.clearAllTimers()
  })

  it('test A', () => { /* ... */ })
  it('test B', () => { /* ... */ })
  // Can run in any order, no state pollution
})
```

---

## 3. External Network Isolation Rules

### 3.1 No Real HTTP/HTTPS in Unit Tests

**RULE**: Unit tests MUST NOT make real network calls. All external services MUST be mocked.

**Policy**:
- Use `jest.mock()` for all HTTP clients (axios, fetch, etc.)
- Use MSW (Mock Service Worker) for realistic API mocking in integration tests
- Mock GraphQL operations with Apollo MockedProvider
- Any test that tries to call a real endpoint FAILS the CI pipeline

**Scope Definitions**:
- **Unit Tests**: Isolated component/function tests with all dependencies mocked
- **Integration Tests**: Tests that may call a real test database or staging server with explicit annotation
- **E2E Tests**: Only E2E tests may call real backends (and only staging/test environments)

**Example (Unit Test - Forbidden)**:
```typescript
// BAD: Real network call
it('fetches user data', async () => {
  const data = await fetch('https://api.example.com/users/1')
  expect(data).toBeDefined()
})
```

**Example (Unit Test - Compliant)**:
```typescript
// GOOD: Mocked HTTP
jest.mock('node-fetch')
const fetchMock = require('node-fetch') as jest.Mock

it('fetches user data', async () => {
  fetchMock.mockResolvedValue({
    json: jest.fn().mockResolvedValue({ id: 1, name: 'Test' })
  })

  const data = await fetch('https://api.example.com/users/1')
  const json = await data.json()
  expect(json).toEqual({ id: 1, name: 'Test' })
})
```

### 3.2 GraphQL Query Mocking

**RULE**: All GraphQL queries/mutations in tests MUST use Apollo MockedProvider.

**Policy**:
- Wrap test components with `MockedProvider` and provide mocked responses
- Define mock responses for all queries/mutations called by the component
- Return `{ result: { data: {...} } }` in the mocks array
- Never call a real GraphQL endpoint in unit/integration tests

**Example**:
```typescript
import { MockedProvider } from '@apollo/client/testing'
import { GET_USER } from '@/graphql/queries'

const mocks = [
  {
    request: { query: GET_USER, variables: { id: '1' } },
    result: {
      data: {
        user: { id: '1', name: 'Alice', email: 'alice@test.com' }
      }
    }
  }
]

it('displays user name', async () => {
  render(
    <MockedProvider mocks={mocks}>
      <UserProfile userId="1" />
    </MockedProvider>
  )

  await waitFor(() => {
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })
})
```

### 3.3 WebSocket and Real-time Mocking

**RULE**: WebSocket and Socket.io tests MUST use mocked implementations.

**Policy**:
- Mock `socket.io-client` in all tests
- Mock event emitters and subscription callbacks
- Simulate connect/disconnect/message events manually
- Never open real WebSocket connections in unit tests

**Example**:
```typescript
jest.mock('socket.io-client')
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  disconnect: jest.fn()
}
require('socket.io-client').default.mockReturnValue(mockSocket)

it('sends message on socket', () => {
  const socket = createSocket()
  socket.send('hello')

  expect(mockSocket.emit).toHaveBeenCalledWith('message', 'hello')
})
```

---

## 4. Database and Service Isolation

### 4.1 Database Tests

**RULE**: Tests that interact with databases MUST use either:
1. In-memory database (e.g., SQLite `:memory:`), OR
2. Docker container spun up in `beforeAll()` and torn down in `afterAll()`

**Policy**:
- Never use production database credentials in tests
- Tests MUST be isolated per suite; database state must not leak between test runs
- Use transactions that rollback after each test
- Seed test data in `beforeEach()` and clean in `afterEach()`

**Example**:
```typescript
describe('User Repository', () => {
  let db: Database

  beforeAll(async () => {
    // Spin up in-memory SQLite for this test suite
    db = new Database(':memory:')
    await db.init()
  })

  afterAll(async () => {
    await db.close()
  })

  beforeEach(async () => {
    await db.transaction(async () => {
      // Seed test data
      await db.users.insert({ id: 1, name: 'Test' })
    })
  })

  afterEach(async () => {
    await db.transaction(async () => {
      // Rollback or cleanup
      await db.users.deleteAll()
    })
  })

  it('creates user', async () => {
    await db.transaction(async () => {
      const user = await db.users.create({ name: 'Alice' })
      expect(user.name).toBe('Alice')
    })
  })
})
```

### 4.2 External Service Tests

**RULE**: Tests that call external services (Stripe, SendGrid, etc.) MUST mock the service SDK.

**Policy**:
- Mock service clients in all unit/integration tests
- If testing Stripe integration, use Stripe's test mode and fixture data
- Never charge real payment methods
- Use `@stripe/stripe-js` test utilities for payment testing

**Example**:
```typescript
jest.mock('stripe')
const StripeMock = require('stripe') as jest.Mock

it('creates payment intent', async () => {
  StripeMock.mockReturnValue({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded'
      })
    }
  })

  const stripe = new Stripe('sk_test_...')
  const intent = await stripe.paymentIntents.create({
    amount: 1000,
    currency: 'usd'
  })

  expect(intent.id).toBe('pi_test123')
})
```

---

## 5. Retry and Timeout Guidelines

### 5.1 Test Timeouts

**RULE**: All tests MUST complete within a reasonable time. Per-test timeout: **5 seconds (default)**. Per-suite timeout: **30 seconds (default)**.

**Policy**:
- If a test times out, it FAILS the CI pipeline
- Increase timeout only for integration tests that genuinely need more time
- Set explicit timeout: `it('test', () => {...}, 10000)` (10 seconds)
- Long-running tests MUST have a documented reason in a comment

**Example**:
```typescript
// Integration test that waits for server startup
it('connects to database', async () => {
  // Server startup can take 3-5 seconds in CI
  await startTestServer()
  expect(isConnected()).toBe(true)
}, 15000) // 15 second timeout

// Unit test MUST NOT exceed 5 seconds
it('parses user object', () => {
  const user = parseUser({ name: 'Alice' })
  expect(user.name).toBe('Alice')
}) // Default 5s timeout
```

### 5.2 Retries and Flake Budgets

**RULE**: Tests MUST NOT rely on retry logic to pass. Retries are diagnostic tools only.

**Policy**:
- Tests that fail intermittently (flaky) MUST be fixed, not retried
- If a test fails 1 in 10 runs, it violates policy
- Flaky test fix priority: **BLOCKER** (must fix before merge)
- Re-run failing tests 3 times in CI to detect flakes. If it fails any run, the PR fails

**Flake Triage Checklist**:
1. Does the test rely on wall-clock timing? → Use `jest.useFakeTimers()`
2. Does the test use `Date.now()` for comparisons? → Use fixed fake time or delta assertions
3. Does the test call external services? → Mock all HTTP/socket calls
4. Does the test depend on test order? → Add isolation in `beforeEach()` and `afterEach()`
5. Does the test have race conditions in async code? → Use `waitFor()` with proper polling

**Example - Flaky Test Fix**:
```typescript
// FLAKY: Sometimes passes, sometimes fails based on timing
it('processes queue', async () => {
  const queue = new Queue()
  queue.process(longRunningTask)
  expect(queue.isEmpty()).toBe(true) // RACE: Task may not finish yet
})

// FIXED: Explicitly wait for queue to empty
it('processes queue', async () => {
  jest.useFakeTimers()
  const queue = new Queue()
  queue.process(longRunningTask)

  jest.advanceTimersByTime(5000) // Advance past task completion
  expect(queue.isEmpty()).toBe(true)

  jest.useRealTimers()
})
```

### 5.3 waitFor() Best Practices

**RULE**: Async assertions MUST use `waitFor()` with explicit poll intervals.

**Policy**:
- Use `@testing-library/react` `waitFor()` for React component assertions
- Set explicit `timeout` and `interval` options
- Default: `{ timeout: 1000, interval: 50 }`
- Avoid bare `setTimeout()` for async polling

**Example**:
```typescript
import { waitFor } from '@testing-library/react'

it('loads user data', async () => {
  render(<UserProfile />)

  await waitFor(
    () => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    },
    { timeout: 2000, interval: 100 }
  )
})
```

---

## 6. Test Categories and Policies

### 6.1 Unit Tests

**Definition**: Tests of individual functions/components with all dependencies mocked.

**Requirements**:
- ✅ All external calls mocked
- ✅ No database access
- ✅ No real timers
- ✅ Run in <5 seconds
- ✅ Pass deterministically on repeated runs

**Location**: `src/**/__tests__/*.test.ts(x)`

### 6.2 Integration Tests

**Definition**: Tests of feature workflows with potentially real (but test) databases.

**Requirements**:
- ✅ May use real test database (in-memory or Docker)
- ✅ Must mock external APIs (Stripe, SendGrid, etc.)
- ✅ Must use fake timers for time-dependent logic
- ✅ Run in <30 seconds
- ✅ Clean up database state in `afterEach()`

**Location**: `src/__tests__/integration/*.integration.test.ts`

**Annotation**:
```typescript
/**
 * Integration test: Requires test database
 * Setup: Starts in-memory PostgreSQL
 * Cleanup: Transactions rolled back after each test
 */
describe('User Creation Flow', () => {
  // ...
})
```

### 6.3 E2E Tests

**Definition**: Full user journey tests from UI through backend.

**Requirements**:
- ✅ May call real staging backend
- ✅ May use real test users
- ✅ Must have retry logic in Playwright (built-in)
- ✅ Run in <60 seconds per test
- ✅ Isolated per test (no state leakage)

**Location**: `e2e/**/*.spec.ts`

**Annotation**:
```typescript
/**
 * E2E test: Full user journey
 * Backend: Staging environment (STAGING_API_URL)
 * Auth: Test user (test+admin@example.com)
 */
test('User sends message and receives notification', async () => {
  // ...
})
```

---

## 7. Mock Specification

### 7.1 Required Mocks

All tests MUST provide mocks for:

| Dependency | Mock Strategy | Example |
|------------|---------------|---------|
| `Math.random()` | `jest.spyOn().mockImplementation()` | See section 1.1 |
| `Date`, `setTimeout` | `jest.useFakeTimers()` | See section 1.2 |
| HTTP clients (fetch, axios) | `jest.mock('axios')` | See section 3.1 |
| GraphQL queries | `MockedProvider` mocks array | See section 3.2 |
| WebSockets | `jest.mock('socket.io-client')` | See section 3.3 |
| External APIs | Service SDK mocks | See section 4.2 |
| Database | In-memory or Docker container | See section 4.1 |
| `localStorage` | `jest.mock('localStorage')` or use Memory storage | See below |
| `window.location` | Mock assignment or Playwright | See below |

### 7.2 localStorage Mocking

**Example**:
```typescript
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
```

### 7.3 window.location Mocking

**Example**:
```typescript
delete (window as Partial<Window>).location
window.location = {
  href: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  // ... other properties
} as Location
```

---

## 8. Enforcement and CI Integration

### 8.1 CI Job Configuration

The test job in `.github/workflows/ci.yml` MUST:
1. Reference this policy document in a comment
2. Run tests with `--no-coverage` for speed (optional)
3. Set explicit timeout: `timeout-minutes: 30`
4. Fail on any failing test (no retry masking)
5. Upload coverage reports for analysis

### 8.2 Flaky Test Detection

**Detection Strategy**:
- Re-run failed tests 3 times in CI before declaring failure
- If ANY of 3 runs fails, the PR fails
- Log flaky test as BLOCKER in PR comment
- Require fix or policy violation triage before merge

**Detection Script**:
```bash
# Run tests 3 times, fail if any fails
for i in {1..3}; do
  pnpm test:coverage || { echo "Run $i failed"; exit 1; }
done
echo "All 3 runs passed - not flaky"
```

### 8.3 Policy Violations

**Violations that FAIL CI**:
- Test calls `Math.random()` without mocking
- Test uses real `setTimeout()` without `jest.useFakeTimers()`
- Test calls real external API (fetch to non-localhost)
- Test accesses production database
- Test relies on wall-clock timing (implicit race condition)
- Test violates 5-second timeout (without documented reason)
- Test leaves global state polluted (mocks not cleared)

**Detection**: Manual code review + automated linting (future: via static analysis)

---

## 9. Test Policy Checklist

Use this checklist for every test file:

```
- [ ] All Math.random() calls are mocked or seeded
- [ ] All time-dependent logic uses jest.useFakeTimers()
- [ ] All HTTP/API calls are mocked
- [ ] All GraphQL queries use MockedProvider
- [ ] All WebSocket calls are mocked
- [ ] All external services (Stripe, SendGrid) are mocked
- [ ] Database tests use in-memory or Docker setup
- [ ] Tests clean up state in afterEach()
- [ ] Tests can run in any order
- [ ] Tests complete within 5 seconds (unit) or 30 seconds (integration)
- [ ] No bare setTimeout() calls without fake timers
- [ ] No @testing-library/react waitFor() without explicit timeout
- [ ] Mock/stub restoration in afterEach()
- [ ] No hardcoded timestamps (use jest.setSystemTime() or delta assertions)
- [ ] Database transactions rollback or cleanup after each test
```

---

## 10. Common Anti-Patterns (Forbidden)

```typescript
// FORBIDDEN 1: Wall-clock sleep
await new Promise(r => setTimeout(r, 500))

// FORBIDDEN 2: Implicit race condition
setFlag()
expect(flag).toBe(true) // May fail if setFlag() is async

// FORBIDDEN 3: Non-deterministic random
expect(Math.random()).not.toBe(0)

// FORBIDDEN 4: Real API call
const data = await fetch('https://api.stripe.com/v1/customers')

// FORBIDDEN 5: Flaky timer assertion
it('timeout triggers', async () => {
  setTimeout(() => callback(), 100)
  await wait(150) // Real wall-clock wait
  expect(callback).toHaveBeenCalled()
})

// FORBIDDEN 6: State leakage
let globalCounter = 0
it('test 1', () => { globalCounter++; expect(globalCounter).toBe(1) })
it('test 2', () => { expect(globalCounter).toBe(1) }) // FAILS if test 1 runs first

// FORBIDDEN 7: Test order dependency
it('creates user', () => { userId = createUser() })
it('fetches user', () => { expect(fetchUser(userId)).toBeDefined() }) // Depends on test order
```

---

## 11. References and Resources

- **Jest Documentation**: https://jestjs.io/docs/timer-mocks
- **Testing Library**: https://testing-library.com/docs/react-testing-library/intro
- **MSW (Mock Service Worker)**: https://mswjs.io/
- **Playwright Retries**: https://playwright.dev/docs/api/class-testinfo#test-info-retry
- **Signal Protocol Testing**: See signal-protocol library docs for cryptographic assertion patterns

---

## 12. Policy Evolution

This policy is LIVING and EVOLVING. Updates will be made:
1. **Quarterly Review**: February, May, August, November
2. **On New Violations**: When a new class of flakiness is discovered
3. **On Tool Updates**: When Jest, Testing Library, or Playwright updates introduce new capabilities

**Last Review**: February 8, 2026
**Next Review**: May 8, 2026

---

## Appendix A: Reproducible Test Failure Investigation

If a test fails intermittently, follow this investigation process:

1. **Isolate and Reproduce**:
   ```bash
   pnpm test --testNamePattern="exact test name" --runInBand
   ```
   Run 5 times consecutively.

2. **Check for Timing Issues**:
   - Does it use `setTimeout`, `Date.now()`, or `setInterval`?
   - Add `jest.useFakeTimers()` and manually advance time

3. **Check for Order Dependency**:
   ```bash
   pnpm test --testNamePattern="exact test name|other test" --runInBand
   ```
   Run with and without preceding test.

4. **Check for Mock Pollution**:
   - Are mocks cleared in `afterEach()`?
   - Is `jest.useRealTimers()` called after fake timers?

5. **Check for Async Races**:
   - Does the test assume synchronous behavior for async code?
   - Use `waitFor()` explicitly instead of bare `await`

6. **Log Policy Violation**:
   If the test violates this policy, file a BLOCKER issue with:
   - Test file path
   - Violation type (e.g., "real setTimeout without fake timers")
   - Reproduction frequency (e.g., "fails 3 of 10 runs")
   - Suggested fix

---

## Appendix B: Example Compliant Test Suite

```typescript
/**
 * Example compliant test suite demonstrating all policy requirements.
 * Unit test of UserService with mocked dependencies.
 */

import { UserService } from '@/services/user.service'
import { database } from '@/lib/database'

jest.mock('@/lib/database')

describe('UserService', () => {
  let userService: UserService
  const mockDb = database as jest.Mocked<typeof database>

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-02-08T12:00:00Z'))
    userService = new UserService(mockDb)
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  describe('createUser()', () => {
    it('creates user with current timestamp', async () => {
      mockDb.users.insert.mockResolvedValue({
        id: 'user-123',
        name: 'Alice',
        createdAt: new Date('2026-02-08T12:00:00Z')
      })

      const user = await userService.createUser({ name: 'Alice' })

      expect(user.name).toBe('Alice')
      expect(user.createdAt).toEqual(new Date('2026-02-08T12:00:00Z'))
      expect(mockDb.users.insert).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Alice' })
      )
    })

    it('respects timeout for slow inserts', async () => {
      mockDb.users.insert.mockImplementation(
        () => new Promise(resolve => {
          setTimeout(() => {
            resolve({ id: 'user-123', name: 'Alice', createdAt: new Date() })
          }, 500)
        })
      )

      const promise = userService.createUser({ name: 'Alice' })
      jest.advanceTimersByTime(500)
      const user = await promise

      expect(user).toBeDefined()
    })
  })

  describe('deleteUser()', () => {
    it('throws error if user not found', async () => {
      mockDb.users.delete.mockRejectedValue(new Error('Not found'))

      await expect(userService.deleteUser('nonexistent')).rejects.toThrow('Not found')
    })
  })
})
```

---

**Policy Status**: ACTIVE as of February 8, 2026
**Approval**: nself-chat development team
**Contact**: See `.claude/README.md` for team contacts
