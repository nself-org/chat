/**
 * OAuth Provider Testing API
 * GET /api/auth/providers/test - Test OAuth provider configurations
 *
 * This endpoint checks the configuration and connectivity of all OAuth providers
 * to help diagnose authentication issues.
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ProviderTestResult {
  provider: string
  configured: boolean
  status: 'working' | 'error' | 'not_configured'
  message: string
  details?: Record<string, any>
  error?: string
}

/**
 * GET /api/auth/providers/test
 * Test all OAuth provider configurations
 */
export async function GET(request: NextRequest) {
  try {
    logger.info('GET /api/auth/providers/test - Testing OAuth providers')

    // TODO: Get user from session (admin only)
    const userId = request.headers.get('x-user-id') || 'dev-user-id'
    const userRole = request.headers.get('x-user-role') || 'guest'

    // Only admins and owners can test providers
    if (!['owner', 'admin'].includes(userRole)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions. Only admins and owners can test providers.',
        },
        { status: 403 }
      )
    }

    const results: ProviderTestResult[] = []

    // Test Google OAuth
    results.push(await testGoogleProvider())

    // Test GitHub OAuth
    results.push(await testGitHubProvider())

    // Test ID.me OAuth
    results.push(await testIdMeProvider())

    // Test Facebook OAuth
    results.push(await testFacebookProvider())

    // Test Twitter/X OAuth
    results.push(await testTwitterProvider())

    // Test Apple OAuth
    results.push(await testAppleProvider())

    // Calculate summary
    const summary = {
      total: results.length,
      configured: results.filter((r) => r.configured).length,
      working: results.filter((r) => r.status === 'working').length,
      errors: results.filter((r) => r.status === 'error').length,
      notConfigured: results.filter((r) => r.status === 'not_configured').length,
    }

    logger.info('GET /api/auth/providers/test - Success', {
      summary,
      testedBy: userId,
    })

    return NextResponse.json({
      success: true,
      summary,
      providers: results,
      testedAt: new Date().toISOString(),
      testedBy: userId,
    })
  } catch (error) {
    logger.error('Error testing OAuth providers', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test OAuth providers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// PROVIDER TEST FUNCTIONS
// ============================================================================

/**
 * Test Google OAuth configuration
 */
async function testGoogleProvider(): Promise<ProviderTestResult> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return {
      provider: 'google',
      configured: false,
      status: 'not_configured',
      message: 'Google OAuth is not configured',
      details: {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
      },
    }
  }

  try {
    // Test by fetching provider metadata (doesn't require auth)
    const response = await fetch('https://accounts.google.com/.well-known/openid-configuration', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return {
        provider: 'google',
        configured: true,
        status: 'error',
        message: 'Failed to connect to Google OAuth service',
        error: `HTTP ${response.status}`,
      }
    }

    const metadata = await response.json()

    return {
      provider: 'google',
      configured: true,
      status: 'working',
      message: 'Google OAuth is configured and reachable',
      details: {
        authorizationEndpoint: metadata.authorization_endpoint,
        tokenEndpoint: metadata.token_endpoint,
        issuer: metadata.issuer,
      },
    }
  } catch (error) {
    return {
      provider: 'google',
      configured: true,
      status: 'error',
      message: 'Error testing Google OAuth',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Test GitHub OAuth configuration
 */
async function testGitHubProvider(): Promise<ProviderTestResult> {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return {
      provider: 'github',
      configured: false,
      status: 'not_configured',
      message: 'GitHub OAuth is not configured',
      details: {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
      },
    }
  }

  try {
    // Test by checking GitHub API availability
    const response = await fetch('https://api.github.com/meta', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return {
        provider: 'github',
        configured: true,
        status: 'error',
        message: 'Failed to connect to GitHub API',
        error: `HTTP ${response.status}`,
      }
    }

    return {
      provider: 'github',
      configured: true,
      status: 'working',
      message: 'GitHub OAuth is configured and reachable',
      details: {
        authorizationEndpoint: 'https://github.com/login/oauth/authorize',
        tokenEndpoint: 'https://github.com/login/oauth/access_token',
      },
    }
  } catch (error) {
    return {
      provider: 'github',
      configured: true,
      status: 'error',
      message: 'Error testing GitHub OAuth',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Test ID.me OAuth configuration
 */
async function testIdMeProvider(): Promise<ProviderTestResult> {
  const clientId = process.env.IDME_CLIENT_ID
  const clientSecret = process.env.IDME_CLIENT_SECRET
  const environment = process.env.IDME_ENVIRONMENT || 'production'

  if (!clientId || !clientSecret) {
    return {
      provider: 'idme',
      configured: false,
      status: 'not_configured',
      message: 'ID.me OAuth is not configured',
      details: {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        environment,
      },
    }
  }

  const baseUrl = environment === 'sandbox' ? 'https://api.id.me' : 'https://api.id.me'

  try {
    // Test ID.me availability
    const response = await fetch(`${baseUrl}/.well-known/openid-configuration`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return {
        provider: 'idme',
        configured: true,
        status: 'error',
        message: 'Failed to connect to ID.me OAuth service',
        error: `HTTP ${response.status}`,
      }
    }

    const metadata = await response.json()

    return {
      provider: 'idme',
      configured: true,
      status: 'working',
      message: 'ID.me OAuth is configured and reachable',
      details: {
        environment,
        authorizationEndpoint: metadata.authorization_endpoint,
        tokenEndpoint: metadata.token_endpoint,
      },
    }
  } catch (error) {
    return {
      provider: 'idme',
      configured: true,
      status: 'error',
      message: 'Error testing ID.me OAuth',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Test Facebook OAuth configuration
 */
async function testFacebookProvider(): Promise<ProviderTestResult> {
  const clientId = process.env.FACEBOOK_APP_ID
  const clientSecret = process.env.FACEBOOK_APP_SECRET

  if (!clientId || !clientSecret) {
    return {
      provider: 'facebook',
      configured: false,
      status: 'not_configured',
      message: 'Facebook OAuth is not configured',
      details: {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
      },
    }
  }

  try {
    // Test Facebook Graph API availability
    const response = await fetch(
      `https://graph.facebook.com/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      {
        method: 'GET',
      }
    )

    if (!response.ok) {
      return {
        provider: 'facebook',
        configured: true,
        status: 'error',
        message: 'Failed to validate Facebook OAuth credentials',
        error: `HTTP ${response.status}`,
      }
    }

    return {
      provider: 'facebook',
      configured: true,
      status: 'working',
      message: 'Facebook OAuth is configured and credentials are valid',
      details: {
        authorizationEndpoint: 'https://www.facebook.com/v12.0/dialog/oauth',
        tokenEndpoint: 'https://graph.facebook.com/v12.0/oauth/access_token',
      },
    }
  } catch (error) {
    return {
      provider: 'facebook',
      configured: true,
      status: 'error',
      message: 'Error testing Facebook OAuth',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Test Twitter/X OAuth configuration
 */
async function testTwitterProvider(): Promise<ProviderTestResult> {
  const clientId = process.env.TWITTER_CLIENT_ID
  const clientSecret = process.env.TWITTER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return {
      provider: 'twitter',
      configured: false,
      status: 'not_configured',
      message: 'Twitter/X OAuth is not configured',
      details: {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
      },
    }
  }

  // Twitter OAuth 2.0 doesn't have a simple test endpoint without auth
  // We can only verify configuration
  return {
    provider: 'twitter',
    configured: true,
    status: 'working',
    message: 'Twitter/X OAuth credentials are configured (connectivity not verified)',
    details: {
      authorizationEndpoint: 'https://twitter.com/i/oauth2/authorize',
      tokenEndpoint: 'https://api.twitter.com/2/oauth2/token',
      note: 'Twitter API requires authenticated requests for testing',
    },
  }
}

/**
 * Test Apple OAuth configuration
 */
async function testAppleProvider(): Promise<ProviderTestResult> {
  const clientId = process.env.APPLE_CLIENT_ID
  const teamId = process.env.APPLE_TEAM_ID
  const keyId = process.env.APPLE_KEY_ID
  const privateKey = process.env.APPLE_PRIVATE_KEY

  if (!clientId || !teamId || !keyId || !privateKey) {
    return {
      provider: 'apple',
      configured: false,
      status: 'not_configured',
      message: 'Apple Sign In is not configured',
      details: {
        hasClientId: !!clientId,
        hasTeamId: !!teamId,
        hasKeyId: !!keyId,
        hasPrivateKey: !!privateKey,
      },
    }
  }

  try {
    // Test by fetching Apple's public keys
    const response = await fetch('https://appleid.apple.com/auth/keys', {
      method: 'GET',
    })

    if (!response.ok) {
      return {
        provider: 'apple',
        configured: true,
        status: 'error',
        message: 'Failed to connect to Apple Sign In service',
        error: `HTTP ${response.status}`,
      }
    }

    return {
      provider: 'apple',
      configured: true,
      status: 'working',
      message: 'Apple Sign In is configured and reachable',
      details: {
        authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
        tokenEndpoint: 'https://appleid.apple.com/auth/token',
      },
    }
  } catch (error) {
    return {
      provider: 'apple',
      configured: true,
      status: 'error',
      message: 'Error testing Apple Sign In',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
