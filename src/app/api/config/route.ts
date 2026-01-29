/**
 * App Configuration API Route
 *
 * Manages application configuration for white-label customization.
 * GET is public (cached), POST requires admin authentication.
 *
 * @endpoint GET /api/config - Get current app configuration
 * @endpoint POST /api/config - Update app configuration (admin only)
 * @endpoint PATCH /api/config - Partial update (admin only)
 *
 * @example
 * ```typescript
 * // Get configuration
 * const response = await fetch('/api/config')
 * const { data } = await response.json()
 * // { config: AppConfig }
 *
 * // Update configuration (admin only)
 * const response = await fetch('/api/config', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': 'Bearer <token>'
 *   },
 *   body: JSON.stringify({ branding: { appName: 'My Chat' } })
 * })
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import { defaultAppConfig, type AppConfig } from '@/config/app-config'
import {
  successResponse,
  badRequestResponse,
  forbiddenResponse,
  internalErrorResponse,
  cachedResponse,
} from '@/lib/api/response'
import {
  withErrorHandler,
  withAuth,
  withAdmin,
  compose,
  getAuthenticatedUser,
  type AuthenticatedRequest,
} from '@/lib/api/middleware'

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Cache TTL for public config (5 minutes)
  CACHE_TTL: 5 * 60,

  // Config version for cache busting
  CONFIG_VERSION: '1.0.0',
}

// ============================================================================
// In-Memory Storage (Mock - Use Database in Production)
// ============================================================================

// Store the current configuration in memory
// In production, this would be stored in the database
let currentConfig: AppConfig = { ...defaultAppConfig }

// Config update history for audit
const configHistory: Array<{
  timestamp: string
  updatedBy: string
  changes: Partial<AppConfig>
}> = []

// ============================================================================
// Helpers
// ============================================================================

/**
 * Deep merge two objects
 */
function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target }

  for (const key of Object.keys(source)) {
    const sourceValue = source[key as keyof typeof source]
    const targetValue = target[key as keyof typeof target]

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key as keyof T] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[keyof T]
    } else if (sourceValue !== undefined) {
      result[key as keyof T] = sourceValue as T[keyof T]
    }
  }

  return result
}

/**
 * Validate configuration update
 */
function validateConfigUpdate(
  updates: Partial<AppConfig>
): { valid: true } | { valid: false; errors: string[] } {
  const errors: string[] = []

  // Validate branding
  if (updates.branding) {
    if (updates.branding.appName !== undefined) {
      if (typeof updates.branding.appName !== 'string') {
        errors.push('branding.appName must be a string')
      } else if (updates.branding.appName.length < 1 || updates.branding.appName.length > 50) {
        errors.push('branding.appName must be 1-50 characters')
      }
    }

    if (updates.branding.logoScale !== undefined) {
      if (typeof updates.branding.logoScale !== 'number') {
        errors.push('branding.logoScale must be a number')
      } else if (updates.branding.logoScale < 0.5 || updates.branding.logoScale > 2.0) {
        errors.push('branding.logoScale must be between 0.5 and 2.0')
      }
    }
  }

  // Validate theme colors
  if (updates.theme) {
    const colorFields = [
      'primaryColor',
      'secondaryColor',
      'accentColor',
      'backgroundColor',
      'surfaceColor',
      'textColor',
      'mutedColor',
      'borderColor',
      'buttonPrimaryBg',
      'buttonPrimaryText',
      'buttonSecondaryBg',
      'buttonSecondaryText',
      'successColor',
      'warningColor',
      'errorColor',
      'infoColor',
    ] as const

    for (const field of colorFields) {
      const value = updates.theme[field]
      if (value !== undefined) {
        if (typeof value !== 'string') {
          errors.push(`theme.${field} must be a string`)
        } else if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
          errors.push(`theme.${field} must be a valid hex color (e.g., #FF0000)`)
        }
      }
    }

    if (updates.theme.colorScheme !== undefined) {
      if (!['light', 'dark', 'system'].includes(updates.theme.colorScheme)) {
        errors.push('theme.colorScheme must be "light", "dark", or "system"')
      }
    }
  }

  // Validate owner
  if (updates.owner) {
    if (updates.owner.email !== undefined) {
      if (typeof updates.owner.email !== 'string') {
        errors.push('owner.email must be a string')
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.owner.email)) {
        errors.push('owner.email must be a valid email address')
      }
    }
  }

  // Validate auth permissions
  if (updates.authPermissions) {
    if (updates.authPermissions.mode !== undefined) {
      const validModes = ['allow-all', 'verified-only', 'idme-roles', 'domain-restricted', 'admin-only']
      if (!validModes.includes(updates.authPermissions.mode)) {
        errors.push(`authPermissions.mode must be one of: ${validModes.join(', ')}`)
      }
    }

    if (updates.authPermissions.allowedDomains !== undefined) {
      if (!Array.isArray(updates.authPermissions.allowedDomains)) {
        errors.push('authPermissions.allowedDomains must be an array')
      }
    }
  }

  // Validate landing theme
  if (updates.landingTheme !== undefined) {
    const validThemes = ['login-only', 'simple-landing', 'full-homepage', 'corporate', 'community']
    if (!validThemes.includes(updates.landingTheme)) {
      errors.push(`landingTheme must be one of: ${validThemes.join(', ')}`)
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true }
}

/**
 * Get configuration from database (mock implementation)
 */
async function getConfigFromDatabase(): Promise<AppConfig> {
  // In production, this would query the database via GraphQL:
  // const { data } = await graphqlClient.query({
  //   query: GET_APP_CONFIG,
  // })
  // return data?.app_configuration?.[0]?.config || defaultAppConfig

  return currentConfig
}

/**
 * Save configuration to database (mock implementation)
 */
async function saveConfigToDatabase(
  config: AppConfig,
  updatedBy: string
): Promise<void> {
  // In production, this would save to the database via GraphQL:
  // await graphqlClient.mutate({
  //   mutation: UPSERT_APP_CONFIG,
  //   variables: { config, updatedBy }
  // })

  // Record history
  configHistory.push({
    timestamp: new Date().toISOString(),
    updatedBy,
    changes: config,
  })

  // Keep only last 100 history entries
  if (configHistory.length > 100) {
    configHistory.shift()
  }

  // Update in-memory config
  currentConfig = config
}

// ============================================================================
// GET Handler - Public
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const config = await getConfigFromDatabase()

    // Check if detailed info is requested (requires auth)
    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('history') === 'true'

    if (includeHistory) {
      // Verify admin access for history
      const user = await getAuthenticatedUser(request)
      if (!user || !['owner', 'admin'].includes(user.role)) {
        return forbiddenResponse('Admin access required for history')
      }

      return successResponse({
        config,
        history: configHistory.slice(-10), // Last 10 changes
        version: CONFIG.CONFIG_VERSION,
      })
    }

    // Return cached public config
    return cachedResponse(
      {
        config,
        version: CONFIG.CONFIG_VERSION,
      },
      {
        maxAge: CONFIG.CACHE_TTL,
        sMaxAge: CONFIG.CACHE_TTL,
        staleWhileRevalidate: CONFIG.CACHE_TTL * 2,
      }
    )
  } catch (error) {
    console.error('Error in GET /api/config:', error)
    return internalErrorResponse('Failed to get configuration')
  }
}

// ============================================================================
// POST Handler - Full Update (Admin Only)
// ============================================================================

async function handlePost(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { user } = request

    // Validate the update
    const validation = validateConfigUpdate(body)
    if (!validation.valid) {
      return badRequestResponse(
        `Validation failed: ${(validation as { valid: false; errors: string[] }).errors.join(', ')}`,
        'VALIDATION_ERROR'
      )
    }

    // Get current config and merge with updates
    const currentConfig = await getConfigFromDatabase()
    const updatedConfig = deepMerge(currentConfig, body as Partial<AppConfig>)

    // Update setup state if completing steps
    if (body.setup?.currentStep !== undefined) {
      updatedConfig.setup.visitedSteps = [
        ...new Set([...updatedConfig.setup.visitedSteps, body.setup.currentStep]),
      ]
    }

    // Save to database
    await saveConfigToDatabase(updatedConfig, user.email)

    return successResponse({
      config: updatedConfig,
      message: 'Configuration updated successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/config:', error)
    return internalErrorResponse('Failed to update configuration')
  }
}

// Apply admin middleware
export const POST = compose(
  withErrorHandler,
  withAuth,
  withAdmin
)(handlePost)

// ============================================================================
// PATCH Handler - Partial Update (Admin Only)
// ============================================================================

async function handlePatch(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { user } = request

    // PATCH is essentially the same as POST for our merge logic
    const validation = validateConfigUpdate(body)
    if (!validation.valid) {
      return badRequestResponse(
        `Validation failed: ${(validation as { valid: false; errors: string[] }).errors.join(', ')}`,
        'VALIDATION_ERROR'
      )
    }

    const currentConfig = await getConfigFromDatabase()
    const updatedConfig = deepMerge(currentConfig, body as Partial<AppConfig>)

    await saveConfigToDatabase(updatedConfig, user.email)

    return successResponse({
      config: updatedConfig,
      message: 'Configuration updated successfully',
    })
  } catch (error) {
    console.error('Error in PATCH /api/config:', error)
    return internalErrorResponse('Failed to update configuration')
  }
}

export const PATCH = compose(
  withErrorHandler,
  withAuth,
  withAdmin
)(handlePatch)

// ============================================================================
// Route Configuration
// ============================================================================

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
