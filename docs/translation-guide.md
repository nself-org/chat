# Translation Guide

**Version**: 0.9.1
**Last Updated**: February 3, 2026

---

## Overview

nChat supports **52+ languages** with a complete internationalization (i18n) system. This guide explains how to contribute translations, maintain translation quality, and work with the i18n infrastructure.

## Supported Languages

### Top 10 Languages (Professional Translation Recommended)

| Language             | Code | Status                  | RTL | Priority |
| -------------------- | ---- | ----------------------- | --- | -------- |
| English              | `en` | ✅ Complete (reference) | No  | -        |
| German               | `de` | ✅ Complete             | No  | -        |
| Japanese             | `ja` | ✅ Complete             | No  | -        |
| Spanish              | `es` | 🔄 In Progress          | No  | HIGH     |
| French               | `fr` | 🔄 In Progress          | No  | HIGH     |
| Arabic               | `ar` | 🔄 In Progress          | Yes | HIGH     |
| Chinese (Simplified) | `zh` | 🔄 In Progress          | No  | HIGH     |
| Portuguese           | `pt` | 🔄 In Progress          | No  | HIGH     |
| Russian              | `ru` | 🔄 In Progress          | No  | HIGH     |
| Italian              | `it` | ⏳ Needs Translation    | No  | HIGH     |
| Korean               | `ko` | ⏳ Needs Translation    | No  | HIGH     |
| Hebrew               | `he` | ⏳ Needs Translation    | Yes | HIGH     |
| Hindi                | `hi` | ⏳ Needs Translation    | No  | HIGH     |

### Additional 40+ Languages (Machine Translation Acceptable)

All major world languages are supported with template files. See `src/locales/README.md` for the complete list.

## Translation Structure

### Namespaces

Translations are organized into 6 namespaces:

```
src/locales/{lang}/
├── common.json    (~150 keys) - General UI, buttons, navigation
├── chat.json      (~180 keys) - Messages, channels, threads
├── settings.json  (~140 keys) - User preferences, profile
├── admin.json     (~160 keys) - Admin dashboard, moderation
├── auth.json      (~120 keys) - Authentication flows
└── errors.json    (~100 keys) - Error messages, validation
```

### File Format

```json
{
  "_meta": {
    "language": "Spanish",
    "code": "es",
    "namespace": "common",
    "version": "1.0.0",
    "status": "needs_translation",
    "lastUpdated": "2026-02-03T00:00:00.000Z"
  },
  "app": {
    "name": "nChat",
    "tagline": "Plataforma de Comunicación en Equipo",
    "loading": "Cargando...",
    "error": "Ha ocurrido un error",
    "save": "Guardar",
    "cancel": "Cancelar"
  }
}
```

## Translation Guidelines

### 1. Key Structure

**DO**:

- Translate only the **values**, never the **keys**
- Preserve the JSON structure exactly
- Keep placeholder variables like `{{name}}`, `{{count}}`
- Maintain formatting tags like `<strong>`, `<em>`

**DON'T**:

- Change key names (e.g., `"save": "Guardar"` not `"guardar": "Guardar"`)
- Remove placeholders or brackets
- Add or remove nesting levels

### 2. Placeholders

Placeholders are dynamic values that get replaced at runtime:

```json
{
  "welcome": "Welcome back, {{name}}!",
  "messages_count": "You have {{count}} new messages"
}
```

**Rules**:

- Keep placeholders exactly as they appear
- Translate around them, not the placeholder itself
- Common placeholders: `{{name}}`, `{{count}}`, `{{email}}`, `{{date}}`

### 3. Pluralization

Different languages have different plural forms:

**English** (2 forms):

```json
{
  "messages_one": "1 message",
  "messages_other": "{{count}} messages"
}
```

**Arabic** (6 forms):

```json
{
  "messages_zero": "لا رسائل",
  "messages_one": "رسالة واحدة",
  "messages_two": "رسالتان",
  "messages_few": "{{count}} رسائل",
  "messages_many": "{{count}} رسالة",
  "messages_other": "{{count}} رسالة"
}
```

**Russian/Polish** (4 forms):

```json
{
  "messages_one": "{{count}} сообщение",
  "messages_few": "{{count}} сообщения",
  "messages_many": "{{count}} сообщений",
  "messages_other": "{{count}} сообщений"
}
```

[Learn more about CLDR plural rules](http://cldr.unicode.org/index/cldr-spec/plural-rules)

### 4. Context-Aware Translation

Some English words have multiple meanings. Use context:

```json
{
  "general": {
    "close": "Cerrar", // Close a window
    "close_relationship": "Cercano" // Close as in near
  },
  "file": {
    "noun": "Archivo", // A file (document)
    "verb": "Archivar" // To file (store)
  }
}
```

### 5. Cultural Adaptation

Adapt idioms and expressions:

**English**: "Break a leg!"
**Spanish**: "¡Mucha mierda!" (literal translation would be confusing)

**English**: "It's raining cats and dogs"
**French**: "Il pleut des cordes" (It's raining ropes)

### 6. Tone and Formality

Match the tone of the original:

- **Informal**: Used for buttons, short actions ("Save", "Delete")
- **Professional**: Used for settings, admin areas
- **Friendly**: Used for welcome messages, tips

Consider cultural norms:

- German and French may prefer formal "Sie" / "vous" in professional contexts
- Spanish may use "tú" for general UI (varies by region)
- Japanese has multiple politeness levels

### 7. RTL (Right-to-Left) Languages

For Arabic, Hebrew, Persian, Urdu:

- Text direction is handled automatically by the system
- Numbers and English names stay LTR within RTL text
- Test your translations with RTL layout enabled
- Icons and UI elements are automatically mirrored

### 8. Length Considerations

Translations can be longer or shorter than English:

- German words tend to be longer
- Chinese characters are more compact
- Test that translations fit in UI elements

**Examples**:

- English: "Search" (6 chars)
- German: "Suchen" (6 chars) - same
- Spanish: "Buscar" (6 chars) - same
- French: "Rechercher" (10 chars) - longer!

### 9. Terminology Consistency

Use a glossary for consistent terms:

| English   | Spanish | French  | German         | Arabic      |
| --------- | ------- | ------- | -------------- | ----------- |
| Channel   | Canal   | Canal   | Kanal          | قناة        |
| Message   | Mensaje | Message | Nachricht      | رسالة       |
| Thread    | Hilo    | Fil     | Thread         | موضوع       |
| Workspace | Espacio | Espace  | Arbeitsbereich | مساحة العمل |

Create a glossary for your language and share it with other translators.

### 10. Quality Standards

Before submitting:

- ✅ **Native speaker review**: Have another native speaker review
- ✅ **Contextual accuracy**: Understand what each string is used for
- ✅ **Natural language**: Sounds natural, not machine-translated
- ✅ **Professional tone**: Appropriate for business communication
- ✅ **Tested in app**: View your translations in the actual UI
- ✅ **No grammatical errors**: Spell-check and grammar-check
- ✅ **Consistent terminology**: Use the same terms throughout

## Contributing Translations

### Step 1: Fork and Clone

```bash
git clone https://github.com/your-username/nself-chat.git
cd nself-chat
pnpm install
```

### Step 2: Choose Your Language

Check existing translations:

```bash
pnpm tsx scripts/validate-translations.ts
```

### Step 3: Translate

Edit files in `src/locales/{lang}/`:

```bash
# Example: Spanish translations
src/locales/es/common.json
src/locales/es/chat.json
src/locales/es/settings.json
src/locales/es/admin.json
src/locales/es/auth.json
src/locales/es/errors.json
```

### Step 4: Validate

Check your translations for missing keys:

```bash
pnpm tsx scripts/validate-translations.ts --locale=es
```

### Step 5: Test in App

Run the app with your language:

```bash
pnpm dev
# Visit http://localhost:3000
# Change language in settings to see your translations
```

### Step 6: Submit Pull Request

```bash
git add src/locales/es/
git commit -m "feat(i18n): Complete Spanish translations"
git push origin main
```

Create a pull request on GitHub:

1. Title: `feat(i18n): [Language] translations`
2. Description: List what you translated
3. Request review from a native speaker if possible

## Translation Tools

### Validation Script

Check translation coverage:

```bash
# All languages
pnpm tsx scripts/validate-translations.ts

# Specific language
pnpm tsx scripts/validate-translations.ts --locale=es

# Strict mode (fail on warnings)
pnpm tsx scripts/validate-translations.ts --strict
```

### Generation Script

Create template files for new languages:

```bash
pnpm tsx scripts/generate-translations.ts
```

### CI Integration

Translation validation runs automatically on:

- Every pull request
- Every push to main/develop
- Nightly builds

## Translation Memory

For professional translators, we provide:

1. **TMX Export**: Export to Translation Memory Exchange format
2. **XLIFF Support**: Import/export for CAT tools
3. **Context Screenshots**: UI screenshots for context
4. **Terminology Database**: Glossary of terms

Contact the maintainers for access to translation memory files.

## RTL Development

### Testing RTL Layouts

1. Enable RTL in settings
2. Check these areas:
   - Sidebar positioning
   - Message alignment
   - Icon directions
   - Form layouts
   - Navigation menus

### CSS for RTL

The system uses CSS logical properties:

```css
/* Instead of: */
margin-left: 10px;

/* Use: */
margin-inline-start: 10px;

/* Instead of: */
float: right;

/* Use: */
float: inline-end;
```

Icons are automatically mirrored for RTL languages.

## Getting Help

### Questions?

- Open an issue on GitHub
- Join our Discord: [nself.chat/discord](https://nself.chat/discord)
- Email: translations@nself.chat

### Resources

- [i18next Documentation](https://www.i18next.com/)
- [CLDR Plural Rules](http://cldr.unicode.org/index/cldr-spec/plural-rules)
- [Unicode CLDR](http://cldr.unicode.org/)
- [W3C Internationalization](https://www.w3.org/International/)

## Translation Credits

Translations are maintained by the community. Thank you to all contributors!

View the full list of translators: [TRANSLATORS.md](./TRANSLATORS.md)

## License

Translations are licensed under the same license as the main project (MIT).

---

**Questions?** Open an issue or contact translations@nself.chat
