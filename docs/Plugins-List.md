# Available Plugins

Complete list of all 32 nself-chat plugins that can be extracted for modular deployment.

---

## Plugin Categories

| Category | Plugins | Description |
|----------|---------|-------------|
| Core Communication | 6 | Essential messaging features |
| Media & Files | 7 | Media handling and uploads |
| Rich Content | 5 | Enhanced content types |
| Automation | 6 | Bots, webhooks, workflows |
| Authentication | 4 | Auth providers and security |
| Admin & Analytics | 4 | Management and monitoring |

---

## Core Communication Plugins (6)

### @nself/plugin-channels
**Channel management system**

- Public and private channels
- Channel categories
- Topics and descriptions
- Archive functionality
- Member management

```bash
pnpm add @nself/plugin-channels
```

---

### @nself/plugin-dm
**Direct messaging**

- 1-on-1 conversations
- Group DMs (3+ users)
- Message history
- Typing indicators

```bash
pnpm add @nself/plugin-dm
```

---

### @nself/plugin-threads
**Threaded conversations**

- Reply in thread
- Thread participants
- Thread notifications
- Collapse/expand

```bash
pnpm add @nself/plugin-threads
```

---

### @nself/plugin-reactions
**Emoji reactions**

- React to messages
- Custom emoji support
- Reaction counts
- Reaction picker

```bash
pnpm add @nself/plugin-reactions
```

---

### @nself/plugin-mentions
**@mention system**

- @user mentions
- @channel mentions
- @everyone/@here
- Autocomplete

```bash
pnpm add @nself/plugin-mentions
```

---

### @nself/plugin-search
**Full-text search**

- Message search
- File search
- User search
- Advanced filters

```bash
pnpm add @nself/plugin-search
```

---

## Media & Files Plugins (7)

### @nself/plugin-files
**File upload and management**

- Multi-file upload
- Drag & drop
- Progress tracking
- File previews

```bash
pnpm add @nself/plugin-files
```

---

### @nself/plugin-voice
**Voice messages**

- Audio recording
- Waveform display
- Playback controls
- Duration limits

```bash
pnpm add @nself/plugin-voice
```

---

### @nself/plugin-video
**Video calling**

- 1-on-1 video calls
- Group video (50 participants)
- Screen sharing
- Virtual backgrounds
- Call recording

```bash
pnpm add @nself/plugin-video
```

---

### @nself/plugin-screen-share
**Screen sharing**

- Full screen share
- Window share
- Audio sharing
- Annotation tools

```bash
pnpm add @nself/plugin-screen-share
```

---

### @nself/plugin-gallery
**Media gallery**

- Image viewer
- Video player
- Slideshow mode
- Download options

```bash
pnpm add @nself/plugin-gallery
```

---

### @nself/plugin-gifs
**GIF picker**

- Giphy integration
- Tenor integration
- Search & trending
- Categories

```bash
pnpm add @nself/plugin-gifs
```

---

### @nself/plugin-stickers
**Sticker packs**

- Pre-made packs
- Custom stickers
- Pack management
- Search

```bash
pnpm add @nself/plugin-stickers
```

---

## Rich Content Plugins (5)

### @nself/plugin-polls
**Polls and voting**

- Multiple choice
- Anonymous voting
- Time limits
- Results visualization

```bash
pnpm add @nself/plugin-polls
```

---

### @nself/plugin-code
**Code blocks**

- Syntax highlighting
- 50+ languages
- Line numbers
- Copy button

```bash
pnpm add @nself/plugin-code
```

---

### @nself/plugin-unfurl
**Link previews**

- Open Graph support
- Twitter cards
- YouTube embeds
- Custom providers

```bash
pnpm add @nself/plugin-unfurl
```

---

### @nself/plugin-emoji
**Custom emoji**

- Upload custom emoji
- Emoji categories
- Search
- Recently used

```bash
pnpm add @nself/plugin-emoji
```

---

### @nself/plugin-markdown
**Rich text formatting**

- Markdown parsing
- Safe HTML rendering
- Custom extensions

```bash
pnpm add @nself/plugin-markdown
```

---

## Automation Plugins (6)

### @nself/plugin-bots
**Bot SDK**

- Bot creation
- Command handling
- Event subscriptions
- Rich responses

```bash
pnpm add @nself/plugin-bots
```

---

### @nself/plugin-webhooks
**Webhook system**

- Incoming webhooks
- Outgoing webhooks
- Webhook management
- Payload templates

```bash
pnpm add @nself/plugin-webhooks
```

---

### @nself/plugin-commands
**Slash commands**

- Custom /commands
- Command autocomplete
- Parameter parsing
- Help system

```bash
pnpm add @nself/plugin-commands
```

---

### @nself/plugin-workflows
**Automation workflows**

- Visual builder
- Triggers & actions
- Conditional logic
- Templates

```bash
pnpm add @nself/plugin-workflows
```

---

### @nself/plugin-reminders
**Reminder system**

- Set reminders
- Recurring reminders
- Natural language parsing
- Notification delivery

```bash
pnpm add @nself/plugin-reminders
```

---

### @nself/plugin-scheduled
**Scheduled messages**

- Schedule send
- Edit scheduled
- Cancel scheduled
- Timezone support

```bash
pnpm add @nself/plugin-scheduled
```

---

## Authentication Plugins (4)

### @nself/plugin-idme
**ID.me verification**

- Military verification
- Veteran verification
- First responder
- Government employees
- Verification badges

```bash
pnpm add @nself/plugin-idme
```

---

### @nself/plugin-phone-auth
**Phone/SMS authentication**

- OTP via SMS
- Twilio integration
- AWS SNS integration
- Rate limiting

```bash
pnpm add @nself/plugin-phone-auth
```

---

### @nself/plugin-oauth
**OAuth providers**

- Google
- GitHub
- Apple
- Microsoft
- Facebook
- Twitter

```bash
pnpm add @nself/plugin-oauth
```

---

### @nself/plugin-mfa
**Multi-factor authentication**

- TOTP (authenticator apps)
- SMS codes
- Email codes
- Backup codes

```bash
pnpm add @nself/plugin-mfa
```

---

## Admin & Analytics Plugins (4)

### @nself/plugin-analytics
**Usage analytics**

- Message statistics
- User activity
- Channel analytics
- Custom dashboards
- Export reports

```bash
pnpm add @nself/plugin-analytics
```

---

### @nself/plugin-audit
**Audit logging**

- All action logging
- Search & filter
- Compliance export
- Retention policies

```bash
pnpm add @nself/plugin-audit
```

---

### @nself/plugin-moderation
**Content moderation**

- Profanity filter
- Spam detection
- User reports
- Warnings & bans

```bash
pnpm add @nself/plugin-moderation
```

---

### @nself/plugin-compliance
**Compliance tools**

- GDPR compliance
- Data retention
- Data export
- Privacy controls

```bash
pnpm add @nself/plugin-compliance
```

---

## Platform Plugins (4)

### @nself/plugin-desktop
**Desktop apps**

- Tauri integration
- Electron integration
- System tray
- Native notifications

```bash
pnpm add @nself/plugin-desktop
```

---

### @nself/plugin-mobile
**Mobile apps**

- Capacitor integration
- Push notifications
- Deep linking
- Offline support

```bash
pnpm add @nself/plugin-mobile
```

---

### @nself/plugin-pwa
**Progressive Web App**

- Service worker
- Offline cache
- Install prompt
- Background sync

```bash
pnpm add @nself/plugin-pwa
```

---

### @nself/plugin-offline
**Offline mode**

- Message queue
- Sync on reconnect
- Offline indicator
- Conflict resolution

```bash
pnpm add @nself/plugin-offline
```

---

## Plugin Installation

### Single Plugin

```bash
pnpm add @nself/plugin-polls
```

### Multiple Plugins

```bash
pnpm add @nself/plugin-polls @nself/plugin-voice @nself/plugin-bots
```

### All Plugins

```bash
pnpm add @nself/plugin-bundle
```

---

## Related Documentation

- [Plugin System](Plugins)
- [Creating Plugins](Plugins-Creating)
- [Configuration](Configuration)
