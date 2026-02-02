/**
 * Messages API Route
 *
 * Handles CRUD operations for message management
 *
 * GET /api/messages - List messages (with filters, pagination, threads)
 * POST /api/messages - Create/send new message
 * PUT /api/messages - Update/edit message (requires messageId in body)
 * DELETE /api/messages - Delete message (requires messageId in query)
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateMessageSchema = z.object({
  channelId: z.string().uuid('Invalid channel ID'),
  content: z.string().min(1, 'Message content is required').max(4000, 'Message content too long (max 4000 characters)'),
  threadId: z.string().uuid().optional().nullable(), // Reply to thread
  parentMessageId: z.string().uuid().optional().nullable(), // Reply to specific message
  mentions: z.array(z.string().uuid()).optional(), // User IDs mentioned
  attachments: z.array(z.object({
    url: z.string().url(),
    filename: z.string(),
    size: z.number(),
    mimetype: z.string(),
  })).optional(),
  metadata: z.record(z.unknown()).optional(), // Additional metadata
})

const UpdateMessageSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
  content: z.string().min(1, 'Message content is required').max(4000, 'Message content too long'),
  metadata: z.record(z.unknown()).optional(),
})

const SearchQuerySchema = z.object({
  channelId: z.string().uuid().optional(),
  threadId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(), // Filter by author
  search: z.string().optional(), // Full-text search
  before: z.string().datetime().optional(), // Messages before this timestamp
  after: z.string().datetime().optional(), // Messages after this timestamp
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeThreads: z.coerce.boolean().default(false), // Include thread replies
  includeReactions: z.coerce.boolean().default(true),
})

const ReactionSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
  emoji: z.string().min(1).max(50),
  action: z.enum(['add', 'remove']),
})

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string
  channelId: string
  userId: string
  content: string
  threadId?: string | null
  parentMessageId?: string | null
  createdAt: string
  updatedAt: string
  editedAt?: string | null
  deletedAt?: string | null
  isEdited: boolean
  isPinned: boolean
  mentions?: string[]
  attachments?: Array<{
    url: string
    filename: string
    size: number
    mimetype: string
  }>
  reactions?: Array<{
    emoji: string
    count: number
    users: string[]
  }>
  replyCount?: number
  metadata?: Record<string, unknown>
}

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
        { error: 'Either channelId or threadId is required' },
        { status: 400 }
      )
    }

    // TODO: Replace with actual database query using Hasura GraphQL
    // This is a mock implementation
    const mockMessages: Message[] = [
      {
        id: '1',
        channelId: params.channelId || 'channel-1',
        userId: 'user-1',
        content: 'Hello everyone! Welcome to the channel.',
        threadId: null,
        parentMessageId: null,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        editedAt: null,
        deletedAt: null,
        isEdited: false,
        isPinned: true,
        mentions: [],
        reactions: [
          { emoji: '👋', count: 5, users: ['user-2', 'user-3', 'user-4', 'user-5', 'user-6'] },
          { emoji: '🎉', count: 2, users: ['user-7', 'user-8'] },
        ],
        replyCount: 3,
      },
      {
        id: '2',
        channelId: params.channelId || 'channel-1',
        userId: 'user-2',
        content: 'Thanks for the warm welcome!',
        threadId: '1', // Thread reply to message 1
        parentMessageId: '1',
        createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        editedAt: null,
        deletedAt: null,
        isEdited: false,
        isPinned: false,
        mentions: ['user-1'],
        reactions: [
          { emoji: '❤️', count: 1, users: ['user-1'] },
        ],
      },
      {
        id: '3',
        channelId: params.channelId || 'channel-1',
        userId: 'user-3',
        content: 'Has anyone seen the latest updates?',
        threadId: null,
        parentMessageId: null,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        editedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        deletedAt: null,
        isEdited: true,
        isPinned: false,
        mentions: [],
        replyCount: 0,
      },
    ]

    // Apply filters
    let filteredMessages = mockMessages

    if (params.channelId) {
      filteredMessages = filteredMessages.filter(m => m.channelId === params.channelId)
    }

    if (params.threadId) {
      filteredMessages = filteredMessages.filter(m => m.threadId === params.threadId)
    }

    if (params.userId) {
      filteredMessages = filteredMessages.filter(m => m.userId === params.userId)
    }

    if (!params.includeThreads) {
      filteredMessages = filteredMessages.filter(m => !m.threadId)
    }

    if (params.search) {
      const query = params.search.toLowerCase()
      filteredMessages = filteredMessages.filter(m =>
        m.content.toLowerCase().includes(query)
      )
    }

    if (params.before) {
      const beforeDate = new Date(params.before)
      filteredMessages = filteredMessages.filter(m =>
        new Date(m.createdAt) < beforeDate
      )
    }

    if (params.after) {
      const afterDate = new Date(params.after)
      filteredMessages = filteredMessages.filter(m =>
        new Date(m.createdAt) > afterDate
      )
    }

    // Sort messages
    filteredMessages.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return params.sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

    const total = filteredMessages.length
    const messages = filteredMessages.slice(params.offset, params.offset + params.limit)

    logger.info('GET /api/messages - Success', {
      total,
      returned: messages.length,
      channelId: params.channelId,
      threadId: params.threadId,
    })

    return NextResponse.json({
      success: true,
      messages,
      pagination: {
        total,
        offset: params.offset,
        limit: params.limit,
        hasMore: params.offset + params.limit < total,
      },
    })
  } catch (error) {
    logger.error('GET /api/messages - Error', error as Error)
    return NextResponse.json(
      {
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
          error: 'Invalid request body',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // TODO: Check authentication
    // Get current user from session/token

    // TODO: Check authorization
    // Verify user has access to the channel
    // If it's a thread reply, verify thread exists

    // TODO: Process mentions
    // Send notifications to mentioned users

    // TODO: Process attachments
    // Validate attachment URLs and metadata

    // TODO: Check for spam/rate limiting
    // Implement rate limiting per user

    // TODO: Create message in database via Hasura GraphQL mutation
    const newMessage: Message = {
      id: crypto.randomUUID(),
      channelId: data.channelId,
      userId: 'current-user-id', // TODO: Get from auth context
      content: data.content,
      threadId: data.threadId || null,
      parentMessageId: data.parentMessageId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
      isEdited: false,
      isPinned: false,
      mentions: data.mentions,
      attachments: data.attachments,
      reactions: [],
      replyCount: 0,
      metadata: data.metadata,
    }

    // TODO: Emit real-time event via WebSocket/Socket.io
    // This notifies other users in the channel

    // TODO: Send push notifications to mentioned users

    // TODO: Update channel's lastMessageAt timestamp

    logger.info('POST /api/messages - Message created', {
      messageId: newMessage.id,
      channelId: newMessage.channelId,
      isThreadReply: !!newMessage.threadId,
    })

    return NextResponse.json(
      {
        success: true,
        message: newMessage,
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('POST /api/messages - Error', error as Error)
    return NextResponse.json(
      {
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
          error: 'Invalid request body',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // TODO: Check authentication and authorization
    // Only message author and admins can edit messages

    // TODO: Check if message exists

    // TODO: Check edit time window
    // Some systems only allow edits within X minutes

    // TODO: Store edit history
    // Keep track of all edits for audit purposes

    // TODO: Update message in database via Hasura GraphQL mutation
    const updatedMessage: Message = {
      id: data.messageId,
      channelId: 'channel-id', // Would come from database
      userId: 'user-id',
      content: data.content,
      threadId: null,
      parentMessageId: null,
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // Mock
      updatedAt: new Date().toISOString(),
      editedAt: new Date().toISOString(),
      deletedAt: null,
      isEdited: true,
      isPinned: false,
      metadata: data.metadata,
    }

    // TODO: Emit real-time event for message update

    logger.info('PUT /api/messages - Message updated', {
      messageId: data.messageId,
    })

    return NextResponse.json({
      success: true,
      message: updatedMessage,
    })
  } catch (error) {
    logger.error('PUT /api/messages - Error', error as Error)
    return NextResponse.json(
      {
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
        { error: 'messageId query parameter is required' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(messageId)) {
      return NextResponse.json(
        { error: 'Invalid message ID format' },
        { status: 400 }
      )
    }

    // TODO: Check authentication and authorization
    // Only message author and admins can delete messages

    // TODO: Check if message exists

    if (hardDelete) {
      // TODO: Hard delete from database
      // Removes message completely
      logger.warn('DELETE /api/messages - Hard delete requested', { messageId })
    } else {
      // TODO: Soft delete
      // Set deletedAt timestamp or replace content with [deleted]
      logger.info('DELETE /api/messages - Message soft deleted', { messageId })
    }

    // TODO: Emit real-time event for message deletion

    // TODO: Handle thread implications
    // If this message has replies, decide what to do with them

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Message deleted permanently' : 'Message deleted',
      messageId,
    })
  } catch (error) {
    logger.error('DELETE /api/messages - Error', error as Error)
    return NextResponse.json(
      {
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
          error: 'Invalid request body',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // TODO: Check authentication

    // TODO: Check if message exists

    // TODO: Add or remove reaction in database
    // Store user-emoji-message relationship

    // TODO: Emit real-time event for reaction update

    logger.info('PATCH /api/messages - Reaction updated', {
      messageId: data.messageId,
      emoji: data.emoji,
      action: data.action,
    })

    return NextResponse.json({
      success: true,
      message: `Reaction ${data.action === 'add' ? 'added' : 'removed'}`,
    })
  } catch (error) {
    logger.error('PATCH /api/messages - Error', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to update reaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
