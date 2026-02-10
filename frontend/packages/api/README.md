# @nself-chat/api

> Typed API clients and GraphQL contracts for nself-chat

This package provides the complete API layer for communicating with the nself backend (Hasura GraphQL + Auth + Storage).

## Features

- ✅ **Apollo Client** - Fully configured with WebSocket support for real-time subscriptions
- ✅ **Type Safety** - Comprehensive TypeScript types for all API operations
- ✅ **GraphQL Operations** - 31 pre-built queries, mutations, and subscriptions
- ✅ **Error Handling** - Smart error transformation and user-friendly messages
- ✅ **Retry Logic** - Exponential backoff with configurable retry strategies
- ✅ **Helper Utilities** - Pagination, filtering, sorting, and data transformation
- ✅ **Server-Side Support** - Separate Apollo Client for API routes with admin access

## Installation

This package is part of the nself-chat monorepo and is not published separately.

```bash
# Install from workspace
pnpm add @nself-chat/api
```

## Usage

### Apollo Client

```typescript
import { apolloClient, getApolloClient } from '@nself-chat/api'

// Use the singleton client
const client = getApolloClient()

// Execute a query
const { data } = await client.query({
  query: GET_USER_QUERY,
  variables: { id: 'user-id' },
})
```

### Server-Side Operations

```typescript
import { getServerApolloClient } from '@nself-chat/api'

// In API routes or server components
const serverClient = getServerApolloClient()

// Has admin access via Hasura admin secret
const { data } = await serverClient.query({
  query: ADMIN_QUERY,
})
```

### Error Handling

```typescript
import { transformApolloError, getUserFriendlyMessage } from '@nself-chat/api'

try {
  await client.mutate({ mutation: UPDATE_USER })
} catch (error) {
  const apiError = transformApolloError(error)
  const message = getUserFriendlyMessage(apiError)
  console.error(message) // User-friendly error message
}
```

### Retry Logic

```typescript
import { retryWithBackoff } from '@nself-chat/api'

const result = await retryWithBackoff(
  async () => {
    return await fetch('/api/endpoint')
  },
  {
    maxAttempts: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
  }
)
```

### Query Builders

```typescript
import { buildQueryArgs } from '@nself-chat/api'

const args = buildQueryArgs({
  pagination: { page: 2, perPage: 20 },
  filters: [{ field: 'status', operator: 'eq', value: 'active' }],
  sorts: [{ field: 'created_at', direction: 'DESC' }],
})

// Use with Hasura queries
const { data } = await client.query({
  query: GET_MESSAGES_QUERY,
  variables: args,
})
```

## GraphQL Operations

The package includes 31 GraphQL operations organized by feature area:

### Queries (14)
- User queries (admin panel)
- App/integration queries
- Command queries
- Message history queries
- Notification settings queries
- Meeting queries
- Onboarding queries
- Pinned content queries
- Presence queries
- Saved messages queries
- Settings queries
- DM queries
- Location queries
- Disappearing messages queries

### Mutations (13)
- User mutations (admin)
- App mutations
- Command mutations
- DM mutations
- Location mutations
- Meeting mutations
- Notification settings mutations
- Onboarding mutations
- Pinned content mutations
- Presence mutations
- Saved messages mutations
- Settings mutations
- Disappearing messages mutations

### Subscriptions (3)
- DM subscriptions (real-time messages)
- Location subscriptions (real-time location tracking)
- Presence subscriptions (user presence updates)

### Fragments (1)
- Tenant branding schema

## Type Definitions

### API Response Types

```typescript
import type { APIResponse, APISuccessResponse, APIErrorResponse } from '@nself-chat/api'

// Generic API response
const response: APIResponse<User> = {
  success: true,
  data: { id: '1', name: 'John' },
}

// Success response (narrowed type)
const success: APISuccessResponse<User> = {
  success: true,
  data: { id: '1', name: 'John' },
}

// Error response
const error: APIErrorResponse = {
  success: false,
  error: {
    code: 'NOT_FOUND',
    status: 404,
    message: 'User not found',
    retry: { retryable: false },
  },
}
```

### GraphQL Types

```typescript
import type {
  GraphQLQuery,
  GraphQLMutation,
  GraphQLSubscription,
  HasuraQueryArgs,
} from '@nself-chat/api'

// Query with variables and data types
const query: GraphQLQuery<{ id: string }, { user: User }> = {
  type: 'query',
  document: GET_USER_QUERY,
  operationName: 'GetUser',
}

// Hasura query arguments
const args: HasuraQueryArgs<Message> = {
  where: { channel_id: { _eq: 'channel-123' } },
  order_by: { created_at: 'desc' },
  limit: 50,
  offset: 0,
}
```

## Utilities

### Pagination

```typescript
import { buildPaginationArgs, buildPaginationParams } from '@nself-chat/api'

// Build Hasura arguments
const hasuraArgs = buildPaginationArgs({ page: 2, perPage: 20 })
// => { limit: 20, offset: 20 }

// Build URL parameters
const urlParams = buildPaginationParams({ page: 2, perPage: 20 })
// => URLSearchParams { page: '2', perPage: '20' }
```

### Validation

```typescript
import { isValidUUID, isValidEmail, sanitizeInput } from '@nself-chat/api'

isValidUUID('123e4567-e89b-42d3-a456-426614174000') // => true
isValidEmail('user@example.com') // => true
sanitizeInput('user"input') // => 'user\\"input'
```

### Data Transformation

```typescript
import { extractCount, extractAffectedRows, extractReturning } from '@nself-chat/api'

// Extract count from Hasura aggregate
const count = extractCount(data.messages_aggregate) // => 42

// Extract affected rows from mutation
const affectedRows = extractAffectedRows(result) // => 5

// Extract returning data from mutation
const users = extractReturning(result) // => [{ id: '1', ... }]
```

## Error Codes

The package defines comprehensive error codes:

### Client Errors (4xx)
- `BAD_REQUEST` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `METHOD_NOT_ALLOWED` (405)
- `CONFLICT` (409)
- `GONE` (410)
- `UNPROCESSABLE_ENTITY` (422)
- `TOO_MANY_REQUESTS` (429)

### Server Errors (5xx)
- `INTERNAL_ERROR` (500)
- `NOT_IMPLEMENTED` (501)
- `SERVICE_UNAVAILABLE` (503)
- `GATEWAY_TIMEOUT` (504)

### Custom Errors
- `VALIDATION_ERROR`
- `AUTHENTICATION_ERROR`
- `AUTHORIZATION_ERROR`
- `RATE_LIMIT_ERROR`
- `RESOURCE_EXHAUSTED`
- `INVALID_INPUT`
- `DUPLICATE_ENTRY`
- `DEPENDENCY_ERROR`
- `NETWORK_ERROR`
- `TIMEOUT_ERROR`
- `UNKNOWN_ERROR`

## WebSocket Management

```typescript
import {
  closeWebSocketConnection,
  reconnectWebSocket,
  apolloClient,
} from '@nself-chat/api'

// Close WebSocket on logout
function handleLogout() {
  closeWebSocketConnection()
  apolloClient.clearStore()
}

// Reconnect with fresh token on login
function handleLogin(token: string) {
  localStorage.setItem('token', token)
  reconnectWebSocket()
}
```

## Cache Management

```typescript
import { clearCache, resetClient, refetchQueries } from '@nself-chat/api'

// Clear cache only
await clearCache()

// Reset cache + links
await resetClient()

// Refetch all active queries
await refetchQueries()
```

## Environment Variables

The package reads the following environment variables:

### Client-Side (NEXT_PUBLIC_*)

- `NEXT_PUBLIC_GRAPHQL_URL` - GraphQL HTTP endpoint (default: `http://localhost:1337/v1/graphql`)
- `NEXT_PUBLIC_NHOST_GRAPHQL_URL` - Alternative GraphQL URL (Nhost format)
- `NEXT_PUBLIC_GRAPHQL_WS_URL` - GraphQL WebSocket endpoint (auto-generated from HTTP URL)

### Server-Side

- `HASURA_ADMIN_SECRET` - Admin secret for server-side operations

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type check
pnpm type-check
```

## Building

```bash
# Build package
pnpm build

# Watch mode for development
pnpm dev
```

## Architecture

```
src/
├── clients/        # Apollo Client configuration
│   └── apollo.ts   # Client + Server Apollo instances
├── graphql/        # GraphQL operations
│   ├── queries/    # 14 query files
│   ├── mutations/  # 13 mutation files
│   ├── subscriptions/ # 3 subscription files
│   ├── fragments/  # 1 fragment file
│   └── generated/  # Generated TypeScript types (via codegen)
├── types/          # TypeScript type definitions
│   ├── api.ts      # API response/error types
│   └── graphql.ts  # GraphQL-specific types
├── utils/          # Utility functions
│   ├── error-handler.ts  # Error transformation
│   ├── retry.ts    # Retry logic
│   └── helpers.ts  # General helpers
├── __tests__/      # Test suite
│   ├── types.test.ts
│   ├── error-handler.test.ts
│   ├── retry.test.ts
│   └── helpers.test.ts
└── index.ts        # Main barrel export
```

## Contributing

When adding new GraphQL operations:

1. Add `.graphql` file to appropriate directory (queries/mutations/subscriptions)
2. Run `pnpm codegen` to generate TypeScript types
3. Export from `src/graphql/index.ts`
4. Add tests for new operations

## License

MIT - Part of the nself-chat project

## Links

- [nself-chat Documentation](../../docs/)
- [GraphQL Code Generator](https://the-guild.dev/graphql/codegen)
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [Hasura Docs](https://hasura.io/docs/latest/index/)
