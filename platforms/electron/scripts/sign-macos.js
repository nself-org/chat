#!/usr/bin/env node

/**
 * macOS Code Signing Script
 *
 * Signs macOS applications with Apple Developer certificate.
 * Includes entitlements and hardened runtime.
 *
 * Environment Variables Required:
 * - CSC_LINK: Path to .p12 certificate file (or base64 encoded)
 * - CSC_KEY_PASSWORD: Password for the certificate
 * - CSC_NAME: Certificate name (e.g., "Developer ID Application: Your Name (TEAM_ID)")
 *
 * Optional:
 * - CSC_IDENTITY_AUTO_DISCOVERY: Set to false to use CSC_NAME explicitly
 *
 * Usage:
 *   Called automatically by electron-builder during build
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

/**
 * Log message with timestamp
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [${level}] ${message}`)
}

/**
 * Check if running on macOS
 */
function isMacOS() {
  return os.platform() === 'darwin'
}

/**
 * List available signing identities
 */
function listSigningIdentities() {
  if (!isMacOS()) {
    log('Not running on macOS, cannot list signing identities', 'WARN')
    return []
  }

  try {
    const output = execSync('security find-identity -v -p codesigning', {
      encoding: 'utf8',
    })

    log('Available signing identities:')
    console.log(output)

    // Parse identities
    const identities = []
    const lines = output.split('\n')

    for (const line of lines) {
      const match = line.match(/"(.+?)"/)
      if (match) {
        identities.push(match[1])
      }
    }

    return identities
  } catch (error) {
    log(`Failed to list signing identities: ${error.message}`, 'ERROR')
    return []
  }
}

/**
 * Find signing identity
 */
function findSigningIdentity() {
  const identityName = process.env.CSC_NAME

  if (!identityName) {
    log('CSC_NAME not set', 'WARN')

    // Try to find any Developer ID Application certificate
    const identities = listSigningIdentities()
    const devIdCert = identities.find((id) => id.includes('Developer ID Application'))

    if (devIdCert) {
      log(`Found certificate: ${devIdCert}`)
      return devIdCert
    }

    log('No Developer ID Application certificate found', 'ERROR')
    return null
  }

  log(`Using signing identity: ${identityName}`)
  return identityName
}

/**
 * Import certificate to keychain
 */
function importCertificate() {
  const certLink = process.env.CSC_LINK
  const certPassword = process.env.CSC_KEY_PASSWORD

  if (!certLink) {
    log('CSC_LINK not set, assuming certificate is already in keychain', 'WARN')
    return true
  }

  let certPath = certLink

  // Handle base64 encoded certificate
  if (!fs.existsSync(certLink)) {
    if (certLink.length > 1000 && !certLink.includes('/')) {
      log('Decoding base64 certificate')
      certPath = path.join(os.tmpdir(), 'temp-signing-cert.p12')
      const certBuffer = Buffer.from(certLink, 'base64')
      fs.writeFileSync(certPath, certBuffer)
      log(`Temporary certificate written to: ${certPath}`)
    } else {
      log(`Certificate file not found: ${certLink}`, 'ERROR')
      return false
    }
  }

  try {
    // Create a temporary keychain for CI environments
    if (process.env.CI) {
      log('CI environment detected, creating temporary keychain')
      const keychainName = 'build.keychain'
      const keychainPassword = Math.random().toString(36)

      try {
        // Delete existing keychain if it exists
        execSync(`security delete-keychain ${keychainName}`, { stdio: 'ignore' })
      } catch (error) {
        // Ignore errors
      }

      // Create new keychain
      execSync(`security create-keychain -p "${keychainPassword}" ${keychainName}`, {
        stdio: 'inherit',
      })

      // Set as default keychain
      execSync(`security default-keychain -s ${keychainName}`, { stdio: 'inherit' })

      // Unlock keychain
      execSync(`security unlock-keychain -p "${keychainPassword}" ${keychainName}`, {
        stdio: 'inherit',
      })

      // Set keychain timeout to 1 hour
      execSync(`security set-keychain-settings -t 3600 -l ${keychainName}`, {
        stdio: 'inherit',
      })

      // Import certificate
      execSync(
        `security import "${certPath}" -k ${keychainName} -P "${certPassword || ''}" -T /usr/bin/codesign -T /usr/bin/productbuild`,
        { stdio: 'inherit' }
      )

      // Allow codesign to access keychain without prompting
      execSync(
        `security set-key-partition-list -S apple-tool:,apple: -s -k "${keychainPassword}" ${keychainName}`,
        {
          stdio: 'inherit',
        }
      )

      log('Certificate imported to temporary keychain', 'SUCCESS')
    } else {
      // Import to default keychain
      execSync(
        `security import "${certPath}" -P "${certPassword || ''}" -T /usr/bin/codesign -T /usr/bin/productbuild`,
        { stdio: 'inherit' }
      )
      log('Certificate imported to default keychain', 'SUCCESS')
    }

    // Clean up temp certificate
    if (certPath.includes(os.tmpdir())) {
      fs.unlinkSync(certPath)
      log('Cleaned up temporary certificate')
    }

    return true
  } catch (error) {
    log(`Failed to import certificate: ${error.message}`, 'ERROR')

    // Clean up temp certificate on error
    if (certPath.includes(os.tmpdir())) {
      try {
        fs.unlinkSync(certPath)
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    return false
  }
}

/**
 * Sign application bundle
 */
function signApp(appPath, identity, entitlements) {
  if (!fs.existsSync(appPath)) {
    log(`App not found: ${appPath}`, 'ERROR')
    return false
  }

  log(`Signing application: ${appPath}`)

  try {
    const args = [
      '--sign',
      `"${identity}"`,
      '--force',
      '--verbose',
      '--options',
      'runtime',
      '--timestamp',
    ]

    if (entitlements && fs.existsSync(entitlements)) {
      args.push('--entitlements', `"${entitlements}"`)
      log(`Using entitlements: ${entitlements}`)
    }

    args.push('--deep')
    args.push(`"${appPath}"`)

    const command = `codesign ${args.join(' ')}`

    log(`Running: ${command}`)

    execSync(command, {
      stdio: 'inherit',
      maxBuffer: 10 * 1024 * 1024,
    })

    log('Signing successful', 'SUCCESS')
    return true
  } catch (error) {
    log(`Signing failed: ${error.message}`, 'ERROR')
    return false
  }
}

/**
 * Verify signature
 */
function verifySignature(appPath) {
  if (!isMacOS()) {
    log('Not running on macOS, skipping signature verification', 'WARN')
    return true
  }

  try {
    log(`Verifying signature: ${appPath}`)

    // Verify signature
    execSync(`codesign --verify --deep --strict --verbose=2 "${appPath}"`, {
      stdio: 'inherit',
    })

    // Display signature info
    const info = execSync(`codesign --display --verbose=4 "${appPath}"`, {
      encoding: 'utf8',
      stdio: 'pipe',
    })

    log('Signature verification successful', 'SUCCESS')
    log('Signature info:')
    console.log(info)

    return true
  } catch (error) {
    log(`Signature verification failed: ${error.message}`, 'ERROR')
    return false
  }
}

/**
 * Main signing function
 */
function signMacApp(appPath, entitlementsPath) {
  if (!isMacOS() && !process.env.FORCE_SIGN) {
    log('Not running on macOS, signing skipped', 'WARN')
    return true
  }

  log('Starting macOS code signing process')

  // Import certificate if needed
  if (process.env.CSC_LINK) {
    if (!importCertificate()) {
      log('Failed to import certificate', 'ERROR')
      return false
    }
  }

  // Find signing identity
  const identity = findSigningIdentity()
  if (!identity) {
    log('No signing identity found', 'ERROR')
    log('Set CSC_NAME environment variable or install a Developer ID certificate', 'ERROR')
    return false
  }

  // Sign the app
  const signed = signApp(appPath, identity, entitlementsPath)

  if (signed) {
    verifySignature(appPath)
  }

  return signed
}

// CLI Entry Point
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: node sign-macos.js <path-to-app> [entitlements-path]')
    process.exit(1)
  }

  const appPath = args[0]
  const entitlementsPath = args[1]

  const success = signMacApp(appPath, entitlementsPath)

  process.exit(success ? 0 : 1)
}

module.exports = { signMacApp, importCertificate, findSigningIdentity }
