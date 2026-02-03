#!/usr/bin/env node

/**
 * Coverage Analysis Script
 * Analyzes test coverage and identifies files needing tests
 */

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

// Read coverage summary
const coverageSummaryPath = path.join(__dirname, '../coverage/coverage-summary.json')

if (!fs.existsSync(coverageSummaryPath)) {
  console.error('❌ Coverage summary not found. Run: pnpm test:coverage first')
  process.exit(1)
}

const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'))

// Calculate overall statistics
let totalFiles = 0
let coveredFiles = 0
let uncoveredFiles = []
let partiallyUncoveredFiles = []

const thresholds = {
  lines: 80,
  statements: 80,
  functions: 80,
  branches: 80,
}

console.log('\n📊 Test Coverage Analysis\n')
console.log('='.repeat(80))

Object.entries(coverageSummary).forEach(([file, metrics]) => {
  if (file === 'total') return

  // Skip excluded files
  if (
    file.includes('node_modules') ||
    file.includes('.next') ||
    file.includes('instrumentation') ||
    file.includes('sentry') ||
    file.includes('/platforms/') ||
    file.includes('test-utils') ||
    file.includes('__tests__') ||
    file.endsWith('.d.ts') ||
    file.endsWith('.stories.tsx') ||
    file.endsWith('.stories.ts')
  ) {
    return
  }

  totalFiles++

  const linesCoverage = metrics.lines.pct
  const statementsCoverage = metrics.statements.pct
  const functionsCoverage = metrics.functions.pct
  const branchesCoverage = metrics.branches.pct

  const avgCoverage =
    (linesCoverage + statementsCoverage + functionsCoverage + branchesCoverage) / 4

  if (avgCoverage === 0) {
    uncoveredFiles.push({
      file: file.replace(process.cwd(), ''),
      coverage: 0,
      metrics,
    })
  } else if (avgCoverage < 80) {
    partiallyUncoveredFiles.push({
      file: file.replace(process.cwd(), ''),
      coverage: avgCoverage,
      metrics,
    })
    coveredFiles++
  } else {
    coveredFiles++
  }
})

// Display results
console.log(`\n✅ Total Files Analyzed: ${totalFiles}`)
console.log(`✅ Files with >80% Coverage: ${coveredFiles}`)
console.log(`⚠️  Files with <80% Coverage: ${partiallyUncoveredFiles.length}`)
console.log(`❌ Files with 0% Coverage: ${uncoveredFiles.length}`)

const overallCoverage = ((coveredFiles / totalFiles) * 100).toFixed(2)
console.log(`\n📈 Overall File Coverage: ${overallCoverage}%`)

// Show total metrics
if (coverageSummary.total) {
  const total = coverageSummary.total
  console.log('\n📊 Total Coverage Metrics:')
  console.log(`   Lines:      ${total.lines.pct.toFixed(2)}%`)
  console.log(`   Statements: ${total.statements.pct.toFixed(2)}%`)
  console.log(`   Functions:  ${total.functions.pct.toFixed(2)}%`)
  console.log(`   Branches:   ${total.branches.pct.toFixed(2)}%`)
}

console.log('\n' + '='.repeat(80))

// Show uncovered files
if (uncoveredFiles.length > 0) {
  console.log(`\n❌ Files with 0% Coverage (${uncoveredFiles.length}):\n`)

  // Group by directory
  const byDirectory = {}
  uncoveredFiles.forEach(({ file }) => {
    const dir = path.dirname(file)
    if (!byDirectory[dir]) byDirectory[dir] = []
    byDirectory[dir].push(path.basename(file))
  })

  Object.entries(byDirectory).forEach(([dir, files]) => {
    console.log(`  ${dir}/`)
    files.forEach((file) => console.log(`    - ${file}`))
  })
}

// Show partially uncovered files (sorted by coverage)
if (partiallyUncoveredFiles.length > 0) {
  console.log(`\n⚠️  Files with <80% Coverage (${partiallyUncoveredFiles.length}):\n`)

  partiallyUncoveredFiles
    .sort((a, b) => a.coverage - b.coverage)
    .slice(0, 20) // Show top 20
    .forEach(({ file, coverage, metrics }) => {
      console.log(`  ${coverage.toFixed(1)}% - ${file}`)
      console.log(
        `       L: ${metrics.lines.pct}% | S: ${metrics.statements.pct}% | F: ${metrics.functions.pct}% | B: ${metrics.branches.pct}%`
      )
    })

  if (partiallyUncoveredFiles.length > 20) {
    console.log(`  ... and ${partiallyUncoveredFiles.length - 20} more`)
  }
}

// Generate recommendations
console.log('\n' + '='.repeat(80))
console.log('\n💡 Recommendations:\n')

if (uncoveredFiles.length > 0) {
  console.log(`1. Create tests for ${uncoveredFiles.length} files with 0% coverage`)
}

if (partiallyUncoveredFiles.length > 0) {
  console.log(`2. Improve coverage for ${partiallyUncoveredFiles.length} partially tested files`)
}

const gapTo100 = Math.max(0, 100 - parseFloat(overallCoverage))
console.log(`3. Gap to 100% coverage: ${gapTo100.toFixed(2)}%`)

const estimatedTests = uncoveredFiles.length + Math.ceil(partiallyUncoveredFiles.length * 0.5)
console.log(`4. Estimated new tests needed: ~${estimatedTests}`)

console.log('\n' + '='.repeat(80))

// Export data for PROGRESS.md
const outputData = {
  timestamp: new Date().toISOString(),
  summary: {
    totalFiles,
    coveredFiles,
    partiallyUncoveredFiles: partiallyUncoveredFiles.length,
    uncoveredFiles: uncoveredFiles.length,
    overallCoverage: parseFloat(overallCoverage),
  },
  metrics: coverageSummary.total,
  uncoveredFiles: uncoveredFiles.map((f) => f.file),
  partiallyUncoveredFiles: partiallyUncoveredFiles.map((f) => ({
    file: f.file,
    coverage: parseFloat(f.coverage.toFixed(2)),
  })),
}

fs.writeFileSync(
  path.join(__dirname, '../coverage/analysis.json'),
  JSON.stringify(outputData, null, 2)
)

console.log('\n✅ Analysis saved to coverage/analysis.json\n')
