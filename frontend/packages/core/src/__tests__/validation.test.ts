/**
 * @nself-chat/core/validation tests
 */

import {
  MessageSchema,
  CreateMessageSchema,
  UpdateMessageSchema,
  ChannelSchema,
  CreateChannelSchema,
  UpdateChannelSchema,
  UserSchema,
  UpdateProfileSchema,
  validate,
  validateSafe,
  isValid,
} from '../validation'

describe('Message validation', () => {
  const validMessage = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    content: 'Hello world',
    channelId: '123e4567-e89b-12d3-a456-426614174001',
    userId: '123e4567-e89b-12d3-a456-426614174002',
    createdAt: new Date(),
  }

  it('validates valid message', () => {
    expect(isValid(MessageSchema, validMessage)).toBe(true)
  })

  it('rejects message with empty content', () => {
    expect(isValid(MessageSchema, { ...validMessage, content: '' })).toBe(false)
  })

  it('rejects message with invalid UUID', () => {
    expect(isValid(MessageSchema, { ...validMessage, id: 'invalid' })).toBe(false)
  })

  it('validates create message schema', () => {
    const createData = {
      content: 'New message',
      channelId: '123e4567-e89b-12d3-a456-426614174001',
    }
    expect(isValid(CreateMessageSchema, createData)).toBe(true)
  })

  it('validates update message schema', () => {
    const updateData = { content: 'Updated message' }
    expect(isValid(UpdateMessageSchema, updateData)).toBe(true)
  })
})

describe('Channel validation', () => {
  const validChannel = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'general',
    type: 'public' as const,
    createdAt: new Date(),
    createdBy: '123e4567-e89b-12d3-a456-426614174001',
  }

  it('validates valid channel', () => {
    expect(isValid(ChannelSchema, validChannel)).toBe(true)
  })

  it('rejects channel with invalid type', () => {
    expect(isValid(ChannelSchema, { ...validChannel, type: 'invalid' })).toBe(false)
  })

  it('validates create channel schema', () => {
    const createData = {
      name: 'new-channel',
      type: 'private' as const,
    }
    expect(isValid(CreateChannelSchema, createData)).toBe(true)
  })

  it('validates update channel schema', () => {
    const updateData = {
      name: 'updated-name',
      description: 'New description',
    }
    expect(isValid(UpdateChannelSchema, updateData)).toBe(true)
  })
})

describe('User validation', () => {
  const validUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'john_doe',
    email: 'john@example.com',
    displayName: 'John Doe',
    role: 'member' as const,
    createdAt: new Date(),
  }

  it('validates valid user', () => {
    expect(isValid(UserSchema, validUser)).toBe(true)
  })

  it('rejects user with invalid username', () => {
    expect(isValid(UserSchema, { ...validUser, username: 'ab' })).toBe(false) // too short
    expect(isValid(UserSchema, { ...validUser, username: 'invalid@name' })).toBe(false) // invalid chars
  })

  it('rejects user with invalid email', () => {
    expect(isValid(UserSchema, { ...validUser, email: 'invalid' })).toBe(false)
  })

  it('validates update profile schema', () => {
    const updateData = {
      displayName: 'New Name',
      bio: 'This is my bio',
    }
    expect(isValid(UpdateProfileSchema, updateData)).toBe(true)
  })
})

describe('Validation helpers', () => {
  const schema = MessageSchema.pick({ content: true })

  it('validate throws on invalid data', () => {
    expect(() => validate(schema, { content: '' })).toThrow()
  })

  it('validate returns data on valid input', () => {
    const result = validate(schema, { content: 'Hello' })
    expect(result).toEqual({ content: 'Hello' })
  })

  it('validateSafe returns success for valid data', () => {
    const result = validateSafe(schema, { content: 'Hello' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ content: 'Hello' })
    }
  })

  it('validateSafe returns error for invalid data', () => {
    const result = validateSafe(schema, { content: '' })
    expect(result.success).toBe(false)
  })

  it('isValid returns boolean', () => {
    expect(isValid(schema, { content: 'Hello' })).toBe(true)
    expect(isValid(schema, { content: '' })).toBe(false)
  })
})
