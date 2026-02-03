/**
 * Call Participants API
 * GET /api/calls/[id]/participants - List participants
 * POST /api/calls/[id]/participants - Add participant(s)
 * DELETE /api/calls/[id]/participants - Remove participant
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema validation
const addParticipantsSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(50),
  notify: z.boolean().default(true),
})

const removeParticipantSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().optional(),
})

/**
 * GET /api/calls/[id]/participants
 * List all participants in a call
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const callId = params.id

    // Validate call ID
    if (!callId || !z.string().uuid().safeParse(callId).success) {
      return NextResponse.json({ error: 'Invalid call ID' }, { status: 400 })
    }

    // TODO: Get user from session
    const userId = request.headers.get('x-user-id') || 'dev-user-id'

    // TODO: Verify user has access to this call
    // const canAccess = await checkCallAccess(userId, callId)
    // if (!canAccess) {
    //   return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    // }

    // TODO: Fetch participants from database
    // const participants = await getCallParticipants(callId)

    // Mock participants
    const participants = [
      {
        id: 'participant-1',
        callId,
        userId: 'user-1',
        user: {
          id: 'user-1',
          username: 'john_doe',
          displayName: 'John Doe',
          avatarUrl: null,
        },
        joinedAt: new Date(Date.now() - 600000).toISOString(), // 10 mins ago
        leftAt: null,
        isMuted: false,
        isVideoOff: false,
        isScreenSharing: false,
        isSpeaking: false,
        connectionQuality: 95,
        isLocal: userId === 'user-1',
      },
      {
        id: 'participant-2',
        callId,
        userId: 'user-2',
        user: {
          id: 'user-2',
          username: 'jane_smith',
          displayName: 'Jane Smith',
          avatarUrl: null,
        },
        joinedAt: new Date(Date.now() - 300000).toISOString(), // 5 mins ago
        leftAt: null,
        isMuted: true,
        isVideoOff: false,
        isScreenSharing: true,
        isSpeaking: false,
        connectionQuality: 88,
        isLocal: userId === 'user-2',
      },
    ]

    return NextResponse.json({
      participants,
      count: participants.length,
    })
  } catch (error) {
    console.error('Error fetching call participants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/calls/[id]/participants
 * Add participant(s) to a call
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const callId = params.id

    // Validate call ID
    if (!callId || !z.string().uuid().safeParse(callId).success) {
      return NextResponse.json({ error: 'Invalid call ID' }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const validation = addParticipantsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { userIds, notify } = validation.data

    // TODO: Get user from session
    const userId = request.headers.get('x-user-id') || 'dev-user-id'

    // TODO: Verify call exists and is active
    // const call = await getCallById(callId)
    // if (!call || call.status !== 'active') {
    //   return NextResponse.json({ error: 'Call not found or not active' }, { status: 404 })
    // }

    // TODO: Verify user has permission to add participants
    // const canInvite = await checkCallPermission(userId, callId, 'INVITE_PARTICIPANTS')
    // if (!canInvite) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // TODO: Verify users exist and are not already in call
    // const existingParticipantIds = await getCallParticipantUserIds(callId)
    // const newUserIds = userIds.filter(id => !existingParticipantIds.includes(id))

    // TODO: Generate LiveKit tokens for new participants
    // const tokens = await generateLiveKitTokens(callId, newUserIds)

    // Create participant records
    const now = new Date().toISOString()
    const newParticipants = userIds.map((participantUserId) => ({
      id: `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      callId,
      userId: participantUserId,
      joinedAt: now,
      leftAt: null,
      isMuted: false,
      isVideoOff: true,
      isScreenSharing: false,
      invitedBy: userId,
    }))

    // TODO: Save participants to database
    // await addCallParticipants(newParticipants)

    // TODO: Send notifications/invitations if requested
    if (notify) {
      // await sendCallInvitations(callId, userIds)
    }

    // TODO: Broadcast participant added events
    // await broadcastParticipantsAdded(callId, newParticipants)

    return NextResponse.json(
      {
        success: true,
        participants: newParticipants,
        message: `${newParticipants.length} participant(s) added to call`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding call participants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/calls/[id]/participants
 * Remove a participant from a call
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const callId = params.id

    // Validate call ID
    if (!callId || !z.string().uuid().safeParse(callId).success) {
      return NextResponse.json({ error: 'Invalid call ID' }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const validation = removeParticipantSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { userId: targetUserId, reason } = validation.data

    // TODO: Get user from session
    const userId = request.headers.get('x-user-id') || 'dev-user-id'

    // TODO: Verify call exists
    // const call = await getCallById(callId)
    // if (!call) {
    //   return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    // }

    // TODO: Verify user has permission to remove participants
    // Can remove self, or have REMOVE_PARTICIPANTS permission
    const isSelf = userId === targetUserId
    if (!isSelf) {
      // const canRemove = await checkCallPermission(userId, callId, 'REMOVE_PARTICIPANTS')
      // if (!canRemove) {
      //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      // }
    }

    // TODO: Find participant record
    // const participant = await getCallParticipant(callId, targetUserId)
    // if (!participant) {
    //   return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    // }

    // TODO: Remove participant from LiveKit room
    // await removeLiveKitParticipant(callId, targetUserId)

    // Update participant record
    const now = new Date().toISOString()
    const updatedParticipant = {
      id: 'participant-123',
      callId,
      userId: targetUserId,
      leftAt: now,
      removedBy: isSelf ? null : userId,
      removeReason: reason || (isSelf ? 'left' : 'removed'),
    }

    // TODO: Update database
    // await updateCallParticipant(participant.id, {
    //   leftAt: now,
    //   removedBy: isSelf ? null : userId,
    //   removeReason: reason,
    // })

    // TODO: Broadcast participant left event
    // await broadcastParticipantLeft(callId, updatedParticipant)

    return NextResponse.json({
      success: true,
      participant: updatedParticipant,
      message: isSelf ? 'Left call' : 'Participant removed from call',
    })
  } catch (error) {
    console.error('Error removing call participant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
