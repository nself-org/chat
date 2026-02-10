#!/usr/bin/env tsx
/**
 * SAST Scanner CLI Runner
 *
 * Runs the SAST scanner on the codebase and outputs results.
 *
 * Usage:
 *   pnpm tsx scripts/run-sast-scan.ts [options]
 *
 * Options:
 *   --output, -o FILE    Output file for JSON results (default: stdout)
 *   --min-severity SEV   Minimum severity to report (default: low)
 *   --verbose, -v        Enable verbose output
 *   --help, -h           Show help
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import {
  createSASTScanner,
  formatScanReport,
  type SASTScanResult,
  type Severity,
} from '../src/lib/security/sast-scanner'

// Parse command line arguments
const args = process.argv.slice(2)
let outputFile: string | null = null
let minSeverity: Severity = 'low'
let verbose = false

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  switch (arg) {
    case '--output':
    case '-o':
      outputFile = args[++i]
      break
    case '--min-severity':
      minSeverity = args[++i] as Severity
      break
    case '--verbose':
    case '-v':
      verbose = true
      break
    case '--help':
    case '-h':
      console.log(`
SAST Scanner CLI

Usage:
  pnpm tsx scripts/run-sast-scan.ts [options]

Options:
  --output, -o FILE    Output file for JSON results (default: stdout)
  --min-severity SEV   Minimum severity to report (default: low)
  --verbose, -v        Enable verbose output
  --help, -h           Show help

Examples:
  pnpm tsx scripts/run-sast-scan.ts
  pnpm tsx scripts/run-sast-scan.ts --output results.json
  pnpm tsx scripts/run-sast-scan.ts --min-severity high -v
`)
      process.exit(0)
  }
}

// Directories to scan
const SCAN_DIRS = ['src']

// File patterns to include
const INCLUDE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

// Patterns to exclude
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /dist/,
  /build/,
  /coverage/,
  /__tests__/,
  /\.test\./,
  /\.spec\./,
  /\.mock\./,
  /fixtures?/,
  /\.d\.ts$/,
]

/**
 * Recursively collect files to scan
 */
function collectFiles(dir: string): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = []

  try {
    const items = readdirSync(dir)

    for (const item of items) {
      const fullPath = join(dir, item)

      // Check exclusions
      if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(fullPath))) {
        continue
      }

      try {
        const stat = statSync(fullPath)

        if (stat.isDirectory()) {
          files.push(...collectFiles(fullPath))
        } else if (stat.isFile()) {
          const ext = extname(fullPath)
          if (INCLUDE_EXTENSIONS.includes(ext)) {
            try {
              const content = readFileSync(fullPath, 'utf-8')
              files.push({ path: fullPath, content })
            } catch {
              // Skip files that can't be read
            }
          }
        }
      } catch {
        // Skip items that can't be accessed
      }
    }
  } catch {
    // Skip directories that can't be read
  }

  return files
}

/**
 * Main function
 */
async function main() {
  const startTime = Date.now()

  if (verbose) {
    console.error('Starting SAST scan...')
    console.error(`Minimum severity: ${minSeverity}`)
    console.error(`Scanning directories: ${SCAN_DIRS.join(', ')}`)
  }

  // Create scanner
  const scanner = createSASTScanner({
    minSeverity,
    verbose,
  })

  // Collect files
  const allFiles: Array<{ path: string; content: string }> = []

  for (const dir of SCAN_DIRS) {
    if (verbose) {
      console.error(`Collecting files from ${dir}...`)
    }
    allFiles.push(...collectFiles(dir))
  }

  if (verbose) {
    console.error(`Found ${allFiles.length} files to scan`)
  }

  // Run scan
  const result: SASTScanResult = scanner.scanFiles(allFiles)

  if (verbose) {
    console.error(`Scan completed in ${Date.now() - startTime}ms`)
    console.error(`Found ${result.findings.length} findings`)
  }

  // Output results
  const output = {
    timestamp: new Date().toISOString(),
    scannedFiles: result.scannedFiles,
    totalLines: result.totalLines,
    scanDuration: result.scanDuration,
    summary: result.summary,
    passed: result.passed,
    findings: result.findings.map((f) => ({
      id: f.id,
      ruleId: f.ruleId,
      ruleName: f.ruleName,
      severity: f.severity,
      category: f.category,
      file: f.file,
      line: f.line,
      column: f.column,
      snippet: f.snippet,
      description: f.description,
      cwe: f.cwe,
      owasp: f.owasp,
      remediation: f.remediation,
    })),
  }

  if (outputFile) {
    writeFileSync(outputFile, JSON.stringify(output, null, 2))
    if (verbose) {
      console.error(`Results written to ${outputFile}`)
    }

    // Also print human-readable report to stderr
    console.error('\n' + formatScanReport(result))
  } else {
    // Output JSON to stdout
    console.log(JSON.stringify(output, null, 2))
  }

  // Exit with appropriate code
  if (!result.passed) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Error running SAST scan:', error)
  process.exit(1)
})
