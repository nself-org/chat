#!/usr/bin/env node

/**
 * After Pack Script
 *
 * Runs after electron-builder packs the application but before signing.
 * Used for custom post-processing, cleanup, or verification.
 */

const fs = require('fs')
const path = require('path')

/**
 * Log message with timestamp
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [${level}] ${message}`)
}

/**
 * Get app size
 */
function getDirectorySize(dirPath) {
  let size = 0

  function getSize(itemPath) {
    const stats = fs.statSync(itemPath)

    if (stats.isFile()) {
      size += stats.size
    } else if (stats.isDirectory()) {
      const files = fs.readdirSync(itemPath)
      files.forEach((file) => {
        getSize(path.join(itemPath, file))
      })
    }
  }

  getSize(dirPath)
  return size
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Verify required files exist
 */
function verifyRequiredFiles(appOutDir, platform) {
  log('Verifying required files...')

  const requiredFiles = {
    darwin: ['Contents/MacOS/nchat', 'Contents/Resources/app.asar'],
    win32: ['nchat.exe', 'resources/app.asar'],
    linux: ['nchat', 'resources/app.asar'],
  }

  const files = requiredFiles[platform] || requiredFiles.linux
  let allExist = true

  for (const file of files) {
    const filePath = path.join(appOutDir, file)
    if (!fs.existsSync(filePath)) {
      log(`Required file missing: ${file}`, 'ERROR')
      allExist = false
    }
  }

  if (allExist) {
    log('All required files present', 'SUCCESS')
  } else {
    log('Some required files are missing', 'WARN')
  }

  return allExist
}

/**
 * Create version info file
 */
function createVersionInfo(appOutDir, version, platform) {
  const versionInfo = {
    version,
    platform,
    buildDate: new Date().toISOString(),
    electronVersion: require('electron/package.json').version,
    nodeVersion: process.version,
  }

  const versionFile = path.join(appOutDir, 'version.json')
  fs.writeFileSync(versionFile, JSON.stringify(versionInfo, null, 2))

  log(`Created version info: ${versionFile}`)
}

/**
 * Remove unnecessary files
 */
function cleanup(appOutDir, platform) {
  log('Cleaning up unnecessary files...')

  const unnecessaryPatterns = [
    '**/.DS_Store',
    '**/Thumbs.db',
    '**/*.md',
    '**/README',
    '**/*.map',
    '**/LICENSE.txt',
    '**/CHANGELOG.md',
  ]

  // Add platform-specific cleanup
  if (platform === 'darwin') {
    // macOS specific cleanup
  } else if (platform === 'win32') {
    // Windows specific cleanup
  } else if (platform === 'linux') {
    // Linux specific cleanup
  }

  log('Cleanup complete')
}

/**
 * Main after-pack function
 */
async function afterPack(context) {
  const { appOutDir, electronPlatformName, packager } = context

  log('='.repeat(60))
  log('Running after-pack script')
  log('='.repeat(60))

  log(`Platform: ${electronPlatformName}`)
  log(`Output directory: ${appOutDir}`)
  log(`App version: ${packager.appInfo.version}`)

  try {
    // Verify required files
    const filesValid = verifyRequiredFiles(appOutDir, electronPlatformName)
    if (!filesValid) {
      log('File verification failed', 'WARN')
    }

    // Create version info
    createVersionInfo(appOutDir, packager.appInfo.version, electronPlatformName)

    // Cleanup unnecessary files
    cleanup(appOutDir, electronPlatformName)

    // Calculate and log app size
    const appSize = getDirectorySize(appOutDir)
    log(`Application size: ${formatBytes(appSize)}`)

    // Size warning
    const maxSizeMB = 200
    const sizeMB = appSize / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      log(
        `WARNING: App size (${sizeMB.toFixed(1)}MB) exceeds recommended maximum (${maxSizeMB}MB)`,
        'WARN'
      )
    } else {
      log(
        `App size is within recommended limits (${sizeMB.toFixed(1)}MB / ${maxSizeMB}MB)`,
        'SUCCESS'
      )
    }

    log('After-pack script completed successfully', 'SUCCESS')
  } catch (error) {
    log(`After-pack script error: ${error.message}`, 'ERROR')
    throw error
  }
}

module.exports = afterPack
