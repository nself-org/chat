#!/usr/bin/env node
/**
 * Test Coverage Analysis Script
 *
 * Analyzes test coverage and identifies:
 * - Missing tests for services
 * - Missing tests for hooks
 * - Missing tests for API routes
 * - Coverage gaps in critical modules
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

const SOURCE_DIR = path.join(__dirname, '..', 'src')
const COVERAGE_FILE = path.join(__dirname, '..', 'coverage', 'coverage-summary.json')

// Critical paths that require high coverage
const CRITICAL_PATHS = [
  'src/services/auth/**/*.ts',
  'src/services/messages/**/*.ts',
  'src/lib/e2ee/**/*.ts',
  'src/lib/security/**/*.ts',
  'src/stores/**/*.ts',
]

// Patterns to find source files
const SOURCE_PATTERNS = {
  services: 'src/services/**/*.service.ts',
  hooks: 'src/hooks/use-*.ts',
  apiRoutes: 'src/app/api/**/route.ts',
  utilities: 'src/lib/**/*.ts',
  stores: 'src/stores/**/*.ts',
  components: 'src/components/**/*.tsx',
}

// Patterns to find test files
const TEST_PATTERNS = {
  services: 'src/services/**/__tests__/**/*.test.ts',
  hooks: 'src/hooks/__tests__/**/*.test.{ts,tsx}',
  apiRoutes: 'src/app/api/__tests__/**/*.test.ts',
  utilities: 'src/lib/**/__tests__/**/*.test.ts',
  stores: 'src/stores/__tests__/**/*.test.ts',
  components: 'src/components/**/__tests__/**/*.test.tsx',
}

/**
 * Find files matching a pattern
 */
function findFiles(pattern) {
  return glob.sync(pattern, { cwd: path.join(__dirname, '..') })
}

/**
 * Get the test file path for a source file
 */
function getTestPath(sourcePath) {
  const dir = path.dirname(sourcePath)
  const basename = path.basename(sourcePath, path.extname(sourcePath))
  return path.join(dir, '__tests__', `${basename}.test.ts`)
}

/**
 * Check if a source file has a corresponding test
 */
function hasTest(sourcePath) {
  const testPath = getTestPath(sourcePath)
  const testPathTsx = testPath.replace('.test.ts', '.test.tsx')
  return (
    fs.existsSync(path.join(__dirname, '..', testPath)) ||
    fs.existsSync(path.join(__dirname, '..', testPathTsx))
  )
}

/**
 * Analyze missing tests
 */
function analyzeMissingTests() {
  console.log('\n=== MISSING TESTS ANALYSIS ===\n')

  const results = {}

  for (const [category, pattern] of Object.entries(SOURCE_PATTERNS)) {
    const sourceFiles = findFiles(pattern)
    const missingTests = sourceFiles.filter((file) => {
      // Skip test files, type definitions, and certain patterns
      if (
        file.includes('__tests__') ||
        file.includes('.d.ts') ||
        file.includes('.stories.') ||
        file.includes('index.ts') ||
        file.includes('types.ts') ||
        file.includes('interface.ts') ||
        file.includes('config.ts')
      ) {
        return false
      }
      return !hasTest(file)
    })

    results[category] = {
      total: sourceFiles.length,
      tested: sourceFiles.length - missingTests.length,
      missing: missingTests.length,
      coverage: (((sourceFiles.length - missingTests.length) / sourceFiles.length) * 100).toFixed(
        2
      ),
      files: missingTests,
    }

    console.log(`${category.toUpperCase()}:`)
    console.log(`  Total files: ${results[category].total}`)
    console.log(`  Tested: ${results[category].tested}`)
    console.log(`  Missing tests: ${results[category].missing}`)
    console.log(`  Coverage: ${results[category].coverage}%`)
    console.log()

    if (missingTests.length > 0 && missingTests.length <= 20) {
      console.log(`  Missing test files:`)
      missingTests.forEach((file) => {
        console.log(`    - ${file}`)
      })
      console.log()
    }
  }

  return results
}

/**
 * Analyze coverage data
 */
function analyzeCoverageData() {
  if (!fs.existsSync(COVERAGE_FILE)) {
    console.log('\n⚠️  Coverage summary not found. Run: pnpm test:coverage\n')
    return null
  }

  console.log('\n=== COVERAGE SUMMARY ===\n')

  const coverage = JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf-8'))

  console.log('TOTAL COVERAGE:')
  console.log(`  Lines: ${coverage.total.lines.pct}%`)
  console.log(`  Branches: ${coverage.total.branches.pct}%`)
  console.log(`  Functions: ${coverage.total.functions.pct}%`)
  console.log(`  Statements: ${coverage.total.statements.pct}%`)
  console.log()

  // Find files with low coverage
  const lowCoverageFiles = []
  for (const [file, data] of Object.entries(coverage)) {
    if (file === 'total') continue

    if (data.lines.pct < 80) {
      lowCoverageFiles.push({
        file: file.replace(path.join(__dirname, '..', 'src'), 'src'),
        lines: data.lines.pct,
        branches: data.branches.pct,
        functions: data.functions.pct,
        statements: data.statements.pct,
      })
    }
  }

  if (lowCoverageFiles.length > 0) {
    console.log('FILES WITH <80% COVERAGE:')
    lowCoverageFiles
      .sort((a, b) => a.lines - b.lines)
      .slice(0, 20)
      .forEach(({ file, lines, branches, functions, statements }) => {
        console.log(`  ${file}`)
        console.log(
          `    Lines: ${lines}% | Branches: ${branches}% | Functions: ${functions}% | Statements: ${statements}%`
        )
      })
    console.log()
  }

  return coverage
}

/**
 * Generate test coverage report
 */
function generateReport() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║          nChat Test Coverage Analysis Report              ║')
  console.log('╚════════════════════════════════════════════════════════════╝')

  const missingTests = analyzeMissingTests()
  const coverage = analyzeCoverageData()

  // Summary
  console.log('\n=== RECOMMENDATIONS ===\n')

  const priorities = []

  // Check services
  if (missingTests.services && missingTests.services.missing > 0) {
    priorities.push({
      priority: 1,
      category: 'Services',
      missing: missingTests.services.missing,
      files: missingTests.services.files.slice(0, 5),
    })
  }

  // Check hooks
  if (missingTests.hooks && missingTests.hooks.missing > 0) {
    priorities.push({
      priority: 2,
      category: 'Hooks',
      missing: missingTests.hooks.missing,
      files: missingTests.hooks.files.slice(0, 5),
    })
  }

  // Check API routes
  if (missingTests.apiRoutes && missingTests.apiRoutes.missing > 0) {
    priorities.push({
      priority: 3,
      category: 'API Routes',
      missing: missingTests.apiRoutes.missing,
      files: missingTests.apiRoutes.files.slice(0, 5),
    })
  }

  priorities.forEach(({ priority, category, missing, files }) => {
    console.log(`Priority ${priority}: Add tests for ${missing} ${category}`)
    console.log('  Top files:')
    files.forEach((file) => {
      console.log(`    - ${file}`)
    })
    console.log()
  })

  // Write report to file
  const reportPath = path.join(__dirname, '..', 'coverage', 'analysis-report.json')
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        missingTests,
        coverage: coverage ? coverage.total : null,
        priorities,
      },
      null,
      2
    )
  )

  console.log(`\n✅ Report saved to: ${reportPath}\n`)
}

// Run the analysis
generateReport()
