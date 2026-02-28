# Internationalization and Accessibility Implementation Plan

**Version**: 0.9.1
**Date**: February 3, 2026
**Status**: Implementation Plan
**Tasks**: TODO.md #121, #122, #123 (Phase 18)

---

## Executive Summary

This document provides a comprehensive implementation plan for completing internationalization (i18n) and accessibility (a11y) features in nself-chat to production-ready status. The plan addresses:

- **Task 121**: Complete i18n translation coverage
- **Task 122**: Ensure WCAG AA accessibility compliance
- **Task 123**: Add accessibility tests to CI

### Current State Assessment

| Feature               | Current Status               | Target Status       |
| --------------------- | ---------------------------- | ------------------- |
| i18n Infrastructure   | 95% Complete                 | 100%                |
| Translation Coverage  | 60-100% (varies by language) | 100% all languages  |
| WCAG AA Compliance    | 70% Complete                 | 100%                |
| Accessibility Testing | Partial                      | Full CI Integration |

---

## Part 1: Internationalization (Task 121)

### 1.1 Current Implementation Analysis

#### Existing Infrastructure (Located in `/src/lib/i18n/`)

| File                   | Purpose                                    | Status   |
| ---------------------- | ------------------------------------------ | -------- |
| `translator.ts`        | Core translation engine with interpolation | Complete |
| `i18n-config.ts`       | Central configuration                      | Complete |
| `locales.ts`           | Locale registry with metadata              | Complete |
| `language-detector.ts` | Auto-detection from browser/cookies/URL    | Complete |
| `plurals.ts`           | CLDR-compliant pluralization               | Complete |
| `date-formats.ts`      | Date/time formatting                       | Complete |
| `number-formats.ts`    | Number/currency formatting                 | Complete |
| `rtl.ts`               | Right-to-left support                      | Complete |

#### Supported Languages Status

| Language             | Code | Translation Coverage  | RTL | Priority |
| -------------------- | ---- | --------------------- | --- | -------- |
| English              | `en` | 100% (6/6 namespaces) | No  | -        |
| German               | `de` | 100% (6/6 namespaces) | No  | -        |
| Japanese             | `ja` | 100% (6/6 namespaces) | No  | -        |
| Spanish              | `es` | 60% (3/6 namespaces)  | No  | HIGH     |
| French               | `fr` | 60% (3/6 namespaces)  | No  | HIGH     |
| Arabic               | `ar` | 40% (2/6 namespaces)  | Yes | HIGH     |
| Chinese (Simplified) | `zh` | 40% (2/6 namespaces)  | No  | MEDIUM   |
| Portuguese           | `pt` | 40% (2/6 namespaces)  | No  | MEDIUM   |
| Russian              | `ru` | 40% (2/6 namespaces)  | No  | MEDIUM   |

#### Translation Namespaces

| Namespace       | Keys | Purpose                                     |
| --------------- | ---- | ------------------------------------------- |
| `common.json`   | ~150 | General UI, buttons, navigation, validation |
| `chat.json`     | ~180 | Messages, channels, threads, reactions      |
| `settings.json` | ~140 | User preferences, profile, appearance       |
| `admin.json`    | ~160 | Dashboard, users, roles, analytics          |
| `auth.json`     | ~120 | Sign in/up, passwords, 2FA, SSO             |
| `errors.json`   | ~100 | Network, HTTP, validation, permissions      |

### 1.2 Translation Completion Plan

#### Phase A: Complete Partial Languages (Week 1-2)

**Spanish (es) - Missing Files:**

```
src/locales/es/
├── common.json    [EXISTS]
├── chat.json      [EXISTS]
├── settings.json  [EXISTS]
├── admin.json     [NEEDED] - ~160 keys
├── auth.json      [NEEDED] - ~120 keys
└── errors.json    [NEEDED] - ~100 keys
```

**French (fr) - Missing Files:**

```
src/locales/fr/
├── common.json    [EXISTS]
├── chat.json      [EXISTS]
├── settings.json  [EXISTS]
├── admin.json     [NEEDED] - ~160 keys
├── auth.json      [NEEDED] - ~120 keys
└── errors.json    [NEEDED] - ~100 keys
```

**Arabic (ar) - Missing Files + RTL Testing:**

```
src/locales/ar/
├── common.json    [EXISTS]
├── chat.json      [EXISTS]
├── settings.json  [NEEDED] - ~140 keys
├── admin.json     [NEEDED] - ~160 keys
├── auth.json      [NEEDED] - ~120 keys
└── errors.json    [NEEDED] - ~100 keys
```

**Chinese, Portuguese, Russian - Similar Pattern:**

- Each needs: `settings.json`, `admin.json`, `auth.json`, `errors.json`

#### Phase B: UI String Extraction Audit (Week 2)

1. **Automated String Extraction**

   ```bash
   # Create extraction script
   # Scans all .tsx/.ts files for hardcoded strings
   # Outputs report of strings needing extraction
   ```

2. **Component Audit Checklist**
   - [ ] All user-facing text uses `t()` function
   - [ ] Placeholder text is translated
   - [ ] Error messages use translation keys
   - [ ] Date/time displays use locale formatters
   - [ ] Numbers use locale formatters
   - [ ] Button labels are translated
   - [ ] Form labels and validation messages translated
   - [ ] Toast/notification messages translated
   - [ ] Modal titles and content translated
   - [ ] Empty states and loading states translated

3. **Areas Requiring Special Attention**
   ```
   src/components/setup/      # 9-step wizard
   src/components/chat/       # Core messaging UI
   src/components/admin/      # Admin dashboard
   src/components/settings/   # Settings pages
   src/components/auth/       # Auth flows
   src/app/                   # All pages
   ```

#### Phase C: Missing Translation Detection (Week 2)

**Implementation Strategy:**

```typescript
// src/lib/i18n/translation-validator.ts

export interface TranslationValidationResult {
  locale: string
  namespace: string
  missingKeys: string[]
  extraKeys: string[]
  totalKeys: number
  coverage: number
}

export function validateTranslations(
  baseLocale: string = 'en',
  targetLocale: string
): TranslationValidationResult[]

export function generateMissingKeysReport(): void
```

**CI Integration:**

```yaml
# .github/workflows/i18n-check.yml
- name: Check translation coverage
  run: pnpm run i18n:validate
  # Fails if any language < 100% coverage
```

#### Phase D: Translation Workflow (Ongoing)

1. **Contributor Workflow**

   ```
   1. Fork repository
   2. Copy English file as template
   3. Translate keys
   4. Run validation: pnpm i18n:validate
   5. Submit PR
   6. Native speaker review
   7. Merge
   ```

2. **Translation Key Guidelines**
   - Use dot notation for nesting: `messages.new.title`
   - Use descriptive names: `button.sendMessage` not `btn1`
   - Group by feature: `chat.reactions.add`
   - Include context in key name when needed: `delete.confirmTitle`

3. **Quality Standards**
   - Native speaker review required
   - Context-aware translations
   - Consistent terminology (create glossary)
   - Proper pluralization
   - Natural language flow

### 1.3 RTL Support Implementation

#### Current State

- Basic RTL support exists in `src/lib/i18n/rtl.ts`
- Arabic locale configured with `direction: 'rtl'`
- CSS logical properties partially implemented

#### Required Enhancements

1. **CSS Updates for RTL**

   ```css
   /* src/styles/rtl.css - New file */

   [dir='rtl'] {
     /* Sidebar positioning */
     .sidebar {
       right: 0;
       left: auto;
     }

     /* Message alignment */
     .message-own {
       margin-left: 0;
       margin-right: auto;
     }

     /* Icon flipping */
     .icon-arrow,
     .icon-chevron {
       transform: scaleX(-1);
     }
   }
   ```

2. **Component Updates**
   - Audit all components for directional assumptions
   - Replace `left/right` with `start/end` in Tailwind
   - Use CSS logical properties: `margin-inline-start`

3. **Testing RTL**
   - Add E2E tests for Arabic layout
   - Verify sidebar positioning
   - Verify message alignment
   - Verify icon directions
   - Verify text alignment

### 1.4 Date/Time Formatting

#### Implementation Checklist

- [x] `formatDate()` with locale support
- [x] `formatTime()` with locale support
- [x] `formatRelativeTime()` for "2 hours ago"
- [x] `formatMessageTime()` smart formatting
- [ ] Calendar week start (Sunday vs Monday)
- [ ] 12-hour vs 24-hour preference per locale
- [ ] Date input components locale-aware

### 1.5 Number Formatting

#### Implementation Checklist

- [x] `formatNumber()` with locale separators
- [x] `formatCurrency()` with locale symbols
- [x] `formatBytes()` for file sizes
- [ ] `formatPercentage()` for analytics
- [ ] Ordinal numbers (1st, 2nd, 3rd)
- [ ] Number input components locale-aware

### 1.6 Pluralization Rules

#### CLDR Categories by Language

| Language | Categories                       |
| -------- | -------------------------------- |
| English  | one, other                       |
| French   | one, many, other                 |
| Russian  | one, few, many, other            |
| Arabic   | zero, one, two, few, many, other |
| Japanese | other (no plurals)               |
| Chinese  | other (no plurals)               |

#### Translation Pattern

```json
{
  "messages_zero": "No messages",
  "messages_one": "1 message",
  "messages_other": "{{count}} messages"
}
```

---

## Part 2: WCAG AA Compliance (Task 122)

### 2.1 WCAG 2.1 AA Requirements Overview

#### Perceivable (Guidelines 1.1-1.4)

| Criterion | Description                 | Status         | Priority |
| --------- | --------------------------- | -------------- | -------- |
| 1.1.1     | Non-text Content (alt text) | Partial        | HIGH     |
| 1.2.1     | Audio-only and Video-only   | Not Applicable | -        |
| 1.2.2     | Captions (Prerecorded)      | Planned        | MEDIUM   |
| 1.2.3     | Audio Description           | Not Applicable | -        |
| 1.3.1     | Info and Relationships      | Partial        | HIGH     |
| 1.3.2     | Meaningful Sequence         | Complete       | -        |
| 1.3.3     | Sensory Characteristics     | Complete       | -        |
| 1.3.4     | Orientation                 | Complete       | -        |
| 1.3.5     | Identify Input Purpose      | Partial        | MEDIUM   |
| 1.4.1     | Use of Color                | Partial        | HIGH     |
| 1.4.2     | Audio Control               | Not Applicable | -        |
| 1.4.3     | Contrast (Minimum) 4.5:1    | Partial        | HIGH     |
| 1.4.4     | Resize Text                 | Complete       | -        |
| 1.4.5     | Images of Text              | Complete       | -        |
| 1.4.10    | Reflow                      | Partial        | MEDIUM   |
| 1.4.11    | Non-text Contrast           | Partial        | HIGH     |
| 1.4.12    | Text Spacing                | Complete       | -        |
| 1.4.13    | Content on Hover or Focus   | Partial        | MEDIUM   |

#### Operable (Guidelines 2.1-2.5)

| Criterion | Description                | Status   | Priority |
| --------- | -------------------------- | -------- | -------- |
| 2.1.1     | Keyboard                   | Partial  | HIGH     |
| 2.1.2     | No Keyboard Trap           | Complete | -        |
| 2.1.4     | Character Key Shortcuts    | Complete | -        |
| 2.2.1     | Timing Adjustable          | Complete | -        |
| 2.2.2     | Pause, Stop, Hide          | Complete | -        |
| 2.3.1     | Three Flashes              | Complete | -        |
| 2.4.1     | Bypass Blocks (Skip Links) | Partial  | HIGH     |
| 2.4.2     | Page Titled                | Complete | -        |
| 2.4.3     | Focus Order                | Partial  | HIGH     |
| 2.4.4     | Link Purpose               | Partial  | MEDIUM   |
| 2.4.5     | Multiple Ways              | Complete | -        |
| 2.4.6     | Headings and Labels        | Partial  | MEDIUM   |
| 2.4.7     | Focus Visible              | Complete | -        |
| 2.5.1     | Pointer Gestures           | Complete | -        |
| 2.5.2     | Pointer Cancellation       | Complete | -        |
| 2.5.3     | Label in Name              | Partial  | MEDIUM   |
| 2.5.4     | Motion Actuation           | Complete | -        |

#### Understandable (Guidelines 3.1-3.3)

| Criterion | Description               | Status   | Priority |
| --------- | ------------------------- | -------- | -------- |
| 3.1.1     | Language of Page          | Complete | -        |
| 3.1.2     | Language of Parts         | Partial  | MEDIUM   |
| 3.2.1     | On Focus                  | Complete | -        |
| 3.2.2     | On Input                  | Complete | -        |
| 3.2.3     | Consistent Navigation     | Complete | -        |
| 3.2.4     | Consistent Identification | Complete | -        |
| 3.3.1     | Error Identification      | Partial  | HIGH     |
| 3.3.2     | Labels or Instructions    | Partial  | HIGH     |
| 3.3.3     | Error Suggestion          | Partial  | HIGH     |
| 3.3.4     | Error Prevention          | Partial  | MEDIUM   |

#### Robust (Guideline 4.1)

| Criterion | Description       | Status   | Priority |
| --------- | ----------------- | -------- | -------- |
| 4.1.1     | Parsing           | Complete | -        |
| 4.1.2     | Name, Role, Value | Partial  | HIGH     |
| 4.1.3     | Status Messages   | Partial  | HIGH     |

### 2.2 Color Contrast Requirements

#### Minimum Ratios (WCAG AA)

| Element Type       | Minimum Ratio | Current | Status       |
| ------------------ | ------------- | ------- | ------------ |
| Normal Text        | 4.5:1         | Varies  | Audit Needed |
| Large Text (18px+) | 3:1           | Varies  | Audit Needed |
| UI Components      | 3:1           | Varies  | Audit Needed |
| Graphical Objects  | 3:1           | Varies  | Audit Needed |

#### Implementation Tasks

1. **Audit Theme Presets**

   ```typescript
   // Script to audit all 25+ theme presets
   // src/scripts/audit-contrast.ts

   import { themePresets } from '@/lib/theme-presets'
   import { getContrastRatio } from '@/lib/a11y/color-contrast'

   function auditThemes(): ContrastReport[]
   ```

2. **Fix Non-Compliant Themes**
   - Adjust text colors where contrast < 4.5:1
   - Adjust UI component colors where contrast < 3:1
   - Document any exceptions with justification

3. **Contrast Checking Utilities**
   - Already implemented in `src/lib/a11y/color-contrast.ts`
   - Includes: `meetsWCAG_AA()`, `meetsWCAG_AAA()`, `adjustColorForContrast()`

### 2.3 Keyboard Navigation

#### Current Implementation

| Feature               | Location                                        | Status   |
| --------------------- | ----------------------------------------------- | -------- |
| Focus trap for modals | `src/hooks/use-a11y.ts`                         | Complete |
| Arrow key navigation  | `src/lib/accessibility/use-roving-tabindex.ts`  | Complete |
| Skip links            | `src/components/accessibility/skip-links.tsx`   | Partial  |
| Focus management      | `src/lib/accessibility/use-focus-management.ts` | Complete |

#### Required Enhancements

1. **Skip Links**

   ```tsx
   // src/components/accessibility/skip-links.tsx

   export function SkipLinks() {
     return (
       <div className="skip-links">
         <a href="#main-content" className="skip-link">
           Skip to main content
         </a>
         <a href="#channel-list" className="skip-link">
           Skip to channels
         </a>
         <a href="#message-input" className="skip-link">
           Skip to message input
         </a>
       </div>
     )
   }
   ```

2. **Keyboard Shortcuts Documentation**
   - Already have settings page at `/settings/accessibility`
   - Need to ensure all shortcuts are documented
   - Need to allow shortcut customization

3. **Focus Order Audit**
   - Audit all pages for logical tab order
   - Fix any focus order issues
   - Ensure modals trap focus correctly

### 2.4 Screen Reader Support

#### Current Implementation

| Feature         | Location                                 | Status   |
| --------------- | ---------------------------------------- | -------- |
| Live regions    | `src/lib/a11y/screen-reader.ts`          | Complete |
| ARIA labels     | Partial throughout components            | Partial  |
| Role attributes | Partial throughout components            | Partial  |
| Announcements   | `src/lib/accessibility/use-announcer.ts` | Complete |

#### Required Enhancements

1. **Landmark Roles**

   ```tsx
   // Ensure proper landmarks in layout
   <header role="banner">...</header>
   <nav role="navigation">...</nav>
   <main role="main" id="main-content">...</main>
   <aside role="complementary">...</aside>
   <footer role="contentinfo">...</footer>
   ```

2. **ARIA Labels Audit**
   - Icon-only buttons must have `aria-label`
   - Form inputs must have associated labels
   - Interactive elements need accessible names
   - Status indicators need text alternatives

3. **Live Regions for Dynamic Content**

   ```tsx
   // New messages announcement
   <div aria-live="polite" aria-atomic="false">
     {/* Announce new messages */}
   </div>

   // Error announcements
   <div aria-live="assertive" aria-atomic="true">
     {/* Announce errors */}
   </div>
   ```

### 2.5 Focus Management

#### Current Implementation

Already well-implemented in:

- `src/lib/accessibility/use-focus-management.ts`
- `src/contexts/accessibility-context.tsx`
- `src/styles/accessibility.css`

#### Required Enhancements

1. **Focus Visible Styling**

   ```css
   /* Already in accessibility.css - verify consistency */
   :focus-visible {
     outline: 2px solid var(--ring);
     outline-offset: 2px;
   }
   ```

2. **Focus Restoration**
   - After modal closes, return focus to trigger
   - After navigation, focus page heading
   - After form submission, focus feedback message

### 2.6 Error Identification

#### Implementation Requirements

1. **Form Validation Errors**

   ```tsx
   // Error must be:
   // 1. Visually indicated (not just color)
   // 2. Programmatically associated with field
   // 3. Announced to screen readers

   ;<input id="email" aria-invalid={!!error} aria-describedby={error ? 'email-error' : undefined} />
   {
     error && (
       <div id="email-error" role="alert" className="error-message">
         <ErrorIcon aria-hidden="true" />
         <span>{error}</span>
       </div>
     )
   }
   ```

2. **Status Messages**

   ```tsx
   // Success messages
   <div role="status" aria-live="polite">
     Settings saved successfully
   </div>

   // Error messages
   <div role="alert" aria-live="assertive">
     Failed to send message. Please try again.
   </div>
   ```

### 2.7 Semantic HTML

#### Audit Checklist

- [ ] Headings in proper hierarchy (h1 -> h2 -> h3)
- [ ] Lists use `<ul>`, `<ol>`, `<dl>`
- [ ] Tables have proper headers and scope
- [ ] Forms have proper labels
- [ ] Buttons vs links used appropriately
- [ ] Regions have proper landmarks

### 2.8 Component Accessibility Audit

#### High-Priority Components

| Component    | Location                  | Issues            | Fix Priority |
| ------------ | ------------------------- | ----------------- | ------------ |
| MessageInput | `src/components/chat/`    | Label association | HIGH         |
| ChannelList  | `src/components/channel/` | ARIA tree role    | HIGH         |
| MessageList  | `src/components/chat/`    | Live region setup | HIGH         |
| EmojiPicker  | `src/components/emoji/`   | Keyboard nav      | MEDIUM       |
| UserMenu     | `src/components/user/`    | Menu role         | MEDIUM       |
| Modal        | `src/components/ui/`      | Focus trap        | Complete     |
| Toast        | `src/components/ui/`      | Live region       | Complete     |

---

## Part 3: Accessibility Testing (Task 123)

### 3.1 Automated Testing Strategy

#### Testing Tools

| Tool                   | Purpose                | Integration       |
| ---------------------- | ---------------------- | ----------------- |
| axe-core               | Automated a11y testing | Jest + Playwright |
| @axe-core/playwright   | E2E a11y testing       | Playwright        |
| jest-axe               | Unit test a11y         | Jest              |
| eslint-plugin-jsx-a11y | Static analysis        | ESLint            |
| Lighthouse             | Performance + a11y     | CI/CD             |

#### Package Installation

```bash
# Already installed
@axe-core/playwright: ^4.10.2

# Need to add
pnpm add -D jest-axe @types/jest-axe eslint-plugin-jsx-a11y
```

### 3.2 Jest Accessibility Tests

#### Test Setup

```typescript
// src/test/setup-a11y.ts
import { toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)
```

#### Component Test Pattern

```typescript
// src/components/ui/__tests__/button.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Button } from '../button';

describe('Button Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible name when icon-only', async () => {
    const { container } = render(
      <Button aria-label="Settings">
        <SettingsIcon aria-hidden="true" />
      </Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 3.3 Playwright Accessibility Tests

#### E2E Test Pattern

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility', () => {
  test('home page should have no accessibility violations', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('chat page should have no accessibility violations', async ({ page }) => {
    await page.goto('/chat')
    await page.waitForSelector('[data-testid="message-list"]')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.third-party-widget') // Exclude third-party content
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should be navigable by keyboard only', async ({ page }) => {
    await page.goto('/chat')

    // Tab through main elements
    await page.keyboard.press('Tab') // Skip link
    await page.keyboard.press('Enter') // Activate skip link

    const focused = await page.evaluate(() => document.activeElement?.id)
    expect(focused).toBe('main-content')
  })
})
```

### 3.4 ESLint Configuration

```json
// .eslintrc.json additions
{
  "extends": ["plugin:jsx-a11y/recommended"],
  "rules": {
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/anchor-has-content": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-proptypes": "error",
    "jsx-a11y/aria-unsupported-elements": "error",
    "jsx-a11y/click-events-have-key-events": "warn",
    "jsx-a11y/heading-has-content": "error",
    "jsx-a11y/html-has-lang": "error",
    "jsx-a11y/img-redundant-alt": "error",
    "jsx-a11y/interactive-supports-focus": "error",
    "jsx-a11y/label-has-associated-control": "error",
    "jsx-a11y/no-access-key": "error",
    "jsx-a11y/no-autofocus": "warn",
    "jsx-a11y/no-noninteractive-element-interactions": "warn",
    "jsx-a11y/no-redundant-roles": "error",
    "jsx-a11y/role-has-required-aria-props": "error",
    "jsx-a11y/role-supports-aria-props": "error",
    "jsx-a11y/tabindex-no-positive": "error"
  }
}
```

### 3.5 CI/CD Integration

#### GitHub Actions Workflow

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  a11y-lint:
    name: Accessibility Linting
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9.15.4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
        # Includes jsx-a11y rules

  a11y-unit:
    name: Accessibility Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9.15.4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test -- --testPathPattern="a11y"

  a11y-e2e:
    name: Accessibility E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9.15.4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: npx playwright install --with-deps
      - run: pnpm build
      - run: pnpm test:e2e -- --grep "@a11y"

  lighthouse:
    name: Lighthouse Accessibility Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9.15.4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v11
        with:
          configPath: '.lighthouserc.json'
          uploadArtifacts: true
```

### 3.6 Manual Testing Checklist

#### Screen Reader Testing

| Screen Reader | Browser           | Status      |
| ------------- | ----------------- | ----------- |
| VoiceOver     | Safari (macOS)    | Required    |
| VoiceOver     | Safari (iOS)      | Required    |
| NVDA          | Firefox (Windows) | Required    |
| JAWS          | Chrome (Windows)  | Recommended |
| TalkBack      | Chrome (Android)  | Required    |

#### Manual Test Script

```markdown
## Screen Reader Test Script

### Page Load

1. [ ] Page title is announced
2. [ ] Main landmarks are identified
3. [ ] Skip link is first focusable element

### Navigation

1. [ ] All interactive elements are reachable via Tab
2. [ ] Tab order is logical
3. [ ] Focus indicator is visible
4. [ ] Skip links work correctly

### Messages

1. [ ] New messages are announced
2. [ ] Message content is readable
3. [ ] Reactions are announced
4. [ ] Timestamps are readable

### Forms

1. [ ] Labels are associated with inputs
2. [ ] Required fields are indicated
3. [ ] Error messages are announced
4. [ ] Success messages are announced

### Modals/Dialogs

1. [ ] Focus moves to modal on open
2. [ ] Focus is trapped within modal
3. [ ] Escape closes modal
4. [ ] Focus returns to trigger on close
```

#### Keyboard-Only Testing

```markdown
## Keyboard Testing Checklist

### Global

- [ ] Tab navigates forward through page
- [ ] Shift+Tab navigates backward
- [ ] Enter activates buttons/links
- [ ] Space activates buttons/checkboxes
- [ ] Escape closes modals/menus

### Menus

- [ ] Arrow keys navigate menu items
- [ ] Enter selects item
- [ ] Escape closes menu
- [ ] Home/End jump to first/last item

### Lists

- [ ] Arrow keys navigate items
- [ ] Enter activates item
- [ ] Type-ahead search works

### Chat

- [ ] Can compose message
- [ ] Can send with Enter/Cmd+Enter
- [ ] Can navigate message history
- [ ] Can react with keyboard
```

---

## Part 4: Implementation Timeline

### Sprint 1 (Week 1-2): Translation Completion

| Task                             | Effort | Assignee | Status  |
| -------------------------------- | ------ | -------- | ------- |
| Complete Spanish translations    | 3 days | -        | Pending |
| Complete French translations     | 3 days | -        | Pending |
| Complete Arabic translations     | 4 days | -        | Pending |
| Complete Chinese translations    | 3 days | -        | Pending |
| Complete Portuguese translations | 3 days | -        | Pending |
| Complete Russian translations    | 3 days | -        | Pending |
| UI string extraction audit       | 2 days | -        | Pending |
| Translation validation CI        | 1 day  | -        | Pending |

### Sprint 2 (Week 3-4): Accessibility Compliance

| Task                      | Effort | Assignee | Status  |
| ------------------------- | ------ | -------- | ------- |
| Color contrast audit      | 2 days | -        | Pending |
| Theme fixes for contrast  | 3 days | -        | Pending |
| Skip links implementation | 1 day  | -        | Pending |
| Keyboard navigation audit | 2 days | -        | Pending |
| ARIA labels audit         | 3 days | -        | Pending |
| Screen reader testing     | 2 days | -        | Pending |
| Form accessibility fixes  | 2 days | -        | Pending |

### Sprint 3 (Week 5-6): Testing Infrastructure

| Task                      | Effort   | Assignee | Status  |
| ------------------------- | -------- | -------- | ------- |
| jest-axe setup            | 0.5 days | -        | Pending |
| Component a11y tests      | 3 days   | -        | Pending |
| Playwright a11y tests     | 2 days   | -        | Pending |
| ESLint jsx-a11y config    | 0.5 days | -        | Pending |
| CI workflow setup         | 1 day    | -        | Pending |
| Lighthouse CI setup       | 0.5 days | -        | Pending |
| Manual test documentation | 1 day    | -        | Pending |

---

## Part 5: Success Criteria

### Task 121: i18n Translation Coverage

- [ ] All 9 languages have 100% translation coverage
- [ ] All 6 namespaces complete for each language
- [ ] UI string extraction audit shows 0 hardcoded strings
- [ ] Translation validation CI passes
- [ ] RTL layout fully functional for Arabic
- [ ] Date/time formatting works for all locales
- [ ] Number formatting works for all locales
- [ ] Pluralization works for all locales

### Task 122: WCAG AA Compliance

- [ ] All color contrast ratios meet AA requirements (4.5:1 text, 3:1 UI)
- [ ] All interactive elements keyboard accessible
- [ ] All images have alt text
- [ ] All forms have proper labels
- [ ] All errors identified programmatically
- [ ] Focus order is logical
- [ ] Focus indicators visible
- [ ] Skip links functional
- [ ] Screen reader testing passed on VoiceOver, NVDA, TalkBack

### Task 123: Accessibility Tests in CI

- [ ] jest-axe tests for all UI components
- [ ] Playwright a11y tests for all pages
- [ ] ESLint jsx-a11y rules passing
- [ ] Lighthouse accessibility score >= 90
- [ ] CI workflow running on all PRs
- [ ] Manual testing checklist completed

---

## Part 6: Documentation Deliverables

### Developer Documentation

1. **Accessibility Guidelines** (`/docs/accessibility.md`)
   - Component accessibility patterns
   - ARIA usage guide
   - Keyboard interaction patterns
   - Testing guide

2. **Translation Guide** (`/docs/translation-guide.md`)
   - How to contribute translations
   - Key naming conventions
   - Pluralization rules
   - Review process

3. **RTL Development Guide** (`/docs/rtl-guide.md`)
   - CSS patterns for RTL
   - Component considerations
   - Testing RTL layouts

### QA Documentation

1. **Manual Testing Scripts** (`/docs/qa/accessibility-testing.md`)
   - Screen reader test scripts
   - Keyboard test scripts
   - Mobile accessibility tests

2. **Compliance Checklist** (`/docs/qa/wcag-checklist.md`)
   - Full WCAG 2.1 AA checklist with status

---

## Appendix A: File Locations Reference

### i18n Files

```
src/lib/i18n/
├── index.ts                 # Main exports
├── i18n-config.ts          # Configuration
├── translator.ts           # Translation engine
├── locales.ts              # Locale registry
├── language-detector.ts    # Detection logic
├── plurals.ts              # Pluralization
├── date-formats.ts         # Date formatting
├── number-formats.ts       # Number formatting
├── rtl.ts                  # RTL support
└── __tests__/              # Tests

src/locales/
├── en/                     # English (complete)
├── de/                     # German (complete)
├── ja/                     # Japanese (complete)
├── es/                     # Spanish (partial)
├── fr/                     # French (partial)
├── ar/                     # Arabic (partial, RTL)
├── zh/                     # Chinese (partial)
├── pt/                     # Portuguese (partial)
└── ru/                     # Russian (partial)

src/hooks/
├── use-translation.ts      # Translation hook
└── use-locale.ts           # Locale hook

src/stores/
└── locale-store.ts         # Zustand store
```

### Accessibility Files

```
src/lib/accessibility/
├── index.ts                # Main exports
├── a11y-store.ts          # Settings store
├── a11y-utils.ts          # Utilities
├── use-announcer.ts       # Screen reader announcements
├── use-focus-management.ts # Focus utilities
├── use-reduced-motion.ts  # Motion preferences
└── use-roving-tabindex.ts # Keyboard navigation

src/lib/a11y/
├── index.ts               # Alternate exports
├── announcer.ts           # Announcements
├── color-contrast.ts      # Contrast checking
├── focus-manager.ts       # Focus management
├── keyboard-nav.ts        # Keyboard navigation
├── keyboard-navigation.ts # Additional nav
├── reduced-motion.ts      # Motion utilities
└── screen-reader.ts       # SR utilities

src/contexts/
└── accessibility-context.tsx # React context

src/hooks/
├── use-a11y.ts            # A11y hooks
└── use-focus-management.ts # Focus hooks

src/styles/
└── accessibility.css      # A11y styles

src/components/accessibility/
├── AccessibilityMenu.tsx  # Settings menu
├── AccessibilityProvider.tsx # Provider
├── accessible-icon.tsx    # Icon wrapper
├── focus-trap.tsx         # Focus trap
├── live-region.tsx        # Live region
├── skip-links.tsx         # Skip links
└── visually-hidden.tsx    # SR-only text

src/app/settings/accessibility/
└── page.tsx               # Settings page
```

---

## Appendix B: Translation Key Naming Convention

```
# General pattern
{namespace}.{feature}.{element}.{variant}

# Examples
common.buttons.save
common.buttons.cancel
common.buttons.delete

chat.messages.send
chat.messages.edit
chat.messages.delete

chat.channels.create.title
chat.channels.create.description
chat.channels.create.submitButton

errors.network.offline
errors.network.timeout
errors.validation.required
errors.validation.email

auth.signIn.title
auth.signIn.emailLabel
auth.signIn.passwordLabel
auth.signIn.submitButton
auth.signIn.forgotPassword

# Pluralization
chat.messages.count_zero
chat.messages.count_one
chat.messages.count_other

# With context
common.greeting_morning
common.greeting_afternoon
common.greeting_evening
```

---

## Appendix C: Accessibility Testing Matrix

| Page         | Automated (axe) | Keyboard | VoiceOver | NVDA | TalkBack |
| ------------ | --------------- | -------- | --------- | ---- | -------- |
| Home         | [ ]             | [ ]      | [ ]       | [ ]  | [ ]      |
| Login        | [ ]             | [ ]      | [ ]       | [ ]  | [ ]      |
| Signup       | [ ]             | [ ]      | [ ]       | [ ]  | [ ]      |
| Chat         | [ ]             | [ ]      | [ ]       | [ ]  | [ ]      |
| Settings     | [ ]             | [ ]      | [ ]       | [ ]  | [ ]      |
| Admin        | [ ]             | [ ]      | [ ]       | [ ]  | [ ]      |
| Setup Wizard | [ ]             | [ ]      | [ ]       | [ ]  | [ ]      |

---

**Document maintained by**: nself-chat team
**Last updated**: February 3, 2026
**Next review**: Before v0.9.1 release
