# Internationalization Quick Reference

> Quick reference for using i18n features in nself-chat

## Quick Start

### 1. Use Translation Hook

```typescript
import { useI18n } from '@/hooks/use-i18n'

function MyComponent() {
  const { t, locale, setLocale } = useI18n()

  return (
    <div>
      <h1>{t('app.name')}</h1>
      <button onClick={() => setLocale('es')}>
        Switch to Spanish
      </button>
    </div>
  )
}
```

### 2. Translate with Variables

```typescript
const { t } = useI18n()

// Simple interpolation
t('notifications.newMessage', { sender: 'Alice' })
// → "New message from Alice"

// With count (pluralization)
t('time.minutes', { count: 5 })
// → "5 minutes"
```

### 3. Format Dates

```typescript
import { useDateFormat } from '@/hooks/use-i18n'

function DateDisplay({ date }) {
  const { formatDate, formatRelativeTime } = useDateFormat()

  return (
    <div>
      {/* Full date */}
      <p>{formatDate(date, { dateStyle: 'full' })}</p>

      {/* Relative time */}
      <time>{formatRelativeTime(date)}</time>
    </div>
  )
}
```

### 4. Format Numbers

```typescript
import { useNumberFormat } from '@/hooks/use-i18n'

function PriceTag({ amount }) {
  const { formatCurrency, formatNumber, formatPercent } = useNumberFormat()

  return (
    <div>
      <p>{formatCurrency(amount, 'USD')}</p>
      <p>{formatNumber(1000000)}</p>
      <p>{formatPercent(0.15, 2)}</p>
    </div>
  )
}
```

### 5. Handle RTL Languages

```typescript
import { useRTL } from '@/hooks/use-i18n'

function Layout({ children }) {
  const isRTL = useRTL()

  return (
    <div className={isRTL ? 'flex-row-reverse' : 'flex-row'}>
      {children}
    </div>
  )
}
```

## Language Switcher Component

```typescript
import { useI18n } from '@/hooks/use-i18n'
import { LOCALE_CODES, getLocaleConfig } from '@/lib/i18n/locales'

function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      {LOCALE_CODES.map((code) => {
        const config = getLocaleConfig(code)
        return (
          <option key={code} value={code}>
            {config?.flag} {config?.name}
          </option>
        )
      })}
    </select>
  )
}
```

## Common Translation Keys

```typescript
// Navigation
t('nav.home') // "Home"
t('nav.chat') // "Chat"
t('nav.settings') // "Settings"

// Auth
t('auth.signIn') // "Sign In"
t('auth.signUp') // "Sign Up"
t('auth.logout') // "Logout"

// Common actions
t('common.save') // "Save"
t('common.cancel') // "Cancel"
t('common.delete') // "Delete"
t('common.edit') // "Edit"

// Chat
t('chat.newMessage') // "New Message"
t('chat.typeMessage') // "Type a message..."
t('chat.send') // "Send"

// Time
t('time.now') // "Now"
t('time.today') // "Today"
t('time.yesterday') // "Yesterday"

// Errors
t('errors.somethingWentWrong') // "Something went wrong"
t('errors.tryAgain') // "Try again"
```

## Supported Languages (33)

| Flag | Code  | Language              | Direction |
| ---- | ----- | --------------------- | --------- |
| 🇺🇸   | en    | English               | LTR       |
| 🇪🇸   | es    | Spanish               | LTR       |
| 🇫🇷   | fr    | French                | LTR       |
| 🇩🇪   | de    | German                | LTR       |
| 🇸🇦   | ar    | Arabic                | RTL       |
| 🇨🇳   | zh    | Chinese (Simplified)  | LTR       |
| 🇹🇼   | zh-TW | Chinese (Traditional) | LTR       |
| 🇯🇵   | ja    | Japanese              | LTR       |
| 🇰🇷   | ko    | Korean                | LTR       |
| 🇧🇷   | pt    | Portuguese            | LTR       |
| 🇷🇺   | ru    | Russian               | LTR       |
| 🇮🇹   | it    | Italian               | LTR       |
| 🇳🇱   | nl    | Dutch                 | LTR       |
| 🇵🇱   | pl    | Polish                | LTR       |
| 🇹🇷   | tr    | Turkish               | LTR       |
| 🇸🇪   | sv    | Swedish               | LTR       |
| 🇮🇱   | he    | Hebrew                | RTL       |
| 🇹🇭   | th    | Thai                  | LTR       |
| 🇻🇳   | vi    | Vietnamese            | LTR       |
| 🇮🇩   | id    | Indonesian            | LTR       |
| 🇨🇿   | cs    | Czech                 | LTR       |
| 🇩🇰   | da    | Danish                | LTR       |
| 🇫🇮   | fi    | Finnish               | LTR       |
| 🇳🇴   | no    | Norwegian             | LTR       |
| 🇬🇷   | el    | Greek                 | LTR       |
| 🇭🇺   | hu    | Hungarian             | LTR       |
| 🇷🇴   | ro    | Romanian              | LTR       |
| 🇺🇦   | uk    | Ukrainian             | LTR       |
| 🇮🇳   | hi    | Hindi                 | LTR       |
| 🇧🇩   | bn    | Bengali               | LTR       |
| 🇮🇷   | fa    | Persian               | RTL       |
| 🇲🇾   | ms    | Malay                 | LTR       |
| 🇮🇳   | ta    | Tamil                 | LTR       |

## RTL CSS Classes

```css
/* Use these for RTL-aware styling */
.rtl-ml-auto     /* margin-inline-start: auto */
.rtl-mr-auto     /* margin-inline-end: auto */
.rtl-pl-4        /* padding-inline-start: 1rem */
.rtl-pr-4        /* padding-inline-end: 1rem */

/* Flip icons in RTL */
.rtl-flip        /* transform: scaleX(-1) in RTL */
```

## Adding New Translations

1. **Add to English file** (`public/locales/en/common.json`):

```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my feature"
  }
}
```

2. **Use in component**:

```typescript
const { t } = useI18n()
<h1>{t('myFeature.title')}</h1>
```

3. **Translate to other languages**:

```bash
# Copy to all locales
for lang in es fr de ar zh ja pt ru; do
  cp public/locales/en/common.json public/locales/$lang/common.json
done

# Edit each file and translate
```

4. **Validate**:

```bash
pnpm tsx scripts/validate-translations.ts
```

## Best Practices

1. **Always use translation keys, never hardcoded text**:

```typescript
// Good ✅
<button>{t('common.save')}</button>

// Bad ❌
<button>Save</button>
```

2. **Provide context for translators**:

```json
{
  "button": {
    "_comment": "This button saves the form",
    "save": "Save"
  }
}
```

3. **Use namespaces for organization**:

```json
// common.json - general UI
// auth.json - authentication
// chat.json - chat features
// errors.json - error messages
```

4. **Handle plurals correctly**:

```json
{
  "message": "{{count}} message",
  "message_plural": "{{count}} messages"
}
```

5. **Keep keys organized**:

```json
{
  "feature": {
    "title": "Title",
    "subtitle": "Subtitle",
    "actions": {
      "save": "Save",
      "cancel": "Cancel"
    }
  }
}
```

## Troubleshooting

### Translation not showing

```typescript
// Check if key exists
const { t, i18n } = useI18n()
console.log(i18n.exists('my.key'))

// Check current language
console.log(i18n.language)

// Force reload
i18n.reloadResources()
```

### RTL not working

```typescript
// Check if RTL is detected
import { isRTL } from '@/lib/i18n/config'
console.log(isRTL())

// Check HTML attributes
console.log(document.documentElement.dir)
console.log(document.documentElement.lang)
```

### Date/Number format wrong

```typescript
// Check locale config
import { getLocaleConfig } from '@/lib/i18n/locales'
const config = getLocaleConfig('ar')
console.log(config.dateFnsLocale)
console.log(config.numberLocale)
```

## Resources

- Full docs: `/docs/I18N-ACCESSIBILITY-IMPLEMENTATION.md`
- Locale config: `/src/lib/i18n/locales.ts`
- i18n config: `/src/lib/i18n/config.ts`
- Translation files: `/public/locales/`
- Validation: `/scripts/validate-translations.ts`
