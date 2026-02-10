#!/usr/bin/env tsx
/**
 * Generate OAuth Route Files
 *
 * Generates initiate and callback route files for all OAuth providers.
 * Run with: pnpm tsx scripts/generate-oauth-routes.ts
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { getAllOAuthProviderNames } from '../src/config/oauth-providers'

/**
 * Generate initiate route content
 */
function generateInitiateRoute(provider: string): string {
  const providerUpper = provider.charAt(0).toUpperCase() + provider.slice(1)

  return `/**
 * ${providerUpper} OAuth Initiation Route
 *
 * Redirects user to ${providerUpper} OAuth authorization page.
 * GET /api/auth/${provider} - Start ${providerUpper} OAuth flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleOAuthInitiate } from '@/lib/oauth/oauth-handler'
import { withErrorHandler, compose } from '@/lib/api/middleware'

async function initiateOAuth(request: NextRequest): Promise<NextResponse> {
  return handleOAuthInitiate(request, '${provider}')
}

export const GET = compose(withErrorHandler)(initiateOAuth)
`
}

/**
 * Generate callback route content
 */
function generateCallbackRoute(provider: string): string {
  const providerUpper = provider.charAt(0).toUpperCase() + provider.slice(1)

  return `/**
 * ${providerUpper} OAuth Callback Route
 *
 * Handles ${providerUpper} OAuth callback and user authentication.
 * GET /api/auth/${provider}/callback - Process ${providerUpper} OAuth response
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleOAuthCallback } from '@/lib/oauth/oauth-handler'
import { withErrorHandler, compose } from '@/lib/api/middleware'

async function processCallback(request: NextRequest): Promise<NextResponse> {
  return handleOAuthCallback(request, '${provider}')
}

export const GET = compose(withErrorHandler)(processCallback)
`
}

/**
 * Ensure directory exists
 */
function ensureDir(filePath: string): void {
  const dir = dirname(filePath)
  mkdirSync(dir, { recursive: true })
}

/**
 * Main generation function
 */
function generateRoutes(): void {
  const srcDir = join(process.cwd(), 'src')
  const providers = getAllOAuthProviderNames()

  console.log('🔨 Generating OAuth route files...\n')

  let created = 0
  let skipped = 0

  for (const provider of providers) {
    // Skip idme as it already has a callback route
    const skipInitiate = provider === 'idme' ? false : true
    const skipCallback = provider === 'idme'

    // Generate initiate route
    if (!skipCallback) {
      const initiateRoutePath = join(srcDir, 'app', 'api', 'auth', provider, 'route.ts')
      ensureDir(initiateRoutePath)

      const initiateContent = generateInitiateRoute(provider)
      writeFileSync(initiateRoutePath, initiateContent, 'utf-8')

      console.log(`✅ Created: ${provider}/route.ts`)
      created++
    }

    // Generate callback route
    if (!skipCallback) {
      const callbackRoutePath = join(srcDir, 'app', 'api', 'auth', provider, 'callback', 'route.ts')
      ensureDir(callbackRoutePath)

      const callbackContent = generateCallbackRoute(provider)
      writeFileSync(callbackRoutePath, callbackContent, 'utf-8')

      console.log(`✅ Created: ${provider}/callback/route.ts`)
      created++
    } else {
      console.log(`⏭️  Skipped: ${provider}/callback/route.ts (already exists)`)
      skipped++
    }
  }

  console.log(`\n✨ Done! Created ${created} files, skipped ${skipped} files.\n`)
}

// Run generation
generateRoutes()
