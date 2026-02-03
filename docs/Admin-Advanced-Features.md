# Advanced Admin Features (v0.5.0)

> Comprehensive guide to bulk operations, automation, system monitoring, and enhanced audit logging

## Table of Contents

1. [Overview](#overview)
2. [Bulk Operations](#bulk-operations)
3. [Automation Engine](#automation-engine)
4. [System Health Monitoring](#system-health-monitoring)
5. [Enhanced Audit Logs](#enhanced-audit-logs)
6. [API Reference](#api-reference)
7. [Best Practices](#best-practices)

---

## Overview

Version 0.5.0 introduces powerful administrative capabilities designed for enterprise deployments:

- **Bulk Operations**: Perform actions on multiple users/channels simultaneously
- **Automation Engine**: Schedule and automate administrative tasks
- **Real-time Monitoring**: Track system health and resource usage
- **Enhanced Audit Logs**: Advanced search, filtering, and export capabilities

### Access Requirements

**Required Roles**: Owner, Admin

**Location**: `/admin/advanced`

---

## Bulk Operations

Perform operations on multiple users, channels, or messages at once with progress tracking and error handling.

### Bulk User Operations

#### 1. Bulk Invite

Invite multiple users via email addresses.

**Features**:

- Parse email lists (newline, comma, or semicolon separated)
- Email validation
- Custom welcome messages
- Role assignment
- Progress tracking

**Usage**:

```typescript
// Navigate to: /admin/advanced?tab=bulk-users
// Select "Invite" tab
// Paste email addresses:
alice@example.com
bob@example.com, charlie@example.com
david@example.com; eve@example.com

// Select default role
// Optional: Add custom welcome message
// Click "Send Invitations"
```

**CSV Import Format**:

```csv
email,role,displayName
alice@example.com,member,Alice Johnson
bob@example.com,moderator,Bob Smith
```

#### 2. Bulk Suspend

Temporarily or permanently suspend user accounts.

**Features**:

- Suspension reason (required)
- Duration options: 7 days, 30 days, 90 days, permanent
- User notifications
- Batch processing

**Usage**:

1. Select users from the user management table
2. Navigate to "Suspend" tab
3. Enter suspension reason
4. Choose duration
5. Confirm operation

#### 3. Bulk Delete

Permanently delete user accounts.

**Features**:

- Confirmation required (type "DELETE")
- Option to delete associated messages
- Ownership transfer for channels
- Irreversible action warnings

**Safety**: Double confirmation required to prevent accidental deletions.

#### 4. Bulk Role Assignment

Assign roles to multiple users simultaneously.

**Features**:

- Role selection from available roles
- Optional user notifications
- Immediate permission updates

### Bulk Channel Operations

#### 1. Bulk Archive

Archive multiple channels to keep them readonly.

**Features**:

- Optional archive reason
- Member notifications
- Preserves message history

#### 2. Bulk Delete

Permanently delete multiple channels.

**Features**:

- Confirmation required (type "DELETE")
- Optional message archiving before deletion
- Member notifications
- Irreversible action warnings

#### 3. Bulk Transfer Ownership

Transfer channel ownership to another user.

**Features**:

- Specify new owner by ID or email
- Notifications to old and new owners
- Maintains channel settings

#### 4. Bulk Privacy Change

Change privacy settings for multiple channels.

**Features**:

- Make public or private
- Instant permission updates
- Member list preserved

### CSV Export/Import

#### Export Users

```csv
id,username,displayName,email,role,isActive,isBanned,createdAt,messagesCount,channelsCount
user-123,alice,Alice Johnson,alice@example.com,member,true,false,2024-01-15T10:00:00Z,450,12
user-456,bob,Bob Smith,bob@example.com,moderator,true,false,2024-01-10T09:00:00Z,678,15
```

#### Export Channels

```csv
id,name,slug,description,type,isPrivate,isArchived,createdAt,membersCount,messagesCount
ch-123,general,general,General discussion,public,false,false,2024-01-01T00:00:00Z,156,4521
ch-456,engineering,engineering,Engineering team,private,true,false,2024-01-02T00:00:00Z,24,1856
```

---

## Automation Engine

Schedule and automate administrative tasks with rule-based triggers and actions.

### Rule Components

Every automation rule has:

1. **Trigger**: When the rule should run
2. **Action**: What the rule should do
3. **Conditions** (optional): Filter criteria
4. **Configuration**: Trigger and action parameters

### Trigger Types

#### 1. Schedule Trigger

Run on a cron schedule.

**Examples**:

- `0 0 * * *` - Daily at midnight
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 2 * * *` - Daily at 2 AM
- `0 9 * * 1` - Monday at 9 AM

#### 2. Event Triggers

- `user.created` - New user account created
- `user.login` - User logs in
- `channel.created` - New channel created
- `message.created` - New message posted

#### 3. Time-based Triggers

- `channel.inactive` - Channel inactive for X days
- `message.old` - Message older than X days
- `user.inactive` - User inactive for X days

### Action Types

#### 1. Channel Actions

- `channel.archive` - Archive inactive channels
- `channel.delete` - Delete channels

**Example Configuration**:

```typescript
{
  trigger: 'schedule',
  triggerConfig: {
    schedule: { cron: '0 0 * * 0' }, // Weekly
    inactivityDays: 90
  },
  action: 'channel.archive',
  actionConfig: {
    archiveChannel: {
      reason: 'Archived due to 90 days of inactivity',
      notifyMembers: true
    }
  }
}
```

#### 2. Message Actions

- `message.delete` - Delete old messages

**Example - Retention Policy**:

```typescript
{
  trigger: 'schedule',
  triggerConfig: {
    schedule: { cron: '0 2 * * *' }, // Daily at 2 AM
    ageDays: 365
  },
  action: 'message.delete',
  actionConfig: {
    deleteMessages: {
      reason: 'Retention policy: messages older than 1 year',
      archiveFirst: true
    }
  }
}
```

#### 3. User Actions

- `user.assign_role` - Auto-assign roles
- `user.send_email` - Send automated emails
- `user.suspend` - Suspend inactive accounts

**Example - Welcome Email**:

```typescript
{
  trigger: 'user.created',
  action: 'user.send_email',
  actionConfig: {
    sendEmail: {
      templateId: 'welcome',
      subject: 'Welcome to the team!',
      customData: { /* template variables */ }
    }
  }
}
```

#### 4. Report Actions

- `report.generate` - Generate and send reports

**Example - Weekly Report**:

```typescript
{
  trigger: 'schedule',
  triggerConfig: {
    schedule: { cron: '0 9 * * 1' } // Monday at 9 AM
  },
  action: 'report.generate',
  actionConfig: {
    generateReport: {
      reportType: 'activity',
      format: 'pdf',
      recipients: ['admin@example.com'],
      includeCharts: true
    }
  }
}
```

### Rule Templates

Pre-configured templates for common automation scenarios:

1. **Archive Inactive Channels** - Weekly archival of channels inactive for 90 days
2. **Delete Old Messages** - Daily deletion of messages older than 1 year
3. **Auto-assign Member Role** - Assign "member" role to new verified users
4. **Welcome Email** - Send welcome email to new users
5. **Weekly Activity Report** - Send activity reports to admins
6. **Suspend Inactive Users** - Suspend accounts inactive for 180 days

### Managing Rules

#### Create Rule

1. Navigate to `/admin/advanced?tab=automation`
2. Click "Create Rule"
3. Choose from template or create custom
4. Configure trigger and action
5. Set conditions (optional)
6. Save and activate

#### Edit Rule

1. Click "Edit" icon on rule row
2. Modify configuration
3. Save changes

#### Control Rules

- **Play**: Activate rule
- **Pause**: Temporarily disable
- **Run Now**: Execute immediately (manual trigger)
- **Duplicate**: Create copy for customization
- **Delete**: Permanently remove

### Execution History

View detailed execution logs:

- Start/completion times
- Items processed
- Success/failure counts
- Error details

---

## System Health Monitoring

Real-time monitoring of system resources and service health.

### Resource Monitoring

#### CPU Usage

- Current usage percentage
- Core count
- Load average (1m, 5m, 15m)
- Historical trends (20-minute chart)

#### Memory Usage

- Total/used/free memory
- Usage percentage
- Memory trends over time

#### Disk Usage

- Total/used/free storage
- Usage percentage
- Storage status (Healthy/Warning/Critical)

**Status Thresholds**:

- Healthy: < 50%
- Moderate: 50-75%
- Warning: 75-90%
- Critical: > 90%

### Service Health

Monitor backend services:

- PostgreSQL (database)
- Hasura GraphQL (API)
- Auth Service (authentication)
- Storage (MinIO)
- Redis Cache
- MeiliSearch (search)

**Metrics per Service**:

- Status: Healthy/Degraded/Down
- Uptime duration
- Response time
- Last health check timestamp

### Database Performance

PostgreSQL-specific metrics:

- Active connections
- Queries per second
- Average query time

### Network Metrics

- Bytes in/out
- Active connections
- Connection trends

### Auto-Refresh

- Toggle auto-refresh on/off
- Updates every 5 seconds when enabled
- Manual refresh button available

---

## Enhanced Audit Logs

Comprehensive audit trail with advanced search, filtering, and export capabilities.

### Event Types

#### User Events

- `user.created` - User account created
- `user.updated` - Profile updated
- `user.deleted` - Account deleted
- `user.login` - Login event
- `user.logout` - Logout event
- `user.suspended` - Account suspended
- `user.role_changed` - Role modified

#### Channel Events

- `channel.created` - Channel created
- `channel.updated` - Settings updated
- `channel.deleted` - Channel deleted
- `channel.archived` - Channel archived

#### Message Events

- `message.created` - Message posted
- `message.updated` - Message edited
- `message.deleted` - Message deleted
- `message.flagged` - Message flagged

#### System Events

- `settings.updated` - System settings changed
- `automation.created` - Automation rule created
- `automation.executed` - Automation run
- `bulk_operation.started` - Bulk operation initiated
- `bulk_operation.completed` - Bulk operation finished

### Event Severity Levels

- **Info**: Normal operations (blue)
- **Warning**: Potentially concerning events (yellow)
- **Error**: Failed operations (red)
- **Critical**: Severe issues (dark red)

### Advanced Filtering

#### Search

Free-text search across:

- Event descriptions
- Actor names
- Event types

#### Filters

- **Event Type**: Filter by category (user, channel, message, settings, automation)
- **Severity**: Filter by info, warning, error, critical
- **Actor**: Filter by specific user
- **Date Range**: Today, last 7 days, last 30 days, all time

### Event Details

Click "View" icon to see complete event details:

- Full description
- Actor information (name, username, email)
- Target entity (if applicable)
- Technical details (IP address, user agent)
- Metadata (session ID, custom data)
- Exact timestamp

### Export Options

#### CSV Export

```csv
timestamp,type,severity,actor,action,description,ipAddress
2024-01-29T14:30:00Z,user.created,info,Alice Johnson,created,Created new user account,192.168.1.10
```

#### JSON Export

```json
[
  {
    "id": "event-123",
    "type": "user.created",
    "severity": "info",
    "actor": {
      "id": "user-1",
      "username": "alice",
      "displayName": "Alice Johnson",
      "email": "alice@example.com"
    },
    "description": "Created new user account",
    "timestamp": "2024-01-29T14:30:00Z",
    "ipAddress": "192.168.1.10",
    "metadata": { "sessionId": "session-456" }
  }
]
```

### Retention Policies

Configure audit log retention:

- Automatic cleanup of old logs
- Configurable retention periods
- Export before deletion option

---

## API Reference

### Bulk Operations API

**Endpoint**: `POST /api/admin/bulk-operations`

**Request Body**:

```typescript
{
  type: BulkOperationType,
  parameters: Record<string, unknown>
}
```

**Response**:

```typescript
{
  success: boolean,
  operationId: string,
  totalItems: number,
  message: string,
  errors?: Array<{
    itemId: string,
    error: string
  }>
}
```

#### Example: Bulk User Invite

```typescript
POST /api/admin/bulk-operations

{
  "type": "user.invite",
  "parameters": {
    "emails": ["alice@example.com", "bob@example.com"],
    "roleId": "member",
    "sendWelcomeEmail": true,
    "customMessage": "Welcome to our team!"
  }
}

Response:
{
  "success": true,
  "operationId": "op-123",
  "totalItems": 2,
  "message": "Successfully sent 2 invitations"
}
```

#### Example: Bulk Channel Archive

```typescript
POST /api/admin/bulk-operations

{
  "type": "channel.archive",
  "parameters": {
    "channelIds": ["ch-1", "ch-2", "ch-3"],
    "reason": "Inactive for 90 days",
    "notifyMembers": true
  }
}

Response:
{
  "success": true,
  "operationId": "op-456",
  "totalItems": 3,
  "message": "Successfully archived 3 channels"
}
```

### Supported Operations

- `user.invite` - Invite users
- `user.suspend` - Suspend users
- `user.delete` - Delete users
- `user.role.assign` - Assign roles
- `channel.archive` - Archive channels
- `channel.delete` - Delete channels
- `channel.transfer` - Transfer ownership
- `channel.privacy.change` - Change privacy
- `message.delete` - Delete messages
- `message.flag` - Flag messages

---

## Best Practices

### Bulk Operations

1. **Test First**: Start with small batches to verify behavior
2. **Use Filters**: Apply filters before bulk operations to ensure correct targets
3. **Monitor Progress**: Watch the progress tracker for errors
4. **Export Before Delete**: Always export data before permanent deletions
5. **Notifications**: Enable notifications for transparency
6. **Double-Check**: Review selected items before confirming destructive actions

### Automation Rules

1. **Start Disabled**: Create rules in disabled state, test manually first
2. **Conservative Schedules**: Don't run intensive operations too frequently
3. **Monitor Executions**: Regularly check execution history for issues
4. **Use Conditions**: Add conditions to prevent unintended actions
5. **Archive Before Delete**: Always archive before deletion in automation
6. **Notify Stakeholders**: Enable notifications for important automations

### System Monitoring

1. **Set Up Alerts**: Configure alerts for critical thresholds
2. **Regular Reviews**: Check system health dashboard daily
3. **Baseline Metrics**: Understand normal resource usage patterns
4. **Act on Warnings**: Investigate degraded services promptly
5. **Capacity Planning**: Use trends to predict future resource needs

### Audit Logs

1. **Regular Exports**: Export logs periodically for backup
2. **Retention Policies**: Configure appropriate retention periods
3. **Security Reviews**: Audit failed login attempts and security events
4. **Compliance**: Use exports for compliance reporting
5. **Investigation**: Leverage detailed event data for troubleshooting

---

## Troubleshooting

### Bulk Operation Stuck

**Symptoms**: Operation shows as "running" but no progress

**Solutions**:

1. Check network connection
2. Refresh the page
3. Check browser console for errors
4. Contact support if persists

### Automation Not Running

**Symptoms**: Scheduled rule not executing

**Solutions**:

1. Verify rule status is "active"
2. Check cron expression syntax
3. Review execution history for errors
4. Ensure system time is correct

### High Resource Usage

**Symptoms**: CPU/Memory/Disk usage in critical range

**Solutions**:

1. Check recent bulk operations
2. Review automation schedules
3. Investigate database queries
4. Scale resources if needed

### Missing Audit Events

**Symptoms**: Expected events not appearing in logs

**Solutions**:

1. Check date range filter
2. Verify severity filter settings
3. Try clearing all filters
4. Check retention policy

---

## Support

For issues or questions:

- Documentation: `/docs`
- Admin Dashboard: `/admin/advanced`
- System Health: `/admin/advanced?tab=monitoring`
- Audit Trail: `/admin/advanced?tab=audit`

---

**Version**: 0.5.0
**Last Updated**: January 30, 2026
**Maintainer**: nself-chat Team
