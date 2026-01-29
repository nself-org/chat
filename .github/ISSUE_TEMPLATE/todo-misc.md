---
name: Miscellaneous Feature Enhancements
about: Small feature improvements and UI enhancements
title: '[TODO-MISC-001] Miscellaneous Feature Enhancements'
labels: enhancement, ui, low-priority
assignees: ''
---

## Description

Collection of small feature improvements and UI enhancements that don't fit into larger categories.

## Affected Components

### Poll Functionality
- [ ] `src/components/polls/poll-display.tsx:392` - Add option to poll

### Slash Commands
- [ ] `src/components/slash-commands/SlashCommandBuilder.tsx:114` - Get user from auth context

### Emoji Settings
- [ ] `src/components/settings/EmojiSettings.tsx:41` - Update emoji skin tone
- [ ] `src/components/settings/EmojiSettings.tsx:51` - Update frequently used
- [ ] `src/components/settings/EmojiSettings.tsx:61` - Update emoji suggestions

## Feature Details

### 1. Add Poll Option

**Current State:** Polls are displayed but users cannot add additional options after creation.

**Implementation:**
```typescript
const addPollOption = async (pollId: string, option: string) => {
  // Validate option text
  if (!option.trim()) {
    throw new Error('Option cannot be empty')
  }

  // Check if poll allows adding options
  const poll = await getPoll(pollId)
  if (!poll.allowAddOptions) {
    throw new Error('This poll does not allow adding options')
  }

  // Add option via GraphQL
  await mutation({
    variables: {
      pollId,
      optionText: option,
    },
  })

  toast.success('Option added to poll')
}
```

**GraphQL Mutation:**
```graphql
mutation AddPollOption($pollId: uuid!, $optionText: String!) {
  insert_nchat_poll_options_one(object: {
    poll_id: $pollId
    option_text: $optionText
    votes: 0
  }) {
    id
    option_text
    votes
  }
}
```

**Requirements:**
- Only allow if poll settings permit it
- Validate option text (max 200 chars)
- Prevent duplicate options
- Real-time update for all viewers
- RBAC check (who can add options)

### 2. Slash Command User Context

**Current State:** Draft saving uses hardcoded user ID string.

**Fix:**
```typescript
// Before
const saved = saveDraft('current-user-id')

// After
import { useAuth } from '@/contexts/auth-context'
const { user } = useAuth()
const saved = saveDraft(user?.id || 'anonymous')
```

**Additional Improvements:**
- Type safety for user ID
- Handle unauthenticated state
- Clear drafts on logout
- Sync drafts across devices (future)

### 3. Emoji Settings

**Features to Implement:**

#### a) Emoji Skin Tone Preference
```typescript
const updateSkinTone = async (tone: number) => {
  // tone: 1-6 (1 = default, 2-6 = skin tones)
  await updateUserSettings({
    emojiSkinTone: tone,
  })

  // Apply globally to emoji picker
  emojiPicker.setDefaultSkinTone(tone)
}
```

#### b) Frequently Used Emojis
```typescript
const trackEmojiUsage = async (emoji: string) => {
  const usage = getEmojiUsage()
  const updated = {
    ...usage,
    [emoji]: (usage[emoji] || 0) + 1,
  }

  await updateUserSettings({
    emojiUsage: updated,
  })
}

const getFrequentlyUsed = () => {
  const usage = getEmojiUsage()
  return Object.entries(usage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([emoji]) => emoji)
}
```

#### c) Emoji Suggestions
```typescript
const updateEmojiSuggestions = async (enabled: boolean) => {
  await updateUserSettings({
    emojiSuggestionsEnabled: enabled,
  })
}

// Show suggestions as user types
const getSuggestions = (text: string) => {
  if (!settings.emojiSuggestionsEnabled) return []

  // Match emoji by shortcode
  // :smile: -> 😊
  const match = text.match(/:(\w+):?$/)
  if (!match) return []

  return searchEmojis(match[1])
}
```

## Database Schema

```sql
-- User emoji preferences
ALTER TABLE nchat_users ADD COLUMN IF NOT EXISTS emoji_preferences jsonb DEFAULT '{
  "skinTone": 1,
  "suggestionsEnabled": true,
  "frequentlyUsed": {}
}'::jsonb;

-- Poll options (if not exists)
ALTER TABLE nchat_poll_options ADD COLUMN IF NOT EXISTS added_by uuid REFERENCES nchat_users(id);
ALTER TABLE nchat_polls ADD COLUMN IF NOT EXISTS allow_add_options boolean DEFAULT false;
```

## UI/UX Improvements

### Poll Option Addition
- Show "Add Option" button only if allowed
- Inline input field for new option
- Character counter (max 200)
- Disable during submission
- Show new option immediately (optimistic update)

### Emoji Picker
- Skin tone selector in picker header
- "Frequently Used" section at top
- Emoji suggestions dropdown while typing
- Recent emojis section
- Search emojis by name

### Slash Commands
- Auto-save drafts every 2 seconds
- Show "Draft saved" indicator
- Restore draft on return
- Clear draft after sending

## Testing Checklist

### Poll Options
- [ ] Add option to poll (if allowed)
- [ ] Cannot add to closed poll
- [ ] Cannot add duplicate option
- [ ] Character limit enforced
- [ ] Real-time update for all users
- [ ] RBAC permissions respected

### Emoji Settings
- [ ] Change skin tone preference
- [ ] Skin tone persists across sessions
- [ ] Track emoji usage
- [ ] Show frequently used section
- [ ] Emoji suggestions while typing
- [ ] Toggle suggestions on/off

### Slash Commands
- [ ] Draft saves with correct user ID
- [ ] Draft restores on return
- [ ] Draft clears on send
- [ ] Draft clears on logout
- [ ] Handle unauthenticated state

## Acceptance Criteria

- Poll options can be added if poll allows it
- Emoji skin tone preference saves and applies globally
- Frequently used emojis tracked and displayed
- Emoji suggestions work while typing
- Slash command drafts save with proper user context
- All settings persist across sessions
- Proper error handling and user feedback

## Priority: Low
Nice-to-have polish features. Can be deferred to v1.1.0 or later.
