---
name: Store Backend Synchronization
about: Sync Zustand stores with GraphQL backend
title: '[TODO-SYNC-001] Store Backend Synchronization'
labels: enhancement, backend, medium-priority
assignees: ''
---

## Description

Synchronize all Zustand stores with the GraphQL backend to ensure data persistence and real-time updates across clients.

## Affected Components

### Notification Settings

- [ ] `src/stores/notification-settings-store.ts:970` - Save to backend
- [ ] `src/stores/notification-settings-store.ts:1006` - Load from backend

### Admin Settings

- [ ] `src/components/admin/settings-management.tsx:20` - Save admin settings

### Message History

- [ ] `src/lib/message-history/history-manager.ts:199` - Fetch from server
- [ ] `src/lib/message-history/history-manager.ts:493` - Server-side fetching

### Edit History

- [ ] `src/hooks/useEditHistory.ts:113` - Fetch edit history from GraphQL

### Disappearing Messages

- [ ] `src/lib/disappearing/disappearing-settings.ts:321` - GraphQL mutation

### Settings Sync

- [ ] `src/lib/settings/settings-sync.ts:231` - Push API call
- [ ] `src/lib/settings/settings-sync.ts:241` - Pull API call

## Technical Requirements

### Store Synchronization Pattern

1. **Bi-directional Sync:**

   ```typescript
   // src/lib/sync/store-sync.ts
   export class StoreSync<T> {
     constructor(
       private store: StoreApi<T>,
       private queries: GraphQLQueries,
       private mutations: GraphQLMutations
     ) {}

     // Load from backend on init
     async initialize() {
       const data = await this.queries.load()
       this.store.setState(data)
     }

     // Save to backend on change
     async persist(changes: Partial<T>) {
       await this.mutations.save(changes)
     }

     // Subscribe to real-time updates
     subscribe() {
       return this.queries.subscribe((data) => {
         this.store.setState(data)
       })
     }
   }
   ```

2. **Optimistic Updates:**

   ```typescript
   const updateSetting = async (key: string, value: any) => {
     // Update UI immediately
     store.setState({ [key]: value })

     try {
       // Persist to backend
       await mutation({ variables: { key, value } })
     } catch (error) {
       // Rollback on error
       store.setState({ [key]: previousValue })
       toast.error('Failed to save setting')
     }
   }
   ```

3. **Conflict Resolution:**
   - Last-write-wins for most settings
   - Merge strategy for complex objects
   - Version tracking with timestamps

### Notification Settings Sync

1. **GraphQL Mutation:**

   ```graphql
   mutation UpdateNotificationSettings($userId: uuid!, $settings: jsonb!) {
     update_nchat_users_by_pk(
       pk_columns: { id: $userId }
       _set: { notification_preferences: $settings }
     ) {
       id
       notification_preferences
       updated_at
     }
   }
   ```

2. **Implementation:**

   ```typescript
   // src/stores/notification-settings-store.ts
   const saveToBackend = async (settings: NotificationSettings) => {
     await updateNotificationSettings({
       variables: {
         userId: currentUserId,
         settings,
       },
     })
   }

   const loadFromBackend = async () => {
     const { data } = await getNotificationSettings({
       variables: { userId: currentUserId },
     })
     return data.nchat_users_by_pk.notification_preferences
   }
   ```

### Message History Sync

1. **Pagination Strategy:**

   ```graphql
   query GetMessageHistory($channelId: uuid!, $limit: Int!, $offset: Int!, $before: timestamp) {
     nchat_messages(
       where: { channel_id: { _eq: $channelId }, created_at: { _lt: $before } }
       order_by: { created_at: desc }
       limit: $limit
       offset: $offset
     ) {
       id
       content
       author_id
       created_at
       updated_at
       edit_history
     }
   }
   ```

2. **Infinite Scroll:**

   ```typescript
   const loadMoreMessages = async () => {
     const oldestMessage = messages[0]

     const { data } = await query({
       variables: {
         channelId,
         limit: 50,
         before: oldestMessage.created_at,
       },
     })

     prependMessages(data.nchat_messages)
   }
   ```

### Edit History Sync

1. **GraphQL Query:**

   ```graphql
   query GetEditHistory($messageId: uuid!) {
     nchat_messages_by_pk(id: $messageId) {
       id
       content
       edit_history
       created_at
       updated_at
     }
   }
   ```

2. **Implementation:**

   ```typescript
   const loadEditHistory = async (messageId: string) => {
     const { data } = await getEditHistory({
       variables: { messageId },
     })

     return data.nchat_messages_by_pk.edit_history || []
   }
   ```

### Admin Settings Sync

1. **App Configuration:**

   ```graphql
   mutation UpdateAppConfig($config: jsonb!) {
     update_app_configuration(
       where: { id: { _eq: 1 } }
       _set: { config: $config, updated_at: "now()" }
     ) {
       affected_rows
       returning {
         config
         updated_at
       }
     }
   }
   ```

2. **Real-time Subscription:**
   ```graphql
   subscription WatchAppConfig {
     app_configuration {
       id
       config
       updated_at
     }
   }
   ```

### Disappearing Messages Settings

1. **GraphQL Mutation:**
   ```graphql
   mutation UpdateDisappearingSettings(
     $channelId: uuid!
     $enabled: boolean!
     $duration: interval!
   ) {
     update_nchat_channels_by_pk(
       pk_columns: { id: $channelId }
       _set: { disappearing_messages_enabled: $enabled, disappearing_messages_duration: $duration }
     ) {
       id
       disappearing_messages_enabled
       disappearing_messages_duration
     }
   }
   ```

## Database Schema Additions

```sql
-- Track sync status
CREATE TABLE nchat_sync_metadata (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES nchat_users(id),
  store_name text NOT NULL,
  last_synced_at timestamp with time zone DEFAULT now(),
  version bigint DEFAULT 1,
  UNIQUE(user_id, store_name)
);

-- Notification preferences (if not exists)
ALTER TABLE nchat_users ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{}'::jsonb;

-- Settings sync log
CREATE TABLE nchat_settings_sync_log (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  setting_key text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  synced_at timestamp with time zone DEFAULT now()
);
```

## Implementation Plan

### Phase 1: Core Infrastructure

1. Create `StoreSync` utility class
2. Add GraphQL queries/mutations for all stores
3. Implement optimistic updates pattern
4. Add conflict resolution logic

### Phase 2: Store-by-Store Migration

1. Notification settings store
2. Admin settings store
3. Message history manager
4. Edit history hook
5. Disappearing messages settings
6. General settings sync

### Phase 3: Real-time Sync

1. GraphQL subscriptions for each store
2. Handle concurrent updates
3. Sync on reconnection
4. Handle offline mode

### Phase 4: Testing

1. Unit tests for sync logic
2. Integration tests with backend
3. Conflict resolution tests
4. Offline/online transition tests

## Testing Checklist

- [ ] Settings persist after refresh
- [ ] Settings sync across multiple devices
- [ ] Optimistic updates work correctly
- [ ] Rollback on backend error
- [ ] Real-time updates from other clients
- [ ] Offline changes sync on reconnect
- [ ] Conflict resolution works correctly
- [ ] Version tracking prevents data loss

## Acceptance Criteria

- All store changes automatically saved to backend
- Settings load from backend on initialization
- Real-time sync across multiple browser tabs
- Optimistic UI updates with rollback on error
- Proper error handling with user feedback
- Loading states during sync operations
- No data loss during concurrent updates

## Performance Considerations

- [ ] Debounce frequent updates (e.g., 1 second)
- [ ] Batch multiple setting changes
- [ ] Use GraphQL mutations instead of REST
- [ ] Implement pagination for large datasets
- [ ] Cache frequently accessed data
- [ ] Use subscriptions only when needed

## Priority: Medium

Important for production but can be phased in after initial v1.0.0 launch.
