/**
 * API Middleware Utilities
 *
 * Provides authentication, rate limiting, error handling, and logging
 * for API routes. Can be used individually or composed together.
 *
 * @example
 * ```typescript
 * import { withAuth, withRateLimit, withErrorHandler, compose } from '@/lib/api/middleware'
 *
 * // Single middleware
 * export const GET = withAuth(async (request, context) => {
 *   return successResponse({ message: 'Hello' })
 * })
 *
 * // Composed middleware
 * export const POST = compose(
 *   withErrorHandler,
 *   withRateLimit({ limit: 10, window: 60 }),
 *   withAuth
 * )(async (request, context) => {
 *   return successResponse({ message: 'Protected endpoint' })
 * })
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import {
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  rateLimitResponse,
  internalErrorResponse,
} from './response'

// ============================================================================
// Types
// ============================================================================

export interface AuthenticatedUser {
  id: string
  email: string
  displayName?: string
  role: 'owner' | 'admin' | 'moderator' | 'member' | 'guest'
  avatarUrl?: string
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser
}

export interface RouteContext {
  params: Promise<Record<string, string>>
}

export type ApiHandler<TRequest = NextRequest> = (
  request: TRequest,
  context: RouteContext
) => Promise<NextResponse> | NextResponse

export type Middleware<TIn = NextRequest, TOut = NextRequest> = (
  handler: ApiHandler<TOut>
) => ApiHandler<TIn>

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory rate limit store (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
let cleanupInterval: NodeJS.Timeout | null = null

function startCleanup() {
  if (cleanupInterval) return

  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key)
      }
    }
  }, 60000) // Clean up every minute
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return '127.0.0.1'
}

/**
 * Check if a request is rate limited
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): { limited: boolean; remaining: number; resetAt: number } {
  startCleanup()

  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    // Create new entry
    const resetAt = now + windowSeconds * 1000
    rateLimitStore.set(key, { count: 1, resetAt })
    return { limited: false, remaining: limit - 1, resetAt }
  }

  // Increment count
  entry.count++
  const limited = entry.count > limit
  const remaining = Math.max(0, limit - entry.count)

  return { limited, remaining, resetAt: entry.resetAt }
}

/**
 * Rate limiting middleware
 */
export interface RateLimitOptions {
  /** Maximum requests per window */
  limit?: number
  /** Window size in seconds */
  window?: number
  /** Custom key generator (default: IP-based) */
  keyGenerator?: (request: NextRequest) => string
  /** Skip rate limiting for certain conditions */
  skip?: (request: NextRequest) => boolean
}

export function withRateLimit(options: RateLimitOptions = {}): Middleware {
  const {
    limit = 100,
    window = 60,
    keyGenerator = (req) => `rl:${getClientIp(req)}`,
    skip,
  } = options

  return (handler) => async (request, context) => {
    // Check if should skip rate limiting
    if (skip && skip(request)) {
      return handler(request, context)
    }

    const key = keyGenerator(request)
    const result = checkRateLimit(key, limit, window)

    if (result.limited) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000)
      return rateLimitResponse(retryAfter)
    }

    // Add rate limit headers to response
    const response = await handler(request, context)

    response.headers.set('X-RateLimit-Limit', String(limit))
    response.headers.set('X-RateLimit-Remaining', String(result.remaining))
    response.headers.set(
      'X-RateLimit-Reset',
      String(Math.ceil(result.resetAt / 1000))
    )

    return response
  }
}

// ============================================================================
// Authentication
// ============================================================================

/**
 * Extract and validate authentication token from request
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  // Check Authorization header
  const authHeader = request.headers.get('authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return validateToken(token)
  }

  // Check cookie-based auth
  const sessionCookie = request.cookies.get('nhost-session')
  if (sessionCookie?.value) {
    return validateSession(sessionCookie.value)
  }

  return null
}

/**
 * Validate JWT token (placeholder - implement with actual Nhost/JWT validation)
 */
async function validateToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    // In development mode, check for test tokens
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_DEV_AUTH === 'true') {
      const devUser = getDevUser(token)
      if (devUser) return devUser
    }

    // TODO: Implement actual JWT validation with Nhost
    // const { data, error } = await nhost.auth.getUser()
    // if (error || !data) return null

    // For now, return null for production tokens
    return null
  } catch {
    return null
  }
}

/**
 * Validate session (placeholder - implement with actual session validation)
 */
async function validateSession(session: string): Promise<AuthenticatedUser | null> {
  try {
    // In development mode, check for test sessions
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_DEV_AUTH === 'true') {
      const devUser = getDevUser(session)
      if (devUser) return devUser
    }

    // TODO: Implement actual session validation
    return null
  } catch {
    return null
  }
}

/**
 * Get development user from token (for testing)
 */
function getDevUser(token: string): AuthenticatedUser | null {
  const devUsers: Record<string, AuthenticatedUser> = {
    'dev-owner': {
      id: 'dev-owner-id',
      email: 'owner@nself.org',
      displayName: 'Owner User',
      role: 'owner',
    },
    'dev-admin': {
      id: 'dev-admin-id',
      email: 'admin@nself.org',
      displayName: 'Admin User',
      role: 'admin',
    },
    'dev-moderator': {
      id: 'dev-moderator-id',
      email: 'moderator@nself.org',
      displayName: 'Moderator User',
      role: 'moderator',
    },
    'dev-member': {
      id: 'dev-member-id',
      email: 'member@nself.org',
      displayName: 'Member User',
      role: 'member',
    },
    'dev-guest': {
      id: 'dev-guest-id',
      email: 'guest@nself.org',
      displayName: 'Guest User',
      role: 'guest',
    },
  }

  return devUsers[token] || null
}

/**
 * Authentication middleware - requires valid authentication
 */
export function withAuth(
  handler: ApiHandler<AuthenticatedRequest>
): ApiHandler {
  return async (request, context) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return unauthorizedResponse('Authentication required')
    }

    // Extend request with user
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = user

    return handler(authenticatedRequest, context)
  }
}

/**
 * Optional authentication middleware - adds user if authenticated but doesn't require it
 */
export function withOptionalAuth<T extends NextRequest>(
  handler: ApiHandler<T & { user?: AuthenticatedUser }>
): ApiHandler<T> {
  return async (request, context) => {
    const user = await getAuthenticatedUser(request)

    // Extend request with user (if authenticated)
    const extendedRequest = request as T & { user?: AuthenticatedUser }
    if (user) {
      extendedRequest.user = user
    }

    return handler(extendedRequest, context)
  }
}

/**
 * Role-based authorization middleware
 */
export function withRole(
  allowedRoles: AuthenticatedUser['role'][]
): Middleware<AuthenticatedRequest, AuthenticatedRequest> {
  return (handler) => async (request, context) => {
    const { user } = request

    if (!allowedRoles.includes(user.role)) {
      return forbiddenResponse('Insufficient permissions')
    }

    return handler(request, context)
  }
}

/**
 * Admin-only middleware (owner or admin role)
 */
export function withAdmin(
  handler: ApiHandler<AuthenticatedRequest>
): ApiHandler<AuthenticatedRequest> {
  return withRole(['owner', 'admin'])(handler)
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Error handling middleware - catches errors and returns appropriate responses
 */
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('API Error:', error)

      // Handle known error types
      if (error instanceof ApiError) {
        return errorResponse(error.message, error.code, error.status, error.details)
      }

      // Handle validation errors
      if (error instanceof ValidationError) {
        return errorResponse('Validation failed', 'VALIDATION_ERROR', 422, {
          errors: error.errors,
        })
      }

      // Log unexpected errors
      console.error('Unexpected API error:', error)

      // Return generic error for unexpected errors
      return internalErrorResponse()
    }
  }
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(public errors: Record<string, string[]>) {
    super('Validation failed')
    this.name = 'ValidationError'
  }
}

// ============================================================================
// Logging
// ============================================================================

export interface LogEntry {
  timestamp: string
  method: string
  path: string
  status?: number
  duration?: number
  ip?: string
  userId?: string
  userAgent?: string
  error?: string
}

/**
 * Logging middleware - logs request and response info
 */
export function withLogging(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    const startTime = Date.now()
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      method: request.method,
      path: new URL(request.url).pathname,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    }

    try {
      const response = await handler(request, context)

      logEntry.status = response.status
      logEntry.duration = Date.now() - startTime

      // Log successful requests (can be disabled in production)
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[API] ${logEntry.method} ${logEntry.path} ${logEntry.status} ${logEntry.duration}ms`
        )
      }

      return response
    } catch (error) {
      logEntry.duration = Date.now() - startTime
      logEntry.error = error instanceof Error ? error.message : 'Unknown error'

      // Always log errors
      console.error(`[API ERROR] ${logEntry.method} ${logEntry.path}:`, error)

      throw error
    }
  }
}

// ============================================================================
// Middleware Composition
// ============================================================================

/**
 * Compose multiple middleware functions
 *
 * @example
 * ```typescript
 * const handler = compose(
 *   withErrorHandler,
 *   withLogging,
 *   withRateLimit({ limit: 10 }),
 *   withAuth
 * )(actualHandler)
 * ```
 */
export function compose<T extends NextRequest>(
  ...middlewares: Array<Middleware<any, any>>
): (handler: ApiHandler<any>) => ApiHandler<T> {
  return (handler) => {
    return middlewares.reduceRight((acc, middleware) => {
      return middleware(acc)
    }, handler) as ApiHandler<T>
  }
}

// ============================================================================
// Request Validation
// ============================================================================

/**
 * Validate request body against a schema
 */
export async function validateBody<T>(
  request: NextRequest,
  validate: (body: unknown) => T | null | { errors: Record<string, string[]> }
): Promise<T> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    throw new ApiError('Invalid JSON body', 'INVALID_JSON', 400)
  }

  const result = validate(body)

  if (result === null) {
    throw new ApiError('Invalid request body', 'INVALID_BODY', 400)
  }

  if (typeof result === 'object' && 'errors' in result) {
    throw new ValidationError(result.errors)
  }

  return result
}

/**
 * Get query parameters with defaults
 */
export function getQueryParams(
  request: NextRequest,
  defaults: Record<string, string | number | boolean | undefined> = {}
): Record<string, string | number | boolean | undefined> {
  const { searchParams } = new URL(request.url)
  const result: Record<string, string | number | boolean | undefined> = { ...defaults }

  for (const [key, defaultValue] of Object.entries(defaults)) {
    const value = searchParams.get(key)

    if (value !== null) {
      if (typeof defaultValue === 'number') {
        result[key] = parseInt(value, 10) || defaultValue
      } else if (typeof defaultValue === 'boolean') {
        result[key] = value === 'true' || value === '1'
      } else {
        result[key] = value
      }
    }
  }

  return result
}

// ============================================================================
// CORS Handling
// ============================================================================

/**
 * Add CORS headers to response
 */
export function withCors(
  options: {
    origin?: string | string[]
    methods?: string[]
    headers?: string[]
    credentials?: boolean
  } = {}
): Middleware {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: allowedHeaders = ['Content-Type', 'Authorization'],
    credentials = false,
  } = options

  return (handler) => async (request, context) => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': Array.isArray(origin) ? origin.join(', ') : origin,
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': allowedHeaders.join(', '),
          'Access-Control-Allow-Credentials': String(credentials),
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const response = await handler(request, context)

    response.headers.set(
      'Access-Control-Allow-Origin',
      Array.isArray(origin) ? origin.join(', ') : origin
    )
    response.headers.set('Access-Control-Allow-Credentials', String(credentials))

    return response
  }
}
