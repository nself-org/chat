/**
 * Categories API Route
 *
 * Handles CRUD operations for channel categories with Hasura GraphQL backend.
 *
 * GET /api/channels/categories - List categories (with optional channels)
 * POST /api/channels/categories - Create new category (admin/owner only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { apolloClient } from '@/lib/apollo-client'
import { createCategoryService } from '@/services/channels'
import type { UserRole } from '@/types/user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be 100 characters or less'),
  description: z.string().max(500).optional().nullable(),
  workspaceId: z.string().uuid().optional().nullable(),
  position: z.number().int().min(0).optional(),
  isCollapsed: z.boolean().optional(),
})

const QueryParamsSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  includeChannels: z.coerce.boolean().default(false),
  includeArchivedChannels: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user ID from request headers (set by auth middleware)
 */
function getUserIdFromRequest(request: NextRequest): string | null {
  const userId = request.headers.get('x-user-id')
  if (userId) return userId

  // Try authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    // Placeholder - implement proper JWT decoding
    return null
  }

  return null
}

/**
 * Get user role from request headers
 */
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
// GET /api/channels/categories - List categories
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    logger.info('GET /api/channels/categories - List categories request')

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      workspaceId: searchParams.get('workspaceId') || undefined,
      includeChannels: searchParams.get('includeChannels') || 'false',
      includeArchivedChannels: searchParams.get('includeArchivedChannels') || 'false',
      limit: searchParams.get('limit') || '50',
      offset: searchParams.get('offset') || '0',
    }

    const validation = QueryParamsSchema.safeParse(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const params = validation.data
    const categoryService = createCategoryService(apolloClient)

    const result = await categoryService.getCategories({
      workspaceId: params.workspaceId,
      includeChannels: params.includeChannels,
      includeArchivedChannels: params.includeArchivedChannels,
      limit: params.limit,
      offset: params.offset,
    })

    logger.info('GET /api/channels/categories - Success', {
      total: result.total,
      returned: result.categories.length,
      offset: params.offset,
      limit: params.limit,
    })

    return NextResponse.json({
      success: true,
      categories: result.categories,
      pagination: {
        total: result.total,
        offset: params.offset,
        limit: params.limit,
        hasMore: result.hasMore,
      },
    })
  } catch (error) {
    logger.error('GET /api/channels/categories - Error', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/channels/categories - Create new category
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    logger.info('POST /api/channels/categories - Create category request')

    // Get user from auth
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userRole = getUserRoleFromRequest(request)

    // Check permissions - only admins and owners can create categories
    if (!canManageCategories(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create categories' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate request body
    const validation = CreateCategorySchema.safeParse(body)
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

    const data = validation.data
    const categoryService = createCategoryService(apolloClient)

    // Create the category
    const category = await categoryService.createCategory({
      name: data.name,
      description: data.description,
      workspaceId: data.workspaceId,
      position: data.position,
      isCollapsed: data.isCollapsed,
    })

    logger.info('POST /api/channels/categories - Category created', {
      categoryId: category.id,
      name: category.name,
      createdBy: userId,
    })

    return NextResponse.json(
      {
        success: true,
        category,
        message: 'Category created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('POST /api/channels/categories - Error', error as Error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Category with this name already exists',
            message: 'Please choose a different category name',
          },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create category',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
