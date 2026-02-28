# Import & Migration Tools - Complete Guide

Complete documentation for importing data from external platforms into nChat.

## Overview

The Import & Migration Tools provide a comprehensive system for importing data from:

- **Slack** - Complete workspace exports with channels, users, messages, threads, and reactions
- **Discord** - Server exports with guilds, channels, messages, and embeds
- **CSV** - Generic CSV files with automatic field mapping
- **JSON** - Generic JSON files with flexible schema detection

## Features

### Core Features

- ✅ Multi-platform support (Slack, Discord, CSV, JSON)
- ✅ Complete import wizard with step-by-step guidance
- ✅ Real-time progress tracking
- ✅ Automatic field mapping for CSV/JSON
- ✅ Error handling and recovery
- ✅ Import validation and preview
- ✅ Selective import (users, channels, messages, files)
- ✅ Date range filtering
- ✅ Channel filtering
- ✅ Preserve threading and reactions
- ✅ Duplicate detection
- ✅ Cancel/retry support

### Import Options

- Import users with profile data
- Import channels (public/private)
- Import messages with full history
- Import file attachments
- Import message reactions
- Import thread conversations
- Date range filtering
- Channel filtering
- Preserve original IDs
- Overwrite existing data

## Architecture

### Components

```
src/
├── lib/import/
│   ├── types.ts              # Type definitions
│   ├── slack-importer.ts     # Slack import service
│   ├── discord-importer.ts   # Discord import service
│   ├── generic-importer.ts   # CSV/JSON import service
│   └── index.ts              # Main exports
├── components/admin/
│   └── ImportData.tsx        # Import wizard UI
└── app/api/import/
    └── route.ts              # Import API endpoint
```

### Import Flow

```
1. Select Source (Slack/Discord/CSV/JSON)
   ↓
2. Upload File
   ↓
3. Configure Options
   ↓
4. Validate & Parse
   ↓
5. Import Data (with progress tracking)
   ↓
6. Show Results & Statistics
```

## Usage

### Admin Interface

Navigate to `/admin/import` to access the import wizard:

```typescript
import ImportData from '@/components/admin/ImportData'

export default function ImportPage() {
  return <ImportData />
}
```

### Programmatic Import

#### Slack Import

```typescript
import { SlackImporter } from '@/lib/import'

const importer = new SlackImporter({
  importUsers: true,
  importChannels: true,
  importMessages: true,
  importFiles: true,
  importReactions: true,
  importThreads: true,
})

// Parse Slack export file
const slackData = await importer.parseSlackExport(file)

// Import with progress tracking
const result = await importer.import(slackData, (progress) => {
  console.log(`${progress.currentStep}: ${progress.progress}%`)
  console.log(`Processed: ${progress.itemsProcessed}/${progress.itemsTotal}`)
})

console.log('Import completed:', result.stats)
```

#### Discord Import

```typescript
import { DiscordImporter } from '@/lib/import'

const importer = new DiscordImporter({
  importUsers: true,
  importChannels: true,
  importMessages: true,
})

const discordData = await importer.parseDiscordExport(file)
const result = await importer.import(discordData, (progress) => {
  // Handle progress updates
})
```

#### CSV Import

```typescript
import { GenericImporter } from '@/lib/import'

const importer = new GenericImporter({
  importUsers: true,
  importChannels: false,
  importMessages: false,
})

const csvData = await importer.parseCSV(file)
const result = await importer.import(csvData)
```

#### JSON Import with Field Mapping

```typescript
import { GenericImporter } from '@/lib/import'

const mapping = {
  users: {
    id: 'user_id',
    email: 'email_address',
    username: 'login_name',
    displayName: 'full_name',
  },
}

const importer = new GenericImporter(options, mapping)
const jsonData = await importer.parseJSON(file)
const result = await importer.import(jsonData)
```

## Slack Import

### Export from Slack

1. Go to your Slack workspace settings
2. Navigate to **Settings & administration** → **Workspace settings**
3. Click **Import/Export Data**
4. Select **Export** tab
5. Choose date range
6. Click **Start Export**
7. Download the ZIP file when ready

### Slack Export Format

```
slack-export.zip
├── channels.json         # Channel definitions
├── users.json           # User profiles
└── [channel-name]/      # Messages per channel
    ├── 2024-01-01.json  # Messages per day
    ├── 2024-01-02.json
    └── ...
```

### Slack Data Structure

**channels.json:**

```json
[
  {
    "id": "C123456",
    "name": "general",
    "created": 1234567890,
    "creator": "U123456",
    "is_archived": false,
    "members": ["U123456", "U234567"],
    "topic": {
      "value": "General discussion",
      "creator": "U123456",
      "last_set": 1234567890
    }
  }
]
```

**users.json:**

```json
[
  {
    "id": "U123456",
    "name": "john.doe",
    "real_name": "John Doe",
    "profile": {
      "email": "john@example.com",
      "display_name": "John",
      "image_192": "https://..."
    }
  }
]
```

**Messages:**

```json
[
  {
    "type": "message",
    "user": "U123456",
    "text": "Hello world!",
    "ts": "1234567890.123456",
    "reactions": [
      {
        "name": "thumbsup",
        "users": ["U234567"],
        "count": 1
      }
    ]
  }
]
```

### Import Process

1. **Parse Export**: Extract and validate ZIP contents
2. **Import Users**: Create user accounts (skip deleted users)
3. **Import Channels**: Create channels (skip archived)
4. **Import Messages**: Import messages with threading
5. **Import Files**: Download and upload attachments
6. **Import Reactions**: Add reactions to messages

## Discord Import

### Export from Discord

Use DiscordChatExporter tool:

1. Download from: https://github.com/Tyrrrz/DiscordChatExporter
2. Run the tool and select your server
3. Choose channels to export
4. Select **JSON** format
5. Export all selected channels

### Discord Export Format

```json
{
  "guild": {
    "id": "123456789",
    "name": "My Server",
    "iconUrl": "https://...",
    "memberCount": 42
  },
  "channel": {
    "id": "987654321",
    "name": "general",
    "topic": "General discussion"
  },
  "messages": [
    {
      "id": "111222333",
      "type": "Default",
      "timestamp": "2024-01-01T12:00:00+00:00",
      "content": "Hello!",
      "author": {
        "id": "444555666",
        "name": "JohnDoe",
        "discriminator": "1234",
        "avatarUrl": "https://..."
      },
      "reactions": [
        {
          "emoji": { "name": "👍" },
          "count": 3
        }
      ]
    }
  ]
}
```

### Import Process

1. **Parse Export**: Validate JSON structure
2. **Extract Users**: Collect unique users from messages
3. **Import Users**: Create accounts (skip bots)
4. **Import Channels**: Create channels with categories
5. **Import Messages**: Import with embeds and replies
6. **Import Attachments**: Download and upload files

## CSV/JSON Import

### CSV Format

The importer automatically detects field names. Common patterns:

**Users CSV:**

```csv
id,email,username,display_name,role
1,john@example.com,john_doe,John Doe,member
2,jane@example.com,jane_smith,Jane Smith,admin
```

**Channels CSV:**

```csv
id,name,description,is_private
1,general,General discussion,false
2,team,Team channel,true
```

**Messages CSV:**

```csv
id,channel_id,user_id,content,created_at
1,1,1,"Hello world!",2024-01-01T12:00:00Z
2,1,2,"Hi there!",2024-01-01T12:01:00Z
```

### JSON Format

**Structured Format:**

```json
{
  "users": [
    {
      "id": "1",
      "email": "john@example.com",
      "username": "john_doe",
      "displayName": "John Doe"
    }
  ],
  "channels": [
    {
      "id": "1",
      "name": "general",
      "description": "General discussion"
    }
  ],
  "messages": [
    {
      "id": "1",
      "channelId": "1",
      "userId": "1",
      "content": "Hello!",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

**Array Format:**

```json
[
  {
    "id": "1",
    "email": "john@example.com",
    "username": "john_doe"
  }
]
```

### Field Mapping

The importer automatically detects common field names:

**User Fields:**

- `id`, `user_id`, `userId`
- `email`, `email_address`
- `username`, `user_name`, `login`
- `display_name`, `displayName`, `full_name`, `name`
- `avatar`, `avatar_url`, `avatarUrl`, `photo`, `picture`
- `role`, `type`, `level`

**Channel Fields:**

- `id`, `channel_id`, `channelId`
- `name`, `channel_name`
- `description`, `desc`, `topic`, `purpose`
- `private`, `is_private`, `isPrivate`
- `created_by`, `creator`, `owner`

**Message Fields:**

- `id`, `message_id`, `messageId`
- `channel_id`, `channelId`, `room_id`
- `user_id`, `userId`, `author_id`, `sender_id`
- `content`, `text`, `message`, `body`
- `created_at`, `createdAt`, `timestamp`, `sent_at`
- `parent_id`, `parentId`, `thread_id`, `reply_to`

### Custom Field Mapping

```typescript
const mapping = {
  users: {
    id: 'user_id',
    email: 'user_email',
    username: 'login_name',
    displayName: 'full_name',
    avatarUrl: 'profile_picture',
    role: 'user_role',
  },
  channels: {
    id: 'room_id',
    name: 'room_name',
    description: 'room_desc',
    isPrivate: 'is_secure',
  },
  messages: {
    id: 'msg_id',
    channelId: 'room_id',
    userId: 'sender_id',
    content: 'message_text',
    createdAt: 'sent_date',
  },
}

const importer = new GenericImporter(options, mapping)
```

## Import Options

### Complete Options Reference

```typescript
interface ImportOptions {
  // What to import
  importUsers: boolean // Import user accounts
  importChannels: boolean // Import channels
  importMessages: boolean // Import message history
  importFiles: boolean // Import file attachments
  importReactions: boolean // Import message reactions
  importThreads: boolean // Import threaded conversations

  // Filters
  dateRangeStart?: Date // Only import messages after this date
  dateRangeEnd?: Date // Only import messages before this date
  channelFilter?: string[] // Only import specific channels
  userFilter?: string[] // Only import specific users

  // Behavior
  preserveIds: boolean // Try to preserve original IDs
  overwriteExisting: boolean // Overwrite existing data vs skip
}
```

### Example Configurations

**Full Import:**

```typescript
{
  importUsers: true,
  importChannels: true,
  importMessages: true,
  importFiles: true,
  importReactions: true,
  importThreads: true,
  preserveIds: false,
  overwriteExisting: false,
}
```

**Users Only:**

```typescript
{
  importUsers: true,
  importChannels: false,
  importMessages: false,
  importFiles: false,
  importReactions: false,
  importThreads: false,
}
```

**Recent Messages Only:**

```typescript
{
  importUsers: true,
  importChannels: true,
  importMessages: true,
  importFiles: false,
  importReactions: true,
  importThreads: true,
  dateRangeStart: new Date('2024-01-01'),
  dateRangeEnd: new Date('2024-12-31'),
}
```

**Specific Channels:**

```typescript
{
  importUsers: true,
  importChannels: true,
  importMessages: true,
  importFiles: true,
  importReactions: true,
  importThreads: true,
  channelFilter: ['general', 'announcements', 'team'],
}
```

## Progress Tracking

### Progress Object

```typescript
interface ImportProgress {
  status: 'idle' | 'validating' | 'importing' | 'completed' | 'error' | 'cancelled'
  currentStep: string
  totalSteps: number
  currentStepNumber: number
  progress: number // 0-100
  itemsProcessed: number
  itemsTotal: number
  errors: ImportError[]
  warnings: ImportWarning[]
  startedAt?: Date
  completedAt?: Date
  estimatedTimeRemaining?: number // seconds
}
```

### Progress Callback

```typescript
await importer.import(data, (progress) => {
  console.log(`Step ${progress.currentStepNumber}/${progress.totalSteps}: ${progress.currentStep}`)
  console.log(`Progress: ${progress.progress}%`)
  console.log(`Items: ${progress.itemsProcessed}/${progress.itemsTotal}`)

  if (progress.errors.length > 0) {
    console.log(`Errors: ${progress.errors.length}`)
  }

  if (progress.warnings.length > 0) {
    console.log(`Warnings: ${progress.warnings.length}`)
  }
})
```

## Error Handling

### Error Types

```typescript
interface ImportError {
  type: 'user' | 'channel' | 'message' | 'file' | 'validation' | 'unknown'
  message: string
  details?: string
  item?: unknown
  timestamp: Date
  recoverable: boolean
}
```

### Warning Types

```typescript
interface ImportWarning {
  type: 'skipped' | 'modified' | 'unsupported' | 'duplicate'
  message: string
  details?: string
  item?: unknown
  timestamp: Date
}
```

### Handling Errors

```typescript
const result = await importer.import(data)

if (!result.success) {
  console.error('Import failed')

  for (const error of result.progress.errors) {
    console.error(`${error.type}: ${error.message}`)
    if (error.recoverable) {
      console.log('This error can be retried')
    }
  }
}

for (const warning of result.progress.warnings) {
  console.warn(`${warning.type}: ${warning.message}`)
}
```

## Import Statistics

### Stats Object

```typescript
interface ImportStats {
  usersImported: number
  usersSkipped: number
  usersFailed: number
  channelsImported: number
  channelsSkipped: number
  channelsFailed: number
  messagesImported: number
  messagesSkipped: number
  messagesFailed: number
  filesImported: number
  filesSkipped: number
  filesFailed: number
  reactionsImported: number
  threadsImported: number
  totalDuration: number // milliseconds
}
```

### Example Output

```typescript
{
  usersImported: 42,
  usersSkipped: 3,      // Bots or deleted users
  usersFailed: 0,
  channelsImported: 15,
  channelsSkipped: 2,   // Archived channels
  channelsFailed: 0,
  messagesImported: 15847,
  messagesSkipped: 123, // Outside date range
  messagesFailed: 5,
  filesImported: 234,
  filesSkipped: 12,     // Too large or unsupported
  filesFailed: 3,
  reactionsImported: 1023,
  threadsImported: 456,
  totalDuration: 45382  // ~45 seconds
}
```

## API Integration

### REST API

**Start Import:**

```typescript
POST /api/import

{
  "source": "slack",
  "options": {
    "importUsers": true,
    "importChannels": true,
    "importMessages": true
  },
  "fileData": "base64EncodedFileContent",
  "filename": "slack-export.zip"
}

Response:
{
  "success": true,
  "progress": { ... },
  "stats": { ... }
}
```

**Get Import Status:**

```typescript
GET /api/import?id=import-123

Response:
{
  "id": "import-123",
  "status": "importing",
  "progress": 65,
  "stats": { ... }
}
```

**Cancel Import:**

```typescript
DELETE /api/import?id=import-123

Response:
{
  "success": true,
  "message": "Import cancelled"
}
```

## Best Practices

### Performance

1. **Large Imports**: For >10,000 messages, consider batching
2. **File Uploads**: Compress large files before upload
3. **Progress Updates**: Throttle progress callbacks to avoid UI lag
4. **Memory**: Process messages in chunks for very large imports

### Data Quality

1. **Validate First**: Always preview data before importing
2. **Test Import**: Test with small dataset first
3. **Backup**: Backup existing data before large imports
4. **Deduplication**: Enable duplicate detection when re-importing
5. **Field Mapping**: Verify field mappings for CSV/JSON imports

### Error Recovery

1. **Retry Failed Items**: Use recoverable error flag
2. **Incremental Import**: Import in smaller batches
3. **Log Errors**: Save error logs for debugging
4. **Rollback**: Have a rollback plan for failed imports

## Troubleshooting

### Common Issues

**"Failed to parse export file"**

- Verify file format (ZIP for Slack, JSON for Discord)
- Check file is not corrupted
- Ensure export is complete (not partial)

**"No users found in export"**

- Check export includes user data
- Verify JSON structure is correct
- For Discord, users are extracted from messages

**"Messages skipped"**

- Check date range filters
- Verify channel filters
- Ensure parent channels are imported first

**"File import failed"**

- Check file size limits
- Verify file URLs are accessible
- Ensure sufficient storage space

**"High memory usage"**

- Process in smaller batches
- Reduce concurrent imports
- Clear cache between imports

## Future Enhancements

### Planned Features

- [ ] Background/async import with job queue
- [ ] Import scheduling
- [ ] Incremental sync (updates only)
- [ ] Custom transform functions
- [ ] Export to other formats
- [ ] Import templates/presets
- [ ] Bulk import management
- [ ] Import audit logs
- [ ] Advanced field transformations
- [ ] Multi-file imports

### Platform Support

- [ ] Microsoft Teams import
- [ ] Mattermost import
- [ ] Rocket.Chat import
- [ ] Telegram import
- [ ] WhatsApp export import
- [ ] Email thread import
- [ ] RSS feed import

## License

Part of nChat platform. See main LICENSE file.

## Support

For issues or questions:

- GitHub Issues: https://github.com/yourorg/nself-chat/issues
- Documentation: /docs
- Email: support@example.com
