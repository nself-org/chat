/\*\*

- E2E Tests README
-
- Comprehensive E2E test suite for nself-chat application using Playwright.
  \*/

# E2E Test Suite

This directory contains end-to-end tests for the nself-chat application using Playwright.

## Structure

```
e2e/
├── fixtures/
│   ├── page-objects.ts      # Reusable page object models
│   └── test-fixtures.ts     # Test fixtures and helpers
├── global.setup.ts          # Global test setup
├── auth.spec.ts             # Authentication tests
├── chat.spec.ts             # Chat functionality tests
├── calls.spec.ts            # Voice/video call tests
├── wallet.spec.ts           # Crypto wallet tests
├── advanced-messaging.spec.ts # Advanced messaging tests
├── settings.spec.ts         # Settings tests
├── admin.spec.ts            # Admin dashboard tests
├── setup-wizard.spec.ts     # Setup wizard tests
├── payments.spec.ts         # Payment tests
├── search.spec.ts           # Search tests
├── bots.spec.ts             # Bot SDK tests
├── offline.spec.ts          # Offline functionality tests
├── i18n.spec.ts             # Internationalization tests
└── accessibility.spec.ts    # Accessibility tests
```

## Page Objects

Page objects provide a clean abstraction layer for interacting with UI elements:

### Available Page Objects

- **BasePage**: Base class with common functionality
- **CallPage**: Voice/video call interactions
- **WalletPage**: Crypto wallet operations
- **AdvancedMessagingPage**: Polls, scheduled messages, reactions
- **SettingsPage**: User settings management

### Example Usage

```typescript
import { test, expect } from './fixtures/test-fixtures'

test('should start voice call', async ({ callPage, authenticatedPage }) => {
  await authenticatedPage.goto('/chat/dm/alice')
  await callPage.startVoiceCall()
  await expect(callPage.callPanel).toBeVisible()
})
```

## Test Fixtures

Fixtures provide reusable test setup and utilities:

### Authentication Fixtures

- `authenticatedPage`: Automatically logs in as owner user
- `loggedInUser`: Specify which test user to log in as

### Helper Functions

- `login(page, user)`: Log in as specific user
- `logout(page)`: Log out current user
- `navigateToChannel(page, channelName)`: Navigate to channel
- `navigateToDM(page, userName)`: Navigate to DM
- `sendMessage(page, message)`: Send a message
- `waitForToast(page, message?)`: Wait for toast notification
- `grantPermissions(context, permissions)`: Grant browser permissions
- `mockMetaMaskProvider(page)`: Mock MetaMask for wallet tests

### Test Data

- `TEST_USERS`: Predefined test users (owner, admin, member, etc.)
- `TEST_WALLET_DATA`: Wallet addresses and chains
- `TEST_MESSAGES`: Common test messages

### Example Usage

```typescript
import { test, expect, login, sendMessage, TEST_USERS } from './fixtures/test-fixtures'

test('should send message', async ({ page }) => {
  await login(page, 'alice')
  await sendMessage(page, 'Hello world')
  await expect(page.locator('text=Hello world')).toBeVisible()
})
```

## Running Tests

### Run all tests

```bash
pnpm test:e2e
```

### Run specific test file

```bash
pnpm test:e2e e2e/settings.spec.ts
```

### Run tests in headed mode (see browser)

```bash
pnpm test:e2e --headed
```

### Run tests in debug mode

```bash
pnpm test:e2e --debug
```

### Run tests in specific browser

```bash
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit
```

### Run tests on mobile viewport

```bash
pnpm test:e2e --project=mobile-chrome
```

### Generate test report

```bash
pnpm test:e2e --reporter=html
```

## Test Categories

### Authentication Tests (auth.spec.ts)

- Login/logout flows
- Protected routes
- Session persistence
- Role-based access

### Voice/Video Call Tests (calls.spec.ts)

- Starting voice/video calls
- Call controls (mute, camera, screen share)
- Call duration tracking
- Call history
- Call quality indicators

### Crypto Wallet Tests (wallet.spec.ts)

- Wallet connection (MetaMask, WalletConnect)
- Balance viewing
- Sending/receiving crypto
- Multi-chain support
- Transaction history
- Account switching

### Advanced Messaging Tests (advanced-messaging.spec.ts)

- Creating and voting on polls
- Scheduling messages
- Forwarding messages
- Emoji reactions
- Link previews
- Message translation

### Settings Tests (settings.spec.ts)

- Profile updates (name, bio, avatar)
- Account settings (email, password)
- Notification preferences
- Privacy settings
- Appearance customization (theme, language)
- Security settings (2FA, sessions)

### Chat Tests (chat.spec.ts)

- Sending/receiving messages
- Threads
- File uploads
- Mentions
- Message editing/deletion

### Admin Tests (admin.spec.ts)

- User management
- Channel management
- Role assignments
- Analytics dashboard

### Setup Wizard Tests (setup-wizard.spec.ts)

- First-run setup flow
- Branding configuration
- Feature toggles

## Best Practices

### 1. Use Page Objects

Always use page objects for UI interactions:

```typescript
// Good
await callPage.startVoiceCall()

// Bad
await page.click('[data-testid="voice-call-button"]')
```

### 2. Use Test Fixtures

Leverage fixtures for authentication and common setup:

```typescript
// Good
test('should update profile', async ({ authenticatedPage, settingsPage }) => {
  await settingsPage.updateProfile({ displayName: 'New Name' })
})

// Bad
test('should update profile', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'owner@nself.org')
  // ... login logic
})
```

### 3. Use data-testid Selectors

Prefer `data-testid` attributes for stable selectors:

```typescript
// Good
await page.locator('[data-testid="send-button"]').click()

// Avoid (brittle)
await page.locator('button.blue.rounded').click()
```

### 4. Wait for Network and State

Wait for proper states before assertions:

```typescript
await page.waitForLoadState('networkidle')
await expect(element).toBeVisible()
```

### 5. Use Proper Assertions

Use Playwright's async assertions:

```typescript
// Good
await expect(element).toBeVisible()
await expect(element).toHaveText('Hello')

// Bad
expect(await element.isVisible()).toBe(true)
```

### 6. Handle Flaky Tests

Add proper waits and retries for network-dependent operations:

```typescript
await expect(async () => {
  await page.reload()
  await expect(element).toBeVisible()
}).toPass({ timeout: 10000 })
```

### 7. Clean Up After Tests

Use fixtures for automatic cleanup:

```typescript
test.afterEach(async ({ page }) => {
  // Cleanup code here
})
```

## CI/CD Integration

Tests run automatically on:

- Pull requests
- Push to main branch
- Nightly builds

### CI Configuration

See `.github/workflows/ci.yml` for CI configuration.

### Skipping Tests in CI

Some tests may be skipped in CI if backend is not available:

```typescript
test.skip(!!process.env.CI && !process.env.BACKEND_AVAILABLE, 'Backend required')
```

## Debugging

### Visual Debugging

Run with `--headed` and `--debug`:

```bash
pnpm test:e2e --headed --debug
```

### Playwright Inspector

Use `page.pause()` to debug interactively:

```typescript
test('debug test', async ({ page }) => {
  await page.goto('/chat')
  await page.pause() // Opens Playwright Inspector
})
```

### Screenshots and Videos

Tests automatically capture:

- Screenshots on failure
- Videos on first retry
- Traces on first retry

View artifacts in `test-results/` and `playwright-report/`.

## Troubleshooting

### Tests fail with "Timeout"

- Increase timeout: `test.setTimeout(60000)`
- Check if dev server is running
- Check network conditions

### Tests fail with "Element not found"

- Use proper waits: `await page.waitForSelector()`
- Check if element uses different selector in dev mode
- Verify element exists in UI

### Tests pass locally but fail in CI

- Check for race conditions
- Verify env variables are set in CI
- Check if backend is available in CI

### Browser-specific failures

- Test in specific browser: `--project=firefox`
- Check for browser-specific APIs
- Verify polyfills are loaded

## Contributing

When adding new tests:

1. **Use existing page objects** or create new ones in `fixtures/page-objects.ts`
2. **Add test data** to `fixtures/test-fixtures.ts` if needed
3. **Follow naming conventions**: `describe` for features, `test` for behaviors
4. **Add data-testid** attributes to UI components for stable selectors
5. **Document complex tests** with comments
6. **Ensure tests are independent** and can run in any order
7. **Use proper waits** instead of hardcoded timeouts
8. **Test both happy and error paths**

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
