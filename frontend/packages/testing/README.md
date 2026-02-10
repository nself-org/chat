# @nself-chat/testing

Shared testing utilities, fixtures, and mocks for nself-chat.

## Features

- **🎯 Deterministic Test Data**: Fixed IDs, predictable timestamps, no randomness
- **🔧 Flake Reduction**: Reliable test utilities with retry logic and proper cleanup
- **🎭 Complete Mocks**: ESM packages, API, auth, browser APIs
- **✅ Custom Matchers**: Domain-specific Jest matchers
- **🏭 Factory Functions**: Easy creation of test users, channels, messages
- **📦 Pre-built Fixtures**: Common test scenarios ready to use

## Installation

This package is part of the nself-chat monorepo and is automatically available to all workspace packages.

```bash
pnpm add -D @nself-chat/testing
```

## Quick Start

```typescript
import { setupTesting, resetAllTestState, createUser, fixtures } from '@nself-chat/testing'

describe('MyComponent', () => {
  beforeAll(() => {
    setupTesting() // Registers matchers and mocks
  })

  beforeEach(() => {
    resetAllTestState() // Clean state between tests
  })

  it('works with test data', () => {
    const user = createUser({ role: 'admin' })
    expect(user).toBeValidUser()
    expect(user).toHavePermission('manage_users')
  })
})
```

## Factories

Create test data with deterministic IDs:

```typescript
import { createUser, createChannel, createMessage } from '@nself-chat/testing'

// Create a user
const user = createUser({
  username: 'alice',
  role: 'admin',
})

// Create a channel
const channel = createChannel({
  name: 'general',
  type: 'public',
})

// Create a message
const message = createMessage({
  content: 'Hello world',
  userId: user.id,
  channelId: channel.id,
})
```

## Fixtures

Use pre-built test scenarios:

```typescript
import { fixtures, createActiveWorkspaceFixture } from '@nself-chat/testing'

// Use predefined data
const alice = fixtures.users.alice
const general = fixtures.channels.general

// Create a complete workspace
const workspace = createActiveWorkspaceFixture()
// Returns: { users, channels, messages }
```

## Mocks

### ESM Package Mocks

```typescript
// In jest.config.js
module.exports = {
  moduleNameMapper: {
    '^uuid$': '@nself-chat/testing/mocks/esm/uuid',
    '^nanoid$': '@nself-chat/testing/mocks/esm/nanoid',
    '^marked$': '@nself-chat/testing/mocks/esm/marked',
  },
}
```

### Browser API Mocks

```typescript
import { setupAllBrowserMocks, mockFetch, mockWebSocket } from '@nself-chat/testing'

// Setup all mocks at once
setupAllBrowserMocks()

// Or setup individual mocks
mockFetch()
mockWebSocket()
```

## Custom Matchers

```typescript
import { registerCustomMatchers } from '@nself-chat/testing'

beforeAll(() => {
  registerCustomMatchers()
})

it('validates data', () => {
  expect(user).toBeValidUser()
  expect(channel).toBeValidChannel()
  expect(message).toBeValidMessage()
  expect(user).toHavePermission('manage_users')
  expect(user).toBeOnline()
})
```

## Documentation

For complete API documentation, see the inline JSDoc comments or visit the [Testing Guide](../../docs/testing.md).

## Best Practices

1. **Deterministic Data**: Always use factories for predictable IDs and timestamps
2. **Reset State**: Call `resetAllTestState()` in `beforeEach`
3. **Use Fixtures**: Prefer fixtures over manual test data creation
4. **Mock Appropriately**: Mock at the right abstraction level

## License

MIT
