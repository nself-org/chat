/**
 * Factory Tests
 *
 * Tests for factory functions to ensure deterministic behavior.
 */

import {
  createUser,
  createChannel,
  createMessage,
  resetUserIdCounter,
  resetChannelIdCounter,
  resetMessageIdCounter,
  predefinedUsers,
  predefinedChannels,
} from '../factories'

describe('User Factory', () => {
  beforeEach(() => {
    resetUserIdCounter()
  })

  it('creates a user with defaults', () => {
    const user = createUser()

    expect(user).toHaveProperty('id')
    expect(user).toHaveProperty('username')
    expect(user).toHaveProperty('displayName')
    expect(user).toHaveProperty('email')
    expect(user.role).toBe('member')
    expect(user.status).toBe('online')
  })

  it('creates a user with custom properties', () => {
    const user = createUser({
      username: 'alice',
      role: 'admin',
      status: 'away',
    })

    expect(user.username).toBe('alice')
    expect(user.role).toBe('admin')
    expect(user.status).toBe('away')
  })

  it('generates deterministic IDs', () => {
    resetUserIdCounter()
    const user1 = createUser()
    const user2 = createUser()

    expect(user1.id).toBe('user-001000')
    expect(user2.id).toBe('user-001001')
  })

  it('provides predefined users', () => {
    expect(predefinedUsers.alice).toBeDefined()
    expect(predefinedUsers.bob).toBeDefined()
    expect(predefinedUsers.owner).toBeDefined()
    expect(predefinedUsers.admin).toBeDefined()
  })
})

describe('Channel Factory', () => {
  beforeEach(() => {
    resetChannelIdCounter()
  })

  it('creates a channel with defaults', () => {
    const channel = createChannel()

    expect(channel).toHaveProperty('id')
    expect(channel).toHaveProperty('name')
    expect(channel).toHaveProperty('slug')
    expect(channel.type).toBe('public')
    expect(channel.isDefault).toBe(false)
    expect(channel.isArchived).toBe(false)
  })

  it('creates a channel with custom properties', () => {
    const channel = createChannel({
      name: 'engineering',
      type: 'private',
      isDefault: true,
    })

    expect(channel.name).toBe('engineering')
    expect(channel.type).toBe('private')
    expect(channel.isDefault).toBe(true)
  })

  it('generates deterministic IDs', () => {
    resetChannelIdCounter()
    const channel1 = createChannel()
    const channel2 = createChannel()

    expect(channel1.id).toBe('channel-002000')
    expect(channel2.id).toBe('channel-002001')
  })

  it('provides predefined channels', () => {
    expect(predefinedChannels.general).toBeDefined()
    expect(predefinedChannels.random).toBeDefined()
    expect(predefinedChannels.general.isDefault).toBe(true)
  })
})

describe('Message Factory', () => {
  beforeEach(() => {
    resetMessageIdCounter()
  })

  it('creates a message with defaults', () => {
    const message = createMessage()

    expect(message).toHaveProperty('id')
    expect(message).toHaveProperty('channelId')
    expect(message).toHaveProperty('content')
    expect(message).toHaveProperty('userId')
    expect(message.type).toBe('text')
    expect(message.isEdited).toBe(false)
  })

  it('creates a message with custom properties', () => {
    const message = createMessage({
      content: 'Hello world',
      type: 'system',
      isEdited: true,
    })

    expect(message.content).toBe('Hello world')
    expect(message.type).toBe('system')
    expect(message.isEdited).toBe(true)
  })

  it('generates deterministic IDs', () => {
    resetMessageIdCounter()
    const message1 = createMessage()
    const message2 = createMessage()

    expect(message1.id).toBe('msg-003000')
    expect(message2.id).toBe('msg-003001')
  })

  it('generates deterministic timestamps', () => {
    resetMessageIdCounter()
    const baseTime = new Date('2024-01-01T12:00:00Z').getTime()

    const message1 = createMessage()
    const message2 = createMessage()

    expect(message1.createdAt?.getTime()).toBe(baseTime)
    expect(message2.createdAt?.getTime()).toBe(baseTime + 60000) // 1 minute later
  })
})
