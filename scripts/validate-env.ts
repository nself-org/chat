#!/usr/bin/env tsx
/**
 * Environment Variable Validation Script
 *
 * Validates environment configuration and provides helpful feedback.
 * Run this before deploying or when debugging configuration issues.
 *
 * Usage:
 *   pnpm tsx scripts/validate-env.ts
 *   pnpm tsx scripts/validate-env.ts --production
 */

import {
  validatePublicEnv,
  validateProductionEnv,
  checkEnvHealth,
  getEnvInfo,
} from '../src/lib/env/validation'

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function header(text: string) {
  console.log()
  log(`${'='.repeat(80)}`, colors.cyan)
  log(`  ${text}`, colors.bright)
  log(`${'='.repeat(80)}`, colors.cyan)
  console.log()
}

function section(text: string) {
  console.log()
  log(`${text}`, colors.bright)
  log(`${'-'.repeat(text.length)}`, colors.gray)
}

async function main() {
  const args = process.argv.slice(2)
  const isProductionCheck = args.includes('--production') || args.includes('-p')

  header('ɳChat Environment Validation')

  try {
    // Validate public environment
    section('1. Public Environment Variables')
    const env = validatePublicEnv()
    log('✓ Public environment variables are valid', colors.green)
    console.log()
    log(`  Environment: ${env.NEXT_PUBLIC_ENV}`, colors.gray)
    log(`  App Name: ${env.NEXT_PUBLIC_APP_NAME}`, colors.gray)
    log(`  Dev Auth: ${env.NEXT_PUBLIC_USE_DEV_AUTH ? 'Enabled' : 'Disabled'}`, colors.gray)

    // Get environment info
    section('2. Environment Information')
    const info = getEnvInfo()
    console.log()
    log(
      `  GraphQL API:      ${info.hasGraphQL ? '✓ Configured' : '✗ Not configured'}`,
      info.hasGraphQL ? colors.green : colors.red
    )
    log(
      `  Authentication:   ${info.hasAuth ? '✓ Configured' : '✗ Not configured'}`,
      info.hasAuth ? colors.green : colors.red
    )
    log(
      `  Storage:          ${info.hasStorage ? '✓ Configured' : '✗ Not configured'}`,
      info.hasStorage ? colors.green : colors.red
    )
    log(
      `  Real-time:        ${info.hasRealtime ? '✓ Configured' : '✗ Not configured'}`,
      info.hasRealtime ? colors.green : colors.yellow
    )
    log(`  Analytics:        ${info.analyticsEnabled ? '✓ Enabled' : '✗ Disabled'}`, colors.gray)
    log(
      `  Error Tracking:   ${info.errorTrackingEnabled ? '✓ Enabled' : '✗ Disabled'}`,
      colors.gray
    )

    // Check environment health
    section('3. Health Check')
    const health = checkEnvHealth()
    console.log()

    if (health.healthy) {
      log('✓ Environment is healthy - no issues detected', colors.green)
    } else {
      log(`✗ Found ${health.issues.length} issue(s):`, colors.yellow)
      health.issues.forEach((issue) => {
        log(`  • ${issue}`, colors.yellow)
      })
    }

    // Production validation (if requested)
    if (isProductionCheck) {
      section('4. Production Readiness')
      try {
        validateProductionEnv()
        log('✓ Environment is ready for production', colors.green)
      } catch (error) {
        if (error instanceof Error) {
          log('✗ Environment is NOT ready for production:', colors.red)
          console.log()
          log(error.message, colors.red)
          process.exit(1)
        }
      }
    }

    // Summary
    header('Summary')
    if (health.healthy) {
      log('✓ All checks passed!', colors.green)
      if (!isProductionCheck && info.environment === 'production') {
        log('\nℹ  Run with --production flag to validate production requirements', colors.cyan)
      }
      process.exit(0)
    } else {
      log('⚠  Some issues were found. Please review the messages above.', colors.yellow)
      if (info.environment === 'development') {
        log('\nℹ  These issues may be acceptable in development mode.', colors.cyan)
        process.exit(0)
      } else {
        process.exit(1)
      }
    }
  } catch (error) {
    console.error()
    log('✗ Validation failed:', colors.red)
    console.error()
    if (error instanceof Error) {
      log(error.message, colors.red)
    } else {
      console.error(error)
    }
    console.error()
    log(
      'Please check your .env.local file and ensure all required variables are set.',
      colors.yellow
    )
    log('See .env.example for reference.', colors.gray)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
