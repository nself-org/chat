# Testing Guide

Comprehensive guide for writing and running tests in the nself-chat project.

## Table of Contents

- [Overview](#overview)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The nself-chat project uses a comprehensive testing strategy with three layers:

1. **Unit Tests** - Test individual components, hooks, and utilities in isolation
2. **Integration Tests** - Test API routes and component interactions
3. **End-to-End (E2E) Tests** - Test complete user flows in a browser

### Tech Stack

- **Unit/Integration**: Jest + React Testing Library
- **E2E**: Playwright
- **Coverage**: Jest Coverage Reports
- **CI/CD**: GitHub Actions

## Test Types

### Unit Tests

Unit tests verify individual components, functions, and modules work correctly in isolation.

**Location**: `src/**/__tests__/*.test.{ts,tsx}`

**Examples**:

- `src/components/ui/__tests__/button.test.tsx`
- `src/hooks/__tests__/use-messages.test.ts`
- `src/lib/__tests__/utils.test.ts`

**When to write**:

- Testing UI components
- Testing custom hooks
- Testing utility functions
- Testing data transformations

### Integration Tests

Integration tests verify multiple units work together correctly.

**Location**: `src/__tests__/integration/*.test.{ts,tsx}`

**Examples**:

- `src/__tests__/integration/chat-flow.test.tsx`
- `src/app/api/__tests__/config.test.ts`

**When to write**:

- Testing API routes
- Testing complex component interactions
- Testing data flow between components
- Testing authentication flows

### E2E Tests

E2E tests verify complete user workflows in a real browser.

**Location**: `e2e/*.spec.ts`

**Examples**:

- `e2e/auth.spec.ts`
- `e2e/chat.spec.ts`
- `e2e/message-sending.spec.ts`

**When to write**:

- Testing critical user journeys
- Testing multi-page workflows
- Testing real browser interactions
- Testing responsive behavior

## Running Tests

### Quick Commands

```bash
# Run all tests
pnpm test:all

# Run unit tests only
pnpm test

# Run unit tests in watch mode
pnpm test:watch

# Run unit tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode (interactive)
pnpm test:e2e:ui

# Run specific test file
pnpm test src/hooks/__tests__/use-messages.test.ts

# Run tests matching pattern
pnpm test --testNamePattern="should send message"
```

### Advanced Usage

```bash
# Run tests in a specific directory
pnpm test src/components/chat/__tests__/

# Update snapshots
pnpm test -u

# Run tests in parallel
pnpm test --maxWorkers=4

# Run tests with verbose output
pnpm test --verbose

# Run E2E tests in specific browser
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit

# Run E2E tests in headed mode (see browser)
pnpm test:e2e --headed

# Run E2E tests with debugging
pnpm test:e2e --debug
```

### CI/CD

Tests run automatically on:

- Every push to any branch
- Every pull request
- Before deployments

View test results in GitHub Actions under the "CI" workflow.

## Writing Tests

### Unit Test Example

```typescript
/**
 * Component Test Example
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../button'

describe('Button Component', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByText('Click me')).toBeDisabled()
  })
})
```

### Hook Test Example

```typescript
/**
 * Hook Test Example
 */
import { renderHook, waitFor } from '@testing-library/react'
import { useMessages } from '../use-messages'

describe('useMessages Hook', () => {
  it('should fetch messages for a channel', async () => {
    const { result } = renderHook(() => useMessages('channel-1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.messages).toBeDefined()
  })
})
```

### Integration Test Example

```typescript
/**
 * Integration Test Example
 */
import { NextRequest } from 'next/server'
import { GET } from '../api/config/route'

describe('GET /api/config', () => {
  it('should return app configuration', async () => {
    const request = new NextRequest('http://localhost:3000/api/config')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('branding')
    expect(data).toHaveProperty('theme')
  })
})
```

### E2E Test Example

```typescript
/**
 * E2E Test Example
 */
import { test, expect } from '@playwright/test'

test.describe('Message Sending', () => {
  test('should send a message', async ({ page }) => {
    await page.goto('/chat/general')

    const input = page.locator('[data-testid="message-input"]')
    await input.fill('Hello, world!')
    await input.press('Enter')

    await expect(page.locator('text=Hello, world!')).toBeVisible()
  })
})
```

## Test Coverage

### Viewing Coverage

```bash
# Generate coverage report
pnpm test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Goals

We aim for:

- **80%+ overall coverage**
- **90%+ coverage for critical paths**:
  - Authentication
  - Message sending/receiving
  - Channel management
  - User management

### What to Cover

**High Priority**:

- ✅ User authentication and authorization
- ✅ Message CRUD operations
- ✅ Channel CRUD operations
- ✅ Real-time features (typing, presence)
- ✅ File uploads
- ✅ Search functionality

**Medium Priority**:

- ✅ UI components
- ✅ Utility functions
- ✅ Data transformations
- ✅ Form validations

**Lower Priority**:

- ✅ Styling and animations
- ✅ Static pages
- ✅ Documentation pages

## Best Practices

### General Guidelines

1. **Test Behavior, Not Implementation**

   ```typescript
   // ❌ Bad - Testing implementation details
   expect(component.state.count).toBe(5)

   // ✅ Good - Testing user-visible behavior
   expect(screen.getByText('Count: 5')).toBeInTheDocument()
   ```

2. **Use Descriptive Test Names**

   ```typescript
   // ❌ Bad
   it('works', () => {})

   // ✅ Good
   it('should display error message when login fails', () => {})
   ```

3. **Arrange-Act-Assert Pattern**

   ```typescript
   it('should increment counter', () => {
     // Arrange
     render(<Counter />)

     // Act
     fireEvent.click(screen.getByText('Increment'))

     // Assert
     expect(screen.getByText('Count: 1')).toBeInTheDocument()
   })
   ```

4. **Clean Up After Tests**
   ```typescript
   afterEach(() => {
     jest.clearAllMocks()
     cleanup()
   })
   ```

### Component Testing

1. **Test User Interactions**

   ```typescript
   it('should submit form when enter is pressed', async () => {
     const onSubmit = jest.fn()
     render(<Form onSubmit={onSubmit} />)

     await userEvent.type(screen.getByRole('textbox'), 'Test{Enter}')
     expect(onSubmit).toHaveBeenCalled()
   })
   ```

2. **Test Accessibility**

   ```typescript
   it('should have accessible label', () => {
     render(<Input label="Email" />)
     expect(screen.getByLabelText('Email')).toBeInTheDocument()
   })
   ```

3. **Test Error States**
   ```typescript
   it('should show error message for invalid input', () => {
     render(<Form />)
     fireEvent.submit(screen.getByRole('form'))
     expect(screen.getByText('Email is required')).toBeInTheDocument()
   })
   ```

### Hook Testing

1. **Use renderHook**

   ```typescript
   const { result } = renderHook(() => useCustomHook())
   expect(result.current.value).toBe(initialValue)
   ```

2. **Test Async Hooks**

   ```typescript
   const { result } = renderHook(() => useAsync())
   await waitFor(() => {
     expect(result.current.loading).toBe(false)
   })
   ```

3. **Test Hook Updates**

   ```typescript
   const { result, rerender } = renderHook(({ id }) => useData(id), { initialProps: { id: 1 } })

   rerender({ id: 2 })
   expect(result.current.data.id).toBe(2)
   ```

### E2E Testing

1. **Wait for Elements**

   ```typescript
   // ✅ Good
   await expect(page.locator('text=Success')).toBeVisible({ timeout: 5000 })

   // ❌ Bad
   await page.waitForTimeout(5000)
   ```

2. **Use Data Test IDs**

   ```typescript
   // Component
   <button data-testid="submit-button">Submit</button>

   // Test
   await page.locator('[data-testid="submit-button"]').click()
   ```

3. **Test Mobile Viewports**
   ```typescript
   test('should work on mobile', async ({ page }) => {
     await page.setViewportSize({ width: 375, height: 667 })
     await page.goto('/chat')
     // Test mobile-specific behavior
   })
   ```

## Test Fixtures

Use the provided test fixtures for consistent test data:

```typescript
import { createMockMessage, mockUsers } from '@/__tests__/fixtures/messages'
import { renderWithProviders } from '@/__tests__/utils/test-helpers'

// Create test data
const message = createMockMessage({
  content: 'Test message',
  userId: mockUsers.alice.id,
})

// Render with providers
renderWithProviders(<MessageList messages={[message]} />)
```

## Troubleshooting

### Common Issues

#### Tests Timeout

```bash
# Increase timeout
pnpm test --testTimeout=10000
```

#### E2E Tests Fail Locally

```bash
# Install Playwright browsers
pnpm exec playwright install --with-deps
```

#### Module Not Found

```bash
# Clear Jest cache
pnpm test --clearCache
```

#### Tests Pass Locally But Fail in CI

- Check environment variables
- Verify dependencies are installed
- Check for timing issues (add proper waits)
- Review CI logs for specific errors

### Debugging

#### Debug Unit Tests

```bash
# Add debugger statement
it('test', () => {
  debugger
  expect(true).toBe(true)
})

# Run with --inspect-brk
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### Debug E2E Tests

```bash
# Run in headed mode with debugger
pnpm test:e2e --debug

# Take screenshots on failure (automatic in CI)
await page.screenshot({ path: 'debug.png' })

# Pause execution
await page.pause()
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contributing

When adding new features:

1. ✅ Write tests first (TDD approach)
2. ✅ Aim for 80%+ coverage
3. ✅ Test happy paths and error cases
4. ✅ Add E2E tests for critical flows
5. ✅ Update this guide if needed

## Questions?

- Check existing tests for examples
- Ask in the team chat
- Review the [Testing Library docs](https://testing-library.com/)
