/**
 * Messages API Route
 *
 * Handles CRUD operations for message management using Hasura GraphQL.
 *
 * GET /api/messages - List messages (with filters, pagination, threads)
 * POST /api/messages - Create/send new message
 * PUT /api/messages - Update/edit message (requires messageId in body)
 * DELETE /api/messages - Delete message (requires messageId in query)
 * PATCH /api/messages - Add/remove reaction
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { apolloClient } from '@/lib/apollo-client'
import { getMessageService } from '@/services/messages/message.service'
import { getReactionService } from '@/services/messages/reaction.service'
import { getMentionService } from '@/services/messages/mention.service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateMessageSchema = z.object({
  channelId: z.string().uuid('Invalid channel ID'),
  userId: z.string().uuid('Invalid user ID'),
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(4000, 'Message content too long (max 4000 characters)'),
  type: z.string().optional().default('text'),
  threadId: z.string().uuid().optional().nullable(),
  parentMessageId: z.string().uuid().optional().nullable(),
  mentions: z.array(z.string().uuid()).optional(),
  mentionedRoles: z.array(z.string()).optional(),
  mentionedChannels: z.array(z.string().uuid()).optional(),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        filename: z.string(),
        size: z.number(),
        mimetype: z.string(),
      })
    )
    .optional(),
  metadata: z.record(z.unknown()).optional(),
})

const UpdateMessageSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
  content: z.string().min(1, 'Message content is required').max(4000, 'Message content too long'),
  mentions: z.array(z.string().uuid()).optional(),
  metadata: z.record(z.unknown()).optional(),
})

const SearchQuerySchema = z.object({
  channelId: z.string().uuid().optional(),
  threadId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  search: z.string().optional(),
  before: z.string().datetime().optional(),
  after: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeThreads: z.coerce.boolean().default(false),
  includeReactions: z.coerce.boolean().default(true),
})

const ReactionSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
  userId: z.string().uuid('Invalid user ID'),
  emoji: z.string().min(1).max(50),
  action: z.enum(['add', 'remove', 'toggle']),
})

// ============================================================================
// SERVICES
// ============================================================================

const messageService = getMessageService(apolloClient)
const reactionService = getReactionService(apolloClient)
const mentionService = getMentionService(apolloClient)

// ============================================================================
// GET /api/messages - List messages
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    logger.info('GET /api/messages - List messages request')

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      channelId: searchParams.get('channelId') || undefined,
      threadId: searchParams.get('threadId') || undefined,
      userId: searchParams.get('userId') || undefined,
      search: searchParams.get('search') || undefined,
      before: searchParams.get('before') || undefined,
      after: searchParams.get('after') || undefined,
      limit: searchParams.get('limit') || '50',
      offset: searchParams.get('offset') || '0',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      includeThreads: searchParams.get('includeThreads') || 'false',
      includeReactions: searchParams.get('includeReactions') || 'true',
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

    // Require at least channelId or threadId
    if (!params.channelId && !params.threadId) {
      return NextResponse.json(
        { success: false, error: 'Either channelId or threadId is required' },
        { status: 400 }
      )
    }

    // If searching, use search endpoint
    if (params.search) {
      const result = await messageService.searchMessages({
        channelId: params.channelId,
        query: params.search,
        limit: params.limit,
        offset: params.offset,
        userId: params.userId,
      })

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error?.message || 'Search failed' },
          { status: result.error?.status || 500 }
        )
      }

      return NextResponse.json({
        success: true,
        messages: result.data?.messages || [],
        pagination: {
          total: result.data?.totalCount || 0,
          offset: params.offset,
          limit: params.limit,
          hasMore: result.data?.hasMore || false,
        },
      })
    }

    // If threadId provided, get thread messages
    if (params.threadId) {
      const result = await messageService.getThreadMessages(params.threadId, {
        limit: params.limit,
        offset: params.offset,
        before: params.before,
      })

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error?.message || 'Failed to fetch thread messages' },
          { status: result.error?.status || 500 }
        )
      }

      return NextResponse.json({
        success: true,
        messages: result.data?.messages || [],
        pagination: {
          total: result.data?.totalCount || 0,
          offset: params.offset,
          limit: params.limit,
          hasMore: result.data?.hasMore || false,
        },
      })
    }

    // Get channel messages
    const result = await messageService.getMessages({
      channelId: params.channelId!,
      limit: params.limit,
      offset: params.offset,
      before: params.before,
      after: params.after,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error?.message || 'Failed to fetch messages' },
        { status: result.error?.status || 500 }
      )
    }

    logger.info('GET /api/messages - Success', {
      total: result.data?.totalCount,
      returned: result.data?.messages.length,
      channelId: params.channelId,
    })

    return NextResponse.json({
      success: true,
      messages: result.data?.messages || [],
      pagination: {
        total: result.data?.totalCount || 0,
        offset: params.offset,
        limit: params.limit,
        hasMore: result.data?.hasMore || false,
      },
    })
  } catch (error) {
    logger.error('GET /api/messages - Error', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch messages',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/messages - Create/send new message
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    logger.info('POST /api/messages - Create message request')

    const body = await request.json()

    // Validate request body
    const validation = CreateMessageSchema.safeParse(body)
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

    // Parse mentions from content
    const parsedMentions = mentionService.parseMentions(data.content)
    const mentionedUserIds = data.mentions || []

    // Add parsed user mentions
    for (const mention of parsedMentions) {
      if (mention.type === 'user' && mention.value) {
        // Resolve username to user ID would happen here
        // For now, we use IDs passed in the request
      }
    }

    // Send message via service
    const result = await messageService.sendMessage({
      channelId: data.channelId,
      userId: data.userId,
      content: data.content,
      type: data.type,
      threadId: data.threadId || undefined,
      parentMessageId: data.parentMessageId || undefined,
      mentions: mentionedUserIds,
      mentionedRoles: data.mentionedRoles,
      mentionedChannels: data.mentionedChannels,
      metadata: data.metadata,
    })

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error?.message || 'Failed to create message' },
        { status: result.error?.status || 500 }
      )
    }

    // Send mention notifications (async, don't wait)
    if (mentionedUserIds.length > 0 || mentionService.hasMentions(data.content)) {
      mentionService
        .notifyMentionedUsers(data.content, {
          messageId: result.data.id,
          channelId: data.channelId,
          actorId: data.userId,
          actorName: result.data.user.displayName,
          messagePreview: data.content.substring(0, 100),
        })
        .catch((err) => {
          logger.warn('Failed to send mention notifications', { error: err })
        })
    }

    logger.info('POST /api/messages - Message created', {
      messageId: result.data.id,
      channelId: data.channelId,
      isThreadReply: !!data.threadId,
    })

    return NextResponse.json(
      {
        success: true,
        message: result.data,
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('POST /api/messages - Error', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create message',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/messages - Update/edit message
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    logger.info('PUT /api/messages - Update message request')

    const body = await request.json()

    // Validate request body
    const validation = UpdateMessageSchema.safeParse(body)
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

    // Parse mentions from updated content
    const parsedMentions = mentionService.parseMentions(data.content)
    const mentionedUserIds = data.mentions || []

    // Update message via service
    const result = await messageService.updateMessage({
      id: data.messageId,
      content: data.content,
      mentions: mentionedUserIds,
      metadata: data.metadata,
    })

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error?.message || 'Failed to update message' },
        { status: result.error?.status || 500 }
      )
    }

    logger.info('PUT /api/messages - Message updated', {
      messageId: data.messageId,
    })

    return NextResponse.json({
      success: true,
      message: result.data,
    })
  } catch (error) {
    logger.error('PUT /api/messages - Error', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update message',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE /api/messages - Delete message
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    logger.info('DELETE /api/messages - Delete message request')

    const searchParams = request.nextUrl.searchParams
    const messageId = searchParams.get('messageId')
    const hardDelete = searchParams.get('hardDelete') === 'true'

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'messageId query parameter is required' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(messageId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid message ID format' },
        { status: 400 }
      )
    }

    // Delete message via service
    const result = await messageService.deleteMessage(messageId, { hard: hardDelete })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error?.message || 'Failed to delete message' },
        { status: result.error?.status || 500 }
      )
    }

    logger.info('DELETE /api/messages - Message deleted', {
      messageId,
      hardDelete,
    })

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Message deleted permanently' : 'Message deleted',
      messageId,
    })
  } catch (error) {
    logger.error('DELETE /api/messages - Error', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete message',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH /api/messages - Add/remove reaction
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    logger.info('PATCH /api/messages - Reaction request')

    const body = await request.json()

    // Validate request body
    const validation = ReactionSchema.safeParse(body)
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

    let result
    if (data.action === 'add') {
      result = await reactionService.addReaction({
        messageId: data.messageId,
        userId: data.userId,
        emoji: data.emoji,
      })
    } else if (data.action === 'remove') {
      result = await reactionService.removeReaction({
        messageId: data.messageId,
        userId: data.userId,
        emoji: data.emoji,
      })
    } else {
      result = await reactionService.toggleReaction(data.messageId, data.userId, data.emoji)
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error?.message || 'Failed to update reaction' },
        { status: result.error?.status || 500 }
      )
    }

    logger.info('PATCH /api/messages - Reaction updated', {
      messageId: data.messageId,
      emoji: data.emoji,
      action: data.action,
    })

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    logger.error('PATCH /api/messages - Error', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update reaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
