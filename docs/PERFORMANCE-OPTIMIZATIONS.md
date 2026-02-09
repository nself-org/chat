# Performance Optimizations Implementation Guide

**Version**: 0.9.1
**Date**: February 9, 2026
**Status**: Implementation Ready

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Lazy Loading](#lazy-loading)
3. [Code Splitting](#code-splitting)
4. [Bundle Optimization](#bundle-optimization)
5. [Runtime Performance](#runtime-performance)
6. [Database Optimization](#database-optimization)
7. [Monitoring](#monitoring)
8. [Checklist](#checklist)

---

## Quick Start

### Files Created

1. `/Users/admin/Sites/nself-chat/src/lib/performance/lazy-loader.ts` - Lazy loading utilities
2. `/Users/admin/Sites/nself-chat/src/lib/performance/performance-monitor.ts` - Performance monitoring
3. `/Users/admin/Sites/nself-chat/.lighthouserc.js` - Lighthouse CI configuration
4. `/Users/admin/Sites/nself-chat/scripts/analyze-bundle.ts` - Bundle analysis script
5. `/Users/admin/Sites/nself-chat/docs/PERFORMANCE-AUDIT.md` - Complete audit report
6. `/Users/admin/Sites/nself-chat/docs/BUNDLE-ANALYSIS.md` - Bundle size analysis

### Commands

```bash
# Analyze bundle sizes
pnpm build:analyze

# Run Lighthouse audit
pnpm lighthouse

# Generate bundle report
tsx scripts/analyze-bundle.ts

# Monitor performance in dev
# (automatically enabled via WebVitalsWrapper)
```

---

## 1. Lazy Loading

### 1.1 Heavy Components

Use the lazy loader utility for heavy components:

```typescript
import {
  LazyCallWindow,
  LazyAdminDashboard,
  LazyAnalyticsCharts,
  LazyRichTextEditor,
  LazyEmojiPicker,
} from '@/lib/performance/lazy-loader'

// Use in your component
function ChatPage() {
  const [showEditor, setShowEditor] = useState(false)

  return (
    <div>
      {showEditor ? (
        <LazyRichTextEditor />
      ) : (
        <button onClick={() => setShowEditor(true)}>
          Start editing
        </button>
      )}
    </div>
  )
}
```

### 1.2 Admin Routes - Recharts Lazy Loading

**Priority**: 🔴 High (300KB savings)

**File**: `/Users/admin/Sites/nself-chat/src/components/admin/analytics/charts.tsx`

```typescript
import { LazyAnalyticsCharts } from '@/lib/performance/lazy-loader'

export default function AdminAnalytics() {
  return (
    <div>
      <h1>Analytics Dashboard</h1>
      {/* Lazy load charts */}
      <LazyAnalyticsCharts />
    </div>
  )
}
```

### 1.3 Settings Pages - GDPR Tools

**Priority**: 🔴 High (150KB savings)

**File**: `/Users/admin/Sites/nself-chat/src/app/settings/privacy/gdpr/page.tsx`

```typescript
'use client'

import dynamic from 'next/dynamic'

const LazyGDPRTools = dynamic(
  () => import('@/components/settings/privacy/gdpr-tools'),
  {
    loading: () => <div className="animate-pulse">Loading GDPR tools...</div>,
    ssr: false,
  }
)

export default function GDPRSettings() {
  return (
    <div>
      <h1>GDPR & Data Privacy</h1>
      <LazyGDPRTools />
    </div>
  )
}
```

### 1.4 Message Editor

**Priority**: 🟡 Medium (150KB savings)

**File**: `/Users/admin/Sites/nself-chat/src/components/chat/message-input.tsx`

```typescript
import { useState } from 'react'
import { LazyRichTextEditor } from '@/lib/performance/lazy-loader'

export function MessageInput() {
  const [showRichEditor, setShowRichEditor] = useState(false)

  return (
    <div>
      {showRichEditor ? (
        <LazyRichTextEditor />
      ) : (
        <textarea
          onFocus={() => setShowRichEditor(true)}
          placeholder="Type a message..."
        />
      )}
    </div>
  )
}
```

### 1.5 Emoji Picker

**Priority**: 🟡 Medium (80KB savings)

```typescript
import { LazyEmojiPicker } from '@/lib/performance/lazy-loader'

function MessageActions() {
  const [showEmoji, setShowEmoji] = useState(false)

  return (
    <>
      <button onClick={() => setShowEmoji(true)}>😀</button>
      {showEmoji && <LazyEmojiPicker onEmojiClick={handleEmoji} />}
    </>
  )
}
```

### 1.6 Call Components

**Priority**: 🟡 Medium (400KB savings)

```typescript
import { LazyCallWindow } from '@/lib/performance/lazy-loader'

function Call({ callId }: { callId: string }) {
  return <LazyCallWindow callId={callId} />
}
```

---

## 2. Code Splitting

### 2.1 Route-Based Code Splitting

Next.js automatically code splits by route. Ensure each route is in its own file:

```
src/app/
├── admin/
│   ├── page.tsx          # Auto code split
│   ├── analytics/
│   │   └── page.tsx      # Auto code split
│   └── moderation/
│       └── page.tsx      # Auto code split
```

### 2.2 Component-Based Code Splitting

For shared components, use dynamic imports:

```typescript
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
})
```

### 2.3 Library Code Splitting

For large libraries used in specific features:

```typescript
// Don't import at top level
// import recharts from 'recharts'

// Import dynamically when needed
async function renderChart() {
  const { LineChart, Line, XAxis, YAxis } = await import('recharts')
  // Use chart components
}
```

---

## 3. Bundle Optimization

### 3.1 Package Import Optimization

Already configured in `next.config.js`:

```javascript
experimental: {
  optimizePackageImports: [
    'lucide-react',
    '@radix-ui/react-icons',
    // ... more packages
  ]
}
```

### 3.2 Tree Shaking

Ensure imports are tree-shakeable:

```typescript
// ✅ Good - tree-shakeable
import { Button } from '@/components/ui/button'

// ❌ Bad - imports entire module
import * as UI from '@/components/ui'
```

### 3.3 Remove Unused Dependencies

Run dependency analyzer:

```bash
npx depcheck
```

### 3.4 Analyze Bundle

Use the bundle analyzer:

```bash
ANALYZE=true pnpm build
```

This will open a visual bundle analyzer in your browser.

---

## 4. Runtime Performance

### 4.1 Use Performance Monitor

Enable automatic monitoring:

```typescript
import { startPerformanceMonitoring } from '@/lib/performance/performance-monitor'

// In _app.tsx or layout.tsx
useEffect(() => {
  const cleanup = startPerformanceMonitoring({
    memoryThreshold: 90,
    reportInterval: 60000,
    budgetCheck: true,
  })

  return cleanup
}, [])
```

### 4.2 Measure Critical Paths

```typescript
import { measureFunction } from '@/lib/performance/performance-monitor'

async function loadMessages() {
  return measureFunction('load-messages', async () => {
    const messages = await fetchMessages()
    return messages
  }, true) // true = log to console
}
```

### 4.3 Component Profiling

Use React Profiler:

```typescript
import { Profiler } from 'react'

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number
) {
  if (actualDuration > 16) { // Slower than 60fps
    console.warn(`Slow render: ${id} took ${actualDuration}ms`)
  }
}

function App() {
  return (
    <Profiler id="app" onRender={onRenderCallback}>
      <YourApp />
    </Profiler>
  )
}
```

### 4.4 Memoization

Use React.memo for expensive components:

```typescript
import { memo } from 'react'

const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // Expensive rendering logic
  return <div>{data}</div>
})

// Or with comparison function
const SmartComponent = memo(
  function SmartComponent({ id, data }) {
    return <div>{data}</div>
  },
  (prevProps, nextProps) => {
    // Only re-render if id changes
    return prevProps.id === nextProps.id
  }
)
```

### 4.5 useCallback and useMemo

```typescript
import { useCallback, useMemo } from 'react'

function MessageList({ messages }) {
  // Memoize expensive calculations
  const sortedMessages = useMemo(() => {
    return messages.sort((a, b) => b.timestamp - a.timestamp)
  }, [messages])

  // Memoize callbacks
  const handleClick = useCallback((id: string) => {
    console.log('Clicked:', id)
  }, [])

  return (
    <div>
      {sortedMessages.map(msg => (
        <Message key={msg.id} onClick={handleClick} />
      ))}
    </div>
  )
}
```

---

## 5. Database Optimization

### 5.1 Use Query Optimizer

Already available at `/Users/admin/Sites/nself-chat/src/lib/database/query-optimizer.ts`

```typescript
import { optimizeQuery } from '@/lib/database/query-optimizer'

const optimized = await optimizeQuery(yourQuery)
```

### 5.2 DataLoader for N+1 Queries

Install and use DataLoader (already in dependencies):

```typescript
import DataLoader from 'dataloader'

const userLoader = new DataLoader(async (ids: string[]) => {
  const users = await db.users.findMany({
    where: { id: { in: ids } }
  })
  // Return in same order as ids
  return ids.map(id => users.find(u => u.id === id))
})

// Use in resolvers
const user = await userLoader.load(userId)
```

### 5.3 Index Optimization

Check slow queries:

```sql
-- PostgreSQL
SELECT * FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

Add indexes for slow queries:

```sql
CREATE INDEX idx_messages_channel_timestamp
ON nchat_messages(channel_id, created_at DESC);
```

---

## 6. Monitoring

### 6.1 Web Vitals

Already enabled in layout:

```typescript
<WebVitalsWrapper
  enabled={true}
  providers={process.env.NODE_ENV === 'production' ? ['sentry'] : ['console']}
  sampleRate={1.0}
/>
```

### 6.2 Sentry Performance

Already configured. Verify environment variables:

```bash
# .env.local
NEXT_PUBLIC_SENTRY_DSN=your_dsn_here
SENTRY_AUTH_TOKEN=your_token_here
```

### 6.3 Lighthouse CI

Run automated Lighthouse audits:

```bash
pnpm lighthouse:collect  # Collect metrics
pnpm lighthouse:assert   # Check budgets
pnpm lighthouse:upload   # Upload results
```

### 6.4 Custom Metrics

Log custom metrics to Sentry:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.setMeasurement('message_load_time', duration, 'millisecond')
```

### 6.5 Performance Dashboard

View metrics in:
- Sentry Performance Dashboard
- Lighthouse CI reports
- Browser DevTools Performance tab

---

## 7. Checklist

### Immediate (This Week)

- [x] Create lazy-loader utility
- [x] Create performance-monitor utility
- [x] Configure Lighthouse CI
- [x] Create bundle analysis script
- [ ] Lazy load Recharts in admin
- [ ] Lazy load GDPR tools
- [ ] Lazy load TipTap editor
- [ ] Lazy load emoji picker

### Short Term (This Month)

- [ ] Code split admin routes
- [ ] Code split settings routes
- [ ] Implement DataLoader for GraphQL
- [ ] Add bundle size checks to CI/CD
- [ ] Set up performance alerts
- [ ] Optimize provider tree
- [ ] Implement service worker

### Long Term (This Quarter)

- [ ] Regular performance audits
- [ ] Performance budgets enforcement
- [ ] Advanced caching strategies
- [ ] Edge function optimization
- [ ] CDN configuration
- [ ] Image optimization pipeline

---

## 8. Performance Targets

### Bundle Sizes

| Resource | Current | Target | Priority |
|----------|---------|--------|----------|
| Shared Bundle | 103 KB | < 150 KB | ✅ Met |
| Public Pages | 104-221 KB | < 250 KB | ✅ Met |
| Chat Pages | 200-284 KB | < 300 KB | ✅ Met |
| Settings Pages | 466-478 KB | < 300 KB | 🔴 High |
| Admin Pages | 164-415 KB | < 350 KB | 🟡 Medium |

### Runtime Metrics

| Metric | Target | Status |
|--------|--------|--------|
| LCP | < 2.5s | ✅ Monitored |
| FID | < 100ms | ✅ Monitored |
| CLS | < 0.1 | ✅ Monitored |
| TTI | < 3.5s | 🟡 Measure |
| FCP | < 1.8s | ✅ Monitored |

---

## 9. Resources

### Documentation

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Tools

- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

### Internal Files

- `/Users/admin/Sites/nself-chat/docs/PERFORMANCE-AUDIT.md` - Complete audit
- `/Users/admin/Sites/nself-chat/docs/BUNDLE-ANALYSIS.md` - Bundle analysis
- `/Users/admin/Sites/nself-chat/src/lib/performance/lazy-loader.ts` - Lazy loading
- `/Users/admin/Sites/nself-chat/src/lib/performance/performance-monitor.ts` - Monitoring
- `/Users/admin/Sites/nself-chat/.lighthouserc.js` - Lighthouse config

---

**Last Updated**: February 9, 2026
**Next Review**: March 9, 2026
