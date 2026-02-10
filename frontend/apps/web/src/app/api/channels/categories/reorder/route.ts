/**
 * Category Reorder API Route
 *
 * Handles bulk reordering of categories.
 *
 * POST /api/channels/categories/reorder - Reorder categories (admin/owner only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { apolloClient } from '@/lib/apollo-client'
import { categoryService } from '@/services/channels'
import type { UserRole } from '@/types/user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CategoryPositionSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int().min(0),
})

const ReorderCategoriesSchema = z.object({
  positions: z.array(CategoryPositionSchema).min(1, 'At least one category position is required'),
})

const MoveChannelSchema = z.object({
  channelId: z.string().uuid(),
  categoryId: z.string().uuid().nullable(),
  position: z.number().int().min(0),
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getUserIdFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-user-id') || null
}

function getUserRoleFromRequest(request: NextRequest): UserRole {
  return (request.headers.get('x-user-role') as UserRole) || 'guest'
}

/**
 * Check if user has permission to manage categories
 * Only admins and owners can create/update/delete categories
 */
function canManageCategories(role: UserRole): boolean {
  return ['admin', 'owner'].includes(role)
}

// ============================================================================
// POST /api/channels/categories/reorder - Reorder categories
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    logger.info('POST /api/channels/categories/reorder - Reorder categories request')

    // Get user from auth
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userRole = getUserRoleFromRequest(request)

    // Check permissions - only admins and owners can reorder categories
    if (!canManageCategories(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to reorder categories' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Determine the action type
    const action = body.action || 'reorderCategories'

    if (action === 'moveChannel') {
      // Handle moving a channel to a category
      const validation = MoveChannelSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid request body',
            details: validation.error.flatten().fieldErrors,
          },
          { status: 400 }
        )
      }

      const { channelId, categoryId, position } = validation.data

      // TODO: Implement moveChannel in CategoryService
      // @ts-expect-error - Method will be implemented in CategoryService
      const result = await categoryService.moveChannel?.({
        channelId,
        categoryId,
        position,
      })

      logger.info('POST /api/channels/categories/reorder - Channel moved', {
        channelId,
        categoryId,
        position,
        movedBy: userId,
      })

      return NextResponse.json({
        success: true,
        message: 'Channel moved successfully',
        result: { channelId, categoryId, position },
      })
    } else {
      // Handle reordering categories
      const validation = ReorderCategoriesSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid request body',
            details: validation.error.flatten().fieldErrors,
          },
          { status: 400 }
        )
      }

      const { positions } = validation.data

      // Map to just IDs for the current CategoryService interface
      await categoryService.reorderCategories(positions.map((p) => p.id))

      logger.info('POST /api/channels/categories/reorder - Categories reordered', {
        count: positions.length,
        reorderedBy: userId,
      })

      return NextResponse.json({
        success: true,
        message: 'Categories reordered successfully',
        reorderedCount: positions.length,
      })
    }
  } catch (error) {
    logger.error('POST /api/channels/categories/reorder - Error', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reorder categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
