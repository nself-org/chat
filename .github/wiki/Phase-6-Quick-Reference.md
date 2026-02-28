# Phase 6 Quick Reference Guide

## Advanced Channels, Communities, and Structures

---

## Quick Start

### 1. Apply Database Migration

```bash
cd .backend
psql -U postgres -d nchat -f migrations/040_advanced_channels_phase6.sql
```

### 2. Import Services

```typescript
import { categoryService } from '@/services/channels/category.service'
import { communityService } from '@/services/channels/community.service'
import { broadcastService } from '@/services/channels/broadcast.service'
import { permissionService } from '@/services/channels/permission.service'
```

### 3. Use GraphQL Operations

```typescript
import { GET_CATEGORIES_WITH_CHANNELS } from '@/graphql/channels/categories'
import { CREATE_COMMUNITY } from '@/graphql/channels/communities'
import { SEND_BROADCAST } from '@/graphql/channels/broadcasts'
```

---

## Common Operations

### Categories

**Create Category**

```typescript
const category = await categoryService.createCategory({
  workspaceId: 'workspace-id',
  name: 'Engineering',
  icon: '💻',
  color: '#3b82f6',
})
```

**Reorder Categories**

```typescript
await categoryService.reorderCategories(['category-1-id', 'category-2-id', 'category-3-id'])
```

**Move Channel**

```typescript
await categoryService.moveChannel({
  channelId: 'channel-id',
  categoryId: 'new-category-id',
  position: 0,
})
```

**Sync Permissions**

```typescript
await categoryService.togglePermissionSync('category-id', true)
await categoryService.syncPermissions('category-id')
```

---

### Communities (WhatsApp-style)

**Create Community**

```typescript
const community = await communityService.createCommunity({
  workspaceId: 'workspace-id',
  name: 'Product Updates',
  description: 'Latest product news',
  announcementChannelId: 'announcement-channel-id',
  addGroupsPermission: 'admin', // or 'member'
  membersCanInvite: true,
  maxGroups: 50,
  maxMembers: 10000,
})
```

**Add Group to Community**

```typescript
await communityService.addGroup({
  communityId: 'community-id',
  channelId: 'channel-id',
  position: 0,
  addedBy: 'user-id',
})
```

**Remove Group**

```typescript
await communityService.removeGroup('community-id', 'channel-id')
```

---

### Broadcast Lists

**Create Broadcast List**

```typescript
const broadcastList = await broadcastService.createBroadcastList({
  workspaceId: 'workspace-id',
  name: 'Weekly Newsletter',
  description: 'Weekly team updates',
  ownerId: 'user-id',
  subscriptionMode: 'open', // or 'invite', 'admin'
  allowReplies: false,
  trackDelivery: true,
  trackReads: true,
  maxSubscribers: 10000,
})
```

**Subscribe Users**

```typescript
// Single subscriber
await broadcastService.subscribe('broadcast-list-id', 'user-id')

// Bulk subscribe
await broadcastService.bulkSubscribe({
  broadcastListId: 'broadcast-list-id',
  userIds: ['user-1', 'user-2', 'user-3'],
})
```

**Send Broadcast**

```typescript
const message = await broadcastService.sendBroadcast({
  broadcastListId: 'broadcast-list-id',
  content: 'Important announcement!',
  attachments: [
    { type: 'image', url: 'https://...' },
    { type: 'file', url: 'https://...' },
  ],
  scheduledFor: new Date('2026-02-10T10:00:00Z'), // Optional
})
```

**Track Delivery**

```typescript
// Delivery stats are automatically tracked via triggers
const message = await fetch(`/api/channels/broadcasts/messages/${messageId}`)
// Returns: { delivered_count, read_count, failed_count }
```

---

### Permissions

**Permission Flags**

```typescript
import { CHANNEL_PERMISSIONS } from '@/types/advanced-channels'

// Available permissions:
CHANNEL_PERMISSIONS.VIEW_CHANNEL
CHANNEL_PERMISSIONS.SEND_MESSAGES
CHANNEL_PERMISSIONS.MANAGE_CHANNEL
// ... 28 total permissions
```

**Create Permission Override**

```typescript
// Create bitfield from permission names
const allowBits = permissionService.createBitfield([
  'VIEW_CHANNEL',
  'SEND_MESSAGES',
  'ADD_REACTIONS',
])

const denyBits = permissionService.createBitfield(['MENTION_EVERYONE'])

// Apply override
await permissionService.createOverride({
  channelId: 'channel-id',
  targetType: 'role', // or 'user'
  targetId: 'role-id',
  allowPermissions: allowBits,
  denyPermissions: denyBits,
  createdBy: 'admin-user-id',
})
```

**Check Permissions**

```typescript
// Check single permission
const canSend = await permissionService.hasPermission('channel-id', 'user-id', 'SEND_MESSAGES')

// Get all permissions
const permissions = await permissionService.calculatePermissions('channel-id', 'user-id')
// Returns: { VIEW_CHANNEL: true, SEND_MESSAGES: false, ... }
```

**Work with Bitfields**

```typescript
// Parse bitfield to array
const permissions = permissionService.parseBitfield(12345n)
// Returns: ['VIEW_CHANNEL', 'SEND_MESSAGES', ...]

// Check specific permission in bitfield
const hasPermission = permissionService.hasPermissionInBitfield(12345n, 'MANAGE_CHANNEL')
```

---

## Channel Subtypes

### Promote to Supergroup (Telegram-style)

```typescript
// Automatically when member count > 200
UPDATE nchat_channels
SET subtype = 'supergroup'
WHERE member_count > 200 AND type = 'group'
```

### Create Gigagroup (Admin-only posting)

```typescript
await createChannel({
  name: 'Announcements',
  type: 'public',
  subtype: 'gigagroup',
  isReadonly: true, // Only admins can post
})
```

### Create Community Announcement Channel

```typescript
const announcementChannel = await createChannel({
  name: 'Community Updates',
  type: 'public',
  subtype: 'community_announcement',
  isReadonly: true,
})

const community = await communityService.createCommunity({
  name: 'My Community',
  announcementChannelId: announcementChannel.id,
  // ...
})
```

---

## Database Queries

### Get Categories with Channels

```sql
SELECT * FROM nchat.channels_with_categories
WHERE workspace_id = 'workspace-id'
ORDER BY category_position, position;
```

### Get Broadcast Stats

```sql
SELECT * FROM nchat.broadcast_lists_with_stats
WHERE workspace_id = 'workspace-id';
```

### Get Community Stats

```sql
SELECT * FROM nchat.communities_with_stats
WHERE workspace_id = 'workspace-id';
```

### Check Permission Override

```sql
SELECT * FROM nchat.nchat_channel_permission_overrides
WHERE channel_id = 'channel-id'
  AND target_type = 'role'
  AND target_id = 'role-id';
```

---

## GraphQL Examples

### Query Categories with Channels

```graphql
query GetCategoriesWithChannels($workspaceId: uuid!) {
  nchat_channel_categories(
    where: { workspace_id: { _eq: $workspaceId } }
    order_by: { position: asc }
  ) {
    id
    name
    icon
    color
    position
    channels(where: { is_archived: { _eq: false } }, order_by: { position: asc }) {
      id
      name
      type
      subtype
      member_count
    }
  }
}
```

### Create Community

```graphql
mutation CreateCommunity($input: CreateCommunityInput!) {
  insert_nchat_communities_one(object: $input) {
    id
    name
    announcement_channel {
      id
      name
    }
  }
}
```

### Subscribe to Broadcasts

```graphql
subscription SubscribeToBroadcastMessages($broadcastListId: uuid!) {
  nchat_broadcast_messages(
    where: { broadcast_list_id: { _eq: $broadcastListId } }
    order_by: { sent_at: desc }
    limit: 50
  ) {
    id
    content
    sent_at
    delivered_count
    read_count
  }
}
```

---

## API Endpoints

### Categories

- `GET /api/channels/categories?workspaceId=xxx` - List
- `POST /api/channels/categories` - Create
- `PATCH /api/channels/categories/:id` - Update
- `DELETE /api/channels/categories/:id` - Delete
- `POST /api/channels/categories/reorder` - Reorder
- `POST /api/channels/move` - Move channel

### Communities

- `GET /api/channels/communities?workspaceId=xxx` - List
- `POST /api/channels/communities` - Create
- `GET /api/channels/communities/:id` - Get
- `POST /api/channels/communities/:id/groups` - Add group
- `DELETE /api/channels/communities/:id/groups/:channelId` - Remove

### Broadcasts

- `GET /api/channels/broadcasts?workspaceId=xxx` - List
- `POST /api/channels/broadcasts` - Create
- `POST /api/channels/broadcasts/:id/send` - Send message
- `POST /api/channels/broadcasts/:id/subscribe` - Subscribe
- `POST /api/channels/broadcasts/:id/bulk-subscribe` - Bulk

### Permissions

- `GET /api/channels/:id/permissions` - List overrides
- `POST /api/channels/permissions` - Create override
- `GET /api/channels/:id/permissions/calculate?userId=xxx` - Calculate

---

## TypeScript Types

```typescript
import type {
  ChannelCategory,
  CategoryWithChannels,
  CreateCategoryInput,
  UpdateCategoryInput,
  Community,
  CommunityWithGroups,
  CreateCommunityInput,
  AddCommunityGroupInput,
  BroadcastList,
  BroadcastMessage,
  BroadcastDelivery,
  CreateBroadcastListInput,
  SendBroadcastInput,
  ChannelPermissionOverride,
  CreatePermissionOverrideInput,
  ChannelPermission,
  ChannelSubtype,
  SubscriptionMode,
} from '@/types/advanced-channels'
```

---

## Testing

### Unit Tests

```typescript
import { permissionService } from '@/services/channels/permission.service'

describe('PermissionService', () => {
  it('creates bitfield from permissions', () => {
    const bitfield = permissionService.createBitfield(['VIEW_CHANNEL', 'SEND_MESSAGES'])
    expect(bitfield).toBeGreaterThan(0n)
  })

  it('parses bitfield to permissions', () => {
    const permissions = permissionService.parseBitfield(7n)
    expect(permissions).toContain('VIEW_CHANNEL')
  })
})
```

### Integration Tests

```typescript
describe('Category API', () => {
  it('creates and retrieves category', async () => {
    const created = await categoryService.createCategory({
      workspaceId: 'test-workspace',
      name: 'Test Category',
    })

    const categories = await categoryService.getCategories()
    expect(categories).toContainEqual(created)
  })
})
```

---

## Troubleshooting

### Categories not appearing

- Check `workspace_id` matches default: `ffffffff-ffff-ffff-ffff-ffffffffffff`
- Verify migration ran successfully
- Check user has permission to view workspace

### Permissions not applying

- Verify permission override exists in database
- Check bitfield calculation (allow takes precedence over deny)
- Ensure category permission sync is enabled if using categories

### Broadcast delivery not tracking

- Verify `track_delivery` is enabled on broadcast list
- Check triggers are installed (`update_delivery_counts`)
- Ensure delivery records are created when sending

### Community groups not showing

- Verify channel is not archived
- Check `position` field for ordering
- Ensure user has access to both community and channel

---

## Performance Tips

1. **Cache category structures** - They rarely change
2. **Batch permission calculations** - Don't check per-message
3. **Lazy-load broadcast deliveries** - Only load when viewing details
4. **Use views** - `channels_with_categories`, `broadcast_lists_with_stats`
5. **Index properly** - Composite indexes on `(workspace_id, position)`

---

## Security Notes

1. **Validate workspace ownership** before modifying categories
2. **Check permissions** before creating broadcast lists
3. **Rate limit** broadcast sending (prevent spam)
4. **Sanitize content** in broadcasts
5. **Validate bitfields** before applying permissions

---

## Migration Notes

- All existing channels moved to default workspace
- Public/private channels assigned to "General" category
- No breaking changes to existing functionality
- Categories, communities, broadcasts are optional features
- Permission system augments (not replaces) RBAC

---

## Support

For issues or questions:

1. Check implementation summary: `docs/Phase-6-Implementation-Summary.md`
2. Review type definitions: `src/types/advanced-channels.ts`
3. Examine database schema: `.backend/migrations/040_advanced_channels_phase6.sql`
4. Test with GraphQL playground: http://localhost:8080/console

---

**Last Updated**: February 3, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
