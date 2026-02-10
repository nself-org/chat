/**
 * Custom Jest Matchers
 *
 * Custom matchers for domain-specific testing.
 *
 * @module @nself-chat/testing/matchers
 */

import type { TestUser, TestChannel, TestMessage } from '../factories'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUser(): R
      toBeValidChannel(): R
      toBeValidMessage(): R
      toHavePermission(permission: string): R
      toBeOnline(): R
      toBeOffline(): R
    }
  }
}

/**
 * Check if an object is a valid user
 */
function toBeValidUser(this: jest.MatcherContext, received: any) {
  const pass =
    received &&
    typeof received.id === 'string' &&
    typeof received.username === 'string' &&
    typeof received.displayName === 'string' &&
    typeof received.email === 'string' &&
    ['owner', 'admin', 'moderator', 'member', 'guest'].includes(received.role)

  return {
    pass,
    message: () =>
      pass
        ? `expected ${JSON.stringify(received)} not to be a valid user`
        : `expected ${JSON.stringify(received)} to be a valid user with id, username, displayName, email, and valid role`,
  }
}

/**
 * Check if an object is a valid channel
 */
function toBeValidChannel(this: jest.MatcherContext, received: any) {
  const pass =
    received &&
    typeof received.id === 'string' &&
    typeof received.name === 'string' &&
    typeof received.slug === 'string' &&
    ['public', 'private', 'direct', 'group'].includes(received.type)

  return {
    pass,
    message: () =>
      pass
        ? `expected ${JSON.stringify(received)} not to be a valid channel`
        : `expected ${JSON.stringify(received)} to be a valid channel with id, name, slug, and valid type`,
  }
}

/**
 * Check if an object is a valid message
 */
function toBeValidMessage(this: jest.MatcherContext, received: any) {
  const pass =
    received &&
    typeof received.id === 'string' &&
    typeof received.channelId === 'string' &&
    typeof received.content === 'string' &&
    typeof received.userId === 'string'

  return {
    pass,
    message: () =>
      pass
        ? `expected ${JSON.stringify(received)} not to be a valid message`
        : `expected ${JSON.stringify(received)} to be a valid message with id, channelId, content, and userId`,
  }
}

/**
 * Check if a user has a specific permission
 */
function toHavePermission(this: jest.MatcherContext, received: TestUser, permission: string) {
  // Simple role-based permission check
  const rolePermissions: Record<string, string[]> = {
    owner: ['all'],
    admin: ['manage_users', 'manage_channels', 'manage_messages', 'moderate'],
    moderator: ['moderate', 'delete_messages'],
    member: ['send_messages', 'create_channels'],
    guest: ['view_channels', 'view_messages'],
  }

  const permissions = rolePermissions[received.role] || []
  const pass = permissions.includes('all') || permissions.includes(permission)

  return {
    pass,
    message: () =>
      pass
        ? `expected user with role ${received.role} not to have permission ${permission}`
        : `expected user with role ${received.role} to have permission ${permission}`,
  }
}

/**
 * Check if a user is online
 */
function toBeOnline(this: jest.MatcherContext, received: TestUser) {
  const pass = received.status === 'online'

  return {
    pass,
    message: () =>
      pass
        ? `expected user to not be online, but status was ${received.status}`
        : `expected user to be online, but status was ${received.status}`,
  }
}

/**
 * Check if a user is offline
 */
function toBeOffline(this: jest.MatcherContext, received: TestUser) {
  const pass = received.status === 'offline'

  return {
    pass,
    message: () =>
      pass
        ? `expected user to not be offline, but status was ${received.status}`
        : `expected user to be offline, but status was ${received.status}`,
  }
}

/**
 * Register all custom matchers
 */
export function registerCustomMatchers() {
  expect.extend({
    toBeValidUser,
    toBeValidChannel,
    toBeValidMessage,
    toHavePermission,
    toBeOnline,
    toBeOffline,
  })
}

export const customMatchers = {
  toBeValidUser,
  toBeValidChannel,
  toBeValidMessage,
  toHavePermission,
  toBeOnline,
  toBeOffline,
}
