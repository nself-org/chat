/**
 * Mocks Tests
 *
 * Tests for mock implementations.
 */

import { MockAuthService, createMockAuthContext, createMockLocalStorage } from '../mocks/auth'
import { buildChannelsResponse, buildMessagesResponse, buildUserResponse } from '../mocks/api'
import { createUser, createChannel, createMessage } from '../factories'

describe('MockAuthService', () => {
  let authService: MockAuthService

  beforeEach(() => {
    authService = new MockAuthService()
  })

  it('signs in a user', async () => {
    const session = await authService.signIn('test@example.com', 'password')

    expect(session.user).toBeDefined()
    expect(session.user?.email).toBe('test@example.com')
    expect(session.isAuthenticated).toBe(true)
    expect(session.accessToken).toBeTruthy()
  })

  it('signs up a new user', async () => {
    const session = await authService.signUp('new@example.com', 'password', 'newuser')

    expect(session.user).toBeDefined()
    expect(session.user?.username).toBe('newuser')
    expect(session.isAuthenticated).toBe(true)
  })

  it('signs out a user', async () => {
    await authService.signIn('test@example.com', 'password')
    await authService.signOut()

    const session = authService.getSession()
    expect(session.user).toBeNull()
    expect(session.isAuthenticated).toBe(false)
  })

  it('refreshes token', async () => {
    await authService.signIn('test@example.com', 'password')
    const newSession = await authService.refreshToken()

    expect(newSession).toBeDefined()
    expect(newSession?.accessToken).toBeTruthy()
  })
})

describe('createMockAuthContext', () => {
  it('creates auth context with user', () => {
    const user = createUser()
    const context = createMockAuthContext(user)

    expect(context.user).toBe(user)
    expect(context.isAuthenticated).toBe(true)
  })

  it('creates unauthenticated context', () => {
    const context = createMockAuthContext(null)

    expect(context.user).toBeNull()
    expect(context.isAuthenticated).toBe(false)
  })
})

describe('createMockLocalStorage', () => {
  it('implements localStorage interface', () => {
    const storage = createMockLocalStorage()

    storage.setItem('key', 'value')
    expect(storage.getItem('key')).toBe('value')

    storage.removeItem('key')
    expect(storage.getItem('key')).toBeNull()

    storage.setItem('key1', 'value1')
    storage.setItem('key2', 'value2')
    expect(storage.length).toBe(2)

    storage.clear()
    expect(storage.length).toBe(0)
  })
})

describe('API Response Builders', () => {
  it('builds channels response', () => {
    const channels = [createChannel(), createChannel()]
    const response = buildChannelsResponse(channels)

    expect(response.nchat_channels).toHaveLength(2)
    expect(response.nchat_channels[0]).toHaveProperty('__typename')
    expect(response.nchat_channels[0].__typename).toBe('nchat_channels')
  })

  it('builds messages response', () => {
    const messages = [createMessage(), createMessage()]
    const response = buildMessagesResponse(messages)

    expect(response.nchat_messages).toHaveLength(2)
    expect(response.nchat_messages[0]).toHaveProperty('__typename')
    expect(response.nchat_messages[0].__typename).toBe('nchat_messages')
  })

  it('filters messages by channel', () => {
    const messages = [
      createMessage({ channelId: 'channel-1' }),
      createMessage({ channelId: 'channel-2' }),
    ]
    const response = buildMessagesResponse(messages, 'channel-1')

    expect(response.nchat_messages).toHaveLength(1)
    expect(response.nchat_messages[0].user.id).toBeDefined()
  })

  it('builds user response', () => {
    const user = createUser()
    const response = buildUserResponse(user)

    expect(response.nchat_users_by_pk).toBeDefined()
    expect(response.nchat_users_by_pk.__typename).toBe('nchat_users')
    expect(response.nchat_users_by_pk.id).toBe(user.id)
  })
})
