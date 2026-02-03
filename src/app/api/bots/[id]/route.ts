/**
 * Individual Bot API Routes
 *
 * GET /api/bots/[id] - Get bot by ID
 * PUT /api/bots/[id] - Update bot
 * DELETE /api/bots/[id] - Delete bot
 */

import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'

const logger = createLogger('BotAPI')

// Mock database
interface Bot {
  id: string
  name: string
  description: string
  code: string
  version: string
  template_id?: string
  config: Record<string, unknown>
  enabled: boolean
  created_by: string
  created_at: Date
  updated_at: Date
  sandbox_enabled: boolean
  rate_limit_per_minute: number
  timeout_ms: number
}

const mockBots: Bot[] = []

/**
 * GET /api/bots/[id]
 * Get a specific bot by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const bot = mockBots.find((b) => b.id === id)

    if (!bot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bot not found',
        },
        { status: 404 }
      )
    }

    logger.info('Retrieved bot', { botId: id })

    return NextResponse.json({
      success: true,
      data: bot,
    })
  } catch (error) {
    logger.error('Failed to retrieve bot', error as Error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve bot',
        message: (error as Error).message,
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/bots/[id]
 * Update a bot
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const botIndex = mockBots.findIndex((b) => b.id === id)

    if (botIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bot not found',
        },
        { status: 404 }
      )
    }

    const bot = mockBots[botIndex]

    // Update fields
    if (body.name !== undefined) bot.name = body.name
    if (body.description !== undefined) bot.description = body.description
    if (body.code !== undefined) bot.code = body.code
    if (body.version !== undefined) bot.version = body.version
    if (body.config !== undefined) bot.config = body.config
    if (body.enabled !== undefined) bot.enabled = body.enabled
    if (body.sandbox_enabled !== undefined) bot.sandbox_enabled = body.sandbox_enabled
    if (body.rate_limit_per_minute !== undefined)
      bot.rate_limit_per_minute = body.rate_limit_per_minute
    if (body.timeout_ms !== undefined) bot.timeout_ms = body.timeout_ms

    bot.updated_at = new Date()

    // In production: UPDATE database and create new version if code changed
    if (body.code !== undefined && body.create_version) {
      logger.info('Creating new version', {
        botId: id,
        version: bot.version,
      })
      // INSERT INTO nchat_bot_versions
    }

    logger.info('Updated bot', { botId: id })

    return NextResponse.json({
      success: true,
      data: bot,
      message: 'Bot updated successfully',
    })
  } catch (error) {
    logger.error('Failed to update bot', error as Error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update bot',
        message: (error as Error).message,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/bots/[id]
 * Delete a bot
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const botIndex = mockBots.findIndex((b) => b.id === id)

    if (botIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bot not found',
        },
        { status: 404 }
      )
    }

    // In production: DELETE from database (cascades to versions, state, etc.)
    mockBots.splice(botIndex, 1)

    logger.info('Deleted bot', { botId: id })

    return NextResponse.json({
      success: true,
      message: 'Bot deleted successfully',
    })
  } catch (error) {
    logger.error('Failed to delete bot', error as Error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete bot',
        message: (error as Error).message,
      },
      { status: 500 }
    )
  }
}
