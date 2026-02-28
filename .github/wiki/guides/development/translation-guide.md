# Translation Contribution Guide

Welcome to the nself-chat translation community! This guide will help you contribute translations in your language.

## 🌍 Why Contribute?

- Make nself-chat accessible to speakers of your language
- Join a global community of contributors
- Get recognition for your contributions
- Help democratize team communication tools

## 🚀 Quick Start (5 minutes)

### 1. Check if Your Language Exists

Look in [`src/locales/`](./src/locales/) to see if your language folder exists:

- ✅ Exists → Jump to [Improving Existing Translations](#improving-existing-translations)
- ❌ Doesn't exist → Continue with [Adding a New Language](#adding-a-new-language)

### 2. Translation Files Structure

Each language has 4 main files:

```
src/locales/[lang-code]/
├── common.json      # Common UI strings (buttons, labels, errors)
├── chat.json        # Chat-specific strings (messages, channels)
├── settings.json    # Settings UI strings
└── admin.json       # Admin dashboard strings
```

### 3. Set Up Your Environment

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/nself-chat.git
cd nself-chat

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## ➕ Adding a New Language

### Step 1: Create Language Folder

```bash
# Replace 'it' with your language code (ISO 639-1)
mkdir -p src/locales/it
```

Common language codes:

- `it` - Italian
- `ko` - Korean
- `nl` - Dutch
- `tr` - Turkish
- `hi` - Hindi
- `he` - Hebrew
- `pl` - Polish
- `sv` - Swedish

### Step 2: Copy English Templates

```bash
cp src/locales/en/* src/locales/it/
```

### Step 3: Register Your Language

Edit `src/lib/i18n/locales.ts` and add your language:

```typescript
export const SUPPORTED_LOCALES: Record<string, LocaleConfig> = {
  // ... existing languages
  it: {
    code: 'it',
    name: 'Italiano', // Native name
    englishName: 'Italian', // English name
    script: 'Latn', // Script: Latn (Latin), Arab, Hans, Cyrl, etc.
    direction: 'ltr', // Direction: 'ltr' or 'rtl'
    bcp47: 'it-IT', // BCP 47 language tag
    flag: '🇮🇹', // Flag emoji
    dateFnsLocale: 'it', // date-fns locale identifier
    numberLocale: 'it-IT', // Intl.NumberFormat locale
    pluralRule: 'other', // Plural rule category (see below)
    isComplete: false, // Set to true when 100% translated
    completionPercent: 0, // Update as you translate
  },
}
```

#### Plural Rules by Language

Different languages have different plural rules:

- **`other`** - English, Spanish, German, Italian, Portuguese (2 forms)
- **`few`** - Russian, Polish, Czech (3-4 forms)
- **`many`** - Arabic (6 forms)
- **`one`** - Chinese, Japanese, Korean (1 form)

[Full CLDR Plural Rules](https://cldr.unicode.org/index/cldr-spec/plural-rules)

### Step 4: Translate the Files

Start with `common.json` (most important):

```json
{
  "app": {
    "name": "nChat",
    "tagline": "Piattaforma di Comunicazione del Team", // Translate
    "loading": "Caricamento...", // Translate
    "error": "Si è verificato un errore" // Translate
  }
}
```

**Rules:**

- ✅ Translate the **values** (right side)
- ❌ Don't change the **keys** (left side)
- ✅ Keep variables like `{{name}}` unchanged
- ✅ Maintain proper JSON syntax

### Step 5: Test Your Translations

```bash
# Run the dev server
pnpm dev

# Open http://localhost:3000
# Go to Settings → Language
# Select your language
# Navigate through the app to see your translations
```

### Step 6: Submit Your Contribution

```bash
# Create a new branch
git checkout -b add-italian-translation

# Add your files
git add src/locales/it/
git add src/lib/i18n/locales.ts

# Commit your changes
git commit -m "feat(i18n): Add Italian translation"

# Push to your fork
git push origin add-italian-translation

# Create a Pull Request on GitHub
```

## 🔄 Improving Existing Translations

### Find What Needs Translation

```bash
# Check translation completion
node scripts/check-translations.js it

# Find missing keys
node scripts/find-missing-keys.js it
```

### Update Translations

1. Edit the JSON files in `src/locales/[your-lang]/`
2. Translate missing or incorrect strings
3. Test in the UI
4. Submit a pull request

## 📋 Translation Guidelines

### ✅ DO

1. **Translate for context**
   - Understand where the text appears in the UI
   - Use natural, fluent language
   - Match the app's friendly but professional tone

2. **Preserve formatting**

   ```json
   {
     "welcome": "Benvenuto, {{name}}!" // ✅ Keep {{name}}
   }
   ```

3. **Handle plurals correctly**

   ```json
   {
     "messages_one": "{{count}} messaggio",
     "messages_other": "{{count}} messaggi"
   }
   ```

4. **Use appropriate formality**
   - Match the app's tone (usually informal "you")
   - Be consistent across all translations

5. **Test in the UI**
   - See how your translations look
   - Check for text overflow
   - Verify context makes sense

### ❌ DON'T

1. **Don't use machine translation only**
   - Machine translation is a starting point
   - Always review and refine
   - Get feedback from other native speakers

2. **Don't translate technical terms**
   - Keep: URL, API, OAuth, GraphQL, JSON, etc.
   - Exception: If your language has widely accepted translation

3. **Don't change interpolation variables**

   ```json
   {
     "welcome": "Benvenuto, {{nome}}!"  // ❌ Wrong
     "welcome": "Benvenuto, {{name}}!"  // ✅ Correct
   }
   ```

4. **Don't break JSON syntax**
   - Use proper quotes: `"` not `"` or `"`
   - Escape special characters: `\"`, `\\n`
   - Validate JSON: Use an editor with syntax highlighting

## 🎯 Translation Examples

### Example 1: Simple Translation

English:

```json
{
  "app": {
    "save": "Save",
    "cancel": "Cancel"
  }
}
```

Italian:

```json
{
  "app": {
    "save": "Salva",
    "cancel": "Annulla"
  }
}
```

### Example 2: With Interpolation

English:

```json
{
  "time": {
    "ago": "{{time}} ago"
  }
}
```

Italian:

```json
{
  "time": {
    "ago": "{{time}} fa"
  }
}
```

### Example 3: With Plurals

English:

```json
{
  "members": {
    "count_one": "{{count}} member",
    "count_other": "{{count}} members"
  }
}
```

Italian:

```json
{
  "members": {
    "count_one": "{{count}} membro",
    "count_other": "{{count}} membri"
  }
}
```

### Example 4: Complex Plural (Arabic)

Arabic needs more plural forms:

```json
{
  "messages": {
    "count_zero": "لا توجد رسائل",
    "count_one": "رسالة واحدة",
    "count_two": "رسالتان",
    "count_few": "{{count}} رسائل",
    "count_many": "{{count}} رسالة",
    "count_other": "{{count}} رسالة"
  }
}
```

## 🌐 RTL (Right-to-Left) Languages

If you're adding an RTL language (Arabic, Hebrew, Persian, Urdu):

### Special Considerations

1. **Set direction in locale config**

   ```typescript
   direction: 'rtl',
   ```

2. **Test RTL layout**
   - Sidebar should be on the right
   - Text should be right-aligned
   - Icons should be mirrored

3. **Report layout issues**
   - If something doesn't look right in RTL
   - Open an issue with screenshots
   - We'll fix the CSS

### RTL-Specific Strings

Some strings need RTL-specific handling:

```json
{
  "formatting": {
    "bold": "**غامق**", // Arabic text between English markers
    "example": "مثال: {{text}}" // RTL text with LTR variable
  }
}
```

## 🔍 Quality Checklist

Before submitting your translation, verify:

- [ ] All JSON files are valid (no syntax errors)
- [ ] All keys from English version are present
- [ ] Variables like `{{name}}` are unchanged
- [ ] Plural forms follow your language's rules
- [ ] Reviewed by at least one other native speaker
- [ ] Tested in the UI (if possible)
- [ ] Consistent terminology across all files
- [ ] Natural, fluent language (not literal translation)
- [ ] Appropriate formality level
- [ ] Technical terms handled correctly

## 🎖️ Recognition

### Contributors

All contributors are recognized in:

- `CONTRIBUTORS.md` file
- GitHub Contributors page
- App's "About" section (optional)
- Release notes for language additions

### Translation Credits

Each translation file can include translator credits:

```json
{
  "_meta": {
    "translators": [
      {
        "name": "Your Name",
        "github": "yourusername",
        "email": "your@email.com" // optional
      }
    ],
    "lastUpdated": "2026-01-31",
    "completionPercent": 100
  },
  "app": {
    // ... translations
  }
}
```

## 📊 Translation Status

Current status of all languages:

| Language        | Common | Chat | Settings | Admin | Total |
| --------------- | ------ | ---- | -------- | ----- | ----- |
| English (en)    | 100%   | 100% | 100%     | 100%  | 100%  |
| Spanish (es)    | 100%   | 100% | 100%     | 95%   | 98%   |
| French (fr)     | 100%   | 100% | 100%     | 95%   | 98%   |
| German (de)     | 100%   | 100% | 95%      | 90%   | 96%   |
| Chinese (zh)    | 100%   | 100% | 90%      | 85%   | 93%   |
| Arabic (ar)     | 100%   | 95%  | 85%      | 80%   | 90%   |
| Japanese (ja)   | 100%   | 95%  | 80%      | 75%   | 87%   |
| Portuguese (pt) | 100%   | 95%  | 80%      | 75%   | 87%   |
| Russian (ru)    | 100%   | 95%  | 80%      | 75%   | 87%   |

[Check latest status](https://nself-chat.github.io/i18n-status)

## 🆘 Getting Help

### Need Help Translating?

1. **Context Questions**
   - Don't understand a string?
   - Need to see it in the UI?
   - Ask in the Pull Request comments

2. **Technical Issues**
   - JSON syntax problems?
   - Setup issues?
   - Testing problems?
   - Open an issue or ask in Discussions

3. **Translation Discussions**
   - Join [GitHub Discussions](https://github.com/nself/nself-chat/discussions/categories/translations)
   - Connect with other translators
   - Discuss terminology
   - Share best practices

### Contact

- 📧 Email: i18n@nself.org
- 💬 Discord: [Join our i18n channel](https://discord.gg/nself-chat-i18n)
- 🐦 Twitter: [@nselfchat](https://twitter.com/nselfchat)

## 📚 Resources

### Translation Tools

- **JSON Editor**: [jsoneditoronline.org](https://jsoneditoronline.org/)
- **JSON Validator**: [jsonlint.com](https://jsonlint.com/)
- **Plural Rules**: [Unicode CLDR](https://cldr.unicode.org/index/cldr-spec/plural-rules)
- **Language Codes**: [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

### Style Guides

- [Microsoft Terminology](https://www.microsoft.com/en-us/language)
- [Apple Style Guide](https://support.apple.com/guide/applestyleguide/welcome/web)
- [Google Developer Style](https://developers.google.com/style)

### Similar Apps for Reference

Check terminology in similar apps:

- Slack
- Discord
- Microsoft Teams
- Telegram

## 🎉 Thank You!

Thank you for contributing to make nself-chat accessible to more people worldwide!

Every translation helps democratize team communication and brings the power of self-hosted, open-source collaboration to more communities.

Your contribution makes a real difference! 🌍💙

---

**Ready to start?** [Create your first Pull Request](https://github.com/nself/nself-chat/compare)!

**Questions?** [Join the discussion](https://github.com/nself/nself-chat/discussions/categories/translations)!
