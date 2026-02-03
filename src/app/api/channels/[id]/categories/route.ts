/**
 * Channel Category Assignment API
 * PUT /api/channels/[id]/categories - Move channel to category
 * DELETE /api/channels/[id]/categories - Remove from category
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema validation
const moveChannelSchema = z.object({
  categoryId: z.string().uuid().optional(),
  position: z.number().int().min(0).optional(),
})

/**
 * PUT /api/channels/[id]/categories
 * Move channel to a category (or remove from category if categoryId is null)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const channelId = params.id

    // Validate channel ID
    if (!channelId || !z.string().uuid().safeParse(channelId).success) {
      return NextResponse.json({ error: 'Invalid channel ID' }, { status: 400 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = moveChannelSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { categoryId, position } = validation.data

    // TODO: Get user from session
    const userId = request.headers.get('x-user-id') || 'dev-user-id'

    // TODO: Verify user has permission to manage this channel
    // const hasPermission = await checkChannelPermission(userId, channelId, 'MANAGE_CHANNEL')
    // if (!hasPermission) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // TODO: If categoryId provided, verify it exists and belongs to same workspace
    if (categoryId) {
      // const category = await getCategoryById(categoryId)
      // if (!category) {
      //   return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      // }
      // Verify channel and category are in same workspace
      // if (channel.workspaceId !== category.workspaceId) {
      //   return NextResponse.json({ error: 'Channel and category must be in same workspace' }, { status: 400 })
      // }
    }

    // Update channel's category and position
    // For now, return mock response
    const updatedChannel = {
      id: channelId,
      categoryId: categoryId || null,
      position: position ?? 0,
      updatedAt: new Date().toISOString(),
    }

    // TODO: Database update
    // const updatedChannel = await updateChannel(channelId, {
    //   categoryId,
    //   position,
    //   updatedAt: new Date(),
    // })

    // TODO: Broadcast channel update event
    // await broadcastChannelUpdate(updatedChannel)

    return NextResponse.json({
      success: true,
      channel: updatedChannel,
    })
  } catch (error) {
    console.error('Error moving channel to category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/channels/[id]/categories
 * Remove channel from its category
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const channelId = params.id

    // Validate channel ID
    if (!channelId || !z.string().uuid().safeParse(channelId).success) {
      return NextResponse.json({ error: 'Invalid channel ID' }, { status: 400 })
    }

    // TODO: Get user from session
    const userId = request.headers.get('x-user-id') || 'dev-user-id'

    // TODO: Verify user has permission to manage this channel
    // const hasPermission = await checkChannelPermission(userId, channelId, 'MANAGE_CHANNEL')
    // if (!hasPermission) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Remove channel from category (set categoryId to null)
    const updatedChannel = {
      id: channelId,
      categoryId: null,
      updatedAt: new Date().toISOString(),
    }

    // TODO: Database update
    // const updatedChannel = await updateChannel(channelId, {
    //   categoryId: null,
    //   updatedAt: new Date(),
    // })

    // TODO: Broadcast channel update event
    // await broadcastChannelUpdate(updatedChannel)

    return NextResponse.json({
      success: true,
      channel: updatedChannel,
    })
  } catch (error) {
    console.error('Error removing channel from category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
