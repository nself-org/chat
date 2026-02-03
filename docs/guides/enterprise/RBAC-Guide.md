# Enterprise RBAC Guide

Advanced Role-Based Access Control (RBAC) with custom roles, fine-grained permissions, and role templates.

## Table of Contents

1. [Overview](#overview)
2. [System Roles](#system-roles)
3. [Custom Roles](#custom-roles)
4. [Permission System](#permission-system)
5. [Role Templates](#role-templates)
6. [Best Practices](#best-practices)
7. [Examples](#examples)

## Overview

nself-chat provides enterprise-grade RBAC with:

- **System Roles**: Pre-defined roles (Owner, Admin, Moderator, Member, Guest)
- **Custom Roles**: Create unlimited custom roles with specific permissions
- **Permission Groups**: Organized permission sets by category
- **Role Inheritance**: Inherit permissions from base roles
- **Role Templates**: Quick-start templates for common scenarios
- **Priority System**: Resolve conflicts when users have multiple roles
- **Time-Based Roles**: Auto-expiring role assignments
- **User Limits**: Maximum users per role

## System Roles

### Built-in Hierarchy

```
Owner (100)
  └─ Administrator (80)
      └─ Moderator (60)
          └─ Member (40)
              └─ Guest (20)
```

### Owner

- **Level**: 100 (Highest)
- **Count**: 1 (Transferable only)
- **Permissions**: All system permissions

**Capabilities**:

- Transfer ownership
- Configure system settings
- Manage all users and roles
- Access backup and restore
- Billing and subscription management

### Administrator

- **Level**: 80
- **Permissions**: All except ownership transfer

**Capabilities**:

- Manage users (create, edit, delete, ban)
- Manage channels (all operations)
- Configure integrations
- View audit logs and analytics
- Manage webhooks

### Moderator

- **Level**: 60
- **Permissions**: Content moderation and channel management

**Capabilities**:

- Create and manage channels
- Delete messages (any user)
- Mute/kick users
- View and resolve reports
- Pin messages
- Invite users

### Member

- **Level**: 40 (Default)
- **Permissions**: Standard chat functionality

**Capabilities**:

- Send messages
- Create threads
- Upload files
- Join channels
- Edit own messages
- React to messages

### Guest

- **Level**: 20
- **Permissions**: Read-only access

**Capabilities**:

- View channels (invited only)
- React to messages
- Download files
- View user profiles

## Custom Roles

### Creating Custom Roles

Navigate to **Admin Dashboard → Users → Role Management**

#### Basic Information

```yaml
Name: Content Manager
Slug: content-manager
Description: Manages content across all channels
Color: #8B5CF6
Priority: 55
Base Role: moderator (optional)
```

#### Permission Selection

Choose from 50+ granular permissions organized into categories:

- **Channels**: create, delete, update, archive, permissions
- **Messages**: send, edit, delete, pin, schedule
- **Files**: upload, download, delete
- **Users**: invite, ban, mute, assign roles
- **Moderation**: reports, warnings, slow mode
- **Admin**: dashboard, settings, integrations

#### Advanced Settings

```yaml
Maximum Users: 10
Auto-Expire: 90 days
Default Role: false
```

### Permission Inheritance

Custom roles can inherit from:

1. **Base Role**: Inherit all permissions from a system role
2. **Other Custom Roles**: Inherit from multiple custom roles
3. **Explicit Permissions**: Add additional specific permissions

**Example**:

```typescript
{
  name: "Community Manager",
  baseRole: "moderator",
  inheritedRoles: ["content-manager"],
  permissions: ["admin:analytics", "admin:webhooks"]
}
```

**Effective Permissions** = Base Role + Inherited Roles + Explicit Permissions

## Permission System

### Permission Categories

#### 1. Channel Permissions

| Permission                   | Description                         | Min Role  |
| ---------------------------- | ----------------------------------- | --------- |
| `channel:create`             | Create new channels                 | Moderator |
| `channel:delete`             | Delete channels                     | Admin     |
| `channel:update`             | Edit channel settings               | Moderator |
| `channel:manage_permissions` | Manage channel-specific permissions | Admin     |
| `channel:archive`            | Archive/unarchive channels          | Admin     |

#### 2. Message Permissions

| Permission           | Description        | Min Role  |
| -------------------- | ------------------ | --------- |
| `message:send`       | Send messages      | Member    |
| `message:edit_own`   | Edit own messages  | Member    |
| `message:edit_any`   | Edit any message   | Moderator |
| `message:delete_any` | Delete any message | Moderator |
| `message:pin`        | Pin messages       | Moderator |
| `message:schedule`   | Schedule messages  | Moderator |

#### 3. User Permissions

| Permission           | Description        | Min Role |
| -------------------- | ------------------ | -------- |
| `user:invite`        | Invite new users   | Member   |
| `user:ban`           | Ban users          | Admin    |
| `user:assign_role`   | Assign roles       | Admin    |
| `user:view_activity` | View user activity | Admin    |

#### 4. Admin Permissions

| Permission        | Description            | Min Role |
| ----------------- | ---------------------- | -------- |
| `admin:dashboard` | Access admin dashboard | Admin    |
| `admin:users`     | Manage users           | Admin    |
| `admin:settings`  | Configure settings     | Admin    |
| `admin:audit_log` | View audit logs        | Admin    |
| `admin:webhooks`  | Manage webhooks        | Admin    |

#### 5. System Permissions

| Permission                  | Description          | Min Role |
| --------------------------- | -------------------- | -------- |
| `system:config`             | System configuration | Owner    |
| `system:transfer_ownership` | Transfer ownership   | Owner    |
| `system:backup`             | Backup/restore       | Owner    |

### Permission Resolution

When a user has multiple roles:

1. **Collect all permissions** from all assigned roles
2. **Remove duplicates** (set union)
3. **Apply priority** for conflicting settings
4. **Check expiration** of time-based roles

## Role Templates

Pre-configured templates for common scenarios:

### 1. Community Manager

**Category**: Management
**Base Role**: Moderator
**Permissions**: 15
**Recommended**: Yes

Ideal for community engagement leaders who manage channels and moderate content.

**Key Permissions**:

- Create/update channels
- Delete any message
- Invite users
- View/resolve reports

### 2. Content Moderator

**Category**: Moderation
**Base Role**: Moderator
**Permissions**: 12
**Recommended**: Yes

Focused on content safety and moderation.

**Key Permissions**:

- Delete/edit any message
- Mute/kick users
- View reports
- Manage slow mode

### 3. Support Agent

**Category**: Support
**Base Role**: Member
**Permissions**: 8
**Recommended**: Yes

Customer support with read access to user information.

**Key Permissions**:

- View user profiles
- View user activity
- Send messages
- Access support channels

### 4. Developer

**Category**: Developer
**Base Role**: Member
**Permissions**: 6
**Recommended**: No

API and integration management.

**Key Permissions**:

- Manage webhooks
- Manage integrations
- View analytics

### 5. Analyst

**Category**: Management
**Base Role**: Member
**Permissions**: 5
**Recommended**: No

Analytics and reporting access.

**Key Permissions**:

- View analytics
- View audit logs
- View user activity

### 6. Channel Administrator

**Category**: Management
**Base Role**: Member
**Permissions**: 10
**Recommended**: No

Manage specific channels without full moderation.

**Key Permissions**:

- Create/update/delete channels
- Manage channel permissions
- Pin messages

## Best Practices

### 1. Least Privilege Principle

- Start with minimum permissions
- Add permissions as needed
- Regular permission audits

### 2. Role Naming

Use clear, descriptive names:

✅ Good: "Community Manager", "Content Moderator"
❌ Bad: "Role1", "SuperUser"

### 3. Role Documentation

Document each custom role's purpose:

```yaml
Name: Content Manager
Description: |
  Manages content creation and moderation across all
  public channels. Responsible for community engagement
  and content quality.
Responsibilities:
  - Review flagged content
  - Moderate discussions
  - Engage with community
  - Create announcements
```

### 4. Regular Reviews

- **Monthly**: Review role assignments
- **Quarterly**: Audit permissions
- **Annually**: Review custom roles

### 5. Testing

Test new roles in a staging environment:

1. Create role with limited permissions
2. Test with test user account
3. Verify expected behavior
4. Adjust permissions
5. Deploy to production

### 6. Role Segmentation

Separate concerns into multiple roles:

Instead of one "Power User" role:

- Create "Content Manager" for content
- Create "Community Manager" for engagement
- Create "Support Agent" for customer service

## Examples

### Example 1: Marketing Team Role

Create a role for marketing team with limited permissions:

```typescript
{
  name: "Marketing Team",
  slug: "marketing-team",
  description: "Marketing team members with announcement privileges",
  color: "#F59E0B",
  priority: 45,
  baseRole: "member",
  permissions: [
    "channel:create",
    "message:send",
    "message:schedule",
    "message:pin",
    "file:upload"
  ],
  maxUsers: 5
}
```

### Example 2: Temporary Moderator

Create a time-limited moderator role:

```typescript
{
  name: "Event Moderator",
  slug: "event-moderator",
  description: "Temporary moderation for special events",
  color: "#8B5CF6",
  priority: 65,
  baseRole: "moderator",
  expiresAfter: 7, // Auto-expire after 7 days
  permissions: [
    "message:delete_any",
    "user:mute",
    "user:kick",
    "channel:update"
  ]
}
```

### Example 3: Read-Only Admin

Admin with view-only permissions for compliance:

```typescript
{
  name: "Compliance Officer",
  slug: "compliance-officer",
  description: "Read-only admin access for compliance review",
  color: "#3B82F6",
  priority: 75,
  permissions: [
    "admin:dashboard",
    "admin:audit_log",
    "admin:analytics",
    "user:view_activity",
    // No write/delete permissions
  ]
}
```

### Example 4: Inherited Permissions

Create a role that inherits from multiple sources:

```typescript
{
  name: "Senior Community Manager",
  slug: "senior-community-manager",
  description: "Senior role with combined permissions",
  color: "#10B981",
  priority: 70,
  baseRole: "moderator",
  inheritedRoles: [
    "community-manager",
    "content-moderator"
  ],
  permissions: [
    "admin:analytics",
    "admin:webhooks"
  ]
}
```

## API Reference

### GraphQL Mutations

```graphql
# Create custom role
mutation CreateRole {
  createRole(
    input: {
      name: "Content Manager"
      slug: "content-manager"
      baseRole: MODERATOR
      permissions: ["channel:create", "message:delete_any"]
      priority: 55
    }
  ) {
    id
    name
    permissions
  }
}

# Assign role to user
mutation AssignRole {
  assignRole(input: { userId: "user-123", roleId: "role-456", expiresAt: "2026-12-31T23:59:59Z" }) {
    id
    userId
    roleId
    expiresAt
  }
}

# Check user permission
query CheckPermission {
  userHasPermission(userId: "user-123", permission: "message:delete_any")
}
```

### REST API

```bash
# Create role
POST /api/admin/roles
{
  "name": "Content Manager",
  "permissions": ["channel:create"]
}

# Assign role
POST /api/admin/users/{userId}/roles
{
  "roleId": "role-456"
}

# Get user permissions
GET /api/users/{userId}/permissions
```

## Migration Guide

### From Fixed Roles to Custom Roles

1. **Audit Current Usage**

   ```sql
   SELECT role, COUNT(*) as user_count
   FROM users
   GROUP BY role;
   ```

2. **Create Equivalent Custom Roles**
   - Map system roles to custom roles
   - Add organization-specific permissions

3. **Migrate Users**
   - Assign custom roles
   - Maintain existing permissions

4. **Deprecate Fixed Roles**
   - Monitor usage
   - Remove when safe

---

**Last Updated**: January 2026
**Version**: 1.0.0
