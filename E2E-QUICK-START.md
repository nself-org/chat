# E2E Testing Quick Start Guide

Quick reference for running and writing E2E tests for nself-chat.

---

## Quick Commands

```bash
# Install dependencies (first time only)
pnpm add -D @axe-core/playwright

# Run all tests
pnpm test:e2e

# Run specific file
pnpm test:e2e ai-summarization.spec.ts

# Run with UI (recommended for development)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e --headed

# Debug mode
pnpm test:e2e --debug

# Run single test
pnpm test:e2e -g "should summarize thread"

# Generate report
pnpm test:e2e --reporter=html
```

---

## Test Files Overview

| File | Tests | Status | What It Tests |
|------|-------|--------|---------------|
| `ai-summarization.spec.ts` | 31+ | ✅ | Thread summaries, digests, sentiment |
| `semantic-search.spec.ts` | 41+ | ✅ | Cmd+K search, filters, saved searches |
| `bot-management.spec.ts` | 0 | ⏳ | Bot creation, editing, testing |
| `moderation-workflow.spec.ts` | 0 | ⏳ | Content flags, queue, actions |

---

## Page Objects

Located in `/e2e/pages/`:

```typescript
// Chat interactions
import { ChatPage } from './pages/chat.page'
const chatPage = new ChatPage(page)
await chatPage.goto('general')
await chatPage.sendMessage('Hello!')

// AI Summarization
import { AISummaryPage } from './pages/ai-summary.page'
const summaryPage = new AISummaryPage(page)
await summaryPage.summarizeThread(0)
await summaryPage.downloadSummary('txt')

// Search
import { SearchPage } from './pages/search.page'
const searchPage = new SearchPage(page)
await searchPage.openCommandPalette()
await searchPage.search('deployment issues')

// Bot Management
import { BotManagementPage } from './pages/bot-management.page'
const botPage = new BotManagementPage(page)
await botPage.createBotFromTemplate('MyBot', 'greeting')

// Moderation
import { ModerationPage } from './pages/moderation.page'
const modPage = new ModerationPage(page)
await modPage.filterByType('spam')
await modPage.takeAction('approve')
```

---

## Writing a New Test

```typescript
import { test, expect } from '@playwright/test'
import { AISummaryPage } from './pages/ai-summary.page'

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat')
    await page.waitForLoadState('networkidle')
  })

  test('should do something', async ({ page }, testInfo) => {
    // Arrange
    const summaryPage = new AISummaryPage(page)

    // Act
    await summaryPage.summarizeButton.click()

    // Assert
    await expect(summaryPage.summaryPanel).toBeVisible()

    // Screenshot (optional)
    await testInfo.attach('result', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })
  })
})
```

---

## Common Patterns

### 1. Wait for Element

```typescript
// ✅ Good - built-in wait
await expect(element).toBeVisible()

// ❌ Bad - arbitrary timeout
await page.waitForTimeout(1000)
```

### 2. Handle Missing Elements

```typescript
// ✅ Good - graceful
const isVisible = await element.isVisible().catch(() => false)
if (isVisible) {
  await element.click()
}

// ❌ Bad - throws error
await element.click() // Fails if not found
```

### 3. Screenshots

```typescript
// Critical flows
await testInfo.attach('step-name', {
  body: await page.screenshot({ fullPage: true }),
  contentType: 'image/png',
})
```

### 4. Accessibility

```typescript
import AxeBuilder from '@axe-core/playwright'

const results = await new AxeBuilder({ page })
  .include('[data-testid="modal"]')
  .analyze()

expect(results.violations).toEqual([])
```

---

## Debugging

### View Test Report

```bash
# Generate and open HTML report
pnpm test:e2e --reporter=html
npx playwright show-report
```

### Trace Viewer

```bash
# Run with trace
pnpm test:e2e --trace=on

# View trace
npx playwright show-trace trace.zip
```

### VS Code Extension

Install "Playwright Test for VSCode" extension:
- Run tests from editor
- Set breakpoints
- View test results inline

---

## Best Practices

1. **Use Page Objects** - Don't use selectors directly in tests
2. **Wait for Stability** - Use `waitForLoadState('networkidle')`
3. **Test Isolation** - Each test should be independent
4. **Descriptive Names** - `should summarize thread with multiple messages`
5. **Screenshots on Fail** - Automatic, but add manual for critical steps
6. **Accessibility** - Include accessibility tests
7. **Mobile Testing** - Test responsive layouts

---

## Troubleshooting

**Tests failing locally but passing in CI?**
- Check Node version (>=20.0.0)
- Clear Playwright cache: `npx playwright install --force`
- Check for race conditions

**Tests flaky?**
- Add `await page.waitForLoadState('networkidle')`
- Use `expect().toBeVisible({ timeout: 10000 })`
- Check for async operations

**Can't find element?**
- Use `npx playwright codegen localhost:3000` to generate selectors
- Check data-testid attributes
- Verify element is in DOM

---

## Coverage Checklist

When adding a new feature, include tests for:

- ✅ Happy path (feature works as expected)
- ✅ Edge cases (empty state, no data, max limits)
- ✅ Error handling (network errors, API failures)
- ✅ Loading states (spinners, skeletons)
- ✅ Accessibility (ARIA labels, keyboard nav)
- ✅ Mobile responsiveness (touch targets, layout)
- ✅ Performance (load time, interaction time)

---

## Resources

- 📚 [Full Documentation](./docs/E2E-Test-Suite.md)
- 🎭 [Playwright Docs](https://playwright.dev)
- 🧪 [Test Examples](./e2e/)
- 📦 [Page Objects](./e2e/pages/)

---

**Questions?** Check the [E2E Test Suite Documentation](./docs/E2E-Test-Suite.md) or ask in #qa-testing
