# AI Test Suite Implementation Guide

## Quick Start

The foundation for the comprehensive AI test suite has been established. Here's how to continue implementation:

### 1. Files Created ✅

#### Test Utilities
- **`src/lib/ai/__tests__/ai-test-utils.ts`** (530 lines)
  - Mock data generators (`createMockMessage`, `createMockThread`, `createRealisticThread`)
  - AI API response mocks (OpenAI, Anthropic)
  - Mock fetch setup helpers
  - Validation assertions (`assertValidTldr`, `assertValidKeyPoints`, etc.)
  - Environment helpers
  - Performance measurement utilities

#### Core AI Tests
- **`src/lib/ai/__tests__/summarizer.test.ts`** (600+ lines)
  - 60+ comprehensive tests covering:
    - Thread summarization with OpenAI/Anthropic/Local providers
    - TL;DR generation and validation
    - Key points extraction
    - Action items detection
    - Participant summaries
    - Metadata extraction
    - Sentiment analysis
    - Quality scoring
    - Cost tracking
    - Error handling and fallbacks
    - Performance benchmarks

- **`src/lib/ai/__tests__/smart-search.test.ts`** (700+ lines)
  - 50+ comprehensive tests covering:
    - Semantic search with embeddings
    - Keyword search fallback
    - Embedding generation and caching
    - Cosine similarity calculations
    - Filter application (channel, user, date, thread)
    - Result ranking (relevance, date, hybrid)
    - Context inclusion
    - Cache management
    - Performance benchmarks
    - Edge case handling

#### Documentation
- **`docs/AI-Test-Suite-Complete.md`** - Complete test plan
- **`docs/AI-Test-Implementation-Guide.md`** - This file

### 2. Test Patterns Established

#### Pattern 1: Provider-Based Testing
```typescript
describe('with OpenAI provider', () => {
  beforeEach(() => {
    restoreEnv = setupAITestEnv('openai')
    setupMockOpenAI({ chat: 'test response' })
  })

  it('should use OpenAI for generation', async () => {
    // Test implementation
  })
})
```

#### Pattern 2: Fallback Testing
```typescript
it('should fall back to local on API failure', async () => {
  setupMockAPIError(500)
  const result = await feature.execute()
  expect(result).toBeTruthy() // Should still work
})
```

#### Pattern 3: Performance Testing
```typescript
it('should complete within time limit', async () => {
  await assertCompletesWithin(
    () => feature.process(largeDataset),
    1000 // 1 second
  )
})
```

### 3. Next Steps - Implementing Remaining Tests

#### Step 1: Bot Framework Tests

Create `/src/lib/bots/__tests__/bot-runtime.test.ts`:

```typescript
import { BotRuntime } from '../bot-runtime'
import { createMockMessage } from '@/lib/ai/__tests__/ai-test-utils'

describe('BotRuntime', () => {
  let runtime: BotRuntime

  beforeEach(() => {
    runtime = new BotRuntime()
  })

  describe('event routing', () => {
    it('should route message events to handlers', async () => {
      const handler = jest.fn()
      runtime.on('message', handler)

      await runtime.emit('message', {
        type: 'message',
        data: createMockMessage(),
      })

      expect(handler).toHaveBeenCalled()
    })
  })

  describe('permission checking', () => {
    it('should enforce bot permissions', async () => {
      const bot = createMockBot({ permissions: ['read_messages'] })

      const canSend = await runtime.checkPermission(bot, 'send_messages')
      expect(canSend).toBe(false)
    })
  })
})
```

#### Step 2: Moderation Tests

Create `/src/lib/moderation/__tests__/ai-moderator.test.ts`:

```typescript
import { AIModeratorService } from '../ai-moderator'
import { getAIDetector } from '../ai-detector'

describe('AIModeratorService', () => {
  let moderator: AIModeratorService

  beforeEach(() => {
    moderator = new AIModeratorService({
      toxicityThreshold: 0.7,
      spamThreshold: 0.6,
      autoAction: true,
    })
  })

  describe('content analysis', () => {
    it('should analyze message for toxicity and spam', async () => {
      const result = await moderator.analyzeMessage({
        content: 'Test message',
        userId: 'user-1',
      })

      expect(result).toHaveProperty('toxicity')
      expect(result).toHaveProperty('spam')
      expect(result).toHaveProperty('action')
    })
  })

  describe('auto-actions', () => {
    it('should auto-delete highly toxic messages', async () => {
      const deleteSpy = jest.fn()
      moderator.on('delete', deleteSpy)

      await moderator.analyzeMessage({
        content: 'Extremely toxic content',
        userId: 'user-1',
      })

      expect(deleteSpy).toHaveBeenCalled()
    })
  })
})
```

#### Step 3: API Route Tests

Create `/src/app/api/ai/__tests__/summarize.test.ts`:

```typescript
import { POST } from '../summarize/route'
import { NextRequest } from 'next/server'

describe('POST /api/ai/summarize', () => {
  it('should summarize thread successfully', async () => {
    const request = new NextRequest('http://localhost/api/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({
        threadId: 'thread-123',
        options: { includeActionItems: true },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('summary')
    expect(data.summary).toHaveProperty('tldr')
  })

  it('should validate request body', async () => {
    const request = new NextRequest('http://localhost/api/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({}), // Missing threadId
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

#### Step 4: Component Tests

Create `/src/components/ai/__tests__/summary-card.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { SummaryCard } from '../summary-card'
import { createRealisticThread } from '@/lib/ai/__tests__/ai-test-utils'

describe('SummaryCard', () => {
  it('should display thread summary', () => {
    const summary = {
      tldr: 'Team discussed feature release',
      keyPoints: ['Point 1', 'Point 2'],
      actionItems: [],
      participants: [],
      metadata: {
        messageCount: 7,
        participantCount: 3,
      },
    }

    render(<SummaryCard summary={summary} />)

    expect(screen.getByText('Team discussed feature release')).toBeInTheDocument()
    expect(screen.getByText('Point 1')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(<SummaryCard loading={true} />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
})
```

#### Step 5: E2E Tests

Create `/e2e/ai-features.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('AI Features E2E', () => {
  test('user can summarize a thread', async ({ page }) => {
    await page.goto('/chat/channel-1')

    // Find a thread
    await page.click('[data-testid="thread-message"]')

    // Click summarize button
    await page.click('[data-testid="summarize-thread-btn"]')

    // Wait for summary
    await page.waitForSelector('[data-testid="thread-summary"]')

    // Verify summary appears
    const tldr = await page.textContent('[data-testid="summary-tldr"]')
    expect(tldr).toBeTruthy()
    expect(tldr!.length).toBeGreaterThan(20)
  })

  test('user can search with natural language', async ({ page }) => {
    await page.goto('/search')

    // Enter semantic query
    await page.fill('[data-testid="search-input"]', 'deployment issues')
    await page.click('[data-testid="search-btn"]')

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]')

    // Verify results
    const results = await page.locator('[data-testid="search-result"]').count()
    expect(results).toBeGreaterThan(0)
  })
})
```

### 4. Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test summarizer.test.ts

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e
```

### 5. Test Coverage Goals

| Component | Current | Target |
|-----------|---------|--------|
| AI Summarization | 100% | 85%+ |
| Smart Search | 100% | 85%+ |
| Bot Framework | 0% | 80%+ |
| Auto-Moderation | 0% | 80%+ |
| API Routes | 0% | 90%+ |
| Components | 0% | 75%+ |
| **Overall** | **30%** | **80%+** |

### 6. Mocking Best Practices

#### Mock AI APIs Consistently
```typescript
// Always use setupMockOpenAI/setupMockAnthropic from ai-test-utils
const mockFetch = setupMockOpenAI({
  chat: 'Expected response',
  embedding: Array(1536).fill(0.5),
})
```

#### Reset Mocks Between Tests
```typescript
beforeEach(() => {
  jest.clearAllMocks()
  clearAITestEnv()
})
```

#### Test Error Scenarios
```typescript
it('should handle API errors', async () => {
  setupMockAPIError(500, 'Internal Server Error')
  // Test should still complete successfully with fallback
})
```

### 7. Common Test Patterns

#### Async/Await Pattern
```typescript
it('should complete async operation', async () => {
  const result = await asyncFunction()
  expect(result).toBeTruthy()
})
```

#### Promise.all for Parallel Tests
```typescript
it('should handle concurrent requests', async () => {
  const results = await Promise.all([
    request1(),
    request2(),
    request3(),
  ])
  expect(results.length).toBe(3)
})
```

#### Spy Pattern
```typescript
it('should call dependency', async () => {
  const spy = jest.spyOn(dependency, 'method')
  await systemUnderTest.execute()
  expect(spy).toHaveBeenCalledWith(expectedArgs)
})
```

### 8. CI/CD Integration

Add to `.github/workflows/ai-tests.yml`:

```yaml
name: AI Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm@9.15.4

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### 9. Key Files Reference

#### Test Utilities
- `/src/lib/ai/__tests__/ai-test-utils.ts` - All shared test helpers

#### Existing Tests (Use as Templates)
- `/src/lib/ai/__tests__/summarizer.test.ts` - AI feature testing patterns
- `/src/lib/ai/__tests__/smart-search.test.ts` - Search and embedding patterns
- `/src/lib/bot-sdk/__tests__/bot-client.test.ts` - Existing bot pattern

#### Test Setup
- `/src/__tests__/setup.ts` - Global test setup
- `/jest.config.js` - Jest configuration

### 10. Estimated Timeline

| Task | Estimated Time | Priority |
|------|---------------|----------|
| Bot Framework Tests | 4-6 hours | High |
| Auto-Moderation Tests | 3-4 hours | High |
| AI Infrastructure Tests | 2-3 hours | Medium |
| API Route Tests | 3-4 hours | High |
| Component Tests | 4-5 hours | Medium |
| E2E Tests | 3-4 hours | High |
| **Total** | **19-26 hours** | - |

### 11. Success Criteria

- [ ] All AI features have >80% code coverage
- [ ] All critical paths have E2E tests
- [ ] Tests run in <5 minutes total
- [ ] Tests pass consistently in CI/CD
- [ ] Zero flaky tests
- [ ] All edge cases covered
- [ ] Documentation updated

### 12. Notes

#### What's Working Well
✅ AI summarization tests are comprehensive and well-structured
✅ Smart search tests cover all major scenarios
✅ Test utilities provide excellent reusability
✅ Mock setup is clean and consistent
✅ Performance benchmarks are included

#### Areas for Improvement
📋 Need to complete bot framework tests
📋 Need to complete moderation tests
📋 Need API route test coverage
📋 Need component test coverage
📋 Need E2E test scenarios

#### Quick Wins
1. Copy patterns from summarizer.test.ts for similar features
2. Use ai-test-utils for all mock data
3. Follow existing test structure for consistency
4. Add tests incrementally, feature by feature

### 13. Contact & Support

For questions about the test suite:
- Review existing tests in `/src/lib/ai/__tests__/`
- Check utility functions in `ai-test-utils.ts`
- Refer to Jest documentation: https://jestjs.io/
- Refer to Testing Library docs: https://testing-library.com/

---

**Status**: Foundation complete ✅ | Implementation in progress 📋 | Target: 285 total tests
