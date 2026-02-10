/**
 * API Mocks
 *
 * Mock implementations for GraphQL and REST APIs.
 *
 * @module @nself-chat/testing/mocks/api
 */

import type { TestChannel, TestMessage, TestUser } from '../../factories'

/**
 * Mock GraphQL query response builder
 */
export function buildChannelsResponse(channels: TestChannel[]) {
  return {
    nchat_channels: channels.map((ch) => ({
      __typename: 'nchat_channels',
      id: ch.id,
      name: ch.name,
      slug: ch.slug,
      description: ch.description || null,
      type: ch.type,
      is_default: ch.isDefault ?? false,
      is_archived: ch.isArchived ?? false,
      member_count: ch.memberCount || 1,
      created_at: ch.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: ch.updatedAt?.toISOString() || new Date().toISOString(),
    })),
  }
}

/**
 * Mock GraphQL messages response builder
 */
export function buildMessagesResponse(messages: TestMessage[], channelId?: string) {
  const filtered = channelId ? messages.filter((m) => m.channelId === channelId) : messages

  return {
    nchat_messages: filtered.map((msg) => ({
      __typename: 'nchat_messages',
      id: msg.id,
      content: msg.content,
      type: msg.type || 'text',
      is_edited: msg.isEdited ?? false,
      is_deleted: msg.isDeleted ?? false,
      created_at: msg.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: msg.updatedAt?.toISOString() || new Date().toISOString(),
      user: {
        __typename: 'nchat_users',
        id: msg.user?.id || msg.userId,
        username: msg.user?.username || 'user',
        display_name: msg.user?.displayName || 'User',
        avatar_url: msg.user?.avatarUrl || null,
        status: msg.user?.status || 'online',
      },
      reactions: (msg.reactions || []).map((r) => ({
        __typename: 'nchat_reactions',
        emoji: r.emoji,
        count: r.count,
        users: r.users,
      })),
    })),
  }
}

/**
 * Mock GraphQL user response builder
 */
export function buildUserResponse(user: TestUser) {
  return {
    nchat_users_by_pk: {
      __typename: 'nchat_users',
      id: user.id,
      username: user.username,
      display_name: user.displayName,
      email: user.email,
      avatar_url: user.avatarUrl || null,
      role: user.role,
      status: user.status || 'online',
      bio: user.bio || null,
      created_at: user.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: user.updatedAt?.toISOString() || new Date().toISOString(),
    },
  }
}

/**
 * Mock Apollo Client
 */
export function createMockApolloClient() {
  return {
    query: jest.fn().mockResolvedValue({ data: {} }),
    mutate: jest.fn().mockResolvedValue({ data: {} }),
    subscribe: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
    watchQuery: jest.fn().mockReturnValue({
      subscribe: jest.fn(),
      refetch: jest.fn(),
    }),
    cache: {
      readQuery: jest.fn(),
      writeQuery: jest.fn(),
      readFragment: jest.fn(),
      writeFragment: jest.fn(),
      evict: jest.fn(),
      gc: jest.fn(),
      reset: jest.fn(),
    },
  }
}

/**
 * Mock REST API response
 */
export function createMockApiResponse<T>(data: T, status: number = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  }
}

/**
 * Mock API error response
 */
export function createMockApiError(message: string, status: number = 500) {
  return {
    ok: false,
    status,
    json: async () => ({ error: message }),
    text: async () => JSON.stringify({ error: message }),
    headers: new Headers(),
  }
}
