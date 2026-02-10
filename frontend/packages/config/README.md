# @nself-chat/config

Shared configuration and environment variables for nself-chat.

## Purpose

This package provides centralized configuration management for all frontend apps. It includes:

- Environment variable validation (Zod schemas)
- Shared ESLint config
- Shared Tailwind config
- Shared TypeScript config
- Feature flags
- Runtime config

## Usage

```typescript
import { getConfig, validateEnv } from '@nself-chat/config'

// Validate environment variables
const env = validateEnv(process.env)

// Get runtime config
const config = getConfig()
console.log(config.graphqlUrl)
```

## Design Principles

1. **Type-safe**: Environment variables validated at build time
2. **Fail-fast**: Invalid config errors caught early
3. **Centralized**: Single source of truth for all apps
4. **Extensible**: Apps can override defaults

## Package Structure

```
src/
├── env/             # Environment variable schemas
├── runtime/         # Runtime configuration
├── features/        # Feature flags
├── eslint.config.js # Shared ESLint config
├── tailwind.config.ts # Shared Tailwind config
├── tsconfig.json    # Shared TypeScript config
└── index.ts         # Public API exports
```

## Shared Configs

### ESLint

```javascript
import eslintConfig from '@nself-chat/config/eslint'

export default [
  ...eslintConfig,
  // App-specific overrides
]
```

### Tailwind

```typescript
import baseConfig from '@nself-chat/config/tailwind'

export default {
  ...baseConfig,
  content: ['./src/**/*.{ts,tsx}'],
  // App-specific overrides
}
```

### TypeScript

```json
{
  "extends": "@nself-chat/config/typescript",
  "compilerOptions": {
    // App-specific overrides
  }
}
```

## Environment Variables

All environment variables are validated using Zod schemas:

```typescript
const envSchema = z.object({
  NEXT_PUBLIC_GRAPHQL_URL: z.string().url(),
  NEXT_PUBLIC_AUTH_URL: z.string().url(),
  NEXT_PUBLIC_STORAGE_URL: z.string().url(),
  NEXT_PUBLIC_USE_DEV_AUTH: z.coerce.boolean().default(false)
})
```

## Migration from Legacy

During v0.9.2 refactor, config is extracted from:
- Root `eslint.config.mjs` → `@nself-chat/config/eslint`
- Root `tailwind.config.ts` → `@nself-chat/config/tailwind`
- Root `tsconfig.json` → `@nself-chat/config/typescript`
- Environment logic → `@nself-chat/config/env`

## Testing

Config validation requires comprehensive tests for all env var combinations.

```bash
pnpm test           # Run tests
pnpm test:watch     # Watch mode
```
