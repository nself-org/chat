/**
 * Channels API Route
 *
 * Handles CRUD operations for channel management
 *
 * GET /api/channels - List channels (with filters, search, pagination)
 * POST /api/channels - Create new channel
 * PUT /api/channels - Update channel (requires channelId in body)
 * DELETE /api/channels - Delete/archive channel (requires channelId in query)
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateChannelSchema = z.object({
  name: z.string().min(1, 'Channel name is required').max(80).regex(/^[a-z0-9-]+$/, 'Channel name must be lowercase letters, numbers, and hyphens only'),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/).optional(), // Auto-generated from name if not provided
  description: z.string().max(500).optional().nullable(),
  topic: z.string().max(250).optional().nullable(),
  type: z.enum(['public', 'private']).default('public'),
  categoryId: z.string().optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional().nullable(),
  isDefault: z.boolean().default(false),
  memberIds: z.array(z.string().uuid()).optional(), // For private channels
})

const UpdateChannelSchema = z.object({
  channelId: z.string().uuid('Invalid channel ID'),
  name: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional().nullable(),
  topic: z.string().max(250).optional().nullable(),
  type: z.enum(['public', 'private']).optional(),
  categoryId: z.string().optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  isArchived: z.boolean().optional(),
  isDefault: z.boolean().optional(),
})

const SearchQuerySchema = z.object({
  q: z.string().optional(), // search query
  type: z.enum(['public', 'private', 'all']).default('all'),
  categoryId: z.string().optional(),
  isArchived: z.coerce.boolean().default(false),
  memberOf: z.string().uuid().optional(), // Filter by user membership
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['createdAt', 'name', 'memberCount', 'lastMessageAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// ============================================================================
// TYPES
// ============================================================================

interface Channel {
  id: string
  name: string
  slug: string
  description?: string | null
  topic?: string | null
  type: 'public' | 'private'
  categoryId?: string | null
  icon?: string | null
  color?: string | null
  isArchived: boolean
  isDefault: boolean
  memberCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
  lastMessageAt?: string | null
  lastMessagePreview?: string | null
}

// ============================================================================
// GET /api/channels - List channels
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    logger.info('GET /api/channels - List channels request')

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      q: searchParams.get('q') || undefined,
      type: searchParams.get('type') || 'all',
      categoryId: searchParams.get('categoryId') || undefined,
      isArchived: searchParams.get('isArchived') || 'false',
      memberOf: searchParams.get('memberOf') || undefined,
      limit: searchParams.get('limit') || '50',
      offset: searchParams.get('offset') || '0',
      sortBy: searchParams.get('sortBy') || 'name',
      sortOrder: searchParams.get('sortOrder') || 'asc',
    }

    const validation = SearchQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const params = validation.data

    // TODO: Replace with actual database query using Hasura GraphQL
    // This is a mock implementation
    const mockChannels: Channel[] = [
      {
        id: '1',
        name: 'general',
        slug: 'general',
        description: 'General discussion for the team',
        topic: 'Team-wide announcements and discussions',
        type: 'public',
        categoryId: 'general',
        icon: null,
        color: '#6366f1',
        isArchived: false,
        isDefault: true,
        memberCount: 42,
        createdBy: 'system',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessageAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        lastMessagePreview: 'Welcome to the general channel!',
      },
      {
        id: '2',
        name: 'engineering',
        slug: 'engineering',
        description: 'Engineering team discussions',
        topic: 'Technical discussions and code reviews',
        type: 'public',
        categoryId: 'teams',
        icon: null,
        color: '#10b981',
        isArchived: false,
        isDefault: false,
        memberCount: 15,
        createdBy: 'user-1',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessageAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        lastMessagePreview: 'Deployed the new feature to staging',
      },
      {
        id: '3',
        name: 'project-alpha',
        slug: 'project-alpha',
        description: 'Project Alpha development',
        topic: 'Confidential project discussions',
        type: 'private',
        categoryId: 'projects',
        icon: null,
        color: '#a855f7',
        isArchived: false,
        isDefault: false,
        memberCount: 5,
        createdBy: 'user-1',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessageAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        lastMessagePreview: 'Sprint planning for next week',
      },
    ]

    // Apply filters
    let filteredChannels = mockChannels

    if (params.type !== 'all') {
      filteredChannels = filteredChannels.filter(c => c.type === params.type)
    }

    if (params.categoryId) {
      filteredChannels = filteredChannels.filter(c => c.categoryId === params.categoryId)
    }

    filteredChannels = filteredChannels.filter(c => c.isArchived === params.isArchived)

    if (params.q) {
      const query = params.q.toLowerCase()
      filteredChannels = filteredChannels.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.topic?.toLowerCase().includes(query)
      )
    }

    // TODO: If memberOf is provided, filter by user membership
    // This requires a database query to check channel_members table

    const total = filteredChannels.length
    const channels = filteredChannels.slice(params.offset, params.offset + params.limit)

    logger.info('GET /api/channels - Success', {
      total,
      returned: channels.length,
      offset: params.offset,
      limit: params.limit,
    })

    return NextResponse.json({
      success: true,
      channels,
      pagination: {
        total,
        offset: params.offset,
        limit: params.limit,
        hasMore: params.offset + params.limit < total,
      },
    })
  } catch (error) {
    logger.error('GET /api/channels - Error', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to fetch channels',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/channels - Create new channel
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    logger.info('POST /api/channels - Create channel request')

    const body = await request.json()

    // Validate request body
    const validation = CreateChannelSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // TODO: Check authentication and authorization
    // Check if user has permission to create channels

    // Generate slug from name if not provided
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')

    // TODO: Check if slug already exists in database

    // TODO: Create channel in database via Hasura GraphQL mutation
    const newChannel: Channel = {
      id: crypto.randomUUID(),
      name: data.name,
      slug,
      description: data.description || null,
      topic: data.topic || null,
      type: data.type,
      categoryId: data.categoryId || null,
      icon: data.icon || null,
      color: data.color || '#6366f1',
      isArchived: false,
      isDefault: data.isDefault,
      memberCount: data.memberIds ? data.memberIds.length : 0,
      createdBy: 'current-user-id', // TODO: Get from auth context
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessageAt: null,
      lastMessagePreview: null,
    }

    // TODO: If memberIds provided, add members to channel
    // For private channels, add the creator as a member

    logger.info('POST /api/channels - Channel created', {
      channelId: newChannel.id,
      name: newChannel.name,
      type: newChannel.type,
    })

    return NextResponse.json(
      {
        success: true,
        channel: newChannel,
        message: 'Channel created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('POST /api/channels - Error', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to create channel',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/channels - Update channel
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    logger.info('PUT /api/channels - Update channel request')

    const body = await request.json()

    // Validate request body
    const validation = UpdateChannelSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // TODO: Check authentication and authorization
    // Check if user has permission to update this channel

    // TODO: Check if channel exists

    // TODO: If name is being changed, check for slug conflicts

    // TODO: Update channel in database via Hasura GraphQL mutation
    const updatedChannel: Channel = {
      id: data.channelId,
      name: data.name || 'channel', // Would come from database
      slug: data.name || 'channel',
      description: data.description !== undefined ? data.description : null,
      topic: data.topic !== undefined ? data.topic : null,
      type: data.type || 'public',
      categoryId: data.categoryId !== undefined ? data.categoryId : null,
      icon: data.icon !== undefined ? data.icon : null,
      color: data.color !== undefined ? data.color : '#6366f1',
      isArchived: data.isArchived !== undefined ? data.isArchived : false,
      isDefault: data.isDefault !== undefined ? data.isDefault : false,
      memberCount: 10, // Would come from database
      createdBy: 'user-id',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Mock
      updatedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      lastMessagePreview: null,
    }

    logger.info('PUT /api/channels - Channel updated', {
      channelId: data.channelId,
    })

    return NextResponse.json({
      success: true,
      channel: updatedChannel,
      message: 'Channel updated successfully',
    })
  } catch (error) {
    logger.error('PUT /api/channels - Error', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to update channel',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE /api/channels - Delete/archive channel
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    logger.info('DELETE /api/channels - Delete channel request')

    const searchParams = request.nextUrl.searchParams
    const channelId = searchParams.get('channelId')
    const hardDelete = searchParams.get('hardDelete') === 'true'

    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId query parameter is required' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(channelId)) {
      return NextResponse.json(
        { error: 'Invalid channel ID format' },
        { status: 400 }
      )
    }

    // TODO: Check authentication and authorization
    // Only admins and channel creators should be able to delete channels

    // TODO: Check if channel exists and is not a default channel

    // TODO: Prevent deletion of default channels
    // Default channels should only be archived, not deleted

    if (hardDelete) {
      // TODO: Hard delete from database
      // This removes all channel data, messages, etc.
      // Use with extreme caution
      logger.warn('DELETE /api/channels - Hard delete requested', { channelId })
    } else {
      // TODO: Soft delete (archive)
      // Set isArchived = true
      logger.info('DELETE /api/channels - Channel archived', { channelId })
    }

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Channel deleted permanently' : 'Channel archived successfully',
      channelId,
      archived: !hardDelete,
    })
  } catch (error) {
    logger.error('DELETE /api/channels - Error', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to delete channel',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
