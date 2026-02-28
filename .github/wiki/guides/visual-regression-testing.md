# Visual Regression Testing Guide

Visual regression testing helps catch unintended UI changes by comparing screenshots before and after code changes.

## Overview

We use **Playwright's built-in screenshot comparison** for visual regression testing. For advanced needs, we also support **Percy** and **Chromatic** integrations.

## Quick Start

### Run Visual Tests Locally

```bash
# Run visual regression tests
pnpm exec playwright test e2e/visual-regression.spec.ts

# Update snapshots (when UI changes are intentional)
pnpm exec playwright test e2e/visual-regression.spec.ts --update-snapshots

# View test report
pnpm exec playwright show-report
```

### View Snapshots

Snapshots are stored in:

- `e2e/__screenshots__/` - Baseline snapshots
- `test-results/` - Test results and diffs (gitignored)

## Writing Visual Tests

### Basic Page Snapshot

```typescript
import { test, expect } from '@playwright/test'

test('homepage visual test', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    maxDiffPixels: 100,
  })
})
```

### Component Snapshot

```typescript
test('button component', async ({ page }) => {
  await page.goto('/components/button')

  const button = page.locator('[data-testid="primary-button"]')
  await expect(button).toHaveScreenshot('primary-button.png', {
    maxDiffPixels: 10,
  })
})
```

### Responsive Snapshots

```typescript
test('mobile view', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/chat')

  await expect(page).toHaveScreenshot('chat-mobile.png', {
    fullPage: true,
  })
})
```

### Dark Mode Snapshots

```typescript
test('dark mode', async ({ page }) => {
  await page.goto('/chat')

  // Toggle dark mode
  await page.locator('[data-testid="theme-toggle"]').click()
  await page.waitForTimeout(300) // Wait for theme transition

  await expect(page).toHaveScreenshot('chat-dark.png')
})
```

## Configuration

### Playwright Config

Visual test settings in `playwright.config.ts`:

```typescript
export default defineConfig({
  // Screenshot comparison settings
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },

  // Update snapshots in CI
  updateSnapshots: process.env.CI ? 'none' : 'missing',
})
```

### Snapshot Options

```typescript
await expect(page).toHaveScreenshot('name.png', {
  // Full page screenshot
  fullPage: true,

  // Maximum acceptable different pixels
  maxDiffPixels: 100,

  // Maximum acceptable different pixel ratio (0-1)
  threshold: 0.2,

  // Clip to specific area
  clip: { x: 0, y: 0, width: 800, height: 600 },

  // Mask dynamic content
  mask: [page.locator('.timestamp')],

  // Animations: 'allow', 'disabled'
  animations: 'disabled',
})
```

## Best Practices

### 1. Mask Dynamic Content

```typescript
test('chat with masked timestamps', async ({ page }) => {
  await page.goto('/chat')

  await expect(page).toHaveScreenshot('chat.png', {
    mask: [
      page.locator('.timestamp'),
      page.locator('.online-status'),
      page.locator('[data-dynamic]'),
    ],
  })
})
```

### 2. Wait for Animations

```typescript
test('modal snapshot', async ({ page }) => {
  await page.goto('/chat')
  await page.locator('button:has-text("Settings")').click()

  // Wait for modal animation to complete
  await page.waitForTimeout(300)

  await expect(page).toHaveScreenshot('settings-modal.png', {
    animations: 'disabled',
  })
})
```

### 3. Stabilize Loading States

```typescript
test('loaded state', async ({ page }) => {
  await page.goto('/chat')

  // Wait for loading to complete
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('[data-testid="message-list"]')

  await expect(page).toHaveScreenshot('chat-loaded.png')
})
```

### 4. Test Multiple Viewports

```typescript
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
]

viewports.forEach(({ name, width, height }) => {
  test(`homepage ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')

    await expect(page).toHaveScreenshot(`homepage-${name}.png`)
  })
})
```

## Advanced: Percy Integration

[Percy](https://percy.io/) provides advanced visual testing with baseline management and visual review tools.

### Setup

```bash
# Install Percy
pnpm add -D @percy/cli @percy/playwright

# Set Percy token
export PERCY_TOKEN=your_token_here
```

### Usage

```bash
# Run tests with Percy
pnpm exec percy exec -- pnpm test:e2e
```

### Percy Snapshots

```typescript
import percySnapshot from '@percy/playwright'

test('percy snapshot', async ({ page }) => {
  await page.goto('/chat')
  await percySnapshot(page, 'Chat Page')
})
```

## Advanced: Chromatic Integration

[Chromatic](https://www.chromatic.com/) provides visual testing integrated with Storybook.

### Setup

```bash
# Install Chromatic
pnpm add -D chromatic

# Publish to Chromatic
pnpm exec chromatic --project-token=your_token_here
```

### CI Integration

Visual regression tests run automatically on pull requests. See `.github/workflows/visual-regression.yml`.

## Updating Snapshots

### When to Update

Update snapshots when:

- ✅ UI changes are intentional
- ✅ Design updates approved
- ✅ Component refactoring with same visual output

### How to Update

```bash
# Update all snapshots
pnpm exec playwright test e2e/visual-regression.spec.ts --update-snapshots

# Update specific test
pnpm exec playwright test e2e/visual-regression.spec.ts:10 --update-snapshots

# Review changes before committing
git diff e2e/__screenshots__/
```

### Review Process

1. Run tests locally first
2. Review snapshot diffs carefully
3. Commit updated snapshots
4. Include screenshot changes in PR description
5. Request visual review from team

## Troubleshooting

### Snapshots Differ Between Local and CI

**Causes**:

- Font rendering differences
- Timezone differences
- OS-specific rendering

**Solutions**:

- Use Playwright's `--update-snapshots` in CI once
- Increase `maxDiffPixels` threshold
- Mask problematic elements

### Flaky Visual Tests

**Causes**:

- Animations not disabled
- Dynamic content (timestamps, online status)
- Loading states

**Solutions**:

```typescript
await expect(page).toHaveScreenshot('page.png', {
  animations: 'disabled',
  mask: [page.locator('.dynamic-content')],
  maxDiffPixels: 200, // Allow small differences
})
```

### Large Snapshot Files

**Solutions**:

- Use `clip` to capture only relevant areas
- Test components instead of full pages
- Compress snapshots (Playwright does this automatically)

## Snapshot Management

### Naming Conventions

```
component-name-{variant}-{viewport}.png

Examples:
- button-primary.png
- chat-page-desktop.png
- modal-create-channel-dark.png
- sidebar-mobile.png
```

### Organization

```
e2e/
  __screenshots__/
    components/
      button-*.png
      modal-*.png
    pages/
      chat-*.png
      settings-*.png
    mobile/
      *.png
    tablet/
      *.png
```

## CI/CD Integration

Visual regression tests run on:

- ✅ Pull requests (blocks merge if tests fail)
- ✅ Main branch (updates baseline)

View results:

- Playwright HTML report in GitHub Actions artifacts
- Percy dashboard (if enabled)
- Chromatic dashboard (if enabled)

## Resources

- [Playwright Screenshots](https://playwright.dev/docs/screenshots)
- [Percy Documentation](https://docs.percy.io/)
- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [Visual Regression Testing Best Practices](https://applitools.com/blog/visual-testing-best-practices/)

## Questions?

- Check existing visual tests in `e2e/visual-regression.spec.ts`
- Review Playwright screenshot documentation
- Ask in team chat
