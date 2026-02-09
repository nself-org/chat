# Slash Commands Guide

Slash commands let users interact with your plugin by typing `/command` in the message composer. The nChat slash command engine handles parsing, permission checking, rate limiting, and execution.

## Architecture

```
User types "/greet Alice"
        |
        v
  +-----------+     +----------+     +-----------+     +---------+
  |  Parser   | --> | Registry | --> | Executor  | --> | Handler |
  | tokenize  |     |  lookup  |     | perms     |     | (yours) |
  | extract   |     |          |     | rate limit|     |         |
  | validate  |     |          |     | timeout   |     |         |
  +-----------+     +----------+     +-----------+     +---------+
```

## Quick Start

Create a fully initialized engine with built-in commands:

```typescript
import { createSlashCommandEngine } from '@/lib/plugins/slash-commands'

const { registry, executor } = createSlashCommandEngine()

// Registry has 16 built-in commands: /help, /mute, /kick, /ban, etc.
console.log(registry.size) // 16
```

## Registering a Command

```typescript
registry.register({
  appId: 'com.example.weather',
  name: 'weather',
  description: 'Get current weather for a city',
  helpText: 'Fetches weather data from an external API.',
  usage: '/weather <city> [units]',
  args: [
    {
      name: 'city',
      description: 'City name',
      type: 'string',
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    {
      name: 'units',
      description: 'Temperature units',
      type: 'string',
      required: false,
      default: 'celsius',
      choices: ['celsius', 'fahrenheit'],
    },
  ],
  requiredRole: 'member',
  requiredScopes: ['read:channels'],
  allowedChannelTypes: ['public', 'private', 'direct', 'group'],
  isBuiltIn: false,
  enabled: true,
  handler: async (ctx) => {
    const city = ctx.args.city as string
    const units = (ctx.args.units as string) || 'celsius'
    return {
      success: true,
      message: `Weather in ${city}: 22 degrees ${units}`,
      visibility: 'ephemeral',
    }
  },
})
```

## Command Namespacing

Commands are namespaced by their `appId` to avoid conflicts:

- Built-in commands: `/help`, `/kick`, `/ban`
- App commands (namespaced): `/com.example.weather:weather`
- App commands (aliased): `/weather` (if no conflict with built-in)

Built-in commands always take priority. If a built-in `/weather` existed, your app command would only be accessible via `/com.example.weather:weather`.

## Argument Types

| Type | Input Format | Parsed As |
|------|-------------|-----------|
| `string` | Plain text or `"quoted text"` | `string` |
| `number` | Numeric value | `number` |
| `boolean` | `true/false`, `yes/no`, `1/0`, `on/off` | `boolean` |
| `user` | `@username` or `username` | `string` (cleaned) |
| `channel` | `#channel` or `channel` | `string` (cleaned) |

### Argument Validation

```typescript
{
  name: 'count',
  description: 'Number of items',
  type: 'number',
  required: true,
  min: 1,        // Minimum value
  max: 100,      // Maximum value
}

{
  name: 'query',
  description: 'Search query',
  type: 'string',
  required: true,
  minLength: 3,
  maxLength: 200,
  pattern: '^[a-zA-Z]',  // Regex pattern
}

{
  name: 'env',
  description: 'Environment',
  type: 'string',
  required: true,
  choices: ['dev', 'staging', 'production'],
}
```

## Executing Commands

```typescript
const result = await executor.execute('/weather London celsius', {
  userId: 'user-123',
  username: 'alice',
  userRole: 'member',
  channelId: 'channel-456',
  channelType: 'public',
  grantedScopes: ['read:channels'],
})

if (result.success) {
  console.log(result.handlerResult?.message)
  // "Weather in London: 22 degrees celsius"
} else {
  console.error(result.error)
  console.error(result.code) // e.g., 'COMMAND_NOT_FOUND', 'PERMISSION_DENIED'
}
```

## Execution Pipeline

The executor runs these checks in order:

1. **Parse**: Extract command name from input
2. **Resolve**: Look up command in registry
3. **Enabled check**: Verify command is not disabled
4. **Permission check**: Role, channel type, and scopes
5. **User rate limit**: Per-user sliding window (30/min default)
6. **App rate limit**: Per-app sliding window (60/min default)
7. **Argument validation**: Parse and validate against schema
8. **Execute**: Run handler with timeout (5s default)

## Permission Model

### Role Hierarchy

```
guest (0) < member (1) < moderator (2) < admin (3) < owner (4)
```

### Checking Permissions

```typescript
import { meetsRoleRequirement } from '@/lib/plugins/slash-commands'

meetsRoleRequirement('admin', 'moderator')  // true (admin >= moderator)
meetsRoleRequirement('member', 'admin')     // false (member < admin)
```

## Command Handler Context

Your handler receives a `CommandExecutionContext`:

```typescript
interface CommandExecutionContext {
  userId: string              // Who invoked
  username: string            // Display name
  userRole: UserRole          // guest | member | moderator | admin | owner
  channelId: string           // Where invoked
  channelType: ChannelType    // public | private | direct | group
  appId?: string              // Your app ID
  grantedScopes: AppScope[]   // Expanded scope list
  args: Record<string, PluginArgValue>  // Parsed arguments
  rawInput: string            // Raw input after command name
  timestamp: Date             // When invoked
}
```

## Response Visibility

| Value | Behavior |
|-------|----------|
| `'ephemeral'` | Only visible to the invoking user |
| `'channel'` | Visible to everyone in the channel |
| `'none'` | No visible response (silent action) |

## Autocomplete / Suggestions

Get command suggestions for a user:

```typescript
const suggestions = registry.getSuggestions('wea', {
  userRole: 'member',
  channelType: 'public',
  grantedScopes: ['read:channels'],
  limit: 10,
})

for (const s of suggestions) {
  console.log(s.label, s.score, s.command.description)
}
```

## Built-in Commands

nChat includes 16 built-in system commands:

| Command | Role | Description |
|---------|------|-------------|
| `/help [command]` | guest | Show available commands |
| `/mute [duration]` | member | Mute channel notifications |
| `/unmute` | member | Unmute channel |
| `/kick @user [reason]` | moderator | Remove user from channel |
| `/ban @user [reason]` | admin | Ban user from channel |
| `/unban @user` | admin | Remove ban |
| `/topic [text]` | moderator | Set channel topic |
| `/invite @user` | member | Invite user to channel |
| `/leave` | member | Leave the channel |
| `/pin <message_id>` | moderator | Pin a message |
| `/unpin <message_id>` | moderator | Unpin a message |
| `/clear <count>` | admin | Delete recent messages (1-100) |
| `/slow <seconds>` | moderator | Enable slow mode (0 to disable) |
| `/nick <nickname>` | member | Change display name |
| `/me <action>` | guest | Send action message |
| `/shrug [message]` | guest | Send shrug emoticon |

## Error Codes

| Code | Description |
|------|-------------|
| `PARSE_ERROR` | Input is not a valid command format |
| `COMMAND_NOT_FOUND` | Command does not exist in registry |
| `COMMAND_DISABLED` | Command is currently disabled |
| `ROLE_INSUFFICIENT` | User role too low |
| `CHANNEL_DENIED` | Command not allowed in this channel type |
| `SCOPE_INSUFFICIENT` | Missing required app scopes |
| `RATE_LIMITED` | User rate limit exceeded |
| `APP_RATE_LIMITED` | App rate limit exceeded |
| `VALIDATION_ERROR` | Argument validation failed |
| `HANDLER_ERROR` | Handler returned an error |
| `EXECUTION_ERROR` | Unexpected error during execution |

## Parser Details

The parser supports:

- **Quoted strings**: `/greet "Hello World"` parses as one argument
- **Escape characters**: `/say "He said \"hello\""` handles escaped quotes
- **Positional args**: Arguments are matched in schema order
- **Namespaced lookup**: `/myapp:deploy` resolves to the namespaced command
