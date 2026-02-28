# Accessibility Quick Reference

Quick reference card for implementing accessible features in nself-chat.

---

## 🚀 Quick Start

### 1. Import What You Need

```tsx
// Context
import { useAccessibility } from '@/contexts/accessibility-context'

// Hooks
import { useFocusTrap, useAnnouncer, useArrowNavigation } from '@/hooks/use-a11y'

// Utilities
import { announce, getMessageLabel, checkContrast } from '@/lib/a11y'
```

### 2. Common Patterns

#### Accessible Button

```tsx
// Icon-only button
<button aria-label="Send message">
  <SendIcon />
</button>

// With screen reader text
<button>
  <SendIcon />
  <span className="sr-only">Send message</span>
</button>
```

#### Accessible Form

```tsx
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : undefined}
/>
{error && <span id="email-error" role="alert">{error}</span>}
```

#### Accessible Modal

```tsx
const modalRef = useFocusTrap(isOpen, { returnFocus: true, onEscape: onClose })

return (
  <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="title">
    <h2 id="title">Modal Title</h2>
    {/* content */}
  </div>
)
```

#### List with Keyboard Navigation

```tsx
const listRef = useRef(null)
useArrowNavigation(listRef, { orientation: 'vertical', loop: true })

return (
  <div ref={listRef} role="list">
    {items.map((item, i) => (
      <a key={item.id} tabIndex={i === 0 ? 0 : -1}>
        {item.name}
      </a>
    ))}
  </div>
)
```

---

## 🎯 Checklist

### Every Component

- [ ] Semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)
- [ ] Proper ARIA labels
- [ ] Keyboard accessible
- [ ] Focus visible
- [ ] Color contrast ≥ 4.5:1
- [ ] Touch targets ≥ 44×44px

### Interactive Elements

- [ ] Has accessible name (label, aria-label, or aria-labelledby)
- [ ] Has appropriate role
- [ ] States communicated (aria-expanded, aria-pressed, etc.)
- [ ] Keyboard operable (Enter/Space for activation)

### Forms

- [ ] All inputs have labels
- [ ] Required fields marked with aria-required
- [ ] Errors linked with aria-describedby
- [ ] Error messages have role="alert"
- [ ] Loading states have aria-busy

### Modals/Dialogs

- [ ] Focus trap active
- [ ] Focus returns on close
- [ ] ESC key closes
- [ ] role="dialog" and aria-modal="true"
- [ ] Labeled with aria-labelledby

---

## 📝 Common ARIA Attributes

| Attribute          | Use Case                     | Example                                 |
| ------------------ | ---------------------------- | --------------------------------------- |
| `aria-label`       | Label for icon-only elements | `<button aria-label="Close">×</button>` |
| `aria-labelledby`  | Reference to label element   | `<dialog aria-labelledby="title">`      |
| `aria-describedby` | Additional description       | `<input aria-describedby="hint">`       |
| `aria-expanded`    | Expandable elements          | `<button aria-expanded={isOpen}>`       |
| `aria-pressed`     | Toggle buttons               | `<button aria-pressed={isActive}>`      |
| `aria-invalid`     | Form validation              | `<input aria-invalid={!!error}>`        |
| `aria-busy`        | Loading states               | `<div aria-busy={isLoading}>`           |
| `aria-live`        | Dynamic content              | `<div aria-live="polite">`              |
| `aria-hidden`      | Decorative elements          | `<span aria-hidden="true">🎉</span>`    |
| `aria-modal`       | Modal dialogs                | `<div role="dialog" aria-modal="true">` |

---

## 🎨 Color Contrast

### Check Contrast

```tsx
import { checkContrast, hexToRgb } from '@/lib/a11y'

const fg = hexToRgb('#333333')
const bg = hexToRgb('#FFFFFF')

const result = checkContrast(fg, bg, { fontSize: 16 })
// result.ratio: 12.63
// result.level: 'AAA'
// result.passes.AA: true
```

### Auto-Fix Contrast

```tsx
import { suggestAccessibleColor } from '@/lib/a11y'

const better = suggestAccessibleColor('#777777', '#FFFFFF', 4.5)
// Returns adjusted color that meets ratio
```

---

## ⌨️ Keyboard Shortcuts

### Global

| Shortcut          | Action                  |
| ----------------- | ----------------------- |
| `Alt+A`           | Open accessibility menu |
| `Tab`             | Next element            |
| `Shift+Tab`       | Previous element        |
| `Escape`          | Close modal/dialog      |
| `Enter` / `Space` | Activate button         |

### List Navigation

| Shortcut           | Action                     |
| ------------------ | -------------------------- |
| `Arrow Up/Down`    | Previous/Next item         |
| `Arrow Left/Right` | Previous/Next (horizontal) |
| `Home`             | First item                 |
| `End`              | Last item                  |
| `Enter` / `Space`  | Select item                |

---

## 🔊 Screen Reader

### Announcements

```tsx
import { announce } from '@/lib/a11y'

// Polite (wait for pause)
announce('Message sent')

// Assertive (interrupt immediately)
announce('Error occurred', 'assertive')
```

### Message Labels

```tsx
import { getMessageLabel } from '@/lib/a11y'

const label = getMessageLabel('Hello world', 'John Doe', new Date(), {
  isEdited: true,
  hasAttachments: true,
})
// "Message from John Doe, just now, edited, 1 attachment: Hello world"
```

---

## 🎯 Focus Management

### Focus Trap (Modal)

```tsx
const modalRef = useFocusTrap(isOpen, {
  returnFocus: true, // Return focus on close
  onEscape: onClose, // Close on ESC key
})
```

### Auto-Focus First Input

```tsx
const formRef = useRef(null)
useFocusFirstInput(formRef, true)
```

### Manual Focus

```tsx
import { focusElement } from '@/lib/a11y'

const handleOpen = () => {
  const element = document.getElementById('first-input')
  if (element) focusElement(element as HTMLElement)
}
```

---

## 🎨 Styling

### Screen Reader Only

```tsx
<span className="sr-only">Hidden from view but announced by screen readers</span>
```

### Focus Visible

```css
/* Automatic with :focus-visible */
button:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

### High Contrast

```tsx
const { settings } = useAccessibility()

<div data-high-contrast={settings.highContrast}>
  {/* Automatically styled via CSS */}
</div>
```

### Reduced Motion

```tsx
const prefersReducedMotion = usePrefersReducedMotion()

<motion.div
  animate={prefersReducedMotion ? {} : { scale: 1.1 }}
>
  {/* No animation if reduced motion */}
</motion.div>
```

---

## 🧪 Testing

### Quick Manual Test

1. **Keyboard Only**: Unplug mouse, navigate with Tab
2. **Screen Reader**: Enable NVDA/VoiceOver
3. **High Contrast**: Enable in accessibility menu
4. **Zoom**: Test at 200% zoom
5. **Mobile**: Test touch targets

### Automated Test

```bash
# Run accessibility tests
pnpm test:a11y

# Check specific file
pnpm test src/components/MyComponent.test.tsx
```

---

## 🚨 Common Mistakes

### ❌ Don't

```tsx
// Icon without label
<button><TrashIcon /></button>

// Click handler on div
<div onClick={handleClick}>Click me</div>

// Placeholder as label
<input placeholder="Email" />

// Color-only indicator
<span style={{ color: 'red' }}>Error</span>

// Missing alt text
<img src="photo.jpg" />
```

### ✅ Do

```tsx
// Icon with label
<button aria-label="Delete"><TrashIcon /></button>

// Use button element
<button onClick={handleClick}>Click me</button>

// Proper label
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Icon + text for errors
<span role="alert">
  <ErrorIcon /> Error: Invalid input
</span>

// Descriptive alt text
<img src="photo.jpg" alt="Team photo at 2026 retreat" />
```

---

## 📚 Resources

| Resource           | Link                                         |
| ------------------ | -------------------------------------------- |
| **Full Guide**     | `/docs/Accessibility-Guide.md`               |
| **Examples**       | `/src/components/accessibility/examples.tsx` |
| **WCAG 2.1**       | https://www.w3.org/WAI/WCAG21/quickref/      |
| **ARIA Practices** | https://www.w3.org/WAI/ARIA/apg/             |

---

## 🆘 Need Help?

1. Check `/docs/Accessibility-Guide.md`
2. Review `/src/components/accessibility/examples.tsx`
3. Test with screen reader
4. Ask team lead or accessibility expert

---

**Last Updated**: February 1, 2026
