#!/usr/bin/env node

/**
 * Windows Code Signing Script
 *
 * Signs Windows executables using SignTool or Azure Code Signing
 * Supports both local certificate and cloud-based signing
 *
 * Environment Variables Required:
 * - WIN_CSC_LINK: Path to .pfx certificate file (or base64 encoded cert)
 * - WIN_CSC_KEY_PASSWORD: Password for the certificate
 *
 * Optional (for Azure Code Signing):
 * - AZURE_KEY_VAULT_URI: Azure Key Vault URI
 * - AZURE_CERT_NAME: Certificate name in Key Vault
 * - AZURE_CLIENT_ID: Service principal client ID
 * - AZURE_CLIENT_SECRET: Service principal secret
 * - AZURE_TENANT_ID: Azure AD tenant ID
 *
 * Usage:
 *   node sign-windows.js <path-to-executable>
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

// Configuration
const TIMESTAMP_SERVERS = [
  'http://timestamp.digicert.com',
  'http://timestamp.comodoca.com',
  'http://timestamp.sectigo.com',
  'http://timestamp.globalsign.com',
]

const SIGNING_ALGORITHM = 'sha256'
const MAX_RETRIES = 3

/**
 * Log message with timestamp
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [${level}] ${message}`)
}

/**
 * Check if running on Windows
 */
function isWindows() {
  return os.platform() === 'win32'
}

/**
 * Find SignTool.exe in Windows SDK
 */
function findSignTool() {
  if (!isWindows()) {
    log('Not running on Windows, skipping SignTool search', 'WARN')
    return null
  }

  const possiblePaths = [
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.22621.0\\x64\\signtool.exe',
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.22000.0\\x64\\signtool.exe',
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.19041.0\\x64\\signtool.exe',
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.18362.0\\x64\\signtool.exe',
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x64\\signtool.exe',
  ]

  for (const signToolPath of possiblePaths) {
    if (fs.existsSync(signToolPath)) {
      log(`Found SignTool at: ${signToolPath}`)
      return signToolPath
    }
  }

  // Try to find via registry or environment
  try {
    const result = execSync('where signtool.exe', { encoding: 'utf8' })
    const foundPath = result.trim().split('\n')[0]
    if (foundPath && fs.existsSync(foundPath)) {
      log(`Found SignTool via PATH: ${foundPath}`)
      return foundPath
    }
  } catch (error) {
    // Ignore
  }

  log('SignTool.exe not found', 'ERROR')
  return null
}

/**
 * Get certificate path (handle base64 encoded certs)
 */
function getCertificatePath() {
  const certLink = process.env.WIN_CSC_LINK

  if (!certLink) {
    log('WIN_CSC_LINK not set', 'ERROR')
    return null
  }

  // If it's a file path and exists, use it directly
  if (fs.existsSync(certLink)) {
    log(`Using certificate file: ${certLink}`)
    return certLink
  }

  // If it's base64 encoded, decode it to a temp file
  if (certLink.length > 1000 && !certLink.includes('/') && !certLink.includes('\\')) {
    log('Decoding base64 certificate')
    const tempCertPath = path.join(os.tmpdir(), 'temp-signing-cert.pfx')
    const certBuffer = Buffer.from(certLink, 'base64')
    fs.writeFileSync(tempCertPath, certBuffer)
    log(`Temporary certificate written to: ${tempCertPath}`)
    return tempCertPath
  }

  log('Certificate file not found and not base64 encoded', 'ERROR')
  return null
}

/**
 * Sign file using SignTool
 */
function signWithSignTool(filePath, signTool, certPath, password) {
  log(`Signing ${filePath} with SignTool`)

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const timestampServer = TIMESTAMP_SERVERS[(attempt - 1) % TIMESTAMP_SERVERS.length]

    try {
      const args = [
        'sign',
        '/f',
        `"${certPath}"`,
        password ? `/p "${password}"` : '',
        '/fd',
        SIGNING_ALGORITHM,
        '/tr',
        timestampServer,
        '/td',
        SIGNING_ALGORITHM,
        '/v',
        `"${filePath}"`,
      ]
        .filter(Boolean)
        .join(' ')

      const command = `"${signTool}" ${args}`

      log(`Attempt ${attempt}/${MAX_RETRIES} with timestamp server: ${timestampServer}`)

      const output = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 10 * 1024 * 1024,
      })

      log(output)
      log(`Successfully signed: ${filePath}`, 'SUCCESS')
      return true
    } catch (error) {
      log(`Attempt ${attempt} failed: ${error.message}`, 'WARN')

      if (attempt === MAX_RETRIES) {
        log(`All ${MAX_RETRIES} attempts failed`, 'ERROR')
        throw error
      }

      // Wait before retry (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000
      log(`Waiting ${waitTime}ms before retry...`)
      execSync(`timeout /t ${waitTime / 1000} /nobreak`, { stdio: 'ignore' })
    }
  }

  return false
}

/**
 * Sign file using Azure Code Signing
 */
function signWithAzure(filePath) {
  log(`Signing ${filePath} with Azure Code Signing`)

  const {
    AZURE_KEY_VAULT_URI,
    AZURE_CERT_NAME,
    AZURE_CLIENT_ID,
    AZURE_CLIENT_SECRET,
    AZURE_TENANT_ID,
  } = process.env

  if (!AZURE_KEY_VAULT_URI || !AZURE_CERT_NAME) {
    log('Azure Code Signing environment variables not set', 'ERROR')
    return false
  }

  try {
    // Use Azure SignTool (requires AzureSignTool to be installed)
    // Install: dotnet tool install --global AzureSignTool
    const args = [
      'sign',
      '--azure-key-vault-url',
      AZURE_KEY_VAULT_URI,
      '--azure-key-vault-certificate',
      AZURE_CERT_NAME,
      '--azure-key-vault-client-id',
      AZURE_CLIENT_ID,
      '--azure-key-vault-client-secret',
      AZURE_CLIENT_SECRET,
      '--azure-key-vault-tenant-id',
      AZURE_TENANT_ID,
      '--timestamp-rfc3161',
      TIMESTAMP_SERVERS[0],
      '--timestamp-digest',
      SIGNING_ALGORITHM,
      '--file-digest',
      SIGNING_ALGORITHM,
      '--verbose',
      `"${filePath}"`,
    ].join(' ')

    const command = `azuresigntool ${args}`
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
    })

    log(output)
    log(`Successfully signed with Azure: ${filePath}`, 'SUCCESS')
    return true
  } catch (error) {
    log(`Azure signing failed: ${error.message}`, 'ERROR')
    return false
  }
}

/**
 * Verify signature
 */
function verifySignature(filePath, signTool) {
  if (!isWindows()) {
    log('Skipping signature verification on non-Windows platform', 'WARN')
    return true
  }

  try {
    log(`Verifying signature of ${filePath}`)
    const command = `"${signTool}" verify /pa /v "${filePath}"`
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' })
    log(output)
    log('Signature verification successful', 'SUCCESS')
    return true
  } catch (error) {
    log(`Signature verification failed: ${error.message}`, 'ERROR')
    return false
  }
}

/**
 * Main signing function
 */
function signFile(filePath) {
  if (!fs.existsSync(filePath)) {
    log(`File not found: ${filePath}`, 'ERROR')
    return false
  }

  log(`Starting code signing process for: ${filePath}`)

  // Check if Azure signing should be used
  if (process.env.AZURE_KEY_VAULT_URI) {
    log('Using Azure Code Signing')
    return signWithAzure(filePath)
  }

  // Use traditional SignTool
  const signTool = findSignTool()
  if (!signTool) {
    log('SignTool not found. Install Windows SDK or set up Azure Code Signing', 'ERROR')
    return false
  }

  const certPath = getCertificatePath()
  if (!certPath) {
    log('Certificate not configured', 'ERROR')
    return false
  }

  const password = process.env.WIN_CSC_KEY_PASSWORD || ''

  try {
    const signed = signWithSignTool(filePath, signTool, certPath, password)

    if (signed) {
      verifySignature(filePath, signTool)
    }

    // Clean up temp certificate if it was created
    if (certPath.includes(os.tmpdir())) {
      fs.unlinkSync(certPath)
      log('Cleaned up temporary certificate')
    }

    return signed
  } catch (error) {
    log(`Code signing failed: ${error.message}`, 'ERROR')

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

// CLI Entry Point
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: node sign-windows.js <path-to-executable>')
    process.exit(1)
  }

  const filePath = args[0]
  const success = signFile(filePath)

  process.exit(success ? 0 : 1)
}

module.exports = { signFile }
