# White Label & Templates System - Complete Implementation Guide

## Overview

The nself-chat platform includes a comprehensive white-label system that allows complete customization of branding, themes, and user experience. This document covers Phase 15 implementation (Tasks 109-113).

## Table of Contents

1. [Architecture](#architecture)
2. [Template System](#template-system)
3. [Theme Customization](#theme-customization)
4. [Branding Management](#branding-management)
5. [Domain Configuration](#domain-configuration)
6. [API Reference](#api-reference)
7. [Usage Guide](#usage-guide)

---

## Architecture

### Core Components

```
src/
├── lib/white-label/
│   ├── tenant-branding.ts         # Branding service & persistence
│   ├── branding-schema.ts         # Type definitions & validation
│   └── branding-export.ts         # Export/import functionality
├── templates/
│   ├── types.ts                   # Template type definitions
│   ├── index.ts                   # Template registry & loading
│   ├── default/                   # nself default template
│   ├── slack/                     # Slack template
│   ├── discord/                   # Discord template
│   ├── telegram/                  # Telegram template
│   └── whatsapp/                  # WhatsApp template
├── components/white-label/
│   ├── theme-editor.tsx           # Visual theme editor with live preview
│   ├── template-selector.tsx     # Template selection interface
│   └── branding-dashboard.tsx    # Complete branding control center
└── app/api/tenants/[id]/branding/
    ├── route.ts                   # GET/PATCH branding config
    ├── upload/route.ts            # Logo upload
    ├── template/route.ts          # Template switching
    ├── css/route.ts               # Custom CSS
    ├── domain/route.ts            # Domain configuration
    ├── export/route.ts            # Export configuration
    └── import/route.ts            # Import configuration
```

---

## Template System

### Available Templates

#### 1. Default (nself)

- **Description**: Modern, professional design combining best of Slack, Discord, and Telegram
- **Colors**: nself cyan (#00D4FF), Protocol zinc
- **Best For**: Teams wanting modern communication platform
- **Features**: Full feature set, flexible layouts

#### 2. Slack

- **Description**: Classic Slack-style interface with aubergine accents
- **Colors**: Aubergine (#4A154B), Green (#007A5A)
- **Best For**: Professional teams and enterprises
- **Features**: Channel-based, threads, integrations

#### 3. Discord

- **Description**: Discord-style dark theme with blurple accents
- **Colors**: Blurple (#5865F2), Dark gray (#202225)
- **Best For**: Gaming communities and social groups
- **Features**: Server hierarchy, voice channels, rich embeds

#### 4. Telegram

- **Description**: Clean, fast Telegram-style interface
- **Colors**: Blue (#34B7F1), White
- **Best For**: Privacy-focused teams
- **Features**: Secret chats, channels, bots

#### 5. WhatsApp

- **Description**: WhatsApp-style chat bubbles with green theme
- **Colors**: Green (#25D366), Teal (#128C7E)
- **Best For**: Personal and small team communication
- **Features**: Bubble messages, voice notes, double checkmarks

### Template Structure

```typescript
interface PlatformTemplate {
  // Identity
  id: TemplateId
  name: string
  description: string
  version: string

  // Theme colors (light & dark)
  theme: {
    light: ThemeColors
    dark: ThemeColors
    defaultMode: 'light' | 'dark' | 'system'
  }

  // Layout configuration
  layout: LayoutConfig

  // Feature configuration
  features: FeatureConfig

  // Terminology customization
  terminology: TerminologyConfig

  // Animations
  animations: AnimationConfig

  // Custom CSS
  customCSS?: string
}
```

### Loading Templates

```typescript
import { loadTemplate, templateRegistry } from '@/templates'

// Load specific template
const template = await loadTemplate('whatsapp')

// Get all available templates
const templates = Object.values(templateRegistry)

// Load from environment
const envTemplate = await loadEnvTemplate()
```

---

## Theme Customization

### Theme Colors

Each template includes 24+ color properties for both light and dark modes:

**Primary Colors**:

- `primaryColor`
- `secondaryColor`
- `accentColor`

**Background Colors**:

- `backgroundColor`
- `surfaceColor`
- `cardColor`
- `popoverColor`

**Text Colors**:

- `textColor`
- `textMutedColor`
- `textInverseColor`

**Border Colors**:

- `borderColor`
- `borderMutedColor`

**Button Colors**:

- `buttonPrimaryBg`
- `buttonPrimaryText`
- `buttonSecondaryBg`
- `buttonSecondaryText`
- `buttonGhostHover`

**Status Colors**:

- `successColor`
- `warningColor`
- `errorColor`
- `infoColor`

**Special Colors**:

- `linkColor`
- `focusRingColor`
- `selectionBg`
- `highlightBg`

### Visual Theme Editor

The theme editor provides real-time preview:

```tsx
import { ThemeEditor } from '@/components/white-label/theme-editor'
;<ThemeEditor
  tenantId="your-tenant-id"
  initialColors={{
    light: { primaryColor: '#3B82F6' },
    dark: { primaryColor: '#60A5FA' },
  }}
  onSave={(theme) => {
    // Save theme
  }}
/>
```

**Features**:

- Color picker for each property
- Live preview with sample UI
- Light/dark mode toggle
- Export/import theme JSON
- Reset to defaults

---

## Branding Management

### Tenant Branding Service

```typescript
import { tenantBrandingService } from '@/lib/white-label/tenant-branding'

// Get branding configuration
const branding = await tenantBrandingService.getTenantBranding('tenant-id')

// Update branding
await tenantBrandingService.updateTenantBranding(
  'tenant-id',
  {
    appInfo: { appName: 'My App' },
    colors: { primary: '#3B82F6' },
  },
  'user-id'
)

// Upload logo
const { url, storageKey } = await tenantBrandingService.uploadLogo('tenant-id', file, 'primary')

// Switch template
await tenantBrandingService.switchTemplate(
  'tenant-id',
  'slack',
  'user-id',
  true // preserve customizations
)

// Export/import
const blob = await tenantBrandingService.exportBranding('tenant-id')
await tenantBrandingService.importBranding('tenant-id', file, 'user-id')
```

### Logo Management

Upload and manage three logo types:

1. **Primary Logo**: Main logo (recommended: 200x60px)
2. **Square Logo**: Icon version (recommended: 512x512px)
3. **Favicon**: Browser tab icon (recommended: 32x32px)

```typescript
// Upload logo
const formData = new FormData()
formData.append('file', logoFile)
formData.append('type', 'primary')
formData.append('tenantId', 'tenant-id')

const response = await fetch('/api/tenants/tenant-id/branding/upload', {
  method: 'POST',
  body: formData,
})

const { url, storageKey } = await response.json()
```

### Custom CSS Injection

Add custom styles to override or extend template styles:

```typescript
await tenantBrandingService.applyCustomCSS(
  'tenant-id',
  `
  /* Custom styles */
  .custom-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .message-bubble {
    border-radius: 16px;
  }
  `,
  'user-id'
)
```

**Security Notes**:

- CSS is sanitized on the server
- No `<script>` tags allowed
- Limited to CSS properties only

---

## Domain Configuration

### Custom Domain Setup

1. **Configure Domain**:

```typescript
const { dnsRecords, verificationToken } = await tenantBrandingService.configureDomain(
  'tenant-id',
  'chat.yourdomain.com',
  'user-id'
)
```

2. **Add DNS Records**:

```
Type: CNAME
Name: chat.yourdomain.com
Value: tenant-id.nself.app

Type: TXT
Name: _nself-verification.chat.yourdomain.com
Value: [verification-token]
```

3. **Verify Domain**:

```typescript
const { verified, errors } = await tenantBrandingService.verifyDomain(
  'tenant-id',
  'chat.yourdomain.com'
)
```

### Subdomain Configuration

Each tenant automatically gets a subdomain:

- Format: `{tenantId}.nself.app`
- SSL: Automatic via Let's Encrypt
- No configuration required

---

## API Reference

### GET /api/tenants/[id]/branding

Fetch tenant branding configuration.

**Response**:

```json
{
  "tenantId": "string",
  "templateId": "default | slack | discord | telegram | whatsapp",
  "customTemplate": {},
  "customCSS": "string",
  "logos": {
    "primary": { "url": "string", "storageKey": "string" },
    "square": { "url": "string", "storageKey": "string" },
    "favicon": { "url": "string", "storageKey": "string" }
  },
  "domains": {
    "primary": "string",
    "custom": ["string"],
    "subdomain": "string"
  },
  "themeOverrides": {
    "light": {},
    "dark": {}
  }
}
```

### PATCH /api/tenants/[id]/branding

Update tenant branding configuration.

**Request**:

```json
{
  "updates": {
    "appInfo": { "appName": "My App" },
    "colors": { "primary": "#3B82F6" }
  },
  "userId": "string"
}
```

### POST /api/tenants/[id]/branding/upload

Upload logo file.

**Request**: FormData with `file`, `type`, `tenantId`

**Response**:

```json
{
  "url": "string",
  "storageKey": "string"
}
```

### POST /api/tenants/[id]/branding/template

Switch template.

**Request**:

```json
{
  "templateId": "slack",
  "userId": "string",
  "preserveCustomizations": true
}
```

### POST /api/tenants/[id]/branding/css

Apply custom CSS.

**Request**:

```json
{
  "css": "string",
  "userId": "string"
}
```

### POST /api/tenants/[id]/branding/domain

Configure custom domain.

**Request**:

```json
{
  "domain": "chat.yourdomain.com",
  "userId": "string"
}
```

**Response**:

```json
{
  "dnsRecords": [
    { "type": "CNAME", "name": "...", "value": "..." },
    { "type": "TXT", "name": "...", "value": "..." }
  ],
  "verificationToken": "string"
}
```

### GET /api/tenants/[id]/branding/export

Export branding configuration as JSON.

**Response**: JSON file download

### POST /api/tenants/[id]/branding/import

Import branding configuration from JSON.

**Request**: FormData with `file`, `userId`

---

## Usage Guide

### For Administrators

#### 1. Access Branding Dashboard

Navigate to: `/admin/branding`

#### 2. Choose Template

1. Click "Template" tab
2. Review available templates
3. Preview each template
4. Click "Apply Template"
5. Confirm template switch

#### 3. Customize Theme

1. Click "Theme" tab
2. Switch between Light/Dark mode
3. Adjust colors using color pickers
4. Preview changes in real-time
5. Click "Save Theme"

#### 4. Upload Logos

1. Click "Logos" tab
2. Upload primary logo (200x60px recommended)
3. Upload square logo/icon (512x512px)
4. Upload favicon (32x32px)

#### 5. Configure Domain

1. Click "Domain" tab
2. Enter custom domain
3. Click "Configure"
4. Add DNS records to your domain
5. Click "Verify Domain"

#### 6. Add Custom CSS

1. Click "Custom CSS" tab
2. Write custom CSS
3. Preview changes
4. Click "Save CSS"

#### 7. Export Configuration

1. Click "Export" button
2. Save JSON file
3. Use for backup or migration

### For Developers

#### Integrate Template System

```typescript
import { loadTemplate, customizeTemplate } from '@/templates'

// Load base template
const baseTemplate = await loadTemplate('slack')

// Customize template
const customTemplate = customizeTemplate(baseTemplate, {
  theme: {
    light: {
      primaryColor: '#FF0000',
    },
  },
  layout: {
    sidebarWidth: 280,
  },
})
```

#### Listen to Branding Changes

```typescript
import { tenantBrandingService } from '@/lib/white-label/tenant-branding'

// Listen for changes
const unsubscribe = tenantBrandingService.onBrandingChange((tenantId, branding) => {
  console.log('Branding updated:', tenantId, branding)
  // Update UI
})

// Cleanup
unsubscribe()
```

#### Generate CSS Variables

```typescript
import { generateCSSVariables, generateTemplateCSS } from '@/templates'

const template = await loadTemplate('whatsapp')

// Generate CSS variables
const cssVars = generateCSSVariables(template.theme.light)

// Generate complete CSS
const css = generateTemplateCSS(template)
```

---

## Template Feature Comparison

| Feature            | Default | Slack | Discord | Telegram | WhatsApp |
| ------------------ | ------- | ----- | ------- | -------- | -------- |
| Threads            | ✅      | ✅    | ✅      | ❌       | ❌       |
| Reactions          | ✅      | ✅    | ✅      | ✅       | ✅       |
| Voice Messages     | ✅      | ❌    | ✅      | ✅       | ✅       |
| Code Blocks        | ✅      | ✅    | ✅      | ✅       | ❌       |
| Link Previews      | ✅      | ✅    | ✅      | ✅       | ✅       |
| Read Receipts      | ✅      | ✅    | ❌      | ✅       | ✅       |
| Typing Indicators  | ✅      | ✅    | ✅      | ✅       | ✅       |
| Channel Categories | ✅      | ✅    | ✅      | ❌       | ❌       |
| Message Bubbles    | ❌      | ❌    | ❌      | ✅       | ✅       |
| Server Hierarchy   | ❌      | ❌    | ✅      | ❌       | ❌       |

---

## Best Practices

### Theme Design

1. **Maintain Contrast**: Ensure text is readable on backgrounds (WCAG AA minimum)
2. **Consistent Colors**: Use primary color consistently across buttons and links
3. **Dark Mode**: Test both light and dark modes thoroughly
4. **Accessibility**: Consider colorblind users (don't rely solely on color)

### Logo Guidelines

1. **Primary Logo**: Horizontal logo with text, transparent background
2. **Square Logo**: Icon-only version, centered, transparent background
3. **Favicon**: Simple, recognizable at small sizes
4. **File Formats**: PNG for raster, SVG for vector
5. **File Size**: Keep under 500KB for performance

### Custom CSS

1. **Scope Selectors**: Use specific selectors to avoid conflicts
2. **Test Thoroughly**: Check in both light and dark modes
3. **Performance**: Avoid expensive selectors (nested, attribute)
4. **Maintenance**: Comment your code for future reference
5. **Validation**: Use CSS linters before applying

### Domain Configuration

1. **DNS Propagation**: Allow 24-48 hours for DNS changes
2. **SSL Certificates**: Automatic via Let's Encrypt (no action needed)
3. **Subdomains**: Use for staging/testing environments
4. **Email**: Configure SPF/DKIM records separately

---

## Troubleshooting

### Template Not Applying

**Problem**: Template changes don't appear

**Solutions**:

- Clear browser cache
- Check localStorage: `localStorage.removeItem('template-cache')`
- Verify API response: Check Network tab
- Check console for errors

### Logo Not Uploading

**Problem**: Logo upload fails

**Solutions**:

- Check file size (must be < 5MB)
- Check file format (PNG, JPG, SVG, WebP only)
- Verify storage permissions
- Check server logs for errors

### Domain Verification Failing

**Problem**: Custom domain won't verify

**Solutions**:

- Wait for DNS propagation (up to 48 hours)
- Verify DNS records with `dig` or `nslookup`
- Check for typos in DNS records
- Ensure no conflicting records

### CSS Not Applying

**Problem**: Custom CSS doesn't take effect

**Solutions**:

- Check for CSS syntax errors
- Ensure selectors are specific enough
- Clear browser cache
- Check if styles are being overridden
- Use `!important` sparingly

---

## Migration Guide

### From v0.8.0 to v0.9.0

The white-label system is new in v0.9.0. To migrate:

1. **Backup Current Configuration**:

   ```bash
   curl https://your-instance.com/api/config > config-backup.json
   ```

2. **Choose Template**:
   - Review available templates
   - Select one that matches your current design
   - Default template is closest to v0.8.0

3. **Import Configuration**:

   ```bash
   # Via API
   curl -X POST \
     -F "file=@config-backup.json" \
     -F "userId=admin" \
     https://your-instance.com/api/tenants/YOUR_ID/branding/import
   ```

4. **Customize**:
   - Adjust colors to match old branding
   - Upload existing logos
   - Apply any custom CSS

5. **Test Thoroughly**:
   - Check all pages
   - Test both light and dark modes
   - Verify mobile responsiveness

---

## Security Considerations

### CSS Injection

- All CSS is sanitized on the server
- No `<script>` tags allowed
- No `@import` from external sources
- No `url()` to external resources
- Limited to safe CSS properties

### Domain Verification

- TXT record verification prevents domain hijacking
- CNAME must point to platform domain
- SSL certificates issued after verification
- Regular verification checks

### Logo Storage

- Files scanned for malware
- Strict file type validation
- Size limits enforced
- Isolated storage per tenant
- CDN delivery for performance

---

## Performance Optimization

### Template Loading

- Templates lazy-loaded on demand
- Cached after first load
- Minimal bundle size impact
- Code splitting per template

### CSS Generation

- CSS variables for runtime switching
- Minimal DOM manipulation
- Hardware-accelerated animations
- Critical CSS inlined

### Logo Delivery

- Optimized image formats (WebP)
- Responsive images with srcset
- CDN caching
- Lazy loading below the fold

---

## Support

For issues or questions:

1. **Documentation**: Check this guide first
2. **Community**: Discord channel #white-label
3. **Support**: support@nself.org
4. **Enterprise**: enterprise@nself.org

---

## Changelog

### v0.9.0 (2026-02-03)

- ✨ Initial white-label system release
- ✨ 5 pre-built templates
- ✨ Visual theme editor
- ✨ Logo management
- ✨ Custom domain support
- ✨ Custom CSS injection
- ✨ Export/import functionality
- ✨ Complete branding dashboard

---

## License

This white-label system is part of nself-chat and subject to the same license terms.

---

**Last Updated**: February 3, 2026
**Version**: 0.9.0
**Author**: nself team
