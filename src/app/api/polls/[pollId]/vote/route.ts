/**
 * Poll Voting API Route
 *
 * POST /api/polls/[pollId]/vote - Cast or change vote
 * DELETE /api/polls/[pollId]/vote - Remove vote
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Poll, CastVoteInput } from '@/types/poll'
import {
  validateVoteInput,
  processPollVote,
  removePollVote,
} from '@/lib/polls/poll-manager'

// ============================================================================
// POST - Cast or Change Vote
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const { pollId } = await params
    const body = await request.json()
    const { optionIds } = body

    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one option must be selected' },
        { status: 400 }
      )
    }

    // TODO: Get user ID from session/auth
    const userId = 'user_mock_id'

    // TODO: Fetch poll from database
    const poll: Poll | null = null

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Validate vote
    const voteInput: CastVoteInput = {
      pollId,
      optionIds,
    }
    const validation = validateVoteInput(poll, voteInput)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          validationErrors: validation.errors,
        },
        { status: 400 }
      )
    }

    // TODO: Fetch previous vote if exists
    const previousVote = undefined

    // Process vote
    const updatedPoll = processPollVote(poll, userId, optionIds, previousVote)

    // TODO: Save vote and updated poll to database

    return NextResponse.json({
      poll: updatedPoll,
      message: previousVote ? 'Vote updated successfully' : 'Vote recorded successfully',
    })
  } catch (error) {
    console.error('Failed to vote:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Remove Vote
// ============================================================================

export async function DELETE(
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

    // TODO: Fetch poll from database
    const poll: Poll | null = null

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // TODO: Fetch user's vote
    const userVote = null

    if (!userVote) {
      return NextResponse.json(
        { error: 'No vote found to remove' },
        { status: 404 }
      )
    }

    // Remove vote
    const updatedPoll = removePollVote(poll, userId, userVote)

    // TODO: Delete vote and update poll in database

    return NextResponse.json({
      poll: updatedPoll,
      message: 'Vote removed successfully',
    })
  } catch (error) {
    console.error('Failed to remove vote:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
