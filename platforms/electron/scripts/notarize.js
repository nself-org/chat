#!/usr/bin/env node

/**
 * macOS Notarization Script
 *
 * Notarizes macOS applications with Apple's notary service.
 * Required for macOS 10.15+ (Catalina and later).
 *
 * Environment Variables Required:
 * - APPLE_ID: Apple ID email (e.g., developer@example.com)
 * - APPLE_ID_PASSWORD: App-specific password (NOT your Apple ID password)
 * - APPLE_TEAM_ID: Apple Developer Team ID (10-character identifier)
 *
 * Alternative (API Key - recommended):
 * - APPLE_API_KEY: Path to .p8 API key file
 * - APPLE_API_KEY_ID: API Key ID
 * - APPLE_API_ISSUER: API Key Issuer ID
 *
 * Usage:
 *   Called automatically by electron-builder after signing
 */

const { notarize } = require('@electron/notarize')
const path = require('path')
const fs = require('fs')

/**
 * Log message with timestamp
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [${level}] ${message}`)
}

/**
 * Check if notarization is configured
 */
function isNotarizationConfigured() {
  // Check for API key authentication (preferred)
  if (process.env.APPLE_API_KEY && process.env.APPLE_API_KEY_ID && process.env.APPLE_API_ISSUER) {
    log('Using Apple API Key for notarization')
    return true
  }

  // Check for Apple ID authentication
  if (process.env.APPLE_ID && process.env.APPLE_ID_PASSWORD && process.env.APPLE_TEAM_ID) {
    log('Using Apple ID for notarization')
    return true
  }

  log('Notarization credentials not configured', 'WARN')
  return false
}

/**
 * Get notarization credentials
 */
function getNotarizationCredentials() {
  // API Key method (preferred)
  if (process.env.APPLE_API_KEY && process.env.APPLE_API_KEY_ID && process.env.APPLE_API_ISSUER) {
    return {
      appleApiKey: process.env.APPLE_API_KEY,
      appleApiKeyId: process.env.APPLE_API_KEY_ID,
      appleApiIssuer: process.env.APPLE_API_ISSUER,
    }
  }

  // Apple ID method
  if (process.env.APPLE_ID && process.env.APPLE_ID_PASSWORD) {
    return {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    }
  }

  return null
}

/**
 * Notarize the application
 */
async function notarizeApp(context) {
  const { electronPlatformName, appOutDir } = context

  // Only notarize for macOS
  if (electronPlatformName !== 'darwin') {
    log('Skipping notarization for non-macOS platform')
    return
  }

  // Check if this is a release build
  if (process.env.NODE_ENV !== 'production' && !process.env.FORCE_NOTARIZE) {
    log('Skipping notarization for non-production build', 'WARN')
    log('Set FORCE_NOTARIZE=true to notarize development builds', 'INFO')
    return
  }

  // Check if notarization is configured
  if (!isNotarizationConfigured()) {
    log('Notarization skipped: credentials not configured', 'WARN')
    log(
      'See: https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution',
      'INFO'
    )
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = path.join(appOutDir, `${appName}.app`)

  if (!fs.existsSync(appPath)) {
    log(`App not found at: ${appPath}`, 'ERROR')
    throw new Error(`Cannot find application at ${appPath}`)
  }

  log(`Starting notarization for: ${appPath}`)
  log('This may take several minutes...')

  const credentials = getNotarizationCredentials()

  try {
    const startTime = Date.now()

    await notarize({
      appPath,
      ...credentials,
    })

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    log(`Notarization successful! (took ${duration}s)`, 'SUCCESS')
  } catch (error) {
    log(`Notarization failed: ${error.message}`, 'ERROR')

    if (error.message.includes('The software asset has already been uploaded')) {
      log('This build was already uploaded. This is usually not an error.', 'WARN')
      return
    }

    if (error.message.includes('credentials')) {
      log('Check your Apple ID credentials and app-specific password', 'ERROR')
      log('Generate an app-specific password at: https://appleid.apple.com/account/manage', 'INFO')
    }

    throw error
  }

  // Verify notarization (staple the ticket)
  try {
    log('Stapling notarization ticket...')
    const { execSync } = require('child_process')
    execSync(`xcrun stapler staple "${appPath}"`, { stdio: 'inherit' })
    log('Stapling successful!', 'SUCCESS')
  } catch (error) {
    log(`Stapling failed: ${error.message}`, 'WARN')
    log('The app is notarized but the ticket was not stapled', 'WARN')
  }
}

/**
 * afterSign hook for electron-builder
 */
exports.default = async function (context) {
  try {
    await notarizeApp(context)
  } catch (error) {
    // Log error but don't fail the build in non-production
    if (process.env.NODE_ENV === 'production') {
      throw error
    } else {
      log(`Notarization error (non-fatal in dev): ${error.message}`, 'WARN')
    }
  }
}
