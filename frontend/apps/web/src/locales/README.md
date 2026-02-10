# Translation Files

This directory contains all translation files for the nself-chat application.

## Structure

```
locales/
├── en/          # English (base language, 100% complete)
│   ├── common.json
│   ├── chat.json
│   ├── settings.json
│   └── admin.json
├── es/          # Spanish (Español)
├── fr/          # French (Français)
├── de/          # German (Deutsch)
├── zh/          # Chinese Simplified (中文)
├── ar/          # Arabic (العربية) - RTL
├── ja/          # Japanese (日本語)
├── pt/          # Portuguese (Português)
└── ru/          # Russian (Русский)
```

## Namespaces

### common.json

General UI elements, buttons, labels, validation messages, errors

**Key sections**:

- `app.*` - Application-level strings
- `navigation.*` - Navigation menu items
- `time.*` - Time and date strings
- `validation.*` - Form validation messages
- `errors.*` - Error messages
- `status.*` - Status indicators
- `notifications.*` - Notification messages
- `confirmations.*` - Confirmation dialogs
- `empty.*` - Empty state messages
- `accessibility.*` - Accessibility labels
- `language.*` - Language names

### chat.json

Chat interface strings

**Key sections**:

- `messages.*` - Message-related strings
- `channels.*` - Channel management
- `threads.*` - Thread conversations
- `directMessages.*` - Direct messaging
- `mentions.*` - Mentions and reactions
- `files.*` - File sharing
- `search.*` - Search functionality
- `presence.*` - User presence
- `members.*` - Member management
- `reactions.*` - Message reactions
- `formatting.*` - Text formatting

### settings.json

Settings and preferences UI

**Key sections**:

- `settings.*` - Settings categories
- `profile.*` - User profile
- `account.*` - Account management
- `appearance.*` - Theme and display
- `notifications.*` - Notification preferences
- `privacy.*` - Privacy and security
- `language.*` - Language settings
- `accessibility.*` - Accessibility options
- `advanced.*` - Advanced settings
- `about.*` - About and info

### admin.json

Admin dashboard strings

**Key sections**:

- `admin.*` - Admin navigation
- `dashboard.*` - Dashboard widgets
- `users.*` - User management
- `roles.*` - Roles and permissions
- `channels.*` - Channel management
- `moderation.*` - Content moderation
- `analytics.*` - Analytics and reports
- `settings.*` - Admin settings
- `integrations.*` - Integrations
- `logs.*` - Audit logs
- `setup.*` - Setup wizard

## Adding a New Language

1. Create a new directory with the language code (ISO 639-1):

   ```bash
   mkdir -p locales/it
   ```

2. Copy English files as templates:

   ```bash
   cp locales/en/* locales/it/
   ```

3. Translate the values (not the keys):

   ```json
   {
     "app": {
       "name": "nChat",
       "tagline": "Piattaforma di Comunicazione del Team"
     }
   }
   ```

4. Register the language in `/src/lib/i18n/locales.ts`

5. Test and submit a PR!

## Translation Guidelines

### DO ✅

- Translate values, not keys
- Keep interpolation variables: `{{name}}`, `{{count}}`
- Use natural, fluent language
- Match the app's friendly tone
- Test in the UI
- Get feedback from native speakers

### DON'T ❌

- Don't use machine translation only
- Don't change JSON keys
- Don't modify interpolation variables
- Don't translate technical terms (URL, API, etc.)
- Don't break JSON syntax

## Pluralization

Different languages need different plural forms:

**English** (2 forms):

```json
{
  "messages_one": "{{count}} message",
  "messages_other": "{{count}} messages"
}
```

**Arabic** (6 forms):

```json
{
  "messages_zero": "لا توجد رسائل",
  "messages_one": "رسالة واحدة",
  "messages_two": "رسالتان",
  "messages_few": "{{count}} رسائل",
  "messages_many": "{{count}} رسالة",
  "messages_other": "{{count}} رسالة"
}
```

**Russian** (3 forms):

```json
{
  "messages_one": "{{count}} сообщение",
  "messages_few": "{{count}} сообщения",
  "messages_other": "{{count}} сообщений"
}
```

## RTL Languages

For right-to-left languages (Arabic, Hebrew):

- Set `direction: 'rtl'` in locale config
- Text automatically aligns right
- Layout mirrors horizontally
- Test thoroughly for layout issues

## Validation

Before submitting:

```bash
# Validate JSON syntax
node scripts/validate-translations.js

# Check for missing keys
node scripts/find-missing-keys.js [locale]

# Check completion percentage
node scripts/translation-status.js
```

## Resources

- **Full Guide**: `/docs/guides/internationalization.md`
- **Contribution Guide**: `/docs/guides/development/translation-guide.md`
- **Plural Rules**: [Unicode CLDR](https://cldr.unicode.org/index/cldr-spec/plural-rules)
- **Language Codes**: [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

## Support

- 📧 Email: i18n@nself.org
- 💬 Discord: [#i18n channel](https://discord.gg/nself-chat-i18n)
- 📖 Docs: [docs.nself.org/i18n](https://docs.nself.org/i18n)

Thank you for contributing to make nself-chat accessible to everyone! 🌍
