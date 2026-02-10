# Animation System Documentation

This document describes the comprehensive animation system implemented in nself-chat using Framer Motion.

## Overview

The animation system provides:

- **Consistent UX**: Reusable animation variants for common patterns
- **Premium Feel**: Smooth, spring-based physics animations
- **Accessibility**: Respects user's motion preferences
- **Performance**: Optimized for 60fps rendering
- **Type Safety**: Full TypeScript support

## Core Library

Location: `/src/lib/animations.ts`

### Animation Categories

#### 1. Message Animations

**Message Entry** - Slide in from bottom with fade

```typescript
import { messageEntry } from '@/lib/animations'

<motion.div variants={messageEntry}>
  {/* Message content */}
</motion.div>
```

**Message Hover** - Background color transition

```typescript
import { messageHover } from '@/lib/animations'

<motion.div variants={messageHover} initial="rest" whileHover="hover">
  {/* Message */}
</motion.div>
```

#### 2. Reaction Animations

**Reaction Burst** - Emoji reaction with burst effect

```typescript
import { reactionBurst } from '@/lib/animations'

<motion.button variants={reactionBurst}>
  👍
</motion.button>
```

**Reaction Pill Hover** - Subtle scale on hover

```typescript
import { reactionPillHover } from '@/lib/animations'

<motion.div variants={reactionPillHover} whileHover="hover" whileTap="tap">
  {/* Reaction pill */}
</motion.div>
```

#### 3. Modal & Dialog Animations

**Modal Overlay** - Fade in backdrop

```typescript
import { modalOverlay, modalContent } from '@/lib/animations'

<motion.div variants={modalOverlay}>
  <motion.div variants={modalContent}>
    {/* Modal content */}
  </motion.div>
</motion.div>
```

**Sheet Slide** - Side drawer animation

```typescript
import { sheetSlide } from '@/lib/animations'

<motion.div variants={sheetSlide('right')}>
  {/* Drawer content */}
</motion.div>
```

#### 4. Navigation & Page Transitions

**Page Transition** - Fade and slide

```typescript
import { PageTransition } from '@/components/ui/page-transition'

<PageTransition mode="slide">
  {children}
</PageTransition>
```

**Channel Switch** - Optimized for channel navigation

```typescript
import { ChannelTransition } from '@/components/ui/page-transition'

<ChannelTransition channelId={channelId}>
  {children}
</ChannelTransition>
```

**Sidebar Toggle** - Expand/collapse animation

```typescript
import { sidebarToggle } from '@/lib/animations'

<motion.div
  variants={sidebarToggle}
  animate={isExpanded ? 'expanded' : 'collapsed'}
>
  {/* Sidebar */}
</motion.div>
```

#### 5. Loading & Skeleton Animations

**Skeleton Pulse** - Loading placeholder

```typescript
import { skeletonPulse } from '@/lib/animations'

<motion.div variants={skeletonPulse} />
```

**Shimmer Effect** - Loading shimmer

```typescript
import { shimmer } from '@/lib/animations'

<motion.div animate={shimmer.animate} />
```

**Staggered Items** - Sequential reveal

```typescript
import { staggerContainer, staggerItem } from '@/lib/animations'

<motion.div variants={staggerContainer}>
  {items.map(item => (
    <motion.div key={item.id} variants={staggerItem}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

#### 6. UI Element Animations

**Button Press** - Tactile button feedback

```typescript
import { Button } from '@/components/ui/button'

<Button animated>Click me</Button>
```

**Tooltip** - Fade and slide

```typescript
import { tooltip } from '@/lib/animations'

<motion.div variants={tooltip}>
  {/* Tooltip content */}
</motion.div>
```

**Dropdown Menu** - Cascade animation

```typescript
import { dropdownMenu, dropdownItem } from '@/lib/animations'

<motion.div variants={dropdownMenu}>
  {items.map(item => (
    <motion.div key={item.id} variants={dropdownItem}>
      {item.label}
    </motion.div>
  ))}
</motion.div>
```

**Badge Bounce** - Notification badge

```typescript
import { badgeBounce } from '@/lib/animations'

<motion.div variants={badgeBounce}>
  {count}
</motion.div>
```

**FAB Float** - Floating action button

```typescript
import { fabFloat } from '@/lib/animations'

<motion.button variants={fabFloat} whileHover="hover">
  <Plus />
</motion.button>
```

#### 7. Notification & Toast Animations

**Toast Slide** - Slide from top

```typescript
import { toastSlide } from '@/lib/animations'

<motion.div variants={toastSlide}>
  {/* Toast content */}
</motion.div>
```

**Notification Pulse** - Attention-grabbing pulse

```typescript
import { notificationPulse } from '@/lib/animations'

<motion.div variants={notificationPulse}>
  {/* Notification badge */}
</motion.div>
```

#### 8. Form & Input Animations

**Input Focus** - Border highlight

```typescript
import { Input } from '@/components/ui/input'

<Input error={!!error} success={isValid} />
```

**Error Shake** - Validation feedback

```typescript
import { errorShake } from '@/lib/animations'

<motion.div variants={errorShake} animate={hasError ? 'animate' : 'initial'}>
  {/* Input field */}
</motion.div>
```

**Success Checkmark** - Confirmation animation

```typescript
import { successCheckmark } from '@/lib/animations'

<motion.div variants={successCheckmark}>
  <CheckCircle />
</motion.div>
```

#### 9. Scroll Animations

**Scroll Reveal** - Fade in on scroll

```typescript
import { ScrollReveal } from '@/components/ui/scroll-reveal'

<ScrollReveal>
  {/* Content */}
</ScrollReveal>
```

**Staggered Scroll Reveal** - Sequential reveal

```typescript
import { StaggeredScrollReveal } from '@/components/ui/scroll-reveal'

<StaggeredScrollReveal>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</StaggeredScrollReveal>
```

**Fade In On Scroll** - Directional fade

```typescript
import { FadeInOnScroll } from '@/components/ui/scroll-reveal'

<FadeInOnScroll direction="up">
  {/* Content */}
</FadeInOnScroll>
```

#### 10. Mobile Gestures

**Pull to Refresh** - Mobile refresh gesture

```typescript
import { PullToRefresh } from '@/components/ui/pull-to-refresh'

<PullToRefresh onRefresh={async () => {
  await refetchData()
}}>
  {/* Scrollable content */}
</PullToRefresh>
```

**Swipe to Dismiss** - Swipeable items

```typescript
import { swipeToDismiss } from '@/lib/animations'

<motion.div variants={swipeToDismiss('right')}>
  {/* Swipeable item */}
</motion.div>
```

**Drag Reorder** - Drag and drop

```typescript
import { dragReorder } from '@/lib/animations'

<motion.div
  drag
  variants={dragReorder}
  whileDrag="dragging"
>
  {/* Draggable item */}
</motion.div>
```

## Transition Presets

### Spring Transitions

```typescript
import { spring, springSmooth, springBouncy } from '@/lib/animations'

// Standard spring (400 stiffness, 30 damping)
<motion.div transition={spring} />

// Smooth spring (300 stiffness, 25 damping)
<motion.div transition={springSmooth} />

// Bouncy spring (500 stiffness, 20 damping)
<motion.div transition={springBouncy} />
```

### Ease Transitions

```typescript
import { easeOut, easeInOut, easeFast, easeSlow } from '@/lib/animations'

// Fast ease out (0.2s)
<motion.div transition={easeOut} />

// Ease in-out (0.3s)
<motion.div transition={easeInOut} />

// Very fast (0.15s)
<motion.div transition={easeFast} />

// Slow (0.5s)
<motion.div transition={easeSlow} />
```

## Utility Functions

### Custom Variants

Create custom animation variants:

```typescript
import { fade, slide, scale, combine } from '@/lib/animations'

// Fade animation
const fadeVariant = fade(0.3) // 0.3s duration

// Slide animation
const slideVariant = slide('up', 20) // slide up 20px

// Scale animation
const scaleVariant = scale(0.8, 1) // from 0.8 to 1

// Combine multiple variants
const combinedVariant = combine(fadeVariant, scaleVariant)
```

## Loading Skeletons

Pre-built skeleton components with animations:

```typescript
import {
  MessageSkeleton,
  MessageListSkeleton,
  ChannelSidebarSkeleton,
  MemberListSkeleton,
  ChatHeaderSkeleton,
  ChatLayoutSkeleton,
} from '@/components/ui/loading-skeletons'

// Single message skeleton
<MessageSkeleton grouped={false} />

// Full message list
<MessageListSkeleton count={10} />

// Complete chat layout
<ChatLayoutSkeleton />
```

## Enhanced Components

### Button

Buttons include automatic press animations:

```typescript
import { Button } from '@/components/ui/button'

// Animated by default
<Button>Click me</Button>

// Disable animation
<Button animated={false}>No animation</Button>
```

### Input

Inputs include validation feedback animations:

```typescript
import { Input } from '@/components/ui/input'

// Error state with shake animation
<Input error="Invalid email" />

// Success state with checkmark
<Input success />
```

### Dialog

Dialogs include overlay fade and content scale:

```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
    </DialogHeader>
    {/* Content animates in automatically */}
  </DialogContent>
</Dialog>
```

## Hooks

### useScrollAnimation

Detect when elements enter viewport:

```typescript
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

function Component() {
  const { ref, isInView } = useScrollAnimation({
    threshold: 0.2,
    once: true,
  })

  return (
    <div ref={ref}>
      {isInView ? 'Visible!' : 'Hidden'}
    </div>
  )
}
```

### useParallax

Create parallax scrolling effects:

```typescript
import { useParallax } from '@/hooks/use-scroll-animation'

function Component() {
  const { ref, y } = useParallax(50)

  return (
    <motion.div ref={ref} style={{ y }}>
      {/* Parallax content */}
    </motion.div>
  )
}
```

### useScrollDirection

Track scroll direction:

```typescript
import { useScrollDirection } from '@/hooks/use-scroll-animation'

function Component() {
  const direction = useScrollDirection()

  return (
    <div>
      Scrolling {direction}
    </div>
  )
}
```

### useAutoHideOnScroll

Auto-hide elements on scroll:

```typescript
import { useAutoHideOnScroll } from '@/hooks/use-scroll-animation'

function Header() {
  const isVisible = useAutoHideOnScroll(100)

  return (
    <motion.header
      animate={{ y: isVisible ? 0 : -100 }}
    >
      {/* Header content */}
    </motion.header>
  )
}
```

## Theme Transitions

The theme context includes smooth transitions:

```typescript
import { useTheme } from '@/contexts/theme-context'

function ThemeToggle() {
  const { theme, setTheme, isTransitioning } = useTheme()

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      {isTransitioning ? 'Transitioning...' : 'Toggle Theme'}
    </button>
  )
}
```

## Performance Best Practices

1. **Use `layout` prop sparingly** - Only for necessary layout animations
2. **Prefer transforms over layout changes** - `x`, `y`, `scale`, `rotate`
3. **Use `AnimatePresence` for exit animations** - Ensures smooth removal
4. **Leverage `will-change` CSS** - Applied automatically by Framer Motion
5. **Reduce motion for accessibility** - Use `useReducedMotion` hook

## Accessibility

All animations respect the user's motion preferences:

```typescript
import { useReducedMotion } from '@/lib/accessibility/use-reduced-motion'

function Component() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      animate={shouldReduceMotion ? {} : { scale: 1.2 }}
    >
      {/* Content */}
    </motion.div>
  )
}
```

## Examples

### Animated Message List

```typescript
import { motion, AnimatePresence } from 'framer-motion'
import { messageEntry, staggerContainer, staggerItem } from '@/lib/animations'

function MessageList({ messages }) {
  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate">
      <AnimatePresence mode="popLayout">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            variants={messageEntry}
            layout
          >
            <MessageItem message={message} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
```

### Animated Sidebar

```typescript
import { motion } from 'framer-motion'
import { sidebarToggle, staggerContainer, staggerItem } from '@/lib/animations'

function Sidebar({ isOpen }) {
  return (
    <motion.aside
      variants={sidebarToggle}
      animate={isOpen ? 'expanded' : 'collapsed'}
    >
      <motion.div variants={staggerContainer} initial="initial" animate="animate">
        {channels.map((channel) => (
          <motion.div key={channel.id} variants={staggerItem}>
            {channel.name}
          </motion.div>
        ))}
      </motion.div>
    </motion.aside>
  )
}
```

### Animated Form Validation

```typescript
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { errorShake, successCheckmark } from '@/lib/animations'

function FormField({ value, error, isValid }) {
  return (
    <div>
      <Input
        value={value}
        error={error}
        success={isValid}
      />
      {error && (
        <motion.p
          variants={errorShake}
          animate="animate"
          className="text-destructive text-sm"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}
```

## Contributing

When adding new animations:

1. Add variant to `/src/lib/animations.ts`
2. Use semantic naming (describe what it does, not how)
3. Include TypeScript types
4. Add documentation to this file
5. Ensure accessibility compliance
6. Test on multiple devices and browsers
