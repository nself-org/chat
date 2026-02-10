/**
 * Channel Factory
 *
 * Factory functions for creating channel test data with deterministic IDs.
 *
 * @module @nself-chat/testing/factories/channel
 */

export interface TestChannel {
  id: string
  name: string
  slug: string
  description?: string | null
  type: 'public' | 'private' | 'direct' | 'group'
  isDefault?: boolean
  isArchived?: boolean
  memberCount?: number
  createdAt?: Date
  updatedAt?: Date
}

// Counter for deterministic ID generation
let channelIdCounter = 2000

function generateChannelId(): string {
  return `channel-${String(channelIdCounter++).padStart(6, '0')}`
}

export function resetChannelIdCounter() {
  channelIdCounter = 2000
}

export interface ChannelFactoryOptions extends Partial<TestChannel> {}

/**
 * Create a test channel with default values
 */
export function createChannel(options: ChannelFactoryOptions = {}): TestChannel {
  const id = options.id || generateChannelId()
  const name = options.name || `channel-${channelIdCounter - 2000}`
  const slug = options.slug || name.toLowerCase().replace(/\s+/g, '-')

  return {
    id,
    name,
    slug,
    description: options.description || null,
    type: options.type || 'public',
    isDefault: options.isDefault ?? false,
    isArchived: options.isArchived ?? false,
    memberCount: options.memberCount ?? 1,
    createdAt: options.createdAt || new Date('2024-01-01T00:00:00Z'),
    updatedAt: options.updatedAt || new Date('2024-01-01T00:00:00Z'),
  }
}

export function createChannels(count: number, options: ChannelFactoryOptions = {}): TestChannel[] {
  return Array.from({ length: count }, (_, i) =>
    createChannel({
      ...options,
      name: options.name ? `${options.name}-${i + 1}` : `channel-${i + 1}`,
    })
  )
}

export function createPublicChannel(options: Omit<ChannelFactoryOptions, 'type'> = {}): TestChannel {
  return createChannel({ ...options, type: 'public' })
}

export function createPrivateChannel(options: Omit<ChannelFactoryOptions, 'type'> = {}): TestChannel {
  return createChannel({ ...options, type: 'private' })
}

export function createDirectChannel(
  user1Id: string,
  user2Id: string,
  options: Omit<ChannelFactoryOptions, 'type' | 'name' | 'slug'> = {}
): TestChannel {
  return createChannel({
    ...options,
    id: options.id || `dm-${user1Id}-${user2Id}`,
    name: '',
    slug: `dm-${user1Id}-${user2Id}`,
    type: 'direct',
    memberCount: 2,
  })
}

export function createGroupChannel(options: Omit<ChannelFactoryOptions, 'type'> = {}): TestChannel {
  return createChannel({
    name: 'Group Chat',
    ...options,
    type: 'group',
  })
}

export function createDefaultChannel(options: Omit<ChannelFactoryOptions, 'isDefault'> = {}): TestChannel {
  return createChannel({
    name: 'general',
    slug: 'general',
    description: 'General discussion for everyone',
    ...options,
    isDefault: true,
  })
}

export function createArchivedChannel(options: Omit<ChannelFactoryOptions, 'isArchived'> = {}): TestChannel {
  return createChannel({
    name: 'archived-project',
    description: 'Archived project channel',
    ...options,
    isArchived: true,
  })
}

export function createPopularChannel(memberCount: number = 100, options: Omit<ChannelFactoryOptions, 'memberCount'> = {}): TestChannel {
  return createChannel({
    name: 'popular',
    description: 'A popular channel with many members',
    ...options,
    memberCount,
  })
}

export const predefinedChannels = {
  general: createDefaultChannel({ id: 'channel-general', memberCount: 25 }),
  random: createPublicChannel({
    id: 'channel-random',
    name: 'random',
    slug: 'random',
    description: 'Random conversations and fun',
    memberCount: 20,
  }),
  engineering: createPrivateChannel({
    id: 'channel-engineering',
    name: 'engineering',
    slug: 'engineering',
    description: 'Engineering team discussions',
    memberCount: 8,
  }),
  announcements: createPublicChannel({
    id: 'channel-announcements',
    name: 'announcements',
    slug: 'announcements',
    description: 'Important announcements',
    memberCount: 50,
  }),
  archived: createArchivedChannel({
    id: 'channel-archived',
    name: 'old-project',
    slug: 'old-project',
    memberCount: 5,
  }),
}

export function createWorkspaceChannels(): TestChannel[] {
  return [
    predefinedChannels.general,
    predefinedChannels.random,
    predefinedChannels.announcements,
    createPrivateChannel({
      name: 'team-leads',
      slug: 'team-leads',
      description: 'Team leads discussions',
      memberCount: 5,
    }),
    createPrivateChannel({
      name: 'hr-internal',
      slug: 'hr-internal',
      description: 'HR team internal',
      memberCount: 3,
    }),
  ]
}
