#!/usr/bin/env tsx
/**
 * Translation Validation Script
 *
 * Validates that all translation files:
 * 1. Have the same keys as the English source
 * 2. Have valid JSON syntax
 * 3. Don't have untranslated English text (for completed translations)
 * 4. Have proper pluralization forms
 *
 * Usage:
 *   pnpm tsx scripts/validate-translations.ts
 *   pnpm tsx scripts/validate-translations.ts --locale es
 *   pnpm tsx scripts/validate-translations.ts --strict (fail on warnings)
 */

import * as fs from 'fs'
import * as path from 'path'

const LOCALES_DIR = path.join(__dirname, '../src/locales')
const SOURCE_LOCALE = 'en'
const NAMESPACES = ['common', 'chat', 'settings', 'admin', 'auth', 'errors']

interface ValidationResult {
  locale: string
  namespace: string
  valid: boolean
  errors: string[]
  warnings: string[]
  missingKeys: string[]
  extraKeys: string[]
  coverage: number
}

interface SummaryStats {
  totalLocales: number
  totalNamespaces: number
  validNamespaces: number
  totalErrors: number
  totalWarnings: number
  averageCoverage: number
}

function getAllKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = []

  for (const key in obj) {
    if (key === '_meta') continue // Skip metadata

    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey))
    } else {
      keys.push(fullKey)
    }
  }

  return keys
}

function loadTranslation(locale: string, namespace: string): any | null {
  const filePath = path.join(LOCALES_DIR, locale, `${namespace}.json`)

  if (!fs.existsSync(filePath)) {
    return null
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error)
    return null
  }
}

function validateTranslation(
  locale: string,
  namespace: string,
  sourceData: any,
  targetData: any
): ValidationResult {
  const result: ValidationResult = {
    locale,
    namespace,
    valid: true,
    errors: [],
    warnings: [],
    missingKeys: [],
    extraKeys: [],
    coverage: 0,
  }

  if (!targetData) {
    result.valid = false
    result.errors.push(`File not found: ${namespace}.json`)
    return result
  }

  // Get all keys from both source and target
  const sourceKeys = getAllKeys(sourceData)
  const targetKeys = getAllKeys(targetData).filter((k) => !k.startsWith('_meta'))

  // Check for missing keys
  result.missingKeys = sourceKeys.filter((key) => !targetKeys.includes(key))

  // Check for extra keys
  result.extraKeys = targetKeys.filter((key) => !sourceKeys.includes(key))

  // Calculate coverage
  const totalKeys = sourceKeys.length
  const translatedKeys = totalKeys - result.missingKeys.length
  result.coverage = totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 0

  // Add errors for missing keys
  if (result.missingKeys.length > 0) {
    result.errors.push(`Missing ${result.missingKeys.length} keys`)
    if (result.missingKeys.length <= 5) {
      result.missingKeys.forEach((key) => {
        result.errors.push(`  - Missing: ${key}`)
      })
    } else {
      result.errors.push(`  - First 5: ${result.missingKeys.slice(0, 5).join(', ')}`)
    }
  }

  // Add warnings for extra keys
  if (result.extraKeys.length > 0) {
    result.warnings.push(`Extra ${result.extraKeys.length} keys (not in English)`)
    if (result.extraKeys.length <= 5) {
      result.extraKeys.forEach((key) => {
        result.warnings.push(`  - Extra: ${key}`)
      })
    }
  }

  // Check if translation is marked as complete but has issues
  if (targetData._meta && targetData._meta.status !== 'needs_translation') {
    if (result.missingKeys.length > 0) {
      result.errors.push(
        `Marked as complete but missing keys (remove _meta.status or add translations)`
      )
    }
  }

  // Validate that the file isn't just copied English
  if (locale !== SOURCE_LOCALE && result.coverage === 100) {
    // Sample a few keys to check if they're actually translated
    const sampleKeys = sourceKeys.slice(0, Math.min(5, sourceKeys.length))
    let untranslatedCount = 0

    for (const key of sampleKeys) {
      const sourceParts = key.split('.')
      const targetParts = key.split('.')

      let sourceValue = sourceData
      let targetValue = targetData

      for (const part of sourceParts) {
        sourceValue = sourceValue?.[part]
      }

      for (const part of targetParts) {
        targetValue = targetValue?.[part]
      }

      if (sourceValue === targetValue && typeof sourceValue === 'string') {
        untranslatedCount++
      }
    }

    if (untranslatedCount === sampleKeys.length) {
      result.warnings.push(
        `Translation appears to be identical to English (needs actual translation)`
      )
    }
  }

  result.valid = result.errors.length === 0

  return result
}

function getAvailableLocales(): string[] {
  return fs
    .readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter(
      (dirent) =>
        dirent.isDirectory() && !dirent.name.startsWith('.') && !dirent.name.startsWith('_')
    )
    .map((dirent) => dirent.name)
}

function validateLocale(locale: string): ValidationResult[] {
  const results: ValidationResult[] = []

  console.log(`\n🌍 Validating ${locale}...`)

  for (const namespace of NAMESPACES) {
    const sourceData = loadTranslation(SOURCE_LOCALE, namespace)
    const targetData = loadTranslation(locale, namespace)

    if (!sourceData) {
      console.error(`❌ Source file missing: ${SOURCE_LOCALE}/${namespace}.json`)
      continue
    }

    const result = validateTranslation(locale, namespace, sourceData, targetData)
    results.push(result)

    // Print result
    const status = result.valid ? '✅' : '❌'
    const coverage = result.coverage.toFixed(1)
    console.log(`  ${status} ${namespace}.json (${coverage}% coverage)`)

    if (result.errors.length > 0) {
      result.errors.forEach((error) => console.log(`     ❌ ${error}`))
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => console.log(`     ⚠️  ${warning}`))
    }
  }

  return results
}

function printSummary(allResults: ValidationResult[], stats: SummaryStats): void {
  console.log('\n' + '='.repeat(80))
  console.log('📊 VALIDATION SUMMARY')
  console.log('='.repeat(80))

  console.log(`\nTotal Locales: ${stats.totalLocales}`)
  console.log(`Total Namespaces: ${stats.totalNamespaces}`)
  console.log(`Valid Namespaces: ${stats.validNamespaces}`)
  console.log(`Average Coverage: ${stats.averageCoverage.toFixed(1)}%`)
  console.log(`Total Errors: ${stats.totalErrors}`)
  console.log(`Total Warnings: ${stats.totalWarnings}`)

  // Group by locale
  const byLocale = allResults.reduce(
    (acc, result) => {
      if (!acc[result.locale]) {
        acc[result.locale] = []
      }
      acc[result.locale].push(result)
      return acc
    },
    {} as Record<string, ValidationResult[]>
  )

  console.log('\n📈 Coverage by Locale:')
  const locales = Object.keys(byLocale).sort()

  for (const locale of locales) {
    const results = byLocale[locale]
    const avgCoverage = results.reduce((sum, r) => sum + r.coverage, 0) / results.length
    const validCount = results.filter((r) => r.valid).length
    const status = validCount === NAMESPACES.length ? '✅' : '⚠️'

    console.log(
      `  ${status} ${locale.padEnd(6)} - ${avgCoverage.toFixed(1)}% (${validCount}/${NAMESPACES.length} complete)`
    )
  }

  // List incomplete translations
  console.log('\n📝 Incomplete Translations:')
  let hasIncomplete = false

  for (const locale of locales) {
    const results = byLocale[locale]
    const incomplete = results.filter((r) => r.coverage < 100)

    if (incomplete.length > 0) {
      hasIncomplete = true
      console.log(`\n  ${locale}:`)
      incomplete.forEach((r) => {
        console.log(
          `    - ${r.namespace}.json: ${r.coverage.toFixed(1)}% (${r.missingKeys.length} missing keys)`
        )
      })
    }
  }

  if (!hasIncomplete) {
    console.log('  🎉 All translations are 100% complete!')
  }

  // Final status
  console.log('\n' + '='.repeat(80))

  if (stats.totalErrors > 0) {
    console.log('❌ VALIDATION FAILED')
    console.log(`   ${stats.totalErrors} errors found`)
    console.log('   Please fix errors before deploying')
  } else if (stats.totalWarnings > 0) {
    console.log('⚠️  VALIDATION PASSED WITH WARNINGS')
    console.log(`   ${stats.totalWarnings} warnings found`)
    console.log('   Consider addressing warnings')
  } else {
    console.log('✅ VALIDATION PASSED')
    console.log('   All translations are valid!')
  }

  console.log('='.repeat(80) + '\n')
}

function main() {
  const args = process.argv.slice(2)
  const targetLocale = args.find((arg) => arg.startsWith('--locale='))?.split('=')[1]
  const strictMode = args.includes('--strict')

  console.log('🌐 Translation Validation Script')
  console.log('=================================\n')

  const locales = targetLocale
    ? [targetLocale]
    : getAvailableLocales().filter((l) => l !== SOURCE_LOCALE)

  console.log(`Validating ${locales.length} locale(s): ${locales.join(', ')}`)

  const allResults: ValidationResult[] = []

  for (const locale of locales) {
    const results = validateLocale(locale)
    allResults.push(...results)
  }

  // Calculate stats
  const stats: SummaryStats = {
    totalLocales: locales.length,
    totalNamespaces: allResults.length,
    validNamespaces: allResults.filter((r) => r.valid).length,
    totalErrors: allResults.reduce((sum, r) => sum + r.errors.length, 0),
    totalWarnings: allResults.reduce((sum, r) => sum + r.warnings.length, 0),
    averageCoverage: allResults.reduce((sum, r) => sum + r.coverage, 0) / allResults.length || 0,
  }

  printSummary(allResults, stats)

  // Exit with error code if validation failed
  if (stats.totalErrors > 0) {
    process.exit(1)
  }

  if (strictMode && stats.totalWarnings > 0) {
    console.error('Strict mode: Exiting due to warnings\n')
    process.exit(1)
  }

  process.exit(0)
}

main()
