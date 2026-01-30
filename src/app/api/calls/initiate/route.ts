/**
 * API Route: Initiate Call
 *
 * Initiates a new voice or video call.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { apolloClient } from '@/lib/apollo-client'
import { INITIATE_CALL } from '@/graphql/calls'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface InitiateCallRequest {
  callId: string
  type: 'voice' | 'video'
  targetUserId?: string
  channelId?: string
  metadata?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user from cookies or headers
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value || request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: InitiateCallRequest = await request.json()

    // Validate required fields
    if (!body.callId || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: callId, type' },
        { status: 400 }
      )
    }

    // Must have either targetUserId or channelId
    if (!body.targetUserId && !body.channelId) {
      return NextResponse.json(
        { error: 'Either targetUserId or channelId is required' },
        { status: 400 }
      )
    }

    // Initiate call in database
    const { data, errors } = await apolloClient.mutate({
      mutation: INITIATE_CALL,
      variables: {
        callId: body.callId,
        type: body.type,
        callerId: userId,
        targetUserId: body.targetUserId,
        channelId: body.channelId,
        metadata: body.metadata || {},
      },
    })

    if (errors) {
      console.error('GraphQL errors:', errors)
      return NextResponse.json(
        { error: 'Failed to initiate call', details: errors },
        { status: 500 }
      )
    }

    const call = data?.insert_nchat_calls_one

    if (!call) {
      return NextResponse.json(
        { error: 'Failed to create call record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      call,
    })
  } catch (error) {
    console.error('Error initiating call:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
