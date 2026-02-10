# Plugin API Reference

Complete reference for all plugin system interfaces, types, and functions.

## Table of Contents

- [App Contract](#app-contract)
- [App Lifecycle](#app-lifecycle)
- [App Auth](#app-auth)
- [App Events](#app-events)
- [App Rate Limiter](#app-rate-limiter)

---

## App Contract

**Module**: `src/lib/plugins/app-contract.ts`

### Types

#### `AppScope`

Permission scope string. One of:

| Category | Scopes |
|----------|--------|
| Messages | `read:messages`, `write:messages`, `delete:messages` |
| Channels | `read:channels`, `write:channels`, `admin:channels` |
| Users | `read:users`, `read:user_email` |
| Reactions | `read:reactions`, `write:reactions` |
| Files | `read:files`, `write:files` |
| Threads | `read:threads`, `write:threads` |
| Presence | `read:presence` |
| Webhooks | `write:webhooks` |
| Admin | `admin:apps`, `admin:users`, `admin:moderation` |
| Wildcards | `admin:*`, `read:*`, `write:*` |

#### `AppEventType`

Platform event type string. See [Event System](./README.md#event-system) for full list.

#### `AppManifest`

```typescript
interface AppManifest {
  schemaVersion: '1.0'
  appId: string                    // 3-64 chars, ^[a-z][a-z0-9_.-]{2,63}$
  name: string                     // 1-64 chars
  description: string              // 1-200 chars
  longDescription?: string         // max 5000 chars, markdown
  version: string                  // semver
  developer: {
    name: string
    email: string
    url?: string
  }
  iconUrl?: string
  homepageUrl?: string
  privacyPolicyUrl?: string
  scopes: AppScope[]               // At least one required
  events?: AppEventType[]
  webhookUrl?: string              // Required if events is non-empty
  commands?: AppCommand[]
  uiSurfaces?: AppUISurface[]
  rateLimit?: AppRateLimitConfig
  redirectUrl?: string
  categories?: string[]
}
```

#### `AppCommand`

```typescript
interface AppCommand {
  name: string           // ^[a-z][a-z0-9_-]{0,31}$
  description: string
  arguments?: AppCommandArgument[]
}

interface AppCommandArgument {
  name: string
  description: string
  type: 'string' | 'number' | 'boolean' | 'user' | 'channel'
  required?: boolean
  default?: string | number | boolean
}
```

#### `RegisteredApp`

```typescript
interface RegisteredApp {
  id: string
  manifest: AppManifest
  status: 'pending_review' | 'approved' | 'rejected' | 'suspended'
  clientSecret: string
  registeredBy: string
  registeredAt: string
  updatedAt: string
  rejectionReason?: string
}
```

#### `AppInstallation`

```typescript
interface AppInstallation {
  id: string
  appId: string
  workspaceId: string
  grantedScopes: AppScope[]
  status: 'installed' | 'disabled' | 'uninstalled'
  installedBy: string
  installedAt: string
  updatedAt: string
}
```

#### `AppToken`

```typescript
interface AppToken {
  id: string
  token: string
  type: 'access_token' | 'refresh_token'
  appId: string
  installationId: string
  scopes: AppScope[]
  expiresAt: string
  issuedAt: string
  revoked: boolean
  revokedAt?: string
}
```

#### `AppEventPayload`

```typescript
interface AppEventPayload {
  deliveryId: string
  event: AppEventType
  timestamp: string
  appId: string
  installationId: string
  data: Record<string, unknown>
}
```

#### `AppSandboxContext`

```typescript
interface AppSandboxContext {
  appId: string
  installationId: string
  workspaceId: string
  scopes: AppScope[]
  rateLimitRemaining: number
  rateLimitReset: string
}
```

### Functions

#### `validateManifest(manifest: unknown): ManifestValidationResult`

Validates an app manifest against the schema contract. Returns `{ valid: boolean, errors: ManifestValidationError[] }`.

#### `hasScope(grantedScopes: AppScope[], requiredScope: AppScope): boolean`

Check if granted scopes satisfy a required scope, including wildcard expansion.

#### `hasAllScopes(grantedScopes: AppScope[], requiredScopes: AppScope[]): boolean`

Check if granted scopes satisfy all required scopes.

#### `expandScopes(scopes: AppScope[]): AppScope[]`

Expand wildcard scopes into their concrete equivalents.

#### `isValidScope(scope: string): scope is AppScope`

Type guard: checks if a string is a recognized scope.

#### `isValidEventType(eventType: string): eventType is AppEventType`

Type guard: checks if a string is a recognized event type.

#### `createSandboxContext(installation, token, rateLimitRemaining, rateLimitReset): AppSandboxContext`

Create an isolated execution context from an installation and token.

### Constants

- `ALL_SCOPES`: Complete list of all valid scopes
- `SCOPE_HIERARCHY`: Mapping of wildcard scopes to expanded scopes
- `ALL_EVENT_TYPES`: Complete list of all valid event types
- `EVENT_REQUIRED_SCOPES`: Mapping of event types to their required scopes

---

## App Lifecycle

**Module**: `src/lib/plugins/app-lifecycle.ts`

### Classes

#### `AppStore`

In-memory store for apps and installations.

| Method | Signature | Description |
|--------|-----------|-------------|
| `getApp` | `(id: string) => RegisteredApp \| undefined` | Get app by ID |
| `getAppByAppId` | `(appId: string) => RegisteredApp \| undefined` | Get app by manifest appId |
| `listApps` | `(filter?) => RegisteredApp[]` | List apps with optional status filter |
| `saveApp` | `(app: RegisteredApp) => void` | Save or update an app |
| `deleteApp` | `(id: string) => boolean` | Delete an app |
| `getInstallation` | `(id: string) => AppInstallation \| undefined` | Get installation by ID |
| `saveInstallation` | `(inst: AppInstallation) => void` | Save installation |
| `clear` | `() => void` | Clear all data |

#### `AppLifecycleManager`

Manages the full app lifecycle.

| Method | Description |
|--------|-------------|
| `registerApp(manifest, registeredBy)` | Register a new app (status: pending_review) |
| `approveApp(appId)` | Approve a pending app |
| `rejectApp(appId, reason)` | Reject a pending app |
| `suspendApp(appId, reason)` | Suspend an approved app |
| `resubmitApp(appId, updatedManifest)` | Resubmit a rejected/suspended app |
| `installApp(appId, workspaceId, installedBy, grantedScopes?)` | Install an approved app |
| `uninstallApp(installationId)` | Uninstall an app |
| `enableInstallation(installationId)` | Enable a disabled installation |
| `disableInstallation(installationId)` | Disable an active installation |
| `updateInstallationScopes(installationId, newScopes)` | Update granted scopes |
| `updateAppVersion(appId, newManifest)` | Update app manifest (may require re-approval) |

#### `AppLifecycleError`

Error class with `code` and `statusCode` properties.

| Error Code | Status | Description |
|------------|--------|-------------|
| `INVALID_MANIFEST` | 400 | Manifest validation failed |
| `DUPLICATE_APP_ID` | 409 | App with this appId already exists |
| `APP_NOT_FOUND` | 404 | App not found |
| `APP_NOT_APPROVED` | 400 | App must be approved for this action |
| `ALREADY_INSTALLED` | 409 | Already installed in this workspace |
| `SCOPE_NOT_REQUESTED` | 400 | Granted scope not in manifest |
| `INVALID_STATUS_TRANSITION` | 400 | Invalid lifecycle state change |
| `IMMUTABLE_APP_ID` | 400 | Cannot change appId |

---

## App Auth

**Module**: `src/lib/plugins/app-auth.ts`

### Classes

#### `AppTokenStore`

In-memory token store.

| Method | Description |
|--------|-------------|
| `getToken(id)` | Get token by ID |
| `getTokenByValue(tokenValue)` | Look up token by its value |
| `listTokens(filter?)` | List tokens with optional filter |
| `saveToken(token)` | Save a token |
| `clear()` | Clear all tokens |

#### `AppAuthManager`

OAuth2-style token management.

| Method | Description |
|--------|-------------|
| `issueTokens(request, app, installation)` | Issue access + refresh tokens |
| `refreshAccessToken(refreshTokenValue)` | Refresh an access token |
| `validateToken(tokenValue)` | Validate and return token details |
| `validateTokenScopes(tokenValue, requiredScopes)` | Validate token has required scopes |
| `revokeToken(tokenValue)` | Revoke a specific token |
| `revokeAllTokens(appId, installationId?)` | Revoke all tokens for an app |

#### Configuration

```typescript
interface TokenConfig {
  accessTokenTTL: number   // Default: 3600 (1 hour)
  refreshTokenTTL: number  // Default: 2592000 (30 days)
}
```

---

## App Events

**Module**: `src/lib/plugins/app-events.ts`

### Classes

#### `AppEventManager`

Event subscription and delivery manager.

| Method | Description |
|--------|-------------|
| `subscribe(app, installation, events, webhookUrl)` | Subscribe to events |
| `unsubscribe(subscriptionId)` | Deactivate a subscription |
| `removeSubscription(subscriptionId)` | Delete a subscription |
| `getSubscriptions(appId)` | List subscriptions for an app |
| `dispatchEvent(eventType, data, appSecrets)` | Dispatch event to all subscribers |
| `deliverEvent(payload, webhookUrl, secret)` | Deliver single event with retry |
| `getDeliveryStatus(deliveryId)` | Check delivery status |

#### Configuration

```typescript
interface EventDeliveryConfig {
  maxRetries: number            // Default: 5
  initialRetryDelayMs: number   // Default: 1000
  maxRetryDelayMs: number       // Default: 300000 (5 min)
  backoffMultiplier: number     // Default: 2
  deliveryTimeoutMs: number     // Default: 30000 (30 sec)
}
```

### Functions

#### `computeEventSignature(payload, secret): string`

Generate HMAC-SHA256 signature for event payload.

#### `verifyEventSignature(payload, signature, secret): boolean`

Verify an event signature using timing-safe comparison.

---

## App Rate Limiter

**Module**: `src/lib/plugins/app-rate-limiter.ts`

### Classes

#### `AppRateLimiter`

Per-app sliding window rate limiter.

| Method | Description |
|--------|-------------|
| `check(appId, config, scope?)` | Check and consume a request. Returns `AppRateLimitResult` |
| `status(appId, config, scope?)` | Get status without consuming a request |
| `reset(appId, scope?)` | Reset rate limit for an app/scope |
| `resetAll(appId)` | Reset all rate limits for an app |
| `cleanup()` | Remove expired window entries |
| `destroy()` | Stop cleanup interval and clear state |

#### `AppRateLimitResult`

```typescript
interface AppRateLimitResult {
  allowed: boolean
  remaining: number
  limit: number
  reset: number       // Unix timestamp in seconds
  retryAfter: number  // Seconds to wait (0 if allowed)
}
```

#### Configuration

```typescript
interface AppRateLimitConfig {
  requestsPerMinute: number
  burstAllowance?: number
  scopeOverrides?: Record<string, { requestsPerMinute: number }>
}

// Default: 60 req/min, 10 burst
const DEFAULT_APP_RATE_LIMIT: AppRateLimitConfig = {
  requestsPerMinute: 60,
  burstAllowance: 10,
}
```
