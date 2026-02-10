import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL || 'http://realtime.localhost:3101'

/**
 * POST /api/realtime/typing
 * Send typing indicator to a channel
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channelId, userId, isTyping } = body

    if (!channelId || !userId || typeof isTyping !== 'boolean') {
      return NextResponse.json(
        { error: 'channelId, userId, and isTyping (boolean) are required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${REALTIME_URL}/typing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channelId, userId, isTyping }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to send typing indicator' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    logger.error('[Realtime API] Typing indicator failed:', error)
    return NextResponse.json({ error: 'Failed to send typing indicator' }, { status: 500 })
  }
}
