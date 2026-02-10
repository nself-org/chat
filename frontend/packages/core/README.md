# @nself-chat/core

Shared domain logic and business rules for nself-chat.

## Purpose

This package contains framework-agnostic business logic that can be used across all frontend surfaces (web, mobile, desktop). It includes:

- Domain models and types
- Business rule validation
- Core utilities
- Shared constants
- Data transformation logic

## Usage

```typescript
import { validateMessage, MessageType } from '@nself-chat/core'

const result = validateMessage({
  content: 'Hello world',
  type: MessageType.TEXT
})
```

## Design Principles

1. **Framework-agnostic**: No React, no DOM, no platform-specific code
2. **Pure functions**: Predictable, testable, easy to reason about
3. **Type-safe**: Full TypeScript coverage with strict mode
4. **Zero dependencies**: Minimal external dependencies (only Zod for validation)

## Package Structure

```
src/
├── types/           # TypeScript type definitions
├── validators/      # Zod validation schemas
├── utils/           # Pure utility functions
├── constants/       # Shared constants
└── index.ts         # Public API exports
```

## Migration from Legacy

During v0.9.2 refactor, business logic is extracted from:
- `src/lib/` → `@nself-chat/core/utils`
- `src/types/` → `@nself-chat/core/types`
- Inline validation → `@nself-chat/core/validators`

## Testing

All functions must have 100% test coverage (statements, branches, functions, lines).

```bash
pnpm test           # Run tests
pnpm test:watch     # Watch mode
pnpm type-check     # TypeScript validation
```
