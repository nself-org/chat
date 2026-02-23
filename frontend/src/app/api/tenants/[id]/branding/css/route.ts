/**
 * Custom CSS API Route
 *
 * POST /api/tenants/[id]/branding/css - Apply custom CSS
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import {
  compose,
  withErrorHandler,
  withAuth,
  withLogging,
  AuthenticatedRequest,
  RouteContext,
} from '@/lib/api/middleware'

export const dynamic = 'force-dynamic'

// 50KB limit for custom CSS
const MAX_CSS_SIZE = 50 * 1024

// Block dangerous CSS patterns: javascript: URIs, expression(), and external @import URLs
const DANGEROUS_CSS_PATTERN = /javascript:|expression\s*\(|@import\s+url\s*\(\s*(['"]?)https?:/i

/**
 * POST - Apply custom CSS (admin/owner only)
 */
export const POST = compose(
  withErrorHandler,
  withLogging,
  withAuth
)(async (request: AuthenticatedRequest, context: RouteContext<{ id: string }>) => {
  const { id: tenantId } = await context.params
  const { user } = request

  // Only admins and owners can update branding
  if (!['admin', 'owner'].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions. Admin role required.' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { css } = body

  if (typeof css !== 'string') {
    return NextResponse.json(
      { success: false, error: 'css field must be a string' },
      { status: 400 }
    )
  }

  // Enforce size limit
  if (Buffer.byteLength(css, 'utf8') > MAX_CSS_SIZE) {
    return NextResponse.json(
      { success: false, error: 'CSS content exceeds 50KB limit' },
      { status: 400 }
    )
  }

  // Block dangerous CSS patterns
  if (DANGEROUS_CSS_PATTERN.test(css)) {
    return NextResponse.json(
      { success: false, error: 'Invalid CSS content' },
      { status: 400 }
    )
  }

  // TODO: Update database with validated CSS

  logger.info('Custom CSS applied:', {
    tenantId,
    userId: user.id,
    cssLength: css.length,
  })

  const branding = {
    tenantId,
    customCSS: css,
    audit: {
      createdAt: new Date(),
      createdBy: user.id,
      updatedAt: new Date(),
      updatedBy: user.id,
      version: 2,
      changelog: [
        {
          timestamp: new Date(),
          userId: user.id,
          action: 'update_css',
          changes: { cssLength: css.length },
        },
      ],
    },
  }

  return NextResponse.json(branding)
})
