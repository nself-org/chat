/**
 * Poll Options API Route
 *
 * POST /api/polls/[pollId]/options - Add a new option to a poll
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Poll } from '@/types/poll'
import { addPollOption } from '@/lib/polls/poll-manager'

// ============================================================================
// POST - Add Option
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const { pollId } = await params
    const body = await request.json()
    const { text, emoji } = body

    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'Option text is required' },
        { status: 400 }
      )
    }

    // TODO: Get user ID from session/auth
    const _userId = 'user_mock_id'

    // TODO: Fetch poll from database
    const poll: Poll | null = null

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Add option (will throw error if not allowed)
    try {
      const updatedPoll = addPollOption(poll, text, emoji)

      // TODO: Save updated poll to database

      return NextResponse.json({
        poll: updatedPoll,
        message: 'Option added successfully',
      })
    } catch (err) {
      return NextResponse.json(
        {
          error: err instanceof Error ? err.message : 'Failed to add option',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Failed to add option:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
