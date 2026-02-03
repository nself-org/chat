# Performance Monitoring

Complete guide to the performance monitoring system in nself-chat.

## Table of Contents

1. [Overview](#overview)
2. [Web Vitals Tracking](#web-vitals-tracking)
3. [Custom Metrics](#custom-metrics)
4. [Performance Hooks](#performance-hooks)
5. [Admin Dashboard](#admin-dashboard)
6. [API Integration](#api-integration)
7. [Best Practices](#best-practices)

---

## Overview

The performance monitoring system provides comprehensive tracking of:

- **Web Vitals**: LCP, CLS, TTFB, FCP, INP (FID deprecated)
- **Custom Metrics**: API response times, WebSocket latency, render times, memory usage
- **Warnings**: Automatic detection of performance issues
- **Analytics**: Statistical analysis and trend detection
- **Sentry Integration**: Metrics sent to Sentry for long-term tracking

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Performance Monitor                       │
│  - Web Vitals Collection                                     │
│  - Custom Metrics Recording                                  │
│  - Warning Detection                                         │
│  - LocalStorage Persistence                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌────────────────┐  ┌──────────────┐  ┌──────────────┐
│  React Hooks   │  │    Sentry    │  │ Admin Panel  │
│  - usePerf...  │  │  - Metrics   │  │  - Dashboard │
│  - useRender   │  │  - Tracking  │  │  - Charts    │
└────────────────┘  └──────────────┘  └──────────────┘
```

---

## Web Vitals Tracking

### Automatic Collection

Web Vitals are automatically collected on every page load:

```typescript
// Automatically tracked:
// - LCP (Largest Contentful Paint)
// - FID (First Input Delay)
// - CLS (Cumulative Layout Shift)
// - TTFB (Time to First Byte)
// - FCP (First Contentful Paint)
// - INP (Interaction to Next Paint)
```

### Thresholds

| Metric | Good    | Needs Improvement | Poor    |
| ------ | ------- | ----------------- | ------- |
| LCP    | ≤2500ms | ≤4000ms           | >4000ms |
| FID    | ≤100ms  | ≤300ms            | >300ms  |
| CLS    | ≤0.1    | ≤0.25             | >0.25   |
| TTFB   | ≤800ms  | ≤1800ms           | >1800ms |
| FCP    | ≤1800ms | ≤3000ms           | >3000ms |
| INP    | ≤200ms  | ≤500ms            | >500ms  |

### Ratings

Each metric receives a rating:

- **Good**: Green, score 90-100
- **Needs Improvement**: Yellow, score 50-89
- **Poor**: Red, score 0-49

---

## Custom Metrics

### Recording Custom Metrics

```typescript
import { performanceMonitor } from '@/lib/performance/monitor'

// Record a custom metric
performanceMonitor.recordCustomMetric({
  name: 'api-response-time',
  value: 250,
  unit: 'ms',
  tags: {
    endpoint: '/api/messages',
    method: 'POST',
  },
})
```

### Built-in Custom Metrics

#### API Response Time

```typescript
import { useApiPerformance } from '@/hooks/use-performance'

function MyComponent() {
  const { recordApiCall } = useApiPerformance()

  const fetchData = async () => {
    const start = performance.now()
    try {
      const response = await fetch('/api/data')
      const duration = performance.now() - start
      recordApiCall('/api/data', duration, response.ok)
    } catch (error) {
      const duration = performance.now() - start
      recordApiCall('/api/data', duration, false)
    }
  }
}
```

#### WebSocket Latency

```typescript
import { useWebSocketPerformance } from '@/hooks/use-performance'

function WebSocketComponent() {
  const { recordLatency, recordMessage } = useWebSocketPerformance()

  const sendMessage = (message: string) => {
    const start = performance.now()

    socket.emit('message', message, () => {
      const latency = performance.now() - start
      recordLatency(latency)
    })

    recordMessage('sent', message.length)
  }
}
```

#### Render Performance

```typescript
import { useRenderPerformance } from '@/hooks/use-performance';

function MyComponent() {
  const { renderCount } = useRenderPerformance('MyComponent');

  return <div>Rendered {renderCount} times</div>;
}
```

#### Memory Usage

```typescript
// Automatically tracked every 10 seconds
// No manual code required
```

---

## Performance Hooks

### usePerformance

Main hook for accessing all performance data:

```typescript
import { usePerformance } from '@/hooks/use-performance';

function PerformanceDashboard() {
  const {
    snapshot,      // Current performance snapshot
    score,         // Performance scores
    metrics,       // Web Vitals metrics
    customMetrics, // Custom metrics
    warnings,      // Performance warnings
    stats,         // Statistical analysis
    trends,        // Trend analysis
    refresh,       // Manual refresh
    reset,         // Reset all data
    clearWarning,  // Clear a warning
    clearAllWarnings,
    recordCustomMetric,
  } = usePerformance();

  return (
    <div>
      <h1>Performance Score: {score.overall}</h1>
      <p>LCP: {snapshot.webVitals.lcp}ms</p>
      <p>API Avg: {stats.apiResponseTime.avg}ms</p>
    </div>
  );
}
```

### usePerformanceWarnings

Specialized hook for monitoring warnings:

```typescript
import { usePerformanceWarnings } from '@/hooks/use-performance';

function WarningsBanner() {
  const {
    warnings,
    criticalWarnings,
    activeWarnings,
    clearWarning,
    clearAllWarnings,
  } = usePerformanceWarnings();

  if (activeWarnings.length === 0) return null;

  return (
    <div className="warnings">
      {activeWarnings.map((warning) => (
        <div key={warning.id} className={warning.severity}>
          <p>{warning.message}</p>
          <button onClick={() => clearWarning(warning.id)}>Dismiss</button>
        </div>
      ))}
    </div>
  );
}
```

### usePerformanceTimeSeries

Hook for time-series data visualization:

```typescript
import { usePerformanceTimeSeries } from '@/hooks/use-performance';

function PerformanceChart() {
  const timeSeries = usePerformanceTimeSeries(
    'api-response-time',
    3600000 // 1 hour
  );

  return (
    <LineChart
      data={timeSeries.map((point) => ({
        time: new Date(point.timestamp),
        value: point.value,
      }))}
    />
  );
}
```

---

## Admin Dashboard

### Accessing the Dashboard

```typescript
import PerformanceMonitor from '@/components/admin/PerformanceMonitor';

export default function AdminPerformancePage() {
  return (
    <div className="admin-layout">
      <PerformanceMonitor />
    </div>
  );
}
```

### Features

1. **Performance Score**
   - Overall score (0-100)
   - Category scores (Web Vitals, API, Rendering, Memory, Errors)
   - Circular progress indicators

2. **Web Vitals Cards**
   - Individual cards for each vital
   - Color-coded ratings
   - Threshold indicators

3. **Custom Metrics**
   - Statistical analysis (min, max, avg, median, P75, P95, P99)
   - Trend indicators (improving, stable, degrading)
   - Comparison with previous hour

4. **Warnings Panel**
   - Critical and warning alerts
   - Dismiss individual warnings
   - Clear all warnings

5. **Recent Activity**
   - Web Vitals table
   - Custom metrics table
   - Timestamp tracking

6. **Export**
   - Export to CSV
   - Export to JSON

---

## API Integration

### Automatic API Tracking

The performance monitor automatically tracks all API calls via PerformanceObserver:

```typescript
// No code needed - automatic tracking for:
// - /api/* routes
// - /v1/graphql endpoints
```

### Manual API Tracking

For more detailed tracking:

```typescript
import { measurePerformanceAsync } from '@/lib/performance/monitor'

async function fetchData() {
  return measurePerformanceAsync(
    'fetch-messages',
    async () => {
      const response = await fetch('/api/messages')
      return response.json()
    },
    { endpoint: '/api/messages' }
  )
}
```

### GraphQL Integration

```typescript
import { ApolloLink } from '@apollo/client'
import { performanceMonitor } from '@/lib/performance/monitor'

const performanceLink = new ApolloLink((operation, forward) => {
  const start = performance.now()

  return forward(operation).map((response) => {
    const duration = performance.now() - start

    performanceMonitor.recordCustomMetric({
      name: 'graphql-query-time',
      value: duration,
      unit: 'ms',
      tags: {
        operation: operation.operationName,
        type: operation.query.definitions[0]?.operation || 'unknown',
      },
    })

    return response
  })
})
```

---

## Best Practices

### 1. Minimize Re-renders

```typescript
import { memo, useCallback } from 'react';

// Memoize expensive components
const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* ... */}</div>;
});

// Use useCallback for event handlers
function Parent() {
  const handleClick = useCallback(() => {
    // ...
  }, []);

  return <ExpensiveComponent onClick={handleClick} />;
}
```

### 2. Code Splitting

```typescript
import dynamic from 'next/dynamic';

// Lazy load heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false,
});
```

### 3. Image Optimization

```typescript
import Image from 'next/image';

// Use Next.js Image component
<Image
  src="/hero.jpg"
  width={1200}
  height={600}
  priority // for LCP images
  alt="Hero"
/>
```

### 4. API Response Caching

```typescript
import useSWR from 'swr'

function Messages() {
  // SWR automatically caches responses
  const { data } = useSWR('/api/messages', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  })
}
```

### 5. Debounce Expensive Operations

```typescript
import { useDebouncedCallback } from 'use-debounce';

function SearchInput() {
  const debouncedSearch = useDebouncedCallback(
    (value) => {
      // Expensive search operation
      performSearch(value);
    },
    300
  );

  return <input onChange={(e) => debouncedSearch(e.target.value)} />;
}
```

### 6. Virtual Scrolling

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function LongList({ items }) {
  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div key={virtualRow.index}>{items[virtualRow.index]}</div>
        ))}
      </div>
    </div>
  );
}
```

### 7. Monitor Memory Leaks

```typescript
import { useEffect } from 'react'

function Component() {
  useEffect(() => {
    const subscription = observable.subscribe(/* ... */)

    // Always clean up!
    return () => {
      subscription.unsubscribe()
    }
  }, [])
}
```

### 8. Track Component Performance

```typescript
import { Profiler } from 'react';
import { recordRenderTime } from '@/lib/performance/monitor';

function App() {
  return (
    <Profiler
      id="App"
      onRender={(id, phase, actualDuration) => {
        recordRenderTime(id, phase, actualDuration);
      }}
    >
      <YourApp />
    </Profiler>
  );
}
```

---

## Performance Budget

Recommended targets for production:

| Metric            | Target        | Alert Threshold |
| ----------------- | ------------- | --------------- |
| LCP               | <2.5s         | >4s             |
| FID               | <100ms        | >300ms          |
| CLS               | <0.1          | >0.25           |
| TTFB              | <800ms        | >1.8s           |
| API Response      | <500ms        | >2s             |
| WebSocket Latency | <100ms        | >500ms          |
| Render Time       | <16ms (60fps) | >50ms           |
| Memory Usage      | <50%          | >80%            |
| Error Rate        | <1%           | >5%             |

---

## Troubleshooting

### High LCP

- Optimize images (use Next.js Image)
- Preload critical resources
- Reduce server response time
- Use CDN for static assets

### Poor FID

- Break up long tasks
- Use web workers for heavy computations
- Defer non-critical JavaScript
- Optimize event handlers

### High CLS

- Set dimensions on images and videos
- Avoid inserting content above existing content
- Use CSS containment
- Reserve space for ads and embeds

### Slow API Responses

- Add database indexes
- Implement caching (Redis)
- Use connection pooling
- Optimize queries

### Memory Leaks

- Clean up event listeners
- Cancel pending requests
- Unsubscribe from observables
- Clear timeouts/intervals

---

## Monitoring in Production

### Sentry Integration

All metrics are automatically sent to Sentry when configured:

```bash
# .env.local
NEXT_PUBLIC_SENTRY_DSN=https://...
```

### Viewing Metrics

1. **Sentry Dashboard**: View trends and alerts
2. **Admin Panel**: Real-time monitoring
3. **Browser DevTools**: Performance tab
4. **Lighthouse**: Audit reports

### Alerts

Configure Sentry alerts for:

- Poor Web Vitals (score < 50)
- High error rate (>5%)
- Slow API responses (>2s)
- Memory warnings

---

## FAQ

**Q: Do metrics impact performance?**
A: Minimal impact. The monitor uses passive observers and async operations.

**Q: How long are metrics stored?**
A: Last 1000 metrics in localStorage, full history in Sentry.

**Q: Can I disable monitoring?**
A: Yes, don't call `performanceMonitor.initialize()` or set feature flag.

**Q: What browsers are supported?**
A: All modern browsers. Gracefully degrades on older browsers.

**Q: How do I export data?**
A: Use the Export buttons in the Admin Panel or call `exportToCSV(metrics)`.

---

## Related Documentation

- [Sentry Setup](./Sentry-Setup.md)
- [Architecture](../ARCHITECTURE-DECISIONS.md)
- [Performance Best Practices](https://web.dev/vitals/)
