/**
 * Reopen Poll API Route
 *
 * POST /api/polls/[pollId]/reopen - Reopen a closed poll
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Poll } from '@/types/poll'
import { reopenPoll, canManagePoll } from '@/lib/polls/poll-manager'

// ============================================================================
// POST - Reopen Poll
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const { pollId } = await params
    const body = await request.json()
    const { closesAt } = body

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

    // Check if poll is not closed
    if (poll.status !== 'closed') {
      return NextResponse.json(
        { error: 'Poll is not closed' },
        { status: 400 }
      )
    }

    // Check permissions
    if (!canManagePoll(poll, userId, userRole)) {
      return NextResponse.json(
        { error: 'You do not have permission to reopen this poll' },
        { status: 403 }
      )
    }

    // Reopen poll
    const newClosesAt = closesAt ? new Date(closesAt) : undefined
    const reopenedPoll = reopenPoll(poll, newClosesAt)

    // TODO: Update poll in database

    return NextResponse.json({
      poll: reopenedPoll,
      message: 'Poll reopened successfully',
    })
  } catch (error) {
    console.error('Failed to reopen poll:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
