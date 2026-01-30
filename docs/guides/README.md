# ɳChat Utilities Documentation

Complete guide to the utility libraries, hooks, and systems available in ɳChat.

## Table of Contents

- [Environment Management](#environment-management)
- [Logging](#logging)
- [Error Handling](#error-handling)
- [Performance Monitoring](#performance-monitoring)
- [API Utilities](#api-utilities)
- [Feature Flags](#feature-flags)
- [Storage](#storage)
- [Hooks](#hooks)

---

## Environment Management

### Location
- `src/lib/env/validation.ts` - Environment variable validation
- `src/lib/env/index.ts` - Environment utilities
- `scripts/validate-env.ts` - CLI validation script

### Features
- Zod-based schema validation
- Type-safe environment access
- Production readiness checks
- Health checks
- Helpful error messages

### Usage

```typescript
import { getPublicEnv, isDevelopment, isProduction } from '@/lib/env'

// Get validated environment
const env = getPublicEnv()
console.log(env.NEXT_PUBLIC_APP_NAME) // Type-safe!

// Environment checks
if (isDevelopment()) {
  // Development-only code
}

// Health check
import { checkEnvHealth } from '@/lib/env'
const { healthy, issues } = checkEnvHealth()
if (!healthy) {
  console.error('Environment issues:', issues)
}
```

### CLI Validation

```bash
# Validate environment
pnpm validate:env

# Check production readiness
pnpm validate:env:prod
```

---

## Logging

### Location
- `src/lib/logger/index.ts`

### Features
- Structured logging with context
- Multiple log levels (debug, info, warn, error)
- Pretty printing in development, JSON in production
- Function timing utilities
- Error tracking integration placeholder

### Usage

```typescript
import { logger, timeAsync, createLogger } from '@/lib/logger'

// Basic logging
logger.info('User logged in', { userId: '123' })
logger.error('Failed to save', error, { operation: 'save-user' })

// Time async operations
const data = await timeAsync('fetchData', async () => {
  return await fetch('/api/data')
}, { userId: '123' })

// Create contextual logger
const userLogger = createLogger({ userId: '123', module: 'auth' })
userLogger.info('Password changed')
```

---

## Error Handling

### Location
- `src/components/error-boundary.tsx`

### Features
- React Error Boundary component
- Fallback UI with retry
- Error hooks for async errors
- Development error details
- Automatic error logging

### Usage

```tsx
import { ErrorBoundary, useAsyncError } from '@/components/error-boundary'

// Wrap components
function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  )
}

// Custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <Component />
</ErrorBoundary>

// Throw async errors
function Component() {
  const throwError = useAsyncError()

  const handleClick = async () => {
    try {
      await riskyOperation()
    } catch (error) {
      throwError(error) // Will be caught by ErrorBoundary
    }
  }
}
```

---

## Performance Monitoring

### Location
- `src/hooks/use-performance.ts`

### Features
- Render counting and timing
- Re-render debugging
- Component mount timing
- Debounce and throttle
- Memory leak detection
- Intersection observer performance

### Usage

```tsx
import {
  useRenderCount,
  useWhyDidYouUpdate,
  usePerformanceMetrics,
  useDebounce,
  useThrottle,
  useMemoryLeakDetector
} from '@/hooks/use-performance'

function MyComponent(props) {
  // Track renders
  const renderCount = useRenderCount()

  // Debug re-renders
  useWhyDidYouUpdate('MyComponent', props)

  // Get metrics
  const metrics = usePerformanceMetrics('MyComponent')
  // metrics.renderCount, metrics.averageRenderTime, etc.

  // Debounce search
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // Throttle scroll
  const [scrollY, setScrollY] = useState(0)
  const throttledScrollY = useThrottle(scrollY, 100)

  // Detect memory leaks
  useMemoryLeakDetector('MyComponent')

  return <div>Rendered {renderCount} times</div>
}
```

---

## API Utilities

### Location
- `src/lib/api/retry.ts`

### Features
- Exponential backoff with jitter
- Configurable retry logic
- Circuit breaker pattern
- Specialized fetch/GraphQL retry
- Automatic error detection

### Usage

```typescript
import {
  retryAsync,
  retryFetch,
  retryGraphQL,
  CircuitBreaker
} from '@/lib/api/retry'

// Basic retry
const data = await retryAsync(
  () => fetch('/api/data'),
  {
    maxRetries: 3,
    initialDelay: 1000,
    onRetry: (error, attempt) => {
      console.log(`Retry ${attempt}:`, error)
    }
  }
)

// Retry fetch with smart defaults
const response = await retryFetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'John' })
})

// Retry GraphQL
const result = await retryGraphQL<UsersQuery>(
  'query { users { id name } }',
  { limit: 10 }
)

// Circuit breaker
const breaker = new CircuitBreaker(5, 60000) // 5 failures, 60s timeout

try {
  const data = await breaker.execute(() => fetch('/api/data'))
} catch (error) {
  if (error.message === 'Circuit breaker is OPEN') {
    // Handle circuit open
  }
}
```

---

## Feature Flags

### Location
- `src/lib/features/flags.ts`

### Features
- Toggle features without deployment
- Environment-based flags
- Role-based access
- Percentage rollouts
- User whitelist
- LocalStorage overrides

### Usage

```typescript
import {
  isFeatureEnabled,
  featureFlags,
  getEnabledFeatures
} from '@/lib/features/flags'

// Check if feature enabled
if (isFeatureEnabled('video_calls')) {
  // Show video call UI
}

// Check with user context
const enabled = isFeatureEnabled('analytics_dashboard', {
  userId: '123',
  role: 'admin'
})

// Override for testing
featureFlags.override('ai_assistant', true)

// Get all enabled features
const features = getEnabledFeatures({ userId: '123', role: 'member' })
// ['message_reactions', 'polls', 'scheduled_messages', ...]
```

### Available Flags

**Experimental**: `voice_messages`, `video_calls`, `screen_sharing`, `ai_assistant`, `crypto_wallet`, `nft_avatars`

**Beta**: `advanced_search`, `message_reactions`, `custom_emojis`, `polls`, `scheduled_messages`, `message_forwarding`

**Admin**: `analytics_dashboard`, `audit_logs`, `advanced_moderation`, `custom_integrations`

**Performance**: `lazy_load_messages`, `virtual_scrolling`, `image_optimization`, `web_workers`

**Development**: `debug_mode`, `performance_monitoring`, `error_logging`

---

## Storage

### Location
- `src/lib/storage/local-storage.ts`

### Features
- Type-safe localStorage access
- TTL (time-to-live) support
- Automatic serialization
- Error handling
- Multi-tab sync
- React hooks

### Usage

```typescript
import {
  storage,
  useLocalStorage,
  useExpiringStorage
} from '@/lib/storage/local-storage'

// Direct API
storage.set('user', { name: 'John', age: 30 })
const user = storage.get<User>('user')
storage.remove('user')

// With TTL
storage.set('session', sessionData, { ttl: 3600000 }) // 1 hour

// React hook
function Component() {
  const [theme, setTheme] = useLocalStorage('theme', 'dark')

  return (
    <button onClick={() => setTheme('light')}>
      Current: {theme}
    </button>
  )
}

// Expiring storage hook
function CachedData() {
  const [data, setData] = useExpiringStorage(
    'api-cache',
    null,
    300000 // 5 minutes
  )

  useEffect(() => {
    if (!data) {
      fetchData().then(setData)
    }
  }, [data])
}
```

---

## Hooks

### Network Detection

```typescript
import {
  useOnline,
  useConnectionQuality,
  useIsSlowConnection
} from '@/hooks/use-online'

function NetworkStatus() {
  const isOnline = useOnline({
    onOffline: () => toast.error('You are offline'),
    onOnline: () => toast.success('Back online')
  })

  const { effectiveType, downlink } = useConnectionQuality()
  const isSlowConnection = useIsSlowConnection()

  return (
    <div>
      Status: {isOnline ? 'Online' : 'Offline'}
      Connection: {effectiveType} ({downlink} Mbps)
      {isSlowConnection && <div>Slow connection detected</div>}
    </div>
  )
}
```

---

## Best Practices

### Environment Variables
1. Always validate environment variables at startup
2. Use `getPublicEnv()` instead of accessing `process.env` directly
3. Run `pnpm validate:env:prod` before production deployment

### Logging
1. Use structured logging with context
2. Log at appropriate levels (debug, info, warn, error)
3. Never log sensitive information (passwords, tokens, etc.)
4. Use `timeAsync` to measure performance-critical operations

### Error Handling
1. Wrap app root in `<ErrorBoundary>`
2. Use `useAsyncError` for throwing async errors
3. Provide user-friendly error messages
4. Log errors for debugging

### Performance
1. Use `useDebounce` for search inputs
2. Use `useThrottle` for scroll handlers
3. Monitor render counts with `useRenderCount`
4. Debug re-renders with `useWhyDidYouUpdate`

### API Calls
1. Use `retryFetch` for all API calls
2. Implement circuit breakers for critical services
3. Handle network errors gracefully
4. Show loading and error states

### Feature Flags
1. Use feature flags for gradual rollouts
2. Test new features with percentage rollouts
3. Gate risky features behind flags
4. Clean up old flags after rollout

### Storage
1. Use type-safe storage wrappers
2. Set appropriate TTLs for cached data
3. Handle storage quota errors
4. Clean up expired data regularly

---

## Testing

### Environment Validation
```bash
pnpm validate:env
```

### Feature Flags
```typescript
// In tests
import { featureFlags } from '@/lib/features/flags'

beforeEach(() => {
  featureFlags.override('my_feature', true)
})

afterEach(() => {
  featureFlags.clearAllOverrides()
})
```

### Logging
```typescript
// Mock logger in tests
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    // ...
  }
}))
```

---

## Migration Guide

### From console.log to logger
```diff
- console.log('User logged in', userId)
+ logger.info('User logged in', { userId })

- console.error('Failed', error)
+ logger.error('Failed', error, { context })
```

### From direct localStorage to wrapper
```diff
- localStorage.setItem('key', JSON.stringify(value))
+ storage.set('key', value)

- const value = JSON.parse(localStorage.getItem('key') || 'null')
+ const value = storage.get<Type>('key')
```

### From fetch to retryFetch
```diff
- const response = await fetch('/api/data')
+ const response = await retryFetch('/api/data', {}, {
+   maxRetries: 3
+ })
```

---

## Performance Tips

1. **Lazy load heavy features** behind feature flags
2. **Use debounce/throttle** for expensive operations
3. **Monitor render counts** in development
4. **Cache API responses** with TTL storage
5. **Implement circuit breakers** for external services

---

## Troubleshooting

### Environment validation fails
- Check `.env.local` file exists
- Verify all required variables are set
- Run `pnpm validate:env` for details

### Feature flags not working
- Check user context is set: `featureFlags.setUserContext(userId, role)`
- Verify environment matches flag requirements
- Check browser console for flag state

### Storage quota exceeded
- Clear old data: `storage.cleanup()`
- Reduce TTL for cached data
- Consider using IndexedDB for large data

### Retry exhausted
- Check network connectivity
- Verify API endpoint is accessible
- Increase `maxRetries` if needed
- Check circuit breaker state

---

## Related Documentation

- [API Documentation](../API.md)
- [Configuration Guide](../CONFIGURATION.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Contributing Guidelines](../../CONTRIBUTING.md)

---

**Need Help?**

- Check the [FAQ](../FAQ.md)
- Open a [Discussion](https://github.com/acamarata/nself-chat/discussions)
- Report a [Bug](https://github.com/acamarata/nself-chat/issues/new?template=bug_report.yml)
