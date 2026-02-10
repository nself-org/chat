#!/usr/bin/env node
/**
 * Legacy Import Checker for v0.9.2 Monorepo Refactor
 *
 * This script detects legacy import paths (@/...) in the codebase and reports
 * them for migration to new monorepo paths (@nself-chat/...).
 *
 * Usage:
 *   node scripts/check-legacy-imports.js [options] [files...]
 *
 * Options:
 *   --error      Exit with error code if legacy imports found (for CI)
 *   --warn       Show warnings only (default)
 *   --verbose    Show file paths and line numbers
 *   --json       Output results as JSON
 *   --help       Show this help message
 *
 * Exit Codes:
 *   0 - No legacy imports found
 *   1 - Legacy imports found (only with --error flag)
 *
 * Examples:
 *   # Check all TypeScript files (warning mode)
 *   node scripts/check-legacy-imports.js
 *
 *   # CI mode (fails build if legacy imports found)
 *   node scripts/check-legacy-imports.js --error
 *
 *   # Verbose output with line numbers
 *   node scripts/check-legacy-imports.js --verbose src/app/**\/*.tsx
 *
 *   # JSON output for tooling integration
 *   node scripts/check-legacy-imports.js --json
 */

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

// Legacy import patterns to detect
const LEGACY_PATTERNS = [
  {
    pattern: /@\/lib\//,
    desc: 'Legacy @/lib imports',
    suggestion: 'Use @nself-chat/core instead'
  },
  {
    pattern: /@\/contexts\//,
    desc: 'Legacy @/contexts imports',
    suggestion: 'Use @nself-chat/state instead'
  },
  {
    pattern: /@\/components\/ui\//,
    desc: 'Legacy @/components/ui imports',
    suggestion: 'Use @nself-chat/ui instead'
  },
  {
    pattern: /@\/graphql\//,
    desc: 'Legacy @/graphql imports',
    suggestion: 'Use @nself-chat/api instead'
  },
  {
    pattern: /@\/config\//,
    desc: 'Legacy @/config imports',
    suggestion: 'Use @nself-chat/config instead'
  },
  {
    pattern: /@\/types\//,
    desc: 'Legacy @/types imports',
    suggestion: 'Use @nself-chat/core/types instead'
  }
]

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    error: false,
    warn: true,
    verbose: false,
    json: false,
    help: false,
    files: []
  }

  for (const arg of args) {
    if (arg === '--error') {
      options.error = true
      options.warn = false
    } else if (arg === '--warn') {
      options.warn = true
      options.error = false
    } else if (arg === '--verbose') {
      options.verbose = true
    } else if (arg === '--json') {
      options.json = true
    } else if (arg === '--help') {
      options.help = true
    } else if (!arg.startsWith('--')) {
      options.files.push(arg)
    }
  }

  // Default to all TS/TSX files if no files specified
  if (options.files.length === 0 && !options.help) {
    options.files = ['src/**/*.ts', 'src/**/*.tsx']
  }

  return options
}

// Check a single file for legacy imports
function checkFile(filePath, options) {
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  const violations = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNumber = i + 1

    for (const { pattern, desc, suggestion } of LEGACY_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          pattern: desc,
          suggestion
        })
      }
    }
  }

  return violations
}

// Format violations for console output
function formatViolations(violations, options) {
  if (options.json) {
    return JSON.stringify(violations, null, 2)
  }

  const output = []

  // Group by file
  const byFile = violations.reduce((acc, v) => {
    if (!acc[v.file]) acc[v.file] = []
    acc[v.file].push(v)
    return acc
  }, {})

  for (const [file, fileViolations] of Object.entries(byFile)) {
    output.push(`\n${file}:`)

    if (options.verbose) {
      for (const v of fileViolations) {
        output.push(`  Line ${v.line}: ${v.pattern}`)
        output.push(`    ${v.content}`)
        output.push(`    💡 ${v.suggestion}`)
      }
    } else {
      const counts = fileViolations.reduce((acc, v) => {
        acc[v.pattern] = (acc[v.pattern] || 0) + 1
        return acc
      }, {})

      for (const [pattern, count] of Object.entries(counts)) {
        output.push(`  • ${pattern}: ${count} occurrence(s)`)
      }
    }
  }

  return output.join('\n')
}

// Main function
async function main() {
  const options = parseArgs()

  if (options.help) {
    console.log(fs.readFileSync(__filename, 'utf8').match(/\/\*\*[\s\S]*?\*\//)[0])
    process.exit(0)
  }

  if (!options.json) {
    console.log('🔍 nself-chat Legacy Import Checker')
    console.log('====================================\n')
  }

  // Expand glob patterns
  const allFiles = []
  for (const pattern of options.files) {
    const matches = await glob(pattern, { ignore: ['node_modules/**', 'dist/**', '.next/**'] })
    allFiles.push(...matches)
  }

  if (allFiles.length === 0 && !options.json) {
    console.log('⚠️  No files found matching the specified patterns')
    process.exit(0)
  }

  if (!options.json) {
    console.log(`📁 Checking ${allFiles.length} file(s)...\n`)
  }

  // Check all files
  const allViolations = []
  for (const file of allFiles) {
    try {
      const violations = checkFile(file, options)
      allViolations.push(...violations)
    } catch (error) {
      if (!options.json) {
        console.error(`Error checking ${file}:`, error.message)
      }
    }
  }

  // Output results
  if (allViolations.length === 0) {
    if (options.json) {
      console.log(JSON.stringify({ success: true, violations: [] }))
    } else {
      console.log('✅ No legacy imports found - all files use new paths!')
    }
    process.exit(0)
  } else {
    if (options.json) {
      console.log(JSON.stringify({ success: false, violations: allViolations }))
    } else {
      const emoji = options.error ? '❌' : '⚠️ '
      const level = options.error ? 'ERROR' : 'WARNING'

      console.log(`${emoji} ${level}: Found ${allViolations.length} legacy import(s) in ${new Set(allViolations.map(v => v.file)).size} file(s)`)
      console.log(formatViolations(allViolations, options))

      console.log('\n====================================')
      console.log('📋 How to Fix')
      console.log('====================================\n')
      console.log('Run the migration script to automatically update imports:')
      console.log('  node scripts/migrate-imports.js\n')
      console.log('Or manually update imports to use @nself-chat/* packages.')
    }

    process.exit(options.error ? 1 : 0)
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { checkFile, LEGACY_PATTERNS }
