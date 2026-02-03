/**
 * Category Service
 *
 * Core service for category CRUD operations using Hasura GraphQL backend.
 * Provides a clean API for category management with proper error handling.
 *
 * Categories are used to organize channels into logical sections (similar to
 * Discord's category/section system).
 */

import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import {
  GET_CATEGORIES,
  GET_CATEGORIES_WITH_CHANNELS,
  GET_CATEGORY,
  GET_MAX_CATEGORY_POSITION,
  INSERT_CATEGORY,
  UPDATE_CATEGORY,
  DELETE_CATEGORY,
  REORDER_CATEGORIES,
  TOGGLE_CATEGORY_COLLAPSED,
  MOVE_CHANNEL_TO_CATEGORY,
  REORDER_CHANNELS_IN_CATEGORY,
  type Category as GraphQLCategory,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type CategoryPositionUpdate,
} from '@/graphql/channels/categories'
import type { Channel } from './channel.service'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Category {
  id: string
  workspaceId?: string | null
  name: string
  description?: string | null
  position: number
  isCollapsed: boolean
  createdAt: string
  updatedAt: string
  channels?: Channel[]
}

export interface CategoryListOptions {
  workspaceId?: string
  includeChannels?: boolean
  includeArchivedChannels?: boolean
  limit?: number
  offset?: number
}

export interface CategoryListResult {
  categories: Category[]
  total: number
  hasMore: boolean
}

export interface MoveChannelOptions {
  channelId: string
  categoryId: string | null
  position: number
}

// ============================================================================
// CATEGORY SERVICE CLASS
// ============================================================================

export class CategoryService {
  private client: ApolloClient<NormalizedCacheObject>

  constructor(client: ApolloClient<NormalizedCacheObject>) {
    this.client = client
  }

  // ==========================================================================
  // READ OPERATIONS
  // ==========================================================================

  /**
   * Get a list of categories with optional filtering and pagination
   */
  async getCategories(options: CategoryListOptions = {}): Promise<CategoryListResult> {
    const {
      workspaceId,
      includeChannels = false,
      includeArchivedChannels = false,
      limit = 50,
      offset = 0,
    } = options

    if (includeChannels) {
      const { data } = await this.client.query({
        query: GET_CATEGORIES_WITH_CHANNELS,
        variables: { workspaceId, includeArchived: includeArchivedChannels },
        fetchPolicy: 'network-only',
      })

      const categories = this.transformCategories(data.nchat_categories || [])
      return {
        categories,
        total: categories.length,
        hasMore: false,
      }
    }

    const { data } = await this.client.query({
      query: GET_CATEGORIES,
      variables: { workspaceId, limit, offset },
      fetchPolicy: 'network-only',
    })

    const categories = this.transformCategories(data.nchat_categories || [])
    const total = data.nchat_categories_aggregate?.aggregate?.count || categories.length

    return {
      categories,
      total,
      hasMore: offset + limit < total,
    }
  }

  /**
   * Get a single category by ID
   */
  async getCategory(id: string): Promise<Category | null> {
    const { data } = await this.client.query({
      query: GET_CATEGORY,
      variables: { id },
      fetchPolicy: 'network-only',
    })

    if (!data.nchat_categories_by_pk) {
      return null
    }

    return this.transformCategory(data.nchat_categories_by_pk)
  }

  /**
   * Get the next available position for a new category
   */
  private async getNextPosition(workspaceId?: string | null): Promise<number> {
    const { data } = await this.client.query({
      query: GET_MAX_CATEGORY_POSITION,
      variables: { workspaceId },
      fetchPolicy: 'network-only',
    })

    const maxPosition = data.nchat_categories_aggregate?.aggregate?.max?.position ?? -1
    return maxPosition + 1
  }

  // ==========================================================================
  // WRITE OPERATIONS
  // ==========================================================================

  /**
   * Create a new category
   */
  async createCategory(input: CreateCategoryInput): Promise<Category> {
    // Get the next position if not specified
    const position = input.position ?? (await this.getNextPosition(input.workspaceId))

    const { data } = await this.client.mutate({
      mutation: INSERT_CATEGORY,
      variables: {
        name: input.name,
        description: input.description,
        workspaceId: input.workspaceId,
        position,
        isCollapsed: input.isCollapsed ?? false,
      },
    })

    return this.transformCategory(data.insert_nchat_categories_one)
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: string, updates: UpdateCategoryInput): Promise<Category> {
    const { data } = await this.client.mutate({
      mutation: UPDATE_CATEGORY,
      variables: {
        id,
        name: updates.name,
        description: updates.description,
        position: updates.position,
        isCollapsed: updates.isCollapsed,
      },
    })

    return this.transformCategory(data.update_nchat_categories_by_pk)
  }

  /**
   * Delete a category
   * Channels in this category will be moved to uncategorized
   */
  async deleteCategory(id: string): Promise<{
    id: string
    name: string
    movedChannelsCount: number
  }> {
    const { data } = await this.client.mutate({
      mutation: DELETE_CATEGORY,
      variables: { id },
    })

    return {
      id: data.delete_nchat_categories_by_pk.id,
      name: data.delete_nchat_categories_by_pk.name,
      movedChannelsCount: data.update_nchat_channels?.affected_rows || 0,
    }
  }

  /**
   * Reorder categories by updating their positions in bulk
   */
  async reorderCategories(positions: CategoryPositionUpdate[]): Promise<void> {
    if (positions.length === 0) return

    // Build the updates array for Hasura's update_many
    const updates = positions.map(({ id, position }) => ({
      where: { id: { _eq: id } },
      _set: { position, updated_at: 'now()' },
    }))

    await this.client.mutate({
      mutation: REORDER_CATEGORIES,
      variables: { updates },
    })
  }

  /**
   * Toggle the collapsed state of a category
   */
  async toggleCollapsed(categoryId: string): Promise<Category> {
    // First get the current state
    const category = await this.getCategory(categoryId)
    if (!category) {
      throw new Error('Category not found')
    }

    const { data } = await this.client.mutate({
      mutation: TOGGLE_CATEGORY_COLLAPSED,
      variables: {
        id: categoryId,
        isCollapsed: !category.isCollapsed,
      },
    })

    return {
      ...category,
      isCollapsed: data.update_nchat_categories_by_pk.is_collapsed,
      updatedAt: data.update_nchat_categories_by_pk.updated_at,
    }
  }

  /**
   * Move a channel to a category (or to uncategorized if categoryId is null)
   */
  async moveChannel(options: MoveChannelOptions): Promise<{
    channelId: string
    categoryId: string | null
    position: number
  }> {
    const { channelId, categoryId, position } = options

    const { data } = await this.client.mutate({
      mutation: MOVE_CHANNEL_TO_CATEGORY,
      variables: { channelId, categoryId, position },
    })

    return {
      channelId: data.update_nchat_channels_by_pk.id,
      categoryId: data.update_nchat_channels_by_pk.category_id,
      position: data.update_nchat_channels_by_pk.position,
    }
  }

  /**
   * Reorder channels within a category
   */
  async reorderChannelsInCategory(
    channelPositions: Array<{ channelId: string; position: number }>
  ): Promise<void> {
    if (channelPositions.length === 0) return

    const updates = channelPositions.map(({ channelId, position }) => ({
      where: { id: { _eq: channelId } },
      _set: { position, updated_at: 'now()' },
    }))

    await this.client.mutate({
      mutation: REORDER_CHANNELS_IN_CATEGORY,
      variables: { updates },
    })
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Transform a raw category from GraphQL to our interface
   */
  private transformCategory(raw: Record<string, unknown>): Category {
    return {
      id: raw.id as string,
      workspaceId: raw.workspace_id as string | null,
      name: raw.name as string,
      description: raw.description as string | null,
      position: (raw.position as number) || 0,
      isCollapsed: (raw.is_collapsed as boolean) || false,
      createdAt: raw.created_at as string,
      updatedAt: raw.updated_at as string,
      channels: raw.channels
        ? this.transformChannels(raw.channels as Record<string, unknown>[])
        : undefined,
    }
  }

  /**
   * Transform an array of raw categories
   */
  private transformCategories(rawCategories: Record<string, unknown>[]): Category[] {
    return rawCategories.map((raw) => this.transformCategory(raw))
  }

  /**
   * Transform raw channels from GraphQL response
   */
  private transformChannels(rawChannels: Record<string, unknown>[]): Channel[] {
    return rawChannels.map((raw) => ({
      id: raw.id as string,
      name: raw.name as string,
      slug: raw.slug as string,
      description: raw.description as string | null,
      topic: raw.topic as string | null,
      type: raw.type as Channel['type'],
      workspaceId: raw.workspace_id as string | null,
      categoryId: raw.category_id as string | null,
      icon: raw.icon as string | null,
      color: raw.color as string | null,
      position: (raw.position as number) || 0,
      isDefault: (raw.is_default as boolean) || false,
      isArchived: (raw.is_archived as boolean) || false,
      isReadonly: (raw.is_readonly as boolean) || false,
      isNsfw: (raw.is_nsfw as boolean) || false,
      slowmodeSeconds: (raw.slowmode_seconds as number) || 0,
      maxMembers: raw.max_members as number | null,
      memberCount: (raw.member_count as number) || 0,
      messageCount: (raw.message_count as number) || 0,
      lastMessageAt: raw.last_message_at as string | null,
      lastMessageId: raw.last_message_id as string | null,
      retentionDays: raw.retention_days as number | null,
      createdBy: raw.created_by as string,
      createdAt: raw.created_at as string,
      updatedAt: raw.updated_at as string,
      archivedAt: raw.archived_at as string | null,
      creator: raw.creator
        ? {
            id: (raw.creator as Record<string, unknown>).id as string,
            username: (raw.creator as Record<string, unknown>).username as string,
            displayName: (raw.creator as Record<string, unknown>).display_name as string,
            avatarUrl: (raw.creator as Record<string, unknown>).avatar_url as string | undefined,
          }
        : undefined,
      membersAggregate: raw.members_aggregate as { aggregate: { count: number } } | undefined,
    }))
  }
}

// ============================================================================
// SINGLETON FACTORY
// ============================================================================

let categoryServiceInstance: CategoryService | null = null

export function getCategoryService(client: ApolloClient<NormalizedCacheObject>): CategoryService {
  if (!categoryServiceInstance) {
    categoryServiceInstance = new CategoryService(client)
  }
  return categoryServiceInstance
}

export function createCategoryService(
  client: ApolloClient<NormalizedCacheObject>
): CategoryService {
  return new CategoryService(client)
}
