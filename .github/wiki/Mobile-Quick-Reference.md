# Mobile UI Quick Reference v0.8.0

Quick reference guide for mobile UI components and utilities.

## Import Guide

```tsx
// Mobile Components
import {
  VirtualMessageList,
  LongPressMenu,
  PinchZoom,
  PullToRefresh,
  SkeletonLoader,
  TouchButton,
  TouchIconButton,
  TouchListItem,
} from '@/components/mobile'

// Dark Mode
import { useDarkMode } from '@/hooks/use-dark-mode'
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle'

// Performance
import { LazyMessageList, preloadChatComponents } from '@/lib/performance/lazy-components'
import { debounce, useDebounce, memoize } from '@/lib/performance/optimization'

// Accessibility
import {
  useAnnounce,
  useFocusTrap,
  useKeyboardShortcut,
  useReducedMotion,
  meetsWCAGAA,
} from '@/lib/accessibility/a11y-utils'
```

## Common Patterns

### 1. Virtual Message List with Pull-to-Refresh

```tsx
<PullToRefresh onRefresh={fetchNewMessages}>
  <VirtualMessageList
    messages={messages}
    isLoading={isLoading}
    hasMore={hasMore}
    onLoadMore={loadOlderMessages}
    renderMessage={(msg, index) => (
      <LongPressMenu
        items={[
          { id: 'reply', label: 'Reply', icon: <Reply />, onClick: () => handleReply(msg) },
          { id: 'delete', label: 'Delete', destructive: true, onClick: () => handleDelete(msg.id) },
        ]}
      >
        <MessageItem message={msg} />
      </LongPressMenu>
    )}
    renderDateSeparator={(date) => <DateSeparator date={date} />}
  />
</PullToRefresh>
```

### 2. Loading States with Skeletons

```tsx
{
  isLoading ? (
    <SkeletonLoader type="message" count={8} />
  ) : (
    <VirtualMessageList messages={messages} />
  )
}
```

### 3. Touch-Optimized Buttons

```tsx
<TouchButton
  variant="default"
  size="default"
  hapticFeedback
  onClick={handleClick}
>
  Send Message
</TouchButton>

<TouchIconButton
  icon={<Send />}
  label="Send"
  hapticFeedback
  onClick={handleSend}
/>
```

### 4. Image Viewer with Zoom

```tsx
<PinchZoom minScale={1} maxScale={4} enableRotation enableDownload downloadUrl={imageUrl}>
  <img src={imageUrl} alt="Message attachment" />
</PinchZoom>
```

### 5. Dark Mode Toggle

```tsx
// In header
<DarkModeToggle variant="dropdown" />

// Mobile FAB
<CompactDarkModeToggle />

// Hook usage
const { isDark, toggle, colorScheme, setColorScheme } = useDarkMode()
```

### 6. Accessibility

```tsx
// Announce to screen readers
const announce = useAnnounce()
announce('Message sent successfully', 'polite')

// Keyboard shortcuts
useKeyboardShortcut([
  { key: 'k', ctrl: true, callback: openSearch },
  { key: 'Escape', callback: closeModal },
])

// Respect user preferences
const shouldReduceMotion = useReducedMotion()
const isHighContrast = useHighContrast()
```

### 7. Lazy Loading

```tsx
// Component
const MessageList = LazyMessageList.Component

// Preload on route change
useEffect(() => {
  preloadChatComponents()
}, [])

// Smart preload (checks network)
smartPreload(() => LazyModal.preload())
```

### 8. Performance Optimization

```tsx
// Debounce search
const [search, setSearch] = useState('')
const debouncedSearch = useDebounce(search, 300)

// Memoize expensive function
const result = useMemo(() => memoize(expensiveCalc)(data), [data])

// Process in chunks
const results = await processInChunks(items, processItem, 10)
```

## Component Checklist

When building mobile UI:

- [ ] Use `VirtualMessageList` for lists >50 items
- [ ] Add `SkeletonLoader` for all async content
- [ ] Use `TouchButton` / `TouchListItem` for interactive elements
- [ ] Implement `LongPressMenu` for context actions
- [ ] Add `PullToRefresh` for list views
- [ ] Use `PinchZoom` for images
- [ ] Respect `useReducedMotion()` for animations
- [ ] Test with `useAnnounce()` for screen readers
- [ ] Ensure all touch targets ≥44pt/48dp
- [ ] Add proper `aria-label` to icon buttons

## Performance Checklist

- [ ] Lazy load heavy components
- [ ] Preload on route change
- [ ] Use virtual scrolling for long lists
- [ ] Debounce search inputs
- [ ] Memoize expensive calculations
- [ ] Optimize images (lazy load, srcset)
- [ ] Check bundle size (<200KB main)
- [ ] Test on low-end devices
- [ ] Measure with Lighthouse mobile

## Accessibility Checklist (WCAG 2.1 AA)

- [ ] All text has 4.5:1 contrast ratio
- [ ] All interactive elements have focus indicators
- [ ] Keyboard navigation works
- [ ] Screen reader announces important changes
- [ ] Forms have proper labels and error messages
- [ ] Touch targets ≥44pt/48dp
- [ ] Supports high contrast mode
- [ ] Respects reduced motion preference
- [ ] Color is not the only indicator
- [ ] Images have alt text

## Touch Target Sizes

```tsx
// Constants
import {
  IOS_MIN_TAP_TARGET,      // 44
  ANDROID_MIN_TAP_TARGET,  // 48
  MIN_TAP_TARGET,          // 48 (max of iOS/Android)
} from '@/components/mobile'

// Usage
<button style={{ minHeight: MIN_TAP_TARGET, minWidth: MIN_TAP_TARGET }}>
  Icon
</button>

// Or use TouchArea wrapper
<TouchArea>
  <SmallIcon />
</TouchArea>
```

## Gesture Handling

```tsx
// Long press
const { handlers } = useLongPress(handleLongPress, { duration: 500 })
<div {...handlers}>Long press me</div>

// Pull to refresh
const { refreshState, pullDistance, handlers } = usePullToRefresh({
  onRefresh: async () => await fetchData(),
})

// Already built-in to components:
// - Swipe actions (SwipeActions)
// - Pinch zoom (PinchZoom)
// - Pull to refresh (PullToRefresh)
```

## Haptic Feedback

```tsx
// Built-in to components
<TouchButton hapticFeedback onClick={handleClick} />
<LongPressMenu hapticFeedback items={items} />

// Manual trigger
if ('vibrate' in navigator) {
  navigator.vibrate(10) // 10ms vibration
}
```

## Network Optimization

```tsx
import { shouldPreload, getNetworkInfo } from '@/lib/performance/optimization'

// Check before preloading
if (shouldPreload()) {
  preloadHeavyComponents()
}

// Get network info
const network = getNetworkInfo()
if (network.saveData) {
  // Use low-quality images
}
```

## Testing Commands

```bash
# Lighthouse mobile audit
pnpm lighthouse

# Bundle size analysis
pnpm build:analyze

# Type check
pnpm type-check

# E2E tests
pnpm test:e2e

# All checks
pnpm check-all
```

## Common Issues

### Virtual Scroll Not Smooth

- Reduce `overscan` prop
- Check message render performance
- Ensure `estimateSize` is accurate

### Dark Mode Flashing

- Use `next-themes` ThemeProvider
- Add `suppressHydrationWarning` to html tag
- Ensure localStorage loads before render

### Touch Targets Too Small

- Use `TouchButton` instead of `Button`
- Wrap small elements in `TouchArea`
- Check with browser inspector (show rulers)

### Skeleton Not Matching Content

- Adjust skeleton heights
- Use multiple skeleton types
- Match skeleton structure to content

### Performance Issues

- Check bundle size with `pnpm build:analyze`
- Lazy load heavy components
- Use virtual scrolling
- Debounce expensive operations

## Resources

- Full docs: `/docs/Mobile-UI-v0.8.0.md`
- Component demos: `/src/app/mobile-demo`
- Storybook: `pnpm storybook` (if configured)
