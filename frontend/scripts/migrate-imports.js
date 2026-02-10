#!/usr/bin/env node
/**
 * Import Migration Script for v0.9.2 Monorepo Refactor
 *
 * This script automatically updates import statements from legacy paths (@/...)
 * to new monorepo paths (@nself-chat/...).
 *
 * Usage:
 *   node scripts/migrate-imports.js [options] [files...]
 *
 * Options:
 *   --dry-run    Show changes without applying them
 *   --verbose    Show detailed output
 *   --help       Show this help message
 *
 * Examples:
 *   # Dry run on all TypeScript files
 *   node scripts/migrate-imports.js --dry-run src/**\/*.tsx
 *
 *   # Apply migrations to specific directory
 *   node scripts/migrate-imports.js src/components/chat/*.tsx
 *
 *   # Verbose output
 *   node scripts/migrate-imports.js --verbose src/app/**\/*.tsx
 */

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

// Migration rules: legacy path → new path
const MIGRATION_RULES = [
  // Core utilities
  {
    from: /@\/lib\/utils/g,
    to: '@nself-chat/core',
    desc: 'Core utilities (cn, clsx, etc.)'
  },
  {
    from: /@\/lib\/([^'"]+)/g,
    to: '@nself-chat/core/$1',
    desc: 'Other lib utilities'
  },

  // GraphQL and API
  {
    from: /@\/graphql\/([^'"]+)/g,
    to: '@nself-chat/api/$1',
    desc: 'GraphQL operations'
  },
  {
    from: /@\/lib\/apollo-client/g,
    to: '@nself-chat/api/clients/apollo',
    desc: 'Apollo Client'
  },

  // State management
  {
    from: /@\/contexts\/auth-context/g,
    to: '@nself-chat/state/stores/auth',
    desc: 'Auth store'
  },
  {
    from: /@\/contexts\/([^'"]+)/g,
    to: '@nself-chat/state/stores/$1',
    desc: 'Other stores'
  },

  // UI components
  {
    from: /@\/components\/ui\/([^'"]+)/g,
    to: '@nself-chat/ui/primitives/$1',
    desc: 'UI components'
  },

  // Configuration
  {
    from: /@\/config\/([^'"]+)/g,
    to: '@nself-chat/config/$1',
    desc: 'Configuration'
  },

  // Types
  {
    from: /@\/types\/([^'"]+)/g,
    to: '@nself-chat/core/types/$1',
    desc: 'Type definitions'
  }
]

// Named export transformations
const EXPORT_TRANSFORMATIONS = [
  {
    from: 'useAuth',
    to: 'useAuthStore',
    package: '@nself-chat/state'
  }
]

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    dryRun: false,
    verbose: false,
    help: false,
    files: []
  }

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--verbose') {
      options.verbose = true
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

// Apply migration rules to content
function migrateImports(content, filePath) {
  let newContent = content
  const changes = []

  for (const rule of MIGRATION_RULES) {
    const matches = content.match(rule.from)
    if (matches) {
      const replacement = typeof rule.to === 'function'
        ? rule.to
        : rule.to

      newContent = newContent.replace(rule.from, replacement)

      changes.push({
        rule: rule.desc,
        count: matches.length,
        from: rule.from.toString(),
        to: rule.to
      })
    }
  }

  return { newContent, changes }
}

// Process a single file
async function processFile(filePath, options) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const { newContent, changes } = migrateImports(content, filePath)

    if (changes.length > 0) {
      console.log(`\n${filePath}:`)
      for (const change of changes) {
        console.log(`  ✓ ${change.rule}: ${change.count} import(s) updated`)
      }

      if (!options.dryRun) {
        fs.writeFileSync(filePath, newContent, 'utf8')
        console.log(`  📝 File updated`)
      } else {
        console.log(`  📋 [DRY RUN] Changes not applied`)
      }

      return { filePath, changes }
    }

    return null
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
    return null
  }
}

// Main function
async function main() {
  const options = parseArgs()

  if (options.help) {
    console.log(fs.readFileSync(__filename, 'utf8').match(/\/\*\*[\s\S]*?\*\//)[0])
    process.exit(0)
  }

  console.log('🔄 nself-chat Import Migration Tool')
  console.log('====================================\n')

  if (options.dryRun) {
    console.log('📋 DRY RUN MODE - No changes will be applied\n')
  }

  // Expand glob patterns
  const allFiles = []
  for (const pattern of options.files) {
    const matches = await glob(pattern, { ignore: ['node_modules/**', 'dist/**', '.next/**'] })
    allFiles.push(...matches)
  }

  if (allFiles.length === 0) {
    console.log('⚠️  No files found matching the specified patterns')
    process.exit(0)
  }

  console.log(`📁 Processing ${allFiles.length} file(s)...\n`)

  // Process all files
  const results = []
  for (const file of allFiles) {
    const result = await processFile(file, options)
    if (result) {
      results.push(result)
    }
  }

  // Summary
  console.log('\n====================================')
  console.log('📊 Migration Summary')
  console.log('====================================\n')

  if (results.length === 0) {
    console.log('✅ No legacy imports found - all files already use new paths!')
  } else {
    console.log(`✅ ${results.length} file(s) ${options.dryRun ? 'need' : 'have been'} migrated`)

    // Count total changes by type
    const changeCounts = {}
    for (const result of results) {
      for (const change of result.changes) {
        changeCounts[change.rule] = (changeCounts[change.rule] || 0) + change.count
      }
    }

    console.log('\nChanges by type:')
    for (const [rule, count] of Object.entries(changeCounts)) {
      console.log(`  • ${rule}: ${count} import(s)`)
    }

    if (options.dryRun) {
      console.log('\n⚠️  This was a dry run. Re-run without --dry-run to apply changes.')
    }
  }

  process.exit(0)
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { migrateImports, MIGRATION_RULES }
