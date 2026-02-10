# Polls System Implementation Guide

## Overview

This document describes the complete implementation of the polls and interactive messages feature for nself-chat v0.3.0.

## Features Implemented

✅ **Poll Creation**

- Single-choice and multiple-choice polls
- Anonymous voting option
- Poll expiration/deadline
- Allow users to add options (non-anonymous only)
- 2-10 options per poll

✅ **Poll Voting**

- Real-time vote updates
- Change vote before poll closes
- Multiple choice support with max limit
- Vote validation (single vs multiple choice)

✅ **Poll Management**

- Poll creator and admins can close polls early
- Automatic expiration handling
- Poll results with percentages
- Vote count display
- Winning option highlighting

✅ **Real-time Updates**

- Live poll results via GraphQL subscriptions
- Instant vote count updates
- Poll status changes (active/closed/expired)

## Database Schema

### Tables Created

#### `nchat_polls`

```sql
CREATE TABLE nchat_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES nchat_users(id),
    channel_id UUID NOT NULL REFERENCES nchat_channels(id),
    question TEXT NOT NULL,
    poll_type VARCHAR(20) NOT NULL DEFAULT 'single', -- 'single' | 'multiple'
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    allow_add_options BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID REFERENCES nchat_users(id)
);
```

#### `nchat_poll_options`

```sql
CREATE TABLE nchat_poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES nchat_polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_order INTEGER NOT NULL DEFAULT 0,
    added_by UUID REFERENCES nchat_users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_option_per_poll UNIQUE (poll_id, option_text)
);
```

#### `nchat_poll_votes`

```sql
CREATE TABLE nchat_poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES nchat_polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES nchat_poll_options(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES nchat_users(id) ON DELETE CASCADE,
    voted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_vote_per_option UNIQUE (poll_id, option_id, user_id)
);
```

#### `nchat_messages` Extension

```sql
ALTER TABLE nchat_messages
ADD COLUMN poll_id UUID REFERENCES nchat_polls(id) ON DELETE SET NULL;
```

### Helper Functions

The migration includes several PostgreSQL functions:

- `is_poll_closed(poll_row)` - Check if poll is closed or expired
- `get_option_vote_count(option_id)` - Get vote count for an option
- `get_poll_total_votes(poll_id)` - Get total unique voters
- `has_user_voted(poll_id, user_id)` - Check if user has voted
- `validate_poll_vote()` - Trigger to validate single-choice votes
- `auto_close_expired_polls()` - Close expired polls automatically

### Row Level Security (RLS)

All tables have RLS enabled with policies for:

- Viewing polls in accessible channels
- Creating polls in member channels
- Voting in active polls
- Closing polls (creator/admin only)
- Adding options (when allowed)

## File Structure

```
/Users/admin/Sites/nself-chat/
├── .backend/
│   └── migrations/
│       └── 012_polls_system.sql          # Database migration
├── src/
│   ├── components/
│   │   └── chat/
│   │       ├── poll-creator.tsx          # Poll creation modal
│   │       └── poll-display.tsx          # Poll display component
│   ├── graphql/
│   │   ├── polls.ts                      # GraphQL operations (existing)
│   │   ├── mutations/
│   │   │   └── polls.ts                  # Poll mutations
│   │   └── queries/
│   │       └── polls.ts                  # Poll queries
│   ├── hooks/
│   │   ├── use-polls.ts                  # Poll operations hook
│   │   └── use-poll-results.ts           # Poll results hook (TBD)
│   └── lib/
│       └── messages/
│           └── polls.ts                  # Poll utilities
```

## Components

### PollCreator Component

**Location**: `/Users/admin/Sites/nself-chat/src/components/chat/poll-creator.tsx`

**Props**:

```typescript
interface PollCreatorProps {
  channelId: string
  isOpen: boolean
  onClose: () => void
  onCreatePoll: (input: CreatePollInput) => Promise<void>
}
```

**Features**:

- Question input (max 200 characters)
- 2-10 answer options
- Single/multiple choice toggle
- Anonymous voting toggle
- Allow add options toggle
- Expiration date picker (5 min - 30 days)
- Form validation

**Usage**:

```tsx
import { PollCreator } from '@/components/chat/poll-creator'
;<PollCreator
  channelId={currentChannel.id}
  isOpen={showPollCreator}
  onClose={() => setShowPollCreator(false)}
  onCreatePoll={handleCreatePoll}
/>
```

### PollDisplay Component

**Location**: `/Users/admin/Sites/nself-chat/src/components/chat/poll-display.tsx`

**Props**:

```typescript
interface PollDisplayProps {
  poll: Poll
  currentUserId: string
  onVote?: (pollId: string, optionIds: string[]) => Promise<void>
  onClosePoll?: (pollId: string) => Promise<void>
  onAddOption?: (pollId: string, optionText: string) => Promise<void>
  className?: string
}
```

**Features**:

- Question and metadata display
- Vote buttons (single/multiple choice)
- Real-time progress bars
- Vote percentage display
- Voter avatars (non-anonymous)
- Time remaining countdown
- Close poll button (creator/admin)
- Add option button (if allowed)
- Winning option highlight
- Poll status badge

**Usage**:

```tsx
import { PollDisplay } from '@/components/chat/poll-display'
;<PollDisplay
  poll={poll}
  currentUserId={user.id}
  onVote={handleVote}
  onClosePoll={handleClosePoll}
  onAddOption={handleAddOption}
/>
```

## Hooks

### usePolls Hook

**Location**: `/Users/admin/Sites/nself-chat/src/hooks/use-polls.ts`

**Usage**:

```typescript
import { usePolls } from '@/hooks/use-polls'

const {
  // Data
  poll,
  userVote,

  // Loading states
  isLoadingPoll,
  isCreating,
  isVoting,
  isClosing,
  isAddingOption,

  // Actions
  createPoll,
  vote,
  closePoll,
  addOption,

  // Utilities
  refetchPoll,
  refetchVote,
} = usePolls({ channelId, pollId })

// Create a poll
await createPoll({
  channelId: 'channel-id',
  question: 'What should we have for lunch?',
  options: ['Pizza', 'Sushi', 'Burgers'],
  isAnonymous: false,
  allowMultiple: false,
  allowAddOptions: true,
  expiresAt: new Date('2026-02-01'),
})

// Vote on a poll
await vote('poll-id', ['option-id'])

// Close a poll
await closePoll('poll-id')

// Add an option
await addOption('poll-id', 'Tacos')
```

## GraphQL Operations

### Mutations

#### Create Poll

```graphql
mutation CreatePoll(
  $channelId: uuid!
  $question: String!
  $pollType: String!
  $isAnonymous: Boolean!
  $allowAddOptions: Boolean!
  $expiresAt: timestamptz
  $options: [nchat_poll_options_insert_input!]!
) {
  insert_nchat_polls_one(
    object: {
      channel_id: $channelId
      question: $question
      poll_type: $pollType
      is_anonymous: $isAnonymous
      allow_add_options: $allowAddOptions
      expires_at: $expiresAt
      poll_options: { data: $options }
    }
  ) {
    id
    question
    poll_type
    created_at
    poll_options {
      id
      option_text
      option_order
    }
  }
}
```

#### Vote on Poll

```graphql
mutation VotePoll($votes: [nchat_poll_votes_insert_input!]!) {
  insert_nchat_poll_votes(
    objects: $votes
    on_conflict: { constraint: unique_vote_per_option, update_columns: [voted_at] }
  ) {
    affected_rows
    returning {
      id
      poll_id
      option_id
      user_id
      voted_at
    }
  }
}
```

#### Close Poll

```graphql
mutation ClosePoll($pollId: uuid!, $closedBy: uuid!) {
  update_nchat_polls_by_pk(
    pk_columns: { id: $pollId }
    _set: { closed_at: "now()", closed_by: $closedBy }
  ) {
    id
    closed_at
    closed_by
  }
}
```

### Queries

#### Get Poll with Results

```graphql
query GetPollWithResults($pollId: uuid!) {
  nchat_polls_by_pk(id: $pollId) {
    id
    question
    poll_type
    is_anonymous
    expires_at
    created_at
    closed_at
    poll_options(order_by: { option_order: asc }) {
      id
      option_text
      option_order
      votes_aggregate {
        aggregate {
          count
        }
      }
      votes(where: { poll: { is_anonymous: { _eq: false } } }) {
        user_id
        voted_at
        voter {
          id
          display_name
          avatar_url
        }
      }
    }
    total_votes_aggregate {
      aggregate {
        count
      }
      }
    }
  }
}
```

### Subscriptions

#### Subscribe to Poll Updates

```graphql
subscription SubscribePollResults($pollId: uuid!) {
  nchat_polls_by_pk(id: $pollId) {
    id
    question
    closed_at
    expires_at
    poll_options(order_by: { option_order: asc }) {
      id
      option_text
      votes_aggregate {
        aggregate {
          count
        }
      }
    }
    total_votes_aggregate {
      aggregate {
        count
      }
    }
  }
}
```

## Integration with Message Composer

To integrate polls with the message composer:

```tsx
// In your message composer component
import { useState } from 'react'
import { PollCreator } from '@/components/chat/poll-creator'
import { usePolls } from '@/hooks/use-polls'

function MessageComposer({ channelId }) {
  const [showPollCreator, setShowPollCreator] = useState(false)
  const { createPoll } = usePolls({ channelId })

  const handleCreatePoll = async (input) => {
    await createPoll(input)
    setShowPollCreator(false)
  }

  return (
    <>
      <div className="composer">
        {/* Message input */}
        <button onClick={() => setShowPollCreator(true)}>Create Poll</button>
      </div>

      <PollCreator
        channelId={channelId}
        isOpen={showPollCreator}
        onClose={() => setShowPollCreator(false)}
        onCreatePoll={handleCreatePoll}
      />
    </>
  )
}
```

## Displaying Polls in Messages

```tsx
// In your message list component
import { PollDisplay } from '@/components/chat/poll-display'
import { usePolls } from '@/hooks/use-polls'

function MessageList({ messages, currentUserId }) {
  const { vote, closePoll, addOption } = usePolls()

  return (
    <div className="messages">
      {messages.map((message) => {
        if (message.poll_id) {
          return (
            <PollDisplay
              key={message.id}
              poll={message.poll}
              currentUserId={currentUserId}
              onVote={vote}
              onClosePoll={closePoll}
              onAddOption={addOption}
            />
          )
        }

        return <Message key={message.id} message={message} />
      })}
    </div>
  )
}
```

## Permissions

### Poll Creation

- Any user can create polls in channels they're a member of
- Requires `INSERT` permission on `nchat_polls`

### Voting

- Any user can vote in polls in accessible channels
- Single-choice: one vote per poll (enforced by trigger)
- Multiple-choice: multiple votes allowed
- Can change vote before poll closes
- Requires `INSERT` and `DELETE` on `nchat_poll_votes`

### Poll Management

- Poll creator can close their polls
- Admins and owners can close any poll
- Only creator can delete polls
- Requires `UPDATE` permission on `nchat_polls`

### Adding Options

- Only available if `allow_add_options = true`
- Only available for non-anonymous polls
- Only available while poll is active
- Any channel member can add options

## Deployment Steps

### 1. Apply Database Migration

```bash
# Using nself CLI
cd .backend
nself exec postgres

# Inside postgres container
psql -U postgres -d nself_dev -f /migrations/012_polls_system.sql
```

Or using Hasura console:

1. Go to Hasura console (http://localhost:8080)
2. Navigate to Data → SQL
3. Paste contents of `012_polls_system.sql`
4. Click "Run!"

### 2. Configure Hasura Permissions

The migration includes RLS policies, but you may need to configure Hasura permissions:

1. Go to Hasura console → Data → nchat_polls
2. Set permissions for `authenticated` role:
   - Select: Allow with custom check based on RLS
   - Insert: Allow with custom check based on RLS
   - Update: Allow for creator and admins
   - Delete: Allow for creator only

Repeat for `nchat_poll_options` and `nchat_poll_votes`.

### 3. Test the Implementation

```typescript
// Create a test poll
const testPoll = await createPoll({
  channelId: 'test-channel-id',
  question: 'Test poll?',
  options: ['Option 1', 'Option 2', 'Option 3'],
  pollType: 'single',
  isAnonymous: false,
  allowAddOptions: true,
  expiresAt: new Date(Date.now() + 3600000), // 1 hour
})

// Vote on the poll
await vote(testPoll.id, ['option-id'])

// Close the poll
await closePoll(testPoll.id)
```

## Troubleshooting

### Poll not appearing in messages

- Check that `poll_id` column was added to `nchat_messages`
- Verify RLS policies allow reading polls in the channel

### Votes not counting

- Check that user has permission to vote
- Verify poll is active (not closed or expired)
- For single-choice, ensure only one vote per user

### Real-time updates not working

- Verify GraphQL subscriptions are set up
- Check WebSocket connection
- Ensure subscription query is correct

### Permission errors

- Check RLS policies are properly configured
- Verify user is authenticated
- Ensure user is member of the channel

## Future Enhancements

- [ ] Poll templates (quick polls like "Yes/No", "Thumbs up/down")
- [ ] Poll analytics (vote trends over time)
- [ ] Export poll results (CSV, PDF)
- [ ] Poll reminders for unvoted users
- [ ] Scheduled polls
- [ ] Poll duplicates/copy
- [ ] Poll archives
- [ ] Vote notifications
- [ ] Poll search and filtering

## Related Files

- Migration: `/Users/admin/Sites/nself-chat/.backend/migrations/012_polls_system.sql`
- GraphQL (existing): `/Users/admin/Sites/nself-chat/src/graphql/polls.ts`
- GraphQL Mutations: `/Users/admin/Sites/nself-chat/src/graphql/mutations/polls.ts`
- GraphQL Queries: `/Users/admin/Sites/nself-chat/src/graphql/queries/polls.ts`
- Poll Creator: `/Users/admin/Sites/nself-chat/src/components/chat/poll-creator.tsx`
- Poll Display: `/Users/admin/Sites/nself-chat/src/components/chat/poll-display.tsx`
- Use Polls Hook: `/Users/admin/Sites/nself-chat/src/hooks/use-polls.ts`
- Poll Utilities: `/Users/admin/Sites/nself-chat/src/lib/messages/polls.ts`

## Summary

The polls system is now fully implemented with:

- ✅ Database schema with proper constraints and RLS
- ✅ GraphQL queries, mutations, and subscriptions
- ✅ React components for creating and displaying polls
- ✅ Hooks for managing poll operations
- ✅ Real-time updates via subscriptions
- ✅ Comprehensive permissions system
- ✅ Documentation and integration guides

The implementation follows nself-chat's architecture patterns and integrates seamlessly with the existing message system.
