# Performance Optimization Guide

**Version**: 0.5.0
**Last Updated**: 2026-01-31
**Target**: Lighthouse 90+ scores across all metrics

---

## Table of Contents

1. [Overview](#overview)
2. [Bundle Size Optimization](#bundle-size-optimization)
3. [Image Optimization](#image-optimization)
4. [Database Query Optimization](#database-query-optimization)
5. [Performance Monitoring](#performance-monitoring)
6. [Code Splitting](#code-splitting)
7. [Caching Strategies](#caching-strategies)
8. [Runtime Performance](#runtime-performance)
9. [Monitoring & Debugging](#monitoring--debugging)
10. [Checklist](#performance-checklist)

---

## Overview

This guide provides comprehensive strategies for optimizing nself-chat performance across all aspects: bundle size, runtime performance, database queries, and user experience metrics (Core Web Vitals).

### Performance Goals

| Metric                         | Target | Current        | Status         |
| ------------------------------ | ------ | -------------- | -------------- |
| Lighthouse Performance         | ≥90    | TBD            | 🟡 In Progress |
| Lighthouse Accessibility       | ≥90    | TBD            | 🟡 In Progress |
| Lighthouse Best Practices      | ≥90    | TBD            | 🟡 In Progress |
| Lighthouse SEO                 | ≥90    | TBD            | 🟡 In Progress |
| First Contentful Paint (FCP)   | <1.8s  | TBD            | 🟡 In Progress |
| Largest Contentful Paint (LCP) | <2.5s  | TBD            | 🟡 In Progress |
| Cumulative Layout Shift (CLS)  | <0.1   | TBD            | 🟡 In Progress |
| Total Bundle Size              | <500KB | ~103KB initial | ✅ Good        |

---

## Bundle Size Optimization

### 1. Analyze Current Bundle

```bash
# Generate bundle analysis
pnpm build:analyze

# This opens an interactive treemap showing all chunks
```

**Key Findings** (as of 2026-01-31):

- Initial bundle: ~103KB (shared chunks)
- Largest route: `/chat/channel/[slug]` at 262KB (581KB total)
- Heavy dependencies identified:
  - recharts (~100KB) - Used only in admin
  - @tiptap/\* (~50KB) - Rich text editor
  - mediasoup (~40KB) - Video calls
  - @tensorflow/\* (~200KB+) - AI moderation

### 2. Dynamic Imports (Implemented)

All heavy components are now dynamically imported:

```typescript
// ✅ GOOD - Dynamic import with loading state
import dynamic from 'next/dynamic'
import { ChartSkeleton } from '@/components/ui/loading-skeletons'

const ActivityChart = dynamic(
  () => import('@/components/admin/activity-chart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Charts don't need SSR
  }
)

// ❌ BAD - Static import of heavy component
import { ActivityChart } from '@/components/admin/activity-chart'
```

**Centralized Dynamic Imports**: `/src/lib/performance/dynamic-imports.ts`

Components with dynamic imports:

- ✅ Admin dashboard charts (recharts)
- ✅ Rich text editor (TipTap)
- ✅ Video/audio calls (WebRTC stack)
- ✅ Emoji picker
- ✅ File uploader
- ✅ Thread panel (lazy loaded)
- ✅ Member list (lazy loaded)
- ✅ Swagger UI (API docs)

### 3. Package Optimization

**Configured in `next.config.js`**:

```javascript
experimental: {
  optimizePackageImports: [
    'lucide-react',        // Icon library - tree-shaking
    '@radix-ui/*',        // UI components
    'date-fns',           // Only import used functions
    'recharts',           // Chart library
    'framer-motion',      // Animation library
  ],
}
```

### 4. Webpack Chunk Splitting

**Implemented in `next.config.js`**:

```javascript
splitChunks: {
  cacheGroups: {
    framework: {
      test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
      name: 'framework',
      priority: 40,
    },
    ui: {
      test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
      name: 'ui',
      priority: 30,
    },
    graphql: {
      test: /[\\/]node_modules[\\/](@apollo|graphql)[\\/]/,
      name: 'graphql',
      priority: 25,
    },
    charts: {
      test: /[\\/]node_modules[\\/](recharts|d3-)[\\/]/,
      name: 'charts',
      priority: 20,
    },
    editor: {
      test: /[\\/]node_modules[\\/](@tiptap|prosemirror-)[\\/]/,
      name: 'editor',
      priority: 20,
    },
  },
}
```

### 5. Dependency Cleanup

**Unused Dependencies Identified**:

```json
{
  "to-remove": [
    "@hookform/resolvers", // Not used (using custom validation)
    "@noble/curves", // Unused crypto library
    "canvas", // Server-side only
    "dashjs", // Unused media library
    "simple-peer", // Using mediasoup instead
    "rxjs", // Not using observables
    "tippy.js" // Using Radix tooltips
  ]
}
```

**Missing Dependencies to Install**:

```bash
pnpm add web-vitals nanoid dataloader
```

---

## Image Optimization

### 1. Next.js Image Component

Always use `next/image` for automatic optimization:

```tsx
// ✅ GOOD
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  placeholder="blur"
  blurDataURL="data:image/svg+xml;base64,..."
  priority  // For LCP images
/>

// ❌ BAD
<img src="/logo.png" alt="Logo" />
```

### 2. Image Formats

**Configured in `next.config.js`**:

```javascript
images: {
  formats: ['image/avif', 'image/webp'],  // Modern formats
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60,
}
```

### 3. Avatar Optimization

User avatars are frequently loaded:

```tsx
<Avatar>
  <AvatarImage
    src={user.avatarUrl}
    alt={user.displayName}
    // Lazy load avatars below the fold
    loading="lazy"
  />
  <AvatarFallback>{user.displayName[0]}</AvatarFallback>
</Avatar>
```

### 4. Lazy Loading

Images below the fold should lazy load:

```tsx
<Image
  src="/screenshot.png"
  alt="Screenshot"
  width={800}
  height={600}
  loading="lazy" // Don't block initial render
/>
```

### 5. Responsive Images

Serve appropriately sized images:

```tsx
<Image
  src="/hero.jpg"
  alt="Hero"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

---

## Database Query Optimization

### 1. Indexes (Implemented)

**Migration**: `/.backend/migrations/014_performance_indexes.sql`

**Key Indexes Created**:

```sql
-- Most common query: Get channel messages
CREATE INDEX idx_messages_channel_created
ON nchat_messages(channel_id, created_at DESC);

-- User lookup (login)
CREATE UNIQUE INDEX idx_users_email
ON nchat_users(email)
WHERE deleted_at IS NULL;

-- Channel slug lookup (URLs)
CREATE UNIQUE INDEX idx_channels_slug
ON nchat_channels(slug)
WHERE deleted_at IS NULL;

-- Full-text search
CREATE INDEX idx_messages_content_search
ON nchat_messages USING GIN (to_tsvector('english', content));
```

**Partial Indexes** (reduce size, improve performance):

```sql
-- Only index recent messages (90 days)
CREATE INDEX idx_messages_recent
ON nchat_messages(channel_id, created_at DESC)
WHERE created_at > NOW() - INTERVAL '90 days';

-- Only index online users
CREATE INDEX idx_users_online
ON nchat_users(presence, last_seen_at DESC)
WHERE presence = 'online';
```

### 2. Query Batching (Implemented)

**DataLoader Pattern**: `/src/lib/performance/query-batching.ts`

```typescript
import { createUserLoader } from '@/lib/performance/query-batching'

const userLoader = createUserLoader(apolloClient)

// Instead of N queries
const users = await Promise.all(
  userIds.map((id) => client.query({ query: GET_USER, variables: { id } }))
)

// Batch into 1 query
const users = await userLoader.loadMany(userIds)
```

**Pre-configured Loaders**:

- `createUserLoader` - Batch user queries
- `createChannelLoader` - Batch channel queries
- `createMessageLoader` - Batch message queries

### 3. Optimized Fragments

Use minimal fragments for lists:

```graphql
# ✅ GOOD - Only fetch needed fields
fragment UserListItem on nchat_users {
  id
  username
  display_name
  avatar_url
  presence
}

# ❌ BAD - Over-fetching
fragment UserFull on nchat_users {
  id
  username
  display_name
  avatar_url
  email
  role
  presence
  created_at
  updated_at
  settings
  # ... 20+ more fields
}
```

### 4. Pagination

Always paginate large lists:

```graphql
query GetMessages($channelId: uuid!, $limit: Int!, $offset: Int!) {
  nchat_messages(
    where: { channel_id: { _eq: $channelId } }
    order_by: { created_at: desc }
    limit: $limit
    offset: $offset
  ) {
    ...MessageListItem
  }
}
```

### 5. Monitoring Query Performance

```sql
-- Check index usage
SELECT * FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index size
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## Performance Monitoring

### 1. Web Vitals Tracking (Implemented)

**Component**: `/src/lib/performance/web-vitals.tsx`

```tsx
import { WebVitalsTracker } from '@/lib/performance/web-vitals'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WebVitalsTracker
          enabled={true}
          providers={['console', 'sentry', 'ga4']}
          sampleRate={1.0} // 100% in dev, reduce in prod
          debug={process.env.NODE_ENV === 'development'}
        />
        {children}
      </body>
    </html>
  )
}
```

**Metrics Tracked**:

- ✅ Largest Contentful Paint (LCP)
- ✅ First Input Delay (FID)
- ✅ Cumulative Layout Shift (CLS)
- ✅ Interaction to Next Paint (INP)
- ✅ Time to First Byte (TTFB)
- ✅ First Contentful Paint (FCP)

### 2. Custom Performance Monitoring (Implemented)

**Utilities**: `/src/lib/performance/monitoring.ts`

```typescript
import { performanceMonitor, measureAsync } from '@/lib/performance/monitoring'

// Measure async operations
const messages = await measureAsync('api_get_messages', () => fetchMessages(channelId), {
  channelId,
})

// Measure component render
useEffect(() => {
  const cleanup = usePerformanceMonitor('MessageList')
  return cleanup
}, [])

// Track custom metrics
performanceMonitor.record('messages_loaded', messages.length, 'count')

// Get performance report
const report = performanceMonitor.export()
```

### 3. Performance Alerts

Automatic alerts for threshold violations:

```typescript
const THRESHOLDS = {
  page_load: { warning: 3000, critical: 5000 },
  api_call: { warning: 1000, critical: 3000 },
  lcp: { warning: 2500, critical: 4000 },
  // ... more thresholds
}
```

Alerts are sent to:

- Console (development)
- Sentry (production)
- Google Analytics (optional)
- Custom handlers

---

## Code Splitting

### 1. Route-based Splitting

Next.js automatically splits by route. Each page is a separate chunk.

**Current Split** (from build output):

- `/chat/channel/[slug]`: 262KB (largest)
- `/setup/[step]`: 52.1KB
- `/admin`: Dynamic loaded
- `/settings/*`: Individual chunks

### 2. Component-based Splitting

Use `dynamic()` for large components:

```typescript
// Heavy component - only load when needed
const VideoCall = dynamic(() => import('@/components/calls/video-call'), {
  ssr: false,
  loading: () => <div>Loading call interface...</div>
})
```

### 3. Library-based Splitting

Split large libraries into separate chunks (see webpack config above).

### 4. Preloading Critical Routes

```typescript
import { preloadCriticalComponents } from '@/lib/performance/dynamic-imports'

// Preload likely-needed components
useEffect(() => {
  if (user && user.role === 'admin') {
    preloadAdminComponents()
  }
}, [user])
```

---

## Caching Strategies

### 1. HTTP Caching

**Headers configured in `next.config.js`**:

```javascript
{
  source: '/_next/static/:path*',
  headers: [
    {
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable',
    },
  ],
}
```

### 2. Apollo Client Caching

```typescript
const apolloClient = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          nchat_messages: {
            // Merge paginated results
            keyArgs: ['where', 'order_by'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming]
            },
          },
        },
      },
    },
  }),
})
```

### 3. localStorage Caching

App config is cached in localStorage for instant startup:

```typescript
const config = localStorage.getItem('app-config')
if (config) {
  // Use cached config immediately
  setConfig(JSON.parse(config))
}

// Fetch latest in background
fetchLatestConfig().then(updateConfig)
```

### 4. Service Worker Caching (PWA)

```javascript
// public/service-worker.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/offline',
        '/manifest.json',
        // ... critical assets
      ])
    })
  )
})
```

---

## Runtime Performance

### 1. React Performance

**Memoization**:

```tsx
// Memoize expensive computations
const sortedMessages = useMemo(() => messages.sort((a, b) => a.createdAt - b.createdAt), [messages])

// Memoize callbacks
const handleSend = useCallback(
  (content: string) => {
    sendMessage(channelId, content)
  },
  [channelId]
)

// Memoize components
const MessageItem = memo(
  ({ message }) => {
    return <div>{message.content}</div>
  },
  (prev, next) => prev.message.id === next.message.id
)
```

**Virtual Scrolling**:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function MessageList({ messages }) {
  const parentRef = useRef()

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated message height
    overscan: 5, // Render 5 extra items
  })

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <MessageItem message={messages[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 2. Debouncing and Throttling

```typescript
import { debounce } from 'lodash'

// Debounce search input
const handleSearch = debounce((query: string) => {
  performSearch(query)
}, 300)

// Throttle scroll events
const handleScroll = throttle(() => {
  checkScrollPosition()
}, 100)
```

### 3. Lazy Loading

```tsx
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  )
}
```

---

## Monitoring & Debugging

### 1. Lighthouse CI

**Configuration**: `/.github/workflows/lighthouse-ci.yml`

```bash
# Run locally
pnpm lighthouse

# Collect only
pnpm lighthouse:collect

# Assert thresholds
pnpm lighthouse:assert

# Upload to server
pnpm lighthouse:upload
```

**Thresholds** (`.lighthouserc.json`):

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }]
      }
    }
  }
}
```

### 2. Bundle Analysis

```bash
# Generate bundle analysis
ANALYZE=true pnpm build

# Opens interactive visualization
```

### 3. Performance DevTools

**Chrome DevTools**:

1. Open DevTools (F12)
2. Performance tab
3. Click Record (⚫)
4. Perform actions
5. Stop recording
6. Analyze flame chart

**React DevTools Profiler**:

1. Install React DevTools extension
2. Click Profiler tab
3. Click Record (⚫)
4. Interact with app
5. Stop and analyze render times

### 4. Network Monitoring

```bash
# Check for slow requests in Chrome DevTools
# Network tab → Sort by Time
```

---

## Performance Checklist

### Bundle Size

- [x] Bundle analyzer configured
- [x] Dynamic imports for heavy components
- [x] Webpack chunk splitting optimized
- [ ] Remove unused dependencies
- [x] Package import optimization enabled
- [x] Tree shaking configured

### Images

- [ ] All images use Next.js `<Image>` component
- [ ] AVIF/WebP formats enabled
- [ ] Lazy loading for below-fold images
- [ ] Blur placeholders for key images
- [ ] Responsive image sizes configured
- [ ] Avatar optimization implemented

### Database

- [x] Indexes created for common queries
- [x] Query batching implemented (DataLoader)
- [x] Pagination on large lists
- [x] Optimized GraphQL fragments
- [x] Full-text search indexes
- [ ] Query performance monitoring

### Monitoring

- [x] Web Vitals tracking implemented
- [x] Performance monitoring utilities
- [x] Sentry integration for errors
- [ ] Lighthouse CI configured
- [x] Custom metric tracking
- [x] Performance alerts

### Runtime

- [ ] React.memo for expensive components
- [ ] useMemo for expensive computations
- [ ] useCallback for event handlers
- [ ] Virtual scrolling for long lists
- [ ] Debouncing for search inputs
- [ ] Lazy loading for modals/dialogs

### Caching

- [x] HTTP caching headers
- [x] Apollo Client cache configured
- [x] localStorage for app config
- [ ] Service Worker for offline support
- [ ] CDN for static assets

### Production

- [x] Console logs removed (except errors/warnings)
- [x] Source maps disabled in production
- [x] Compression enabled
- [x] Security headers configured
- [ ] Lighthouse scores 90+
- [ ] Performance budget defined

---

## Next Steps

1. **Run Lighthouse**: Get baseline scores
2. **Identify Bottlenecks**: Use Performance DevTools
3. **Implement Virtual Scrolling**: For message lists
4. **Optimize Images**: Convert to WebP/AVIF
5. **Remove Unused Dependencies**: Clean up package.json
6. **Setup Lighthouse CI**: Automate performance testing
7. **Monitor Production**: Track real user metrics

---

## Resources

- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

---

## Performance Budget

| Resource             | Budget  | Current | Status |
| -------------------- | ------- | ------- | ------ |
| JavaScript (initial) | < 200KB | 103KB   | ✅     |
| JavaScript (route)   | < 300KB | 262KB   | ⚠️     |
| CSS                  | < 50KB  | TBD     | 🟡     |
| Images (page)        | < 500KB | TBD     | 🟡     |
| Fonts                | < 100KB | ~50KB   | ✅     |
| Total (initial)      | < 500KB | ~153KB  | ✅     |

---

**Last Updated**: 2026-01-31
**Next Review**: Weekly during optimization sprint
**Owner**: Development Team
