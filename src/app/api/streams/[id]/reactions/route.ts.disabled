/**
 * Stream Reactions API Route
 *
 * POST /api/streams/[id]/reactions - Send emoji reaction
 */

import { NextRequest, NextResponse } from 'next/server'
import { nhost } from '@/lib/nhost.server'

import { logger } from '@/lib/logger'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user from session
    const session = await nhost.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const streamId = params.id
    const userId = session.user?.id

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { emoji, positionX, positionY } = body

    // Validate emoji
    if (!emoji || emoji.trim().length === 0) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 })
    }

    // Verify stream is live and reactions are enabled
    const { data: streamData, error: streamError } = await nhost.graphql.request(
      `
        query GetStreamReactionStatus($id: uuid!) {
          nchat_streams_by_pk(id: $id) {
            status
            enable_reactions
          }
        }
      `,
      { id: streamId }
    )

    if (streamError || !streamData?.nchat_streams_by_pk) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
    }

    if (!streamData.nchat_streams_by_pk.enable_reactions) {
      return NextResponse.json({ error: 'Reactions are disabled for this stream' }, { status: 403 })
    }

    if (streamData.nchat_streams_by_pk.status !== 'live') {
      return NextResponse.json({ error: 'Stream is not live' }, { status: 400 })
    }

    // Insert reaction
    const { data, error } = await nhost.graphql.request(
      `
        mutation SendStreamReaction($object: nchat_stream_reactions_insert_input!) {
          insert_nchat_stream_reactions_one(object: $object) {
            id
            stream_id
            user_id
            emoji
            position_x
            position_y
            created_at
            user {
              id
              display_name
            }
          }
        }
      `,
      {
        object: {
          stream_id: streamId,
          user_id: userId,
          emoji: emoji.trim(),
          position_x: positionX,
          position_y: positionY,
        },
      }
    )

    if (error || !data?.insert_nchat_stream_reactions_one) {
      logger.error('Failed to send reaction:', error)
      return NextResponse.json({ error: 'Failed to send reaction' }, { status: 500 })
    }

    return NextResponse.json(data.insert_nchat_stream_reactions_one)
  } catch (error) {
    logger.error('Send stream reaction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
