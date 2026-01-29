---
name: Direct Messaging Backend Integration
about: Implement backend APIs for DM features
title: '[TODO-DM-001] Direct Messaging Backend Integration'
labels: enhancement, backend, medium-priority
assignees: ''
---

## Description

Implement backend GraphQL mutations and API endpoints for all Direct Messaging features currently working in dev mode only.

## Affected Components

### DM Creation and Management
- [ ] `src/components/dm/NewDMModal.tsx:120` - Create DM API
- [ ] `src/components/dm/GroupDMCreate.tsx:125` - Create group DM API
- [ ] `src/components/dm/GroupDMName.tsx:50` - Update group name API
- [ ] `src/components/dm/LeaveGroupDM.tsx:61` - Leave group API
- [ ] `src/components/dm/GroupDMSettings.tsx:78,90,97` - Group settings APIs

### Member Management
- [ ] `src/components/dm/GroupDMMembers.tsx:61` - Remove member API
- [ ] `src/components/dm/GroupDMMembers.tsx:66,71` - Update member role API

### Notifications and Pins
- [ ] `src/components/dm/DMNotificationSettings.tsx:70,93,99,104` - Notification settings API
- [ ] `src/components/dm/DMPinned.tsx:55` - Pin/unpin DM API

## Technical Requirements

1. **GraphQL Mutations Needed:**
   ```graphql
   mutation CreateDM($userId: uuid!, $participantIds: [uuid!]!) { ... }
   mutation CreateGroupDM($name: String!, $participantIds: [uuid!]!) { ... }
   mutation UpdateGroupDMName($dmId: uuid!, $name: String!) { ... }
   mutation LeaveGroupDM($dmId: uuid!) { ... }
   mutation RemoveDMMember($dmId: uuid!, $userId: uuid!) { ... }
   mutation UpdateDMMemberRole($dmId: uuid!, $userId: uuid!, $role: String!) { ... }
   mutation UpdateDMNotificationSettings($dmId: uuid!, $settings: jsonb!) { ... }
   mutation PinDM($dmId: uuid!) { ... }
   mutation UnpinDM($dmId: uuid!) { ... }
   ```

2. **Database Tables:**
   - `nchat_direct_messages` (DM conversations)
   - `nchat_dm_participants` (DM memberships)
   - `nchat_dm_settings` (per-user DM settings)
   - `nchat_pinned_dms` (pinned conversations)

3. **Permissions:**
   - Only participants can view DM
   - Only creator/admin can remove members
   - Any member can leave group DM
   - All members can update their notification settings

## Testing Checklist

- [ ] Create 1:1 DM
- [ ] Create group DM
- [ ] Update group name
- [ ] Add/remove members
- [ ] Leave group
- [ ] Update notification settings
- [ ] Pin/unpin DMs
- [ ] Test permissions (unauthorized access)

## Acceptance Criteria

- All DM creation/management works in production mode
- GraphQL mutations properly validated
- RBAC permissions enforced
- Real-time updates via subscriptions
- Error handling with user-friendly messages
- Loading states during API calls

## Priority: Medium
Can be deferred to v1.1.0 if needed for v1.0.0 launch.
