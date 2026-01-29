# Advanced Messaging UI Features

Complete implementation of advanced messaging features for nself-chat, including polls, scheduled messages, message forwarding, reactions, link previews, and message translation.

## Table of Contents

- [Features Overview](#features-overview)
- [Components](#components)
- [Hooks](#hooks)
- [API Routes](#api-routes)
- [Usage Examples](#usage-examples)
- [Integration Guide](#integration-guide)

## Features Overview

### 1. Polls

Create interactive polls with multiple options, real-time voting, and result visualization.

**Features:**
- Multiple choice or single selection
- Anonymous or public voting
- Poll expiration
- Users can add options (optional)
- Real-time results with percentages
- Close poll manually
- Visual indicators for winning options

**Files:**
- Component: `src/components/chat/poll-creator.tsx`
- Component: `src/components/chat/poll-display.tsx`
- Hook: `src/hooks/use-polls.ts`
- Library: `src/lib/messages/polls.ts`

### 2. Scheduled Messages

Schedule messages to be sent at a future date and time.

**Features:**
- Quick schedule presets (30 min, 1 hour, tomorrow, etc.)
- Custom date/time picker
- Edit scheduled messages before they're sent
- Cancel scheduled messages
- View upcoming and overdue messages
- Recurring messages support (planned)

**Files:**
- Component: `src/components/chat/scheduled-message-modal.tsx`
- Hook: `src/hooks/use-scheduled-messages.ts`
- Library: `src/lib/messages/scheduled-messages.ts`

### 3. Message Forwarding

Forward messages to multiple channels or users with optional comments.

**Features:**
- Forward with attribution
- Copy without attribution
- Quote message
- Multi-select destinations (channels, users, threads)
- Recent destinations
- Search destinations
- Add optional comment
- Batch forwarding

**Files:**
- Component: `src/components/chat/message-forward-modal.tsx`
- Hook: `src/hooks/use-message-forwarding.ts`
- Library: `src/lib/messages/message-forwarding.ts`

### 4. Reaction Picker

Full emoji picker for message reactions with categories and search.

**Features:**
- Quick reactions (most common emojis)
- Categorized emoji picker (smileys, gestures, hearts, symbols)
- Recent emojis (auto-saved to localStorage)
- Search emoji
- Mobile-responsive design

**Files:**
- Component: `src/components/chat/reaction-picker.tsx`

### 5. Link Previews

Rich preview cards for URLs with OpenGraph and Twitter Card metadata.

**Features:**
- Auto-detect URLs in messages
- Fetch OpenGraph/Twitter Card metadata
- Display title, description, image, favicon
- Support for videos, audio, articles
- Domain-specific formatting (YouTube, Twitter, GitHub, etc.)
- Cache previews (1 hour TTL)
- Rate limiting per domain
- Dismiss individual previews

**Files:**
- Component: `src/components/chat/link-preview-card.tsx`
- Hook: `src/hooks/use-link-previews.ts`
- Library: `src/lib/messages/link-preview.ts`
- API Route: `src/app/api/link-preview/route.ts`

### 6. Message Translation

Inline translation of messages to user's preferred language.

**Features:**
- Translate to 12+ languages
- Show/hide original message
- Source language detection
- Translation caching
- Dismiss translations
- Retry failed translations

**Files:**
- Component: `src/components/chat/message-translator.tsx`
- Hook: `src/hooks/use-message-translation.ts`
- API Route: `src/app/api/translate/route.ts`

## Components

### PollCreator

Modal for creating polls with full configuration options.

```tsx
import { PollCreator } from '@/components/chat/poll-creator'

<PollCreator
  channelId={channelId}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onCreatePoll={async (input) => {
    await createPoll(input)
  }}
/>
```

### PollDisplay

Display poll with voting interface and real-time results.

```tsx
import { PollDisplay } from '@/components/chat/poll-display'

<PollDisplay
  poll={poll}
  currentUserId={userId}
  onVote={async (pollId, optionIds) => {
    await vote(pollId, optionIds)
  }}
  onClosePoll={async (pollId) => {
    await closePoll(pollId)
  }}
/>
```

### ScheduledMessageModal

Modal for scheduling messages with date/time picker.

```tsx
import { ScheduledMessageModal } from '@/components/chat/scheduled-message-modal'

<ScheduledMessageModal
  channelId={channelId}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onScheduleMessage={async (options) => {
    await scheduleMessage(options)
  }}
/>
```

### MessageForwardModal

Modal for forwarding messages to multiple destinations.

```tsx
import { MessageForwardModal } from '@/components/chat/message-forward-modal'

<MessageForwardModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  messages={selectedMessages}
  availableDestinations={channels}
  recentDestinations={recentChannels}
  onForward={async (messages, destinations, mode, comment) => {
    await forwardMessages(messages, destinations, mode, comment)
  }}
/>
```

### ReactionPicker

Emoji picker for message reactions.

```tsx
import { ReactionPicker } from '@/components/chat/reaction-picker'

<ReactionPicker
  onSelectReaction={(emoji) => {
    addReaction(messageId, emoji)
  }}
  align="start"
/>
```

### LinkPreviewCard

Rich preview card for URLs.

```tsx
import { LinkPreviewCard } from '@/components/chat/link-preview-card'

<LinkPreviewCard
  preview={preview}
  isLoading={false}
  onDismiss={() => dismissPreview(url)}
/>
```

### MessageTranslator

Inline translation dropdown for messages.

```tsx
import { MessageTranslator } from '@/components/chat/message-translator'

<MessageTranslator
  messageId={messageId}
  originalText={message.content}
  translation={translation}
  isTranslating={isTranslating}
  onTranslate={async (messageId, targetLanguage) => {
    await translateMessage(messageId, message.content, targetLanguage)
  }}
  onDismissTranslation={() => dismissTranslation(messageId)}
/>
```

## Hooks

### usePolls

Hook for poll management.

```tsx
import { usePolls } from '@/hooks/use-polls'

const {
  poll,
  userVote,
  isCreating,
  isVoting,
  createPoll,
  vote,
  closePoll,
  addOption,
} = usePolls({ channelId, pollId })

// Create a poll
await createPoll({
  question: 'What should we have for lunch?',
  options: ['Pizza', 'Sushi', 'Burgers'],
  channelId: channelId,
  allowMultiple: false,
  isAnonymous: false,
})

// Vote on a poll
await vote(pollId, ['option_id_1'])

// Close a poll
await closePoll(pollId)
```

### useScheduledMessages

Hook for scheduled message management.

```tsx
import { useScheduledMessages } from '@/hooks/use-scheduled-messages'

const {
  messages,
  pendingMessages,
  upcomingMessages,
  scheduleMessage,
  updateMessage,
  cancelMessage,
} = useScheduledMessages(channelId)

// Schedule a message
await scheduleMessage({
  channelId: channelId,
  content: 'Happy birthday!',
  scheduledAt: new Date('2026-01-30T09:00:00'),
  userId: userId,
})

// Cancel a scheduled message
cancelMessage(messageId)
```

### useMessageForwarding

Hook for message forwarding.

```tsx
import { useMessageForwarding } from '@/hooks/use-message-forwarding'

const {
  isOpen,
  forwardMessages,
  openModal,
  closeModal,
} = useMessageForwarding()

// Open forward modal
openModal([message])

// Forward messages
await forwardMessages(
  [message],
  [{ type: 'channel', id: 'channel-123', name: 'general' }],
  'forward',
  'FYI'
)
```

### useLinkPreviews

Hook for link preview fetching.

```tsx
import { useLinkPreviews } from '@/hooks/use-link-previews'

const {
  urls,
  previews,
  loading,
  fetchPreview,
  dismissPreview,
} = useLinkPreviews(messageText, { autoFetch: true })

// Manually fetch a preview
await fetchPreview('https://example.com')

// Get preview for a URL
const preview = previews.get('https://example.com')
```

### useMessageTranslation

Hook for message translation.

```tsx
import { useMessageTranslation } from '@/hooks/use-message-translation'

const {
  translations,
  isTranslating,
  translateMessage,
  dismissTranslation,
} = useMessageTranslation()

// Translate a message
await translateMessage(
  messageId,
  'Hello, world!',
  'es' // Spanish
)

// Get translation
const translation = translations.get(messageId)
```

## API Routes

### GET /api/link-preview

Fetch link preview metadata for a URL.

**Query Parameters:**
- `url` (required): The URL to fetch preview for
- `skipCache` (optional): Skip cache and fetch fresh data

**Response:**
```json
{
  "success": true,
  "preview": {
    "url": "https://example.com",
    "title": "Example Domain",
    "description": "Example website description",
    "image": "https://example.com/image.jpg",
    "siteName": "Example",
    "domain": "example.com",
    "type": "website",
    "fetchedAt": 1643723400000
  },
  "cached": false
}
```

### POST /api/translate

Translate text to target language.

**Request Body:**
```json
{
  "text": "Hello, world!",
  "targetLanguage": "es",
  "sourceLanguage": "en"
}
```

**Response:**
```json
{
  "translatedText": "¡Hola, mundo!",
  "sourceLanguage": "en",
  "targetLanguage": "es"
}
```

## Usage Examples

### Adding Polls to Messages

```tsx
import { useState } from 'react'
import { PollCreator, PollDisplay } from '@/components/chat/advanced-messaging'
import { usePolls } from '@/hooks/advanced-messaging'

function MessageWithPoll({ message }) {
  const [showPollCreator, setShowPollCreator] = useState(false)
  const { createPoll, vote, closePoll } = usePolls({ channelId: message.channelId })

  return (
    <div>
      <Button onClick={() => setShowPollCreator(true)}>
        Create Poll
      </Button>

      <PollCreator
        channelId={message.channelId}
        isOpen={showPollCreator}
        onClose={() => setShowPollCreator(false)}
        onCreatePoll={createPoll}
      />

      {message.poll && (
        <PollDisplay
          poll={message.poll}
          currentUserId={userId}
          onVote={vote}
          onClosePoll={closePoll}
        />
      )}
    </div>
  )
}
```

### Auto-Generating Link Previews

```tsx
import { LinkPreviewCard, LinkPreviewSkeleton } from '@/components/chat/advanced-messaging'
import { useLinkPreviews } from '@/hooks/advanced-messaging'

function MessageWithLinkPreviews({ message }) {
  const { urls, previews, loading, dismissPreview } = useLinkPreviews(message.content, {
    autoFetch: true,
  })

  return (
    <div>
      <div>{message.content}</div>

      {urls.map(url => {
        const preview = previews.get(url)
        const isLoading = loading.get(url)

        if (isLoading) {
          return <LinkPreviewSkeleton key={url} />
        }

        if (preview) {
          return (
            <LinkPreviewCard
              key={url}
              preview={preview}
              onDismiss={() => dismissPreview(url)}
            />
          )
        }

        return null
      })}
    </div>
  )
}
```

## Integration Guide

### 1. Import Components and Hooks

```tsx
// Components
import {
  PollCreator,
  PollDisplay,
  ScheduledMessageModal,
  MessageForwardModal,
  ReactionPicker,
  LinkPreviewCard,
  MessageTranslator,
} from '@/components/chat/advanced-messaging'

// Hooks
import {
  usePolls,
  useScheduledMessages,
  useMessageForwarding,
  useLinkPreviews,
  useMessageTranslation,
} from '@/hooks/advanced-messaging'
```

### 2. Add to Message Actions

Integrate features into your message context menu or action buttons:

```tsx
const messageActions = [
  { label: 'React', icon: Smile, action: () => setShowReactionPicker(true) },
  { label: 'Reply', icon: Reply, action: () => onReply(message) },
  { label: 'Forward', icon: Forward, action: () => openForwardModal([message]) },
  { label: 'Translate', icon: Languages, action: () => setShowTranslator(true) },
  { label: 'Schedule', icon: Clock, action: () => setShowScheduleModal(true) },
]
```

### 3. Configure GraphQL Mutations

Add poll mutations to your GraphQL schema if not already present. See the mutations defined in `use-polls.ts`.

### 4. Set Up API Routes

The link preview and translation API routes are ready to use at:
- `/api/link-preview?url=<url>`
- `/api/translate` (POST)

For production, integrate with real translation APIs like Google Translate, DeepL, or AWS Translate by updating `/api/translate/route.ts`.

## Testing

All components are designed to work independently and can be tested in isolation:

```tsx
// Example Jest test
import { render, screen } from '@testing-library/react'
import { PollDisplay } from '@/components/chat/poll-display'

test('renders poll question', () => {
  const poll = {
    id: 'poll-1',
    question: 'Test poll?',
    options: [
      { id: 'opt-1', text: 'Option 1', votes: 0, percentage: 0 },
    ],
    // ... other poll properties
  }

  render(<PollDisplay poll={poll} currentUserId="user-1" />)
  expect(screen.getByText('Test poll?')).toBeInTheDocument()
})
```

## Performance Considerations

1. **Link Previews**: Cached for 1 hour to reduce API calls
2. **Translations**: Results cached per message
3. **Polls**: Use GraphQL subscriptions for real-time updates
4. **Scheduled Messages**: Stored in Zustand with localStorage persistence
5. **Message Forwarding**: Batched API calls for multiple destinations

## Browser Support

All features are compatible with:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - Part of nself-chat project

## Support

For issues or questions, please refer to the main project repository or documentation.
