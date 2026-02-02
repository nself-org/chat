/**
 * Close Poll API Route
 *
 * POST /api/polls/[pollId]/close - Close an active poll
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Poll } from '@/types/poll'
import { closePoll, canManagePoll } from '@/lib/polls/poll-manager'

// ============================================================================
// POST - Close Poll
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const { pollId } = await params

    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    // TODO: Get user ID from session/auth
    const userId = 'user_mock_id'
    const userRole = 'member' // TODO: Get from session

    // TODO: Fetch poll from database
    const poll = null as Poll | null

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Check if poll is already closed
    if (poll.status === 'closed') {
      return NextResponse.json(
        { error: 'Poll is already closed' },
        { status: 400 }
      )
    }

    // Check permissions
    if (!canManagePoll(poll, userId, userRole)) {
      return NextResponse.json(
        { error: 'You do not have permission to close this poll' },
        { status: 403 }
      )
    }

    // Close poll
    const closedPoll = closePoll(poll, userId)

    // TODO: Update poll in database

    return NextResponse.json({
      poll: closedPoll,
      message: 'Poll closed successfully',
    })
  } catch (error) {
    console.error('Failed to close poll:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
