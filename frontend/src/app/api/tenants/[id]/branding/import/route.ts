/**
 * Branding Import API Route
 *
 * POST /api/tenants/[id]/branding/import - Import branding from JSON
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import {
  compose,
  withErrorHandler,
  withAuth,
  withLogging,
  AuthenticatedRequest,
  RouteContext,
} from '@/lib/api/middleware'

export const dynamic = 'force-dynamic'

// 1MB limit for branding import files
const MAX_IMPORT_SIZE = 1024 * 1024

// Validation schema for imported branding JSON
const BrandingImportSchema = z.object({
  version: z.number().int().positive().optional(),
  primaryColor: z.string().max(50).optional(),
  secondaryColor: z.string().max(50).optional(),
  accentColor: z.string().max(50).optional(),
  backgroundColor: z.string().max(50).optional(),
  textColor: z.string().max(50).optional(),
  logoUrl: z.string().url().max(2048).optional(),
  faviconUrl: z.string().url().max(2048).optional(),
  appName: z.string().max(100).optional(),
  tagline: z.string().max(255).optional(),
  customCSS: z.string().max(50 * 1024).optional(), // 50KB max CSS
  fontFamily: z.string().max(100).optional(),
})

type BrandingImport = z.infer<typeof BrandingImportSchema>

/**
 * POST - Import branding configuration (admin/owner only)
 */
export const POST = compose(
  withErrorHandler,
  withLogging,
  withAuth
)(async (request: AuthenticatedRequest, context: RouteContext<{ id: string }>) => {
  const { id: tenantId } = await context.params
  const { user } = request

  // Only admins and owners can import branding
  if (!['admin', 'owner'].includes(user.role)) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions. Admin role required.' },
      { status: 403 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
  }

  // Enforce file size limit
  if (file.size > MAX_IMPORT_SIZE) {
    return NextResponse.json(
      { success: false, error: 'Import file exceeds 1MB limit' },
      { status: 400 }
    )
  }

  // Read and parse JSON
  const text = await file.text()
  let rawBranding: unknown
  try {
    rawBranding = JSON.parse(text)
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON file' },
      { status: 400 }
    )
  }

  // Validate branding structure with strict schema
  const validation = BrandingImportSchema.safeParse(rawBranding)
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid branding configuration',
        details: validation.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const branding: BrandingImport = validation.data

  // TODO: Update database with validated branding
  // TODO: Handle logo/favicon URLs (re-download and host locally if external)

  logger.info('Branding configuration imported:', {
    tenantId,
    userId: user.id,
    version: branding.version,
  })

  return NextResponse.json({
    success: true,
    tenantId,
    ...branding,
    audit: {
      createdAt: new Date(),
      createdBy: user.id,
      updatedAt: new Date(),
      updatedBy: user.id,
      version: 1,
      changelog: [
        {
          timestamp: new Date(),
          userId: user.id,
          action: 'import',
          changes: { source: 'file_import' },
        },
      ],
    },
  })
})
