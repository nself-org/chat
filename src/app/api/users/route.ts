/**
 * Users API Route
 *
 * Handles CRUD operations for user management
 *
 * GET /api/users - List users (with search, filter, pagination)
 * POST /api/users - Create new user
 * PUT /api/users - Update user (requires userId in body)
 * DELETE /api/users - Delete user (requires userId in query)
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(1, 'Display name is required').max(100),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['owner', 'admin', 'moderator', 'member', 'guest']).default('member'),
  avatar: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended', 'deleted']).default('active'),
  timezone: z.string().default('UTC'),
  locale: z.string().default('en'),
})

const UpdateUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  email: z.string().email('Invalid email address').optional(),
  displayName: z.string().min(1).max(100).optional(),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  role: z.enum(['owner', 'admin', 'moderator', 'member', 'guest']).optional(),
  avatar: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended', 'deleted']).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
})

const SearchQuerySchema = z.object({
  q: z.string().optional(), // search query
  role: z.enum(['owner', 'admin', 'moderator', 'member', 'guest']).optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'deleted']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['createdAt', 'displayName', 'email', 'lastActive']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// ============================================================================
// TYPES
// ============================================================================

interface User {
  id: string
  email: string
  displayName: string
  username: string
  role: string
  avatar?: string | null
  bio?: string | null
  status: string
  timezone: string
  locale: string
  createdAt: string
  updatedAt: string
  lastActiveAt?: string | null
  emailVerified: boolean
}

// ============================================================================
// GET /api/users - List users with search, filter, pagination
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    logger.info('GET /api/users - List users request')

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      q: searchParams.get('q') || undefined,
      role: searchParams.get('role') || undefined,
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') || '50',
      offset: searchParams.get('offset') || '0',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    }

    const validation = SearchQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const params = validation.data

    // This is a mock implementation
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'owner@nself.org',
        displayName: 'Owner User',
        username: 'owner',
        role: 'owner',
        avatar: null,
        bio: 'Platform owner',
        status: 'active',
        timezone: 'UTC',
        locale: 'en',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        emailVerified: true,
      },
      {
        id: '2',
        email: 'admin@nself.org',
        displayName: 'Admin User',
        username: 'admin',
        role: 'admin',
        avatar: null,
        bio: 'Administrator',
        status: 'active',
        timezone: 'UTC',
        locale: 'en',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        lastActiveAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        emailVerified: true,
      },
    ]

    // Apply filters
    let filteredUsers = mockUsers
    if (params.role) {
      filteredUsers = filteredUsers.filter((u) => u.role === params.role)
    }
    if (params.status) {
      filteredUsers = filteredUsers.filter((u) => u.status === params.status)
    }
    if (params.q) {
      const query = params.q.toLowerCase()
      filteredUsers = filteredUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(query) ||
          u.displayName.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query)
      )
    }

    const total = filteredUsers.length
    const users = filteredUsers.slice(params.offset, params.offset + params.limit)

    logger.info('GET /api/users - Success', {
      total,
      returned: users.length,
      offset: params.offset,
      limit: params.limit,
    })

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        total,
        offset: params.offset,
        limit: params.limit,
        hasMore: params.offset + params.limit < total,
      },
    })
  } catch (error) {
    logger.error('GET /api/users - Error', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/users - Create new user
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    logger.info('POST /api/users - Create user request')

    const body = await request.json()

    // Validate request body
    const validation = CreateUserSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Only admins should be able to create users

    // This should query the database

    // Use bcrypt or similar

    const newUser: User = {
      id: crypto.randomUUID(),
      email: data.email,
      displayName: data.displayName,
      username: data.username,
      role: data.role,
      avatar: data.avatar || null,
      bio: data.bio || null,
      status: data.status,
      timezone: data.timezone,
      locale: data.locale,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActiveAt: null,
      emailVerified: false,
    }

    logger.info('POST /api/users - User created', { userId: newUser.id, email: newUser.email })

    return NextResponse.json(
      {
        success: true,
        user: newUser,
        message: 'User created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('POST /api/users - Error', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to create user',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/users - Update user
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    logger.info('PUT /api/users - Update user request')

    const body = await request.json()

    // Validate request body
    const validation = UpdateUserSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Users can update their own profile
    // Admins can update any user

    const updatedUser: User = {
      id: data.userId,
      email: data.email || 'user@example.com', // Would come from database
      displayName: data.displayName || 'User',
      username: data.username || 'user',
      role: data.role || 'member',
      avatar: data.avatar !== undefined ? data.avatar : null,
      bio: data.bio !== undefined ? data.bio : null,
      status: data.status || 'active',
      timezone: data.timezone || 'UTC',
      locale: data.locale || 'en',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Mock
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      emailVerified: true,
    }

    logger.info('PUT /api/users - User updated', { userId: data.userId })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully',
    })
  } catch (error) {
    logger.error('PUT /api/users - Error', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to update user',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE /api/users - Delete user
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    logger.info('DELETE /api/users - Delete user request')

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 })
    }

    // Only admins and owners should be able to delete users
    // Users cannot delete themselves if they're the last owner

    // Soft delete: Update status to 'deleted'
    // Hard delete: Remove from database

    // Options:
    // 1. Anonymize user data
    // 2. Transfer ownership
    // 3. Cascade delete (not recommended)

    logger.info('DELETE /api/users - User deleted', { userId })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      userId,
    })
  } catch (error) {
    logger.error('DELETE /api/users - Error', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
