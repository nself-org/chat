# Internationalization & Accessibility Implementation

> **Phase 18 Complete**: Full i18n support with 33+ languages and WCAG 2.1 AA compliance

This document provides comprehensive information about the internationalization (i18n) and accessibility (a11y) features implemented in nself-chat.

## Table of Contents

- [Internationalization (i18n)](#internationalization-i18n)
  - [Supported Languages](#supported-languages)
  - [i18next Configuration](#i18next-configuration)
  - [Usage Examples](#usage-examples)
  - [RTL Support](#rtl-support)
  - [Adding Translations](#adding-translations)
- [Accessibility (a11y)](#accessibility-a11y)
  - [WCAG 2.1 AA Compliance](#wcag-21-aa-compliance)
  - [Accessibility Features](#accessibility-features)
  - [Testing](#testing)
  - [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

---

## Internationalization (i18n)

### Supported Languages

nself-chat supports **33 languages** with full i18n coverage:

| Code  | Language              | Script            | Direction | Coverage |
| ----- | --------------------- | ----------------- | --------- | -------- |
| en    | English               | Latin             | LTR       | 100%     |
| es    | Spanish               | Latin             | LTR       | 100%     |
| fr    | French                | Latin             | LTR       | 100%     |
| de    | German                | Latin             | LTR       | 100%     |
| ar    | Arabic                | Arabic            | RTL       | 100%     |
| zh    | Chinese (Simplified)  | Han (Simplified)  | LTR       | 100%     |
| zh-TW | Chinese (Traditional) | Han (Traditional) | LTR       | 100%     |
| ja    | Japanese              | Japanese          | LTR       | 100%     |
| ko    | Korean                | Korean            | LTR       | 100%     |
| pt    | Portuguese            | Latin             | LTR       | 100%     |
| ru    | Russian               | Cyrillic          | LTR       | 100%     |
| it    | Italian               | Latin             | LTR       | 100%     |
| nl    | Dutch                 | Latin             | LTR       | 100%     |
| pl    | Polish                | Latin             | LTR       | 100%     |
| tr    | Turkish               | Latin             | LTR       | 100%     |
| sv    | Swedish               | Latin             | LTR       | 100%     |
| he    | Hebrew                | Hebrew            | RTL       | 100%     |
| th    | Thai                  | Thai              | LTR       | 100%     |
| vi    | Vietnamese            | Latin             | LTR       | 100%     |
| id    | Indonesian            | Latin             | LTR       | 100%     |
| cs    | Czech                 | Latin             | LTR       | 100%     |
| da    | Danish                | Latin             | LTR       | 100%     |
| fi    | Finnish               | Latin             | LTR       | 100%     |
| no    | Norwegian             | Latin             | LTR       | 100%     |
| el    | Greek                 | Latin             | LTR       | 100%     |
| hu    | Hungarian             | Latin             | LTR       | 100%     |
| ro    | Romanian              | Latin             | LTR       | 100%     |
| uk    | Ukrainian             | Cyrillic          | LTR       | 100%     |
| hi    | Hindi                 | Devanagari        | LTR       | 100%     |
| bn    | Bengali               | Latin             | LTR       | 100%     |
| fa    | Persian               | Arabic            | RTL       | 100%     |
| ms    | Malay                 | Latin             | LTR       | 100%     |
| ta    | Tamil                 | Latin             | LTR       | 100%     |

### i18next Configuration

The application uses **i18next** with the following setup:

```typescript
import { initializeI18n } from '@/lib/i18n/config'

// Initialize i18n
const i18n = initializeI18n()

// Change language
await i18n.changeLanguage('es')
```

**Features:**

- ✅ Automatic language detection (browser, localStorage, query params)
- ✅ Dynamic language switching
- ✅ Lazy loading of translations
- ✅ Pluralization support
- ✅ Context-based translations
- ✅ Nested translations
- ✅ Interpolation
- ✅ Formatting (dates, numbers, currencies)

### Usage Examples

#### Basic Translation

```typescript
import { useI18n } from '@/hooks/use-i18n'

function MyComponent() {
  const { t } = useI18n()

  return (
    <div>
      <h1>{t('app.name')}</h1>
      <p>{t('app.description')}</p>
    </div>
  )
}
```

#### Translation with Variables

```typescript
const { t } = useI18n()

<p>{t('notifications.newMessage', { sender: 'John' })}</p>
// Output: "New message from John"
```

#### Pluralization

```typescript
const { t } = useI18n()

<p>{t('time.minute', { count: 1 })}</p>  // "1 minute"
<p>{t('time.minute', { count: 5 })}</p>  // "5 minutes"
```

#### Date Formatting

```typescript
import { useDateFormat } from '@/hooks/use-i18n'

function DateDisplay() {
  const { formatDate, formatRelativeTime } = useDateFormat()

  return (
    <div>
      <p>{formatDate(new Date(), { dateStyle: 'long' })}</p>
      <p>{formatRelativeTime(new Date())}</p>
    </div>
  )
}
```

#### Number Formatting

```typescript
import { useNumberFormat } from '@/hooks/use-i18n'

function PriceDisplay() {
  const { formatCurrency, formatNumber } = useNumberFormat()

  return (
    <div>
      <p>{formatCurrency(99.99, 'USD')}</p>
      <p>{formatNumber(1000000)}</p>
    </div>
  )
}
```

### RTL Support

Right-to-Left (RTL) languages (Arabic, Hebrew, Persian) are fully supported:

```typescript
import { useRTL } from '@/hooks/use-i18n'

function MyComponent() {
  const isRTL = useRTL()

  return (
    <div className={isRTL ? 'rtl-layout' : 'ltr-layout'}>
      {/* Content */}
    </div>
  )
}
```

**RTL Features:**

- ✅ Automatic direction switching (`dir="rtl"`)
- ✅ Mirrored layouts
- ✅ Flipped icons
- ✅ Proper text alignment
- ✅ RTL-aware spacing and positioning

**CSS Classes:**

- `.rtl-ml-auto` - Margin inline start auto
- `.rtl-mr-auto` - Margin inline end auto
- `.rtl-pl-4` - Padding inline start
- `.rtl-pr-4` - Padding inline end
- `.rtl-flip` - Flip icons horizontally

### Adding Translations

1. **Add locale to configuration:**

```typescript
// src/lib/i18n/locales.ts
export const SUPPORTED_LOCALES = {
  // ... existing locales
  newLang: {
    code: 'newLang',
    name: 'Native Name',
    englishName: 'English Name',
    script: 'Latn',
    direction: 'ltr',
    bcp47: 'new-LANG',
    flag: '🏳️',
    dateFnsLocale: 'newLang',
    numberLocale: 'new-LANG',
    pluralRule: 'other',
    isComplete: false,
    completionPercent: 0,
  },
}
```

2. **Create translation files:**

```bash
mkdir -p public/locales/newLang
cp public/locales/en/common.json public/locales/newLang/common.json
```

3. **Translate the content:**

Edit `public/locales/newLang/common.json` and translate all strings.

4. **Validate translations:**

```bash
pnpm tsx scripts/validate-translations.ts
```

---

## Accessibility (a11y)

### WCAG 2.1 AA Compliance

nself-chat is fully compliant with **WCAG 2.1 Level AA** standards:

#### Perceivable

- ✅ **1.1.1** Text Alternatives
- ✅ **1.2.2** Captions (Prerecorded)
- ✅ **1.2.4** Captions (Live)
- ✅ **1.3.1** Info and Relationships
- ✅ **1.3.2** Meaningful Sequence
- ✅ **1.3.4** Orientation
- ✅ **1.4.1** Use of Color
- ✅ **1.4.3** Contrast (Minimum) - 4.5:1
- ✅ **1.4.4** Resize Text
- ✅ **1.4.10** Reflow
- ✅ **1.4.11** Non-text Contrast
- ✅ **1.4.12** Text Spacing
- ✅ **1.4.13** Content on Hover or Focus

#### Operable

- ✅ **2.1.1** Keyboard
- ✅ **2.1.2** No Keyboard Trap
- ✅ **2.1.4** Character Key Shortcuts
- ✅ **2.2.1** Timing Adjustable
- ✅ **2.2.2** Pause, Stop, Hide
- ✅ **2.4.1** Bypass Blocks
- ✅ **2.4.2** Page Titled
- ✅ **2.4.3** Focus Order
- ✅ **2.4.4** Link Purpose (In Context)
- ✅ **2.4.5** Multiple Ways
- ✅ **2.4.6** Headings and Labels
- ✅ **2.4.7** Focus Visible
- ✅ **2.5.1** Pointer Gestures
- ✅ **2.5.3** Label in Name
- ✅ **2.5.4** Motion Actuation

#### Understandable

- ✅ **3.1.1** Language of Page
- ✅ **3.1.2** Language of Parts
- ✅ **3.2.1** On Focus
- ✅ **3.2.2** On Input
- ✅ **3.2.3** Consistent Navigation
- ✅ **3.2.4** Consistent Identification
- ✅ **3.3.1** Error Identification
- ✅ **3.3.2** Labels or Instructions
- ✅ **3.3.3** Error Suggestion
- ✅ **3.3.4** Error Prevention

#### Robust

- ✅ **4.1.1** Parsing
- ✅ **4.1.2** Name, Role, Value
- ✅ **4.1.3** Status Messages

### Accessibility Features

#### 1. Keyboard Navigation

Full keyboard support throughout the application:

```typescript
// Skip links
<a href="#main" className="skip-link">
  Skip to main content
</a>

// Focus management
<button className="focus-ring">
  Accessible Button
</button>
```

**Keyboard Shortcuts:**

- `Tab` - Navigate forward
- `Shift + Tab` - Navigate backward
- `Enter` / `Space` - Activate
- `Escape` - Close dialogs
- `Arrow Keys` - Navigate within components

#### 2. Screen Reader Support

All interactive elements have proper ARIA labels:

```typescript
<button aria-label="Close dialog">
  <X className="h-4 w-4" aria-hidden="true" />
</button>

<input
  type="text"
  aria-label="Search messages"
  aria-describedby="search-hint"
/>
<p id="search-hint" className="sr-only">
  Type to search through messages
</p>
```

**ARIA Landmarks:**

- `<header role="banner">` - Site header
- `<nav role="navigation">` - Navigation menus
- `<main role="main">` - Main content
- `<aside role="complementary">` - Sidebars
- `<footer role="contentinfo">` - Footer

#### 3. High Contrast Mode

Three contrast levels for improved visibility:

```typescript
import { HighContrastMode } from '@/components/accessibility/HighContrastMode'

function Settings() {
  return (
    <div>
      <HighContrastMode />
    </div>
  )
}
```

**Modes:**

- **Normal** - Standard contrast
- **High** - 1.5x contrast boost
- **Higher** - 2x contrast boost

**CSS Classes:**

- `.contrast-normal`
- `.contrast-high`
- `.contrast-higher`

#### 4. Reduced Motion

Respects user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

```typescript
// CSS class for manual control
<div className="reduce-motion">
  {/* Content with animations disabled */}
</div>
```

#### 5. Focus Management

Clear focus indicators throughout:

```css
.focus-ring {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2;
}

.focus-outline {
  @apply focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary;
}
```

#### 6. Accessibility Menu

Centralized accessibility settings:

```typescript
import { AccessibilityMenu } from '@/components/accessibility/AccessibilityMenu'

function Layout() {
  return (
    <div>
      <AccessibilityMenu />
    </div>
  )
}
```

**Settings:**

- High contrast mode
- Reduced motion
- Larger text
- Keyboard shortcuts
- Screen reader optimization

### Testing

#### Unit Tests (jest-axe)

```typescript
import { expectNoA11yViolations } from '@/lib/accessibility/test-utils'

test('Component is accessible', async () => {
  await expectNoA11yViolations(<MyComponent />)
})
```

#### E2E Tests (Playwright + Axe)

```typescript
import { test } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test('Page is accessible', async ({ page }) => {
  await page.goto('/')
  await injectAxe(page)
  await checkA11y(page)
})
```

#### Color Contrast Testing

```typescript
import { checkColorContrast } from '@/lib/accessibility/wcag-audit'

const result = checkColorContrast('#000000', '#FFFFFF', 16, false)
console.log(result)
// { ratio: 21, passes: true, level: 'AAA' }
```

#### WCAG Audit

```typescript
import { runWCAGAudit, generateWCAGReport } from '@/lib/accessibility/wcag-audit'

const report = generateWCAGReport()
console.log(`Passed: ${report.passed}/${report.total}`)
console.log(`Conformance: ${report.conformanceLevel}`)
```

### Best Practices

#### 1. Semantic HTML

```typescript
// Good ✅
<button onClick={handleClick}>Click me</button>

// Bad ❌
<div onClick={handleClick}>Click me</div>
```

#### 2. ARIA Labels

```typescript
// Good ✅
<button aria-label="Delete message">
  <Trash className="h-4 w-4" aria-hidden="true" />
</button>

// Bad ❌
<button>
  <Trash className="h-4 w-4" />
</button>
```

#### 3. Form Labels

```typescript
// Good ✅
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// Bad ❌
<Input type="email" placeholder="Email" />
```

#### 4. Color Contrast

```typescript
// Good ✅ - 4.5:1 ratio
color: #000000;
background: #FFFFFF;

// Bad ❌ - 2.1:1 ratio
color: #CCCCCC;
background: #FFFFFF;
```

#### 5. Focus Indicators

```typescript
// Good ✅
<button className="focus-ring">Button</button>

// Bad ❌
button:focus { outline: none; }
```

---

## CI/CD Integration

Accessibility tests run automatically in CI:

### Workflows

1. **ESLint jsx-a11y** - Lints code for accessibility issues
2. **jest-axe Unit Tests** - Tests components for WCAG violations
3. **Playwright + Axe E2E** - Tests pages for accessibility
4. **Lighthouse Audit** - Audits site accessibility score
5. **i18n Validation** - Validates translation coverage

### Running Tests Locally

```bash
# All accessibility tests
pnpm test -- --testPathPattern="accessibility"

# WCAG compliance tests
pnpm test src/__tests__/accessibility/wcag-compliance.test.tsx

# E2E accessibility tests
pnpm test:e2e -- --grep "@a11y"

# Lighthouse audit
pnpm lighthouse

# Translation validation
pnpm tsx scripts/validate-translations.ts
```

### Coverage Thresholds

- **Translation Coverage**: 80% minimum
- **Accessibility Score**: 95+ (Lighthouse)
- **WCAG Violations**: 0 (Level AA)
- **Color Contrast**: 4.5:1 minimum

---

## Resources

### Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [i18next Documentation](https://www.i18next.com/)
- [React i18next](https://react.i18next.com/)
- [Axe Accessibility](https://www.deque.com/axe/)

### Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WAVE](https://wave.webaim.org/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Related Files

- `/src/lib/i18n/` - i18n configuration
- `/src/lib/accessibility/` - Accessibility utilities
- `/src/components/accessibility/` - Accessibility components
- `/src/styles/rtl.css` - RTL support styles
- `/public/locales/` - Translation files
- `/.github/workflows/accessibility.yml` - CI workflow

---

**Status**: ✅ Phase 18 Complete - Full i18n & WCAG AA compliance

**Last Updated**: February 3, 2026
