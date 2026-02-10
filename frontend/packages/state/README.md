# @nself-chat/state

Shared state management and offline sync for nself-chat.

## Purpose

This package provides centralized state management using Zustand with offline-first capabilities. It includes:

- Zustand stores for global state
- Offline/online sync primitives
- State persistence (localStorage/IndexedDB)
- Optimistic updates
- Cross-tab synchronization

## Usage

```typescript
import { useAuthStore, useChannelStore } from '@nself-chat/state'

// In a React component
const { user, login, logout } = useAuthStore()
const { channels, addChannel } = useChannelStore()
```

## Design Principles

1. **Offline-first**: State survives network failures
2. **Predictable**: Immutable updates via Immer
3. **Performant**: Minimal re-renders with granular selectors
4. **Cross-surface**: Same state logic for web/mobile/desktop

## Package Structure

```
src/
├── stores/          # Zustand store definitions
├── sync/            # Offline sync logic
├── persistence/     # localStorage/IndexedDB adapters
├── middleware/      # Custom Zustand middleware
└── index.ts         # Public API exports
```

## State Architecture

```
AuthStore           → User session, permissions, profile
ChannelStore        → Channel list, metadata, subscriptions
MessageStore        → Message cache, optimistic updates
UIStore             → Theme, sidebar state, modals
ConnectionStore     → Online/offline status, sync queue
```

## Migration from Legacy

During v0.9.2 refactor, state management is extracted from:
- `src/contexts/` → `@nself-chat/state/stores`
- Component-local state → Shared stores (where appropriate)
- Inline sync logic → `@nself-chat/state/sync`

## Testing

State stores require comprehensive unit tests with 100% coverage.

```bash
pnpm test           # Run tests
pnpm test:watch     # Watch mode
```
