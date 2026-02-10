#!/usr/bin/env tsx
/**
 * Coverage Analysis Script
 *
 * Analyzes Jest coverage report and identifies files needing more tests.
 * Run with: pnpm tsx scripts/analyze-coverage.ts
 */

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

interface FileCoverage {
  path: string
  statements: { total: number; covered: number; pct: number }
  branches: { total: number; covered: number; pct: number }
  functions: { total: number; covered: number; pct: number }
  lines: { total: number; covered: number; pct: number }
}

interface CoverageSummary {
  total: FileCoverage
  files: Record<string, FileCoverage>
}

interface PrioritizedFile {
  path: string
  coverage: number
  priority: 'high' | 'medium' | 'low'
  reason: string
  statements: number
  uncoveredLines: number
}

/**
 * Load coverage summary
 */
function loadCoverageSummary(): CoverageSummary | null {
  const coveragePath = join(process.cwd(), 'coverage', 'coverage-summary.json')

  if (!existsSync(coveragePath)) {
    console.error('❌ Coverage file not found. Run: pnpm test:coverage')
    return null
  }

  const content = readFileSync(coveragePath, 'utf-8')
  return JSON.parse(content)
}

/**
 * Calculate file priority
 */
function calculatePriority(filePath: string, coverage: FileCoverage): PrioritizedFile {
  const avgCoverage =
    (coverage.statements.pct +
      coverage.branches.pct +
      coverage.functions.pct +
      coverage.lines.pct) /
    4

  const uncoveredLines = coverage.lines.total - coverage.lines.covered
  const uncoveredStatements = coverage.statements.total - coverage.statements.covered

  let priority: 'high' | 'medium' | 'low' = 'low'
  let reason = ''

  // High priority: Core features with low coverage
  if (
    (filePath.includes('/api/') || filePath.includes('/services/') || filePath.includes('/lib/')) &&
    avgCoverage < 70
  ) {
    priority = 'high'
    reason = 'Core functionality with low coverage'
  }
  // High priority: Many uncovered lines
  else if (uncoveredLines > 50) {
    priority = 'high'
    reason = `${uncoveredLines} uncovered lines`
  }
  // Medium priority: Moderate coverage gaps
  else if (avgCoverage < 80 && avgCoverage >= 50) {
    priority = 'medium'
    reason = `${Math.round(avgCoverage)}% coverage, needs improvement`
  }
  // Medium priority: Components with low coverage
  else if (filePath.includes('/components/') && avgCoverage < 75) {
    priority = 'medium'
    reason = 'Component with low coverage'
  }
  // Low priority: Good coverage but could be better
  else if (avgCoverage < 85) {
    priority = 'low'
    reason = 'Near target but could improve'
  } else {
    priority = 'low'
    reason = 'Good coverage'
  }

  return {
    path: filePath.replace(process.cwd() + '/', ''),
    coverage: Math.round(avgCoverage * 10) / 10,
    priority,
    reason,
    statements: coverage.statements.total,
    uncoveredLines,
  }
}

/**
 * Generate prioritized file list
 */
function analyzeCoverage(summary: CoverageSummary): PrioritizedFile[] {
  const files: PrioritizedFile[] = []

  for (const [filePath, coverage] of Object.entries(summary)) {
    if (filePath === 'total') continue

    // Skip generated files, test files, and config files
    if (
      filePath.includes('node_modules') ||
      filePath.includes('.test.') ||
      filePath.includes('.spec.') ||
      filePath.includes('__tests__') ||
      filePath.includes('jest.config') ||
      filePath.includes('next.config') ||
      filePath.includes('.eslintrc')
    ) {
      continue
    }

    const prioritized = calculatePriority(filePath, coverage)
    files.push(prioritized)
  }

  // Sort by priority then by coverage
  files.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    return a.coverage - b.coverage
  })

  return files
}

/**
 * Format coverage report
 */
function formatReport(summary: CoverageSummary, prioritized: PrioritizedFile[]): string {
  const lines: string[] = []

  lines.push('\n' + '='.repeat(100))
  lines.push('Coverage Analysis Report')
  lines.push('='.repeat(100) + '\n')

  // Overall summary
  const total = summary.total || summary['total']
  const avgCoverage =
    (total.statements.pct + total.branches.pct + total.functions.pct + total.lines.pct) / 4

  lines.push('Overall Coverage:')
  lines.push(
    `  Statements: ${total.statements.pct.toFixed(2)}% (${total.statements.covered}/${total.statements.total})`
  )
  lines.push(
    `  Branches:   ${total.branches.pct.toFixed(2)}% (${total.branches.covered}/${total.branches.total})`
  )
  lines.push(
    `  Functions:  ${total.functions.pct.toFixed(2)}% (${total.functions.covered}/${total.functions.total})`
  )
  lines.push(
    `  Lines:      ${total.lines.pct.toFixed(2)}% (${total.lines.covered}/${total.lines.total})`
  )
  lines.push(`  Average:    ${avgCoverage.toFixed(2)}%`)
  lines.push('')

  // Coverage status
  const targetCoverage = 85
  const gap = targetCoverage - avgCoverage
  if (avgCoverage >= targetCoverage) {
    lines.push(`✅ Coverage target of ${targetCoverage}% achieved!`)
  } else {
    lines.push(`❌ Coverage is ${gap.toFixed(2)}% below target of ${targetCoverage}%`)
    lines.push(`   Need to improve coverage by ${gap.toFixed(2)} percentage points`)
  }

  lines.push('\n' + '='.repeat(100))
  lines.push('Files Needing Attention')
  lines.push('='.repeat(100) + '\n')

  // Group by priority
  const highPriority = prioritized.filter((f) => f.priority === 'high')
  const mediumPriority = prioritized.filter((f) => f.priority === 'medium')
  const lowPriority = prioritized.filter((f) => f.priority === 'low')

  // High priority
  if (highPriority.length > 0) {
    lines.push('🔴 HIGH PRIORITY (' + highPriority.length + ' files):')
    lines.push('')
    highPriority.slice(0, 20).forEach((file, index) => {
      lines.push(`${index + 1}. ${file.path}`)
      lines.push(`   Coverage: ${file.coverage}% | Uncovered Lines: ${file.uncoveredLines}`)
      lines.push(`   Reason: ${file.reason}`)
      lines.push('')
    })
  }

  // Medium priority
  if (mediumPriority.length > 0) {
    lines.push('🟡 MEDIUM PRIORITY (' + mediumPriority.length + ' files):')
    lines.push('')
    mediumPriority.slice(0, 15).forEach((file, index) => {
      lines.push(`${index + 1}. ${file.path}`)
      lines.push(`   Coverage: ${file.coverage}% | Uncovered Lines: ${file.uncoveredLines}`)
      lines.push(`   Reason: ${file.reason}`)
      lines.push('')
    })
  }

  // Low priority
  if (lowPriority.length > 0) {
    lines.push(`🟢 LOW PRIORITY (${lowPriority.length} files) - showing top 10:`)
    lines.push('')
    lowPriority.slice(0, 10).forEach((file, index) => {
      lines.push(`${index + 1}. ${file.path} - ${file.coverage}%`)
    })
    lines.push('')
  }

  lines.push('='.repeat(100))
  lines.push('Recommendations')
  lines.push('='.repeat(100) + '\n')

  lines.push('To improve coverage to 85%:')
  lines.push('')
  lines.push('1. Focus on HIGH PRIORITY files first (core functionality)')
  lines.push('2. Write integration tests for API routes')
  lines.push('3. Add unit tests for service classes')
  lines.push('4. Test component rendering and interactions')
  lines.push('5. Test error handling paths')
  lines.push('6. Test edge cases and boundary conditions')
  lines.push('')

  return lines.join('\n')
}

/**
 * Generate actionable test creation commands
 */
function generateTestCommands(prioritized: PrioritizedFile[]): string {
  const lines: string[] = []
  const highPriority = prioritized.filter((f) => f.priority === 'high').slice(0, 10)

  lines.push('\n' + '='.repeat(100))
  lines.push('Suggested Test Files to Create')
  lines.push('='.repeat(100) + '\n')

  for (const file of highPriority) {
    const testPath = file.path
      .replace('/src/', '/src/__tests__/')
      .replace(/\.(ts|tsx)$/, '.test.$1')

    lines.push(`# ${file.path} (${file.coverage}% coverage)`)
    lines.push(`touch ${testPath}`)
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Main analysis function
 */
async function runAnalysis(): Promise<void> {
  console.log('📊 Analyzing test coverage...\n')

  const summary = loadCoverageSummary()
  if (!summary) {
    process.exit(1)
  }

  const prioritized = analyzeCoverage(summary)

  // Generate report
  const report = formatReport(summary, prioritized)
  console.log(report)

  // Generate test commands
  const commands = generateTestCommands(prioritized)
  console.log(commands)

  // Summary statistics
  const total = summary.total || summary['total']
  const avgCoverage =
    (total.statements.pct + total.branches.pct + total.functions.pct + total.lines.pct) / 4

  const exitCode = avgCoverage >= 85 ? 0 : 1

  if (exitCode === 0) {
    console.log('\n✅ Coverage target achieved!\n')
  } else {
    console.log('\n❌ Coverage below target. Create tests for high priority files.\n')
  }

  process.exit(exitCode)
}

// Run analysis
runAnalysis().catch((error) => {
  console.error('Fatal error analyzing coverage:', error)
  process.exit(1)
})
