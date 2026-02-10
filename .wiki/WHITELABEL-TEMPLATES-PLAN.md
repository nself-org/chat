# White-Label & Templates Implementation Plan

**Version**: 1.0.0
**Date**: 2026-02-03
**Status**: Planning
**Tasks**: 109-113 from TODO.md (Phase 15)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Task 109: Tenant Branding](#task-109-tenant-branding)
4. [Task 110: Theme Editor](#task-110-theme-editor)
5. [Task 111: Application Templates](#task-111-application-templates)
6. [Task 112: Template Feature Flags](#task-112-template-feature-flags)
7. [Task 113: nChat Default Theme](#task-113-nchat-default-theme)
8. [Database Schema](#database-schema)
9. [Implementation Phases](#implementation-phases)
10. [API Specifications](#api-specifications)
11. [Testing Strategy](#testing-strategy)
12. [Migration Plan](#migration-plan)

---

## Executive Summary

This document outlines the complete implementation plan for white-label and template functionality in nChat (Tasks 109-113). The system will enable:

- **Multi-tenant branding** with complete customization per organization
- **Live theme editor** with real-time preview and import/export
- **Application templates** that mimic WhatsApp, Telegram, Slack, and Discord UX
- **Feature flag mapping** to ensure each template exposes only relevant features
- **nChat default template** showcasing all platform capabilities

### Key Decisions

1. **Template-First Architecture**: Templates define complete app experiences (theme + features + terminology + layout)
2. **Layered Configuration**: Default -> Template -> Tenant -> User preferences
3. **Database-Backed Persistence**: All customizations stored in PostgreSQL with audit history
4. **CSS Variables + Tailwind**: Runtime theme switching via CSS custom properties

---

## Current State Analysis

### Existing Infrastructure

| Component       | Location                         | Status                                         |
| --------------- | -------------------------------- | ---------------------------------------------- |
| Theme Presets   | `src/lib/theme-presets.ts`       | 25+ presets (nself, slack, discord, etc.)      |
| AppConfig       | `src/config/app-config.ts`       | Full theme config with 16 color properties     |
| Theme Context   | `src/contexts/theme-context.tsx` | Light/dark mode switching                      |
| Template System | `src/templates/`                 | WhatsApp, Telegram, Slack, Discord features    |
| Feature Flags   | `src/lib/features/`              | Comprehensive flag system with dependencies    |
| Multi-Tenancy   | `src/lib/tenants/types.ts`       | Tenant, TenantBranding, TenantFeatures defined |
| Setup Wizard    | `src/components/setup/steps/`    | Branding and theme steps implemented           |

### Gaps to Address

1. **Theme Editor UI** - No live editor component exists
2. **Template Selection** - No UI to switch between templates
3. **Custom Domain Routing** - Backend support needed
4. **Email Template Branding** - Not implemented
5. **Theme Import/Export** - Basic JSON only, need versioning
6. **Tenant Isolation** - RLS policies not applied

---

## Task 109: Tenant Branding

### Overview

Persist complete tenant branding configuration with multi-channel support (web, email, mobile).

### Branding Components

#### 1. Visual Identity

```typescript
interface TenantBrandingConfig {
  // Core Identity
  appName: string // Display name
  tagline?: string // Subtitle/slogan
  companyName?: string // Legal entity name
  websiteUrl?: string // Corporate website

  // Logo System
  logo: {
    primary: string // Main logo (light bg)
    inverted: string // Logo for dark bg
    icon: string // Square icon/favicon
    wordmark?: string // Text-only logo
  }
  logoScale: number // 0.5 - 2.0

  // Favicon Suite
  favicons: {
    ico: string // 16x16, 32x32 .ico
    png16: string // 16x16 PNG
    png32: string // 32x32 PNG
    png180: string // Apple touch icon
    png192: string // Android Chrome
    png512: string // PWA splash
    svg: string // Scalable favicon
  }

  // Colors (extends existing ThemeColors)
  colors: {
    primary: string
    secondary: string
    accent: string
    // ... all 16 color properties
  }

  // Typography
  typography: {
    fontFamily: string
    headingFontFamily?: string
    monoFontFamily: string
    baseFontSize: string // e.g., '16px'
    lineHeight: string // e.g., '1.5'
  }

  // Custom Domain
  domain: {
    customDomain?: string // e.g., 'chat.acme.com'
    subdomain: string // e.g., 'acme' -> acme.nchat.app
    sslCertificate?: string // Certificate ID
  }

  // Social/SEO
  seo: {
    title: string
    description: string
    keywords: string[]
    ogImage: string
    twitterHandle?: string
  }

  // Legal
  legal: {
    privacyPolicyUrl?: string
    termsOfServiceUrl?: string
    cookiePolicyUrl?: string
    supportEmail: string
  }
}
```

#### 2. Email Template Branding

```typescript
interface EmailBrandingConfig {
  // Header
  headerLogoUrl: string
  headerBackgroundColor: string
  headerTextColor: string

  // Body
  bodyBackgroundColor: string
  bodyTextColor: string
  linkColor: string
  buttonBackgroundColor: string
  buttonTextColor: string

  // Footer
  footerText: string
  footerLogoUrl?: string
  socialLinks: {
    twitter?: string
    linkedin?: string
    github?: string
  }

  // Templates
  templates: {
    welcome: EmailTemplate
    passwordReset: EmailTemplate
    invitation: EmailTemplate
    notification: EmailTemplate
    digest: EmailTemplate
  }
}

interface EmailTemplate {
  subject: string
  preheader?: string
  html: string // Mjml or raw HTML
  text: string // Plain text fallback
}
```

#### 3. Custom Domain Support

**Implementation Steps**:

1. **Domain Verification**
   - User adds CNAME record pointing to `custom.nchat.app`
   - Background job verifies DNS propagation
   - Mark domain as verified

2. **SSL Certificate Provisioning**
   - Use Let's Encrypt via Caddy/Traefik
   - Automatic renewal
   - Store certificate references in tenant config

3. **Request Routing**
   - Middleware extracts tenant from:
     1. Custom domain lookup
     2. Subdomain extraction
     3. Header injection (for development)
   - Inject tenant context into all requests

```typescript
// Middleware pseudocode
async function tenantMiddleware(req: Request) {
  const host = req.headers.get('host')

  // 1. Check custom domain
  let tenant = await db.tenant.findFirst({
    where: { 'branding.domain.customDomain': host },
  })

  // 2. Check subdomain
  if (!tenant) {
    const subdomain = extractSubdomain(host) // 'acme' from 'acme.nchat.app'
    tenant = await db.tenant.findFirst({
      where: { 'branding.domain.subdomain': subdomain },
    })
  }

  // 3. Inject context
  req.tenantContext = {
    tenant,
    isCustomDomain: Boolean(tenant?.branding.domain.customDomain),
  }
}
```

### Branding API Endpoints

```
GET  /api/tenants/:id/branding          # Get branding config
PUT  /api/tenants/:id/branding          # Update branding
POST /api/tenants/:id/branding/logo     # Upload logo (multipart)
POST /api/tenants/:id/branding/favicon  # Generate favicon suite
POST /api/tenants/:id/domain/verify     # Verify custom domain
POST /api/tenants/:id/domain/ssl        # Provision SSL
```

---

## Task 110: Theme Editor

### Overview

Build a comprehensive theme editor with live preview, color picker, font selection, CSS customization, and import/export.

### Editor Components

#### 1. Live Preview Panel

```tsx
interface ThemePreviewProps {
  theme: ThemeColors
  layout: LayoutConfig
  mode: 'light' | 'dark'
}

function ThemePreview({ theme, layout, mode }: ThemePreviewProps) {
  return (
    <div
      className="preview-container"
      style={{
        '--primary': theme.primaryColor,
        '--secondary': theme.secondaryColor,
        // ... all CSS variables
      }}
    >
      {/* Mock App UI */}
      <PreviewSidebar />
      <PreviewMainContent />
      <PreviewMessageInput />
    </div>
  )
}
```

**Preview Sections**:

- Header with logo and navigation
- Sidebar with channels list
- Main content area with messages
- Message input with formatting toolbar
- Modal preview (dialogs, toasts)
- Button states (primary, secondary, disabled)
- Status colors (success, warning, error, info)

#### 2. Color Picker Component

```tsx
interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  presets?: string[] // Quick-select colors
  allowAlpha?: boolean // Allow transparency
  contrastCheck?: string // Check contrast against this color
}

function ColorPicker({ label, value, onChange, contrastCheck }: ColorPickerProps) {
  const contrastRatio = contrastCheck ? calculateContrastRatio(value, contrastCheck) : null

  return (
    <div className="color-picker">
      <label>{label}</label>
      <div className="picker-row">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
        {contrastRatio && <ContrastBadge ratio={contrastRatio} />}
      </div>
    </div>
  )
}
```

**Accessibility Features**:

- WCAG contrast ratio display
- Suggested accessible alternatives
- Color blindness simulation preview

#### 3. Font Selection

```tsx
interface FontSelectorProps {
  value: string
  onChange: (font: string) => void
  category: 'sans' | 'serif' | 'mono' | 'display'
}

const SYSTEM_FONTS = {
  sans: [
    'Inter, system-ui, sans-serif',
    'system-ui, sans-serif',
    "'SF Pro Display', system-ui, sans-serif",
    "'Segoe UI', system-ui, sans-serif",
    'Roboto, sans-serif',
    'Open Sans, sans-serif',
  ],
  serif: [
    'Georgia, serif',
    "'Times New Roman', serif",
    "'Playfair Display', serif',
  ],
  mono: [
    "'Fira Code', monospace",
    "'JetBrains Mono', monospace",
    "'Source Code Pro', monospace",
    'Consolas, monospace',
  ],
  display: [
    "'Poppins', sans-serif",
    "'Montserrat', sans-serif",
  ]
}

// Support Google Fonts via font picker
// Or custom font upload with @font-face generation
```

#### 4. CSS Customization

```tsx
interface CSSEditorProps {
  value: string
  onChange: (css: string) => void
  variables: Record<string, string> // Available CSS variables
}

function CSSEditor({ value, onChange, variables }: CSSEditorProps) {
  return (
    <div className="css-editor">
      <div className="variables-reference">
        <h4>Available Variables</h4>
        <ul>
          {Object.entries(variables).map(([name, value]) => (
            <li key={name}>
              <code>--{name}</code>: {value}
            </li>
          ))}
        </ul>
      </div>
      <CodeEditor
        language="css"
        value={value}
        onChange={onChange}
        lint={true}
        autocomplete={Object.keys(variables).map((v) => `var(--${v})`)}
      />
    </div>
  )
}
```

**CSS Injection Safety**:

- Sanitize CSS to prevent XSS
- Scope to `.tenant-styles` class
- Validate property whitelist
- Strip potentially harmful properties (`position: fixed`, `z-index > 9999`)

#### 5. Theme Import/Export

```typescript
interface ThemePackage {
  version: '1.0'
  name: string
  description?: string
  author?: string
  createdAt: string

  // Theme data
  colors: {
    light: ThemeColors
    dark: ThemeColors
  }
  typography: TypographyConfig
  borderRadius: string
  customCSS?: string

  // Optional assets (base64)
  assets?: {
    logo?: string
    favicon?: string
  }

  // Checksum for integrity
  checksum: string
}

// Export
function exportTheme(tenant: Tenant): ThemePackage {
  return {
    version: '1.0',
    name: tenant.branding.appName,
    colors: {
      light: tenant.theme.light,
      dark: tenant.theme.dark,
    },
    typography: tenant.typography,
    borderRadius: tenant.theme.borderRadius,
    customCSS: tenant.customCSS,
    createdAt: new Date().toISOString(),
    checksum: computeChecksum(...)
  }
}

// Import with validation
function importTheme(pkg: ThemePackage): ValidationResult {
  const errors = []

  if (pkg.version !== '1.0') {
    errors.push('Unsupported version')
  }

  if (!validateChecksum(pkg)) {
    errors.push('Invalid checksum - package may be corrupted')
  }

  // Validate all colors are valid hex/rgb
  for (const [key, value] of Object.entries(pkg.colors.light)) {
    if (!isValidColor(value)) {
      errors.push(`Invalid color: ${key}`)
    }
  }

  return { valid: errors.length === 0, errors }
}
```

### Theme Editor UI Layout

```
+------------------------------------------------------------------+
|  Theme Editor                                    [Save] [Preview] |
+------------------------------------------------------------------+
|                              |                                    |
|  +------------------------+  |  +-----------------------------+   |
|  | Preset Themes          |  |  |                             |   |
|  | [nself] [slack] [disc] |  |  |     Live Preview Panel      |   |
|  +------------------------+  |  |                             |   |
|                              |  |  +-- Header with Logo -----+ |   |
|  +------------------------+  |  |  |                         | |   |
|  | Base Colors            |  |  |  +-------------------------+ |   |
|  | Primary:    [#00D4FF]  |  |  |  +- Sidebar -+  +- Main --+ |   |
|  | Secondary:  [#0EA5E9]  |  |  |  |           |  |         | |   |
|  | Accent:     [#38BDF8]  |  |  |  | Channels  |  | Messages| |   |
|  +------------------------+  |  |  |           |  |         | |   |
|                              |  |  +- - - - - -+  +- - - - -+ |   |
|  +------------------------+  |  |  +-------------------------+ |   |
|  | Surface Colors         |  |  |  | Message Input           | |   |
|  | Background: [#18181B]  |  |  |  +-------------------------+ |   |
|  | Surface:    [#27272A]  |  |  |                             |   |
|  | Border:     [#3F3F46]  |  |  +-----------------------------+   |
|  +------------------------+  |                                    |
|                              |  [Light Mode] [Dark Mode] [System] |
|  +------------------------+  |                                    |
|  | Button Colors          |  |  +-----------------------------+   |
|  | Primary BG:  [#00D4FF] |  |  | Status Indicators           |   |
|  | Primary Text:[#18181B] |  |  | [Success] [Warning] [Error] |   |
|  | Secondary... [#3F3F46] |  |  +-----------------------------+   |
|  +------------------------+  |                                    |
|                              |  +-----------------------------+   |
|  +------------------------+  |  | Import/Export               |   |
|  | Typography             |  |  | [Import JSON] [Export JSON] |   |
|  | Font: [Inter v]        |  |  | [Copy CSS Variables]        |   |
|  | Size: [16px]           |  |  +-----------------------------+   |
|  +------------------------+  |                                    |
|                              |                                    |
|  +------------------------+  |                                    |
|  | Custom CSS             |  |                                    |
|  | [Code Editor]          |  |                                    |
|  +------------------------+  |                                    |
+------------------------------------------------------------------+
```

---

## Task 111: Application Templates

### Overview

Create complete application templates that mimic the UX/UI of popular chat platforms.

### Template Structure

```typescript
interface PlatformTemplate {
  id: TemplateId
  name: string
  description: string
  version: string

  // Visual Design
  theme: {
    light: ThemeColors
    dark: ThemeColors
    defaultMode: 'light' | 'dark' | 'system'
  }

  // Layout Configuration
  layout: LayoutConfig

  // Feature Flags
  features: FeatureConfig

  // Terminology Mapping
  terminology: TerminologyConfig

  // UI Components
  components: ComponentOverrides

  // Keyboard Shortcuts
  shortcuts: ShortcutConfig
}

type TemplateId = 'nchat' | 'whatsapp' | 'telegram' | 'slack' | 'discord'
```

### WhatsApp Clone Template

```typescript
const whatsappTemplate: PlatformTemplate = {
  id: 'whatsapp',
  name: 'WhatsApp Style',
  description: 'Green theme with double-check delivery indicators and status feature',
  version: '1.0.0',

  theme: {
    light: {
      primaryColor: '#25D366', // WhatsApp green
      secondaryColor: '#128C7E', // Teal green
      accentColor: '#075E54', // Dark teal
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F0F2F5',
      textColor: '#111B21',
      mutedColor: '#667781',
      borderColor: '#E9EDEF',
      buttonPrimaryBg: '#00A884',
      buttonPrimaryText: '#FFFFFF',
      buttonSecondaryBg: '#F0F2F5',
      buttonSecondaryText: '#111B21',
      successColor: '#00A884',
      warningColor: '#FFC107',
      errorColor: '#EF4444',
      infoColor: '#53BDEB', // Blue tick color
    },
    dark: {
      primaryColor: '#00A884',
      secondaryColor: '#25D366',
      accentColor: '#128C7E',
      backgroundColor: '#111B21',
      surfaceColor: '#1F2C34',
      textColor: '#E9EDEF',
      mutedColor: '#8696A0',
      borderColor: '#2A3942',
      buttonPrimaryBg: '#00A884',
      buttonPrimaryText: '#111B21',
      buttonSecondaryBg: '#2A3942',
      buttonSecondaryText: '#E9EDEF',
      successColor: '#00A884',
      warningColor: '#FFC107',
      errorColor: '#F15C6D',
      infoColor: '#53BDEB',
    },
    defaultMode: 'light',
  },

  layout: {
    sidebarPosition: 'left',
    sidebarWidth: 380,
    sidebarCollapsible: false,
    showServerList: false, // No server concept
    showCategories: false, // Flat chat list
    showThreadsPanel: false, // Inline replies
    messageAlignment: 'bubbles', // Chat bubbles
    avatarShape: 'circle',
    avatarSize: 40,
    timestampPosition: 'inside', // Inside bubble
    inputPosition: 'bottom',
    showTypingInHeader: true,
  },

  features: {
    // Enabled
    directMessages: true,
    groupChats: true,
    voiceMessages: true,
    imageMessages: true,
    videoMessages: true,
    documentMessages: true,
    locationSharing: true,
    contactSharing: true,
    stickers: true,
    reactions: true,
    reply: true,
    forward: true,
    star: true,
    deleteForEveryone: true,
    disappearingMessages: true,
    readReceipts: true, // Double blue check
    typing: true,
    online: true,
    lastSeen: true,
    status: true, // Stories
    broadcasts: true,
    communities: true,
    polls: true,
    voiceCalls: true,
    videoCalls: true,
    groupCalls: true,
    endToEndEncryption: true,

    // Disabled
    publicChannels: false, // No public channels
    threads: false, // Inline replies instead
    channelCategories: false,
    customEmoji: false,
    gifs: true,
    bots: false,
    webhooks: false,
    slashCommands: false,
    serverHierarchy: false,
    roleColors: false,
  },

  terminology: {
    channel: 'Chat',
    channels: 'Chats',
    server: 'Group',
    servers: 'Groups',
    directMessage: 'Chat',
    thread: 'Reply',
    reaction: 'React',
    member: 'Participant',
    members: 'Participants',
    moderator: 'Admin',
    workspace: 'WhatsApp',
    message: 'Message',
    pin: 'Star',
    bookmark: 'Star',
  },

  components: {
    // Double-check delivery indicators
    MessageStatus: 'WhatsAppMessageStatus',
    // Voice message waveform
    VoiceMessage: 'WhatsAppVoiceMessage',
    // Status/Stories UI
    StatusBar: 'WhatsAppStatusBar',
    // Chat list layout
    ChatList: 'WhatsAppChatList',
  },

  shortcuts: {
    newChat: 'Ctrl+N',
    search: 'Ctrl+Shift+F',
    settings: 'Ctrl+,',
    markAsRead: 'Ctrl+Shift+U',
    archive: 'Ctrl+E',
    delete: 'Delete',
  },
}
```

### Telegram Clone Template

```typescript
const telegramTemplate: PlatformTemplate = {
  id: 'telegram',
  name: 'Telegram Style',
  description: 'Blue theme with channel-first navigation, stickers, and bot support',
  version: '1.0.0',

  theme: {
    light: {
      primaryColor: '#0088CC', // Telegram blue
      secondaryColor: '#54A3E4',
      accentColor: '#3390EC',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F4F4F5',
      textColor: '#000000',
      mutedColor: '#707579',
      borderColor: '#E7E7E7',
      buttonPrimaryBg: '#3390EC',
      buttonPrimaryText: '#FFFFFF',
      buttonSecondaryBg: '#E7F3FF',
      buttonSecondaryText: '#3390EC',
      successColor: '#4DCD5E',
      warningColor: '#E5A64E',
      errorColor: '#E53935',
      infoColor: '#3390EC',
    },
    dark: {
      primaryColor: '#8774E1', // Purple in dark mode
      secondaryColor: '#6B5DD3',
      accentColor: '#8774E1',
      backgroundColor: '#212121',
      surfaceColor: '#2B2B2B',
      textColor: '#FFFFFF',
      mutedColor: '#AAAAAA',
      borderColor: '#3D3D3D',
      buttonPrimaryBg: '#8774E1',
      buttonPrimaryText: '#FFFFFF',
      buttonSecondaryBg: '#3D3D3D',
      buttonSecondaryText: '#FFFFFF',
      successColor: '#4DCD5E',
      warningColor: '#E5A64E',
      errorColor: '#FF6B6B',
      infoColor: '#8774E1',
    },
    defaultMode: 'system',
  },

  layout: {
    sidebarPosition: 'left',
    sidebarWidth: 350,
    sidebarCollapsible: true,
    showServerList: false,
    showCategories: true, // Chat folders
    showThreadsPanel: false,
    messageAlignment: 'bubbles',
    avatarShape: 'circle',
    avatarSize: 45,
    timestampPosition: 'corner',
    inputPosition: 'bottom',
    showTypingInHeader: true,
  },

  features: {
    // Enabled
    directMessages: true,
    groupChats: true,
    supergroups: true, // Up to 200k members
    channels: true, // Broadcast channels
    secretChats: true, // E2E encrypted
    voiceMessages: true,
    videoMessages: true, // Round video notes
    stickers: true,
    animatedStickers: true,
    customStickers: true,
    gifs: true,
    reactions: true,
    reply: true,
    forward: true,
    edit: true,
    delete: true,
    scheduledMessages: true,
    pinnedMessages: true,
    chatFolders: true,
    savedMessages: true,
    readReceipts: true,
    typing: true,
    online: true,
    lastSeen: true,
    bio: true,
    username: true,
    voiceChats: true,
    videoChats: true,
    bots: true,
    botCommands: true,
    inlineKeyboards: true,
    polls: true,
    quizzes: true,
    location: true,
    contacts: true,
    spoilers: true, // Hidden media

    // Disabled
    serverHierarchy: false,
    roleColors: false,
    voiceChannels: false, // Permanent voice rooms
  },

  terminology: {
    channel: 'Chat',
    channels: 'Chats',
    server: 'Group',
    servers: 'Groups',
    directMessage: 'Chat',
    thread: 'Reply',
    member: 'Member',
    moderator: 'Admin',
    workspace: 'Telegram',
  },

  components: {
    MessageStatus: 'TelegramMessageStatus',
    VoiceMessage: 'TelegramVoiceMessage',
    VideoNote: 'TelegramVideoNote',
    StickerPicker: 'TelegramStickerPicker',
    ChatFolders: 'TelegramChatFolders',
  },

  shortcuts: {
    search: 'Ctrl+K',
    newChat: 'Ctrl+N',
    newGroup: 'Ctrl+Shift+N',
    settings: 'Ctrl+,',
    nightMode: 'Ctrl+T',
    lock: 'Ctrl+L',
  },
}
```

### Slack Clone Template

```typescript
const slackTemplate: PlatformTemplate = {
  id: 'slack',
  name: 'Slack Style',
  description: 'Sidebar-focused with thread UI, app integrations, and emoji reactions',
  version: '1.0.0',

  theme: {
    light: {
      primaryColor: '#4A154B', // Slack aubergine
      secondaryColor: '#350D36',
      accentColor: '#007A5A', // Green CTA
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F4EDE4', // Warm off-white
      textColor: '#1D1C1D',
      mutedColor: '#696969',
      borderColor: '#DDDDDC',
      buttonPrimaryBg: '#007A5A',
      buttonPrimaryText: '#FFFFFF',
      buttonSecondaryBg: '#FFFFFF',
      buttonSecondaryText: '#4A154B',
      successColor: '#007A5A',
      warningColor: '#ECB22E',
      errorColor: '#CC2E45',
      infoColor: '#1164A3',
    },
    dark: {
      primaryColor: '#D1B3D3',
      secondaryColor: '#9B6B9E',
      accentColor: '#2BAC76',
      backgroundColor: '#1A1D21',
      surfaceColor: '#222529',
      textColor: '#E8E8E8',
      mutedColor: '#BCBCBC',
      borderColor: '#35383C',
      buttonPrimaryBg: '#2BAC76',
      buttonPrimaryText: '#1A1D21',
      buttonSecondaryBg: '#4A4D52',
      buttonSecondaryText: '#E8E8E8',
      successColor: '#2BAC76',
      warningColor: '#FCB400',
      errorColor: '#E96379',
      infoColor: '#36C5F0',
    },
    defaultMode: 'system',
  },

  layout: {
    sidebarPosition: 'left',
    sidebarWidth: 260,
    sidebarCollapsible: true,
    showWorkspaceSwitcher: true,
    showSections: true, // Channel sections
    showThreadsPanel: true, // Right panel for threads
    messageAlignment: 'linear', // Not bubbles
    avatarShape: 'rounded', // Rounded square
    avatarSize: 36,
    timestampPosition: 'header', // Next to name
    inputPosition: 'bottom',
    showTypingInInput: true, // "X is typing..."
  },

  features: {
    // Enabled
    publicChannels: true,
    privateChannels: true,
    directMessages: true,
    groupDMs: true,
    threads: true,
    threadBroadcast: true, // "Also send to channel"
    reactions: true,
    customEmoji: true,
    mentions: true,
    mentionHere: true,
    mentionChannel: true,
    linkPreviews: true,
    codeBlocks: true,
    codeSnippets: true,
    fileUpload: true,
    dragDropUpload: true,
    clipboardPaste: true,
    messageEdit: true,
    messageDelete: true,
    messagePins: true,
    messageBookmarks: true, // "Save for later"
    messageShare: true,
    scheduledMessages: true,
    reminders: true,
    search: true,
    searchFilters: true,
    quickSwitcher: true, // Cmd+K
    slashCommands: true,
    webhooks: true,
    bots: true,
    apps: true, // App integrations
    workflows: true,
    huddles: true, // Lightweight audio
    canvas: true, // Collaborative docs
    keywordNotifications: true,
    doNotDisturb: true,
    notificationSchedule: true,

    // Disabled (or placeholder)
    voiceCalls: false, // Huddles instead
    videoCalls: false,
    serverHierarchy: false, // Workspaces, not servers
    voiceChannels: false,
    status: false, // No stories
  },

  terminology: {
    channel: 'Channel',
    channels: 'Channels',
    server: 'Workspace',
    servers: 'Workspaces',
    directMessage: 'Direct Message',
    thread: 'Thread',
    reaction: 'Reaction',
    member: 'Member',
    moderator: 'Admin',
    workspace: 'Workspace',
    pin: 'Pin',
    bookmark: 'Save',
  },

  components: {
    Sidebar: 'SlackSidebar',
    ThreadPanel: 'SlackThreadPanel',
    QuickSwitcher: 'SlackQuickSwitcher',
    MessageInput: 'SlackMessageInput',
    AppDirectory: 'SlackAppDirectory',
  },

  shortcuts: {
    quickSwitcher: 'Cmd+K',
    search: 'Cmd+G',
    jumpToDM: 'Cmd+Shift+K',
    browseChannels: 'Cmd+Shift+L',
    threads: 'Cmd+Shift+T',
    activity: 'Cmd+Shift+M',
    saved: 'Cmd+Shift+S',
    bold: 'Cmd+B',
    italic: 'Cmd+I',
    strikethrough: 'Cmd+Shift+X',
    code: 'Cmd+Shift+C',
    uploadFile: 'Cmd+U',
    markAsRead: 'Esc',
    markAllAsRead: 'Shift+Esc',
    toggleSidebar: 'Cmd+.',
    preferences: 'Cmd+,',
  },
}
```

### Discord Clone Template

```typescript
const discordTemplate: PlatformTemplate = {
  id: 'discord',
  name: 'Discord Style',
  description: 'Server hierarchy with voice channels, role colors, and rich embeds',
  version: '1.0.0',

  theme: {
    light: {
      primaryColor: '#5865F2', // Discord blurple
      secondaryColor: '#4752C4',
      accentColor: '#EB459E', // Discord pink
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F2F3F5',
      textColor: '#2E3338',
      mutedColor: '#747F8D',
      borderColor: '#E3E5E8',
      buttonPrimaryBg: '#5865F2',
      buttonPrimaryText: '#FFFFFF',
      buttonSecondaryBg: '#E3E5E8',
      buttonSecondaryText: '#2E3338',
      successColor: '#3BA55D',
      warningColor: '#FAA81A',
      errorColor: '#ED4245',
      infoColor: '#5865F2',
    },
    dark: {
      primaryColor: '#5865F2',
      secondaryColor: '#4752C4',
      accentColor: '#EB459E',
      backgroundColor: '#313338',
      surfaceColor: '#2B2D31',
      textColor: '#DBDEE1',
      mutedColor: '#949BA4',
      borderColor: '#1E1F22',
      buttonPrimaryBg: '#5865F2',
      buttonPrimaryText: '#FFFFFF',
      buttonSecondaryBg: '#4E5058',
      buttonSecondaryText: '#FFFFFF',
      successColor: '#3BA55D',
      warningColor: '#FAA81A',
      errorColor: '#ED4245',
      infoColor: '#5865F2',
    },
    defaultMode: 'dark',
  },

  layout: {
    sidebarPosition: 'left',
    sidebarWidth: 240,
    sidebarCollapsible: false,
    showServerList: true, // Server icons on left
    serverListWidth: 72,
    showCategories: true,
    showVoiceChannels: true,
    showMembersList: true, // Right sidebar
    membersListWidth: 240,
    showThreadsPanel: true,
    messageAlignment: 'linear',
    avatarShape: 'circle',
    avatarSize: 40,
    timestampPosition: 'hover', // Show on hover
    inputPosition: 'bottom',
    showTypingInInput: true,
  },

  features: {
    // Server/Guild
    servers: true,
    serverInvites: true,
    serverBoosts: true,
    vanityUrl: true,
    serverBanner: true,
    animatedIcon: true,
    welcomeScreen: true,
    membershipScreening: true,

    // Channels
    textChannels: true,
    voiceChannels: true,
    stageChannels: true,
    forumChannels: true,
    announcementChannels: true,
    categories: true,
    threads: true,
    privateThreads: true,

    // Roles & Permissions
    roles: true,
    roleColors: true,
    roleHierarchy: true,
    roleIcons: true,
    customPermissions: true,

    // Messaging
    reactions: true,
    customEmoji: true,
    animatedEmoji: true,
    stickers: true,
    gifs: true,
    embeds: true,
    richEmbeds: true,
    attachments: true,
    mentions: true,
    reply: true,
    edit: true,
    delete: true,
    pin: true,

    // Voice
    voiceChat: true,
    videoChat: true,
    screenShare: true,
    goLive: true,
    streaming: true,
    activities: true,

    // Moderation
    autoModeration: true,
    timeouts: true,
    bans: true,
    kicks: true,
    auditLog: true,

    // Integrations
    webhooks: true,
    bots: true,
    apps: true,
    linkedRoles: true,

    // Nitro features (placeholder)
    nitro: false,
    largeFileUploads: false,
    customStickers: false,
    profileBanner: false,
  },

  terminology: {
    channel: 'Channel',
    channels: 'Channels',
    server: 'Server',
    servers: 'Servers',
    directMessage: 'Direct Message',
    thread: 'Thread',
    member: 'Member',
    moderator: 'Moderator',
    workspace: 'Server',
    category: 'Category',
  },

  components: {
    ServerList: 'DiscordServerList',
    ChannelList: 'DiscordChannelList',
    MembersList: 'DiscordMembersList',
    VoiceChannel: 'DiscordVoiceChannel',
    RoleTag: 'DiscordRoleTag',
    Embed: 'DiscordEmbed',
    BoostProgress: 'DiscordBoostProgress',
  },

  shortcuts: {
    quickSwitcher: 'Ctrl+K',
    search: 'Ctrl+F',
    createServer: 'Ctrl+Shift+N',
    toggleMute: 'Ctrl+Shift+M',
    toggleDeafen: 'Ctrl+Shift+D',
    markAsRead: 'Escape',
    uploadFile: 'Ctrl+U',
    emojiPicker: 'Ctrl+E',
    gifPicker: 'Ctrl+G',
    mentionUser: '@',
    mentionRole: '@',
    mentionChannel: '#',
  },
}
```

---

## Task 112: Template Feature Flags

### Feature Parity Matrix

| Feature          | nChat | WhatsApp | Telegram | Slack | Discord |
| ---------------- | ----- | -------- | -------- | ----- | ------- |
| **Channels**     |
| Public Channels  | Y     | N        | Y        | Y     | Y       |
| Private Channels | Y     | Y        | Y        | Y     | Y       |
| Categories       | Y     | N        | Y        | Y     | Y       |
| Voice Channels   | Y     | N        | Y        | N     | Y       |
| Forum Channels   | Y     | N        | N        | N     | Y       |
| **Messaging**    |
| Threads          | Y     | N        | N        | Y     | Y       |
| Reactions        | Y     | Y        | Y        | Y     | Y       |
| Custom Emoji     | Y     | N        | Y        | Y     | Y       |
| Stickers         | Y     | Y        | Y        | N     | Y       |
| GIFs             | Y     | Y        | Y        | Y     | Y       |
| Voice Messages   | Y     | Y        | Y        | N     | N       |
| Scheduled        | Y     | N        | Y        | Y     | N       |
| Edit             | Y     | Y        | Y        | Y     | Y       |
| Delete for All   | Y     | Y        | Y        | Y     | Y       |
| Forward          | Y     | Y        | Y        | Y     | N       |
| **Presence**     |
| Read Receipts    | Y     | Y        | Y        | N     | N       |
| Typing           | Y     | Y        | Y        | Y     | Y       |
| Online Status    | Y     | Y        | Y        | Y     | Y       |
| Last Seen        | Y     | Y        | Y        | N     | N       |
| **Calls**        |
| Voice Calls      | Y     | Y        | Y        | N     | Y       |
| Video Calls      | Y     | Y        | Y        | N     | Y       |
| Group Calls      | Y     | Y        | Y        | N     | Y       |
| Screen Share     | Y     | N        | Y        | N     | Y       |
| **Social**       |
| Status/Stories   | Y     | Y        | N        | N     | N       |
| Broadcasts       | Y     | Y        | Y        | N     | N       |
| Bots             | Y     | N        | Y        | Y     | Y       |
| Webhooks         | Y     | N        | N        | Y     | Y       |
| **Security**     |
| E2E Encryption   | Y     | Y        | Y        | N     | N       |
| Secret Chats     | Y     | N        | Y        | N     | N       |
| Disappearing     | Y     | Y        | N        | N     | N       |
| **Structure**    |
| Server Hierarchy | Y     | N        | N        | N     | Y       |
| Role Colors      | Y     | N        | N        | N     | Y       |
| Member List      | Y     | N        | N        | N     | Y       |

### Feature Flag Implementation

```typescript
// Template feature presets
const TEMPLATE_FEATURES: Record<TemplateId, FeatureFlag[]> = {
  nchat: ALL_FEATURES, // All enabled

  whatsapp: [
    // Core
    FEATURES.CHANNELS_DIRECT,
    FEATURES.CHANNELS_GROUP_DM,
    FEATURES.MESSAGES_EDIT,
    FEATURES.MESSAGES_DELETE,
    FEATURES.MESSAGES_REACTIONS,
    FEATURES.MESSAGES_VOICE,
    FEATURES.MESSAGES_FORWARD,
    // Files
    FEATURES.FILES_UPLOAD,
    FEATURES.FILES_IMAGES,
    FEATURES.FILES_VIDEO,
    FEATURES.FILES_AUDIO,
    FEATURES.FILES_DOCUMENTS,
    // Real-time
    FEATURES.REALTIME_TYPING,
    FEATURES.REALTIME_READ_RECEIPTS,
    FEATURES.REALTIME_PRESENCE,
    // Advanced
    FEATURES.STICKERS,
    FEATURES.GIF_PICKER,
    FEATURES.POLLS,
    FEATURES.VIDEO_CALLS,
  ],

  telegram: [
    FEATURES.CHANNELS_PUBLIC,
    FEATURES.CHANNELS_PRIVATE,
    FEATURES.CHANNELS_DIRECT,
    FEATURES.CHANNELS_GROUP_DM,
    FEATURES.CHANNELS_CATEGORIES, // Chat folders
    FEATURES.MESSAGES_EDIT,
    FEATURES.MESSAGES_DELETE,
    FEATURES.MESSAGES_REACTIONS,
    FEATURES.MESSAGES_VOICE,
    FEATURES.MESSAGES_SCHEDULE,
    FEATURES.MESSAGES_PINS,
    FEATURES.MESSAGES_FORWARD,
    FEATURES.FILES_UPLOAD,
    FEATURES.FILES_IMAGES,
    FEATURES.FILES_VIDEO,
    FEATURES.FILES_AUDIO,
    FEATURES.FILES_DOCUMENTS,
    FEATURES.REALTIME_TYPING,
    FEATURES.REALTIME_READ_RECEIPTS,
    FEATURES.REALTIME_PRESENCE,
    FEATURES.STICKERS,
    FEATURES.GIF_PICKER,
    FEATURES.POLLS,
    FEATURES.BOTS,
    FEATURES.VIDEO_CALLS,
  ],

  slack: [
    FEATURES.CHANNELS_PUBLIC,
    FEATURES.CHANNELS_PRIVATE,
    FEATURES.CHANNELS_DIRECT,
    FEATURES.CHANNELS_GROUP_DM,
    FEATURES.CHANNELS_CATEGORIES,
    FEATURES.CHANNELS_TOPICS,
    FEATURES.CHANNELS_ARCHIVE,
    FEATURES.CHANNELS_FAVORITES,
    FEATURES.CHANNELS_MUTE,
    FEATURES.MESSAGES_EDIT,
    FEATURES.MESSAGES_DELETE,
    FEATURES.MESSAGES_REACTIONS,
    FEATURES.MESSAGES_THREADS,
    FEATURES.MESSAGES_PINS,
    FEATURES.MESSAGES_BOOKMARKS,
    FEATURES.MESSAGES_SCHEDULE,
    FEATURES.MESSAGES_CODE_BLOCKS,
    FEATURES.MESSAGES_MARKDOWN,
    FEATURES.MESSAGES_LINK_PREVIEWS,
    FEATURES.MESSAGES_MENTIONS,
    FEATURES.FILES_UPLOAD,
    FEATURES.FILES_IMAGES,
    FEATURES.FILES_DOCUMENTS,
    FEATURES.FILES_PREVIEW,
    FEATURES.FILES_DRAG_DROP,
    FEATURES.SEARCH_MESSAGES,
    FEATURES.SEARCH_FILES,
    FEATURES.SEARCH_FILTERS,
    FEATURES.CUSTOM_EMOJI,
    FEATURES.SLASH_COMMANDS,
    FEATURES.WEBHOOKS,
    FEATURES.BOTS,
    FEATURES.INTEGRATIONS,
    FEATURES.REMINDERS,
  ],

  discord: [
    FEATURES.CHANNELS_PUBLIC,
    FEATURES.CHANNELS_PRIVATE,
    FEATURES.CHANNELS_DIRECT,
    FEATURES.CHANNELS_GROUP_DM,
    FEATURES.CHANNELS_CATEGORIES,
    FEATURES.MESSAGES_EDIT,
    FEATURES.MESSAGES_DELETE,
    FEATURES.MESSAGES_REACTIONS,
    FEATURES.MESSAGES_THREADS,
    FEATURES.MESSAGES_PINS,
    FEATURES.MESSAGES_MARKDOWN,
    FEATURES.MESSAGES_LINK_PREVIEWS,
    FEATURES.MESSAGES_MENTIONS,
    FEATURES.FILES_UPLOAD,
    FEATURES.FILES_IMAGES,
    FEATURES.FILES_VIDEO,
    FEATURES.FILES_AUDIO,
    FEATURES.REALTIME_TYPING,
    FEATURES.REALTIME_PRESENCE,
    FEATURES.USERS_ROLES,
    FEATURES.CUSTOM_EMOJI,
    FEATURES.STICKERS,
    FEATURES.GIF_PICKER,
    FEATURES.WEBHOOKS,
    FEATURES.BOTS,
    FEATURES.VIDEO_CALLS,
    FEATURES.SCREEN_SHARE,
    FEATURES.MODERATION_TOOLS,
    FEATURES.MODERATION_AUTO_FILTER,
    FEATURES.MODERATION_WARNINGS,
    FEATURES.MODERATION_BANS,
  ],
}

// Apply template features
function applyTemplateFeatures(templateId: TemplateId): void {
  const enabledFeatures = TEMPLATE_FEATURES[templateId]

  // Disable all features first
  for (const flag of ALL_FEATURES) {
    setFeatureOverride(flag, false)
  }

  // Enable template-specific features
  for (const flag of enabledFeatures) {
    setFeatureOverride(flag, true)
  }
}
```

---

## Task 113: nChat Default Theme

### Overview

The nChat default template showcases all platform capabilities with a modern, distinctive design.

```typescript
const nchatTemplate: PlatformTemplate = {
  id: 'nchat',
  name: 'nChat',
  description: 'The complete communication platform with all features enabled',
  version: '1.0.0',

  theme: {
    light: {
      primaryColor: '#00D4FF', // nself signature cyan
      secondaryColor: '#0EA5E9',
      accentColor: '#38BDF8',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F4F4F5', // zinc-100
      textColor: '#18181B', // zinc-900
      mutedColor: '#71717A', // zinc-500
      borderColor: '#18181B1A', // zinc-900/10
      buttonPrimaryBg: '#18181B', // zinc-900
      buttonPrimaryText: '#FFFFFF',
      buttonSecondaryBg: '#F4F4F5',
      buttonSecondaryText: '#18181B',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      errorColor: '#EF4444',
      infoColor: '#00D4FF',
    },
    dark: {
      primaryColor: '#00D4FF', // Glowing cyan
      secondaryColor: '#0EA5E9',
      accentColor: '#38BDF8',
      backgroundColor: '#18181B', // zinc-900
      surfaceColor: '#27272A', // zinc-800
      textColor: '#F4F4F5', // zinc-100
      mutedColor: '#A1A1AA', // zinc-400
      borderColor: '#FFFFFF1A', // white/10
      buttonPrimaryBg: '#00D4FF',
      buttonPrimaryText: '#18181B',
      buttonSecondaryBg: '#3F3F461A',
      buttonSecondaryText: '#A1A1AA',
      successColor: '#34D399',
      warningColor: '#FBBF24',
      errorColor: '#F87171',
      infoColor: '#00D4FF',
    },
    defaultMode: 'dark',
  },

  layout: {
    sidebarPosition: 'left',
    sidebarWidth: 280,
    sidebarCollapsible: true,
    showServerList: true,
    serverListWidth: 64,
    showCategories: true,
    showVoiceChannels: true,
    showMembersList: true,
    membersListWidth: 220,
    showThreadsPanel: true,
    messageAlignment: 'linear',
    avatarShape: 'rounded',
    avatarSize: 38,
    timestampPosition: 'header',
    inputPosition: 'bottom',
    showTypingInInput: true,
  },

  features: ALL_FEATURES.reduce((acc, flag) => {
    acc[flag] = true
    return acc
  }, {} as FeatureConfig),

  terminology: {
    channel: 'Channel',
    channels: 'Channels',
    server: 'Workspace',
    servers: 'Workspaces',
    directMessage: 'Direct Message',
    thread: 'Thread',
    member: 'Member',
    moderator: 'Moderator',
    workspace: 'Workspace',
  },

  components: {
    // Use all nChat default components
  },

  shortcuts: {
    quickSwitcher: 'Cmd+K',
    search: 'Cmd+F',
    newChannel: 'Cmd+N',
    settings: 'Cmd+,',
    toggleSidebar: 'Cmd+\\',
    toggleTheme: 'Cmd+Shift+D',
  },
}
```

### Showcase Features

The nChat default theme should prominently showcase:

1. **Modern Design Language**
   - Glassmorphism effects
   - Smooth animations (Framer Motion)
   - Responsive layout

2. **All Feature Categories**
   - Real-time collaboration
   - Voice/video calls
   - E2E encryption
   - AI moderation
   - Advanced search
   - Integrations

3. **Premium Feel**
   - High-quality iconography (Lucide)
   - Refined typography (Inter)
   - Attention to detail

---

## Database Schema

### Tenant Branding Table

```sql
CREATE TABLE tenant_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Core Identity
  app_name VARCHAR(100) NOT NULL,
  tagline VARCHAR(255),
  company_name VARCHAR(100),
  website_url VARCHAR(255),

  -- Logo Assets (URLs or base64)
  logo_primary TEXT,
  logo_inverted TEXT,
  logo_icon TEXT,
  logo_wordmark TEXT,
  logo_scale DECIMAL(3,2) DEFAULT 1.0,

  -- Favicon Suite (JSON)
  favicons JSONB DEFAULT '{}',

  -- Colors (JSON)
  colors_light JSONB NOT NULL,
  colors_dark JSONB NOT NULL,

  -- Typography (JSON)
  typography JSONB DEFAULT '{}',

  -- Domain
  custom_domain VARCHAR(255) UNIQUE,
  subdomain VARCHAR(63) NOT NULL UNIQUE,
  ssl_certificate_id VARCHAR(255),
  domain_verified_at TIMESTAMPTZ,

  -- SEO
  seo_title VARCHAR(70),
  seo_description VARCHAR(160),
  seo_keywords TEXT[],
  seo_og_image TEXT,
  seo_twitter_handle VARCHAR(50),

  -- Legal
  privacy_policy_url VARCHAR(255),
  terms_of_service_url VARCHAR(255),
  cookie_policy_url VARCHAR(255),
  support_email VARCHAR(255),

  -- Custom CSS
  custom_css TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT subdomain_format CHECK (subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$')
);

CREATE INDEX idx_tenant_branding_tenant_id ON tenant_branding(tenant_id);
CREATE INDEX idx_tenant_branding_custom_domain ON tenant_branding(custom_domain);
CREATE INDEX idx_tenant_branding_subdomain ON tenant_branding(subdomain);
```

### Theme Configurations Table

```sql
CREATE TABLE theme_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Theme Identity
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,

  -- Theme Package (JSON matching ThemePackage interface)
  theme_data JSONB NOT NULL,

  -- Version Control
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  parent_id UUID REFERENCES theme_configurations(id),

  -- Sharing
  share_token VARCHAR(64) UNIQUE,
  download_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Either tenant-level or user-level, not both
  CONSTRAINT theme_owner CHECK (
    (tenant_id IS NOT NULL AND user_id IS NULL) OR
    (tenant_id IS NULL AND user_id IS NOT NULL)
  )
);

CREATE INDEX idx_theme_configurations_tenant_id ON theme_configurations(tenant_id);
CREATE INDEX idx_theme_configurations_user_id ON theme_configurations(user_id);
CREATE INDEX idx_theme_configurations_public ON theme_configurations(is_public) WHERE is_public = TRUE;
```

### Template Settings Table

```sql
CREATE TABLE template_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Active Template
  template_id VARCHAR(50) NOT NULL DEFAULT 'nchat',

  -- Template Overrides (JSON)
  layout_overrides JSONB DEFAULT '{}',
  feature_overrides JSONB DEFAULT '{}',
  terminology_overrides JSONB DEFAULT '{}',
  component_overrides JSONB DEFAULT '{}',
  shortcut_overrides JSONB DEFAULT '{}',

  -- UI Preferences
  default_theme_mode VARCHAR(10) DEFAULT 'system',
  compact_mode BOOLEAN DEFAULT FALSE,
  reduced_motion BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id)
);

CREATE INDEX idx_template_settings_tenant_id ON template_settings(tenant_id);
```

### Email Templates Table

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Template Identity
  template_type VARCHAR(50) NOT NULL,  -- 'welcome', 'password_reset', etc.
  name VARCHAR(100) NOT NULL,

  -- Content
  subject VARCHAR(255) NOT NULL,
  preheader VARCHAR(255),
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,

  -- Variables (JSON schema of available variables)
  variables_schema JSONB DEFAULT '{}',

  -- Styling
  header_logo_url TEXT,
  header_bg_color VARCHAR(10),
  header_text_color VARCHAR(10),
  body_bg_color VARCHAR(10),
  body_text_color VARCHAR(10),
  link_color VARCHAR(10),
  button_bg_color VARCHAR(10),
  button_text_color VARCHAR(10),
  footer_text TEXT,

  -- Versioning
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, template_type, version)
);

CREATE INDEX idx_email_templates_tenant_id ON email_templates(tenant_id);
CREATE INDEX idx_email_templates_type ON email_templates(template_type);
```

### Branding Audit Log Table

```sql
CREATE TABLE branding_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- Change Info
  action VARCHAR(50) NOT NULL,  -- 'create', 'update', 'delete'
  resource_type VARCHAR(50) NOT NULL,  -- 'branding', 'theme', 'template', 'email'
  resource_id UUID NOT NULL,

  -- Change Data
  changes_before JSONB,
  changes_after JSONB,

  -- Context
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_branding_audit_tenant_id ON branding_audit_log(tenant_id);
CREATE INDEX idx_branding_audit_user_id ON branding_audit_log(user_id);
CREATE INDEX idx_branding_audit_created_at ON branding_audit_log(created_at);
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Tasks**:

1. Create database tables with migrations
2. Implement tenant branding CRUD API
3. Build base theme editor component
4. Add color picker with accessibility features

**Deliverables**:

- Database schema applied
- `/api/tenants/:id/branding` endpoints
- `<ThemeEditor />` component shell
- `<ColorPicker />` component

### Phase 2: Theme Editor (Week 3-4)

**Tasks**:

1. Complete theme editor UI
2. Implement live preview panel
3. Add font selection
4. Add CSS customization editor
5. Implement import/export

**Deliverables**:

- Full theme editor with all sections
- Real-time preview working
- Theme import/export functional
- CSS injection working safely

### Phase 3: Templates (Week 5-6)

**Tasks**:

1. Finalize WhatsApp template
2. Finalize Telegram template
3. Finalize Slack template
4. Finalize Discord template
5. Create nChat default template

**Deliverables**:

- All 5 templates complete with:
  - Theme colors (light/dark)
  - Layout configuration
  - Feature flags
  - Terminology mapping

### Phase 4: Feature Flags (Week 7)

**Tasks**:

1. Map features to templates
2. Implement template switching
3. Test feature enforcement
4. Create parity matrix documentation

**Deliverables**:

- Template feature presets
- Feature enforcement working
- Parity matrix in docs

### Phase 5: Integration (Week 8)

**Tasks**:

1. Integrate with setup wizard
2. Add template selection step
3. Implement custom domain routing
4. Add email template branding
5. Write tests

**Deliverables**:

- Setup wizard integration
- Custom domain working
- Email templates branded
- 100% test coverage

---

## API Specifications

### Branding Endpoints

```typescript
// GET /api/tenants/:id/branding
interface GetBrandingResponse {
  branding: TenantBrandingConfig
  theme: ThemeConfiguration
  template: TemplateSettings
}

// PUT /api/tenants/:id/branding
interface UpdateBrandingRequest {
  branding?: Partial<TenantBrandingConfig>
  theme?: Partial<ThemeConfiguration>
  template?: Partial<TemplateSettings>
}

// POST /api/tenants/:id/branding/logo
// Multipart form: logo file
interface UploadLogoResponse {
  urls: {
    primary: string
    inverted: string
    icon: string
    wordmark: string
  }
}

// POST /api/tenants/:id/branding/favicon
interface GenerateFaviconRequest {
  source: string // Base64 or URL
}
interface GenerateFaviconResponse {
  favicons: {
    ico: string
    png16: string
    png32: string
    png180: string
    png192: string
    png512: string
    svg: string
  }
}

// POST /api/tenants/:id/domain/verify
interface VerifyDomainRequest {
  domain: string
}
interface VerifyDomainResponse {
  verified: boolean
  records: {
    expected: string
    actual: string
    valid: boolean
  }[]
}
```

### Theme Endpoints

```typescript
// GET /api/themes
interface ListThemesResponse {
  themes: ThemeConfiguration[]
  total: number
}

// POST /api/themes
interface CreateThemeRequest {
  name: string
  description?: string
  themeData: ThemePackage
  isPublic?: boolean
}

// POST /api/themes/import
interface ImportThemeRequest {
  themePackage: ThemePackage
}
interface ImportThemeResponse {
  valid: boolean
  errors?: string[]
  theme?: ThemeConfiguration
}

// GET /api/themes/:id/export
interface ExportThemeResponse {
  themePackage: ThemePackage
}
```

### Template Endpoints

```typescript
// GET /api/templates
interface ListTemplatesResponse {
  templates: PlatformTemplate[]
}

// GET /api/templates/:id
interface GetTemplateResponse {
  template: PlatformTemplate
}

// PUT /api/tenants/:id/template
interface UpdateTemplateRequest {
  templateId: TemplateId
  overrides?: PartialTemplate
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// Theme utilities
describe('theme-utils', () => {
  describe('calculateContrastRatio', () => {
    it('calculates WCAG contrast ratio correctly', () => {
      expect(calculateContrastRatio('#FFFFFF', '#000000')).toBe(21)
      expect(calculateContrastRatio('#FFFFFF', '#767676')).toBeCloseTo(4.54, 1)
    })
  })

  describe('validateThemePackage', () => {
    it('validates complete theme packages', () => {
      const result = validateThemePackage(validTheme)
      expect(result.valid).toBe(true)
    })

    it('rejects invalid colors', () => {
      const result = validateThemePackage({
        ...validTheme,
        colors: { light: { primaryColor: 'invalid' } },
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid color: primaryColor')
    })
  })
})

// Template features
describe('template-features', () => {
  describe('applyTemplateFeatures', () => {
    it('enables only template-specific features', () => {
      applyTemplateFeatures('whatsapp')

      expect(isFeatureEnabled(FEATURES.REALTIME_READ_RECEIPTS)).toBe(true)
      expect(isFeatureEnabled(FEATURES.MESSAGES_THREADS)).toBe(false)
    })
  })
})
```

### Integration Tests

```typescript
describe('Branding API', () => {
  it('updates tenant branding', async () => {
    const response = await request(app)
      .put('/api/tenants/test-tenant/branding')
      .send({
        branding: {
          appName: 'Test App',
          colors: { light: { primaryColor: '#FF0000' } },
        },
      })

    expect(response.status).toBe(200)
    expect(response.body.branding.appName).toBe('Test App')
  })

  it('verifies custom domain', async () => {
    // Mock DNS lookup
    mockDns.lookup.mockResolvedValue([{ address: '123.45.67.89' }])

    const response = await request(app)
      .post('/api/tenants/test-tenant/domain/verify')
      .send({ domain: 'chat.example.com' })

    expect(response.status).toBe(200)
    expect(response.body.verified).toBe(true)
  })
})
```

### E2E Tests

```typescript
describe('Theme Editor', () => {
  it('updates theme with live preview', async () => {
    await page.goto('/admin/branding')

    // Select color picker
    await page.click('[data-testid="primary-color-picker"]')
    await page.fill('[data-testid="color-input"]', '#FF5733')

    // Verify preview updates
    const preview = await page.$('[data-testid="live-preview"]')
    const bgColor = await preview.evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--primary')
    )
    expect(bgColor.trim()).toBe('#FF5733')
  })

  it('exports and imports theme', async () => {
    await page.goto('/admin/branding')

    // Export
    await page.click('[data-testid="export-theme"]')
    const downloadPromise = page.waitForEvent('download')
    const download = await downloadPromise
    const content = await download.path()

    // Verify export
    const theme = JSON.parse(fs.readFileSync(content, 'utf8'))
    expect(theme.version).toBe('1.0')

    // Import
    await page.setInputFiles('[data-testid="import-theme"]', content)
    await page.click('[data-testid="confirm-import"]')

    // Verify import applied
    await expect(page.locator('[data-testid="theme-name"]')).toHaveText(theme.name)
  })
})
```

---

## Migration Plan

### From Current State

1. **Data Migration**
   - Export existing theme presets to new format
   - Migrate localStorage configs to database
   - Generate audit history for existing tenants

2. **API Migration**
   - Keep `/api/config` working during transition
   - Add deprecation notices
   - Redirect to new endpoints

3. **UI Migration**
   - Add template selector to setup wizard
   - Migrate existing theme step to new editor
   - Preserve user preferences

### Rollback Strategy

1. Keep old API endpoints for 2 releases
2. Store migration state in tenant metadata
3. Provide CLI tool for rollback:
   ```bash
   nself tenant branding rollback --tenant-id=xxx
   ```

---

## Summary

This implementation plan covers Tasks 109-113 from the TODO.md with:

- **Task 109**: Complete tenant branding system with logos, colors, domains, and email templates
- **Task 110**: Comprehensive theme editor with live preview, color pickers, fonts, CSS, and import/export
- **Task 111**: Full templates for WhatsApp, Telegram, Slack, Discord with accurate UX replication
- **Task 112**: Feature flag mapping ensuring each template exposes appropriate features
- **Task 113**: nChat default template showcasing all platform capabilities

**Total Estimated Effort**: 8 weeks
**Dependencies**: Database migrations, file storage for assets, DNS verification service

---

_Document Version: 1.0.0_
_Last Updated: 2026-02-03_
_Author: Claude Code_
