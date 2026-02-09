# Performance Optimization Quick Reference

**Version**: 0.9.1
**Last Updated**: February 9, 2026

---

## 🚀 Quick Commands

```bash
# Analyze bundle sizes (visual)
pnpm build:analyze

# Run Lighthouse audit
pnpm lighthouse

# Generate bundle report
tsx scripts/analyze-bundle.ts

# Type check (performance impact)
pnpm type-check

# Build for production
pnpm build
```

---

## 📊 Current Metrics (February 9, 2026)

| Metric | Value | Status |
|--------|-------|--------|
| Shared Bundle | 103 KB | ✅ Excellent |
| Public Pages | 104-221 KB | ✅ Good |
| Chat Pages | 200-284 KB | ✅ Good |
| Settings Pages | 466-478 KB | ❌ Needs work |
| Admin Pages | 164-415 KB | ⚠️ Some exceed |
| API Routes | 1.45 KB | ✅ Excellent |

---

## 🎯 Optimization Priorities

### 🔴 High Priority (300KB+ savings each)

1. **Lazy Load Recharts**
   ```typescript
   import { LazyAnalyticsCharts } from '@/lib/performance/lazy-loader'
   // Use in admin analytics pages
   ```

2. **Code Split Admin Routes**
   ```typescript
   // Already supported by Next.js App Router
   // Keep admin pages in separate route groups
   ```

3. **Lazy Load GDPR Tools**
   ```typescript
   const LazyGDPR = dynamic(() => import('@/components/gdpr-tools'), {
     loading: () => <Skeleton />,
     ssr: false
   })
   ```

### 🟡 Medium Priority (80-150KB savings each)

4. **Lazy Load TipTap Editor**
   ```typescript
   import { LazyRichTextEditor } from '@/lib/performance/lazy-loader'
   ```

5. **Lazy Load Emoji Picker**
   ```typescript
   import { LazyEmojiPicker } from '@/lib/performance/lazy-loader'
   ```

---

## 🛠️ Common Patterns

### Lazy Load Component

```typescript
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false
})
```

### Measure Performance

```typescript
import { measureFunction } from '@/lib/performance/performance-monitor'

const result = await measureFunction('my-operation', async () => {
  // Your code here
  return data
}, true) // true = log to console
```

### Check Performance Budget

```typescript
import { checkPerformanceBudget } from '@/lib/performance/performance-monitor'

// Returns true if within budget
const isGood = checkPerformanceBudget()
```

### Prefetch on Hover

```typescript
import { prefetchCallComponents } from '@/lib/performance/lazy-loader'

<button
  onMouseEnter={prefetchCallComponents}
  onClick={startCall}
>
  Start Call
</button>
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `/docs/PERFORMANCE-AUDIT.md` | Complete audit report |
| `/docs/BUNDLE-ANALYSIS.md` | Bundle size breakdown |
| `/docs/PERFORMANCE-OPTIMIZATIONS.md` | Implementation guide |
| `/src/lib/performance/lazy-loader.ts` | Lazy loading utilities |
| `/src/lib/performance/performance-monitor.ts` | Runtime monitoring |
| `/.lighthouserc.js` | Lighthouse CI config |
| `/scripts/analyze-bundle.ts` | Bundle analysis script |

---

## 🎓 Best Practices

### DO ✅

- Lazy load heavy components (>50KB)
- Use dynamic imports for admin/settings
- Implement virtual scrolling for long lists
- Memoize expensive calculations
- Use React.memo for pure components
- Monitor bundle sizes in CI/CD
- Profile with React DevTools
- Check Web Vitals regularly

### DON'T ❌

- Import entire libraries at top level
- Load all features upfront
- Ignore bundle size warnings
- Skip lazy loading for charts/editors
- Use heavy animations on every render
- Forget to clean up event listeners
- Ignore memory leaks
- Skip performance budgets

---

## 🔍 Monitoring

### Web Vitals Targets

| Metric | Target | Current |
|--------|--------|---------|
| LCP | < 2.5s | ✅ Monitored |
| FID | < 100ms | ✅ Monitored |
| CLS | < 0.1 | ✅ Monitored |
| FCP | < 1.8s | ✅ Monitored |
| TTFB | < 600ms | ✅ Monitored |

### Bundle Size Budgets

| Resource | Budget | Enforcement |
|----------|--------|-------------|
| JavaScript | < 300KB | Lighthouse CI |
| CSS | < 50KB | Lighthouse CI |
| Images | < 500KB | Lighthouse CI |
| Fonts | < 100KB | Manual |
| Total | < 1MB | Manual |

---

## 🐛 Troubleshooting

### Bundle Too Large?

1. Run `pnpm build:analyze`
2. Identify largest chunks
3. Lazy load heavy components
4. Code split routes

### Slow Page Load?

1. Check Web Vitals
2. Run Lighthouse audit
3. Profile with Chrome DevTools
4. Check network waterfall

### High Memory Usage?

1. Check console for warnings
2. Use performance monitor
3. Look for memory leaks
4. Profile with Chrome DevTools

### Slow Renders?

1. Use React Profiler
2. Check component re-renders
3. Add memoization
4. Optimize expensive calculations

---

## 📞 Support

- **Documentation**: `/docs/PERFORMANCE-OPTIMIZATIONS.md`
- **Audit Report**: `/docs/PERFORMANCE-AUDIT.md`
- **Bundle Analysis**: `/docs/BUNDLE-ANALYSIS.md`
- **Task Report**: `/TASK-136-PERFORMANCE-REPORT.md`

---

**Generated**: February 9, 2026
**Next Review**: March 9, 2026
