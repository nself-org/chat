# Bot Management UI - v0.7.0

Complete bot administration interface for nself-chat with advanced features for bot development, testing, and monitoring.

## Overview

The Bot Management UI provides a comprehensive suite of tools for managing bots in your workspace:

- **Bot Manager**: List, search, filter, and manage all bots
- **Bot Editor**: Code editor with TypeScript support and templates
- **Bot Analytics**: Performance metrics and usage statistics
- **Bot Logs Viewer**: Real-time log streaming and debugging
- **Bot Templates**: Pre-built templates for common use cases
- **Bot Test Sandbox**: Interactive testing environment
- **Bot Configuration**: Triggers, permissions, and settings

## Components

### 1. Bot Manager (`BotManager.tsx`)

Comprehensive bot list with management capabilities.

**Features:**

- Search and filter bots
- Sort by name, status, events handled, last active
- Quick enable/disable toggle
- Health status indicators
- Bulk actions with selection
- Pagination
- Export bot IDs

**Props:**

```typescript
interface BotManagerProps {
  bots: Bot[]
  loading?: boolean
  onEdit?: (bot: Bot) => void
  onDelete?: (bot: Bot) => void
  onToggleStatus?: (bot: Bot) => void
  onViewLogs?: (bot: Bot) => void
  onViewAnalytics?: (bot: Bot) => void
  onRefresh?: () => void
}
```

**Usage:**

```tsx
<BotManager
  bots={bots}
  loading={isLoading}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onToggleStatus={handleToggle}
  onViewLogs={handleViewLogs}
  onViewAnalytics={handleViewAnalytics}
  onRefresh={handleRefresh}
/>
```

### 2. Bot Editor (`BotEditor.tsx`)

Advanced code editor with TypeScript support.

**Features:**

- Code editor with syntax highlighting (textarea-based, extensible to Monaco)
- Template selection dropdown
- Bot configuration (name, description, settings)
- Event subscription management
- Permission configuration
- Test mode toggle
- Code validation
- Export/import bot code
- Save, test, and deploy buttons

**Tabs:**

- **Code**: Main editor with template selection
- **Configuration**: Basic bot settings
- **Events**: Subscribe to bot events
- **Permissions**: Grant required permissions

**Props:**

```typescript
interface BotEditorProps {
  bot?: Bot
  onSave?: (bot: Partial<Bot>) => Promise<void>
  onTest?: (code: string) => Promise<void>
  onDeploy?: (code: string) => Promise<void>
}
```

**Templates Included:**

- Blank Bot (starter template)
- Echo Bot (message repeater)
- Welcome Bot (greet new members)
- Moderation Bot (content filtering)

### 3. Bot Analytics (`BotAnalytics.tsx`)

Performance metrics and usage statistics.

**Metrics:**

- Events handled (with trend indicators)
- Commands executed
- Average response time
- Error rate
- Unique users
- Active channels
- Uptime percentage

**Charts:**

- Usage over time (daily bar chart)
- Top commands (ranked list with progress bars)
- Error analysis (error type breakdown)
- Engagement metrics

**Props:**

```typescript
interface BotAnalyticsProps {
  botId: string
  botName: string
  analytics?: BotAnalytics
  loading?: boolean
  period?: 'day' | 'week' | 'month'
  onPeriodChange?: (period: 'day' | 'week' | 'month') => void
}
```

### 4. Bot Logs Viewer (`BotLogsViewer.tsx`)

Real-time log streaming with filtering.

**Features:**

- Real-time log streaming (simulated with mock data)
- Log level filtering (debug, info, warn, error)
- Search logs by content
- Auto-scroll toggle
- Download logs as text file
- Clear logs
- Pause/resume streaming
- Color-coded log levels
- Metadata display

**Log Levels:**

- **Debug**: Development information (gray)
- **Info**: Normal operations (blue)
- **Warn**: Warnings and notices (yellow)
- **Error**: Errors and failures (red)

**Props:**

```typescript
interface BotLogsViewerProps {
  botId: string
  botName: string
  logs?: LogEntry[]
  streaming?: boolean
  onToggleStreaming?: () => void
  onClearLogs?: () => void
  onDownloadLogs?: () => void
  onRefresh?: () => void
}
```

### 5. Bot Templates (`BotTemplates.tsx`)

Pre-built bot templates gallery.

**Templates Included:**

1. **Welcome Bot** (Beginner)
   - Greets new members
   - Custom welcome messages
   - Embed support

2. **Poll Bot** (Intermediate)
   - Create polls
   - Anonymous voting
   - Timed polls
   - Real-time results

3. **Reminder Bot** (Intermediate)
   - Schedule reminders
   - Recurring reminders
   - Natural language parsing

4. **Auto-Moderation Bot** (Advanced)
   - Content filtering
   - Spam detection
   - Auto-ban/timeout

5. **FAQ Bot** (Beginner)
   - Automated FAQ responses
   - Keyword matching

6. **Analytics Bot** (Advanced)
   - Channel analytics
   - User engagement tracking

**Features:**

- Search templates
- Filter by category
- Template preview with code
- One-click installation
- Difficulty badges
- Install count and ratings

**Props:**

```typescript
interface BotTemplatesProps {
  onInstall?: (template: BotTemplate) => void
  onPreview?: (template: BotTemplate) => void
}
```

### 6. Bot Test Sandbox (`BotTestSandbox.tsx`)

Interactive testing environment.

**Features:**

- Send test events to bot
- Quick scenario selection
- Custom event configuration
- View bot responses
- Debug logs
- State inspection
- Execution time tracking
- Test history (last 10 tests)
- Replay previous tests

**Test Scenarios:**

- Simple Message
- Slash Command
- Bot Mention
- User Join
- Reaction Added

**Event Types Supported:**

- message_created
- message_edited
- message_deleted
- reaction_added
- user_joined
- user_left
- mention

**Props:**

```typescript
interface BotTestSandboxProps {
  botId: string
  botName: string
  botCode?: string
  onTest?: (event: TestEvent) => Promise<TestResult>
}
```

### 7. Bot Configuration (`BotConfig.tsx`)

Comprehensive bot settings.

**Configuration Tabs:**

1. **Triggers**
   - Keyword triggers
   - Regex pattern matching
   - Scheduled triggers (cron)
   - Event-based triggers
   - Enable/disable per trigger

2. **Channels**
   - Scope modes: All, Specific, Exclude
   - Channel selection
   - Channel restrictions

3. **Permissions**
   - Grouped by category (Messages, Channels, Users, etc.)
   - Dangerous permission warnings
   - Permission descriptions

4. **Rate Limits**
   - Enable/disable rate limiting
   - Messages per minute
   - Commands per minute

5. **Environment Variables**
   - Key-value pairs
   - Secret management
   - Show/hide secrets
   - Environment variable validation

**Props:**

```typescript
interface BotConfigProps {
  bot: Bot
  channels?: Array<{ id: string; name: string }>
  onSave?: (config: BotConfiguration) => Promise<void>
}
```

## File Structure

```
src/
├── app/
│   └── admin/
│       └── bots/
│           ├── page.tsx              # Existing bot management
│           └── manage/
│               └── page.tsx          # New enhanced management UI
├── components/
│   └── admin/
│       └── bots/
│           ├── BotManager.tsx        # Bot list and actions
│           ├── BotEditor.tsx         # Code editor
│           ├── BotAnalytics.tsx      # Analytics dashboard
│           ├── BotLogsViewer.tsx     # Log streaming
│           ├── BotTemplates.tsx      # Template gallery
│           ├── BotTestSandbox.tsx    # Testing environment
│           ├── BotConfig.tsx         # Configuration UI
│           └── index.ts              # Exports
└── types/
    └── bot.ts                        # Bot type definitions
```

## Routes

- `/admin/bots` - Existing bot management (marketplace/installation)
- `/admin/bots/manage` - New enhanced bot management UI

## Usage

### Creating a New Bot

1. Navigate to `/admin/bots/manage`
2. Click "Create Bot" or select a template
3. Configure bot settings in the editor
4. Write or paste bot code
5. Configure events and permissions
6. Test bot in sandbox
7. Deploy bot

### Editing an Existing Bot

1. Navigate to `/admin/bots/manage`
2. Click "Edit" on a bot in the manager
3. Modify code, config, or permissions
4. Test changes
5. Save and deploy

### Viewing Analytics

1. Navigate to `/admin/bots/manage`
2. Click "Analytics" on a bot
3. Select time period (day/week/month)
4. Review metrics and charts

### Debugging Bots

1. Navigate to `/admin/bots/manage`
2. Click "View Logs" on a bot
3. Filter by log level
4. Search logs
5. Enable streaming for real-time logs

## Integration Points

### Backend Integration

The UI is designed to work with:

1. **GraphQL Mutations**:
   - `REGISTER_BOT` - Create new bot
   - `UPDATE_BOT` - Update bot details
   - `DELETE_BOT` - Delete bot
   - `UPDATE_BOT_SETTINGS` - Update configuration

2. **GraphQL Queries**:
   - `GET_BOT` - Get bot details
   - `GET_BOT_TOKENS` - Get API tokens
   - `GET_BOT_API_LOGS` - Get execution logs
   - `GET_BOT_PERMISSIONS` - Get permissions

3. **Real-time Subscriptions**:
   - `BOT_STATUS_SUBSCRIPTION` - Monitor bot status
   - `BOT_INSTALLATIONS_SUBSCRIPTION` - Track installations

### Bot Runtime Integration

Bots created in the editor should implement:

```typescript
export class MyBot {
  readonly id = 'my-bot'
  readonly name = 'My Bot'
  readonly description = 'Bot description'
  readonly version = '1.0.0'

  async onMessage(context, api) {
    // Handle messages
  }

  async onCommand(command, args, context, api) {
    // Handle commands
  }

  async onUserJoin(context, api) {
    // Handle user joins
  }
}
```

## Permissions

Required user permissions:

- **owner** or **admin** role to access `/admin/bots/manage`

Bot permissions available:

- `messages.read` - Read messages
- `messages.write` - Send messages
- `messages.delete` - Delete messages (dangerous)
- `channels.read` - View channels
- `channels.manage` - Manage channels (dangerous)
- `users.read` - View users
- `reactions.read` - View reactions
- `reactions.write` - Add reactions
- `files.read` - View files
- `files.write` - Upload files

## Future Enhancements

1. **Monaco Editor Integration**
   - Replace textarea with Monaco editor
   - IntelliSense and autocomplete
   - TypeScript type checking
   - Multi-file support

2. **Visual Bot Builder**
   - Drag-and-drop flow builder
   - No-code bot creation
   - Conditional logic blocks

3. **Advanced Analytics**
   - Funnel analysis
   - User journey tracking
   - A/B testing support

4. **Collaboration Features**
   - Team bot development
   - Code reviews
   - Version control integration

5. **Marketplace Integration**
   - Publish bots to marketplace
   - Bot ratings and reviews
   - Revenue sharing

## Testing

All components include:

- TypeScript type safety
- Props validation
- Error boundaries
- Loading states
- Empty states

## Accessibility

- Keyboard navigation support
- ARIA labels and roles
- Focus management
- Screen reader support
- Color contrast compliance

## Performance

- Virtual scrolling for large lists
- Debounced search
- Lazy loading
- Memoized computations
- Optimistic updates

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (responsive design)

## Dependencies

All components use existing project dependencies:

- React 19
- Radix UI components
- Tailwind CSS
- Lucide icons
- Zustand (if needed for state)

No additional dependencies required for v1.0.

## License

Part of nself-chat project. See main LICENSE file.
