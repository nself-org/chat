/**
 * Single Message API Route
 *
 * Handles operations on a specific message by ID.
 *
 * GET /api/messages/[id] - Get message by ID
 * PATCH /api/messages/[id] - Update message
 * DELETE /api/messages/[id] - Delete message
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { apolloClient } from '@/lib/apollo-client'
import { getMessageService } from '@/services/messages/message.service'
import { getMentionService } from '@/services/messages/mention.service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpdateMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(4000, 'Message content too long'),
  mentions: z.array(z.string().uuid()).optional(),
  metadata: z.record(z.unknown()).optional(),
})

// ============================================================================
// SERVICES
// ============================================================================

const messageService = getMessageService(apolloClient)
const mentionService = getMentionService(apolloClient)

// ============================================================================
// HELPERS
// ============================================================================

function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// ============================================================================
// GET /api/messages/[id] - Get single message
// ============================================================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    logger.info('GET /api/messages/[id] - Get message', { id })

    if (!validateUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid message ID format' },
        { status: 400 }
      )
    }

    const result = await messageService.getMessage(id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error?.message || 'Failed to fetch message' },
        { status: result.error?.status || 500 }
      )
    }

    if (!result.data) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: result.data,
    })
  } catch (error) {
    logger.error('GET /api/messages/[id] - Error', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch message',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH /api/messages/[id] - Update message
// ============================================================================

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    logger.info('PATCH /api/messages/[id] - Update message', { id })

    if (!validateUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid message ID format' },
        { status: 400 }
      )
    }

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
      id,
      content: data.content,
      mentions: mentionedUserIds,
      metadata: data.metadata,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error?.message || 'Failed to update message' },
        { status: result.error?.status || 500 }
      )
    }

    logger.info('PATCH /api/messages/[id] - Message updated', { id })

    return NextResponse.json({
      success: true,
      message: result.data,
    })
  } catch (error) {
    logger.error('PATCH /api/messages/[id] - Error', error as Error)
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
// DELETE /api/messages/[id] - Delete message
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const hardDelete = searchParams.get('hard') === 'true'

    logger.info('DELETE /api/messages/[id] - Delete message', { id, hardDelete })

    if (!validateUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid message ID format' },
        { status: 400 }
      )
    }

    // Delete message via service
    const result = await messageService.deleteMessage(id, { hard: hardDelete })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error?.message || 'Failed to delete message' },
        { status: result.error?.status || 500 }
      )
    }

    logger.info('DELETE /api/messages/[id] - Message deleted', { id, hardDelete })

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Message deleted permanently' : 'Message deleted',
      data: result.data,
    })
  } catch (error) {
    logger.error('DELETE /api/messages/[id] - Error', error as Error)
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
