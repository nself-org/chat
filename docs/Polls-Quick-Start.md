# Polls System - Quick Start Guide

## Installation

The polls system is already implemented in nself-chat v0.3.0. You just need to apply the database migration.

### Step 1: Apply Migration

```bash
cd /Users/admin/Sites/nself-chat/.backend

# Option 1: Using Docker (if backend is running)
docker exec -i nself-postgres psql -U postgres -d nself_dev < migrations/012_polls_system.sql

# Option 2: Using Hasura Console
# 1. Open http://localhost:8080
# 2. Go to Data → SQL
# 3. Copy/paste migrations/012_polls_system.sql
# 4. Click "Run!"
```

### Step 2: Verify Migration

```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'nchat_poll%';

-- Should return:
-- nchat_polls
-- nchat_poll_options
-- nchat_poll_votes
```

## Basic Usage

### Creating a Poll

```tsx
import { PollCreator } from '@/components/chat/poll-creator'
import { usePolls } from '@/hooks/use-polls'

function MyComponent() {
  const [showPollModal, setShowPollModal] = useState(false)
  const { createPoll } = usePolls({ channelId: 'your-channel-id' })

  const handleCreatePoll = async (pollData) => {
    await createPoll(pollData)
    setShowPollModal(false)
  }

  return (
    <>
      <button onClick={() => setShowPollModal(true)}>
        Create Poll
      </button>

      <PollCreator
        channelId="your-channel-id"
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        onCreatePoll={handleCreatePoll}
      />
    </>
  )
}
```

### Displaying a Poll

```tsx
import { PollDisplay } from '@/components/chat/poll-display'
import { usePolls } from '@/hooks/use-polls'

function PollMessage({ poll, currentUserId }) {
  const { vote, closePoll, addOption } = usePolls()

  return (
    <PollDisplay
      poll={poll}
      currentUserId={currentUserId}
      onVote={vote}
      onClosePoll={closePoll}
      onAddOption={addOption}
    />
  )
}
```

### Direct API Usage

```tsx
import { useMutation, useQuery } from '@apollo/client'
import { CREATE_POLL, GET_POLL_WITH_RESULTS, VOTE_POLL } from '@/graphql/mutations/polls'

// Create a poll
const [createPoll] = useMutation(CREATE_POLL)
await createPoll({
  variables: {
    channelId: 'channel-uuid',
    question: 'What should we have for lunch?',
    pollType: 'single',
    isAnonymous: false,
    allowAddOptions: true,
    expiresAt: '2026-02-01T12:00:00Z',
    options: [
      { option_text: 'Pizza', option_order: 0 },
      { option_text: 'Sushi', option_order: 1 },
      { option_text: 'Burgers', option_order: 2 },
    ],
  },
})

// Vote on a poll
const [votePoll] = useMutation(VOTE_POLL)
await votePoll({
  variables: {
    votes: [
      {
        poll_id: 'poll-uuid',
        option_id: 'option-uuid',
        user_id: 'user-uuid',
      },
    ],
  },
})

// Get poll results
const { data } = useQuery(GET_POLL_WITH_RESULTS, {
  variables: { pollId: 'poll-uuid' },
})
```

## Real-time Updates

Subscribe to poll updates for live results:

```tsx
import { useSubscription } from '@apollo/client'
import { SUBSCRIBE_POLL_RESULTS } from '@/graphql/queries/polls'

function LivePoll({ pollId }) {
  const { data, loading } = useSubscription(SUBSCRIBE_POLL_RESULTS, {
    variables: { pollId },
  })

  if (loading) return <div>Loading...</div>

  const poll = data?.nchat_polls_by_pk

  return (
    <div>
      <h3>{poll.question}</h3>
      {poll.poll_options.map((option) => (
        <div key={option.id}>
          {option.option_text}: {option.votes_aggregate.aggregate.count} votes
        </div>
      ))}
    </div>
  )
}
```

## Poll Types

### Single Choice Poll
```tsx
const singleChoicePoll = {
  question: 'What's your favorite color?',
  pollType: 'single',  // Users can select only ONE option
  options: ['Red', 'Blue', 'Green'],
  isAnonymous: false,
  allowAddOptions: false,
}
```

### Multiple Choice Poll
```tsx
const multipleChoicePoll = {
  question: 'Which programming languages do you know?',
  pollType: 'multiple',  // Users can select MULTIPLE options
  options: ['JavaScript', 'Python', 'Go', 'Rust'],
  isAnonymous: false,
  allowAddOptions: true,
}
```

### Anonymous Poll
```tsx
const anonymousPoll = {
  question: 'Do you like the new feature?',
  pollType: 'single',
  options: ['Yes', 'No', 'Not sure'],
  isAnonymous: true,  // Hides who voted for what
  allowAddOptions: false,  // Can't add options to anonymous polls
}
```

### Timed Poll
```tsx
const timedPoll = {
  question: 'Where should we go for lunch today?',
  pollType: 'single',
  options: ['Pizza Place', 'Sushi Bar', 'Burger Joint'],
  isAnonymous: false,
  allowAddOptions: false,
  expiresAt: new Date(Date.now() + 3600000).toISOString(),  // 1 hour from now
}
```

## Common Operations

### Check if User Has Voted

```tsx
import { useQuery } from '@apollo/client'
import { GET_USER_POLL_VOTES } from '@/graphql/queries/polls'

const { data } = useQuery(GET_USER_POLL_VOTES, {
  variables: { pollId, userId },
})

const hasVoted = data?.nchat_poll_votes?.length > 0
```

### Change Vote (Single Choice)

```tsx
import { useMutation } from '@apollo/client'
import { REMOVE_USER_VOTES, VOTE_POLL } from '@/graphql/mutations/polls'

// Remove old vote, add new vote
const [removeVotes] = useMutation(REMOVE_USER_VOTES)
const [addVote] = useMutation(VOTE_POLL)

await removeVotes({ variables: { pollId, userId } })
await addVote({
  variables: {
    votes: [{ poll_id: pollId, option_id: newOptionId, user_id: userId }],
  },
})
```

### Close Poll

```tsx
import { useMutation } from '@apollo/client'
import { CLOSE_POLL } from '@/graphql/mutations/polls'

const [closePoll] = useMutation(CLOSE_POLL)
await closePoll({
  variables: { pollId, closedBy: currentUserId },
})
```

### Add Option to Poll

```tsx
import { useMutation } from '@apollo/client'
import { ADD_POLL_OPTION } from '@/graphql/mutations/polls'

const [addOption] = useMutation(ADD_POLL_OPTION)
await addOption({
  variables: {
    pollId,
    optionText: 'New Option',
    optionOrder: 4,  // Next position
    addedBy: currentUserId,
  },
})
```

## Permissions

### Who Can Create Polls?
- Any user who is a member of the channel

### Who Can Vote?
- Any user who is a member of the channel
- Only while poll is active (not closed or expired)
- Can change vote before poll closes

### Who Can Close Polls?
- Poll creator
- Channel admins
- Server owners

### Who Can Add Options?
- Any channel member (if `allow_add_options = true`)
- Only for non-anonymous polls
- Only while poll is active

## Error Handling

```tsx
const { createPoll, isCreating } = usePolls()

try {
  await createPoll(pollData)
  toast.success('Poll created!')
} catch (error) {
  if (error.message.includes('permission')) {
    toast.error('You don\'t have permission to create polls')
  } else if (error.message.includes('validation')) {
    toast.error('Invalid poll data')
  } else {
    toast.error('Failed to create poll')
  }
}
```

## Validation Rules

- **Question**: 1-500 characters
- **Options**: 2-10 options per poll
- **Option text**: 1-200 characters each
- **Expiration**: Must be in the future (if set)
- **Allow add options**: Only for non-anonymous polls
- **Vote count**: For single choice, max 1 vote per user

## Database Queries

### Get All Polls in Channel
```sql
SELECT * FROM nchat_polls
WHERE channel_id = 'channel-uuid'
ORDER BY created_at DESC;
```

### Get Poll Results
```sql
SELECT
  p.question,
  po.option_text,
  COUNT(pv.id) as vote_count,
  ROUND(COUNT(pv.id)::numeric / NULLIF(total_votes.count, 0) * 100, 1) as percentage
FROM nchat_polls p
JOIN nchat_poll_options po ON po.poll_id = p.id
LEFT JOIN nchat_poll_votes pv ON pv.option_id = po.id
CROSS JOIN (
  SELECT COUNT(DISTINCT user_id) as count
  FROM nchat_poll_votes
  WHERE poll_id = 'poll-uuid'
) total_votes
WHERE p.id = 'poll-uuid'
GROUP BY p.question, po.option_text, po.option_order, total_votes.count
ORDER BY po.option_order;
```

### Get User's Vote
```sql
SELECT option_id FROM nchat_poll_votes
WHERE poll_id = 'poll-uuid'
AND user_id = 'user-uuid';
```

## Testing

```typescript
// Test poll creation
describe('Poll Creation', () => {
  it('should create a single-choice poll', async () => {
    const poll = await createPoll({
      channelId: 'test-channel',
      question: 'Test question?',
      options: ['Option 1', 'Option 2'],
      pollType: 'single',
      isAnonymous: false,
      allowAddOptions: false,
    })

    expect(poll.id).toBeDefined()
    expect(poll.poll_options).toHaveLength(2)
  })
})

// Test voting
describe('Poll Voting', () => {
  it('should allow voting on active poll', async () => {
    await vote(pollId, [optionId])
    const userVotes = await getUserVotes(pollId, userId)
    expect(userVotes).toContain(optionId)
  })

  it('should prevent multiple votes in single-choice poll', async () => {
    await vote(pollId, [option1Id])
    await expect(vote(pollId, [option2Id])).rejects.toThrow()
  })
})
```

## Troubleshooting

**Problem**: Poll not appearing
**Solution**: Check that poll_id is linked to message and RLS policies allow access

**Problem**: Can't vote
**Solution**: Verify poll is active, not expired, and user is channel member

**Problem**: Real-time not working
**Solution**: Check WebSocket connection and subscription setup

**Problem**: Permission denied
**Solution**: Verify user authentication and channel membership

## Next Steps

1. Apply the migration
2. Test poll creation in dev environment
3. Integrate with your message composer
4. Add poll button to message input
5. Test real-time updates
6. Deploy to production

For detailed implementation guide, see: `/Users/admin/Sites/nself-chat/docs/Polls-Implementation.md`
