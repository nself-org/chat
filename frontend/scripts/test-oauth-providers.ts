#!/usr/bin/env tsx
/**
 * OAuth Provider Testing Script
 *
 * Tests all 11 OAuth providers for configuration and functionality.
 * Run with: pnpm tsx scripts/test-oauth-providers.ts
 */

import { existsSync } from 'fs'
import { join } from 'path'
import {
  getAllOAuthProviderNames,
  validateAllOAuthProviders,
  type OAuthProviderValidation,
} from '../src/config/oauth-providers'

interface OAuthRouteCheck {
  provider: string
  initiateRouteExists: boolean
  callbackRouteExists: boolean
  initiateRoutePath: string
  callbackRoutePath: string
}

interface OAuthTestResult extends OAuthProviderValidation {
  routeCheck: OAuthRouteCheck
  overallStatus: 'pass' | 'fail' | 'warning'
}

/**
 * Check if OAuth routes exist for a provider
 */
function checkOAuthRoutes(provider: string): OAuthRouteCheck {
  const srcDir = join(process.cwd(), 'src')

  const initiateRoutePath = join(srcDir, 'app', 'api', 'auth', provider, 'route.ts')
  const callbackRoutePath = join(srcDir, 'app', 'api', 'auth', provider, 'callback', 'route.ts')

  return {
    provider,
    initiateRouteExists: existsSync(initiateRoutePath),
    callbackRouteExists: existsSync(callbackRoutePath),
    initiateRoutePath,
    callbackRoutePath,
  }
}

/**
 * Test a single OAuth provider
 */
function testProvider(validation: OAuthProviderValidation): OAuthTestResult {
  const routeCheck = checkOAuthRoutes(validation.provider)

  let overallStatus: 'pass' | 'fail' | 'warning' = 'pass'

  // Determine overall status
  if (
    validation.errors.length > 0 ||
    !routeCheck.initiateRouteExists ||
    !routeCheck.callbackRouteExists
  ) {
    overallStatus = 'fail'
  } else if (validation.warnings.length > 0) {
    overallStatus = 'warning'
  }

  return {
    ...validation,
    routeCheck,
    overallStatus,
  }
}

/**
 * Format test results as a table
 */
function formatResultsTable(results: OAuthTestResult[]): string {
  const rows: string[] = []

  // Header
  rows.push('┌─────────────┬────────┬─────────┬──────────┬───────────────────────────────┐')
  rows.push('│ Provider    │ Status │ Config  │ Routes   │ Issues                        │')
  rows.push('├─────────────┼────────┼─────────┼──────────┼───────────────────────────────┤')

  // Data rows
  for (const result of results) {
    const provider = result.provider.padEnd(11)
    const status =
      result.overallStatus === 'pass'
        ? '✅ PASS'
        : result.overallStatus === 'warning'
          ? '⚠️  WARN'
          : '❌ FAIL'
    const config = result.valid ? '✓' : '✗'
    const routes =
      result.routeCheck.initiateRouteExists && result.routeCheck.callbackRouteExists ? '✓' : '✗'

    const issues: string[] = []
    if (result.errors.length > 0) {
      issues.push(...result.errors)
    }
    if (!result.routeCheck.initiateRouteExists) {
      issues.push('Missing initiate route')
    }
    if (!result.routeCheck.callbackRouteExists) {
      issues.push('Missing callback route')
    }

    const issueText = issues.length > 0 ? issues[0].substring(0, 28) : 'None'

    rows.push(
      `│ ${provider} │ ${status} │ ${config.padEnd(7)} │ ${routes.padEnd(8)} │ ${issueText.padEnd(29)} │`
    )
  }

  rows.push('└─────────────┴────────┴─────────┴──────────┴───────────────────────────────┘')

  return rows.join('\n')
}

/**
 * Generate detailed report
 */
function generateDetailedReport(results: OAuthTestResult[]): string {
  const lines: string[] = []

  lines.push('\n' + '='.repeat(80))
  lines.push('OAuth Provider Test Report - Detailed Results')
  lines.push('='.repeat(80) + '\n')

  for (const result of results) {
    lines.push(`\n${result.provider.toUpperCase()}`)
    lines.push('-'.repeat(result.provider.length))

    lines.push(`Status: ${result.overallStatus.toUpperCase()}`)
    lines.push(`Configuration Valid: ${result.valid ? 'YES' : 'NO'}`)
    lines.push(`Initiate Route Exists: ${result.routeCheck.initiateRouteExists ? 'YES' : 'NO'}`)
    lines.push(`Callback Route Exists: ${result.routeCheck.callbackRouteExists ? 'YES' : 'NO'}`)

    if (result.errors.length > 0) {
      lines.push('\nErrors:')
      result.errors.forEach((error) => lines.push(`  ❌ ${error}`))
    }

    if (result.warnings.length > 0) {
      lines.push('\nWarnings:')
      result.warnings.forEach((warning) => lines.push(`  ⚠️  ${warning}`))
    }

    if (!result.routeCheck.initiateRouteExists) {
      lines.push(`\nMissing: ${result.routeCheck.initiateRoutePath}`)
    }

    if (!result.routeCheck.callbackRouteExists) {
      lines.push(`\nMissing: ${result.routeCheck.callbackRoutePath}`)
    }
  }

  return lines.join('\n')
}

/**
 * Generate summary statistics
 */
function generateSummary(results: OAuthTestResult[]): string {
  const total = results.length
  const passed = results.filter((r) => r.overallStatus === 'pass').length
  const warned = results.filter((r) => r.overallStatus === 'warning').length
  const failed = results.filter((r) => r.overallStatus === 'fail').length

  const configured = results.filter((r) => r.valid).length
  const withRoutes = results.filter(
    (r) => r.routeCheck.initiateRouteExists && r.routeCheck.callbackRouteExists
  ).length

  const lines: string[] = []

  lines.push('\n' + '='.repeat(80))
  lines.push('Summary')
  lines.push('='.repeat(80))
  lines.push(`Total Providers: ${total}`)
  lines.push(`✅ Passed: ${passed} (${Math.round((passed / total) * 100)}%)`)
  lines.push(`⚠️  Warnings: ${warned} (${Math.round((warned / total) * 100)}%)`)
  lines.push(`❌ Failed: ${failed} (${Math.round((failed / total) * 100)}%)`)
  lines.push(`\nConfigured: ${configured}/${total}`)
  lines.push(`Routes Exist: ${withRoutes}/${total}`)
  lines.push('='.repeat(80) + '\n')

  return lines.join('\n')
}

/**
 * Generate action items
 */
function generateActionItems(results: OAuthTestResult[]): string {
  const lines: string[] = []
  const failedResults = results.filter((r) => r.overallStatus === 'fail')

  if (failedResults.length === 0) {
    return '\n✅ No action items - all providers configured correctly!\n'
  }

  lines.push('\n' + '='.repeat(80))
  lines.push('Action Items')
  lines.push('='.repeat(80) + '\n')

  let itemNumber = 1

  for (const result of failedResults) {
    if (result.errors.length > 0) {
      lines.push(`${itemNumber}. ${result.provider.toUpperCase()} - Configuration Issues:`)
      result.errors.forEach((error) => lines.push(`   - ${error}`))
      itemNumber++
    }

    if (!result.routeCheck.initiateRouteExists) {
      lines.push(`${itemNumber}. ${result.provider.toUpperCase()} - Create initiate route:`)
      lines.push(`   File: ${result.routeCheck.initiateRoutePath}`)
      itemNumber++
    }

    if (!result.routeCheck.callbackRouteExists) {
      lines.push(`${itemNumber}. ${result.provider.toUpperCase()} - Create callback route:`)
      lines.push(`   File: ${result.routeCheck.callbackRoutePath}`)
      itemNumber++
    }
  }

  return lines.join('\n')
}

/**
 * Main test function
 */
async function runTests(): Promise<void> {
  console.log('\n🔍 Testing OAuth Providers...\n')

  // Get all provider validations
  const validations = validateAllOAuthProviders()

  // Test each provider
  const results = validations.map(testProvider)

  // Sort results: pass, warning, fail
  results.sort((a, b) => {
    const order = { pass: 0, warning: 1, fail: 2 }
    return order[a.overallStatus] - order[b.overallStatus]
  })

  // Display results
  console.log(formatResultsTable(results))
  console.log(generateSummary(results))

  // Display detailed report if there are failures
  const hasFailures = results.some((r) => r.overallStatus === 'fail')
  if (hasFailures) {
    console.log(generateDetailedReport(results))
    console.log(generateActionItems(results))
  }

  // Exit with error code if any provider failed
  const exitCode = hasFailures ? 1 : 0

  if (exitCode === 0) {
    console.log('✅ All OAuth providers configured correctly!\n')
  } else {
    console.log('❌ Some OAuth providers need attention. See action items above.\n')
  }

  process.exit(exitCode)
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error running OAuth provider tests:', error)
  process.exit(1)
})
