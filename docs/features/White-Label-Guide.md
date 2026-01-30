# White-Label Guide

Complete guide to customizing nself-chat for your brand.

---

## Overview

nself-chat is designed for complete white-labeling with **zero code required**. Everything is configurable via:

1. **Setup Wizard** - 9-step initial configuration
2. **White-Label Wizard** - Advanced branding (8 steps)
3. **Admin Dashboard** - Runtime configuration
4. **Environment Variables** - Deployment defaults

---

## Setup Wizard (9 Steps)

When you first launch nself-chat, the setup wizard guides you through:

### Step 1: Welcome
Introduction to the setup process.

### Step 2: Owner Info
```typescript
{
  name: string      // Your name
  email: string     // Contact email
  company: string   // Company name
  role: string      // Your role
}
```

### Step 3: Branding
```typescript
{
  appName: string       // "My Chat App"
  logo: string | null   // Logo URL or uploaded file
  favicon: string | null
  tagline: string       // "Team communication made easy"
  companyName: string
}
```

### Step 4: Theme
```typescript
{
  mode: 'light' | 'dark' | 'system'
  preset: string  // 'nself' | 'slack' | 'discord' | etc.
  colors: {
    primary: string    // '#6366f1'
    secondary: string
    accent: string
    background: string
    foreground: string
  }
}
```

### Step 5: Features
Toggle which features to enable:
- Channels (public, private)
- Direct Messages
- Threads
- Reactions
- File Uploads
- Voice Messages
- Polls
- Bots
- And more...

### Step 6: Authentication
Choose authentication providers:
- Email/Password
- Magic Links
- Google
- GitHub
- Apple
- Microsoft
- Phone/SMS
- ID.me

### Step 7: Access Permissions
```typescript
{
  mode: 'allow-all' | 'verified-only' | 'idme-roles' | 'domain-restricted' | 'admin-only'
  allowedDomains?: string[]
  allowedIdmeGroups?: string[]
  requireApproval?: boolean
}
```

### Step 8: Landing Page
```typescript
{
  mode: 'landing' | 'redirect' | 'chat'
  heroTitle: string
  heroSubtitle: string
  showFeatures: boolean
  showPricing: boolean
  showTestimonials: boolean
}
```

### Step 9: Review
Preview all settings and confirm.

---

## White-Label Wizard (8 Steps)

For advanced branding, access `/admin/white-label`:

### Step 1: App Info
- App Name
- Tagline
- Description
- Keywords (SEO)

### Step 2: Logo Builder
- Upload logo
- Generate logo with presets
- Color options
- Size options

### Step 3: Favicon Generator
- Upload favicon source
- Auto-generate all sizes (16x16 to 512x512)
- Apple touch icons
- Android icons

### Step 4: Color Scheme
- Primary color picker
- Secondary color
- Accent color
- Background/foreground
- Preset color schemes

### Step 5: Typography
- Font family selection
- Font sizes
- Font weights
- Line heights

### Step 6: Email Templates
Customize transactional emails:
- Welcome email
- Password reset
- Email verification
- Notification digest
- Invite email

### Step 7: Landing Page
Full landing page customization:
- Hero section
- Features section
- Pricing section
- Testimonials
- Footer

### Step 8: Custom Domain
- Connect your domain
- SSL configuration
- DNS setup instructions

---

## Theme Presets

### Available Presets

| Preset | Colors | Style |
|--------|--------|-------|
| **nself** | Indigo/Violet | Clean, modern |
| **slack** | Purple/Teal | Familiar workspace |
| **discord** | Blurple/Dark | Gaming-inspired |
| **teams** | Purple/White | Professional |
| **telegram** | Blue/White | Messenger style |
| **whatsapp** | Green/Light | Chat focused |
| **sunset** | Orange/Red | Warm tones |
| **emerald** | Green/Teal | Fresh, nature |
| **rose** | Pink/Red | Soft, friendly |
| **midnight** | Blue/Purple | Dark mode |

### Custom Theme

```typescript
const customTheme = {
  name: 'My Theme',
  mode: 'dark',
  colors: {
    primary: '#ff6b6b',
    secondary: '#4ecdc4',
    accent: '#ffe66d',
    background: '#1a1a2e',
    foreground: '#eaeaea',
    muted: '#888888',
    border: '#333333',
    error: '#ff4757',
    success: '#2ed573',
    warning: '#ffa502'
  },
  fonts: {
    sans: 'Inter, -apple-system, sans-serif',
    mono: 'JetBrains Mono, monospace'
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.1)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.1)'
  }
}
```

### Applying Themes

```typescript
import { useTheme } from '@/contexts/theme-context'

function ThemeSwitcher() {
  const { theme, setTheme, presets } = useTheme()

  return (
    <select
      value={theme.preset}
      onChange={(e) => setTheme({ preset: e.target.value })}
    >
      {presets.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  )
}
```

---

## Logo & Branding

### Logo Requirements

| Type | Size | Format | Usage |
|------|------|--------|-------|
| Main Logo | 200x50px | PNG/SVG | Header |
| Square Logo | 100x100px | PNG/SVG | Sidebar |
| Favicon | 32x32px | ICO/PNG | Browser tab |
| Apple Touch | 180x180px | PNG | iOS |
| Android | 192x192px | PNG | Android |

### Logo Generator

The built-in logo generator creates logos from:
- Text (app name)
- Icon + text
- Custom icon
- Uploaded image

Options:
- Font selection
- Color scheme
- Background style
- Border radius

### Favicon Generator

Automatically generates:
- favicon.ico (16x16, 32x32)
- favicon-16x16.png
- favicon-32x32.png
- apple-touch-icon.png (180x180)
- android-chrome-192x192.png
- android-chrome-512x512.png
- mstile-150x150.png

---

## Landing Page Templates

### Template Options

| Template | Description |
|----------|-------------|
| **Minimal** | Login only |
| **Simple** | Hero + features |
| **Marketing** | Full marketing site |
| **Corporate** | Professional business |
| **Community** | Open source / community |

### Landing Page Sections

```typescript
interface LandingPageConfig {
  hero: {
    title: string
    subtitle: string
    ctaText: string
    ctaLink: string
    backgroundImage?: string
    showDemo?: boolean
  }
  features: {
    enabled: boolean
    title: string
    items: Feature[]
  }
  pricing: {
    enabled: boolean
    title: string
    plans: Plan[]
  }
  testimonials: {
    enabled: boolean
    items: Testimonial[]
  }
  footer: {
    links: FooterLink[]
    social: SocialLink[]
    copyright: string
  }
}
```

---

## Email Customization

### Email Templates

| Template | Variables |
|----------|-----------|
| Welcome | `{name}`, `{appName}`, `{loginUrl}` |
| Verification | `{name}`, `{verifyUrl}`, `{code}` |
| Password Reset | `{name}`, `{resetUrl}`, `{expiry}` |
| Invite | `{inviterName}`, `{channelName}`, `{joinUrl}` |
| Notification | `{name}`, `{summary}`, `{detailsUrl}` |

### Email Styling

```typescript
const emailStyles = {
  headerColor: '#6366f1',
  headerLogo: 'https://...',
  bodyFont: 'Arial, sans-serif',
  buttonColor: '#6366f1',
  buttonRadius: '4px',
  footerText: '© 2024 Your Company'
}
```

---

## SEO Configuration

```typescript
const seoConfig = {
  title: 'My Chat App - Team Communication',
  description: 'The best team chat for your organization',
  keywords: ['team chat', 'communication', 'collaboration'],
  ogImage: 'https://example.com/og-image.png',
  twitterCard: 'summary_large_image',
  canonicalUrl: 'https://chat.example.com'
}
```

### Meta Tags

Automatically generated in `<head>`:

```html
<title>My Chat App - Team Communication</title>
<meta name="description" content="...">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="...">
<meta name="twitter:card" content="...">
```

---

## Custom Domain

### DNS Configuration

1. Add CNAME record:
   ```
   chat.yourdomain.com -> your-deployment.vercel.app
   ```

2. Or A record:
   ```
   chat.yourdomain.com -> YOUR_SERVER_IP
   ```

### SSL

SSL certificates are:
- **Automatic** on Vercel
- **Let's Encrypt** on self-hosted
- **Custom** for enterprise

### Configuration

```env
NEXT_PUBLIC_APP_URL=https://chat.yourdomain.com
```

---

## Environment Variables

### Quick Customization

```env
# Branding
NEXT_PUBLIC_APP_NAME=My Chat
NEXT_PUBLIC_PRIMARY_COLOR=#ff6b6b
NEXT_PUBLIC_LOGO_URL=https://example.com/logo.png
NEXT_PUBLIC_FAVICON_URL=https://example.com/favicon.ico
NEXT_PUBLIC_TAGLINE=Team communication made easy

# Landing
NEXT_PUBLIC_LANDING_MODE=marketing
NEXT_PUBLIC_SHOW_PRICING=true

# SEO
NEXT_PUBLIC_META_TITLE=My Chat - Team Communication
NEXT_PUBLIC_META_DESCRIPTION=The best team chat...
```

---

## AppConfig Persistence

All white-label settings are stored in `AppConfig`:

```typescript
const { config, updateConfig } = useAppConfig()

// Update branding
await updateConfig({
  branding: {
    appName: 'New Name',
    logo: '/uploads/new-logo.png',
    tagline: 'New tagline'
  }
})
```

### Storage Locations

1. **localStorage** - Fast initial load
2. **Database** - Source of truth
3. **Environment** - Deployment defaults

### Config API

```
GET /api/config - Fetch config
POST /api/config - Save config
```

---

## White-Label Checklist

Before launching your white-labeled app:

- [ ] App name set
- [ ] Logo uploaded
- [ ] Favicon generated
- [ ] Color scheme configured
- [ ] Theme selected
- [ ] Landing page customized
- [ ] Email templates updated
- [ ] SEO configured
- [ ] Custom domain connected
- [ ] SSL enabled
- [ ] Auth providers configured
- [ ] Feature flags set
- [ ] Legal pages linked (privacy, terms)

---

## Related Documentation

- [Configuration](Configuration)
- [Themes](Themes)
- [Landing Pages](Landing-Pages)
- [Deployment](Deployment)
