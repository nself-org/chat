/**
 * Channels API Route
 *
 * Handles CRUD operations for channel management with real Hasura GraphQL backend.
 *
 * GET /api/channels - List channels (with filters, search, pagination)
 * POST /api/channels - Create new channel
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { apolloClient } from '@/lib/apollo-client'
import { createChannelService, createMembershipService } from '@/services/channels'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateChannelSchema = z.object({
  name: z
    .string()
    .min(1, 'Channel name is required')
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Channel name must be lowercase letters, numbers, and hyphens only'),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(500).optional().nullable(),
  topic: z.string().max(250).optional().nullable(),
  type: z.enum(['public', 'private', 'direct', 'group', 'announcement']).default('public'),
  workspaceId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
    .optional()
    .nullable(),
  isDefault: z.boolean().default(false),
  isReadonly: z.boolean().default(false),
  maxMembers: z.number().int().positive().optional().nullable(),
  slowmodeSeconds: z.number().int().min(0).max(21600).optional(),
  memberIds: z.array(z.string().uuid()).optional(),
})

const SearchQuerySchema = z.object({
  q: z.string().optional(),
  type: z.enum(['public', 'private', 'direct', 'group', 'announcement', 'all']).default('all'),
  categoryId: z.string().uuid().optional(),
  isArchived: z.coerce.boolean().default(false),
  memberOf: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['createdAt', 'name', 'memberCount', 'lastMessageAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user ID from request headers (set by auth middleware)
 */
function getUserIdFromRequest(request: NextRequest): string | null {
  const userId = request.headers.get('x-user-id')
  if (userId) return userId

  // Try to get from auth token (simplified - in production use proper JWT validation)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      // This is a placeholder - implement proper JWT decoding
      const token = authHeader.slice(7)
      // For now, return null to trigger anonymous access
      if (token) return null
    } catch {
      return null
    }
  }

  return null
}

/**
 * Get user role from request headers
 */
function getUserRoleFromRequest(request: NextRequest): string {
  return request.headers.get('x-user-role') || 'guest'
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
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const params = validation.data

    const channelService = createChannelService(apolloClient)
    const membershipService = createMembershipService(apolloClient)

    let result

    // If searching
    if (params.q) {
      result = await channelService.searchChannels({
        query: params.q,
        type: params.type !== 'all' ? params.type : undefined,
        limit: params.limit,
        offset: params.offset,
      })
    }
    // If filtering by user membership
    else if (params.memberOf) {
      const userChannels = await membershipService.getUserChannels(
        params.memberOf,
        params.isArchived
      )
      const channels = userChannels.map((uc) => uc.channel)
      result = {
        channels,
        total: channels.length,
        hasMore: false,
      }
    }
    // Default: get all channels
    else {
      result = await channelService.getChannels({
        type: params.type !== 'all' ? params.type : undefined,
        includeArchived: params.isArchived,
        limit: params.limit,
        offset: params.offset,
      })
    }

    logger.info('GET /api/channels - Success', {
      total: result.total,
      returned: result.channels.length,
      offset: params.offset,
      limit: params.limit,
    })

    return NextResponse.json({
      success: true,
      channels: result.channels,
      pagination: {
        total: result.total,
        offset: params.offset,
        limit: params.limit,
        hasMore: result.hasMore,
      },
    })
  } catch (error) {
    logger.error('GET /api/channels - Error', error as Error)
    return NextResponse.json(
      {
        success: false,
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

    // Get user from auth
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate request body
    const validation = CreateChannelSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    const channelService = createChannelService(apolloClient)
    const membershipService = createMembershipService(apolloClient)

    // Create the channel
    const channel = await channelService.createChannel(
      {
        name: data.name,
        slug: data.slug,
        description: data.description,
        topic: data.topic,
        type: data.type,
        workspaceId: data.workspaceId,
        categoryId: data.categoryId,
        icon: data.icon,
        color: data.color,
        isDefault: data.isDefault,
        isReadonly: data.isReadonly,
        maxMembers: data.maxMembers,
        slowmodeSeconds: data.slowmodeSeconds,
      },
      userId
    )

    // Add additional members if specified
    if (data.memberIds && data.memberIds.length > 0) {
      const otherMembers = data.memberIds.filter((id) => id !== userId)
      if (otherMembers.length > 0) {
        await membershipService.addMembersBulk(channel.id, otherMembers, 'member', userId)
      }
    }

    logger.info('POST /api/channels - Channel created', {
      channelId: channel.id,
      name: channel.name,
      type: channel.type,
      createdBy: userId,
    })

    return NextResponse.json(
      {
        success: true,
        channel,
        message: 'Channel created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('POST /api/channels - Error', error as Error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Channel with this slug already exists',
            message: 'Please choose a different channel name',
          },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create channel',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
