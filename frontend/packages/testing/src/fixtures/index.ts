/**
 * Test Fixtures
 *
 * Pre-built test data for common testing scenarios.
 * All data is deterministic and reproducible.
 *
 * @module @nself-chat/testing/fixtures
 */

import {
  predefinedUsers,
  createOwner,
  type TestUser,
} from '../factories/user.factory'

import {
  predefinedChannels,
  createWorkspaceChannels,
  createPrivateChannel,
  createDirectChannel,
  type TestChannel,
} from '../factories/channel.factory'

import {
  predefinedMessages,
  createConversation,
  createMessages,
  createSystemMessage,
  type TestMessage,
} from '../factories/message.factory'

/**
 * Pre-defined test data
 */
export const fixtures = {
  users: predefinedUsers,
  channels: predefinedChannels,
  messages: predefinedMessages,
}

/**
 * Empty workspace - just after setup
 */
export function createEmptyWorkspaceFixture(): {
  users: TestUser[]
  channels: TestChannel[]
  messages: Record<string, TestMessage[]>
} {
  const owner = createOwner()

  return {
    users: [owner],
    channels: [predefinedChannels.general],
    messages: {
      [predefinedChannels.general.id]: [
        createSystemMessage('Workspace created! Welcome to nchat.', {
          channelId: predefinedChannels.general.id,
        }),
      ],
    },
  }
}

/**
 * Active workspace with several users and conversations
 */
export function createActiveWorkspaceFixture(): {
  users: TestUser[]
  channels: TestChannel[]
  messages: Record<string, TestMessage[]>
} {
  const users = [
    predefinedUsers.owner,
    predefinedUsers.admin,
    predefinedUsers.alice,
    predefinedUsers.bob,
    predefinedUsers.charlie,
  ]

  const channels = createWorkspaceChannels()

  const messages: Record<string, TestMessage[]> = {}

  // General channel conversation
  messages[predefinedChannels.general.id] = createConversation(
    [predefinedUsers.alice, predefinedUsers.bob, predefinedUsers.charlie],
    10,
    predefinedChannels.general.id
  )

  // Random channel conversation
  messages[predefinedChannels.random.id] = createConversation(
    [predefinedUsers.alice, predefinedUsers.bob],
    5,
    predefinedChannels.random.id
  )

  return { users, channels, messages }
}

/**
 * Workspace with direct messages
 */
export function createWorkspaceWithDMsFixture(): {
  users: TestUser[]
  channels: TestChannel[]
  messages: Record<string, TestMessage[]>
} {
  const users = [predefinedUsers.alice, predefinedUsers.bob, predefinedUsers.charlie]

  const dmAliceBob = createDirectChannel(predefinedUsers.alice.id, predefinedUsers.bob.id)
  const dmAliceCharlie = createDirectChannel(predefinedUsers.alice.id, predefinedUsers.charlie.id)

  const channels = [predefinedChannels.general, dmAliceBob, dmAliceCharlie]

  const messages: Record<string, TestMessage[]> = {
    [dmAliceBob.id]: createConversation(
      [predefinedUsers.alice, predefinedUsers.bob],
      5,
      dmAliceBob.id
    ),
    [dmAliceCharlie.id]: createConversation(
      [predefinedUsers.alice, predefinedUsers.charlie],
      3,
      dmAliceCharlie.id
    ),
  }

  return { users, channels, messages }
}

/**
 * Workspace with private channels
 */
export function createWorkspaceWithPrivateChannelsFixture(): {
  users: TestUser[]
  channels: TestChannel[]
  messages: Record<string, TestMessage[]>
  userChannelAccess: Record<string, string[]>
} {
  const users = [
    predefinedUsers.owner,
    predefinedUsers.admin,
    predefinedUsers.alice,
    predefinedUsers.bob,
  ]

  const engineeringChannel = createPrivateChannel({
    id: 'channel-eng',
    name: 'engineering',
    slug: 'engineering',
    description: 'Engineering team only',
  })

  const hrChannel = createPrivateChannel({
    id: 'channel-hr',
    name: 'hr-private',
    slug: 'hr-private',
    description: 'HR confidential',
  })

  const channels = [predefinedChannels.general, engineeringChannel, hrChannel]

  // Define who can access which channels
  const userChannelAccess: Record<string, string[]> = {
    [predefinedUsers.owner.id]: [
      predefinedChannels.general.id,
      engineeringChannel.id,
      hrChannel.id,
    ],
    [predefinedUsers.admin.id]: [predefinedChannels.general.id, hrChannel.id],
    [predefinedUsers.alice.id]: [predefinedChannels.general.id, engineeringChannel.id],
    [predefinedUsers.bob.id]: [predefinedChannels.general.id],
  }

  return { users, channels, messages: {}, userChannelAccess }
}

/**
 * Auth scenario fixtures
 */
export const authFixtures = {
  validCredentials: {
    email: 'alice@nself.org',
    password: 'password123',
  },
  invalidCredentials: {
    email: 'invalid@test.com',
    password: 'wrongpassword',
  },
  newUserSignup: {
    email: 'newuser@example.com',
    password: 'SecurePass123!',
    username: 'newuser',
    displayName: 'New User',
  },
  existingEmail: {
    email: 'alice@nself.org',
    password: 'password123',
    username: 'alicedupe',
    displayName: 'Alice Duplicate',
  },
}

/**
 * Form data fixtures
 */
export const formFixtures = {
  createChannel: {
    name: 'new-project',
    description: 'Discussion for the new project',
    type: 'public' as const,
    isPrivate: false,
  },
  updateProfile: {
    displayName: 'Updated Name',
    bio: 'This is my updated bio',
    avatarUrl: 'https://example.com/new-avatar.png',
  },
  formattedMessage: {
    bold: '**bold text**',
    italic: '*italic text*',
    code: '`inline code`',
    codeBlock: '```typescript\nconst x = 1;\n```',
    link: '[link text](https://example.com)',
    mention: '@alice',
  },
}

/**
 * Error scenario fixtures
 */
export const errorFixtures = {
  networkError: new Error('Network error: Failed to fetch'),
  unauthorized: { status: 401, message: 'Unauthorized' },
  forbidden: { status: 403, message: 'Forbidden: Insufficient permissions' },
  notFound: { status: 404, message: 'Resource not found' },
  serverError: { status: 500, message: 'Internal server error' },
  rateLimit: { status: 429, message: 'Too many requests' },
  validationError: {
    status: 400,
    message: 'Validation failed',
    errors: {
      email: 'Invalid email format',
      password: 'Password must be at least 8 characters',
    },
  },
}
