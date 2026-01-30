# Configuration Guide

nchat is highly configurable through environment variables and the AppConfig system. This guide covers all configuration options.

## Table of Contents

- [Environment Variables](#environment-variables)
- [AppConfig System](#appconfig-system)
- [Backend Configuration](#backend-configuration)
- [Feature Configuration](#feature-configuration)
- [Theme Configuration](#theme-configuration)
- [Security Configuration](#security-configuration)

## Environment Variables

### Core Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_GRAPHQL_URL` | Yes | - | Hasura GraphQL endpoint |
| `NEXT_PUBLIC_AUTH_URL` | Yes | - | Authentication service URL |
| `NEXT_PUBLIC_STORAGE_URL` | Yes | - | File storage service URL |
| `NEXT_PUBLIC_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |

### Authentication Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_USE_DEV_AUTH` | No | `false` | Enable development auth |
| `NEXTAUTH_SECRET` | Prod | - | NextAuth.js secret key |
| `NEXTAUTH_URL` | Prod | - | Application URL |

### OAuth Provider Variables

#### Google

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

#### GitHub

| Variable | Description |
|----------|-------------|
| `GITHUB_CLIENT_ID` | GitHub OAuth app ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret |

#### Apple

| Variable | Description |
|----------|-------------|
| `APPLE_CLIENT_ID` | Apple Services ID |
| `APPLE_CLIENT_SECRET` | Apple client secret (JWT) |
| `APPLE_TEAM_ID` | Apple Developer Team ID |
| `APPLE_KEY_ID` | Apple Sign-In key ID |

#### ID.me

| Variable | Description |
|----------|-------------|
| `IDME_CLIENT_ID` | ID.me OAuth client ID |
| `IDME_CLIENT_SECRET` | ID.me OAuth client secret |
| `IDME_SCOPE` | ID.me verification scopes |

### Branding Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_APP_NAME` | No | `nchat` | Application name |
| `NEXT_PUBLIC_PRIMARY_COLOR` | No | `#6366f1` | Primary brand color |
| `NEXT_PUBLIC_LOGO_URL` | No | - | Logo image URL |
| `NEXT_PUBLIC_FAVICON_URL` | No | - | Favicon URL |

### Feature Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_ENABLE_CHANNELS` | `true` | Enable channels |
| `NEXT_PUBLIC_ENABLE_DM` | `true` | Enable direct messages |
| `NEXT_PUBLIC_ENABLE_THREADS` | `true` | Enable threading |
| `NEXT_PUBLIC_ENABLE_REACTIONS` | `true` | Enable reactions |
| `NEXT_PUBLIC_ENABLE_FILE_UPLOADS` | `true` | Enable file uploads |
| `NEXT_PUBLIC_ENABLE_SEARCH` | `true` | Enable search |
| `NEXT_PUBLIC_ENABLE_NOTIFICATIONS` | `true` | Enable notifications |

### Example .env.local

```env
# Backend URLs
NEXT_PUBLIC_GRAPHQL_URL=http://api.localhost/v1/graphql
NEXT_PUBLIC_AUTH_URL=http://auth.localhost/v1/auth
NEXT_PUBLIC_STORAGE_URL=http://storage.localhost/v1/storage

# Environment
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_USE_DEV_AUTH=true

# Branding
NEXT_PUBLIC_APP_NAME=My Chat App
NEXT_PUBLIC_PRIMARY_COLOR=#0ea5e9

# Features
NEXT_PUBLIC_ENABLE_CHANNELS=true
NEXT_PUBLIC_ENABLE_DM=true
NEXT_PUBLIC_ENABLE_THREADS=true
```

## AppConfig System

The AppConfig system provides runtime configuration stored in the database.

### AppConfig Interface

```typescript
interface AppConfig {
  setup: {
    completed: boolean
    completedSteps: string[]
    currentStep: number
  }
  owner: {
    name: string
    email: string
    company: string
    role: string
  }
  branding: {
    appName: string
    logo: string | null
    favicon: string | null
    tagline: string
    companyName: string
  }
  landing: {
    mode: 'landing' | 'redirect' | 'chat'
    heroTitle: string
    heroSubtitle: string
    showFeatures: boolean
    showTestimonials: boolean
  }
  auth: {
    methods: {
      email: boolean
      google: boolean
      github: boolean
      apple: boolean
      idme: boolean
    }
    permissions: 'allow-all' | 'verified-only' | 'admin-only'
    requireEmailVerification: boolean
    allowRegistration: boolean
  }
  features: {
    channels: boolean
    directMessages: boolean
    threads: boolean
    reactions: boolean
    fileUploads: boolean
    voiceMessages: boolean
    videoCall: boolean
    screenShare: boolean
    polls: boolean
    reminders: boolean
    search: boolean
    notifications: boolean
    bots: boolean
    webhooks: boolean
  }
  theme: {
    mode: 'light' | 'dark' | 'system'
    preset: string
    colors: {
      primary: string
      secondary: string
      accent: string
      background: string
      foreground: string
    }
  }
  integrations: {
    slack: { enabled: boolean, webhookUrl?: string }
    github: { enabled: boolean, token?: string }
    jira: { enabled: boolean, domain?: string }
    googleDrive: { enabled: boolean }
  }
}
```

### Accessing AppConfig

```typescript
import { useAppConfig } from '@/contexts/app-config-context'

function MyComponent() {
  const { config, updateConfig, isLoading } = useAppConfig()

  if (isLoading) return <Loading />

  return (
    <div>
      <h1>{config.branding.appName}</h1>
      <p>{config.branding.tagline}</p>
    </div>
  )
}
```

### Updating AppConfig

```typescript
const { updateConfig } = useAppConfig()

// Update branding
await updateConfig({
  branding: {
    appName: 'New Name',
    tagline: 'New tagline'
  }
})

// Update features
await updateConfig({
  features: {
    polls: true,
    voiceMessages: true
  }
})
```

### AppConfig Storage

AppConfig is stored in two locations:

1. **localStorage** - For fast initial load
2. **Database** - As source of truth

The system loads from localStorage first, then syncs with the database.

## Backend Configuration

### nself Configuration

The backend is configured via `.backend/.env`:

```env
# Database
POSTGRES_PASSWORD=secret
POSTGRES_DB=nchat

# Hasura
HASURA_GRAPHQL_ADMIN_SECRET=your-admin-secret
HASURA_GRAPHQL_JWT_SECRET={"type":"HS256","key":"your-jwt-key"}

# Auth
AUTH_JWT_SECRET=your-jwt-secret
AUTH_SMTP_HOST=smtp.example.com
AUTH_SMTP_PORT=587
AUTH_SMTP_USER=user
AUTH_SMTP_PASS=password

# Storage
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=minio123
```

### Service Configuration

Enable or disable services in `.backend/.env`:

```env
# Required services (always enabled)
# - postgres
# - hasura
# - auth
# - nginx

# Optional services
NSELF_ADMIN_ENABLED=true
MINIO_ENABLED=true
REDIS_ENABLED=true
FUNCTIONS_ENABLED=false
MAILPIT_ENABLED=true
MEILISEARCH_ENABLED=false
MLFLOW_ENABLED=false

# Monitoring bundle
MONITORING_ENABLED=false
```

## Feature Configuration

### Channel Configuration

```typescript
const channelConfig = {
  maxChannels: 100,
  maxMembersPerChannel: 1000,
  allowPrivateChannels: true,
  allowChannelCreation: 'all' | 'admin' | 'none',
  defaultChannels: ['general', 'random'],
  archiveInactiveAfterDays: 90
}
```

### Message Configuration

```typescript
const messageConfig = {
  maxLength: 10000,
  editTimeWindow: 3600, // seconds
  deleteTimeWindow: 86400, // seconds
  allowedMimeTypes: ['image/*', 'video/*', 'application/pdf'],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFilesPerMessage: 10
}
```

### Notification Configuration

```typescript
const notificationConfig = {
  enablePush: true,
  enableEmail: true,
  enableDesktop: true,
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00',
    timezone: 'America/New_York'
  },
  grouping: {
    enabled: true,
    windowSeconds: 60
  }
}
```

## Theme Configuration

### Theme Presets

nchat includes 8+ theme presets:

| Preset | Description |
|--------|-------------|
| `default` | Clean, professional look |
| `slack` | Slack-inspired colors |
| `discord` | Discord dark theme |
| `telegram` | Telegram blue theme |
| `whatsapp` | WhatsApp green theme |
| `midnight` | Dark mode with purple accents |
| `ocean` | Blue ocean theme |
| `forest` | Green nature theme |
| `sunset` | Warm orange theme |

### Custom Theme

```typescript
const customTheme = {
  mode: 'dark',
  preset: 'custom',
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    background: '#0f172a',
    foreground: '#f8fafc',
    muted: '#64748b',
    border: '#334155',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b'
  },
  fonts: {
    sans: 'Inter, sans-serif',
    mono: 'JetBrains Mono, monospace'
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem'
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
      {presets.map((preset) => (
        <option key={preset.id} value={preset.id}>
          {preset.name}
        </option>
      ))}
    </select>
  )
}
```

## Security Configuration

### Authentication Security

```typescript
const authSecurity = {
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false
  },
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60 // 24 hours
  },
  rateLimit: {
    login: {
      window: 15 * 60, // 15 minutes
      max: 5
    },
    register: {
      window: 60 * 60, // 1 hour
      max: 3
    }
  }
}
```

### Content Security

```typescript
const contentSecurity = {
  sanitize: {
    html: true,
    markdown: true,
    links: true
  },
  allowedHtml: ['b', 'i', 'u', 'a', 'code', 'pre'],
  linkPreview: {
    enabled: true,
    timeout: 5000
  },
  profanityFilter: {
    enabled: false,
    action: 'blur' | 'replace' | 'block'
  }
}
```

### CORS Configuration

In production, configure CORS in `.backend/nginx.conf`:

```nginx
location /v1/graphql {
  add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com';
  add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
  add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
}
```

## Configuration Hierarchy

Configuration is loaded in this order (later overrides earlier):

1. Default values (hardcoded)
2. Environment variables
3. `.env.local` file
4. AppConfig from database
5. Runtime updates

## Related Documentation

- [Environment Variables Reference](Reference/Environment-Variables)
- [Feature Flags Reference](Reference/Feature-Flags)
- [Theme Customization](White-Label/Themes)
- [Security Best Practices](Deployment/Self-Hosted#security)
