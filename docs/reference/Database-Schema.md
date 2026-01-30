# Database Schema Reference

> Complete database schema documentation for nself-chat

---

## Table of Contents

1. [Overview](#overview)
2. [Core Tables](#core-tables)
3. [RBAC System](#rbac-system)
4. [Additional Features](#additional-features)
5. [Indexes](#indexes)
6. [Triggers](#triggers)
7. [Migrations](#migrations)

---

## Overview

### Schema Information

| Property | Value |
|----------|-------|
| Schema Name | `nchat` |
| Table Prefix | `nchat_` |
| Database | PostgreSQL |
| Extensions | `uuid-ossp`, `pg_trgm` |

### Migration Files

Location: `.backend/migrations/`

| File | Description |
|------|-------------|
| `000_app_configuration_standalone.sql` | Standalone app config |
| `001_nchat_schema.sql` | Core schema (17 tables) |
| `002_nchat_permissions.sql` | Permission setup |
| `002_nchat_permissions_fixed.sql` | Permission fixes |
| `003_nchat_seed_users.sql` | Seed user data |
| `004_normalized_rbac_system.sql` | Normalized RBAC |
| `005_seed_normalized_users.sql` | Normalized user seeds |
| `006_channel_permissions_system.sql` | Channel permissions |
| `007_comprehensive_channel_seed_data.sql` | Channel seed data |
| `008_app_configuration.sql` | App configuration table |
| `008_real_auth_users.sql` | Real auth user setup |
| `009_additional_features.sql` | Extended features |
| `010_additional_features_permissions.sql` | Extended permissions |

---

## Core Tables

Source: `.backend/migrations/001_nchat_schema.sql`

### nchat_users

App-specific user profiles (extends auth.users).

```sql
CREATE TABLE nchat.nchat_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID NOT NULL UNIQUE,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    status_message TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    preferences JSONB DEFAULT '{}',
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'moderator', 'member', 'guest')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'away', 'dnd', 'offline'))
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| auth_user_id | UUID | UNIQUE, NOT NULL | Reference to auth.users |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Unique username |
| display_name | VARCHAR(100) | NOT NULL | Display name |
| email | VARCHAR(255) | NOT NULL | Email address |
| avatar_url | TEXT | | Avatar image URL |
| status | VARCHAR(20) | CHECK | User status: active, away, dnd, offline |
| status_message | TEXT | | Custom status message |
| role | VARCHAR(20) | CHECK, NOT NULL | User role |
| preferences | JSONB | DEFAULT {} | User preferences |
| last_seen_at | TIMESTAMPTZ | | Last activity timestamp |
| is_deleted | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

### nchat_channels

Chat channels.

```sql
CREATE TABLE nchat.nchat_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'public',
    is_archived BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    topic TEXT,
    creator_id UUID NOT NULL REFERENCES nchat.nchat_users(id),
    metadata JSONB DEFAULT '{}',
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_type CHECK (type IN ('public', 'private', 'direct', 'group'))
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | VARCHAR(100) | NOT NULL | Channel name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly slug |
| description | TEXT | | Channel description |
| type | VARCHAR(20) | CHECK, NOT NULL | Type: public, private, direct, group |
| is_archived | BOOLEAN | DEFAULT FALSE | Archive flag |
| is_default | BOOLEAN | DEFAULT FALSE | Default channel flag |
| topic | TEXT | | Channel topic |
| creator_id | UUID | FK, NOT NULL | Channel creator |
| metadata | JSONB | DEFAULT {} | Additional metadata |
| position | INTEGER | DEFAULT 0 | Sort order |
| created_at | TIMESTAMPTZ | | Creation timestamp |
| updated_at | TIMESTAMPTZ | | Last update timestamp |

### nchat_channel_members

Channel membership.

```sql
CREATE TABLE nchat.nchat_channel_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES nchat.nchat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES nchat.nchat_users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_id, user_id),
    CONSTRAINT valid_role CHECK (role IN ('admin', 'member'))
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| channel_id | UUID | FK, NOT NULL | Channel reference |
| user_id | UUID | FK, NOT NULL | User reference |
| role | VARCHAR(20) | CHECK | Channel role: admin, member |
| joined_at | TIMESTAMPTZ | | Join timestamp |
| last_read_at | TIMESTAMPTZ | | Last read timestamp |
| notifications_enabled | BOOLEAN | DEFAULT TRUE | Notification preference |
| created_at | TIMESTAMPTZ | | Creation timestamp |
| updated_at | TIMESTAMPTZ | | Last update timestamp |

### nchat_messages

Chat messages.

```sql
CREATE TABLE nchat.nchat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES nchat.nchat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES nchat.nchat_users(id),
    parent_id UUID REFERENCES nchat.nchat_messages(id) ON DELETE SET NULL,
    content TEXT,
    type VARCHAR(20) DEFAULT 'text',
    metadata JSONB DEFAULT '{}',
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_type CHECK (type IN ('text', 'file', 'image', 'video', 'audio', 'system'))
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| channel_id | UUID | FK, NOT NULL | Channel reference |
| user_id | UUID | FK, NOT NULL | Author reference |
| parent_id | UUID | FK | Thread parent message |
| content | TEXT | | Message content |
| type | VARCHAR(20) | CHECK | Message type |
| metadata | JSONB | DEFAULT {} | Additional data |
| is_edited | BOOLEAN | DEFAULT FALSE | Edit flag |
| is_deleted | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| edited_at | TIMESTAMPTZ | | Edit timestamp |
| deleted_at | TIMESTAMPTZ | | Delete timestamp |
| created_at | TIMESTAMPTZ | | Creation timestamp |
| updated_at | TIMESTAMPTZ | | Last update timestamp |

### nchat_reactions

Message reactions.

```sql
CREATE TABLE nchat.nchat_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES nchat.nchat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES nchat.nchat_users(id) ON DELETE CASCADE,
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| message_id | UUID | FK, NOT NULL | Message reference |
| user_id | UUID | FK, NOT NULL | User reference |
| emoji | VARCHAR(50) | NOT NULL | Emoji code |
| created_at | TIMESTAMPTZ | | Creation timestamp |

### nchat_attachments

File attachments.

```sql
CREATE TABLE nchat.nchat_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES nchat.nchat_messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| message_id | UUID | FK, NOT NULL | Message reference |
| file_name | VARCHAR(255) | NOT NULL | Original filename |
| file_type | VARCHAR(100) | | MIME type |
| file_size | BIGINT | | File size in bytes |
| file_url | TEXT | NOT NULL | Storage URL |
| thumbnail_url | TEXT | | Thumbnail URL |
| metadata | JSONB | DEFAULT {} | Additional metadata |
| created_at | TIMESTAMPTZ | | Creation timestamp |
| updated_at | TIMESTAMPTZ | | Last update timestamp |

### nchat_mentions

User/channel mentions.

```sql
CREATE TABLE nchat.nchat_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES nchat.nchat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES nchat.nchat_users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id),
    CONSTRAINT valid_type CHECK (type IN ('user', 'channel', 'everyone'))
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| message_id | UUID | FK, NOT NULL | Message reference |
| user_id | UUID | FK, NOT NULL | Mentioned user |
| type | VARCHAR(20) | CHECK | Mention type |
| created_at | TIMESTAMPTZ | | Creation timestamp |

### nchat_threads

Thread metadata.

```sql
CREATE TABLE nchat.nchat_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES nchat.nchat_messages(id) ON DELETE CASCADE,
    participant_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id)
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| message_id | UUID | FK, UNIQUE, NOT NULL | Parent message |
| participant_count | INTEGER | DEFAULT 0 | Number of participants |
| message_count | INTEGER | DEFAULT 0 | Reply count |
| last_message_at | TIMESTAMPTZ | | Last reply timestamp |
| created_at | TIMESTAMPTZ | | Creation timestamp |
| updated_at | TIMESTAMPTZ | | Last update timestamp |

### nchat_thread_participants

Thread membership.

```sql
CREATE TABLE nchat.nchat_thread_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES nchat.nchat_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES nchat.nchat_users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(thread_id, user_id)
);
```

### nchat_bookmarks

Saved messages.

```sql
CREATE TABLE nchat.nchat_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES nchat.nchat_users(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES nchat.nchat_messages(id) ON DELETE CASCADE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, message_id)
);
```

### nchat_notifications

User notifications.

```sql
CREATE TABLE nchat.nchat_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES nchat.nchat_users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    content TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| user_id | UUID | FK, NOT NULL | Recipient user |
| type | VARCHAR(50) | NOT NULL | Notification type |
| title | VARCHAR(255) | | Notification title |
| content | TEXT | | Notification content |
| metadata | JSONB | DEFAULT {} | Additional data |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| read_at | TIMESTAMPTZ | | Read timestamp |
| created_at | TIMESTAMPTZ | | Creation timestamp |
| updated_at | TIMESTAMPTZ | | Last update timestamp |

### nchat_read_receipts

Message read state.

```sql
CREATE TABLE nchat.nchat_read_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES nchat.nchat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES nchat.nchat_users(id) ON DELETE CASCADE,
    last_read_message_id UUID REFERENCES nchat.nchat_messages(id) ON DELETE SET NULL,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_id, user_id)
);
```

### nchat_typing_indicators

Typing state (ephemeral).

```sql
CREATE TABLE nchat.nchat_typing_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES nchat.nchat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES nchat.nchat_users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_id, user_id)
);
```

### nchat_presence

User presence (ephemeral).

```sql
CREATE TABLE nchat.nchat_presence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES nchat.nchat_users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'online',
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);
```

### nchat_invites

Invitation codes.

```sql
CREATE TABLE nchat.nchat_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    channel_id UUID REFERENCES nchat.nchat_channels(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES nchat.nchat_users(id),
    email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'member',
    uses_count INTEGER DEFAULT 0,
    max_uses INTEGER,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### nchat_settings

App-wide settings.

```sql
CREATE TABLE nchat.nchat_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Default Settings:**

| Key | Value | Description |
|-----|-------|-------------|
| app_name | "nchat" | Application name |
| app_tagline | "Team Communication Platform" | Tagline |
| theme | {"primary": "#5865F2", ...} | Theme colors |
| allow_registration | true | Registration enabled |
| max_file_size | 104857600 | 100MB limit |
| message_retention_days | 0 | 0 = forever |

### nchat_audit_log

Audit trail.

```sql
CREATE TABLE nchat.nchat_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES nchat.nchat_users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| user_id | UUID | FK | Acting user |
| action | VARCHAR(100) | NOT NULL | Action performed |
| entity_type | VARCHAR(50) | | Target entity type |
| entity_id | UUID | | Target entity ID |
| metadata | JSONB | DEFAULT {} | Action details |
| ip_address | INET | | Client IP |
| user_agent | TEXT | | Client user agent |
| created_at | TIMESTAMPTZ | | Action timestamp |

---

## RBAC System

Source: `.backend/migrations/004_normalized_rbac_system.sql`

### nchat_roles

Role definitions.

```sql
CREATE TABLE nchat.nchat_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    level INTEGER NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Default Roles:**

| Name | Slug | Level | Description |
|------|------|-------|-------------|
| Owner | owner | 0 | System owner (immutable) |
| Admin | admin | 1 | Full admin access |
| Moderator | moderator | 2 | Content moderation |
| Member | member | 3 | Standard user |
| Guest | guest | 4 | Read-only access |

### nchat_role_permissions

Permission matrix.

```sql
CREATE TABLE nchat.nchat_role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES nchat.nchat_roles(id) ON DELETE CASCADE,
    permission_name VARCHAR(100) NOT NULL,
    granted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_name)
);
```

**Available Permissions:**

| Permission | Description |
|------------|-------------|
| manage_organization | Org settings |
| manage_roles | Role management |
| manage_users | User management |
| manage_channels | Channel management |
| manage_messages | Message moderation |
| delete_any_message | Delete any message |
| pin_messages | Pin/unpin messages |
| create_public_channel | Create public channels |
| create_private_channel | Create private channels |
| invite_users | Send invitations |
| ban_users | Ban/unban users |
| view_analytics | View analytics |
| manage_integrations | Integration settings |
| manage_billing | Billing settings |

### nchat_user_roles

User-role assignments.

```sql
CREATE TABLE nchat.nchat_user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES nchat.nchat_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES nchat.nchat_roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES nchat.nchat_users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);
```

---

## Additional Features

Source: `.backend/migrations/009_additional_features.sql`

### Extended Tables (from migration 009)

Additional tables for extended features:

- Polls and poll options
- Scheduled messages
- Bots and bot commands
- Webhooks (incoming/outgoing)
- Custom emojis
- Sticker packs
- User preferences
- Channel categories
- Message pins
- Message edit history
- And more...

---

## Indexes

### User Indexes

```sql
CREATE INDEX idx_nchat_users_auth_user_id ON nchat.nchat_users(auth_user_id);
CREATE INDEX idx_nchat_users_username ON nchat.nchat_users(username);
CREATE INDEX idx_nchat_users_email ON nchat.nchat_users(email);
CREATE INDEX idx_nchat_users_role ON nchat.nchat_users(role);
CREATE INDEX idx_nchat_users_status ON nchat.nchat_users(status);
```

### Channel Indexes

```sql
CREATE INDEX idx_nchat_channels_slug ON nchat.nchat_channels(slug);
CREATE INDEX idx_nchat_channels_type ON nchat.nchat_channels(type);
CREATE INDEX idx_nchat_channels_creator_id ON nchat.nchat_channels(creator_id);
CREATE INDEX idx_nchat_channels_is_archived ON nchat.nchat_channels(is_archived);
```

### Message Indexes

```sql
CREATE INDEX idx_nchat_messages_channel_id ON nchat.nchat_messages(channel_id);
CREATE INDEX idx_nchat_messages_user_id ON nchat.nchat_messages(user_id);
CREATE INDEX idx_nchat_messages_parent_id ON nchat.nchat_messages(parent_id);
CREATE INDEX idx_nchat_messages_created_at ON nchat.nchat_messages(created_at DESC);
CREATE INDEX idx_nchat_messages_is_deleted ON nchat.nchat_messages(is_deleted);

-- Full-text search
CREATE INDEX idx_nchat_messages_content_fts ON nchat.nchat_messages
    USING gin(to_tsvector('english', content));
```

### Other Indexes

```sql
-- Channel members
CREATE INDEX idx_nchat_channel_members_channel_id ON nchat.nchat_channel_members(channel_id);
CREATE INDEX idx_nchat_channel_members_user_id ON nchat.nchat_channel_members(user_id);

-- Reactions
CREATE INDEX idx_nchat_reactions_message_id ON nchat.nchat_reactions(message_id);
CREATE INDEX idx_nchat_reactions_user_id ON nchat.nchat_reactions(user_id);

-- Attachments
CREATE INDEX idx_nchat_attachments_message_id ON nchat.nchat_attachments(message_id);

-- Mentions
CREATE INDEX idx_nchat_mentions_message_id ON nchat.nchat_mentions(message_id);
CREATE INDEX idx_nchat_mentions_user_id ON nchat.nchat_mentions(user_id);

-- Threads
CREATE INDEX idx_nchat_threads_message_id ON nchat.nchat_threads(message_id);
CREATE INDEX idx_nchat_thread_participants_thread_id ON nchat.nchat_thread_participants(thread_id);
CREATE INDEX idx_nchat_thread_participants_user_id ON nchat.nchat_thread_participants(user_id);

-- Bookmarks
CREATE INDEX idx_nchat_bookmarks_user_id ON nchat.nchat_bookmarks(user_id);
CREATE INDEX idx_nchat_bookmarks_message_id ON nchat.nchat_bookmarks(message_id);

-- Notifications
CREATE INDEX idx_nchat_notifications_user_id ON nchat.nchat_notifications(user_id);
CREATE INDEX idx_nchat_notifications_is_read ON nchat.nchat_notifications(is_read);
CREATE INDEX idx_nchat_notifications_created_at ON nchat.nchat_notifications(created_at DESC);

-- Read receipts
CREATE INDEX idx_nchat_read_receipts_channel_id ON nchat.nchat_read_receipts(channel_id);
CREATE INDEX idx_nchat_read_receipts_user_id ON nchat.nchat_read_receipts(user_id);

-- Typing indicators
CREATE INDEX idx_nchat_typing_indicators_channel_id ON nchat.nchat_typing_indicators(channel_id);
CREATE INDEX idx_nchat_typing_indicators_expires_at ON nchat.nchat_typing_indicators(expires_at);

-- Presence
CREATE INDEX idx_nchat_presence_user_id ON nchat.nchat_presence(user_id);
CREATE INDEX idx_nchat_presence_expires_at ON nchat.nchat_presence(expires_at);

-- Invites
CREATE INDEX idx_nchat_invites_code ON nchat.nchat_invites(code);
CREATE INDEX idx_nchat_invites_channel_id ON nchat.nchat_invites(channel_id);
CREATE INDEX idx_nchat_invites_expires_at ON nchat.nchat_invites(expires_at);

-- Settings
CREATE INDEX idx_nchat_settings_key ON nchat.nchat_settings(key);
CREATE INDEX idx_nchat_settings_is_public ON nchat.nchat_settings(is_public);

-- Audit log
CREATE INDEX idx_nchat_audit_log_user_id ON nchat.nchat_audit_log(user_id);
CREATE INDEX idx_nchat_audit_log_action ON nchat.nchat_audit_log(action);
CREATE INDEX idx_nchat_audit_log_entity ON nchat.nchat_audit_log(entity_type, entity_id);
CREATE INDEX idx_nchat_audit_log_created_at ON nchat.nchat_audit_log(created_at DESC);
```

---

## Triggers

### Updated At Trigger

Automatically updates `updated_at` timestamp on row update.

```sql
CREATE OR REPLACE FUNCTION nchat.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Applied to tables:**

- nchat_users
- nchat_channels
- nchat_channel_members
- nchat_messages
- nchat_attachments
- nchat_threads
- nchat_thread_participants
- nchat_notifications
- nchat_read_receipts
- nchat_presence
- nchat_invites
- nchat_settings

---

## Migrations

### Running Migrations

Via nself CLI:

```bash
cd .backend
nself db migrate
```

Manual application:

```bash
cd .backend
psql -U postgres -d nchat -f migrations/001_nchat_schema.sql
```

### Migration Order

1. `000_app_configuration_standalone.sql` - Standalone config
2. `001_nchat_schema.sql` - Core tables
3. `002_nchat_permissions.sql` - Basic permissions
4. `003_nchat_seed_users.sql` - Seed data
5. `004_normalized_rbac_system.sql` - RBAC
6. `005_seed_normalized_users.sql` - RBAC seeds
7. `006_channel_permissions_system.sql` - Channel RBAC
8. `007_comprehensive_channel_seed_data.sql` - Channel seeds
9. `008_app_configuration.sql` - Config table
10. `009_additional_features.sql` - Extended features
11. `010_additional_features_permissions.sql` - Extended permissions

---

## Entity Relationship Diagram

```
nchat_users
    |
    +-- nchat_channel_members (user_id) ---+--- nchat_channels
    |                                       |
    +-- nchat_messages (user_id) ----------+--- nchat_channels (channel_id)
    |       |
    |       +-- nchat_reactions (message_id)
    |       +-- nchat_attachments (message_id)
    |       +-- nchat_mentions (message_id)
    |       +-- nchat_threads (message_id)
    |       +-- nchat_bookmarks (message_id)
    |
    +-- nchat_notifications (user_id)
    +-- nchat_read_receipts (user_id, channel_id)
    +-- nchat_typing_indicators (user_id, channel_id)
    +-- nchat_presence (user_id)
    +-- nchat_invites (inviter_id)
    +-- nchat_user_roles (user_id) --- nchat_roles
    +-- nchat_audit_log (user_id)
```

---

*This document describes the complete database schema for nself-chat.*
