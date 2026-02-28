# Template System - Quick Start Guide

**Version**: 1.0.0
**Date**: 2026-02-03

---

## Overview

The ɳChat template system allows you to instantly transform your chat application to mimic popular platforms like WhatsApp, Telegram, Slack, or Discord. Each template includes:

- Complete UI redesign
- Platform-specific features
- Custom terminology
- Authentic color schemes
- Component overrides

---

## Quick Examples

### 1. Use Template System (Most Common)

```tsx
import { useTemplate } from '@/templates/hooks/use-template'

function MyComponent() {
  const {
    template, // Current template object
    templateId, // 'default' | 'whatsapp' | 'telegram' | 'slack' | 'discord'
    colors, // Theme colors
    features, // Feature config
    terminology, // Custom labels
    switchTemplate, // Function to switch templates
  } = useTemplate()

  return (
    <div style={{ backgroundColor: colors.surfaceColor }}>
      <h1>{template.name}</h1>
    </div>
  )
}
```

### 2. Switch Templates

```tsx
import { useTemplate } from '@/templates/hooks/use-template'

function TemplateSwitcher() {
  const { switchTemplate, templateId, isLoading } = useTemplate()

  return (
    <select
      value={templateId}
      onChange={(e) => switchTemplate(e.target.value)}
      disabled={isLoading}
    >
      <option value="default">ɳChat</option>
      <option value="whatsapp">WhatsApp</option>
      <option value="telegram">Telegram</option>
      <option value="slack">Slack</option>
      <option value="discord">Discord</option>
    </select>
  )
}
```

### 3. Use Theme Colors

```tsx
import { useThemeColors } from '@/templates/hooks/use-template'

function Card() {
  const colors = useThemeColors()

  return (
    <div
      style={{
        backgroundColor: colors.cardColor,
        color: colors.textColor,
        border: `1px solid ${colors.borderColor}`,
      }}
    >
      <h2 style={{ color: colors.primaryColor }}>Title</h2>
      <p style={{ color: colors.textMutedColor }}>Description</p>
    </div>
  )
}
```

### 4. Check Features

```tsx
import { useFeature } from '@/templates/hooks/use-template'

function ThreadButton({ messageId }) {
  const hasThreads = useFeature('threads')

  // Hide button if template doesn't support threads
  if (!hasThreads) return null

  return <button onClick={() => openThread(messageId)}>Reply in thread</button>
}
```

### 5. Use Terminology

```tsx
import { useTerminology } from '@/templates/hooks/use-template'

function CreateChannelButton() {
  const { t } = useTerminology()

  return (
    <button>
      {t('createChannel')}
      {/*
        Returns:
        - "Create Channel" for ɳChat/Slack/Discord
        - "New Chat" for WhatsApp
        - "New Chat" for Telegram
      */}
    </button>
  )
}
```

---

## Environment Configuration

Set template via environment variable:

```bash
# .env.local
NEXT_PUBLIC_PLATFORM_TEMPLATE=whatsapp
```

Override template settings:

```bash
# .env.local
NEXT_PUBLIC_PLATFORM_TEMPLATE=slack
NEXT_PUBLIC_THEME_MODE=dark
NEXT_PUBLIC_SIDEBAR_POSITION=right
NEXT_PUBLIC_SIDEBAR_WIDTH=280
NEXT_PUBLIC_MESSAGE_DENSITY=compact
NEXT_PUBLIC_THEME_PRIMARY=#4A154B
```

---

## Available Templates

### 1. ɳChat (default)

**Best For**: Teams wanting full features

**Theme**: Cyan/Blue (#00D4FF)
**Mode**: Dark

**Features**:

- ✅ All features enabled
- ✅ Threads (panel)
- ✅ Voice channels
- ✅ E2E encryption
- ✅ Bots & webhooks

### 2. WhatsApp

**Best For**: Personal/small teams

**Theme**: Green (#25D366)
**Mode**: Light

**Features**:

- ✅ Chat bubbles
- ✅ Double-check receipts (✓✓)
- ✅ Voice messages
- ✅ Status/Stories
- ❌ No threads
- ❌ No public channels

### 3. Telegram

**Best For**: Large communities

**Theme**: Blue (#0088CC) / Purple (#8774E1) dark
**Mode**: System

**Features**:

- ✅ Chat folders
- ✅ Secret chats
- ✅ Bots
- ✅ Scheduled messages
- ✅ Polls & quizzes
- ❌ No voice channels

### 4. Slack

**Best For**: Professional teams

**Theme**: Aubergine (#4A154B)
**Mode**: System

**Features**:

- ✅ Thread panel
- ✅ Workspace switcher
- ✅ Huddles
- ✅ App integrations
- ✅ Workflows
- ❌ No voice channels

### 5. Discord

**Best For**: Gaming/large groups

**Theme**: Blurple (#5865F2)
**Mode**: Dark

**Features**:

- ✅ Server list
- ✅ Voice channels
- ✅ Role colors
- ✅ Rich embeds
- ✅ Member list
- ❌ No stories

---

## Common Use Cases

### 1. Conditional Rendering Based on Features

```tsx
function MessageActions({ message }) {
  const { features } = useTemplate()

  return (
    <div>
      {features.threads && <ThreadButton />}
      {features.reactions && <ReactButton />}
      {features.voiceMessages && <VoiceButton />}
      {features.codeBlocks && <CodeButton />}
    </div>
  )
}
```

### 2. Use Template-Specific Components

```tsx
function Message({ message }) {
  const { template } = useTemplate()

  // Use template-specific message component if available
  const MessageComponent = template.components?.MessageItem ?? DefaultMessage

  return <MessageComponent {...message} />
}
```

### 3. Apply Template Colors Dynamically

```tsx
function StatusBadge({ status }) {
  const colors = useThemeColors()

  const bgColor = {
    online: colors.successColor,
    away: colors.warningColor,
    offline: colors.errorColor,
  }[status]

  return (
    <span
      style={{
        backgroundColor: bgColor,
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
      }}
    >
      {status}
    </span>
  )
}
```

### 4. Theme Preview Mode

```tsx
function TemplatePreview() {
  const { switchTemplate, templateId } = useTemplate()
  const [originalTemplate, setOriginalTemplate] = useState(templateId)

  const handlePreview = async (id) => {
    setOriginalTemplate(templateId)
    await switchTemplate(id)
  }

  const handleRevert = async () => {
    await switchTemplate(originalTemplate)
  }

  return (
    <div>
      <button onClick={() => handlePreview('whatsapp')}>Preview WhatsApp</button>
      <button onClick={handleRevert}>Revert</button>
    </div>
  )
}
```

---

## API Reference

### useTemplate()

Main hook for accessing template system.

```typescript
const {
  template, // PlatformTemplate | null
  templateId, // TemplateId
  isLoading, // boolean
  error, // Error | null
  theme, // 'light' | 'dark'
  setTheme, // (theme: 'light' | 'dark' | 'system') => void
  colors, // ThemeColors
  layout, // LayoutConfig
  features, // FeatureConfig
  isFeatureEnabled, // (feature: keyof FeatureConfig) => boolean
  terminology, // TerminologyConfig
  t, // (key: keyof TerminologyConfig) => string
  switchTemplate, // (templateId: TemplateId) => Promise<void>
  applyOverrides, // (overrides: PartialTemplate) => void
} = useTemplate()
```

### useThemeColors()

Get theme colors only.

```typescript
const colors: ThemeColors = useThemeColors()
```

### useFeature(feature)

Check if a specific feature is enabled.

```typescript
const hasThreads: boolean = useFeature('threads')
const hasVoiceMessages: boolean = useFeature('voiceMessages')
```

### useTerminology()

Get terminology translation function.

```typescript
const { terminology, t } = useTerminology()

// Get translated term
const label = t('channel') // "Channel" or "Chat"
const plural = t('channelPlural') // "Channels" or "Chats"
```

### loadTemplate(id)

Load a template programmatically.

```typescript
import { loadTemplate } from '@/templates'

const template = await loadTemplate('whatsapp')
```

### customizeTemplate(base, overrides)

Create a customized template.

```typescript
import { customizeTemplate } from '@/templates'

const custom = customizeTemplate(baseTemplate, {
  theme: {
    light: { primaryColor: '#FF0000' },
  },
  layout: {
    sidebarWidth: 320,
  },
})
```

---

## Color Properties

All templates include these 16 color properties:

| Property              | Description                 |
| --------------------- | --------------------------- |
| `primaryColor`        | Main brand color            |
| `secondaryColor`      | Secondary brand color       |
| `accentColor`         | Accent/highlight color      |
| `backgroundColor`     | Main background             |
| `surfaceColor`        | Cards/elevated surfaces     |
| `cardColor`           | Card backgrounds            |
| `popoverColor`        | Popovers/dropdowns          |
| `textColor`           | Primary text                |
| `textMutedColor`      | Secondary text              |
| `textInverseColor`    | Text on primary backgrounds |
| `borderColor`         | Default borders             |
| `borderMutedColor`    | Subtle borders              |
| `buttonPrimaryBg`     | Primary button background   |
| `buttonPrimaryText`   | Primary button text         |
| `buttonSecondaryBg`   | Secondary button background |
| `buttonSecondaryText` | Secondary button text       |
| `successColor`        | Success messages            |
| `warningColor`        | Warning messages            |
| `errorColor`          | Error messages              |
| `infoColor`           | Info messages               |
| `linkColor`           | Hyperlinks                  |
| `focusRingColor`      | Focus indicators            |
| `selectionBg`         | Text selection              |
| `highlightBg`         | Highlighted text            |

---

## Feature Flags

Common features you can check:

| Feature         | WhatsApp | Telegram | Slack | Discord |
| --------------- | -------- | -------- | ----- | ------- |
| `threads`       | ❌       | ❌       | ✅    | ✅      |
| `reactions`     | ✅       | ✅       | ✅    | ✅      |
| `voiceMessages` | ✅       | ✅       | ❌    | ❌      |
| `codeBlocks`    | ❌       | ✅       | ✅    | ✅      |
| `markdown`      | ❌       | ✅       | ✅    | ✅      |
| `gifPicker`     | ✅       | ✅       | ✅    | ✅      |
| `typing`        | ✅       | ✅       | ✅    | ✅      |
| `readReceipts`  | ✅       | ✅       | ❌    | ❌      |
| `presence`      | ✅       | ✅       | ✅    | ✅      |

---

## Terminology Mapping

| Key             | ɳChat/Slack    | WhatsApp    | Telegram | Discord        |
| --------------- | -------------- | ----------- | -------- | -------------- |
| `workspace`     | Workspace      | WhatsApp    | Telegram | Server         |
| `channel`       | Channel        | Chat        | Chat     | Channel        |
| `directMessage` | Direct Message | Chat        | Chat     | Direct Message |
| `thread`        | Thread         | Reply       | Reply    | Thread         |
| `member`        | Member         | Participant | Member   | Member         |
| `createChannel` | Create Channel | New Chat    | New Chat | Create Channel |

---

## Admin UI Components

### Theme Editor

```tsx
import { ThemeEditor } from '@/components/admin/theme-editor'
;<ThemeEditor
  onSave={(colors) => console.log('Saved', colors)}
  onExport={(colors) => console.log('Exported', colors)}
/>
```

### Template Gallery

```tsx
import { TemplateGallery } from '@/components/admin/template-gallery'
;<TemplateGallery />
```

---

## Troubleshooting

### Template not loading

```typescript
// Check if template exists
const templates = getAvailableTemplates()
console.log(
  'Available:',
  templates.map((t) => t.id)
)

// Check current template
const { template, error } = useTemplate()
if (error) console.error('Template error:', error)
```

### Colors not applying

```typescript
// Ensure TemplateProvider wraps your app
import { TemplateProvider } from '@/templates/hooks/use-template'

<TemplateProvider>
  <YourApp />
</TemplateProvider>

// Check if CSS variables are generated
const style = document.documentElement.style
console.log('Primary:', style.getPropertyValue('--primary'))
```

### Feature not working

```typescript
// Check if feature is enabled
const { isFeatureEnabled } = useTemplate()
console.log('Threads enabled:', isFeatureEnabled('threads'))

// Get feature config
const { features } = useTemplate()
console.log('Thread style:', features.threadStyle) // 'panel' | 'inline' | 'popup'
```

---

## Best Practices

1. **Always wrap app in TemplateProvider**

   ```tsx
   <TemplateProvider>
     <App />
   </TemplateProvider>
   ```

2. **Use hooks instead of direct imports**

   ```tsx
   // ✅ Good
   const colors = useThemeColors()

   // ❌ Bad
   import { colors } from '@/templates/whatsapp/config'
   ```

3. **Check features before rendering**

   ```tsx
   // ✅ Good
   {
     hasThreads && <ThreadButton />
   }

   // ❌ Bad
   ;<ThreadButton /> // Will always render
   ```

4. **Use terminology for labels**

   ```tsx
   // ✅ Good
   const { t } = useTerminology()
   <button>{t('createChannel')}</button>

   // ❌ Bad
   <button>Create Channel</button> // Hardcoded
   ```

5. **Prefer CSS variables over inline styles**

   ```tsx
   // ✅ Good
   <div className="bg-surface text-foreground">

   // ❌ Bad
   <div style={{ backgroundColor: colors.surfaceColor }}>
   ```

---

## Resources

- **Documentation**: `/Users/admin/Sites/nself-chat/docs/WHITE-LABEL-TEMPLATES-COMPLETE.md`
- **Implementation**: `/Users/admin/Sites/nself-chat/docs/TASKS-109-113-COMPLETE.md`
- **Types**: `/Users/admin/Sites/nself-chat/src/templates/types.ts`
- **Presets**: `/Users/admin/Sites/nself-chat/src/lib/theme-presets.ts`

---

_Quick Start Guide v1.0.0_
_Last Updated: 2026-02-03_
