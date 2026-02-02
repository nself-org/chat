# Unread System - Visual Guide

Visual reference for all unread indicator components and their usage contexts.

---

## Component Gallery

### 1. UnreadBadge - Channel List

**Usage**: Show unread count on channel items in sidebar

```tsx
<UnreadBadge
  unreadCount={5}
  mentionCount={2}
  size="sm"
  position="inline"
/>
```

**Visual States**:

```
┌────────────────────────────────┐
│ # general              [5]     │  ← Regular unread (blue/gray badge)
│ # random               [3]     │
│ # design               ●       │  ← Mention (red dot, no count)
└────────────────────────────────┘

┌────────────────────────────────┐
│ # announcements        [2]     │  ← Mention with count (red badge)
│ # support              ●       │  ← Unread dot (gray)
│ # feedback                     │  ← No unread
└────────────────────────────────┘
```

**Color Coding**:
- 🔴 Red = Has mentions (`@user`, `@everyone`, `@here`)
- 🔵 Blue/Gray = Has unread (no mentions)
- ⚪ None = No unread

**Sizes**:
- `sm`: 16px height (default for sidebar)
- `md`: 20px height (for headers)
- `lg`: 24px height (for emphasis)

---

### 2. UnreadDot - Minimal Indicator

**Usage**: Subtle indicator when count isn't needed

```tsx
<UnreadDot
  unreadCount={3}
  mentionCount={1}
  size="sm"
/>
```

**Visual States**:

```
┌────────────────────────────────┐
│ # general          ●           │  ← Red dot (mentions)
│ # random           ●           │  ← Blue dot (unread)
│ # design                       │  ← No dot (all read)
└────────────────────────────────┘
```

**Best For**:
- Muted channels (show indicator but not count)
- Compact views
- Mobile interfaces
- Overflow menus

---

### 3. UnreadLine - Message List Divider

**Usage**: Visual separator showing where unread messages start

```tsx
<UnreadLine
  count={10}
  label="New Messages"
/>
```

**Visual Appearance**:

```
┌───────────────────────────────────────────┐
│                                           │
│ [Alice] Hey everyone!                     │
│ [Bob] What's up?                          │
│                                           │
├─────────── 🔔 10 New Messages ───────────┤  ← Unread line
│                                           │
│ [Charlie] Just joined                     │
│ [Dave] Welcome!                           │
│                                           │
└───────────────────────────────────────────┘
```

**Styling**:
- Red horizontal line
- Centered label with background
- Bell icon
- Count + custom text

**Animation**:
- Fades in from above
- Subtle slide down

---

### 4. SidebarUnread - Full Channel Item

**Usage**: Complete channel list item with integrated unread badge

```tsx
<SidebarUnread
  channelName="general"
  channelType="channel"
  unreadCount={5}
  mentionCount={2}
  isMuted={false}
  isActive={false}
  onClick={() => {}}
/>
```

**Visual States**:

```
Active Channel:
┌────────────────────────────────┐
│ ┃ # general           [5]      │  ← Blue accent bar
└────────────────────────────────┘

Unread Channel:
┌────────────────────────────────┐
│   # random            [3]      │  ← Bold text
└────────────────────────────────┘

Mention:
┌────────────────────────────────┐
│   # design            [2]      │  ← Red badge, bold
└────────────────────────────────┘

Muted:
┌────────────────────────────────┐
│   # support           ●        │  ← Dimmed, dot only
└────────────────────────────────┘

Read:
┌────────────────────────────────┐
│   # feedback                   │  ← Normal text, no badge
└────────────────────────────────┘
```

**States**:
- **Active**: Highlighted background + accent bar
- **Unread**: Bold text + badge
- **Mention**: Bold text + red badge
- **Muted**: Reduced opacity + tooltip
- **Read**: Normal appearance

---

### 5. JumpToUnread - Navigation Button

**Usage**: Floating button to jump to first unread message

```tsx
<JumpToUnreadButton
  hasUnread={true}
  unreadCount={5}
  mentionCount={2}
  onJumpToUnread={handleJump}
  variant="default"
/>
```

**Visual Variants**:

**Default** (Full featured):
```
┌─────────────────────────────────┐
│                                 │
│         Message List            │
│                                 │
│         ┌─────────────┐         │
│         │ 🔔 2 mentions│         │  ← Floating button
│         └─────────────┘         │
│                                 │
└─────────────────────────────────┘
```

**Compact** (Icon only):
```
┌─────────────────────────────────┐
│                                 │
│         Message List            │
│                                 │
│             ┌───┐               │
│             │ ⬇ │               │  ← Compact button
│             └───┘               │
│                                 │
└─────────────────────────────────┘
```

**Minimal** (Subtle):
```
┌─────────────────────────────────┐
│                                 │
│         Message List            │
│                                 │
│      ⬇ Jump to 5 unread         │  ← Minimal text
│                                 │
└─────────────────────────────────┘
```

**Colors**:
- 🔴 Red background = Has mentions
- 🔵 Blue background = Has unread (no mentions)
- ⚪ Default background = Jump to latest

**Position Options**:
- `bottom-center` (default)
- `bottom-right`
- `bottom-left`

---

### 6. MentionHighlight - Message Background

**Usage**: Highlight messages that mention current user

```tsx
<MentionHighlight isMentioned={true}>
  <MessageItem message={message} />
</MentionHighlight>
```

**Visual Effect**:

```
Normal Message:
┌───────────────────────────────────┐
│ [Alice] Hey team!                 │
└───────────────────────────────────┘

Mentioned Message:
┌───────────────────────────────────┐
┃ [Alice] Hey @you, check this!     │  ← Red left border
┃ (background: red-500/10)          │  ← Subtle red tint
└───────────────────────────────────┘
```

**Styling**:
- Left border: 4px solid red
- Background: `bg-red-500/10` (light) / `bg-red-500/20` (dark)
- Full message width

---

## Layout Examples

### Full Chat Interface

```
┌──────────────────┬──────────────────────────────────┐
│  SIDEBAR         │  MAIN CHAT                       │
├──────────────────┼──────────────────────────────────┤
│                  │  Header                          │
│ CHANNELS         │  ┌────────────────────────────┐  │
│                  │  │ # general                  │  │
│ # general   [5]  │  │ ⬆⬇ 3 unread channels      │  │
│ # random    [3]  │  └────────────────────────────┘  │
│ # design    [2]  │                                  │
│ # support   ●    │  MESSAGES                        │
│ # feedback       │  ┌────────────────────────────┐  │
│                  │  │ [Alice] Hey!               │  │
│ DMs              │  │ [Bob] What's up?           │  │
│                  │  │                            │  │
│ Alice       [2]  │  ├──── 🔔 5 New Messages ────┤  │
│ Bob         ●    │  │                            │  │
│ Charlie          │  ┃ [Dave] Hey @you!          │  │ ← Mention
│                  │  │ [Eve] Anyone there?        │  │
│                  │  └────────────────────────────┘  │
│                  │                                  │
│                  │  ┌──────────────────┐            │
│                  │  │ 🔔 2 mentions    │            │ ← Jump button
│                  │  └──────────────────┘            │
│                  │                                  │
│                  │  Message Input                   │
└──────────────────┴──────────────────────────────────┘
```

### Mobile View

```
┌──────────────────────────┐
│  ☰  # general       [5]  │  ← Header with badge
├──────────────────────────┤
│                          │
│  Messages                │
│                          │
│  ──── 🔔 5 New ────      │  ← Unread line
│                          │
│  [Alice] Hey!            │
│                          │
│  ┌──────────────┐        │
│  │ ⬇ 5 unread   │        │  ← Compact jump button
│  └──────────────┘        │
│                          │
│  [Input]                 │
└──────────────────────────┘
```

---

## State Transitions

### Channel Badge Lifecycle

```
1. No unread
   ┌──────────┐
   │ # general│
   └──────────┘

2. First unread arrives
   ┌──────────────┐
   │ # general [1]│  ← Badge appears (animated)
   └──────────────┘

3. More unreads accumulate
   ┌──────────────┐
   │ # general [5]│  ← Count increases
   └──────────────┘

4. Mention arrives
   ┌──────────────┐
   │ # general [2]│  ← Turns red
   └──────────────┘

5. Channel opened, scrolled
   ┌──────────┐
   │ # general│    ← Badge fades out
   └──────────┘
```

### Jump Button Lifecycle

```
1. At bottom, no unread
   [Hidden]

2. New message arrives
   ┌──────────────┐
   │ ⬇ 1 new      │  ← Appears (slide up)
   └──────────────┘

3. More messages
   ┌──────────────┐
   │ ⬇ 5 new      │  ← Count updates
   └──────────────┘

4. Mention received
   ┌──────────────┐
   │ 🔔 2 mentions│  ← Turns red
   └──────────────┘

5. Button clicked
   [Scrolls to unread]
   [Hidden after scroll]
```

---

## Color Palette

### Light Mode
```css
/* Regular unread */
--unread-bg: rgba(59, 130, 246, 0.1)     /* blue-500/10 */
--unread-badge: rgba(59, 130, 246, 1)    /* blue-500 */
--unread-text: rgba(59, 130, 246, 1)     /* blue-500 */

/* Mentions */
--mention-bg: rgba(239, 68, 68, 0.1)     /* red-500/10 */
--mention-badge: rgba(239, 68, 68, 1)    /* red-500 */
--mention-text: rgba(255, 255, 255, 1)   /* white */
--mention-border: rgba(239, 68, 68, 1)   /* red-500 */
```

### Dark Mode
```css
/* Regular unread */
--unread-bg: rgba(59, 130, 246, 0.2)     /* blue-500/20 */
--unread-badge: rgba(59, 130, 246, 1)    /* blue-500 */
--unread-text: rgba(96, 165, 250, 1)     /* blue-400 */

/* Mentions */
--mention-bg: rgba(239, 68, 68, 0.2)     /* red-500/20 */
--mention-badge: rgba(239, 68, 68, 1)    /* red-500 */
--mention-text: rgba(255, 255, 255, 1)   /* white */
--mention-border: rgba(239, 68, 68, 1)   /* red-500 */
```

---

## Animations

### Badge Entrance
```tsx
// Framer Motion
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  exit={{ scale: 0 }}
>
  <Badge />
</motion.div>
```

**Effect**: Pop in from center

### Jump Button Entrance
```tsx
<motion.div
  initial={{ opacity: 0, y: 20, scale: 0.9 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: 20, scale: 0.9 }}
  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
>
  <Button />
</motion.div>
```

**Effect**: Slide up with spring bounce

### Unread Line Entrance
```tsx
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
>
  <UnreadLine />
</motion.div>
```

**Effect**: Slide down fade in

---

## Responsive Behavior

### Desktop (>1024px)
- Full badges with counts
- Default jump button variant
- Sidebar always visible
- Hover states active

### Tablet (768px - 1024px)
- Compact badges
- Compact jump button
- Collapsible sidebar
- Touch-friendly targets

### Mobile (<768px)
- Dot indicators (no counts in tight spaces)
- Minimal jump button
- Swipe gestures
- Larger touch targets (min 44px)

---

## Accessibility

### Screen Reader Labels

```tsx
// Badge
<Badge aria-label="5 unread messages" />
<Badge aria-label="2 mentions" />

// Jump Button
<Button
  aria-label="Jump to 5 unread messages"
  aria-keyshortcuts="Alt+Shift+U"
/>

// Unread Line
<div
  role="separator"
  aria-label="Unread messages below"
/>
```

### Keyboard Navigation

```
Tab          → Focus next unread channel
Shift+Tab    → Focus previous unread channel
Enter/Space  → Activate focused item
Alt+Shift+U  → Jump to unread
Alt+Shift+↑  → Previous unread channel
Alt+Shift+↓  → Next unread channel
Esc          → Mark channel as read
```

### Focus Indicators

All interactive elements have visible focus rings:
```css
.focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

---

## Performance Notes

### Optimization Strategies

1. **Memoization**
   - Use `useMemo` for count calculations
   - Use `useCallback` for handlers
   - Prevent unnecessary re-renders

2. **Virtual Lists**
   - Unread indicators work with virtualized lists
   - Only render visible items
   - Maintain scroll position

3. **Debouncing**
   - Mark as read debounced (1s default)
   - Storage saves debounced (100ms)
   - Scroll event throttled

4. **Lazy Loading**
   - Load unread counts on demand
   - Progressive enhancement
   - Skeleton states for loading

---

## Testing Visual Regressions

### Storybook Stories

Create stories for each variant:

```tsx
export const UnreadBadgeStory = {
  args: {
    unreadCount: 5,
    mentionCount: 0,
    size: 'sm',
  },
}

export const MentionBadgeStory = {
  args: {
    unreadCount: 5,
    mentionCount: 2,
    size: 'sm',
  },
}
```

### Visual Testing Tools
- Percy (visual regression)
- Chromatic (Storybook)
- Playwright (E2E screenshots)

---

## Design Tokens

```typescript
export const unreadTokens = {
  badge: {
    size: {
      sm: '16px',
      md: '20px',
      lg: '24px',
    },
    fontSize: {
      sm: '10px',
      md: '12px',
      lg: '14px',
    },
    padding: {
      sm: '2px 4px',
      md: '2px 6px',
      lg: '4px 8px',
    },
  },
  colors: {
    unread: 'blue-500',
    mention: 'red-500',
    muted: 'gray-400',
  },
  animation: {
    duration: '200ms',
    easing: 'ease-out',
  },
}
```

---

This visual guide provides a comprehensive reference for implementing and using unread indicators throughout nself-chat. Refer to component documentation for detailed API information.
