# Accessibility Guide

Complete guide to accessibility features in nself-chat.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [User Settings](#user-settings)
4. [Keyboard Navigation](#keyboard-navigation)
5. [Screen Reader Support](#screen-reader-support)
6. [Visual Accessibility](#visual-accessibility)
7. [Motion & Animations](#motion--animations)
8. [Developer Guide](#developer-guide)
9. [Testing](#testing)
10. [WCAG Compliance](#wcag-compliance)

---

## Overview

nself-chat is built with accessibility as a core feature, not an afterthought. We follow WCAG 2.1 Level AA guidelines and strive to make the application usable by everyone.

### Key Principles

- **Perceivable**: Information and UI components must be presentable to users in ways they can perceive
- **Operable**: UI components and navigation must be operable
- **Understandable**: Information and UI operation must be understandable
- **Robust**: Content must be robust enough to be interpreted by a wide variety of user agents

---

## Features

### Complete Accessibility Support

- ✅ **Keyboard Navigation**: Full keyboard support with logical tab order
- ✅ **Screen Reader**: Comprehensive ARIA labels and live regions
- ✅ **High Contrast**: Enhanced contrast mode for visual clarity
- ✅ **Font Scaling**: Adjustable text size (87.5% to 125%)
- ✅ **Color Blind Modes**: Support for protanopia, deuteranopia, tritanopia, and monochrome
- ✅ **Reduced Motion**: Disable or reduce animations
- ✅ **Focus Indicators**: Visible focus outlines for keyboard navigation
- ✅ **Skip Links**: Quick navigation to main content
- ✅ **Touch Targets**: Minimum 44×44px touch targets
- ✅ **Color Contrast**: WCAG AA compliant color ratios

---

## User Settings

### Accessing Accessibility Settings

1. **Keyboard Shortcut**: Press `Alt+A` to open the accessibility menu
2. **Menu**: Click the accessibility icon in the header
3. **Settings Page**: Navigate to Settings → Accessibility

### Visual Settings

#### High Contrast Mode

Increases the contrast between text and background colors for better readability.

**Enable**: Accessibility Menu → Visual → High Contrast Mode

**Effect**:
- Darker text on lighter backgrounds (light mode)
- Lighter text on darker backgrounds (dark mode)
- Removes transparency
- Thicker borders
- Heavier font weights

#### Font Size

Adjust the base font size throughout the application.

**Options**:
- **Small** (87.5%): Compact display
- **Medium** (100%): Default size
- **Large** (112.5%): Easier reading
- **Extra Large** (125%): Maximum accessibility

**Enable**: Accessibility Menu → Visual → Font Size

#### Color Blind Modes

Adjust colors for different types of color vision deficiency.

**Options**:
- **None**: Standard colors
- **Protanopia**: Red-blind simulation
- **Deuteranopia**: Green-blind simulation
- **Tritanopia**: Blue-blind simulation
- **Monochrome**: Grayscale only

**Enable**: Accessibility Menu → Visual → Color Blind Mode

**Additional Features**:
- Pattern overlays on status indicators
- Shape differentiation for important elements
- Text labels for color-coded information

### Motion Settings

#### Reduce Motion

Minimizes or disables animations and transitions.

**Enable**: Accessibility Menu → Motion → Reduce Motion

**Effect**:
- Instant transitions (no animation)
- No parallax effects
- No auto-scrolling
- Static backgrounds

**System Integration**: Automatically respects `prefers-reduced-motion` system setting

#### Animation Level

Fine-tune animation intensity.

**Options**:
- **Full Animations**: All effects enabled
- **Reduced Animations**: Essential animations only
- **No Animations**: Completely static

**Enable**: Accessibility Menu → Motion → Animation Level

### Navigation Settings

#### Keyboard-Only Mode

Optimize the interface for keyboard navigation.

**Enable**: Accessibility Menu → Navigation → Keyboard-Only Mode

**Features**:
- Enhanced focus indicators
- Visible tab order hints
- Keyboard shortcuts overlay
- Skip links always visible

#### Focus Indicators

Control the visibility of focus outlines.

**Enable**: Accessibility Menu → Navigation → Show Focus Indicators

**Options**:
- **Auto**: Show on keyboard navigation only
- **Always**: Always show focus outlines
- **Never**: Hide focus outlines (not recommended)

#### Skip Links

Quick navigation links at the top of the page.

**Enable**: Accessibility Menu → Navigation → Show Skip Links

**Available Skip Links**:
1. Skip to main content
2. Skip to navigation
3. Skip to message input
4. Skip to channel list

**Usage**: Press `Tab` when page loads to reveal skip links

### Screen Reader Settings

#### Screen Reader Mode

Optimize the interface for screen readers.

**Enable**: Accessibility Menu → Screen Reader → Screen Reader Mode

**Features**:
- Enhanced ARIA labels
- Descriptive landmarks
- Live region announcements
- Simplified navigation

#### Announce Notifications

Read out new notifications via screen reader.

**Enable**: Accessibility Menu → Screen Reader → Announce Notifications

**Announcements**:
- New messages
- User status changes
- System notifications
- Error messages

#### Announce Typing

Announce when other users are typing.

**Enable**: Accessibility Menu → Screen Reader → Announce Typing

**Example**: "John is typing..."

#### Verbose Descriptions

Provide detailed descriptions for UI elements.

**Enable**: Accessibility Menu → Screen Reader → Verbose Descriptions

**Effect**:
- Longer ARIA labels
- Contextual information
- State descriptions
- Relationship information

---

## Keyboard Navigation

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+A` | Open accessibility menu |
| `Ctrl/Cmd+K` | Open quick switcher |
| `Ctrl/Cmd+/` | Show keyboard shortcuts |
| `Alt+Up/Down` | Navigate channels |
| `Escape` | Close modal/dialog |
| `Tab` | Move to next element |
| `Shift+Tab` | Move to previous element |

### Channel Navigation

| Shortcut | Action |
|----------|--------|
| `Alt+Up` | Previous channel |
| `Alt+Down` | Next channel |
| `Ctrl/Cmd+Shift+K` | Channel search |
| `Alt+Shift+Up` | Previous unread |
| `Alt+Shift+Down` | Next unread |

### Message Navigation

| Shortcut | Action |
|----------|--------|
| `Up/Down` | Navigate messages |
| `Enter` | Reply to message |
| `E` | Edit message (if yours) |
| `R` | Add reaction |
| `T` | Start thread |
| `Del` | Delete message (if yours) |

### Composition

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+Enter` | Send message |
| `Shift+Enter` | New line |
| `Ctrl/Cmd+B` | Bold |
| `Ctrl/Cmd+I` | Italic |
| `Ctrl/Cmd+K` | Insert link |
| `@` | Mention user |
| `:` | Insert emoji |

### Focus Management

- Focus trap in modals and dialogs
- Automatic focus restoration
- Logical tab order
- Skip links for quick navigation

---

## Screen Reader Support

### Supported Screen Readers

- **NVDA** (Windows)
- **JAWS** (Windows)
- **VoiceOver** (macOS, iOS)
- **TalkBack** (Android)
- **Narrator** (Windows)

### ARIA Implementation

#### Landmarks

```html
<header role="banner">
<nav role="navigation" aria-label="Main navigation">
<main role="main" id="main-content">
<aside role="complementary">
<footer role="contentinfo">
```

#### Live Regions

```html
<div aria-live="polite" aria-atomic="true">
  <!-- Non-urgent announcements -->
</div>

<div aria-live="assertive" aria-atomic="true">
  <!-- Urgent announcements -->
</div>

<div role="log" aria-live="polite">
  <!-- Message log -->
</div>
```

#### Labels and Descriptions

```html
<button aria-label="Send message">
  <SendIcon />
</button>

<input
  aria-label="Message"
  aria-describedby="message-help"
/>
<span id="message-help">
  Type your message here
</span>
```

### Screen Reader Announcements

#### Message Events

- New message: "New message from [user]: [content]"
- Edit: "Message edited by [user]"
- Delete: "Message deleted"
- Reaction: "[User] reacted with [emoji]"

#### Status Changes

- User online: "[User] is now online"
- User away: "[User] is now away"
- Typing: "[User] is typing..."

#### System Events

- Channel change: "Switched to [channel]"
- Loading: "Loading messages..."
- Error: "Error: [message]"

---

## Visual Accessibility

### Color Contrast

All text meets WCAG AA requirements:

- **Normal text**: 4.5:1 contrast ratio
- **Large text**: 3:1 contrast ratio
- **UI components**: 3:1 contrast ratio

### Color Independence

Information is never conveyed by color alone:

- Status indicators use icons and text
- Errors have icons and borders
- Links are underlined
- Buttons have clear labels

### Focus Indicators

Visible focus outlines on all interactive elements:

- 2px solid outline
- High contrast color
- 2px offset
- Never hidden (except by user preference)

### Text Readability

- Minimum font size: 14px
- Line height: 1.5
- Letter spacing: Normal
- No justified text
- Clear hierarchies

---

## Motion & Animations

### Reduced Motion Support

Respects system preference and user settings:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Animation Levels

1. **Full**: All animations enabled
2. **Reduced**: Essential animations only
3. **None**: No animations

### Safe Animations

- No flashing content
- No rapid movements
- No parallax scrolling (when reduced motion)
- No auto-playing videos

---

## Developer Guide

### Using Accessibility Context

```tsx
import { useAccessibility } from '@/contexts/accessibility-context'

function MyComponent() {
  const { settings, updateSettings, announce } = useAccessibility()

  const handleAction = () => {
    // Do something
    announce('Action completed successfully')
  }

  return (
    <div data-reduced-motion={settings.reduceMotion}>
      {/* Content */}
    </div>
  )
}
```

### Using A11y Hooks

```tsx
import { useFocusTrap, useAnnouncer } from '@/hooks/use-a11y'

function Modal({ isOpen, onClose }) {
  const dialogRef = useFocusTrap(isOpen, {
    returnFocus: true,
    onEscape: onClose
  })

  const announce = useAnnouncer()

  useEffect(() => {
    if (isOpen) {
      announce('Modal opened')
    }
  }, [isOpen])

  return (
    <div ref={dialogRef} role="dialog">
      {/* Modal content */}
    </div>
  )
}
```

### Using Screen Reader Utilities

```tsx
import { announce, getMessageLabel } from '@/lib/a11y'

function MessageItem({ message }) {
  const label = getMessageLabel(
    message.content,
    message.author.name,
    message.timestamp,
    {
      isEdited: message.edited,
      hasAttachments: message.attachments?.length > 0
    }
  )

  return (
    <div aria-label={label}>
      {/* Message content */}
    </div>
  )
}
```

### Keyboard Navigation

```tsx
import { useArrowNavigation } from '@/hooks/use-a11y'

function ChannelList({ channels }) {
  const listRef = useRef(null)

  useArrowNavigation(listRef, {
    orientation: 'vertical',
    loop: true,
    onSelect: (element) => {
      // Navigate to channel
    }
  })

  return (
    <div ref={listRef} role="list">
      {channels.map(channel => (
        <a
          key={channel.id}
          href={`/channel/${channel.id}`}
          role="listitem"
        >
          {channel.name}
        </a>
      ))}
    </div>
  )
}
```

---

## Testing

### Manual Testing Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus is visible on all elements
- [ ] Skip links work correctly
- [ ] All images have alt text
- [ ] Forms have labels
- [ ] Error messages are associated with inputs
- [ ] Loading states are announced
- [ ] Color contrast meets WCAG AA
- [ ] Works with screen reader (test with NVDA or VoiceOver)

### Automated Testing

```bash
# Run accessibility tests
pnpm test:a11y

# Run with axe-core
pnpm test:axe

# Test keyboard navigation
pnpm test:keyboard
```

### Screen Reader Testing

1. Turn on screen reader (NVDA, VoiceOver, etc.)
2. Navigate with keyboard only
3. Verify all content is announced
4. Check live region announcements
5. Test form interactions
6. Verify modal focus trapping

---

## WCAG Compliance

### Level A (Required)

✅ All Level A criteria met

### Level AA (Target)

✅ All Level AA criteria met:
- 1.4.3 Contrast (Minimum)
- 1.4.5 Images of Text
- 2.4.6 Headings and Labels
- 2.4.7 Focus Visible
- 3.2.3 Consistent Navigation
- 3.2.4 Consistent Identification
- 3.3.3 Error Suggestion
- 3.3.4 Error Prevention

### Level AAA (Stretch Goal)

🎯 Working towards Level AAA compliance

---

## Resources

### External Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

### Internal Documentation

- [Component Library](/docs/components.md)
- [Keyboard Shortcuts](/docs/keyboard-shortcuts.md)
- [Theme Customization](/docs/theming.md)

---

**Last Updated**: February 1, 2026
**Version**: 0.9.0
