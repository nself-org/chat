# Error Handling Guide

Comprehensive guide to error handling in nself-chat.

## Table of Contents

1. [Overview](#overview)
2. [Error Types](#error-types)
3. [Error Handler](#error-handler)
4. [Retry Logic](#retry-logic)
5. [Error Boundary](#error-boundary)
6. [Error Toasts](#error-toasts)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)

## Overview

The nself-chat error handling system provides:

- **Typed Errors**: Strongly-typed error classes with context
- **Centralized Handling**: Single point for error processing
- **Retry Logic**: Exponential backoff with circuit breaker
- **Error Boundary**: React error boundaries for component errors
- **User Notifications**: Toast notifications with retry actions
- **Sentry Integration**: Automatic error reporting
- **Offline Support**: Queue operations when offline

## Error Types

### Error Categories

```typescript
enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  CLIENT = 'client',
  GRAPHQL = 'graphql',
  UPLOAD = 'upload',
  OFFLINE = 'offline',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}
```

### Error Severity

```typescript
enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}
```

### Base Error Class

```typescript
class AppError extends Error {
  category: ErrorCategory
  severity: ErrorSeverity
  context: ErrorContext
  timestamp: Date
  userMessage: string
  isRetryable: boolean
  shouldReport: boolean
}
```

### Specific Error Classes

- `NetworkError` - Network connection errors
- `AuthenticationError` - Authentication failures
- `AuthorizationError` - Permission denied
- `ValidationError` - Invalid input
- `NotFoundError` - Resource not found
- `RateLimitError` - Rate limit exceeded
- `ServerError` - Server errors (5xx)
- `ClientError` - Client errors (4xx)
- `GraphQLErrorClass` - GraphQL errors
- `UploadError` - File upload failures
- `OfflineError` - Offline status
- `TimeoutError` - Request timeouts

## Error Handler

### Basic Usage

```typescript
import { handleError } from '@/lib/errors'

try {
  await someOperation()
} catch (error) {
  await handleError(error)
}
```

### With Options

```typescript
await handleError(error, {
  showToast: true,
  toastDuration: 5000,
  reportToSentry: true,
  allowRetry: true,
  onRetry: async () => {
    await someOperation()
  },
  context: {
    userId: user.id,
    operation: 'send_message',
  },
})
```

### Silent Handling

```typescript
import { handleErrorSilent } from '@/lib/errors'

await handleErrorSilent(error, { userId: user.id })
```

### With Retry

```typescript
import { handleErrorWithRetry } from '@/lib/errors'

await handleErrorWithRetry(error, async () => {
  await retryOperation()
})
```

## Retry Logic

### Basic Retry

```typescript
import { withRetry } from '@/lib/errors'

const result = await withRetry(async () => {
  return await fetchData()
})
```

### Custom Retry Configuration

```typescript
import { RetryManager } from '@/lib/errors'

const retryManager = new RetryManager({
  maxAttempts: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  useJitter: true,
  onRetry: (attempt, error, delayMs) => {
    console.log(`Retry attempt ${attempt}, waiting ${delayMs}ms`)
  },
})

const result = await retryManager.execute(async () => {
  return await fetchData()
})
```

### Retry Presets

```typescript
// Aggressive retry (5 attempts, short delays)
import { withAggressiveRetry } from '@/lib/errors'
await withAggressiveRetry(() => fetchData())

// Conservative retry (2 attempts, long delays)
import { withConservativeRetry } from '@/lib/errors'
await withConservativeRetry(() => fetchData())
```

### Circuit Breaker

The retry manager includes a circuit breaker pattern:

- **Closed**: Normal operation
- **Open**: Too many failures, reject requests
- **Half-Open**: Testing if service recovered

```typescript
const retryManager = new RetryManager({
  useCircuitBreaker: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetTimeMs: 60000,
})

// Check circuit state
const state = retryManager.getCircuitState()
```

## Error Boundary

### App Level

Wrap entire app for global error handling:

```tsx
import { AppErrorBoundary } from '@/components/errors'

function App() {
  return (
    <AppErrorBoundary>
      <YourApp />
    </AppErrorBoundary>
  )
}
```

### Page Level

Wrap individual pages:

```tsx
import { PageErrorBoundary } from '@/components/errors'

function Page() {
  return (
    <PageErrorBoundary>
      <YourPage />
    </PageErrorBoundary>
  )
}
```

### Section Level

Wrap sections of a page:

```tsx
import { SectionErrorBoundary } from '@/components/errors'

function Section() {
  return (
    <SectionErrorBoundary>
      <YourSection />
    </SectionErrorBoundary>
  )
}
```

### Component Level

Wrap individual components:

```tsx
import { ComponentErrorBoundary } from '@/components/errors'

function Component() {
  return (
    <ComponentErrorBoundary>
      <YourComponent />
    </ComponentErrorBoundary>
  )
}
```

### Custom Fallback

```tsx
import { ErrorBoundary, type ErrorFallbackProps } from '@/components/errors'

function CustomFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div>
      <h1>Oops!</h1>
      <p>{error.userMessage}</p>
      <button onClick={resetError}>Try Again</button>
    </div>
  )
}

function Component() {
  return (
    <ErrorBoundary fallback={CustomFallback}>
      <YourComponent />
    </ErrorBoundary>
  )
}
```

## Error Toasts

### Using Error Toast Hook

```tsx
import { useErrorToast } from '@/components/errors'

function Component() {
  const errorToast = useErrorToast()

  const handleAction = async () => {
    try {
      await someOperation()
    } catch (error) {
      errorToast.showError(parseError(error), {
        allowRetry: true,
        onRetry: handleAction,
      })
    }
  }
}
```

### Specific Error Toasts

```typescript
import {
  showNetworkErrorToast,
  showUploadErrorToast,
  showSendErrorToast,
  showSaveErrorToast,
  showOfflineToast,
  showQueuedToast,
  showTimeoutErrorToast,
  showServerErrorToast,
  showAuthErrorToast,
  showPermissionErrorToast,
  showNotFoundErrorToast,
  showRateLimitErrorToast,
} from '@/components/errors'

// Network error
showNetworkErrorToast('Connection lost', async () => {
  await retry()
})

// Upload error
showUploadErrorToast('document.pdf', async () => {
  await retryUpload()
})

// Send error
showSendErrorToast(async () => {
  await retrySend()
})

// Save error
showSaveErrorToast('settings', async () => {
  await retrySave()
})

// Offline
showOfflineToast(true) // queued = true

// Queued operation
showQueuedToast('Send message', 3)

// Timeout
showTimeoutErrorToast(async () => {
  await retry()
})

// Server error
showServerErrorToast(async () => {
  await retry()
})

// Auth error
showAuthErrorToast()

// Permission error
showPermissionErrorToast('delete messages')

// Not found
showNotFoundErrorToast('Channel')

// Rate limit
showRateLimitErrorToast(30) // retry after 30 seconds
```

## Usage Examples

### GraphQL Mutation with Error Handling

```typescript
import { handleGraphQLError } from '@/lib/errors'
import { useMutation } from '@apollo/client'

function useCreateChannel() {
  const [createChannel, { loading }] = useMutation(CREATE_CHANNEL_MUTATION)

  const execute = async (name: string) => {
    try {
      const result = await createChannel({ variables: { name } })
      return result.data
    } catch (error) {
      await handleGraphQLError(error, 'create_channel', { name })
      throw error
    }
  }

  return { execute, loading }
}
```

### File Upload with Retry

```typescript
import { handleUploadError } from '@/lib/errors'
import { withRetry } from '@/lib/errors'

async function uploadFile(file: File) {
  try {
    const result = await withRetry(async () => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      return await response.json()
    })

    return result
  } catch (error) {
    await handleUploadError(error, file, async () => {
      await uploadFile(file)
    })
    throw error
  }
}
```

### Network Request with Timeout

```typescript
import { withRetry, TimeoutError } from '@/lib/errors'

async function fetchWithTimeout(url: string, timeoutMs = 30000) {
  return withRetry(async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeout)

      if (error.name === 'AbortError') {
        throw new TimeoutError('Request timed out', timeoutMs)
      }

      throw error
    }
  })
}
```

### Offline Queue

```typescript
import { offlineQueue } from '@/lib/errors'
import { showQueuedToast } from '@/components/errors'

async function sendMessage(message: string) {
  if (!navigator.onLine) {
    const id = offlineQueue.enqueue(async () => {
      await sendMessageToServer(message)
    }, 'Send message')

    showQueuedToast('Message', offlineQueue.size())
    return
  }

  await sendMessageToServer(message)
}
```

### React Component with Full Error Handling

```tsx
import { useState } from 'react'
import { ComponentErrorBoundary } from '@/components/errors'
import { handleError, withRetry } from '@/lib/errors'
import { useErrorToast } from '@/components/errors'

function MessageForm() {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const errorToast = useErrorToast()

  const handleSend = async () => {
    setSending(true)

    try {
      await withRetry(async () => {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        })

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        return await response.json()
      })

      setMessage('')
    } catch (error) {
      await handleError(error, {
        allowRetry: true,
        onRetry: handleSend,
        context: {
          operation: 'send_message',
          messageLength: message.length,
        },
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <ComponentErrorBoundary>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
      >
        <input value={message} onChange={(e) => setMessage(e.target.value)} disabled={sending} />
        <button type="submit" disabled={sending}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </ComponentErrorBoundary>
  )
}
```

## Best Practices

### 1. Use Specific Error Types

```typescript
// Good
throw new ValidationError('Email is required')

// Bad
throw new Error('Email is required')
```

### 2. Add Context

```typescript
// Good
await handleError(error, {
  context: {
    userId: user.id,
    channelId: channel.id,
    operation: 'send_message',
  },
})

// Bad
await handleError(error)
```

### 3. Choose Appropriate Retry Strategy

```typescript
// For critical operations
await withAggressiveRetry(() => saveData())

// For background tasks
await withConservativeRetry(() => syncData())
```

### 4. Handle Offline Gracefully

```typescript
if (!navigator.onLine) {
  offlineQueue.enqueue(() => operation(), 'Operation name')
  showOfflineToast(true)
  return
}

await operation()
```

### 5. Use Error Boundaries

```tsx
// Wrap at appropriate levels
<AppErrorBoundary>
  <PageErrorBoundary>
    <SectionErrorBoundary>
      <ComponentErrorBoundary>
        <Component />
      </ComponentErrorBoundary>
    </SectionErrorBoundary>
  </PageErrorBoundary>
</AppErrorBoundary>
```

### 6. Don't Over-Report

```typescript
// Good - report only important errors
await handleError(error, {
  reportToSentry: error.severity >= ErrorSeverity.MEDIUM,
})

// Bad - report everything
await handleError(error, { reportToSentry: true })
```

### 7. Provide User-Friendly Messages

```typescript
// Good
new ValidationError('Please enter a valid email address')

// Bad
new ValidationError('INVALID_EMAIL_FORMAT')
```

### 8. Test Error Scenarios

```typescript
// Test network errors
test('handles network error', async () => {
  mockFetch.mockRejectedValue(new NetworkError('Connection failed'))
  await expect(fetchData()).rejects.toThrow(NetworkError)
})

// Test retry logic
test('retries failed requests', async () => {
  mockFetch
    .mockRejectedValueOnce(new Error('Fail 1'))
    .mockRejectedValueOnce(new Error('Fail 2'))
    .mockResolvedValueOnce({ data: 'success' })

  const result = await withRetry(() => mockFetch())
  expect(result.data).toBe('success')
})
```

## Advanced Topics

### Custom Error Classes

```typescript
import { AppError, ErrorCategory, ErrorSeverity } from '@/lib/errors'

class ChannelNotFoundError extends AppError {
  constructor(channelId: string) {
    super(`Channel ${channelId} not found`, ErrorCategory.NOT_FOUND, {
      severity: ErrorSeverity.LOW,
      userMessage: 'The channel you are looking for does not exist.',
      isRetryable: false,
      context: { channelId },
    })
    this.name = 'ChannelNotFoundError'
  }
}
```

### Error Middleware

```typescript
import { errorHandler } from '@/lib/errors'

export async function apiErrorMiddleware(error: unknown, req: Request): Promise<Response> {
  const appError = parseError(error)

  await errorHandler.handle(appError, {
    showToast: false,
    context: {
      path: req.url,
      method: req.method,
    },
  })

  return new Response(
    JSON.stringify({
      error: appError.userMessage,
      code: appError.context.errorCode,
    }),
    {
      status: appError.context.statusCode || 500,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
```

### Error Metrics

```typescript
import { errorHandler } from '@/lib/errors'

// Get error statistics
const stats = errorHandler.getErrorStats()
console.log('Error count:', stats.errorCount)
console.log('Error timestamps:', stats.errorTimestamps)

// Clear tracking data
errorHandler.clearTracking()
```

## Troubleshooting

### Errors Not Showing Toasts

Check that toast provider is mounted:

```tsx
import { Toaster } from '@/components/ui/toaster'

function App() {
  return (
    <>
      <YourApp />
      <Toaster />
    </>
  )
}
```

### Errors Not Reported to Sentry

Check Sentry configuration:

```typescript
// .env.local
NEXT_PUBLIC_SENTRY_DSN = your - dsn - here
```

### Circuit Breaker Always Open

Adjust threshold or reset time:

```typescript
const retryManager = new RetryManager({
  circuitBreakerThreshold: 10, // Increase threshold
  circuitBreakerResetTimeMs: 30000, // Reduce reset time
})
```

### Too Many Retries

Reduce retry attempts or increase delays:

```typescript
const retryManager = new RetryManager({
  maxAttempts: 2,
  initialDelayMs: 5000,
})
```

## Summary

The nself-chat error handling system provides:

✅ **Typed Errors** - Strong typing with context
✅ **Centralized Handling** - Single point of control
✅ **Retry Logic** - Exponential backoff + circuit breaker
✅ **Error Boundaries** - React component error catching
✅ **User Notifications** - Toast notifications with retry
✅ **Sentry Integration** - Automatic error reporting
✅ **Offline Support** - Queue operations when offline
✅ **Production Ready** - Battle-tested patterns

For more information, see the source code in:

- `/src/lib/errors/` - Error handling utilities
- `/src/components/errors/` - Error UI components
